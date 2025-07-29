/**
 * UltraMarket Logger
 * Professional logging utility with structured logging and multiple transports
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

// Professional log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      service: service || process.env.SERVICE_NAME || 'ultramarket',
      environment: process.env.NODE_ENV || 'development',
      ...meta,
    };
    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const serviceName = service || process.env.SERVICE_NAME || 'ultramarket';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] [${serviceName}] ${level}: ${message} ${metaStr}`;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Daily rotate file transport for all logs
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'ultramarket-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Daily rotate file transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: logFormat,
});

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [dailyRotateTransport, errorRotateTransport],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  winstonLogger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Professional logger interface
export class Logger {
  private serviceName: string;

  constructor(serviceName?: string) {
    this.serviceName = serviceName || process.env.SERVICE_NAME || 'ultramarket';
  }

  private log(level: LogLevel, message: string, meta?: any) {
    winstonLogger.log(level, message, { service: this.serviceName, ...meta });
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error | any, meta?: any) {
    const errorMeta =
      error instanceof Error
        ? {
            error: error.message,
            stack: error.stack,
            ...meta,
          }
        : { error, ...meta };

    this.log(LogLevel.ERROR, message, errorMeta);
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  http(message: string, meta?: any) {
    this.log(LogLevel.HTTP, message, meta);
  }

  // Performance logging
  performance(operation: string, startTime: number, meta?: any) {
    const duration = Date.now() - startTime;
    this.info(`Performance: ${operation}`, {
      operation,
      duration_ms: duration,
      ...meta,
    });
  }

  // Business metrics logging
  business(event: string, data: any) {
    this.info(`Business Event: ${event}`, {
      event_type: 'business',
      event_name: event,
      ...data,
    });
  }

  // Security logging
  security(event: string, data: any) {
    this.warn(`Security Event: ${event}`, {
      event_type: 'security',
      event_name: event,
      ...data,
    });
  }

  // API request logging
  apiRequest(method: string, url: string, statusCode: number, responseTime: number, meta?: any) {
    this.http(`${method} ${url} ${statusCode}`, {
      method,
      url,
      status_code: statusCode,
      response_time_ms: responseTime,
      ...meta,
    });
  }
}

// Default logger instance
export const logger = new Logger();

// Express middleware for request logging
export const requestLoggerMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.apiRequest(req.method, req.originalUrl, res.statusCode, responseTime, {
      user_id: req.user?.id,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
    });
  });

  next();
};

export default logger;
