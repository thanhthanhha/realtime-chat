import amqp, { Channel, Connection } from 'amqplib';
import { ChatMessage } from '../types/models';
import Logger from '../utils/logger';

const MODULE_NAME = 'RabbitMQConfig';

// Connection and channel variables
let channel: Channel | null = null;
let connection: Connection | null = null;

// State management
let isConnecting = false;
let isShuttingDown = false;
let reconnectTimeout: NodeJS.Timeout | null = null;

// Retry configuration
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

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
  
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

/**
 * Setup RabbitMQ exchanges and queues
 */
const setupExchangesAndQueues = async (): Promise<void> => {
  if (!channel) {
    throw new Error('Channel not available for setup');
  }

  try {
    // Main exchange for chat messages
    await channel.assertExchange('chat_exchange', 'direct', { durable: true });
    Logger.debug(MODULE_NAME, 'Chat exchange asserted');
    
    // Main exchange for notifications
    await channel.assertExchange('notification_exchange', 'direct', { durable: true });
    Logger.debug(MODULE_NAME, 'Notification exchange asserted');
    
    // Dead Letter Exchange (DLX) setup
    await channel.assertExchange('dlx_exchange', 'direct', { durable: true });
    Logger.debug(MODULE_NAME, 'dlx_exchange exchange asserted');
    await channel.assertQueue('dlx_queue', { durable: true });
    Logger.debug(MODULE_NAME, 'dlx_queue queue asserted');
    await channel.bindQueue('dlx_queue', 'dlx_exchange', 'dlx_routing_key');
    Logger.debug(MODULE_NAME, 'DLX setup completed');

    // Notification Dead Letter Exchange (DLX) setup
    await channel.assertExchange('dlx_notif_exchange', 'direct', { durable: true });
    Logger.debug(MODULE_NAME, 'dlx_notif_exchange exchange asserted');
    await channel.assertQueue('dlx_notif_queue', { durable: true });
    Logger.debug(MODULE_NAME, 'dlx_notif_queue queue asserted');
    await channel.bindQueue('dlx_notif_queue', 'dlx_notif_exchange', 'dlx_notif_routing_key');
    Logger.debug(MODULE_NAME, 'DLX for notification setup completed');
    
    Logger.info(MODULE_NAME, 'All exchanges and queues initialized successfully');
  } catch (error) {
    Logger.error(MODULE_NAME, 'Failed to setup exchanges and queues', error as Error);
    throw error;
  }
};

/**
 * Setup connection event handlers
 */
const setupConnectionHandlers = () => {
  if (!connection) return;

  // Remove any existing listeners to prevent memory leaks
  connection.removeAllListeners('error');
  connection.removeAllListeners('close');
  connection.removeAllListeners('blocked');
  connection.removeAllListeners('unblocked');

  connection.on('error', (err) => {
    Logger.error(MODULE_NAME, 'Connection error occurred', err);
    handleConnectionFailure();
  });
  
  connection.on('close', () => {
    Logger.warn(MODULE_NAME, 'Connection closed unexpectedly');
    handleConnectionFailure();
  });

  connection.on('blocked', (reason) => {
    Logger.warn(MODULE_NAME, `Connection blocked: ${reason}`);
  });

  connection.on('unblocked', () => {
    Logger.info(MODULE_NAME, 'Connection unblocked');
  });
};

/**
 * Setup channel event handlers
 */
const setupChannelHandlers = () => {
  if (!channel) return;

  // Remove any existing listeners
  channel.removeAllListeners('error');
  channel.removeAllListeners('close');
  channel.removeAllListeners('return');

  channel.on('error', (err) => {
    Logger.error(MODULE_NAME, 'Channel error occurred', err);
    handleChannelFailure();
  });
  
  channel.on('close', () => {
    Logger.warn(MODULE_NAME, 'Channel closed unexpectedly');
    handleChannelFailure();
  });

  channel.on('return', (msg) => {
    Logger.warn(MODULE_NAME, `Message returned: ${msg.content.toString()}`);
  });
};

/**
 * Handle connection failure
 */
const handleConnectionFailure = () => {
  if (isShuttingDown) {
    Logger.debug(MODULE_NAME, 'Ignoring connection failure during shutdown');
    return;
  }

  // Clear connection and channel references
  connection = null;
  channel = null;
  
  // Attempt reconnection
  scheduleReconnect();
};

/**
 * Handle channel failure (try to recreate channel without full reconnection)
 */
const handleChannelFailure = () => {
  if (isShuttingDown) {
    Logger.debug(MODULE_NAME, 'Ignoring channel failure during shutdown');
    return;
  }

  channel = null;
  
  // Try to recreate channel if connection is still alive
  if (connection) {
    Logger.info(MODULE_NAME, 'Attempting to recreate channel...');
    createChannel();
  } else {
    // Connection is also dead, do full reconnection
    handleConnectionFailure();
  }
};

/**
 * Create a new channel
 */
const createChannel = async (): Promise<void> => {
  if (!connection) {
    throw new Error('Cannot create channel: connection not available');
  }

  try {
    channel = await connection.createChannel();
    setupChannelHandlers();
    await setupExchangesAndQueues();
    Logger.info(MODULE_NAME, 'Channel recreated successfully');
  } catch (error) {
    Logger.error(MODULE_NAME, 'Failed to create channel', error as Error);
    throw error;
  }
};

/**
 * Schedule reconnection attempt
 */
