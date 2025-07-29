/**
 * UltraMarket Error Handler Middleware
 * Professional error handling for Express applications
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';
import { ErrorCode, HttpStatusCode } from '../types/api-responses';

export interface ErrorWithCode extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
  isOperational?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  code?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    code: string = ErrorCode.INTERNAL_ERROR,
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationAppError extends AppError {
  public readonly validationErrors: ValidationError[];

  constructor(message: string, validationErrors: ValidationError[]) {
    super(message, HttpStatusCode.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    this.name = 'ValidationAppError';
    this.validationErrors = validationErrors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HttpStatusCode.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatusCode.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatusCode.FORBIDDEN, ErrorCode.INSUFFICIENT_PERMISSIONS);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, HttpStatusCode.CONFLICT, ErrorCode.RESOURCE_ALREADY_EXISTS);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, HttpStatusCode.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED);
    this.name = 'RateLimitError';
  }
}

// Error handler middleware
export function errorHandler(
  error: ErrorWithCode,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    next(error);
    return;
  }

  // Generate request ID if not present
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Determine error details
  let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: unknown = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code as ErrorCode;
    message = error.message;
    details = error.details;
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.code) {
    // Handle specific error codes
    switch (error.code) {
      case 'ENOTFOUND':
        statusCode = HttpStatusCode.SERVICE_UNAVAILABLE;
        errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
        message = 'External service unavailable';
        break;
      case 'ECONNREFUSED':
        statusCode = HttpStatusCode.SERVICE_UNAVAILABLE;
        errorCode = ErrorCode.DATABASE_ERROR;
        message = 'Database connection refused';
        break;
      case 'ECONNRESET':
        statusCode = HttpStatusCode.SERVICE_UNAVAILABLE;
        errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
        message = 'Connection reset by peer';
        break;
      case 'ETIMEDOUT':
        statusCode = HttpStatusCode.GATEWAY_TIMEOUT;
        errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
        message = 'Request timeout';
        break;
      default:
        message = error.message || 'Internal server error';
    }
  }

  // Log error
  logger.error('Request error', {
    requestId,
    method: req.method,
    url: req.url,
    statusCode,
    errorCode,
    message: error.message,
    stack: error.stack,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    requestId,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  });
}

// Async error handler wrapper
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.warn('Route not found', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  res.status(HttpStatusCode.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    error: {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
    requestId,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  });
}

// Validation error handler
export function handleValidationError(errors: ValidationError[]): ValidationAppError {
  const message = `Validation failed: ${errors.map((e) => e.message).join(', ')}`;
  return new ValidationAppError(message, errors);
}

// Database error handler
export function handleDatabaseError(error: Error): AppError {
  if (error.message.includes('duplicate key')) {
    return new ConflictError('Resource already exists');
  }

  if (error.message.includes('foreign key')) {
    return new AppError(
      'Invalid reference',
      HttpStatusCode.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  if (error.message.includes('not null')) {
    return new AppError(
      'Required field missing',
      HttpStatusCode.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  return new AppError(
    'Database error',
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    ErrorCode.DATABASE_ERROR
  );
}

// Unhandled promise rejection handler
export function handleUnhandledRejection(): void {
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });

    // Exit process in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}

// Uncaught exception handler
export function handleUncaughtException(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });

    // Exit process
    process.exit(1);
  });
}

// Initialize error handlers
export function initializeErrorHandlers(): void {
  handleUnhandledRejection();
  handleUncaughtException();
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationAppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  handleValidationError,
  handleDatabaseError,
  initializeErrorHandlers,
};
