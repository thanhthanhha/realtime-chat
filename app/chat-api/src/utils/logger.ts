// src/utils/logger.ts

enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG'
  }
  
  class Logger {
    private static isProduction = process.env.NODE_ENV === 'production';

    private static formatMessage(level: LogLevel, module: string, message: string): string {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${module}] ${message}`;
    }
  
    static info(module: string, message: string): void {
      if (this.isProduction) return;
      const formattedMessage = this.formatMessage(LogLevel.INFO, module, message);
      console.log(formattedMessage);
    }
  
    static warn(module: string, message: string): void {
      if (this.isProduction) return;
      const formattedMessage = this.formatMessage(LogLevel.WARN, module, message);
      console.warn(formattedMessage);
    }
  
    static error(module: string, message: string, error?: Error): void {
      if (this.isProduction) return;
      const formattedMessage = this.formatMessage(LogLevel.ERROR, module, message);
      console.error(formattedMessage);
      if (error) {
        console.error(error.stack);
      }
    }
  
    static debug(module: string, message: string): void {
      if (this.isProduction) return;
      if (process.env.LOG_LEVEL == 'DEBUG') {
        const formattedMessage = this.formatMessage(LogLevel.DEBUG, module, message);
        console.debug(formattedMessage);
      }
    }
  }
  
  export default Logger;