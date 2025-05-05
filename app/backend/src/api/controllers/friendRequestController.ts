import { Request, Response } from 'express';
import { FriendRequestRepository } from '@/db/repositories/friendRequestRepository';
import { UserRepository } from '@/db/repositories/userRepository';
import Logger from '@/utils/logger';
import { UserController } from '@/api/controllers/userController';

export class FriendRequestController {
  private friendRequestRepository: FriendRequestRepository;
  private userRepository: UserRepository;
  private userController: UserController;
  private readonly MODULE_NAME = 'FriendRequestController';

  constructor() {
    this.friendRequestRepository = new FriendRequestRepository();
    this.userRepository = new UserRepository();
    this.userController = new UserController();

    // Bind all methods to the class instance
    this.createFriendRequest = this.createFriendRequest.bind(this);
    this.getPendingRequests = this.getPendingRequests.bind(this);
    this.getSentRequests = this.getSentRequests.bind(this);
    this.deleteFriendRequest = this.deleteFriendRequest.bind(this);
    this.approveRequest = this.approveRequest.bind(this);
  }

  async createFriendRequest(req: Request, res: Response): Promise<void> {
    try {
      const { sender_id, receiver_id } = req.body;
      Logger.info(
        this.MODULE_NAME, 
        `Attempting to create friend request - Sender: ${sender_id}, Receiver: ${receiver_id}`
      );

      // Validate that both users exist
      const [sender, receiver] = await Promise.all([
        this.userRepository.getUserById(sender_id),
        this.userRepository.getUserById(receiver_id)
      ]);

      if (!sender || !receiver) {
        Logger.warn(
          this.MODULE_NAME, 
          `Failed to create friend request - User(s) not found - Sender exists: ${!!sender}, Receiver exists: ${!!receiver}`
        );
        res.status(404).json({ error: 'One or both users not found' });
        return;
      }

        // Check if they are already friends
        if (sender.friendlist_id.includes(receiver_id) || receiver.friendlist_id.includes(sender_id)) {
          Logger.warn(
            this.MODULE_NAME,
            `Failed to create friend request - Users are already friends - Sender: ${sender_id}, Receiver: ${receiver_id}`
          );
          res.status(400).json({ error: 'Users are already friends' });
          return;
        }
  
      // Check if friend request already exists
      const existingRequests = await this.friendRequestRepository.getFriendRequestsByreceiver_id(receiver_id);
      const duplicateRequest = existingRequests.find(request => request.sender_id === sender_id);

      if (duplicateRequest) {
        Logger.warn(
          this.MODULE_NAME, 
          `Duplicate friend request detected - Sender: ${sender_id}, Receiver: ${receiver_id}`
        );
        res.status(400).json({ error: 'Friend request already exists' });
        return;
      }

      Logger.debug(
        this.MODULE_NAME, 
        `Creating new friend request - Sender: ${sender.name} (${sender_id}), Receiver: ${receiver.name} (${receiver_id})`
      );

      const friendRequest = await this.friendRequestRepository.createFriendRequest({
        sender_id,
        receiver_id,
        sender_name: sender.name,
        approved: false
      });

      Logger.info(
        this.MODULE_NAME, 
        `Friend request created successfully - ID: ${friendRequest.id}`
      );
      res.status(201).json(friendRequest);
    } catch (error) {
      Logger.error(
        this.MODULE_NAME,
        'Failed to create friend request',
        error as Error
      );
      res.status(500).json({ error: 'Failed to create friend request' });
    }
  }

  async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      Logger.info(
        this.MODULE_NAME, 
        `Fetching pending friend requests for user: ${userId}`
      );

      const requests = await this.friendRequestRepository.getFriendRequestsByreceiver_id(userId);


      // Enhance requests with sender user details
      const enhancedRequests = await Promise.all(
        requests.map(async (request) => {
          const senderUser = await this.userRepository.getUserById(request.sender_id);
          return {
            ...request,
            metadata: senderUser
          };
        })
      );
      
