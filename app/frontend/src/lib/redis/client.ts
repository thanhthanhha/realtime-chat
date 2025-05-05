// lib/redis/client.ts
import Redis from 'ioredis';
import logger from '@/lib/logger';

// Singleton pattern for Redis client
let redisClient: Redis | null = null;

/**
 * Get or create a Redis client (singleton)
 * @returns Redis client instance
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const connectionType = process.env.REDIS_CONNECTION_TYPE || 'local';
  logger.info('Redis', `Initializing Redis client with connection type: ${connectionType}`);
  
  try {
    if (connectionType === 'local') {
      redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    } else if (connectionType === 'upstash') {
      // For Upstash Redis configuration
      redisClient = new Redis(process.env.REDIS_URL || '');
    } else {
      throw new Error(`Unsupported Redis connection type: ${connectionType}`);
    }

    // Setup error handling
    redisClient.on('error', (err) => {
      logger.error('Redis', `Redis connection error: ${err}`);
    });

    redisClient.on('connect', () => {
      logger.info('Redis', 'Redis client connected');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis', 'Redis client reconnecting');
    });

    return redisClient;
  } catch (error) {
    logger.error('Redis', `Failed to initialize Redis client: ${error}`);
    throw error;
  }
}

/**
 * Close Redis connection - usually only needed for cleanup or tests
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis', 'Redis connection closed');
  }
}

// Create a default export for the Redis client
export default getRedisClient();