import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../dynamodb';
import { User } from '@/types/models';
import { TableNames } from '@/config/table.config';
import Logger from '@/utils/logger';
import { PasswordUtils } from '@/utils/password_utils';

export class UserRepository {
  private readonly tableName = TableNames.USER_TABLE;
  private readonly MODULE_NAME = 'UserRepository';


  constructor() {
    this.createUser = this.createUser.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      const user: User = {
        id: uuidv4(),
        ...userData,
        friendlist_id: []
      };

      if (user.password) {
        const { hash, salt } = await PasswordUtils.hashPassword(user.password);
        user.password = hash;
        user.password_salt = salt;
      }
      
      Logger.info(this.MODULE_NAME, `Creating new user with ID: ${user.id}`);
      Logger.debug(this.MODULE_NAME, `User data: ${JSON.stringify(user)}`);

      await dynamoDb.put({
        TableName: this.tableName,
        Item: user
      }).promise();

      Logger.info(this.MODULE_NAME, `Successfully created user: ${user.id}`);
      return user;
    } catch (error) {
      Logger.error(this.MODULE_NAME, 'Failed to create user in database', error as Error);
      throw new Error('Failed to create user in database');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      Logger.info(this.MODULE_NAME, 'Fetching all users from database');
      
      const result = await dynamoDb.scan({
        TableName: this.tableName
      }).promise();
      
      // Remove password and password_salt fields from all users
      const sanitizedUsers = (result.Items || []).map(user => {
        const sanitizedUser = { ...user };
        delete sanitizedUser.password;
        delete sanitizedUser.password_salt;
        return sanitizedUser;
      });
      
      Logger.info(this.MODULE_NAME, `Successfully retrieved ${sanitizedUsers.length} users`);
      return sanitizedUsers as User[];
    } catch (error) {
      Logger.error(this.MODULE_NAME, 'Failed to retrieve all users from database', error as Error);
      throw new Error('Failed to retrieve users from database');
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      Logger.info(this.MODULE_NAME, `Fetching user with ID: ${id}`);

      const result = await dynamoDb.get({
        TableName: this.tableName,
        Key: { id }
      }).promise();

      if (!result.Item) {
        Logger.warn(this.MODULE_NAME, `User not found with ID: ${id}`);
        return null;
      }

      Logger.info(this.MODULE_NAME, `Successfully retrieved user: ${id}`);
      return result.Item as User;
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to retrieve user with ID: ${id}`, error as Error);
      throw new Error('Failed to retrieve user from database');
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      Logger.info(this.MODULE_NAME, `Updating user with ID: ${id}`);
      Logger.debug(this.MODULE_NAME, `Update data: ${JSON.stringify(updates)}`);

      // First check if user exists
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        Logger.warn(this.MODULE_NAME, `Update failed: User not found with ID: ${id}`);
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
          ConditionExpression: 'attribute_exists(id)'
        }).promise();

        Logger.info(this.MODULE_NAME, `Successfully updated user: ${id}`);
        return result.Attributes as User;
      } catch (error: any) {
        if (error.code === 'ConditionalCheckFailedException') {
          Logger.warn(this.MODULE_NAME, `Update failed: User not found with ID: ${id}`);
          return null;
        }
        throw error;
      }
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to update user with ID: ${id}`, error as Error);
      throw new Error('Failed to update user in database');
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<User | null> {
    try {
      Logger.info(this.MODULE_NAME, `Updating password for user with ID: ${userId}`);
      
      // Hash the new password
      const { hash, salt } = await PasswordUtils.hashPassword(newPassword);
      
      // Update user with new password hash and salt
      const updatedUser = await this.updateUser(userId, {
        password: hash,
        password_salt: salt
      });

      if (!updatedUser) {
        Logger.warn(this.MODULE_NAME, `Password update failed: User not found with ID: ${userId}`);
        return null;
      }

      Logger.info(this.MODULE_NAME, `Successfully updated password for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to update password for user with ID: ${userId}`, error as Error);
      throw new Error('Failed to update user password in database');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      Logger.info(this.MODULE_NAME, `Fetching user with email: ${email}`);

      const result = await dynamoDb.query({
        TableName: this.tableName,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      }).promise();

      if (!result.Items || result.Items.length === 0) {
        Logger.warn(this.MODULE_NAME, `User not found with email: ${email}`);
        return null;
      }

      Logger.info(this.MODULE_NAME, `Successfully retrieved user with email: ${email}`);
      return result.Items[0] as User;
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to retrieve user with email: ${email}`, error as Error);
      throw new Error('Failed to retrieve user from database');
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      Logger.info(this.MODULE_NAME, `Attempting to delete user with ID: ${id}`);

      try {
        await dynamoDb.delete({
          TableName: this.tableName,
          Key: { id },
          ConditionExpression: 'attribute_exists(id)'
        }).promise();
        
        Logger.info(this.MODULE_NAME, `Successfully deleted user: ${id}`);
        return true;
      } catch (error: any) {
        if (error.code === 'ConditionalCheckFailedException') {
          Logger.warn(this.MODULE_NAME, `Delete failed: User not found with ID: ${id}`);
          return false;
        }
        throw error;
      }
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to delete user with ID: ${id}`, error as Error);
      throw new Error('Failed to delete user from database');
    }
  }
}