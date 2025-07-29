import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Error codes for the auth service
 */
export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Token errors
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REVOKED = 'TOKEN_REVOKED',

  // User management errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE',
  INVALID_ROLE = 'INVALID_ROLE',

  // Password errors
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  PASSWORD_RECENTLY_USED = 'PASSWORD_RECENTLY_USED',

  // Request validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',

  // Permission errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Base error class for Auth Service
 */
export class AuthServiceError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Log error for monitoring
    this.logError();
  }

  /**
   * Log error details for monitoring and debugging
   */
  private logError(): void {
    const logLevel = this.isOperational ? 'warn' : 'error';

    logger[logLevel](`${this.errorCode}: ${this.message}`, {
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      stack: this.isOperational ? undefined : this.stack,
    });
  }

  /**
   * Format error for API response
   */
  toResponse(requestId?: string): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.errorCode,
        message: this.message,
        details: this.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
      },
    };
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AuthServiceError {
  constructor(
    message: string = 'Authentication failed',
    errorCode: string = ErrorCode.INVALID_CREDENTIALS,
    details?: any
  ) {
    super(message, 401, errorCode, details, true);
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AuthServiceError {
  constructor(
    message: string = 'Insufficient permissions',
    errorCode: string = ErrorCode.INSUFFICIENT_PERMISSIONS,
    details?: any
  ) {
    super(message, 403, errorCode, details, true);
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AuthServiceError {
  constructor(
    resource: string = 'Resource',
    errorCode: string = ErrorCode.USER_NOT_FOUND,
    details?: any
  ) {
    super(`${resource} not found`, 404, errorCode, details, true);
  }
}

/**
 * Validation errors (422)
 */
export class ValidationError extends AuthServiceError {
  constructor(
    details: Record<string, string[]>,
    message: string = 'Validation failed',
    errorCode: string = ErrorCode.VALIDATION_ERROR
  ) {
    super(message, 422, errorCode, { validationErrors: details }, true);
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AuthServiceError {
  constructor(
    message: string = 'Resource conflict',
    errorCode: string = ErrorCode.USER_ALREADY_EXISTS,
    details?: any
  ) {
    super(message, 409, errorCode, details, true);
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends AuthServiceError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, details, true);
  }
}

/**
 * Database errors (500 but with specific handling)
 */
export class DatabaseError extends AuthServiceError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, ErrorCode.DATABASE_ERROR, details, false);
  }
}

/**
 * Error for authentication-specific errors
 */
export class AuthError extends AuthServiceError {
  constructor(
    message: string = 'Authentication error',
    statusCode: number = 401,
    errorCode: string = ErrorCode.INVALID_CREDENTIALS
  ) {
    super(message, statusCode, errorCode);
  }
}

/**
 * Error for unauthorized access
 */
export class UnauthorizedError extends AuthServiceError {
  constructor(
    message: string = 'Unauthorized access',
    statusCode: number = 401,
    errorCode: string = ErrorCode.INSUFFICIENT_PERMISSIONS
  ) {
    super(message, statusCode, errorCode);
  }
}

/**
 * Error for forbidden access (authenticated but not allowed)
 */
export class ForbiddenError extends AuthServiceError {
  constructor(
    message: string = 'Forbidden access',
    statusCode: number = 403,
    errorCode: string = ErrorCode.INSUFFICIENT_PERMISSIONS
  ) {
    super(message, statusCode, errorCode);
  }
}

/**
 * Handle Prisma errors with proper error classification
 */
export function handlePrismaError(error: any, operation: string): AuthServiceError {
  // Handle known Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (e.g. duplicate email)
    if (error.code === 'P2002') {
      const target = (error.meta?.['target'] as string[]) || [];
      return new ConflictError(
        `${target.join(', ')} already in use`,
        target.includes('email') ? ErrorCode.EMAIL_ALREADY_IN_USE : ErrorCode.USER_ALREADY_EXISTS,
        { fields: target }
      );
    }

    // Foreign key constraint failure
    if (error.code === 'P2003') {
      return new ValidationError(
        { [error.meta?.['field_name'] as string]: ['Invalid reference'] },
        'Invalid reference to related resource'
      );
    }

    // Record not found
    if (error.code === 'P2001' || error.code === 'P2018') {
      return new NotFoundError('Record', ErrorCode.USER_NOT_FOUND);
    }
  }

  // Handle validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError(
      { _general: ['Invalid data format'] },
      'Invalid data format for database operation'
    );
  }

  // Handle connection errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AuthServiceError(
      'Database connection failed',
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
      { operation },
      false
    );
  }

  // Default database error
  return new DatabaseError(`Database ${operation} operation failed`, {
    originalError: error.message,
  });
}

/**
 * Express middleware for handling errors
 */
export function errorHandler(err: any, req: any, res: any, next: any) {
  // If error is an AuthServiceError, use it directly
  if (err instanceof AuthServiceError) {
    return res.status(err.statusCode).json(err.toResponse(req.id));
  }

  // If error is from Prisma, convert it
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError
  ) {
    const operation = req.method + ' ' + req.path;
    const serviceError = handlePrismaError(err, operation);
    return res.status(serviceError.statusCode).json(serviceError.toResponse(req.id));
  }

  // Generic error handling
  const serverError = new AuthServiceError(
    err.message || 'Internal server error',
    500,
    ErrorCode.INTERNAL_SERVER_ERROR,
    { originalError: err.message },
    false
  );

  // Log unexpected errors with full stack
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  return res.status(500).json(serverError.toResponse(req.id));
}
