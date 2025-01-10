import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../dynamodb';
import { Message } from '../../types/models';

export class MessageRepository {
  private readonly tableName = 'Messages';

  async createMessage(messageData: Omit<Message, 'id'>): Promise<Message> {
    const message: Message = {
      id: uuidv4(),
      ...messageData
    };

    await dynamoDb.put({
      TableName: this.tableName,
      Item: message
    }).promise();

    return message;
  }

  async getMessageById(id: string): Promise<Message | null> {
    const result = await dynamoDb.get({
      TableName: this.tableName,
      Key: { id }
    }).promise();

    return result.Item as Message || null;
  }

  async getMessagesBySenderId(senderId: string): Promise<Message[]> {
    const result = await dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'SenderIdIndex',
      KeyConditionExpression: 'senderId = :senderId',
      ExpressionAttributeValues: {
        ':senderId': senderId
      }
    }).promise();

    return result.Items as Message[];
  }

  async getMessagesByReceiverId(receiverId: string): Promise<Message[]> {
    const result = await dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'ReceiverIndex',
      KeyConditionExpression: 'receiverId = :receiverId',
      ExpressionAttributeValues: {
        ':receiverId': receiverId
      }
    }).promise();

    return result.Items as Message[];
  }

  async getMessagesByChatroomId(chatroomId: string): Promise<Message[]> {
    const result = await dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'ChatroomIndex',
      KeyConditionExpression: 'chatroomId = :chatroomId',
      ExpressionAttributeValues: {
        ':chatroomId': chatroomId
      }
    }).promise();

    return result.Items as Message[];
  }

  async deleteMessage(id: string): Promise<boolean> {
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