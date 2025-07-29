import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';
import { AppError } from './AppError';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_SERVER = 'INTERNAL_SERVER',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  body?: any;
  query?: any;
  params?: any;
  headers?: any;
  timestamp: Date;
  service?: string;
  version?: string;
  environment?: string;
}

// Error report interface
export interface ErrorReport {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  metadata?: Record<string, any>;
  resolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

// Error recovery strategy interface
export interface ErrorRecoveryStrategy {
  canRecover: (error: Error) => boolean;
  recover: (error: Error, context: ErrorContext) => Promise<any>;
  maxRetries: number;
  retryDelay: number;
}

// Global error handler class
export class GlobalErrorHandler {
  private errorReports: Map<string, ErrorReport> = new Map();
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  private errorCallbacks: Array<(error: ErrorReport) => void> = [];

  constructor() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.handleUncaughtException(error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.handleUnhandledRejection(reason, promise);
    });
  }

  /**
   * Add error recovery strategy
   */
  addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Add error callback
   */
  addErrorCallback(callback: (error: ErrorReport) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Handle uncaught exception
   */
  private handleUncaughtException(error: Error): void {
    const context: ErrorContext = {
      timestamp: new Date(),
      service: process.env.SERVICE_NAME || 'unknown',
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    const errorReport = this.createErrorReport(
      ErrorType.INTERNAL_SERVER,
      ErrorSeverity.CRITICAL,
      error,
      context
    );

    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
      errorId: errorReport.id,
    });

    // Notify error callbacks
    this.notifyErrorCallbacks(errorReport);

    // Exit process for uncaught exceptions
    process.exit(1);
  }

  /**
   * Handle unhandled promise rejection
   */
  private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    const context: ErrorContext = {
      timestamp: new Date(),
      service: process.env.SERVICE_NAME || 'unknown',
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    const errorReport = this.createErrorReport(
      ErrorType.INTERNAL_SERVER,
      ErrorSeverity.HIGH,
      error,
      context
    );

    logger.error('Unhandled promise rejection', {
      error: error.message,
      stack: error.stack,
      errorId: errorReport.id,
    });

    // Notify error callbacks
    this.notifyErrorCallbacks(errorReport);
  }

  /**
   * Create error report
   */
  createErrorReport(
    type: ErrorType,
    severity: ErrorSeverity,
    error: Error,
    context: ErrorContext,
    metadata?: Record<string, any>
  ): ErrorReport {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type,
      severity,
      message: error.message,
      stack: error.stack,
      context,
      metadata,
      resolved: false,
      createdAt: new Date(),
    };

    this.errorReports.set(errorReport.id, errorReport);

    // Log error based on severity
    this.logError(errorReport);

    return errorReport;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `err_${timestamp}_${random}`;
  }

  /**
   * Log error based on severity
   */
  private logError(errorReport: ErrorReport): void {
    const logData = {
      errorId: errorReport.id,
      type: errorReport.type,
      severity: errorReport.severity,
      message: errorReport.message,
      context: errorReport.context,
      metadata: errorReport.metadata,
    };

    switch (errorReport.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('Critical error occurred', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('High severity error occurred', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium severity error occurred', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('Low severity error occurred', logData);
        break;
    }
  }

  /**
   * Notify error callbacks
   */
  private notifyErrorCallbacks(errorReport: ErrorReport): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(errorReport);
      } catch (error) {
        logger.error('Error in error callback', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Try to recover from error
   */
  async tryRecover(error: Error, context: ErrorContext): Promise<any> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        let attempts = 0;

        while (attempts < strategy.maxRetries) {
          try {
            const result = await strategy.recover(error, context);

            logger.info('Error recovery successful', {
              strategy: strategy.constructor.name,
              attempts: attempts + 1,
              error: error.message,
            });

            return result;
          } catch (recoveryError) {
            attempts++;

            if (attempts < strategy.maxRetries) {
              await this.delay(strategy.retryDelay);
            } else {
              logger.error('Error recovery failed', {
                strategy: strategy.constructor.name,
                attempts,
                originalError: error.message,
                recoveryError:
                  recoveryError instanceof Error ? recoveryError.message : 'Unknown error',
              });
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): void {
    const errorReport = this.errorReports.get(errorId);
    if (errorReport) {
      errorReport.resolved = true;
      errorReport.resolvedAt = new Date();

      logger.info('Error resolved', {
        errorId,
        resolvedAt: errorReport.resolvedAt,
      });
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errorReports.size,
      resolved: 0,
      unresolved: 0,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };

    // Initialize counters
    Object.values(ErrorType).forEach((type) => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach((severity) => {
      stats.bySeverity[severity] = 0;
    });

    // Count errors
    for (const errorReport of this.errorReports.values()) {
      if (errorReport.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }

      stats.byType[errorReport.type]++;
      stats.bySeverity[errorReport.severity]++;
    }

    return stats;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorReport[] {
    return Array.from(this.errorReports.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old errors
   */
  clearOldErrors(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    // 7 days default
    const now = new Date();
    const errorIdsToDelete: string[] = [];

    for (const [id, errorReport] of this.errorReports.entries()) {
      const age = now.getTime() - errorReport.createdAt.getTime();
      if (age > maxAge) {
        errorIdsToDelete.push(id);
      }
    }

    errorIdsToDelete.forEach((id) => this.errorReports.delete(id));

    if (errorIdsToDelete.length > 0) {
      logger.info('Cleared old errors', {
        clearedCount: errorIdsToDelete.length,
        maxAge,
      });
    }
  }
}

// Express error handler middleware
export const expressErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Extract error context from request
  const context: ErrorContext = {
    userId: (req as any).user?.id,
    requestId: (req as any).requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
    timestamp: new Date(),
    service: process.env.SERVICE_NAME || 'unknown',
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Determine error type and severity
  let errorType: ErrorType;
  let errorSeverity: ErrorSeverity;

  if (error instanceof AppError) {
    errorType = ((error as any).errorCode as ErrorType) || ErrorType.INTERNAL_SERVER;
    errorSeverity = error.statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
  } else {
    errorType = ErrorType.INTERNAL_SERVER;
    errorSeverity = ErrorSeverity.HIGH;
  }

  // Create error report
  const errorReport = globalErrorHandler.createErrorReport(
    errorType,
    errorSeverity,
    error,
    context
  );

  // Try to recover from error
  globalErrorHandler.tryRecover(error, context).then((recoveryResult) => {
    if (recoveryResult) {
      return res.json(recoveryResult);
    }

    // Send error response
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: (error as any).errorCode,
          errorId: errorReport.id,
        },
      });
    }

    // Generic error response
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production' ? 'Ichki server xatosi' : error.message;

    res.status(statusCode).json({
      success: false,
      error: {
        message,
        errorId: errorReport.id,
      },
    });
  });
};

// Database error recovery strategy
export class DatabaseErrorRecoveryStrategy implements ErrorRecoveryStrategy {
  maxRetries = 3;
  retryDelay = 1000;

  canRecover(error: Error): boolean {
    return (
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET')
    );
  }

  async recover(error: Error, context: ErrorContext): Promise<any> {
    // Implement database reconnection logic
    logger.info('Attempting database recovery', {
      error: error.message,
      context: context.requestId,
    });

    // Simulate recovery attempt
    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

    // Return null if recovery fails, actual result if successful
    return null;
  }
}

// External service error recovery strategy
export class ExternalServiceErrorRecoveryStrategy implements ErrorRecoveryStrategy {
  maxRetries = 2;
  retryDelay = 2000;

  canRecover(error: Error): boolean {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    );
  }

  async recover(error: Error, context: ErrorContext): Promise<any> {
    logger.info('Attempting external service recovery', {
      error: error.message,
      context: context.requestId,
    });

    // Implement retry logic for external services
    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

    return null;
  }
}

// Rate limit error recovery strategy
export class RateLimitErrorRecoveryStrategy implements ErrorRecoveryStrategy {
  maxRetries = 1;
  retryDelay = 5000;

  canRecover(error: Error): boolean {
    return error.message.includes('rate limit') || error.message.includes('too many requests');
  }

  async recover(error: Error, context: ErrorContext): Promise<any> {
    logger.info('Attempting rate limit recovery', {
      error: error.message,
      context: context.requestId,
    });

    // Wait for rate limit to reset
    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

    return null;
  }
}

// Create global error handler instance
export const globalErrorHandler = new GlobalErrorHandler();

// Add default recovery strategies
globalErrorHandler.addRecoveryStrategy(new DatabaseErrorRecoveryStrategy());
globalErrorHandler.addRecoveryStrategy(new ExternalServiceErrorRecoveryStrategy());
globalErrorHandler.addRecoveryStrategy(new RateLimitErrorRecoveryStrategy());

// Error notification callback
globalErrorHandler.addErrorCallback((errorReport: ErrorReport) => {
  // Send critical errors to monitoring service
  if (errorReport.severity === ErrorSeverity.CRITICAL) {
    logger.error('Critical error notification', {
      errorId: errorReport.id,
      message: errorReport.message,
      service: errorReport.context.service,
    });

    // TODO: Implement external notification service
    // notificationService.sendCriticalAlert(errorReport);
  }
});

// Utility functions
export const handleAsyncError = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createAppError = (
  message: string,
  statusCode: number = 500,
  errorCode?: string
): AppError => {
  return new AppError(message, statusCode, true, errorCode);
};

export const isOperationalError = (error: Error): boolean => {
  return error instanceof AppError && error.isOperational;
};

// All classes are already exported above

export default {
  GlobalErrorHandler,
  globalErrorHandler,
  expressErrorHandler,
  handleAsyncError,
  createAppError,
  isOperationalError,
  ErrorType,
  ErrorSeverity,
};
