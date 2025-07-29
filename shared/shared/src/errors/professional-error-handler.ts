/**
 * 🚨 PROFESSIONAL ERROR HANDLER - ULTRAMARKET
 * 
 * Unified error handling system across all microservices
 * Standardizes error responses, logging, and monitoring
 * 
 * @author UltraMarket Development Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/professional-logger';
import EventEmitter from 'events';

/**
 * Professional Error Codes Enumeration
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  INVALID_PHONE_FORMAT = 'INVALID_PHONE_FORMAT',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  
  // Business Logic Errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CART_EMPTY = 'CART_EMPTY',
  
  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Technical Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Security Errors
  CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error Categories
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  SECURITY = 'security',
  NETWORK = 'network',
  DATABASE = 'database'
}

/**
 * Professional Error Interface
 */
export interface ProfessionalErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  field?: string;
  value?: any;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: string;
  requestId?: string;
  userId?: string;
  traceId?: string;
  suggestions?: string[];
  documentation?: string;
}

/**
 * Professional Error Response Interface
 */
export interface ErrorResponse {
  success: false;
  error: ProfessionalErrorDetails;
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
    endpoint: string;
    method: string;
  };
}

/**
 * Professional Application Error Class
 */
export class ProfessionalError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly details: Record<string, any>;
  public readonly field?: string;
  public readonly value?: any;
  public readonly suggestions: string[];
  public readonly documentation?: string;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly traceId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      details?: Record<string, any>;
      field?: string;
      value?: any;
      suggestions?: string[];
      documentation?: string;
      requestId?: string;
      userId?: string;
      traceId?: string;
      cause?: Error;
    } = {}
  ) {
    super(message);
    
    this.name = 'ProfessionalError';
    this.code = code;
    this.statusCode = statusCode;
    this.severity = options.severity || this.determineSeverity(statusCode);
    this.category = options.category || this.determineCategory(code);
    this.details = options.details || {};
    this.field = options.field;
    this.value = options.value;
    this.suggestions = options.suggestions || [];
    this.documentation = options.documentation;
    this.timestamp = new Date().toISOString();
    this.requestId = options.requestId;
    this.userId = options.userId;
    this.traceId = options.traceId;

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProfessionalError);
    }

    // Include original error if provided
    if (options.cause) {
      this.stack += `\nCaused by: ${options.cause.stack}`;
    }
  }

  private determineSeverity(statusCode: number): ErrorSeverity {
    if (statusCode >= 500) return ErrorSeverity.CRITICAL;
    if (statusCode >= 400) return ErrorSeverity.HIGH;
    if (statusCode >= 300) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  private determineCategory(code: ErrorCode): ErrorCategory {
    const codeStr = code.toString();
    
    if (codeStr.startsWith('AUTH_')) return ErrorCategory.AUTHENTICATION;
    if (codeStr.includes('PERMISSION')) return ErrorCategory.AUTHORIZATION;
    if (codeStr.includes('VALIDATION') || codeStr.includes('INVALID')) return ErrorCategory.VALIDATION;
    if (codeStr.includes('DATABASE')) return ErrorCategory.DATABASE;
    if (codeStr.includes('SECURITY') || codeStr.includes('CSRF') || codeStr.includes('SUSPICIOUS')) return ErrorCategory.SECURITY;
    if (codeStr.includes('NETWORK') || codeStr.includes('TIMEOUT')) return ErrorCategory.NETWORK;
    if (codeStr.includes('NOT_FOUND') || codeStr.includes('INSUFFICIENT')) return ErrorCategory.BUSINESS_LOGIC;
    
    return ErrorCategory.SYSTEM;
  }

  public toJSON(): ProfessionalErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      field: this.field,
      value: this.value,
      severity: this.severity,
      category: this.category,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      traceId: this.traceId,
      suggestions: this.suggestions,
      documentation: this.documentation
    };
  }
}

/**
 * Professional Error Manager
 */
export class ProfessionalErrorManager extends EventEmitter {
  private static instance: ProfessionalErrorManager;
  private errorCounts = new Map<ErrorCode, number>();
  private recentErrors: Array<{ error: ProfessionalError; timestamp: number }> = [];
  private maxRecentErrors = 1000;

  private constructor() {
    super();
    this.setupErrorTracking();
  }

  public static getInstance(): ProfessionalErrorManager {
    if (!ProfessionalErrorManager.instance) {
      ProfessionalErrorManager.instance = new ProfessionalErrorManager();
    }
    return ProfessionalErrorManager.instance;
  }

  /**
   * Create professional error with context
   */
  public createError(
    code: ErrorCode,
    message: string,
    statusCode?: number,
    options?: Parameters<typeof ProfessionalError.prototype.constructor>[3]
  ): ProfessionalError {
    const error = new ProfessionalError(code, message, statusCode, options);
    this.trackError(error);
    return error;
  }

