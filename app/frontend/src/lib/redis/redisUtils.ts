// lib/redis/redisUtils.ts
import logger from '@/lib/logger';
import redis from './client'; // Import the singleton instance
import { getUserId } from '@/lib/buttonactions'

// Default expiration time for cached users (in seconds)
const USER_CACHE_EXPIRY = 60 * 60; // 1 hour

/**
 * Fetch user data from Redis or API if not in cache
 * @param userId User ID to fetch
 * @returns User object or null
 */
export async function getUserFromCache(userId: string): Promise<User | null> {
  try {
    // Try to get user from Redis
    const cachedUser = await redis.get(`user:${userId}`);
    
    if (cachedUser) {
      logger.debug('Redis', `User ${userId} found in cache`);
      return JSON.parse(cachedUser) as User;
    }
    
    // If not in Redis, fetch from API and cache
    logger.info('Redis', `User ${userId} not found in cache, fetching from API`);
    return await fetchAndCacheUser(userId);
  } catch (error) {
    logger.error('Redis', `Error fetching user from cache: ${error}`);
    return null;
  }
}

/**
 * Fetch user from API and save to Redis cache
 * @param userId User ID to fetch
 * @returns User object or null
 */
export async function fetchAndCacheUser(userId: string): Promise<User | null> {
  try {
    // Fetch user from API
    const user = await getUserId(userId);
    
    if (!user) {
      logger.warn('Redis', `User ${userId} not found in API`);
      return null;
    }
    
    // Save user to Redis with expiration
    await redis.set(`user:${userId}`, JSON.stringify(user), 'EX', USER_CACHE_EXPIRY);
    logger.info('Redis', `User ${userId} cached successfully`);
    
    return user;
  } catch (error) {
    logger.error('Redis', `Error fetching user from API: ${error}`);
    return null;
  }
}


/**
 * Invalidate a user in cache
 * @param userId User ID to invalidate
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    await redis.del(`user:${userId}`);
    logger.info('Redis', `User ${userId} invalidated in cache`);
  } catch (error) {
    logger.error('Redis', `Error invalidating user cache: ${error}`);
  }
}
