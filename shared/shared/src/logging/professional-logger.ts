/**
 * 🚀 PROFESSIONAL LOGGING SYSTEM - UltraMarket
 * 
 * Barcha console.log statements larini almashtiruvchi professional TypeScript logger
 * Production-ready Winston logger with structured logging
 * 
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Log levels va ranglar
const logLevels = {
  error: 0,
  warn: 1, 
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green', 
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const SERVICE_NAME = process.env.SERVICE_NAME || 'ultramarket';

// Logs directory yaratish
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Professional log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
    const meta = metadata && Object.keys(metadata).length > 0 
      ? `\n📊 Metadata: ${JSON.stringify(metadata, null, 2)}`
      : '';
    
    const stackTrace = stack ? `\n📍 Stack: ${stack}` : '';
    
    return `🕐 ${timestamp} | ${level.toUpperCase().padEnd(5)} | 🏷️  ${SERVICE_NAME} | ${message}${meta}${stackTrace}`;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const meta = metadata && Object.keys(metadata).length > 0 
      ? ` 📊 ${JSON.stringify(metadata)}`
      : '';
    
    return `🕐 ${timestamp} | ${level} | 🏷️  ${SERVICE_NAME} | ${message}${meta}`;
  })
);

// File rotation transport
const createRotatingFileTransport = (filename: string, level?: string) => {
  return new DailyRotateFile({
    filename: path.join(logsDir, `%DATE%-${filename}.log`),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: logFormat,
    handleExceptions: true,
    handleRejections: true,
  });
};

// Transport yaratish
const transports: winston.transport[] = [
  // Console transport (faqat development uchun)
  ...(NODE_ENV !== 'production' ? [
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL,
    })
  ] : []),

  // File transports
  createRotatingFileTransport('combined'),
  createRotatingFileTransport('error', 'error'),
  createRotatingFileTransport('debug', 'debug'),
  
  // HTTP transport (production uchun centralized logging)
  ...(NODE_ENV === 'production' && process.env.LOG_HTTP_URL ? [
    new winston.transports.Http({
      host: process.env.LOG_HTTP_HOST,
      port: parseInt(process.env.LOG_HTTP_PORT || '80'),
      path: process.env.LOG_HTTP_PATH || '/logs',
      level: 'error',
    })
  ] : [])
];

// Professional Logger Class
export class ProfessionalLogger {
  public logger: winston.Logger;
  private serviceName: string;
  private requestId?: string;

  constructor(serviceName: string = SERVICE_NAME, requestId?: string) {
    this.serviceName = serviceName;
    this.requestId = requestId;
    
    this.logger = winston.createLogger({
      levels: logLevels,
      level: LOG_LEVEL,
      format: logFormat,
      transports,
      exitOnError: false,
      defaultMeta: {
        service: this.serviceName,
        environment: NODE_ENV,
        version: process.env.APP_VERSION || '1.0.0',
        requestId: this.requestId
      }
    });

    // Uncaught exception va unhandled rejection handling
    this.logger.exceptions.handle(
      createRotatingFileTransport('exceptions')
    );
    
    this.logger.rejections.handle(
      createRotatingFileTransport('rejections')
    );
  }

  // Info level logging
  info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, {
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Error level logging
  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    this.logger.error(message, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      ...metadata
    });
  }

  // Warning level logging  
  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, {
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Debug level logging
  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, {
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // HTTP level logging
  http(message: string, metadata?: Record<string, any>): void {
    this.logger.http(message, {
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Performance measurement
  time(label: string): void {
    console.time(`⏱️  ${this.serviceName}-${label}`);
  }

  timeEnd(label: string, metadata?: Record<string, any>): void {
    console.timeEnd(`⏱️  ${this.serviceName}-${label}`);
    this.debug(`Performance measurement: ${label}`, metadata);
  }

  // Database query logging
  database(operation: string, table: string, duration?: number, metadata?: Record<string, any>): void {
    this.debug(`🗄️  Database ${operation.toLowerCase()}`, {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
      ...metadata
    });
  }

  // Authentication logging
  auth(action: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`🔐 Auth ${action}`, {
      action,
      userId,
      ...metadata
    });
  }

  // API request logging
  apiRequest(method: string, path: string, statusCode: number, duration: number, metadata?: Record<string, any>): void {
    const level = statusCode >= 400 ? 'error' : 'info';
    this.logger.log(level, `📡 API ${method} ${path}`, {
      method,
      path, 
      statusCode,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Business logic logging
  business(event: string, metadata?: Record<string, any>): void {
    this.info(`💼 Business Event: ${event}`, metadata);
  }

  // Security event logging
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>): void {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    this.logger.log(level, `🛡️  Security Event: ${event}`, {
      severity,
      event,
      ...metadata
    });
  }
}

// Default logger instance
export const logger = new ProfessionalLogger();

// Factory function
export const createLogger = (serviceName: string, requestId?: string): ProfessionalLogger => {
  return new ProfessionalLogger(serviceName, requestId);
};

// Request logger middleware factory
export const createRequestLogger = (serviceName: string) => {
  return (req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || 
                     req.headers['requestid'] || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    req.logger = new ProfessionalLogger(serviceName, requestId);
    res.setHeader('X-Request-ID', requestId);
    
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      req.logger.apiRequest(
        req.method,
        req.originalUrl || req.url,
        res.statusCode,
        duration,
        {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.user?.id
        }
      );
    });
    
    next();
  };
};

// Console.log replacement functions (backward compatibility)
export const replaceConsole = (): void => {
  if (NODE_ENV === 'production') {
    console.log = (...args: any[]) => logger.info(args.join(' '));
    console.error = (...args: any[]) => logger.error(args.join(' '));
    console.warn = (...args: any[]) => logger.warn(args.join(' '));
    console.info = (...args: any[]) => logger.info(args.join(' '));
    console.debug = (...args: any[]) => logger.debug(args.join(' '));
  }
};

// ESLint konfiguratsiya
export const eslintRules = {
  'no-console': NODE_ENV === 'production' ? 'error' : 'warn',
  'no-debugger': NODE_ENV === 'production' ? 'error' : 'warn',
};

// Pre-commit hook function
export const validateNoConsoleInProduction = (filePath: string): boolean => {
  if (NODE_ENV !== 'production') return true;
  
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const consoleRegex = /console\.(log|error|warn|info|debug)\s*\(/g;
  const matches = content.match(consoleRegex);
  
  if (matches && matches.length > 0) {
    logger.error(`❌ Console statements found in production build: ${filePath}`, {
      matches: matches
    });
    return false;
  }
  
  return true;
};

// Graceful shutdown
export const gracefulShutdown = (): void => {
  logger.info('🛑 Shutting down logger gracefully...');
  
  // Winston transportlarni yopish
  logger.logger.close();
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

// Process event listeners
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Export qilingan default logger
export default logger; 