      Logger.info(
        this.MODULE_NAME, 
        `Successfully retrieved ${requests.length} pending requests for user: ${userId}`
      );
      res.status(200).json(enhancedRequests);
    } catch (error) {
      Logger.error(
        this.MODULE_NAME,
        `Failed to fetch pending friend requests for user: ${req.params.userId}`,
        error as Error
      );
      res.status(500).json({ error: 'Failed to fetch pending friend requests' });
    }
  }

  async getSentRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      Logger.info(
        this.MODULE_NAME, 
        `Fetching sent friend requests for user: ${userId}`
      );

      const requests = await this.friendRequestRepository.getFriendRequestsBysender_id(userId);
      
      // Enhance requests with sender user details
      const enhancedRequests = await Promise.all(
        requests.map(async (request) => {
          const senderUser = await this.userRepository.getUserById(request.receiver_id);
          return {
            ...request,
            metadata: senderUser
          };
        })
      );
      
      Logger.info(
        this.MODULE_NAME, 
        `Successfully retrieved ${requests.length} pending requests for user: ${userId}`
      );
      res.status(200).json(enhancedRequests);
    } catch (error) {
      Logger.error(
        this.MODULE_NAME,
        `Failed to fetch sent friend requests for user: ${req.params.userId}`,
        error as Error
      );
      res.status(500).json({ error: 'Failed to fetch sent friend requests' });
    }
  }

  async deleteFriendRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId;
      Logger.info(
        this.MODULE_NAME, 
        `Attempting to delete friend request: ${requestId}`
      );

      const success = await this.friendRequestRepository.deleteFriendRequest(requestId);

      if (!success) {
        Logger.warn(
          this.MODULE_NAME, 
          `Friend request not found for deletion: ${requestId}`
        );
        res.status(404).json({ error: 'Friend request not found' });
        return;
      }

      Logger.info(
        this.MODULE_NAME, 
        `Friend request deleted successfully: ${requestId}`
      );
      res.status(200).json({ message: 'Friend request deleted successfully' });
    } catch (error) {
      Logger.error(
        this.MODULE_NAME,
        `Failed to delete friend request: ${req.params.requestId}`,
        error as Error
      );
      res.status(500).json({ error: 'Failed to delete friend request' });
    }
  }

  async approveRequest(req: Request, res: Response): Promise<void> {
    const requestId = req.params.requestId;
    try {
      Logger.info(
        this.MODULE_NAME,
        `Attempting to approve friend request: ${requestId}`
      );
  
      // Get the friend request
      const friendRequest = await this.friendRequestRepository.updateApproveRequest(requestId);
  
      if (!friendRequest) {
        Logger.warn(
          this.MODULE_NAME,
          `Friend request not found for approval: ${requestId}`
        );
        res.status(404).json({ error: 'Friend request not found' });
        return;
      }
      
      //Add friend of sender
      // Create a modified request object to use with addFriend
      const addFriendSenderReq = {
        body: {
          userId: friendRequest.sender_id,
          friendId: friendRequest.receiver_id,
          internal: true
        },
        params: {},
        query: {},
        headers: {},
      } as Request;

      const addFriendRecieverReq = {
        body: {
          userId: friendRequest.receiver_id,
          friendId: friendRequest.sender_id,
          internal: true
        },
        params: {},
        query: {},
        headers: {},
      } as Request;
  
      // Create a new response object to capture the addFriend response
      // Create separate response objects
      const addFriendSenderRes = {
        status: (code: number) => ({
          json: (data: any) => {
            Logger.debug(this.MODULE_NAME, `Sender friend addition response: ${JSON.stringify(data)}`);
            return data;
          }
        })
      } as Response;

      const addFriendReceiverRes = {
        status: (code: number) => ({
          json: (data: any) => {
            Logger.debug(this.MODULE_NAME, `Receiver friend addition response: ${JSON.stringify(data)}`);
            return data;
          }
        })
      } as Response;
  
      // Use the UserController's addFriend method
      await this.userController.addFriend(addFriendSenderReq, addFriendSenderRes);
      await this.userController.addFriend(addFriendRecieverReq, addFriendReceiverRes);

  
      // The friend request has been approved and friends have been added
      Logger.info(
        this.MODULE_NAME,
        `Friend request approved successfully: ${requestId}`
      );
  
      res.status(200).json({
        message: 'Friend request approved successfully',
        friendRequest
      });
  
    } catch (error) {
      Logger.error(
        this.MODULE_NAME,
        `Failed to approve friend request: ${requestId}`,
        error as Error
      );
      res.status(500).json({ error: 'Failed to approve friend request' });
    }
  }
}