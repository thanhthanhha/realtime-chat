import WebSocket from 'ws';
import { ChatMessage, WebSocketMessage } from '../types/models';
import { processMessage } from '../services/api.service';
import { publishMessage, consumeMessages } from '../services/rabbitmq.service';
import Logger from '../utils/logger';

const MODULE_NAME = 'WebSocketHandlerChat';
const activeConnections = new Map<string, Map<string, WebSocket[]>>();
// Store pending messages for users who lost connection
const pendingMessages = new Map<string, Map<string, ChatMessage[]>>();
// Track connection metadata
const connectionMetadata = new Map<string, { lastSeen: number, reconnectCount: number }>();

interface ConnectionInfo {
  ws: WebSocket;
  userId: string;
  chatId: string;
  connectionId: string;
  lastPing: number;
}

const connections = new Map<string, ConnectionInfo>();

// Heartbeat to detect broken connections
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 60000; // 1 minute

const startHeartbeat = () => {
  setInterval(() => {
    connections.forEach((conn, connectionId) => {
      if (Date.now() - conn.lastPing > CONNECTION_TIMEOUT) {
        Logger.warn(MODULE_NAME, `Connection ${connectionId} timed out, closing`);
        conn.ws.terminate();
        connections.delete(connectionId);
      } else if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.ping();
      }
    });
  }, HEARTBEAT_INTERVAL);
};

// Start heartbeat monitoring
startHeartbeat();

const isNetworkInterruption = (code: number, reason: string): boolean => {
  // Network interruption codes
  const networkInterruptionCodes = [
    1006, // Abnormal closure (no close frame received)
    1001, // Going away (browser tab closed, server going down)
    1011, // Server error
    1012, // Service restart
    1013, // Try again later
    1014, // Bad gateway
    1015  // TLS handshake failure
  ];
  
  return networkInterruptionCodes.includes(code) || code === 1006;
};

const storePendingMessage = (userId: string, chatId: string, message: ChatMessage): void => {
  if (!pendingMessages.has(userId)) {
    pendingMessages.set(userId, new Map());
  }
  
  const userPendingMessages = pendingMessages.get(userId)!;
  if (!userPendingMessages.has(chatId)) {
    userPendingMessages.set(chatId, []);
  }
  
  const chatPendingMessages = userPendingMessages.get(chatId)!;
  chatPendingMessages.push(message);
  
  // Limit pending messages to prevent memory issues (keep last 100)
  if (chatPendingMessages.length > 100) {
    chatPendingMessages.shift();
  }
  
  Logger.debug(MODULE_NAME, `Stored pending message for user ${userId} in chat ${chatId}`);
};

const sendPendingMessages = (userId: string, chatId: string, ws: WebSocket): void => {
  const userPendingMessages = pendingMessages.get(userId);
  if (!userPendingMessages) return;
  
  const chatPendingMessages = userPendingMessages.get(chatId);
  if (!chatPendingMessages || chatPendingMessages.length === 0) return;
  
  Logger.info(MODULE_NAME, `Sending ${chatPendingMessages.length} pending messages to user ${userId} in chat ${chatId}`);
  
  chatPendingMessages.forEach(message => {
    const wsMessage: WebSocketMessage = {
      type: 'message',
      payload: message
    };
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(wsMessage));
    }
  });
  
  // Clear pending messages after sending
  chatPendingMessages.length = 0;
};

