/**
 * 🚨 Ultra Professional Error Handling System
 * UltraMarket E-commerce Platform
 * 
 * Bu fayl barcha application errors ni professional tarzda handle qiladi
 * va comprehensive error reporting, monitoring va recovery ni ta'minlaydi
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { MongoError } from 'mongodb';
import { ValidationError } from 'joi';

/**
 * 🎯 Error Types
 */
export type UltraErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'CONFLICT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'BUSINESS_LOGIC_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'BAD_REQUEST_ERROR'
  | 'PAYMENT_ERROR'
  | 'FILE_UPLOAD_ERROR'
  | 'CONFIGURATION_ERROR';

/**
 * 🚨 Ultra Professional Error Class
 */
export class UltraProfessionalError extends Error {
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly sessionId?: string;
  public readonly traceId?: string;
  
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly errorType: UltraErrorType = 'INTERNAL_SERVER_ERROR',
    public readonly code: string = 'UNKNOWN_ERROR',
    public readonly details?: any,
    public readonly originalError?: Error,
    public readonly isOperational: boolean = true,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'UltraProfessionalError';
    this.timestamp = new Date();
    
    // Capture stack trace
    Error.captureStackTrace(this, UltraProfessionalError);
  }
  
  /**
   * 📝 Convert to JSON for logging/response
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorType: this.errorType,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      sessionId: this.sessionId,
      traceId: this.traceId,
      isOperational: this.isOperational,
      context: this.context,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
  
  /**
   * 📱 Convert to client response format
   */
  public toClientResponse(): Record<string, any> {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        type: this.errorType,
        timestamp: this.timestamp,
        ...(process.env.NODE_ENV === 'development' && { details: this.details })
      }
    };
  }
}

/**
 * 🔍 Validation Error
 */
export class UltraValidationError extends UltraProfessionalError {
  constructor(
    message: string = 'Validation failed',
    details?: any,
    originalError?: Error
  ) {
    super(message, 400, 'VALIDATION_ERROR', 'VALIDATION_FAILED', details, originalError);
  }
}

/**
 * 🔐 Authentication Error
 */
export class UltraAuthenticationError extends UltraProfessionalError {
  constructor(
    message: string = 'Authentication required',
    code: string = 'AUTH_REQUIRED',
    details?: any
  ) {
    super(message, 401, 'AUTHENTICATION_ERROR', code, details);
  }
}

/**
 * 🚫 Authorization Error
 */
export class UltraAuthorizationError extends UltraProfessionalError {
  constructor(
    message: string = 'Insufficient permissions',
    code: string = 'INSUFFICIENT_PERMISSIONS',
    details?: any
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR', code, details);
  }
}

/**
 * 🔍 Not Found Error
 */
export class UltraNotFoundError extends UltraProfessionalError {
  constructor(
    resource: string = 'Resource',
    identifier?: string | number,
    details?: any
  ) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(message, 404, 'NOT_FOUND_ERROR', 'RESOURCE_NOT_FOUND', details);
  }
}

/**
 * ⚔️ Conflict Error
 */
export class UltraConflictError extends UltraProfessionalError {
  constructor(
    message: string = 'Resource conflict',
    code: string = 'RESOURCE_CONFLICT',
    details?: any
  ) {
    super(message, 409, 'CONFLICT_ERROR', code, details);
  }
}

/**
 * 🚦 Rate Limit Error
 */
export class UltraRateLimitError extends UltraProfessionalError {
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    details?: any
  ) {
    super(message, 429, 'RATE_LIMIT_ERROR', 'RATE_LIMIT_EXCEEDED', 
      { ...details, retryAfter });
  }
}

/**
 * 🗄️ Database Error
 */
export class UltraDatabaseError extends UltraProfessionalError {
  constructor(
    message: string = 'Database operation failed',
    operation: string,
    originalError?: Error,
    details?: any
  ) {
    super(message, 500, 'DATABASE_ERROR', 'DATABASE_OPERATION_FAILED', 
      { operation, ...details }, originalError);
  }
}

/**
 * 🌐 External Service Error
 */
