/**
 * 🚀 PROFESSIONAL LOGGER - Payment Service
 * 
 * Critical payment operations logging with enhanced security, audit trails,
 * and O'zbekiston financial compliance monitoring
 * 
 * Version: 3.0.0 - Professional Integration
 * Date: 2024-12-28
 * Service: payment-service (CRITICAL FINANCIAL SYSTEM)
 */

import winston from 'winston';
import path from 'path';
import { randomUUID } from 'crypto';

// Professional logging levels with financial operations focus
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Professional colors for payment operations
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

// Service context for payment operations
const SERVICE_CONTEXT = {
  service: 'payment-service',
  component: 'business-critical',
  version: '3.0.0',
  environment: process.env.NODE_ENV || 'development',
  complianceLevel: 'financial-grade'
};

// Professional console format with payment context
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const correlationId = meta.correlationId || 'no-correlation';
    const serviceInfo = `[${SERVICE_CONTEXT.service}:${SERVICE_CONTEXT.version}]`;
    const paymentId = meta.paymentId ? `[Payment:${meta.paymentId}]` : '';
    
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      // Mask sensitive payment data in logs
      const safeMeta = maskSensitivePaymentData(meta);
      metaString = ` ${JSON.stringify(safeMeta)}`;
    }
    
    return `${timestamp} ${serviceInfo}${paymentId} [${correlationId}] ${level}: ${message}${metaString}`;
  })
);

// Professional JSON format with payment security
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Mask sensitive financial data before logging
    const safeInfo = maskSensitivePaymentData(info);
    return JSON.stringify({
      ...safeInfo,
      ...SERVICE_CONTEXT,
      correlationId: info.correlationId || randomUUID(),
    });
  })
);

// Mask sensitive payment data for security
function maskSensitivePaymentData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'cardNumber', 'cvv', 'cardToken', 'bankAccount', 'routingNumber',
    'password', 'secret', 'key', 'token', 'apiKey', 'merchantSecret',
    'clientSecret', 'refreshToken', 'accessToken', 'webhookSecret'
  ];
  
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      if (typeof masked[key] === 'string' && masked[key].length > 4) {
        // Show only last 4 characters for payment cards
        if (key.toLowerCase().includes('card')) {
          masked[key] = `****-****-****-${masked[key].slice(-4)}`;
        } else {
          masked[key] = '***MASKED***';
        }
      } else {
        masked[key] = '***MASKED***';
      }
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitivePaymentData(masked[key]);
    }
  });
  
  return masked;
}

// Professional transports with enhanced security
const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    format: consoleFormat,
    level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
  }),
];

// Enhanced file transports for financial compliance
if (SERVICE_CONTEXT.environment === 'production') {
  const logDir = path.join(process.cwd(), 'logs');
  
  transports.push(
    // Critical error log for payment failures
    new winston.transports.File({
      filename: path.join(logDir, 'payment-service-error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 100 * 1024 * 1024, // 100MB for critical payment errors
      maxFiles: 20,
      tailable: true
    }),
    // Payment operations log
    new winston.transports.File({
      filename: path.join(logDir, 'payment-service.log'),
      format: jsonFormat,
      maxsize: 200 * 1024 * 1024, // 200MB for payment operations
      maxFiles: 10,
      tailable: true
    }),
    // Financial audit log (separate for compliance)
    new winston.transports.File({
      filename: path.join(logDir, 'payment-service-audit.log'),
      level: 'info',
      format: jsonFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 50, // Keep more audit logs for compliance
      tailable: true
    }),
    // Security events log
    new winston.transports.File({
      filename: path.join(logDir, 'payment-service-security.log'),
      level: 'warn',
      format: jsonFormat,
      maxsize: 25 * 1024 * 1024, // 25MB
      maxFiles: 100, // Keep extensive security logs
      tailable: true
    })
  );
}

// Professional logger instance with financial compliance
export const logger = winston.createLogger({
  level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
  levels,
  format: jsonFormat,
  transports,
  exitOnError: false,
  defaultMeta: SERVICE_CONTEXT
});

// Professional payment logging methods with enhanced security
export const professionalLogger = {
  // Basic logging methods
  error: (message: string, meta?: any) => logger.error(message, maskSensitivePaymentData(meta)),
  warn: (message: string, meta?: any) => logger.warn(message, maskSensitivePaymentData(meta)),
  info: (message: string, meta?: any) => logger.info(message, maskSensitivePaymentData(meta)),
  http: (message: string, meta?: any) => logger.http(message, maskSensitivePaymentData(meta)),
  verbose: (message: string, meta?: any) => logger.verbose(message, maskSensitivePaymentData(meta)),
  debug: (message: string, meta?: any) => logger.debug(message, maskSensitivePaymentData(meta)),
  
  // Financial audit logging (CRITICAL for compliance)
  audit: (action: string, details: any, userId?: string, paymentId?: string) => {
    const auditData = {
      audit: true,
      action,
      details: maskSensitivePaymentData(details),
      userId,
      paymentId,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      complianceLevel: 'financial-audit'
    };
    logger.info(`FINANCIAL AUDIT: ${action}`, auditData);
  },
  
  // Security logging for payment operations
  security: (event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'high') => {
    const level = severity === 'critical' ? 'error' : 'warn';
    const securityData = {
      security: true,
      event,
      details: maskSensitivePaymentData(details),
      severity,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      complianceLevel: 'payment-security'
    };
    logger[level](`PAYMENT SECURITY: ${event}`, securityData);
  },
  
  // Performance logging for payment operations
  performance: (operation: string, duration: number, metadata?: any) => {
    const performanceData = {
      performance: true,
      operation,
      duration,
      metadata: maskSensitivePaymentData(metadata),
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service
    };
    logger.info(`PAYMENT PERFORMANCE: ${operation}`, performanceData);
  },
  
  // Payment transaction logging
  transaction: (transactionType: string, paymentId: string, amount?: number, currency?: string, details?: any, userId?: string) => {
    const transactionData = {
      transaction: true,
      type: transactionType,
      paymentId,
      amount,
      currency,
      userId,
      details: maskSensitivePaymentData(details),
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      complianceLevel: 'financial-transaction'
    };
    logger.info(`TRANSACTION: ${transactionType}`, transactionData);
  },
  
  // Gateway operations logging (Click, Payme, etc.)
  gateway: (gateway: string, operation: string, paymentId: string, details: any, userId?: string) => {
    const gatewayData = {
      gateway: true,
      gatewayProvider: gateway,
      operation,
      paymentId,
      userId,
      details: maskSensitivePaymentData(details),
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      region: 'uzbekistan'
    };
    logger.info(`GATEWAY [${gateway}]: ${operation}`, gatewayData);
  },
  
  // O'zbekiston compliance logging
  compliance: (complianceEvent: string, details: any, paymentId?: string, userId?: string) => {
    const complianceData = {
      compliance: true,
      event: complianceEvent,
      details: maskSensitivePaymentData(details),
      paymentId,
      userId,
      timestamp: new Date().toISOString(),
      service: SERVICE_CONTEXT.service,
      region: 'uzbekistan',
      complianceLevel: 'regulatory'
    };
    logger.info(`COMPLIANCE: ${complianceEvent}`, complianceData);
  }
};

// Legacy compatibility - ensure existing code continues to work
export default logger;
