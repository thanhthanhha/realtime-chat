import WebSocket from 'ws';
import { WebSocketMessage, NotificationPayload } from '../types/models';
import { publishNotification, consumeNotification, cleanupNotificationConsumer } from '../services/rabbitmq.service';
import { inMemoryNotificationService } from '../services/fallback.service';
import Logger from '../utils/logger';

const MODULE_NAME = 'WebSocketHandlerNotification';
const activeConnections = new Map<string, WebSocket>();

export const handleWebSocketConnectionUser = async (ws: WebSocket, req: any): Promise<void> => {
  const userId = req.params.userid;
  Logger.info(MODULE_NAME, `New WebSocket connection established for user notification: ${userId}`);

  // Store the connection
  activeConnections.set(userId, ws);
  Logger.debug(MODULE_NAME, `Stored new WebSocket connection for user: ${userId}`);

  // Create notification handler
  const notificationHandler = (notification: NotificationPayload) => {
    Logger.debug(MODULE_NAME, `Processing notification for user ${userId}: ${JSON.stringify(notification)}`);
    
    const wsMessage: WebSocketMessage = {
      type: 'notification',
      payload: notification
    };

    // If receiver_id exists, send only to that specific user
    if (notification.receiver) {
      const receiverWs = activeConnections.get(notification.receiver);
      
      if (receiverWs?.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(wsMessage));
        Logger.debug(MODULE_NAME, `Notification delivered to receiver ${notification.receiver}`);
      } else {
        Logger.warn(MODULE_NAME, `Failed to deliver notification to receiver ${notification.receiver} - connection not open`);
      }
    } else {
      // No specific receiver, broadcast to all active connections
      let deliveredCount = 0;
      
      activeConnections.forEach((ws, connectedUserId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(wsMessage));
          deliveredCount++;
        }
      });
      
      Logger.debug(MODULE_NAME, `Broadcast notification delivered to ${deliveredCount} users`);
    }
  };

  // Handle incoming messages
  ws.on('message', async (data: string) => {
    try {
      Logger.debug(MODULE_NAME, `Received message from user ${userId}: ${data}`);
      
      const payload = JSON.parse(data);
      
      if (!payload.type || !payload.content) {
        Logger.error(MODULE_NAME, `Invalid notification format received: ${data}`);
        throw new Error('Invalid notification format: type and content are required');
      }

      const notification: NotificationPayload = {
        ...payload,
        timestamp: new Date()
      };

      Logger.debug(MODULE_NAME, `Publishing notification for user ${userId} using ${inMemoryNotificationService.isUsingFallback() ? 'in-memory fallback' : 'RabbitMQ'}`);
      await publishNotification(userId, notification);
      
    } catch (error) {
      Logger.error(MODULE_NAME, `Error processing notification for user ${userId}`, error as Error);
      const errorMessage: WebSocketMessage = {
        type: 'error',
        payload: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      ws.send(JSON.stringify(errorMessage));
    }
  });

  // Set up notification consumer
  try {
    await consumeNotification(userId, notificationHandler);
    Logger.info(MODULE_NAME, `Notification consumer set up for user ${userId} using ${inMemoryNotificationService.isUsingFallback() ? 'in-memory fallback' : 'RabbitMQ'}`);
  } catch (error) {
    Logger.error(MODULE_NAME, `Failed to set up notification consumer for user ${userId}`, error as Error);
  }

  // Send system status message
  const statusMessage: WebSocketMessage = {
    type: 'system',
    payload: {
      message: `Connected using ${inMemoryNotificationService.isUsingFallback() ? 'in-memory fallback' : 'RabbitMQ'}`,
      fallbackMode: inMemoryNotificationService.isUsingFallback(),
      queueStats: inMemoryNotificationService.isUsingFallback() ? inMemoryNotificationService.getQueueStats() : null
    }
  };
  ws.send(JSON.stringify(statusMessage));

  // Cleanup on connection close
  ws.on('close', () => {
    Logger.info(MODULE_NAME, `WebSocket connection closing for user ${userId}`);
    activeConnections.delete(userId);
    cleanupNotificationConsumer(userId, notificationHandler);
    Logger.debug(MODULE_NAME, `Cleaned up resources for user ${userId}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    Logger.error(MODULE_NAME, `WebSocket error for user ${userId}`, error as Error);
    activeConnections.delete(userId);
    cleanupNotificationConsumer(userId, notificationHandler);
  });
};