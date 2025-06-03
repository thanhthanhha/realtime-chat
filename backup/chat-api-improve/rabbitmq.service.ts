import { getChannel } from '../config/rabbitmq';
import { NotificationPayload } from '../types/models';
import { inMemoryNotificationService } from './fallback.service';
import Logger from '../utils/logger';

const MODULE_NAME = 'HybridRabbitMQService';

let isRabbitMQHealthy = true;

// Health check function
export const checkRabbitMQHealth = async (): Promise<boolean> => {
  try {
    const channel = getChannel();
    if (!channel) {
      throw new Error('Channel not available');
    }
    
    // Simple health check - try to assert a temporary queue
    await channel.checkQueue('health_check_queue').catch(() => {
      // Queue doesn't exist, that's fine for health check
    });
    
    if (!isRabbitMQHealthy) {
      Logger.info(MODULE_NAME, 'RabbitMQ connection restored');
      isRabbitMQHealthy = true;
      inMemoryNotificationService.setRabbitMQStatus(true);
    }
    
    return true;
  } catch (error) {
    if (isRabbitMQHealthy) {
      Logger.error(MODULE_NAME, 'RabbitMQ connection lost, falling back to in-memory system', error as Error);
      isRabbitMQHealthy = false;
      inMemoryNotificationService.setRabbitMQStatus(false);
    }
    return false;
  }
};

// Start periodic health checks
setInterval(checkRabbitMQHealth, 30000); // Check every 30 seconds

export const publishNotification = async (userId: string, notification: NotificationPayload): Promise<void> => {
  const isHealthy = await checkRabbitMQHealth();
  
  if (isHealthy) {
    try {
      const channel = getChannel();
      const queueName = `user_${userId}_notifications`;
      
      await channel.assertQueue(queueName, {
        durable: true,
        deadLetterExchange: 'dlx_exchange',
        deadLetterRoutingKey: 'dlx_routing_key'
      });
      
      channel.publish(
        'notification_exchange',
        userId,
        Buffer.from(JSON.stringify(notification)),
        { persistent: true }
      );
      
      Logger.debug(MODULE_NAME, `Notification published to RabbitMQ for user ${userId}`);
    } catch (error) {
      Logger.error(MODULE_NAME, 'Failed to publish to RabbitMQ, using fallback', error as Error);
      // Fallback to in-memory system
      inMemoryNotificationService.publishNotification(userId, notification);
    }
  } else {
    // Use in-memory fallback
    inMemoryNotificationService.publishNotification(userId, notification);
  }
};

export const consumeNotification = async (
  userId: string, 
  callback: (notification: NotificationPayload) => void
): Promise<void> => {
  const isHealthy = await checkRabbitMQHealth();
  
  if (isHealthy) {
    try {
      const channel = getChannel();
      const queueName = `user_${userId}_notifications`;
      
      channel.consume(queueName, (msg) => {
        if (msg) {
          try {
            const notification: NotificationPayload = JSON.parse(msg.content.toString());
            callback(notification);
            channel.ack(msg);
            Logger.debug(MODULE_NAME, `Notification consumed from RabbitMQ for user ${userId}`);
          } catch (error) {
            Logger.error(MODULE_NAME, `Error processing RabbitMQ notification for user ${userId}`, error as Error);
            channel.nack(msg);
          }
        }
      });
    } catch (error) {
      Logger.error(MODULE_NAME, 'Failed to consume from RabbitMQ, using fallback', error as Error);
      // Fallback to in-memory system
      inMemoryNotificationService.subscribeToNotifications(userId, callback);
    }
  } else {
    // Use in-memory fallback
    inMemoryNotificationService.subscribeToNotifications(userId, callback);
  }
};

// Cleanup function for when connections close
export const cleanupNotificationConsumer = (userId: string, callback?: (notification: NotificationPayload) => void): void => {
  if (inMemoryNotificationService.isUsingFallback()) {
    inMemoryNotificationService.unsubscribeFromNotifications(userId, callback);
  }
  // RabbitMQ consumers are automatically cleaned up when connections close
};
