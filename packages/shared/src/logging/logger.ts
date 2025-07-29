/**
 * 🚀 ULTRAMARKET SHARED LOGGER
 * Centralized logging utility for all microservices
 */

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export interface LogContext {
  service?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface Logger {
  error(message: string, error?: Error, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

class ConsoleLogger implements Logger {
  private service: string;

  constructor(service: string = 'unknown') {
    this.service = service;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.service}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorInfo = error ? ` - ${error.message}` : '';
    console.error(this.formatMessage('ERROR', message + errorInfo, context));
    if (error?.stack) {
      console.error(error.stack);
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('INFO', message, context));
  }

  debug(message: string, context?: LogContext): void {
    console.debug(this.formatMessage('DEBUG', message, context));
  }
}

// Create default logger instance
export const logger = new ConsoleLogger();

// Factory function to create service-specific loggers
export function createLogger(service: string): Logger {
  return new ConsoleLogger(service);
}

// Export types
// export type { LogContext };
