// src/lib/logger.ts

/**
 * @file Logger utility for consistent logging across the application
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  userId?: string;
  requestId?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log('error', message, error, context, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log('warn', message, undefined, context, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log('info', message, undefined, context, metadata);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log('debug', message, undefined, context, metadata);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, url: string, userId?: string, statusCode?: number): void {
    const message = `${method} ${url}`;
    const metadata = { method, url, statusCode };
    
    if (statusCode && statusCode >= 400) {
      this.error(message, undefined, 'API', metadata);
    } else {
      this.info(message, 'API', metadata);
    }
  }

  /**
   * Log database operation
   */
  dbOperation(operation: string, collection: string, duration?: number, error?: Error): void {
    const message = `DB ${operation} on ${collection}`;
    const metadata = { operation, collection, duration };
    
    if (error) {
      this.error(message, error, 'Database', metadata);
    } else {
      this.debug(message, 'Database', metadata);
    }
  }

  /**
   * Log cron job execution
   */
  cronJob(jobName: string, status: 'started' | 'completed' | 'failed', error?: Error, metadata?: Record<string, any>): void {
    const message = `Cron job ${jobName} ${status}`;
    
    if (error || status === 'failed') {
      this.error(message, error, 'Cron', metadata);
    } else {
      this.info(message, 'Cron', metadata);
    }
  }

  /**
   * Log authentication event
   */
  auth(event: 'login' | 'logout' | 'failed', userId?: string, email?: string, error?: Error): void {
    const message = `Auth ${event}`;
    const metadata = { userId, email };
    
    if (error || event === 'failed') {
      this.error(message, error, 'Auth', metadata);
    } else {
      this.info(message, 'Auth', metadata);
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    };

    // Add error details if provided
    if (error) {
      logEntry.error = error;
      if (!metadata) metadata = {};
      metadata.stack = error.stack;
      metadata.errorName = error.name;
      metadata.errorMessage = error.message;
    }

    // Add request ID if available (from middleware)
    if (typeof window !== 'undefined' && (window as any).__requestId) {
      logEntry.requestId = (window as any).__requestId;
    }

    // Console output for development
    if (this.isDevelopment) {
      this.consoleLog(logEntry);
    }

    // In production, you might want to send logs to a service
    if (this.isProduction) {
      this.productionLog(logEntry);
    }
  }

  /**
   * Console logging for development
   */
  private consoleLog(entry: LogEntry): void {
    const { level, message, timestamp, context, error, metadata } = entry;
    const contextStr = context ? `[${context}]` : '';
    const metaStr = metadata ? JSON.stringify(metadata, null, 2) : '';
    
    let logMessage = `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
    
    if (metaStr) {
      logMessage += `\n${metaStr}`;
    }

    switch (level) {
      case 'error':
        console.error(logMessage);
        if (error && error.stack) {
          console.error(error.stack);
        }
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'info':
        console.log(logMessage);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(logMessage);
        }
        break;
    }
  }

  /**
   * Production logging (could be sent to external service)
   */
  private productionLog(entry: LogEntry): void {
    // In production, you might want to:
    // - Send to a logging service (e.g., Winston, Papertrail, Loggly)
    // - Write to files
    // - Send to Elasticsearch/ELK stack
    
    // For now, we'll just log errors to console
    if (entry.level === 'error') {
      console.error(JSON.stringify(entry));
    }
  }

  /**
   * Create a child logger with context
   */
  child(context: string): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level, message, error, ctx, metadata) => {
      const fullContext = ctx ? `${context}:${ctx}` : context;
      return originalLog(level, message, error, fullContext, metadata);
    };
    
    return childLogger;
  }
}

// Create and export singleton instance
const logger = new Logger();

export default logger;

// Export convenience functions
export const logError = (message: string, error?: Error, context?: string, metadata?: Record<string, any>) => 
  logger.error(message, error, context, metadata);

export const logWarn = (message: string, context?: string, metadata?: Record<string, any>) => 
  logger.warn(message, context, metadata);

export const logInfo = (message: string, context?: string, metadata?: Record<string, any>) => 
  logger.info(message, context, metadata);

export const logDebug = (message: string, context?: string, metadata?: Record<string, any>) => 
  logger.debug(message, context, metadata);