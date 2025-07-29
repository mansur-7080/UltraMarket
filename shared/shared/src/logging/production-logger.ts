import winston from 'winston';
import * as Sentry from '@sentry/node';

export interface LogContext {
  userId?: string;
  requestId?: string;
  service?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ProductionLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'ultramarket',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10485760,
          maxFiles: 5
        })
      ]
    });

    // Add console transport for development
    if (process.env.NODE_ENV === 'development') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
    
    // Send warnings to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(message, 'warning');
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, { ...context, error: error?.stack });
    
    // Send errors to Sentry
    if (error) {
      Sentry.captureException(error, {
        tags: context,
        extra: { message }
      });
    } else {
      Sentry.captureMessage(message, 'error');
    }
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  // Track user actions
  trackUserAction(action: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      metadata
    });
  }

  // Track API calls
  trackApiCall(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'error' : 'info';
    this.logger.log(level, `${method} ${endpoint} - ${statusCode} (${duration}ms)`, {
      ...context,
      httpMethod: method,
      endpoint,
      statusCode,
      duration
    });
  }

  // Track payment events
  trackPayment(event: string, paymentId: string, amount?: number, currency?: string): void {
    this.info(`Payment event: ${event}`, {
      service: 'payment',
      action: event,
      metadata: {
        paymentId,
        amount,
        currency
      }
    });
  }

  // Track vendor events
  trackVendorEvent(event: string, vendorId: string, metadata?: Record<string, any>): void {
    this.info(`Vendor event: ${event}`, {
      service: 'vendor-management',
      action: event,
      metadata: {
        vendorId,
        ...metadata
      }
    });
  }
}

export const productionLogger = new ProductionLogger();

// Export convenience methods
export const logInfo = (message: string, context?: LogContext) => productionLogger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => productionLogger.warn(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) => productionLogger.error(message, error, context);
export const logDebug = (message: string, context?: LogContext) => productionLogger.debug(message, context);

export const trackUserAction = (action: string, userId?: string, metadata?: Record<string, any>) => 
  productionLogger.trackUserAction(action, userId, metadata);

export const trackApiCall = (method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext) =>
  productionLogger.trackApiCall(method, endpoint, statusCode, duration, context);

export const trackPayment = (event: string, paymentId: string, amount?: number, currency?: string) =>
  productionLogger.trackPayment(event, paymentId, amount, currency);

export const trackVendorEvent = (event: string, vendorId: string, metadata?: Record<string, any>) =>
  productionLogger.trackVendorEvent(event, vendorId, metadata);