const scheduleReconnect = () => {
  if (reconnectTimeout) return; // Only check for pending reconnects
  
  const delay = calculateBackoff(0);
  reconnectTimeout = setTimeout(async () => {
    reconnectTimeout = null;
    try {
      await connectRabbitMQ();
    } catch (error) {
      Logger.error(MODULE_NAME, 'Reconnection failed', error as Error);
    }
  }, delay);
};

/**
 * Connect to RabbitMQ with retry mechanism
 */
export const connectRabbitMQ = async (): Promise<void> => {
  if (isConnecting) {
    Logger.debug(MODULE_NAME, 'Connection attempt already in progress');
    return;
  }

  if (isShuttingDown) {
    Logger.debug(MODULE_NAME, 'Cannot connect during shutdown');
    return;
  }

  isConnecting = true;
  let retryCount = 0;
  let connected = false;

  // Clear any pending reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  while (!connected && retryCount < MAX_RETRIES && !isShuttingDown) {
    try {
      Logger.info(MODULE_NAME, `Connection attempt ${retryCount + 1}/${MAX_RETRIES} connecting to ${process.env.RABBITMQ_URL}`);

      // Connection options with heartbeat - let amqplib handle heartbeat checking
      const options = {
        heartbeat: 60, // 60 seconds heartbeat - amqplib handles this automatically
        timeout: 30000, // 30 seconds socket connection timeout
        clientProperties: {
          connection_name: `chat_service_${process.env.NODE_ENV || 'development'}_${Date.now()}`
        }
      };


      // Establish connection
      connection = await amqp.connect(process.env.RABBITMQ_URL!, options);
      setupConnectionHandlers();
      
      // Create channel
      await createChannel();
      
      connected = true;
      Logger.info(MODULE_NAME, 'Successfully connected to RabbitMQ');
      
    } catch (error) {
      retryCount++;
      const backoffDelay = calculateBackoff(retryCount);
      
      Logger.warn(
        MODULE_NAME, 
        `Connection attempt ${retryCount}/${MAX_RETRIES} failed: ${(error as Error).message}`
      );
      
      if (retryCount < MAX_RETRIES && !isShuttingDown) {
        Logger.info(MODULE_NAME, `Retrying in ${Math.round(backoffDelay/1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  isConnecting = false;

  if (!connected && !isShuttingDown) {
    const error = new Error(`Failed to connect to RabbitMQ after ${MAX_RETRIES} attempts`);
    Logger.error(MODULE_NAME, error.message);
    
    // Schedule another reconnection attempt
    scheduleReconnect();
    throw error;
  }
};

/**
 * Get the current RabbitMQ channel
 */
export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error('RabbitMQ channel not available. Connection may be down.');
  }
  return channel;
};

/**
 * Get the current RabbitMQ connection
 */
export const getConnection = (): Connection => {
  if (!connection) {
    throw new Error('RabbitMQ connection not available.');
  }
  return connection;
};

/**
 * Check if connection and channel are healthy
 */
export const checkConnection = (): boolean => {
  try {
    return !!(connection && channel);
  } catch (error) {
    return false;
  }
};

/**
 * Check if currently connecting
 */
export const isCurrentlyConnecting = (): boolean => {
  return isConnecting;
};

/**
 * Get connection status
 */
export const getConnectionStatus = () => {
  return {
    connected: checkConnection(),
    connecting: isConnecting,
    shuttingDown: isShuttingDown,
    hasConnection: !!connection,
    hasChannel: !!channel
  };
};

/**
 * Force reconnection (useful for testing or manual recovery)
 */
export const forceReconnect = async (): Promise<void> => {
  Logger.info(MODULE_NAME, 'Forcing reconnection...');
  
  // Close existing connections
  await closeRabbitMQ();
  
  // Wait a moment before reconnecting
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Reconnect
  await connectRabbitMQ();
};

/**
 * Gracefully close RabbitMQ connection
 */
export const closeRabbitMQ = async (): Promise<void> => {
  isShuttingDown = true;
  
  Logger.info(MODULE_NAME, 'Closing RabbitMQ connection...');
  
  try {
    // Clear reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    // Close channel first
    if (channel) {
      await channel.close();
      Logger.debug(MODULE_NAME, 'Channel closed');
    }
    
    // Close connection
    if (connection) {
      await connection.close();
      Logger.debug(MODULE_NAME, 'Connection closed');
    }
    
    // Reset state
    channel = null;
    connection = null;
    
    Logger.info(MODULE_NAME, 'RabbitMQ connection closed gracefully');
  } catch (error) {
    Logger.error(MODULE_NAME, 'Error while closing connection', error as Error);
  } finally {
    isShuttingDown = false;
  }
};

// Handle process termination gracefully
const gracefulShutdown = async (signal: string) => {
  Logger.info(MODULE_NAME, `Received ${signal}, initiating graceful shutdown...`);
  
  try {
    await closeRabbitMQ();
    Logger.info(MODULE_NAME, 'RabbitMQ connection closed successfully');
    process.exit(0);
  } catch (error) {
    Logger.error(MODULE_NAME, 'Error during graceful shutdown', error as Error);
    process.exit(1);
  }
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Termination request
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT')); // Quit from keyboard

// Handle uncaught exceptions and rejections
process.on('uncaughtException', async (error) => {
  Logger.error(MODULE_NAME, 'Uncaught exception occurred  \n retry connection', error);
  scheduleReconnect();
});

process.on('unhandledRejection', async (reason, promise) => {
  Logger.error(MODULE_NAME, `Unhandled rejection at: ${promise}, reason: ${reason} \n retry connection`);
  scheduleReconnect();
});

