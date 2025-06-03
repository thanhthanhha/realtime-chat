import WebSocket from 'ws';
import { WebSocketMessage, NotificationPayload } from '../types/models';
import { publishNotification, consumeNotification } from '../services/rabbitmq.service';
import Logger from '../utils/logger';

const MODULE_NAME = 'WebSocketHandlerNotification';
const activeConnections = new Map<string, WebSocket>();

export const handleWebSocketConnectionUser = async (ws: WebSocket, req: any): Promise<void> => {
  const userId = req.params.userid;
  Logger.info(MODULE_NAME, `New WebSocket connection established for user notification: ${userId}`);

  // Store the connection
  activeConnections.set(userId, ws);
  Logger.debug(MODULE_NAME, `Stored new WebSocket connection for user: ${userId}`);

  // Handle incoming messages (notifications configuration or acknowledgments)
  
  ws.on('message', async (data: string) => {
    try {
      Logger.debug(MODULE_NAME, `Received message from user ${userId}: ${data}`);
      
      const payload = JSON.parse(data);
      
      // Validate payload
      if (!payload.type || !payload.content) {
        Logger.error(MODULE_NAME, `Invalid notification format received: ${data}`);
        throw new Error('Invalid notification format: type and content are required');
      }

      const notification: NotificationPayload = {
        ...payload,
        timestamp: new Date()
      };

      Logger.debug(MODULE_NAME, `Publishing notification for user ${userId}`);
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
  await consumeNotification(userId, (notification: NotificationPayload) => {
    Logger.debug(MODULE_NAME, `Consuming notification for user ${userId}: ${JSON.stringify(notification)}`);
    
    const wsMessage: WebSocketMessage = {
      type: 'notification',
      payload: notification
    };

    // If receiver_id exists, send only to that specific user
    if (notification.receiver) {
      //console.log(activeConnections)
      const receiverWs = activeConnections.get(notification.receiver);
      
      if (receiverWs?.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(wsMessage));
        Logger.debug(MODULE_NAME, `Notification delivered to receiver ${notification.receiver}`);
      } else {
        Logger.warn(MODULE_NAME, `Failed to deliver notification to receiver ${notification.receiver} - connection not open`);
        // Could implement notification persistence for offline users here
      }
      
      // Also send to the sender if they're not the same as the receiver
      // if (userId !== notification.receiver) {
      //   const senderWs = activeConnections.get(userId);
        
      //   if (senderWs?.readyState === WebSocket.OPEN) {
      //     senderWs.send(JSON.stringify(wsMessage));
      //     Logger.debug(MODULE_NAME, `Notification echo delivered to sender ${userId}`);
      //   }
      // }
    } else {
      // No specific receiver, broadcast to all active connections
      let deliveredCount = 0;
      
      activeConnections.forEach((ws, connectedUserId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(wsMessage));
          deliveredCount++;
        }
      });
  };
});

  // Cleanup on connection close
  ws.on('close', () => {
    Logger.info(MODULE_NAME, `WebSocket connection closing for user ${userId}`);
    activeConnections.delete(userId);
    Logger.debug(MODULE_NAME, `Removed WebSocket connection for user ${userId}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    Logger.error(MODULE_NAME, `WebSocket error for user ${userId}`, error as Error);
    activeConnections.delete(userId);
  });
};