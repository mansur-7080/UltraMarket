/**
 * Professional Logger System - Console.log Replacement
 * UltraMarket E-commerce Platform
 * 
 * Bu fayl barcha console.log statements ni almashtirish uchun ishlatiladi
 */

import winston from 'winston';

// Professional logger configuration
export const createLogger = (serviceName: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const logData = {
          timestamp,
          level: level.toUpperCase(),
          service: serviceName,
          message,
          ...(stack && { stack }),
          ...meta
        };
        return JSON.stringify(logData);
      })
    ),
    transports: [
      // Console transport faqat development uchun
      ...(process.env.NODE_ENV !== 'production' ? [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ] : []),
      
      // File transport barcha environment lar uchun
      new winston.transports.File({
        filename: `logs/${serviceName}/error.log`,
        level: 'error',
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5,
        tailable: true
      }),
      
      new winston.transports.File({
        filename: `logs/${serviceName}/combined.log`,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10,
        tailable: true
      })
    ],
    exitOnError: false
  });
};

// ❌ NOTO'G'RI - Console.log ishlatish
// console.log('User created:', userData);
// console.error('Database error:', error);

// ✅ TO'G'RI - Professional logging
export class ProductionLogger {
  private logger: winston.Logger;
  
  constructor(serviceName: string) {
    this.logger = createLogger(serviceName);
  }

  // Info level logging
  info(message: string, meta?: Record<string, any>) {
    this.logger.info(message, {
      requestId: this.generateRequestId(),
      ...meta
    });
  }

  // Error level logging
  error(message: string, error?: Error, meta?: Record<string, any>) {
    this.logger.error(message, {
      requestId: this.generateRequestId(),
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
  }

  // Warning level logging
  warn(message: string, meta?: Record<string, any>) {
    this.logger.warn(message, {
      requestId: this.generateRequestId(),
      ...meta
    });
  }

  // Debug level logging (faqat development da)
  debug(message: string, meta?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(message, {
        requestId: this.generateRequestId(),
        ...meta
      });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Service-specific loggers
export const authLogger = new ProductionLogger('auth-service');
export const productLogger = new ProductionLogger('product-service');
export const orderLogger = new ProductionLogger('order-service');
export const paymentLogger = new ProductionLogger('payment-service');

// ESLint rule to prevent console.log in production
// .eslintrc.js ga qo'shish kerak:
/*
module.exports = {
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  }
};
*/

// Pre-commit hook - console.log ni tekshirish
export const validateNoConsoleLog = (filePath: string): boolean => {
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const consoleRegex = /console\.(log|error|warn|info|debug)/g;
  const matches = content.match(consoleRegex);
  
  if (matches && matches.length > 0) {
    console.error(`❌ Console statements found in ${filePath}:`);
    matches.forEach(match => console.error(`  - ${match}`));
    return false;
  }
  
  return true;
}; 