  /**
   * Professional Express error middleware
   */
  public getExpressErrorHandler() {
    return (
      error: Error | ProfessionalError,
      req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      // Generate request ID if not present
      const requestId = req.headers['x-request-id'] as string || 
                       this.generateRequestId();

      let professionalError: ProfessionalError;

      // Convert regular errors to professional errors
      if (error instanceof ProfessionalError) {
        professionalError = error;
        professionalError.requestId = requestId;
      } else {
        // Handle different types of errors
        professionalError = this.convertToProfessionalError(error, requestId);
      }

      // Add request context
      professionalError.details.request = {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Track and log error
      this.trackError(professionalError);
      this.logError(professionalError, req);

      // Send error response
      this.sendErrorResponse(res, professionalError);

      // Emit error event for monitoring
      this.emit('error', { error: professionalError, request: req });
    };
  }

  /**
   * Async error wrapper for route handlers
   */
  public asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        // Add request context to error
        if (error instanceof ProfessionalError) {
          error.requestId = req.headers['x-request-id'] as string || 
                           this.generateRequestId();
        }
        next(error);
      });
    };
  }

  /**
   * Validation error creator
   */
  public createValidationError(
    field: string,
    value: any,
    message: string,
    suggestions: string[] = []
  ): ProfessionalError {
    return this.createError(
      ErrorCode.VALIDATION_ERROR,
      message,
      400,
      {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        field,
        value,
        suggestions: suggestions.length > 0 ? suggestions : [
          `Please provide a valid ${field}`,
          'Check the API documentation for correct format',
          'Contact support if the issue persists'
        ]
      }
    );
  }

  /**
   * Authentication error creator
   */
  public createAuthError(
    message: string = 'Authentication required',
    code: ErrorCode = ErrorCode.AUTH_TOKEN_MISSING
  ): ProfessionalError {
    return this.createError(
      code,
      message,
      401,
      {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        suggestions: [
          'Provide a valid authentication token',
          'Check if your session has expired',
          'Login again if necessary'
        ]
      }
    );
  }

  /**
   * Authorization error creator
   */
  public createAuthorizationError(
    message: string = 'Insufficient permissions'
  ): ProfessionalError {
    return this.createError(
      ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      message,
      403,
      {
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        suggestions: [
          'Contact administrator for required permissions',
          'Check your user role and permissions',
          'Ensure you are accessing the correct resource'
        ]
      }
    );
  }

  /**
   * Business logic error creator
   */
  public createBusinessError(
    code: ErrorCode,
    message: string,
    details?: Record<string, any>
  ): ProfessionalError {
    return this.createError(
      code,
      message,
      400,
      {
        category: ErrorCategory.BUSINESS_LOGIC,
        severity: ErrorSeverity.MEDIUM,
        details
      }
    );
  }

  /**
   * System error creator
   */
  public createSystemError(
    message: string = 'Internal server error',
    originalError?: Error
  ): ProfessionalError {
    return this.createError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      500,
      {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        cause: originalError
      }
    );
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByCode: Array<{ code: ErrorCode; count: number }>;
    errorsByCategory: Array<{ category: ErrorCategory; count: number }>;
    errorsBySeverity: Array<{ severity: ErrorSeverity; count: number }>;
    recentErrorsCount: number;
    topErrors: Array<{ code: ErrorCode; count: number; percentage: number }>;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    
    const errorsByCode = Array.from(this.errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    const errorsByCategory = new Map<ErrorCategory, number>();
    const errorsBySeverity = new Map<ErrorSeverity, number>();

    this.recentErrors.forEach(({ error }) => {
      const categoryCount = errorsByCategory.get(error.category) || 0;
      errorsByCategory.set(error.category, categoryCount + 1);
      
      const severityCount = errorsBySeverity.get(error.severity) || 0;
      errorsBySeverity.set(error.severity, severityCount + 1);
    });

    const topErrors = errorsByCode.slice(0, 10).map(({ code, count }) => ({
      code,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
    }));

    return {
      totalErrors,
      errorsByCode,
      errorsByCategory: Array.from(errorsByCategory.entries()).map(([category, count]) => ({ category, count })),
      errorsBySeverity: Array.from(errorsBySeverity.entries()).map(([severity, count]) => ({ severity, count })),
      recentErrorsCount: this.recentErrors.length,
      topErrors
    };
  }

  /**
   * Health check for error handling system
   */
  public healthCheck(): {
    healthy: boolean;
    errorRate: number;
    criticalErrors: number;
    recentErrors: number;
  } {
    const now = Date.now();
    const last5Minutes = now - (5 * 60 * 1000);
    
    const recentErrors = this.recentErrors.filter(({ timestamp }) => timestamp > last5Minutes);
    const criticalErrors = recentErrors.filter(({ error }) => error.severity === ErrorSeverity.CRITICAL).length;
    
    const errorRate = recentErrors.length / 5; // Errors per minute
    const healthy = errorRate < 10 && criticalErrors < 5; // Thresholds

    return {
      healthy,
      errorRate,
      criticalErrors,
      recentErrors: recentErrors.length
    };
  }

  // Private helper methods
  private setupErrorTracking(): void {
    // Cleanup old errors every hour
    setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      this.recentErrors = this.recentErrors.filter(({ timestamp }) => timestamp > oneHourAgo);
      
      logger.debug('🧹 Error tracking cleanup completed', {
        remainingErrors: this.recentErrors.length
      });
      
    }, 60 * 60 * 1000);
  }

  private trackError(error: ProfessionalError): void {
    // Update error counts
    const currentCount = this.errorCounts.get(error.code) || 0;
    this.errorCounts.set(error.code, currentCount + 1);

    // Add to recent errors
    this.recentErrors.push({ error, timestamp: Date.now() });
    
    // Maintain max recent errors limit
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(-this.maxRecentErrors);
    }

    // Emit tracking event
    this.emit('error-tracked', { error });
  }

  private logError(error: ProfessionalError, req?: Request): void {
    const logData = {
      errorCode: error.code,
      message: error.message,
      severity: error.severity,
      category: error.category,
      statusCode: error.statusCode,
      requestId: error.requestId,
      userId: error.userId,
      traceId: error.traceId,
      field: error.field,
      value: error.value,
      details: error.details,
      stack: error.stack,
      ...(req && {
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      })
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('🚨 CRITICAL ERROR', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('❌ HIGH SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('⚠️ MEDIUM SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('ℹ️ LOW SEVERITY ERROR', logData);
        break;
    }
  }

  private sendErrorResponse(res: Response, error: ProfessionalError): void {
    // Don't expose internal details in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        category: error.category,
        timestamp: error.timestamp,
        requestId: error.requestId,
        field: error.field,
        suggestions: error.suggestions,
        documentation: error.documentation,
        ...((!isProduction || error.severity !== ErrorSeverity.CRITICAL) && {
          details: error.details,
          value: error.value,
          userId: error.userId,
          traceId: error.traceId
        })
      },
      meta: {
        requestId: error.requestId || 'unknown',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        endpoint: res.req?.url || 'unknown',
        method: res.req?.method || 'unknown'
      }
    };

    res.status(error.statusCode).json(errorResponse);
  }

  private convertToProfessionalError(error: Error, requestId: string): ProfessionalError {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return this.createValidationError('validation', error.message, error.message);
    }

    if (error.name === 'CastError') {
      return this.createValidationError('cast', error.message, 'Invalid data format');
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return this.createError(
        ErrorCode.DATABASE_ERROR,
        'Database operation failed',
        500,
        {
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.HIGH,
          details: { originalError: error.message },
          requestId
        }
      );
    }

    if (error.name === 'TimeoutError') {
      return this.createError(
        ErrorCode.TIMEOUT_ERROR,
        'Operation timed out',
        408,
        {
          category: ErrorCategory.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          requestId
        }
      );
    }

    // Default to system error
    return this.createSystemError(error.message, error);
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

