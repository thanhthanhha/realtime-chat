import WebSocket from 'ws';
import { ChatMessage, WebSocketMessage } from '../types/models';
import { processMessage } from '../services/api.service';
import { publishMessage, consumeMessages } from '../services/rabbitmq.service';
import Logger from '../utils/logger';

const MODULE_NAME = 'WebSocketHandlerChat';
const activeConnections = new Map<string, Map<string, WebSocket>>();



export const handleWebSocketConnection = async (ws: WebSocket, req: any): Promise<void> => {
  const chatId = req.params.id;
  const userId = req.params.userid; 
  Logger.info(MODULE_NAME, `New WebSocket connection established for chatroom: ${chatId}`);
  
  if (!activeConnections.has(userId)) {
    // User doesn't exist in activeConnections, create a new Map for them
    activeConnections.set(userId, new Map());
    Logger.debug(MODULE_NAME, `Created new connections map for user: ${userId}`);
  }
  
  // Now get the user's connection map (which definitely exists now)
  const userConnections = activeConnections.get(userId);
  if (userConnections && !userConnections.has(chatId)) {
    userConnections.set(chatId, ws);
    Logger.debug(MODULE_NAME, `Added connection for chatroom: ${chatId} for user ${userId}`);
  }




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
    Logger.debug(MODULE_NAME, `Consuming message for chatroom ${chatId}: ${JSON.stringify(message)}`);
    
    const wsMessage: WebSocketMessage = {
      type: 'message',
      payload: message
    };
    
    // Get connections for the sender and receiver
    const senderConnections = activeConnections.get(message.sender_id);
    const senderWs = senderConnections?.get(chatId);
    
    const receiverConnections = message.receiver_id ? activeConnections.get(message.receiver_id) : null;
    const receiverWs = receiverConnections?.get(chatId);
    
    const sendIfConnected = (ws: WebSocket | undefined | null, recipientId: string) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(wsMessage));
        Logger.debug(MODULE_NAME, `Message delivered to recipient ${recipientId} in chatroom ${chatId}`);
      } else {
        Logger.warn(MODULE_NAME, `Failed to deliver message to recipient ${recipientId} in chatroom ${chatId} - connection not open`);
      }
    };
    
    if (message.receiver_id) {
      // Private message handling
      Logger.debug(MODULE_NAME, `Delivering private message in chatroom ${chatId} from ${message.sender_id} to ${message.receiver_id}`);
      sendIfConnected(senderWs, message.sender_id);
      sendIfConnected(receiverWs, message.receiver_id);
    } else {
      // Broadcast message to everyone in this chatroom
      Logger.debug(MODULE_NAME, `Broadcasting message in chatroom ${chatId} from ${message.sender_id}`);
      
      // Iterate through all users
      activeConnections.forEach((userConnections, userId) => {
        // Check if this user is connected to this chatroom
        const userWs = userConnections.get(chatId);
        if (userWs) {
          sendIfConnected(userWs, userId);
        }
      });
    }
  });

  ws.on('close', () => {
    Logger.info(MODULE_NAME, `WebSocket connection closing for user ${userId}`);
    activeConnections.delete(userId);
  });
};