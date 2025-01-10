import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '@/db/dynamodb';
import { Chat } from '@/types/models';

export class ChatRepository {
  private readonly tableName = 'Chats';

  async createChat(chatData: Omit<Chat, 'id'>): Promise<Chat> {
    const chat: Chat = {
      id: uuidv4(),
      ...chatData
    };

    await dynamoDb.put({
      TableName: this.tableName,
      Item: chat
    }).promise();

    return chat;
  }

  async getChatById(id: string): Promise<Chat | null> {
    const result = await dynamoDb.get({
      TableName: this.tableName,
      Key: { id }
    }).promise();

    return result.Item as Chat || null;
  }

  async getChatsByUserId(userId: string): Promise<Chat[]> {
    const result = await dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'ChatOwnerIndex',
      KeyConditionExpression: 'contains(chat_owner, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();

    return result.Items as Chat[];
  }

  async updateChat(id: string, updates: Partial<Chat>): Promise<Chat | null> {
    // First check if chat exists
    const existingChat = await this.getChatById(id);
    if (!existingChat) {
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

      return result.Attributes as Chat;
    } catch (error: any) {
      if (error.code === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  async deleteChat(id: string): Promise<boolean> {
    try {
      await dynamoDb.delete({
        TableName: this.tableName,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)'
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