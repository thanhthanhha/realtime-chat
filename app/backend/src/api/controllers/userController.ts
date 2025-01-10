import { Request, Response } from 'express';
import { UserRepository } from '@/db/repositories/userRepository';


export class UserController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userRepository.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userRepository.getUserById(req.params.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove id from updates if it exists to prevent id modification
      delete updates.id;

      const updatedUser = await this.userRepository.updateUser(id, updates);
      
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.userRepository.deleteUser(id);

      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  //Friends Operations

  async addFriend(req: Request, res: Response): Promise<void> {
    try {
      const { userId, friendId } = req.body;

      // Check if both users exist
      const [user, friend] = await Promise.all([
        this.userRepository.getUserById(userId),
        this.userRepository.getUserById(friendId)
      ]);

      if (!user || !friend) {
        res.status(404).json({ error: 'User or friend not found' });
        return;
      }

      // Check if friend is already in the friendlist
      if (user.friendlist_id.includes(friendId)) {
        res.status(400).json({ error: 'Friend already added' });
        return;
      }

      // Add friend to user's friendlist
      const updatedUser = await this.userRepository.updateUser(userId, {
        friendlist_id: [...user.friendlist_id, friendId]
      });

      if (!updatedUser) {
        res.status(500).json({ error: 'Failed to update friendlist' });
        return;
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add friend' });
    }
  }

  async removeFriend(req: Request, res: Response): Promise<void> {
    try {
      const { userId, friendId } = req.body;

      // Check if user exists
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if friend is in the friendlist
      if (!user.friendlist_id.includes(friendId)) {
        res.status(400).json({ error: 'Friend not found in friendlist' });
        return;
      }

      // Remove friend from user's friendlist
      const updatedUser = await this.userRepository.updateUser(userId, {
        friendlist_id: user.friendlist_id.filter((id: string) => id !== friendId)
      });

      if (!updatedUser) {
        res.status(500).json({ error: 'Failed to update friendlist' });
        return;
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove friend' });
    }
  }

  async getFriendlist(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;

      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Fetch all friends' details
      const friendPromises = user.friendlist_id.map((friendId: string) => 
        this.userRepository.getUserById(friendId)
      );
      const friends = await Promise.all(friendPromises);

      // Filter out any null values (in case some friends were deleted)
      const validFriends = friends.filter(friend => friend !== null);

      res.json(validFriends);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get friendlist' });
    }
  }
}