export class UltraExternalServiceError extends UltraProfessionalError {
  constructor(
    service: string,
    message: string = 'External service error',
    statusCode: number = 502,
    originalError?: Error,
    details?: any
  ) {
    super(message, statusCode, 'EXTERNAL_SERVICE_ERROR', 'EXTERNAL_SERVICE_FAILED',
      { service, ...details }, originalError);
  }
}

/**
 * 💼 Business Logic Error
 */
export class UltraBusinessLogicError extends UltraProfessionalError {
  constructor(
    message: string,
    code: string = 'BUSINESS_RULE_VIOLATION',
    details?: any
  ) {
    super(message, 400, 'BUSINESS_LOGIC_ERROR', code, details);
  }
}

/**
 * 💳 Payment Error
 */
export class UltraPaymentError extends UltraProfessionalError {
  constructor(
    message: string,
    paymentProvider: 'CLICK' | 'PAYME' | 'UZCARD',
    code: string = 'PAYMENT_FAILED',
    details?: any,
    originalError?: Error
  ) {
    super(message, 402, 'PAYMENT_ERROR', code, 
      { paymentProvider, ...details }, originalError);
  }
}

/**
 * 📁 File Upload Error
 */
export class UltraFileUploadError extends UltraProfessionalError {
  constructor(
    message: string = 'File upload failed',
    code: string = 'FILE_UPLOAD_FAILED',
    details?: any,
    originalError?: Error
  ) {
    super(message, 400, 'FILE_UPLOAD_ERROR', code, details, originalError);
  }
}

/**
 * 🔧 Configuration Error
 */
export class UltraConfigurationError extends UltraProfessionalError {
  constructor(
    message: string = 'Configuration error',
    configKey?: string,
    details?: any
  ) {
    super(message, 500, 'CONFIGURATION_ERROR', 'INVALID_CONFIGURATION',
      { configKey, ...details });
  }
}

/**
 * 🏭 Ultra Professional Error Handler
 */
export class UltraProfessionalErrorHandler {
  private static instance: UltraProfessionalErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: UltraProfessionalError[] = [];
  private maxLastErrors = 100;
  
  /**
   * 🏭 Singleton pattern
   */
  public static getInstance(): UltraProfessionalErrorHandler {
    if (!UltraProfessionalErrorHandler.instance) {
      UltraProfessionalErrorHandler.instance = new UltraProfessionalErrorHandler();
    }
    return UltraProfessionalErrorHandler.instance;
  }
  
