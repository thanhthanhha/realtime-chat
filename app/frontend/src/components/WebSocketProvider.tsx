'use client'

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import logger from '@/lib/logger'
import {publicEnv} from '@/lib/static'

interface WebSocketProviderProps {
  children: ReactNode;
}

interface WebSocketContextType {
  isConnected: boolean;
  notifications: NotificationPayload[];
  sendNotification: (notification: NotificationPayload) => void;
}

const MODULE_NAME = 'WebSocket'

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const setupWebSocket = async () => {
      const PublicVar = await publicEnv()
      logger.info(MODULE_NAME, 'Initiate User Session Websocket')
      if (!session?.user?.id) return;
      const currentDomain = window.location.origin.replace(/^http/, 'ws');
      const websocketServer = PublicVar.WEBSOCKET_SERVER || currentDomain;
      const WEBSOCKET_URL = `${websocketServer}/ws/user/${session.user.id}`;
      logger.info(MODULE_NAME, `Check Notification WebSocket WEBSOCKET_SERVER ${WEBSOCKET_URL}`)
      // if (!PublicVar.WEBSOCKET_SERVER) {
      //   logger.error('WebSocketProvider', 'WebSocket server URL is undefined. Check environment variables.');
      //   return;
      // }
      
      const connectWebSocket = () => {
        try {
          wsRef.current = new WebSocket(WEBSOCKET_URL);
          wsRef.current.onopen = () => {
            logger.info('WebSocket', `Connection established ${WEBSOCKET_URL}`);
            setIsConnected(true);
          };
          wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data) as NotificationPayload;
            setNotifications((prev) => [...prev, data]);
            logger.debug('WebSocket', 'Message received', { data });
          };
          wsRef.current.onclose = () => {
            logger.info('WebSocket', 'Connection closed');
            setIsConnected(false);
            // Attempt to reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
          };
          wsRef.current.onerror = (error) => {
            logger.error('WebSocket', 'WebSocket error', { error });
            wsRef.current?.close();
          };
        } catch (error) {
          logger.error('WebSocket', 'Failed to establish WebSocket connection', { error });
        }
      };
  
      connectWebSocket();
  
    }

    setupWebSocket()
    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [session?.user?.id]);

  const sendNotification = (notification: NotificationPayload): void => {
    logger.info('WebSocket', 'Initiate sendNotification', { notification });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(notification));
      logger.debug('WebSocket', 'Message sent', { notification });
    } else {
      logger.warn('WebSocket', 'Cannot send message - connection not open');
    }
  };

  const value = {
    isConnected,
    notifications,
    sendNotification,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;