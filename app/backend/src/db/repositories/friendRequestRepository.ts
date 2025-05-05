import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../dynamodb';
import { FriendRequest } from '@/types/models';
import { TableNames } from '@/config/table.config';
import Logger from '@/utils/logger';

export class FriendRequestRepository {
  private readonly tableName = TableNames.FRIEND_REQUEST_TABLE;
  private readonly MODULE_NAME = 'FriendRequestRepository';

  async createFriendRequest(requestData: Omit<FriendRequest, 'id'>): Promise<FriendRequest> {
    try {
      Logger.info(this.MODULE_NAME, `Creating friend request from ${requestData.sender_id} to ${requestData.receiver_id}`);
      
      const friendRequest: FriendRequest = {
        id: uuidv4(),
        ...requestData
      };

      await dynamoDb.put({
        TableName: this.tableName,
        Item: friendRequest
      }).promise();

      Logger.info(this.MODULE_NAME, `Successfully created friend request with ID: ${friendRequest.id}`);
      return friendRequest;
    } catch (error) {
      Logger.error(
        this.MODULE_NAME,
        `Failed to create friend request from ${requestData.sender_id} to ${requestData.receiver_id}`,
        error as Error
      );
      throw error;
    }
  }

  async getFriendRequestsByreceiver_id(receiver_id: string): Promise<FriendRequest[]> {
    try {
      Logger.info(this.MODULE_NAME, `Fetching friend requests for receiver: ${receiver_id}`);

      const result = await dynamoDb.query({
        TableName: this.tableName,
        IndexName: 'ReceiverIndex',
        KeyConditionExpression: 'receiver_id = :receiver_id',
        ExpressionAttributeValues: {
          ':receiver_id': receiver_id
        }
      }).promise();

      Logger.info(this.MODULE_NAME, `Successfully retrieved ${result.Items?.length || 0} friend requests for receiver: ${receiver_id}`);
      return (result.Items || []) as FriendRequest[];
    } catch (error) {
      Logger.error(
        this.MODULE_NAME,
        `Failed to fetch friend requests for receiver: ${receiver_id}`,
        error as Error
      );
      throw error;
    }
  }

  async getFriendRequestsBysender_id(sender_id: string): Promise<FriendRequest[]> {
    try {
      Logger.info(this.MODULE_NAME, `Fetching friend requests from sender: ${sender_id}`);

      const result = await dynamoDb.query({
        TableName: this.tableName,
        IndexName: 'SenderIndex',
        KeyConditionExpression: 'sender_id = :sender_id',
        ExpressionAttributeValues: {
          ':sender_id': sender_id
        }
      }).promise();

      Logger.info(this.MODULE_NAME, `Successfully retrieved ${result.Items?.length || 0} friend requests from sender: ${sender_id}`);
      return (result.Items || []) as FriendRequest[];
    } catch (error) {
      Logger.error(
        this.MODULE_NAME,
        `Failed to fetch friend requests from sender: ${sender_id}`,
        error as Error
      );
      throw error;
    }
  }

  async deleteFriendRequest(requestId: string): Promise<boolean> {
    try {
      Logger.info(this.MODULE_NAME, `Attempting to delete friend request: ${requestId}`);

      await dynamoDb.delete({
        TableName: this.tableName,
        Key: { id: requestId },
        ConditionExpression: 'attribute_exists(id)'
      }).promise();

      Logger.info(this.MODULE_NAME, `Successfully deleted friend request: ${requestId}`);
      return true;
    } catch (error) {
      if ((error as any).code === 'ConditionalCheckFailedException') {
        Logger.warn(this.MODULE_NAME, `Friend request not found: ${requestId}`);
        return false;
      }
      
      Logger.error(
        this.MODULE_NAME,
        `Failed to delete friend request: ${requestId}`,
        error as Error
      );
      throw error;
    }
  }

  async updateApproveRequest(requestId: string): Promise<FriendRequest | null> {
    try {
      Logger.info(this.MODULE_NAME, `Attempting to approve friend request: ${requestId}`);

      // Update the approved status
      const updateResult = await dynamoDb.update({
        TableName: this.tableName,
        Key: { id: requestId },
        UpdateExpression: 'SET approved = :approved',
        ExpressionAttributeValues: {
          ':approved': true
        },
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(id)'
      }).promise();

      if (!updateResult.Attributes) {
        Logger.warn(this.MODULE_NAME, `No attributes returned after updating friend request: ${requestId}`);
        return null;
      }

      Logger.info(this.MODULE_NAME, `Successfully approved friend request: ${requestId}`);
      return updateResult.Attributes as FriendRequest;
    } catch (error) {
      if ((error as any).code === 'ConditionalCheckFailedException') {
        Logger.warn(this.MODULE_NAME, `Friend request not found for approval: ${requestId}`);
        return null;
      }
      
      Logger.error(
        this.MODULE_NAME,
        `Failed to approve friend request: ${requestId}`,
        error as Error
      );
      throw error;
    }
  }
}