  /**
   * 🔄 Transform known errors to UltraProfessionalError
   */
  public transformError(error: any, context?: Record<string, any>): UltraProfessionalError {
    // Already an UltraProfessionalError
    if (error instanceof UltraProfessionalError) {
      return error;
    }
    
    // Zod validation errors
    if (error instanceof ZodError) {
      return new UltraValidationError(
        'Input validation failed',
        {
          issues: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          }))
        },
        error
      );
    }
    
    // Joi validation errors
    if (error instanceof ValidationError) {
      return new UltraValidationError(
        error.message,
        {
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          }))
        },
        error
      );
    }
    
    // Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      return this.transformPrismaError(error);
    }
    
    if (error instanceof PrismaClientValidationError) {
      return new UltraValidationError(
        'Database validation error',
        { prismaError: error.message },
        error
      );
    }
    
    // MongoDB errors
    if (error instanceof MongoError) {
      return this.transformMongoError(error);
    }
    
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return new UltraAuthenticationError(
        'Invalid token',
        'INVALID_TOKEN',
        { jwtError: error.message }
      );
    }
    
    if (error.name === 'TokenExpiredError') {
      return new UltraAuthenticationError(
        'Token expired',
        'TOKEN_EXPIRED',
        { jwtError: error.message }
      );
    }
    
    // HTTP errors (from external services)
    if (error.response) {
      return new UltraExternalServiceError(
        'Unknown Service',
        error.message || 'External service error',
        error.response.status || 502,
        error,
        {
          url: error.config?.url,
          method: error.config?.method,
          data: error.response.data
        }
      );
    }
    
    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new UltraProfessionalError(
        'Network connection failed',
        503,
        'NETWORK_ERROR',
        'CONNECTION_FAILED',
        { networkError: error.code },
        error
      );
    }
    
    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return new UltraProfessionalError(
        'Operation timed out',
        408,
        'TIMEOUT_ERROR',
        'OPERATION_TIMEOUT',
        undefined,
        error
      );
    }
    
    // Generic error
    return new UltraProfessionalError(
      error.message || 'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      'UNKNOWN_ERROR',
      context,
      error,
      false // Non-operational since it's unexpected
    );
  }
  
  /**
   * 🎯 Transform Prisma errors
   */
  private transformPrismaError(error: PrismaClientKnownRequestError): UltraProfessionalError {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return new UltraConflictError(
          'A record with this value already exists',
          'DUPLICATE_RECORD',
          {
            fields: error.meta?.target,
            prismaCode: error.code
          }
        );
      
      case 'P2025': // Record not found
        return new UltraNotFoundError(
          'Record',
          undefined,
          {
            cause: error.meta?.cause,
            prismaCode: error.code
          }
        );
      
      case 'P2003': // Foreign key constraint violation
        return new UltraValidationError(
          'Referenced record does not exist',
          {
            field: error.meta?.field_name,
            prismaCode: error.code
          },
          error
        );
      
      case 'P2014': // Required relation violation
        return new UltraValidationError(
          'Required relation missing',
          {
            relation: error.meta?.relation_name,
            prismaCode: error.code
          },
          error
        );
      
      default:
        return new UltraDatabaseError(
          error.message,
          'prisma_operation',
          error,
          {
            prismaCode: error.code,
            meta: error.meta
          }
        );
    }
  }
  
  /**
   * 🍃 Transform MongoDB errors
   */
  private transformMongoError(error: MongoError): UltraProfessionalError {
    if (error.code === 11000) {
      // Duplicate key error
      return new UltraConflictError(
        'Duplicate record found',
        'DUPLICATE_RECORD',
        {
          mongoCode: error.code,
          keyPattern: error.keyPattern,
          keyValue: error.keyValue
        }
      );
    }
    
    return new UltraDatabaseError(
      error.message,
      'mongodb_operation',
      error,
      {
        mongoCode: error.code
      }
    );
  }
  
  /**
   * 📊 Track error statistics
   */
  private trackError(error: UltraProfessionalError): void {
    const errorKey = `${error.errorType}:${error.code}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    
    // Keep track of recent errors
    this.lastErrors.push(error);
    if (this.lastErrors.length > this.maxLastErrors) {
      this.lastErrors.shift();
    }
  }
  
  /**
   * 📈 Get error statistics
   */
  public getErrorStatistics() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.lastErrors.slice(-10),
      totalErrors: this.lastErrors.length
    };
  }
  
  /**
   * 📧 Send error notification (for critical errors)
   */
  private async sendErrorNotification(error: UltraProfessionalError): Promise<void> {
    // Only send notifications for critical errors in production
    if (process.env.NODE_ENV !== 'production') return;
    if (error.statusCode < 500) return;
    
    try {
      // Integration with notification service would go here
      console.error('🚨 Critical error notification:', {
        error: error.toJSON(),
        timestamp: new Date().toISOString()
      });
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }
  
  /**
   * 🎭 Express error handler middleware
   */
  public createExpressErrorHandler() {
    return async (
      error: any,
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        // Transform to UltraProfessionalError
        const ultraError = this.transformError(error, {
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: (req as any).user?.userId,
          sessionId: (req as any).sessionId
        });
        
        // Add request context
        ultraError.requestId = req.id || req.headers['x-request-id'] as string;
        ultraError.userId = (req as any).user?.userId;
        ultraError.sessionId = (req as any).sessionId;
        
        // Track error statistics
        this.trackError(ultraError);
        
        // Log error
        this.logError(ultraError, req);
        
        // Send notification for critical errors
        await this.sendErrorNotification(ultraError);
        
        // Send response
        res.status(ultraError.statusCode).json(ultraError.toClientResponse());
      } catch (handlerError) {
        // Fallback error handling
        console.error('Error handler failed:', handlerError);
        res.status(500).json({
          success: false,
          error: {
            message: 'Internal server error',
            code: 'ERROR_HANDLER_FAILED',
            type: 'INTERNAL_SERVER_ERROR',
            timestamp: new Date()
          }
        });
      }
    };
  }
  
  /**
   * 📝 Log error with appropriate level
   */
  private logError(error: UltraProfessionalError, req?: Request): void {
    const logContext = {
      error: error.toJSON(),
      request: req ? {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.userId,
        sessionId: (req as any).sessionId
      } : undefined
    };
    
    if (error.statusCode >= 500) {
      console.error('🚨 Server Error:', logContext);
    } else if (error.statusCode >= 400) {
      console.warn('⚠️ Client Error:', logContext);
    } else {
      console.info('ℹ️ Error Info:', logContext);
    }
  }
  
  /**
   * 🔄 Async error wrapper
   */
  public wrapAsync(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
  
  /**
   * 🎯 Create standard error responses
   */
  public createStandardErrors() {
    return {
      notFound: (resource: string, identifier?: string | number) => 
        new UltraNotFoundError(resource, identifier),
      
      validation: (message: string, details?: any) =>
        new UltraValidationError(message, details),
      
      authentication: (message?: string, code?: string) =>
        new UltraAuthenticationError(message, code),
      
      authorization: (message?: string, code?: string) =>
        new UltraAuthorizationError(message, code),
      
      conflict: (message: string, code?: string) =>
        new UltraConflictError(message, code),
      
      rateLimit: (message?: string, retryAfter?: number) =>
        new UltraRateLimitError(message, retryAfter),
      
      database: (message: string, operation: string, originalError?: Error) =>
        new UltraDatabaseError(message, operation, originalError),
      
      externalService: (service: string, message?: string, statusCode?: number, originalError?: Error) =>
        new UltraExternalServiceError(service, message, statusCode, originalError),
      
      businessLogic: (message: string, code?: string) =>
        new UltraBusinessLogicError(message, code),
      
      payment: (message: string, provider: 'CLICK' | 'PAYME' | 'UZCARD', code?: string) =>
        new UltraPaymentError(message, provider, code),
      
      fileUpload: (message?: string, code?: string) =>
        new UltraFileUploadError(message, code),
      
      configuration: (message: string, configKey?: string) =>
        new UltraConfigurationError(message, configKey)
    };
  }
}

/**
 * 🌟 Global error handler instance
 */
export const ultraErrorHandler = UltraProfessionalErrorHandler.getInstance();

/**
 * 🚀 Quick access functions
 */
export const createError = ultraErrorHandler.createStandardErrors();
export const transformError = (error: any, context?: Record<string, any>) => 
  ultraErrorHandler.transformError(error, context);
export const wrapAsync = (fn: Function) => ultraErrorHandler.wrapAsync(fn);
export const expressErrorHandler = ultraErrorHandler.createExpressErrorHandler();

/**
 * 📊 Error utilities
 */
export const errorUtils = {
  isOperational: (error: Error): boolean => {
    if (error instanceof UltraProfessionalError) {
      return error.isOperational;
    }
    return false;
  },
  
  getErrorStatistics: () => ultraErrorHandler.getErrorStatistics(),
  
  handleUncaughtExceptions: () => {
    process.on('uncaughtException', (error: Error) => {
      console.error('🚨 Uncaught Exception:', error);
      const ultraError = ultraErrorHandler.transformError(error);
      console.error('Transformed error:', ultraError.toJSON());
      
      // Graceful shutdown for non-operational errors
      if (!errorUtils.isOperational(error)) {
        console.error('Non-operational error detected, shutting down...');
        process.exit(1);
      }
    });
    
    process.on('unhandledRejection', (reason: any) => {
      console.error('🚨 Unhandled Rejection:', reason);
      const ultraError = ultraErrorHandler.transformError(reason);
      console.error('Transformed error:', ultraError.toJSON());
    });
  }
};

export default {
  UltraProfessionalError,
  UltraValidationError,
  UltraAuthenticationError,
  UltraAuthorizationError,
  UltraNotFoundError,
  UltraConflictError,
  UltraRateLimitError,
  UltraDatabaseError,
  UltraExternalServiceError,
  UltraBusinessLogicError,
  UltraPaymentError,
  UltraFileUploadError,
  UltraConfigurationError,
  ultraErrorHandler,
  createError,
  transformError,
  wrapAsync,
  expressErrorHandler,
  errorUtils
}; 