import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../dynamodb';
import { User } from '@/types/models';

export class UserRepository {
  private readonly tableName = 'Users';

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      ...userData,
      friendlist_id: []
    };

    await dynamoDb.put({
      TableName: this.tableName,
      Item: user
    }).promise();

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await dynamoDb.get({
      TableName: this.tableName,
      Key: { id }
    }).promise();

    return result.Item as User || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    // First check if user exists
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return null;
    }

    const updateExpression = Object.keys(updates)
      .map((key) => `#${key} = :${key}`)
      .join(', ');

    const expressionAttributeNames = Object.keys(updates).reduce((acc, key) => ({
      ...acc,
      [`#${key}`]: key
    }), {});

    const expressionAttributeValues = Object.entries(updates).reduce((acc, [key, value]) => ({
      ...acc,
      [`:${key}`]: value
    }), {});

    try {
      const result = await dynamoDb.update({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(id)' // Ensure the item exists
      }).promise();

      return result.Attributes as User;
    } catch (error: any) {
      if (error.code === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await dynamoDb.delete({
        TableName: this.tableName,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)' // Ensure the item exists before deletion
      }).promise();
      
      return true;
    } catch (error: any) {
      if (error.code === 'ConditionalCheckFailedException') {
        return false;
      }
      throw error;
    }
  }

}
