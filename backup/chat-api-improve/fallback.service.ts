import { EventEmitter } from 'events';
import { NotificationPayload } from '../types/models';
import Logger from '../utils/logger';

const MODULE_NAME = 'FallbackService';

class InMemoryService extends EventEmitter {
  private userQueues = new Map<string, NotificationPayload[]>();
  private isRabbitMQAvailable = false;

  constructor() {
    super();
    this.setMaxListeners(0); // Remove listener limit
  }

  setRabbitMQStatus(available: boolean): void {
    this.isRabbitMQAvailable = available;
    Logger.info(MODULE_NAME, `RabbitMQ status changed: ${available ? 'available' : 'unavailable'}`);
  }

  isUsingFallback(): boolean {
    return !this.isRabbitMQAvailable;
  }

  // Store notification in memory queue
  publishNotification(userId: string, notification: NotificationPayload): void {
    if (!this.userQueues.has(userId)) {
      this.userQueues.set(userId, []);
    }
    
    const queue = this.userQueues.get(userId)!;
    queue.push(notification);
    
    // Emit event for immediate delivery
    this.emit(`notification:${userId}`, notification);
    
    Logger.debug(MODULE_NAME, `Notification stored in memory for user ${userId}`);
    
    // Optional: Implement queue size limit to prevent memory leaks
    const MAX_QUEUE_SIZE = 100;
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.shift(); // Remove oldest notification
      Logger.warn(MODULE_NAME, `Queue size limit reached for user ${userId}, removed oldest notification`);
    }
  }

  // Subscribe to notifications for a user
  subscribeToNotifications(userId: string, callback: (notification: NotificationPayload) => void): void {
    const eventName = `notification:${userId}`;
    this.on(eventName, callback);
    
    Logger.debug(MODULE_NAME, `Subscribed to notifications for user ${userId}`);
    
    // Deliver any queued notifications immediately
    this.deliverQueuedNotifications(userId, callback);
  }

  // Unsubscribe from notifications
  unsubscribeFromNotifications(userId: string, callback?: (notification: NotificationPayload) => void): void {
    const eventName = `notification:${userId}`;
    if (callback) {
      this.removeListener(eventName, callback);
    } else {
      this.removeAllListeners(eventName);
    }
    
    Logger.debug(MODULE_NAME, `Unsubscribed from notifications for user ${userId}`);
  }

  // Deliver any queued notifications
  private deliverQueuedNotifications(userId: string, callback: (notification: NotificationPayload) => void): void {
    const queue = this.userQueues.get(userId);
    if (queue && queue.length > 0) {
      Logger.debug(MODULE_NAME, `Delivering ${queue.length} queued notifications for user ${userId}`);
      
      // Deliver all queued notifications
      queue.forEach(notification => {
        try {
          callback(notification);
        } catch (error) {
          Logger.error(MODULE_NAME, `Error delivering queued notification for user ${userId}`, error as Error);
        }
      });
      
      // Clear the queue after delivery
      queue.length = 0;
    }
  }

  // Get queue statistics
  getQueueStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.userQueues.forEach((queue, userId) => {
      stats[userId] = queue.length;
    });
    return stats;
  }

  // Clear all queues (useful for cleanup)
  clearAllQueues(): void {
    this.userQueues.clear();
    this.removeAllListeners();
    Logger.info(MODULE_NAME, 'All notification queues cleared');
  }

  // Get total number of queued notifications
  getTotalQueuedNotifications(): number {
    let total = 0;
    this.userQueues.forEach(queue => {
      total += queue.length;
    });
    return total;
  }
}

// Singleton instance
export const inMemoryNotificationService = new InMemoryNotificationService();