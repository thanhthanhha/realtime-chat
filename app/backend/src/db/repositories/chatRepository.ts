import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '@/db/dynamodb';
import { Chat } from '@/types/models';
import { TableNames } from '@/config/table.config';
import Logger from '@/utils/logger';

export class ChatRepository {
  private readonly tableName = TableNames.CHAT_TABLE;
  private readonly MODULE_NAME = 'ChatRepository';

  async createChat(chatData: Omit<Chat, 'id'>): Promise<Chat> {
    try {
      Logger.info(this.MODULE_NAME, `Creating new chat with owner: ${chatData.chat_owner}`);
      
      const chat: Chat = {
        id: uuidv4(),
        ...chatData
      };

      await dynamoDb.put({
        TableName: this.tableName,
        Item: chat
      }).promise();

      Logger.info(this.MODULE_NAME, `Successfully created chat with ID: ${chat.id}`);
      return chat;
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to create chat: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async getChatById(id: string): Promise<Chat | null> {
    try {
      Logger.info(this.MODULE_NAME, `Retrieving chat with ID: ${id}`);
      
      const result = await dynamoDb.get({
        TableName: this.tableName,
        Key: { id }
      }).promise();

      if (!result.Item) {
        Logger.warn(this.MODULE_NAME, `Chat not found with ID: ${id}`);
        return null;
      }

      Logger.info(this.MODULE_NAME, `Successfully retrieved chat with ID: ${id}`);
      return result.Item as Chat;
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to get chat by ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async getChatsByUserId(user_id: string): Promise<Chat[]> {
    try {
      Logger.info(this.MODULE_NAME, `Retrieving chats for user ID: ${user_id}`);
      
      const result = await dynamoDb.query({
        TableName: this.tableName,
        IndexName: 'ChatOwnerIndex',
        KeyConditionExpression: 'chat_owner = :user_id',
        ExpressionAttributeValues: {
          ':user_id': user_id
        }
      }).promise();

      Logger.info(this.MODULE_NAME, `Found ${result.Items?.length || 0} chats for user ID: ${user_id}`);
      return result.Items as Chat[];
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to get chats for user ID ${user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async updateChat(id: string, updates: Partial<Chat>): Promise<Chat | null> {
    try {
      Logger.info(this.MODULE_NAME, `Attempting to update chat with ID: ${id}`);
      
      // First check if chat exists
      const existingChat = await this.getChatById(id);
      if (!existingChat) {
        Logger.warn(this.MODULE_NAME, `Cannot update - chat not found with ID: ${id}`);
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

      const result = await dynamoDb.update({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(id)'
      }).promise();

      Logger.info(this.MODULE_NAME, `Successfully updated chat with ID: ${id}`);
      return result.Attributes as Chat;
    } catch (error: any) {
      if (error.code === 'ConditionalCheckFailedException') {
        Logger.warn(this.MODULE_NAME, `Conditional check failed while updating chat ID: ${id}`);
        return null;
      }
      Logger.error(this.MODULE_NAME, `Failed to update chat ${id}: ${error.message}`, error);
      throw error;
    }
  }

  async deleteChat(id: string): Promise<boolean> {
    try {
      Logger.info(this.MODULE_NAME, `Attempting to delete chat with ID: ${id}`);
      
      await dynamoDb.delete({
        TableName: this.tableName,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)'
      }).promise();
      
      Logger.info(this.MODULE_NAME, `Successfully deleted chat with ID: ${id}`);
      return true;
    } catch (error: any) {
      if (error.code === 'ConditionalCheckFailedException') {
        Logger.warn(this.MODULE_NAME, `Cannot delete - chat not found with ID: ${id}`);
        return false;
      }
      Logger.error(this.MODULE_NAME, `Failed to delete chat ${id}: ${error.message}`, error);
      throw error;
    }
  }

  async getChatsByParticipantId(participantId: string): Promise<Chat[]> {
    try {
      Logger.info(this.MODULE_NAME, `Retrieving chats for participant ID: ${participantId}`);
      
      const result = await dynamoDb.scan({
        TableName: this.tableName,
        FilterExpression: 'contains(participants, :participantId)',
        ExpressionAttributeValues: {
          ':participantId': participantId
        }
      }).promise();

      Logger.info(this.MODULE_NAME, `Found ${result.Items?.length || 0} chats for participant ID: ${participantId}`);
      return result.Items as Chat[];
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to get chats for participant ID ${participantId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async addParticipantToChat(chatId: string, participantId: string): Promise<Chat | null> {
    try {
      Logger.info(this.MODULE_NAME, `Attempting to add participant ${participantId} to chat ${chatId}`);
      // Validate UUID v4 format
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidV4Regex.test(participantId)) {
        Logger.warn(this.MODULE_NAME, `Invalid participant ID format: ${participantId}. Expected UUID v4 format.`);
        throw new Error('Invalid participant ID format. Expected UUID v4 format.');
      }
      
      const chat = await this.getChatById(chatId);
      
      if (!chat) {
        Logger.warn(this.MODULE_NAME, `Cannot add participant - chat not found with ID: ${chatId}`);
        return null;
      }

      // Check if participant already exists in the chat
      if (chat.participants.includes(participantId)) {
        Logger.info(this.MODULE_NAME, `Participant ${participantId} is already in chat ${chatId}`);
        return chat;
      }

      // Add new participant to the existing participants array
      const updatedParticipants = [...chat.participants, participantId];
      
      const updatedChat = await this.updateChat(chatId, {
        participants: updatedParticipants
      });

      Logger.info(this.MODULE_NAME, `Successfully added participant ${participantId} to chat ${chatId}`);
      return updatedChat;
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to add participant ${participantId} to chat ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async addMessageToChat(chatId: string, messageId: string): Promise<Chat | null> {
    try {
      Logger.info(this.MODULE_NAME, `Adding message ${messageId} to chat ${chatId}`);
      
      const chat = await this.getChatById(chatId);
      if (!chat) {
        Logger.warn(this.MODULE_NAME, `Cannot add message - chat not found with ID: ${chatId}`);
        return null;
      }

      // Initialize messages array if it doesn't exist
      const currentMessages = chat.messages || [];
      
      // Check if message already exists in the chat
      if (currentMessages.includes(messageId)) {
        Logger.info(this.MODULE_NAME, `Message ${messageId} is already in chat ${chatId}`);
        return chat;
      }

      // Add new message to the existing messages array
      const updatedMessages = [...currentMessages, messageId];
      
      const updatedChat = await this.updateChat(chatId, {
        messages: updatedMessages
      });

      Logger.info(this.MODULE_NAME, `Successfully added message ${messageId} to chat ${chatId}`);
      return updatedChat;
    } catch (error) {
      Logger.error(
        this.MODULE_NAME, 
        `Failed to add message ${messageId} to chat ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }
}