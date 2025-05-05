// src/utils/logger.ts

enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG'
  }
  
  class Logger {
    private static formatMessage(level: LogLevel, module: string, message: string): string {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${module}] ${message}`;
    }
  
    static info(module: string, message: string): void {
      const formattedMessage = this.formatMessage(LogLevel.INFO, module, message);
      console.log(formattedMessage);
    }
  
    static warn(module: string, message: string): void {
      const formattedMessage = this.formatMessage(LogLevel.WARN, module, message);
      console.warn(formattedMessage);
    }
  
    static error(module: string, message: string, error?: Error): void {
      const formattedMessage = this.formatMessage(LogLevel.ERROR, module, message);
      console.error(formattedMessage);
      if (error) {
        console.error(error.stack);
      }
    }
  
    static debug(module: string, message: string): void {
      if (process.env.NODE_ENV !== 'production') {
        const formattedMessage = this.formatMessage(LogLevel.DEBUG, module, message);
        console.debug(formattedMessage);
      }
    }
  }
  
  export default Logger;