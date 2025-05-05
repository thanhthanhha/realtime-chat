import crypto from 'crypto';
import Logger from '@/utils/logger';

const MODULE_NAME = 'PasswordUtils';

export class PasswordUtils {
  private static readonly SALT_LENGTH = 32;
  private static readonly HASH_ITERATIONS = 10000;
  private static readonly HASH_LENGTH = 64;
  private static readonly HASH_ALGORITHM = 'sha512';

  /**
   * Generates a random salt for password hashing
   */
  static generateSalt(): string {
    return crypto.randomBytes(this.SALT_LENGTH).toString('hex');
  }

  /**
   * Hashes a password using SHA-512 with salt
   * @param password Plain text password
   * @param salt Optional salt (generates new if not provided)
   */
  static async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    try {
      const useSalt = salt || this.generateSalt();
      
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(
          password,
          useSalt,
          this.HASH_ITERATIONS,
          this.HASH_LENGTH,
          this.HASH_ALGORITHM,
          (err, derivedKey) => {
            if (err) {
              Logger.error(MODULE_NAME, 'Error hashing password', err);
              reject(err);
            } else {
              resolve({
                hash: derivedKey.toString('hex'),
                salt: useSalt
              });
            }
          }
        );
      });
    } catch (error) {
      Logger.error(MODULE_NAME, 'Failed to hash password', error as Error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verifies a password against a stored hash
   * @param password Plain text password to verify
   * @param storedHash Stored hash to compare against
   * @param storedSalt Salt used for the stored hash
   */
  static async verifyPassword(
    password: string,
    storedHash: string,
    storedSalt: string
  ): Promise<boolean> {
    try {
      const { hash } = await this.hashPassword(password, storedSalt);
      return hash === storedHash;
    } catch (error) {
      Logger.error(MODULE_NAME, 'Failed to verify password', error as Error);
      throw new Error('Password verification failed');
    }
  }
}