// Export singleton instance and convenience functions
export const professionalErrorManager = ProfessionalErrorManager.getInstance();

// Convenience error creators
export const createValidationError = professionalErrorManager.createValidationError.bind(professionalErrorManager);
export const createAuthError = professionalErrorManager.createAuthError.bind(professionalErrorManager);
export const createAuthorizationError = professionalErrorManager.createAuthorizationError.bind(professionalErrorManager);
export const createBusinessError = professionalErrorManager.createBusinessError.bind(professionalErrorManager);
export const createSystemError = professionalErrorManager.createSystemError.bind(professionalErrorManager);

// Middleware exports
export const errorHandler = professionalErrorManager.getExpressErrorHandler();
export const asyncHandler = professionalErrorManager.asyncHandler.bind(professionalErrorManager);

// Error manager events for monitoring integration
professionalErrorManager.on('error', ({ error, request }) => {
  // Integration point for external monitoring services
  if (error.severity === ErrorSeverity.CRITICAL) {
    // Send to alerting system
    logger.error('🚨 CRITICAL ERROR ALERT', {
      error: error.toJSON(),
      request: {
        method: request.method,
        url: request.url,
        ip: request.ip
      }
    });
  }
});

logger.info('🏗️ Professional Error Handler loaded', {
  version: '3.0.0',
  features: [
    'Standardized error codes',
    'Severity-based categorization',
    'Request context tracking', 
    'Error statistics',
    'Security-aware logging',
    'Monitoring integration',
    'Async error handling',
    'Professional error responses'
  ]
}); 