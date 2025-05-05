'use client'

import { FC, useEffect, useRef, useState, createContext, useContext, ReactNode } from 'react'
import logger from '@/lib/logger'
import {publicEnv} from '@/lib/static'

interface WebSocketMessageContextType {
  messages: Message[];
  sendMessage: (text: string) => void;
  isConnected: boolean;
}

const WebSocketMessageContext = createContext<WebSocketMessageContextType | null>(null);

export const useWebSocketMessages = () => {
  const context = useContext(WebSocketMessageContext);
  if (!context) {
    throw new Error('useWebSocketMessages must be used within a WebSocketMessageWrapper');
  }
  return context;
};

interface WebSocketMessageWrapperProps {
  chatId: string;
  sessionId: string;
  initialMessages: Message[];
  chatPartners: User[];
  children: ReactNode;
}

const WebSocketMessageWrapper: FC<WebSocketMessageWrapperProps> = ({
  chatId,
  sessionId,
  initialMessages,
  chatPartners,
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const websocketRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Define an async function inside the effect
    const setupWebSocket = async () => {
      const PublicVar = await publicEnv()
      const currentDomain = window.location.origin.replace(/^http/, 'ws');
      const websocketServer = PublicVar.WEBSOCKET_SERVER || currentDomain;
      const WEBSOCKET_URL = `${websocketServer}/ws/chat/${sessionId}/${chatId}`;
      logger.info('WebSocketMessage', `Check Message WebSocket WEBSOCKET_SERVER ${WEBSOCKET_URL}`)
      // if (!PublicVar.WEBSOCKET_SERVER) {
      //   logger.error('WebSocketProvider', 'WebSocket server URL is undefined. Check environment variables.');
      //   return;
      // }
      
      
      
      const connectWebSocket = () => {
        try {
          const websocket = new WebSocket(WEBSOCKET_URL);
          websocketRef.current = websocket;
          // Connection opened
          websocket.addEventListener('open', () => {
            logger.info('WebSocketMessage', 'WebSocket connection established', { chatId });
            setIsConnected(true);
          });
          // Listen for messages
          websocket.addEventListener('message', (event) => {
            try {
              const data = JSON.parse(event.data);
              // Assuming the message has the same structure as the Message type
              const message = data.payload as Message;
              setMessages((prev) => [message, ...prev]);
              logger.debug('WebSocketMessage', 'Message received', { message });
            } catch (error) {
              logger.error('WebSocketMessage', 'Error parsing WebSocket message', { error });
            }
          });
          // Connection closed
          websocket.addEventListener('close', () => {
            logger.info('WebSocketMessage', 'WebSocket connection closed', { chatId });
            setIsConnected(false);
            // Attempt to reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
          });
          websocket.addEventListener('error', (error) => {
            logger.error('WebSocketMessage', 'WebSocket error', { error });
            if (websocketRef.current) {
              websocketRef.current.close();
            }
          });
        } catch (error) {
          logger.error('WebSocketMessage', 'Failed to establish WebSocket connection', { error });
        }
      };
      
      connectWebSocket();
    };
  
    // Call the async function
    setupWebSocket();
    
    // Clean up the WebSocket connection when component unmounts
    return () => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.close();
      }
    };
  }, [chatId, sessionId]);

  const sendMessage = (text: string) => {
    if (!text.trim() || !isConnected) return;

    const message = {
      sender_id: sessionId,
      receiver_id: chatPartners[0].id ? chatPartners[0].id : null,
      text: text,
      timestamp: `${new Date().getTime()}`
    };

    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
      logger.debug('WebSocketMessage', 'Message sent', { message });
    } else {
      logger.warn('WebSocketMessage', 'Cannot send message - connection not open');
    }
  };

  const contextValue = {
    messages,
    sendMessage,
    isConnected
  };

  return (
    <WebSocketMessageContext.Provider value={contextValue}>
      {children}
    </WebSocketMessageContext.Provider>
  );
};

export default WebSocketMessageWrapper;