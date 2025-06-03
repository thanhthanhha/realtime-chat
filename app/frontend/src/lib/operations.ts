// utils/retry.ts
  export const retryWithCallback = (
    fn: () => void,
    options: RetryOptions = {}
  ) => {
    const {
      maxRetries = 3,
      delay = 1000,
      exponentialBackoff = true,
      onRetry
    } = options;
  
    let currentAttempt = 0;
  
    const attemptFunction = () => {
      try {
        fn();
      } catch (error) {
        currentAttempt++;
        
        if (currentAttempt <= maxRetries) {
          const retryDelay = exponentialBackoff 
            ? delay * currentAttempt 
            : delay;
          
          if (onRetry) {
            onRetry(currentAttempt, error);
          }
          
          setTimeout(attemptFunction, retryDelay);
        } else {
          throw new Error(`Function failed after ${maxRetries} retries. Last error: ${error}`);
        }
      }
    };
  
    attemptFunction();
  };
  

  export const retryWithPromise = async <T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      delay = 1000,
      exponentialBackoff = true,
      onRetry
    } = options;
  
    let lastError: any;
  
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const retryDelay = exponentialBackoff 
            ? delay * (attempt + 1) 
            : delay;
          
          if (onRetry) {
            onRetry(attempt + 1, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  
    throw new Error(`Function failed after ${maxRetries} retries. Last error: ${lastError}`);
  };
  
  export const retryUntilSuccess = async (
    fn: () => boolean | Promise<boolean>,
    options: RetryOptions = {}
  ): Promise<boolean> => {
    const {
      maxRetries = 3,
      delay = 1000,
      exponentialBackoff = true,
      onRetry
    } = options;
  
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        if (result) {
          return true;
        }
        
        // If function returns false (not an error), still retry
        if (attempt < maxRetries) {
          const retryDelay = exponentialBackoff 
            ? delay * (attempt + 1) 
            : delay;
          
          if (onRetry) {
            onRetry(attempt + 1, new Error('Function returned false'));
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        if (attempt < maxRetries) {
          const retryDelay = exponentialBackoff 
            ? delay * (attempt + 1) 
            : delay;
          
          if (onRetry) {
            onRetry(attempt + 1, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  
    return false;
  };
  
 