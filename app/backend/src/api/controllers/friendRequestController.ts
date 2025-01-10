import { Request, Response } from 'express';
import { FriendRequestRepository } from '@/db/repositories/friendRequestRepository';
import { UserRepository } from '@/db/repositories/userRepository';

export class FriendRequestController {
  private friendRequestRepository: FriendRequestRepository;
  private userRepository: UserRepository;

  constructor() {
    this.friendRequestRepository = new FriendRequestRepository();
    this.userRepository = new UserRepository();
  }

  async createFriendRequest(req: Request, res: Response): Promise<void> {
    try {
      const { senderId, receiverId } = req.body;

      // Validate that both users exist
      const [sender, receiver] = await Promise.all([
        this.userRepository.getUserById(senderId),
        this.userRepository.getUserById(receiverId)
      ]);

      if (!sender || !receiver) {
        res.status(404).json({ error: 'One or both users not found' });
        return;
      }

      // Check if friend request already exists
      const existingRequests = await this.friendRequestRepository.getFriendRequestsByReceiverId(receiverId);
      const duplicateRequest = existingRequests.find(request => request.senderId === senderId);

      if (duplicateRequest) {
        res.status(400).json({ error: 'Friend request already exists' });
        return;
      }

      const friendRequest = await this.friendRequestRepository.createFriendRequest({
        senderId,
        receiverId
      });

      res.status(201).json(friendRequest);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create friend request' });
    }
  };

  async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const requests = await this.friendRequestRepository.getFriendRequestsByReceiverId(userId);
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pending friend requests' });
    }
  };

  async getSentRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const requests = await this.friendRequestRepository.getFriendRequestsBySenderId(userId);
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sent friend requests' });
    }
  };

  async deleteFriendRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId;
      const success = await this.friendRequestRepository.deleteFriendRequest(requestId);

      if (!success) {
        res.status(404).json({ error: 'Friend request not found' });
        return;
      }

      res.status(200).json({ message: 'Friend request deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete friend request' });
    }
  };
}