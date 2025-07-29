/**
 * 🚀 PROFESSIONAL LOGGER - Product Service
 * 
 * Professional logging system with structured logs, correlation tracking,
 * performance monitoring, and security audit capabilities
 * 
 * Version: 3.0.0 - Professional Integration
 * Date: 2024-12-28
 * Service: product-service
 */

import winston from 'winston';
import path from 'path';
import { randomUUID } from 'crypto';

// Professional logging levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Professional colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey'
};

winston.addColors(colors);

// Service context
const SERVICE_CONTEXT = {
  service: 'product-service',
  component: 'business',
  version: '3.0.0',
  environment: process.env.NODE_ENV || 'development'
};

// Professional console format with service context
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const correlationId = meta.correlationId || 'no-correlation';
    const serviceInfo = `[${SERVICE_CONTEXT.service}:${SERVICE_CONTEXT.version}]`;
    
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = ` ${JSON.stringify(meta)}`;
    }
    
    return `${timestamp} ${serviceInfo} [${correlationId}] ${level}: ${message}${metaString}`;
  })
);

// Professional JSON format for structured logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    return JSON.stringify({
      ...info,
      ...SERVICE_CONTEXT,
      correlationId: info.correlationId || randomUUID(),
    });
  })
);

// Professional transports
const transports: winston.transport[] = [
  // Console transport with colors
  new winston.transports.Console({
    format: consoleFormat,
    level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
  }),
];

// File transports for production
if (SERVICE_CONTEXT.environment === 'production') {
  const logDir = path.join(process.cwd(), 'logs');
  
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'product-service-error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logDir, 'product-service.log'),
      format: jsonFormat,
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 5,
      tailable: true
    }),
    // Audit log file
    new winston.transports.File({
      filename: path.join(logDir, 'product-service-audit.log'),
      level: 'info',
      format: jsonFormat,
      maxsize: 25 * 1024 * 1024, // 25MB
      maxFiles: 20,
      tailable: true
    })
  );
}

// Professional logger instance
export const logger = winston.createLogger({
  level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
  levels,
  format: jsonFormat,
  transports,
  exitOnError: false,
  defaultMeta: SERVICE_CONTEXT
});

// Professional logging methods with context
export const professionalLogger = {
  // Basic logging methods
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  verbose: (message: string, meta?: any) => logger.verbose(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  
  // Professional audit logging for business operations
  audit: (action: string, details: any, userId?: string) => {
    logger.info(`AUDIT: ${action}`, {
      audit: true,
      action,
      details,
      userId,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    });
  },
  
  // Security logging for product operations
  security: (event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    logger[level](`SECURITY: ${event}`, {
      security: true,
      event,
      details,
      severity,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    });
  },
  
  // Performance logging for database and cache operations
  performance: (operation: string, duration: number, metadata?: any) => {
    logger.info(`PERFORMANCE: ${operation}`, {
      performance: true,
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    });
  },
  
  // Business operation logging for product catalog operations
  business: (operation: string, productId: string, details: any, userId?: string) => {
    logger.info(`BUSINESS: ${operation}`, {
      business: true,
      operation,
      productId,
      userId,
      details,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    });
  },
  
  // Inventory operations logging
  inventory: (operation: string, productId: string, details: any, userId?: string) => {
    logger.info(`INVENTORY: ${operation}`, {
      inventory: true,
      operation,
      productId,
      userId,
      details,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    });
  },
  
  // Search operations logging
  search: (query: string, results: number, userId?: string, metadata?: any) => {
    logger.info(`SEARCH: Query executed`, {
      search: true,
      query,
      results,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    });
  }
};

// Legacy compatibility - ensure existing code continues to work
export default logger;
