import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../dynamodb';
import { FriendRequest } from '@/types/models';

export class FriendRequestRepository {
  private readonly tableName = 'FriendRequests';

  async createFriendRequest(friendRequestData: Omit<FriendRequest, 'id'>): Promise<FriendRequest> {
    const friendRequest: FriendRequest = {
      id: uuidv4(),
      ...friendRequestData
    };

    await dynamoDb.put({
      TableName: this.tableName,
      Item: friendRequest
    }).promise();

    return friendRequest;
  }

  async getFriendRequestById(id: string): Promise<FriendRequest | null> {
    const result = await dynamoDb.get({
      TableName: this.tableName,
      Key: { id }
    }).promise();

    return result.Item as FriendRequest || null;
  }

  async getFriendRequestsByReceiverId(receiverId: string): Promise<FriendRequest[]> {
    const result = await dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'ReceiverIndex',
      KeyConditionExpression: 'receiverId = :receiverId',
      ExpressionAttributeValues: {
        ':receiverId': receiverId
      }
    }).promise();

    return result.Items as FriendRequest[];
  }

  async getFriendRequestsBySenderId(senderId: string): Promise<FriendRequest[]> {
    const result = await dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'SenderIndex',
      KeyConditionExpression: 'senderId = :senderId',
      ExpressionAttributeValues: {
        ':senderId': senderId
      }
    }).promise();

    return result.Items as FriendRequest[];
  }

  async deleteFriendRequest(id: string): Promise<boolean> {
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