// lib/logger.ts

// Define log levels (for reference only since console.log doesn't use them)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Helper function to format timestamp
const getTimestamp = () => {
  return new Date().toISOString().replace('T', ' ').substr(0, 19);
};

// Helper function to format log message
const formatMessage = (level: string, module: string | undefined, message: string, metadata?: any) => {
  let msg = `${getTimestamp()} | ${level.toUpperCase()} | ${module || 'unknown'} | ${message}`;
  if (metadata && Object.keys(metadata).length > 0) {
    msg += ` | ${JSON.stringify(metadata)}`;
  }
  return msg;
};

// Safe console logging function that works in all environments
const safeConsoleLog = (level: string, formattedMessage: string) => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Browser environment - use console.log for all levels
    console.log(formattedMessage);
    return;
  }

  // Server environment - use specific console methods
  switch (level) {
    case 'error':
      console.log(formattedMessage);
      break;
    case 'warn':
      console.log(formattedMessage);
      break;
    case 'info':
      console.log(formattedMessage);
      break;
    case 'debug':
      console.log(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
};

const logger = {
  error: (module: string | undefined, message: string | object, metadata?: any) => {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    safeConsoleLog('error', formatMessage('error', module, msg, metadata));
  },

  warn: (module: string | undefined, message: string | object, metadata?: any) => {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    safeConsoleLog('warn', formatMessage('warn', module, msg, metadata));
  },

  info: (module: string | undefined, message: string | object, metadata?: any) => {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    safeConsoleLog('info', formatMessage('info', module, msg, metadata));
  },

  http: (module: string | undefined, message: string | object, metadata?: any) => {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    safeConsoleLog('http', formatMessage('http', module, msg, metadata));
  },

  debug: (module: string | undefined, message: string | object, metadata?: any) => {
    if (isDevelopment) {
      const msg = typeof message === 'string' ? message : JSON.stringify(message);
      safeConsoleLog('debug', formatMessage('debug', module, msg, metadata));
    }
  }
};

// Create a stream object for HTTP logging
export const stream = {
  write: (message: string) => {
    logger.http(undefined, message.trim());
  },
};

// Helper functions for common logging patterns
export const logError = (err: Error, additionalInfo?: object) => {
  logger.error(undefined, err.message, {
    stack: err.stack,
    ...additionalInfo,
  });
};

export const logAPIRequest = (method: string, url: string, body?: any, query?: any) => {
  logger.info('API', `API Request: ${method} ${url}`, {
    method,
    url,
    body,
    query,
  });
};

export const logAPIResponse = (method: string, url: string, statusCode: number, responseTime: number) => {
  logger.info('API', `API Response: ${method} ${url}`, {
    method,
    url,
    statusCode,
    responseTime,
  });
};

export default logger;