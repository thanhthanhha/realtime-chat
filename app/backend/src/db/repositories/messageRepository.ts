import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../dynamodb';
import { Message } from '../../types/models';
import { TableNames } from '@/config/table.config';
import Logger from '@/utils/logger';

export class MessageRepository {
  private readonly tableName = TableNames.MESSAGE_TABLE;
  private readonly MODULE = 'MessageRepository';

  constructor() {
    Logger.info(this.MODULE, `Initialized with table name: ${this.tableName}`);
  }

  async createMessage(messageData: Omit<Message, 'id'>): Promise<Message> {
    try {
      const message: Message = {
        id: uuidv4(),
        ...messageData
      };

      Logger.info(this.MODULE, `Creating message with ID: ${message.id}`);

      await dynamoDb.put({
        TableName: this.tableName,
        Item: message
      }).promise();

      Logger.info(this.MODULE, `Successfully created message: ${message.id}`);
      return message;
    } catch (error) {
      Logger.error(
        this.MODULE,
        `Failed to create message for sender ${messageData.sender_id}`,
        error as Error
      );
      throw error;
    }
  }

  async getMessageById(id: string): Promise<Message | null> {
    try {
      Logger.info(this.MODULE, `Fetching message with ID: ${id}`);

      const result = await dynamoDb.get({
        TableName: this.tableName,
        Key: { id }
      }).promise();

      if (!result.Item) {
        Logger.warn(this.MODULE, `Message not found with ID: ${id}`);
        return null;
      }

      Logger.info(this.MODULE, `Successfully retrieved message: ${id}`);
      return result.Item as Message;
    } catch (error) {
      Logger.error(
        this.MODULE,
        `Failed to retrieve message with ID: ${id}`,
        error as Error
      );
      throw error;
    }
  }

  async getMessagesBySenderId(senderId: string): Promise<Message[]> {
    try {
      Logger.info(this.MODULE, `Fetching messages for sender: ${senderId}`);

      const result = await dynamoDb.query({
        TableName: this.tableName,
        IndexName: 'SenderIndex',
        KeyConditionExpression: 'sender_id = :senderId',
        ExpressionAttributeValues: {
          ':senderId': senderId
        }
      }).promise();

      Logger.info(
        this.MODULE,
        `Retrieved ${result.Items?.length || 0} messages for sender: ${senderId}`
      );
      return result.Items as Message[];
    } catch (error) {
      Logger.error(
        this.MODULE,
        `Failed to retrieve messages for sender: ${senderId}`,
        error as Error
      );
      throw error;
    }
  }

  async getMessagesByReceiverId(receiverId: string): Promise<Message[]> {
    try {
      Logger.info(this.MODULE, `Fetching messages for receiver: ${receiverId}`);

      const result = await dynamoDb.query({
        TableName: this.tableName,
        IndexName: 'ReceiverIndex',
        KeyConditionExpression: 'receiver_id = :receiverId',
        ExpressionAttributeValues: {
          ':receiverId': receiverId
        }
      }).promise();

      Logger.info(
        this.MODULE,
        `Retrieved ${result.Items?.length || 0} messages for receiver: ${receiverId}`
      );
      return result.Items as Message[];
    } catch (error) {
      Logger.error(
        this.MODULE,
        `Failed to retrieve messages for receiver: ${receiverId}`,
        error as Error
      );
      throw error;
    }
  }

  async getMessagesByChatroomId(chatroomId: string): Promise<Message[]> {
    try {
      Logger.info(this.MODULE, `Fetching messages for chatroom: ${chatroomId}`);

      const result = await dynamoDb.query({
        TableName: this.tableName,
        IndexName: 'ChatroomIndex',
        KeyConditionExpression: 'chatroom_id = :chatroomId',
        ExpressionAttributeValues: {
          ':chatroomId': chatroomId
        },
        ScanIndexForward: true
      }).promise();

      Logger.info(
        this.MODULE,
        `Retrieved ${result.Items?.length || 0} messages for chatroom: ${chatroomId}`
      );
      return result.Items as Message[];
    } catch (error) {
      Logger.error(
        this.MODULE,
        `Failed to retrieve messages for chatroom: ${chatroomId}`,
        error as Error
      );
      throw error;
    }
  }

  async deleteMessage(id: string): Promise<boolean> {
    try {
      Logger.info(this.MODULE, `Attempting to delete message: ${id}`);

      await dynamoDb.delete({
        TableName: this.tableName,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)'
      }).promise();
      
      Logger.info(this.MODULE, `Successfully deleted message: ${id}`);
      return true;
    } catch (error: any) {
      if (error.code === 'ConditionalCheckFailedException') {
        Logger.warn(this.MODULE, `Message not found for deletion: ${id}`);
        return false;
      }
      
      Logger.error(
        this.MODULE,
        `Failed to delete message: ${id}`,
        error as Error
      );
      throw error;
    }
  }
}