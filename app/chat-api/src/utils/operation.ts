import { RetryConfig } from '../types/models';
import Logger from '../utils/logger';
// Utility function for exponential backoff delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    backoffMultiplier: 2
  };
// Generic retry wrapper
const withRetry = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName: string,
  MODULE_NAME: string = 'OperationUtils'
): Promise<T> => {
    let lastError: Error = new Error(`${operationName} failed after all retry attempts`);
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt <= config.maxRetries) {
        const delayMs = config.retryDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        Logger.error(
          MODULE_NAME,
          `${operationName} failed (attempt ${attempt}/${config.maxRetries + 1}). Retrying in ${delayMs}ms...`,
          lastError
        );
        await delay(delayMs);
      }
    }
  }
  
  Logger.error(MODULE_NAME, `${operationName} failed after ${config.maxRetries + 1} attempts`, lastError);
  throw lastError;
};

export default withRetry;