export const handleWebSocketConnection = async (ws: WebSocket, req: any): Promise<void> => {
  const chatId = req.params.id;
  const userId = req.params.userid;
  const connectionId = `${userId}-${chatId}-${Date.now()}`;
  
  Logger.info(MODULE_NAME, `New WebSocket connection established for chatroom: ${chatId}, user: ${userId}`);
  
  // Store connection info
  connections.set(connectionId, {
    ws,
    userId,
    chatId,
    connectionId,
    lastPing: Date.now()
  });
  
  // Handle pong responses
  ws.on('pong', () => {
    const conn = connections.get(connectionId);
    if (conn) {
      conn.lastPing = Date.now();
    }
  });
  
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, new Map());
    Logger.debug(MODULE_NAME, `Created new connections map for user: ${userId}`);
  }
  
  const userConnections = activeConnections.get(userId);
  if (userConnections) {
    if (!userConnections.has(chatId)) {
      userConnections.set(chatId, [ws]);
      Logger.debug(MODULE_NAME, `Created new connection array for chatroom: ${chatId} for user ${userId}`);
    } else {
      const existingConnections = userConnections.get(chatId);
      existingConnections?.push(ws);
      Logger.debug(MODULE_NAME, `Added connection to existing array for chatroom: ${chatId} for user ${userId}`);
    }
  }
  
  // Send any pending messages for this user/chat combination
  sendPendingMessages(userId, chatId, ws);
  
  // Update connection metadata
  connectionMetadata.set(`${userId}-${chatId}`, {
    lastSeen: Date.now(),
    reconnectCount: (connectionMetadata.get(`${userId}-${chatId}`)?.reconnectCount || 0) + 1
  });

  ws.on('message', async (data: string) => {
    try {
      Logger.debug(MODULE_NAME, `Received message in chatroom ${chatId}: ${data}`);
      const { sender_id, receiver_id, text } = JSON.parse(data);
      
      if (!sender_id || !text) {
        Logger.error(MODULE_NAME, `Invalid message format received: ${data}`);
        throw new Error('Invalid message format: sender_id and text are required');
      }

      const message: ChatMessage = {
        chatroom_id: chatId,
        sender_id,
        receiver_id,
        text,
        timestamp: `${new Date().getTime()}`
      };

      Logger.info(MODULE_NAME, `Processing message from ${sender_id} to ${receiver_id || 'all'} in chatroom ${chatId}`);
      await processMessage(chatId, {
        sender_id,
        receiver_id: receiver_id || '',
        text
      });

      Logger.debug(MODULE_NAME, `Publishing message to RabbitMQ for chatroom ${chatId}`);
      await publishMessage(chatId, message);
      
    } catch (error) {
      Logger.error(MODULE_NAME, `Error processing message in chatroom ${chatId}`, error as Error);
      const errorMessage: WebSocketMessage = {
        type: 'error',
        payload: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      ws.send(JSON.stringify(errorMessage));
    }
  });

  await consumeMessages(chatId, (message: ChatMessage) => {
    Logger.info(MODULE_NAME, "Inside consumer");
    Logger.debug(MODULE_NAME, `Consuming message for chatroom ${chatId}: ${JSON.stringify(message)}`);
    
    const wsMessage: WebSocketMessage = {
      type: 'message',
      payload: message
    };
    
    // Get connections for the sender and receiver
    const senderConnections = activeConnections.get(message.sender_id);
    const senderWsArray = senderConnections?.get(chatId) || [];
    
    const receiverConnections = message.receiver_id ? activeConnections.get(message.receiver_id) : null;
    const receiverWsArray = receiverConnections?.get(chatId) || [];
    
    const sendToConnections = (wsArray: WebSocket[], recipientId: string) => {
      let deliveredCount = 0;
      const currentactiveConnections: WebSocket[] = [];
      let hasFailedDelivery = false;
      
      wsArray.forEach((ws, index) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify(wsMessage));
            deliveredCount++;
            currentactiveConnections.push(ws);
          } catch (error) {
            Logger.error(MODULE_NAME, `Failed to send message to connection ${index} for user ${recipientId}`, error as Error);
            hasFailedDelivery = true;
          }
        } else {
          Logger.warn(MODULE_NAME, `Removing closed connection ${index} for user ${recipientId} in chatroom ${chatId}`);
          hasFailedDelivery = true;
        }
      });
      
      // Update the array to only include active connections
      if (currentactiveConnections.length !== wsArray.length) {
        const userConnections = activeConnections.get(recipientId);
        if (userConnections) {
          userConnections.set(chatId, currentactiveConnections);
        }
      }
      
      // If delivery failed and no active connections, store as pending
      if (hasFailedDelivery && deliveredCount === 0) {
        Logger.info(MODULE_NAME, `Storing message as pending for user ${recipientId} in chatroom ${chatId}`);
        storePendingMessage(recipientId, chatId, message);
      }
      
      if (deliveredCount > 0) {
        Logger.debug(MODULE_NAME, `Message delivered to ${deliveredCount} connection(s) for user ${recipientId} in chatroom ${chatId}`);
      } else {
        Logger.warn(MODULE_NAME, `Failed to deliver message to user ${recipientId} in chatroom ${chatId} - no active connections`);
      }
    };
    
    if (message.receiver_id) {
      // Private message handling
      Logger.debug(MODULE_NAME, `Delivering private message in chatroom ${chatId} from ${message.sender_id} to ${message.receiver_id}`);
      sendToConnections(senderWsArray, message.sender_id);
      sendToConnections(receiverWsArray, message.receiver_id);
    } else {
      // Broadcast message to everyone in this chatroom
      Logger.debug(MODULE_NAME, `Broadcasting message in chatroom ${chatId} from ${message.sender_id}`);
      
      // Iterate through all users
      activeConnections.forEach((userConnections, userId) => {
        // Check if this user is connected to this chatroom
        const userWsArray = userConnections.get(chatId);
        if (userWsArray && userWsArray.length > 0) {
          sendToConnections(userWsArray, userId);
        }
      });
    }
  });

  ws.on('close', (code: number, reason: Buffer) => {
    const reasonString = reason.toString();
    Logger.info(MODULE_NAME, `WebSocket connection closing for user ${userId} with code ${code} and reason: ${reasonString}`);
    
    // Remove from connections tracking
    connections.delete(connectionId);
    
    // Check if this was a network interruption
    if (isNetworkInterruption(code, reasonString)) {
      Logger.warn(MODULE_NAME, `Network interruption detected for user ${userId} in chat ${chatId} (code: ${code})`);
      // Don't remove from activeConnections immediately - give them a chance to reconnect
      
      // Set a timeout to clean up if they don't reconnect
      setTimeout(() => {
        const userConnections = activeConnections.get(userId);
        if (userConnections) {
          const chatConnections = userConnections.get(chatId);
          if (chatConnections) {
            // Remove only the closed WebSocket
            const updatedConnections = chatConnections.filter(connection => 
              connection.readyState !== WebSocket.CLOSED && 
              connection.readyState !== WebSocket.CLOSING
            );
            
            if (updatedConnections.length === 0) {
              userConnections.delete(chatId);
              Logger.info(MODULE_NAME, `Removed all connections for user ${userId} in chat ${chatId} after timeout`);
            } else {
              userConnections.set(chatId, updatedConnections);
            }
            
            if (userConnections.size === 0) {
              activeConnections.delete(userId);
            }
          }
        }
      }, 30000); // 30 second grace period for reconnection
      
    } else {
      // Intentional close - clean up immediately
      Logger.info(MODULE_NAME, `Intentional disconnect for user ${userId} in chat ${chatId} (code: ${code})`);
      const userConnections = activeConnections.get(userId);
      if (userConnections) {
        const chatConnections = userConnections.get(chatId);
        if (chatConnections) {
          const updatedConnections = chatConnections.filter(connection => connection !== ws);
          if (updatedConnections.length === 0) {
            userConnections.delete(chatId);
          } else {
            userConnections.set(chatId, updatedConnections);
          }
        }
        
        if (userConnections.size === 0) {
          activeConnections.delete(userId);
        }
      }
    }
  });

  ws.on('error', (error: Error) => {
    Logger.error(MODULE_NAME, `WebSocket error for user ${userId} in chat ${chatId}`, error);
  });
};