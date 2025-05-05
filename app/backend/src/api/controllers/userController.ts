import { Request, Response } from 'express';
import { UserRepository } from '@/db/repositories/userRepository';
import Logger from '@/utils/logger';
import { isValidEmail } from '@/utils/validation';

export class UserController {
  private userRepository: UserRepository;
  private readonly MODULE_NAME = 'UserController';

  constructor() {
    this.userRepository = new UserRepository();

    // Bind all methods to preserve 'this' context
    this.createUser = this.createUser.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.addFriend = this.addFriend.bind(this);
    this.removeFriend = this.removeFriend.bind(this);
    this.getFriendlist = this.getFriendlist.bind(this);
    this.updateUserPassword = this.updateUserPassword.bind(this);
    this.getUserByEmail = this.getUserByEmail.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      Logger.info(this.MODULE_NAME, 'Creating new user');
      Logger.debug(this.MODULE_NAME, `Request body: ${JSON.stringify(req.body)}`);
      
      const { email } = req.body;
      // Check if email already exists
      const existingUser = await this.userRepository.getUserByEmail(email);
      if (existingUser) {
        Logger.warn(this.MODULE_NAME, `Email ${email} is already in use`);
        res.status(400).json({ error: 'Email has already been used' });
        return;
      }
      
      const user = await this.userRepository.createUser(req.body);
      Logger.info(this.MODULE_NAME, `User created successfully with ID: ${user.id}`);
      
      res.status(201).json(user);
    } catch (error) {
      Logger.error(this.MODULE_NAME, 'Failed to create user', error as Error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      //update
      Logger.info(this.MODULE_NAME, 'Fetching all users');
      
      const users = await this.userRepository.getAllUsers();
      
      Logger.info(this.MODULE_NAME, `Successfully retrieved ${users.length} users`);
      res.json(users);
    } catch (error) {
      Logger.error(this.MODULE_NAME, 'Failed to get all users', error as Error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      Logger.info(this.MODULE_NAME, `Fetching user with ID: ${userId}`);
      
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        Logger.warn(this.MODULE_NAME, `User not found with ID: ${userId}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully retrieved user: ${userId}`);
      res.json(user);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to get user with ID: ${req.params.id}`, error as Error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const email = req.params.email;
      Logger.info(this.MODULE_NAME, `Fetching user with email: ${email}`);
      if (!isValidEmail(email)) {
        Logger.warn(this.MODULE_NAME, `Email not in correct format: ${email}`);
        res.status(404).json({ error: 'Email not in correct format' });
        return;
      }
      
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        Logger.warn(this.MODULE_NAME, `User not found with ID: ${email}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully retrieved user: ${email}`);
      res.json(user);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to get user with ID: ${req.params.id}`, error as Error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      Logger.info(this.MODULE_NAME, `Updating user with ID: ${id}`);
      Logger.debug(this.MODULE_NAME, `Update data: ${JSON.stringify(req.body)}`);

      const updates = req.body;
      delete updates.id;

      const updatedUser = await this.userRepository.updateUser(id, updates);
      
      if (!updatedUser) {
        Logger.warn(this.MODULE_NAME, `User not found for update with ID: ${id}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully updated user: ${id}`);
      res.json(updatedUser);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Error updating user with ID: ${req.params.id}`, error as Error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async updateUserPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      Logger.info(this.MODULE_NAME, `Updating user password with ID: ${id}`);

      const password = req.body.password;

      const updatedUser = await this.userRepository.updatePassword(id, password);
      
      if (!updatedUser) {
        Logger.warn(this.MODULE_NAME, `User to update password not found for update with ID: ${id}`);
        res.status(404).json({ error: 'User to update password not found' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully updated user password: ${id}`);
      res.json(updatedUser);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Error updating user password with ID: ${req.params.id}`, error as Error);
      res.status(500).json({ error: 'Failed to update user password' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      Logger.info(this.MODULE_NAME, `Attempting to delete user with ID: ${id}`);

      const deleted = await this.userRepository.deleteUser(id);

      if (!deleted) {
        Logger.warn(this.MODULE_NAME, `User not found for deletion with ID: ${id}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully deleted user: ${id}`);
      res.status(204).send();
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Error deleting user with ID: ${req.params.id}`, error as Error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  async addFriend(req: Request, res: Response): Promise<void> {
    try {
      const { userId, friendId, internal = false } = req.body; 
      Logger.info(this.MODULE_NAME, `Adding friend ${friendId} to user ${userId}`);

      // Check if both users exist
      const [user, friend] = await Promise.all([
        this.userRepository.getUserById(userId),
        this.userRepository.getUserById(friendId)
      ]);

      if (!user || !friend) {
        Logger.warn(this.MODULE_NAME, `User or friend not found: userId=${userId}, friendId=${friendId}`);
        res.status(404).json({ error: 'User or friend not found' });
        return;
      }

      // Check if friend is already in the friendlist
      if (user.friendlist_id.includes(friendId)) {
        Logger.warn(this.MODULE_NAME, `Friend ${friendId} already in user ${userId}'s friendlist`);
        res.status(400).json({ error: 'Friend already added' });
        return;
      }

      // Add friend to user's friendlist
      const updatedUser = await this.userRepository.updateUser(userId, {
        friendlist_id: [...user.friendlist_id, friendId]
      });

      if (!updatedUser) {
        Logger.error(this.MODULE_NAME, `Failed to update friendlist for user ${userId}`);
        res.status(500).json({ error: 'Failed to update friendlist' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully added friend ${friendId} to user ${userId}`);
      if (!internal) {
        res.json(updatedUser);
      }
    } catch (error) {
      Logger.error(this.MODULE_NAME, 'Failed to add friend', error as Error);
      res.status(500).json({ error: 'Failed to add friend' });
    }
  }

  async removeFriend(req: Request, res: Response): Promise<void> {
    try {
      const { userId, friendId } = req.body;
      Logger.info(this.MODULE_NAME, `Removing friend ${friendId} from user ${userId}`);

      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        Logger.warn(this.MODULE_NAME, `User not found: ${userId}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!user.friendlist_id.includes(friendId)) {
        Logger.warn(this.MODULE_NAME, `Friend ${friendId} not found in user ${userId}'s friendlist`);
        res.status(400).json({ error: 'Friend not found in friendlist' });
        return;
      }

      const updatedUser = await this.userRepository.updateUser(userId, {
        friendlist_id: user.friendlist_id.filter((id: string) => id !== friendId)
      });

      if (!updatedUser) {
        Logger.error(this.MODULE_NAME, `Failed to update friendlist for user ${userId}`);
        res.status(500).json({ error: 'Failed to update friendlist' });
        return;
      }

      Logger.info(this.MODULE_NAME, `Successfully removed friend ${friendId} from user ${userId}`);
      res.json(updatedUser);
    } catch (error) {
      Logger.error(this.MODULE_NAME, 'Failed to remove friend', error as Error);
      res.status(500).json({ error: 'Failed to remove friend' });
    }
  }

  async getFriendlist(req: Request, res: Response): Promise<void> {
    try {
      const { id: userId } = req.params;
      Logger.info(this.MODULE_NAME, `Fetching friendlist for user ${userId}`);

      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        Logger.warn(this.MODULE_NAME, `User not found: ${userId}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      Logger.debug(this.MODULE_NAME, `Found ${user.friendlist_id.length} friends for user ${userId}`);
      
      const friendPromises = user.friendlist_id.map((friendId: string) => 
        this.userRepository.getUserById(friendId)
      );
      const friends = await Promise.all(friendPromises);
      const validFriends = friends.filter(friend => friend !== null).map(friend => {
        const sanitizedFriend = { ...friend };
        delete sanitizedFriend.password;
        delete sanitizedFriend.password_salt;
        return sanitizedFriend;
      });

      Logger.info(this.MODULE_NAME, `Successfully retrieved ${validFriends.length} valid friends for user ${userId}`);
      res.json(validFriends);
    } catch (error) {
      Logger.error(this.MODULE_NAME, `Failed to get friendlist for user ${req.params.id}`, error as Error);
      res.status(500).json({ error: 'Failed to get friendlist' });
    }
  }
}