import amqp, { Channel, Connection } from 'amqplib';
import { ChatMessage } from '../types/models';
import Logger from '../utils/logger';

// Connection and channel variables
let channel: Channel;
let connection: Connection;

// Retry configuration
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

// Heartbeat monitoring
let heartbeatTimer: NodeJS.Timeout | null = null;
const HEARTBEAT_INTERVAL = 60000; // 60 seconds - must match the heartbeat value in the connection options

/**
 * Calculate exponential backoff delay
 * @param retryCount Current retry attempt
 * @returns Delay in milliseconds
 */
const calculateBackoff = (retryCount: number): number => {
  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
    MAX_RETRY_DELAY
  );
  
  // Add some jitter to prevent all clients from retrying simultaneously
  return delay + Math.random() * 1000;
};

/**
 * Setup RabbitMQ exchanges and queues
 */
const setupExchangesAndQueues = async (): Promise<void> => {
  try {
    // Main exchange for chat messages
    await channel.assertExchange('chat_exchange', 'direct', { durable: true });
    
    // Main exchange for chat notification
    await channel.assertExchange('notification_exchange', 'direct', { durable: true });
    
    // Dead Letter Exchange (DLX) setup
    await channel.assertExchange('dlx_exchange', 'direct', { durable: true });
    await channel.assertQueue('dlx_queue', { durable: true });
    await channel.bindQueue('dlx_queue', 'dlx_exchange', 'dlx_routing_key');
    
    Logger.info('RabbitMQ', 'Exchanges and queues initialized successfully');
  } catch (error) {
    Logger.error('RabbitMQ', 'Failed to initialize exchanges and queues', error as Error);
    throw error;
  }
};

/**
 * Connect to RabbitMQ with retry mechanism
 */
export const connectRabbitMQ = async (): Promise<void> => {
  let retryCount = 0;
  let connected = false;

  while (!connected && retryCount < MAX_RETRIES) {
    try {
      // Connection options with heartbeat
      const options = {
        heartbeat: 60, // 60 seconds heartbeat
        timeout: 30000, // 30 seconds socket connection timeout
        clientProperties: {
          connection_name: `chat_service_${process.env.NODE_ENV || 'development'}`
        }
      };

      // Attempt to establish connection with heartbeat
      connection = await amqp.connect(process.env.RABBITMQ_URL!, options);
      
      // Set up reconnection logic
      connection.on('error', (err) => {
        Logger.error('RabbitMQ', 'Connection error', err);
        attemptReconnect();
      });
      
      connection.on('close', () => {
        Logger.warn('RabbitMQ', 'Connection closed unexpectedly');
        attemptReconnect();
      });
      
      // Create channel
      channel = await connection.createChannel();
      
      // Set up channel error handling
      channel.on('error', (err) => {
        Logger.error('RabbitMQ', 'Channel error', err);
      });
      
      channel.on('close', () => {
        Logger.warn('RabbitMQ', 'Channel closed');
      });
      
      // Initialize exchanges and queues
      await setupExchangesAndQueues();
      
      connected = true;
      Logger.info('RabbitMQ', `Successfully connected with heartbeat interval of 60s`);
      
      // Setup additional heartbeat monitoring as a safeguard
      setupHeartbeatMonitoring();
    } catch (error) {
      retryCount++;
      const backoffDelay = calculateBackoff(retryCount);
      
      Logger.warn(
        'RabbitMQ', 
        `Connection attempt ${retryCount}/${MAX_RETRIES} failed. Retrying in ${Math.round(backoffDelay/1000)} seconds.`
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  if (!connected) {
    const error = new Error(`Failed to connect to RabbitMQ after ${MAX_RETRIES} attempts`);
    Logger.error('RabbitMQ', error.message);
    throw error;
  }
};

/**
 * Attempt to reconnect to RabbitMQ
 */
const attemptReconnect = () => {
  // Check if connection exists and is still open
  let isConnecting = false;
  
  try {
    // If we can create a channel, connection is still good (this won't actually create one)
    isConnecting = connection && connection.createChannel !== undefined;
  } catch (e) {
    isConnecting = false;
  }
  
  // Only attempt to reconnect if we're not already trying
  if (isConnecting) {
    return;
  }
  
  Logger.info('RabbitMQ', 'Attempting to reconnect...');
  
  // Schedule reconnection attempt
  setTimeout(async () => {
    try {
      await connectRabbitMQ();
    } catch (error) {
      Logger.error('RabbitMQ', 'Reconnection failed', error as Error);
    }
  }, INITIAL_RETRY_DELAY);
};

/**
 * Get the current RabbitMQ channel
 */
export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error('RabbitMQ channel not available. Ensure connectRabbitMQ() was called.');
  }
  return channel;
};

/**
 * Check if connection is healthy
 */
export const checkConnection = (): boolean => {
  try {
    return !!connection && !!channel;
  } catch (error) {
    return false;
  }
};

/**
 * Setup heartbeat monitoring
 */
const setupHeartbeatMonitoring = () => {
  // Clear any existing timer
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  
  // Set up heartbeat monitoring
  heartbeatTimer = setInterval(() => {
    if (!checkConnection()) {
      Logger.warn('RabbitMQ', 'Heartbeat check failed, connection appears to be down');
      // Clear the timer to avoid multiple reconnection attempts
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      attemptReconnect();
    } else {
      Logger.debug('RabbitMQ', 'Heartbeat check successful');
    }
  }, HEARTBEAT_INTERVAL);
};

/**
 * Gracefully close RabbitMQ connection
 */
export const closeRabbitMQ = async (): Promise<void> => {
  try {
    // Stop heartbeat monitoring
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    Logger.info('RabbitMQ', 'Connection closed gracefully');
  } catch (error) {
    Logger.error('RabbitMQ', 'Error while closing connection', error as Error);
    throw error;
  }
};