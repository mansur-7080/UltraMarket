/**
 * 🚀 PROFESSIONAL LOGGER - Order Service
 * 
 * Professional order management logging with business intelligence,
 * inventory tracking, and O'zbekiston e-commerce compliance
 * 
 * Version: 3.0.0 - Professional Integration
 * Date: 2024-12-28
 * Service: order-service (BUSINESS CRITICAL)
 */

import winston from 'winston';
import path from 'path';
import { randomUUID } from 'crypto';

// Professional logging levels for order management
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Professional colors for order operations
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

// Service context for order management
const SERVICE_CONTEXT = {
  service: 'order-service',
  component: 'business-core',
  version: '3.0.0',
  environment: process.env.NODE_ENV || 'development',
  businessDomain: 'e-commerce'
};

// Professional console format with order context
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const correlationId = meta.correlationId || 'no-correlation';
    const serviceInfo = `[${SERVICE_CONTEXT.service}:${SERVICE_CONTEXT.version}]`;
    const orderId = meta.orderId ? `[Order:${meta.orderId}]` : '';
    const customerId = meta.userId || meta.customerId ? `[Customer:${meta.userId || meta.customerId}]` : '';
    
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      // Clean metadata for display
      const cleanMeta = { ...meta };
      delete cleanMeta.orderId;
      delete cleanMeta.userId;
      delete cleanMeta.customerId;
      delete cleanMeta.correlationId;
      
      if (Object.keys(cleanMeta).length > 0) {
        metaString = ` ${JSON.stringify(cleanMeta)}`;
      }
    }
    
    return `${timestamp} ${serviceInfo}${orderId}${customerId} [${correlationId}] ${level}: ${message}${metaString}`;
  })
);

// Professional JSON format for order analytics
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

// Professional transports for order management
const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    format: consoleFormat,
    level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
  }),
];

// Enhanced file transports for order business intelligence
if (SERVICE_CONTEXT.environment === 'production') {
  const logDir = path.join(process.cwd(), 'logs');
  
  transports.push(
    // Critical error log for order failures
    new winston.transports.File({
      filename: path.join(logDir, 'order-service-error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 15,
      tailable: true
    }),
    // Order operations log
    new winston.transports.File({
      filename: path.join(logDir, 'order-service.log'),
      format: jsonFormat,
      maxsize: 200 * 1024 * 1024, // 200MB for business operations
      maxFiles: 10,
      tailable: true
    }),
    // Business audit log
    new winston.transports.File({
      filename: path.join(logDir, 'order-service-audit.log'),
      level: 'info',
      format: jsonFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 30, // Keep more for business compliance
      tailable: true
    }),
    // Inventory tracking log
    new winston.transports.File({
      filename: path.join(logDir, 'order-service-inventory.log'),
      level: 'info',
      format: jsonFormat,
      maxsize: 25 * 1024 * 1024, // 25MB
      maxFiles: 20,
      tailable: true
    }),
    // Customer analytics log
    new winston.transports.File({
      filename: path.join(logDir, 'order-service-analytics.log'),
      level: 'info',
      format: jsonFormat,
      maxsize: 75 * 1024 * 1024, // 75MB for analytics
      maxFiles: 12,
      tailable: true
    })
  );
}

// Professional logger instance for order management
export const logger = winston.createLogger({
  level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
  levels,
  format: jsonFormat,
  transports,
  exitOnError: false,
  defaultMeta: SERVICE_CONTEXT
});

// Professional order management logging methods
export const professionalLogger = {
  // Basic logging methods
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  verbose: (message: string, meta?: any) => logger.verbose(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  
  // Business audit logging for order operations
  audit: (action: string, details: any, userId?: string, orderId?: string) => {
    const auditData = {
      audit: true,
      action,
      details,
      userId,
      orderId,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      businessDomain: 'order-management'
    };
    logger.info(`ORDER AUDIT: ${action}`, auditData);
  },
  
  // Security logging for order operations
  security: (event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    const securityData = {
      security: true,
      event,
      details,
      severity,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    };
    logger[level](`ORDER SECURITY: ${event}`, securityData);
  },
  
  // Performance logging for order operations
  performance: (operation: string, duration: number, metadata?: any) => {
    const performanceData = {
      performance: true,
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    };
    logger.info(`ORDER PERFORMANCE: ${operation}`, performanceData);
  },
  
  // Order lifecycle logging
  order: (lifecycle: string, orderId: string, status: string, details: any, userId?: string) => {
    const orderData = {
      order: true,
      lifecycle,
      orderId,
      status,
      userId,
      details,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      businessDomain: 'order-management'
    };
    logger.info(`ORDER LIFECYCLE: ${lifecycle}`, orderData);
  },
  
  // Inventory operations logging
  inventory: (operation: string, productId: string, quantity: number, orderId: string, details?: any, userId?: string) => {
    const inventoryData = {
      inventory: true,
      operation,
      productId,
      quantity,
      orderId,
      userId,
      details,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      businessDomain: 'inventory-management'
    };
    logger.info(`INVENTORY: ${operation}`, inventoryData);
  },
  
  // Customer behavior analytics
  customer: (action: string, userId: string, orderId?: string, details?: any) => {
    const customerData = {
      customer: true,
      action,
      userId,
      orderId,
      details,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      businessDomain: 'customer-analytics'
    };
    logger.info(`CUSTOMER: ${action}`, customerData);
  },
  
  // Business intelligence logging
  business: (metric: string, value: number, dimensions: any, orderId?: string, userId?: string) => {
    const businessData = {
      business: true,
      metric,
      value,
      dimensions,
      orderId,
      userId,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      businessDomain: 'business-intelligence'
    };
    logger.info(`BUSINESS METRIC: ${metric}`, businessData);
  },
  
  // Shipping and fulfillment logging
  fulfillment: (stage: string, orderId: string, details: any, userId?: string) => {
    const fulfillmentData = {
      fulfillment: true,
      stage,
      orderId,
      userId,
      details,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      businessDomain: 'fulfillment'
    };
    logger.info(`FULFILLMENT: ${stage}`, fulfillmentData);
  },
  
  // O'zbekiston compliance and regional logging
  compliance: (complianceEvent: string, details: any, orderId?: string, userId?: string) => {
    const complianceData = {
      compliance: true,
      event: complianceEvent,
      details,
      orderId,
      userId,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      region: 'uzbekistan',
      businessDomain: 'regulatory-compliance'
    };
    logger.info(`COMPLIANCE: ${complianceEvent}`, complianceData);
  }
};

// Legacy compatibility - ensure existing code continues to work
export default logger;
