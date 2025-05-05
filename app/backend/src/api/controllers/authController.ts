import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@/db/repositories/userRepository';
import { PasswordUtils } from '@/utils/password_utils';
import { LoginCredentials, AuthResponse } from '@/types/auth';
import Logger from '@/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, always use environment variable

export class AuthController {
  private userRepository: UserRepository;
  private readonly MODULE_NAME = 'AuthController';

  constructor() {
    this.userRepository = new UserRepository();
    this.login = this.login.bind(this);
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginCredentials = req.body;
      Logger.info(this.MODULE_NAME, `Login attempt for email: ${email}`);

      // Get user by email
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        Logger.warn(this.MODULE_NAME, `Login failed: User not found for email: ${email}`);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      let isValid = false
      if (user && user.password && user.password_salt) {
        isValid = await PasswordUtils.verifyPassword(
            password,
            user.password,
            user.password_salt
          );
      } else if (user && !user.password) {
        isValid = true
      }


      if (!isValid) {
        Logger.warn(this.MODULE_NAME, `Login failed: Invalid password for email: ${email}`);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response: AuthResponse = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      };

      Logger.info(this.MODULE_NAME, `Login successful for user: ${user.id}`);
      res.json(response);
    } catch (error) {
      Logger.error(this.MODULE_NAME, 'Login failed', error as Error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
}