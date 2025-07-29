import { Request, Response, NextFunction } from 'express';
import { logger, professionalLogger } from '../utils/logger';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}

// Professional error handler middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let details: any = {};

  // Handle custom errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = 'BUSINESS_ERROR';
  }

  // Handle Prisma errors with professional categorization
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_RESOURCE';
        details = { field: prismaError.meta?.target };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        errorCode = 'RESOURCE_NOT_FOUND';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid data provided';
        errorCode = 'INVALID_DATA';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        errorCode = 'CONSTRAINT_VIOLATION';
        break;
      case 'P2011':
        statusCode = 400;
        message = 'Null constraint violation';
        errorCode = 'NULL_CONSTRAINT';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
        errorCode = 'DATABASE_ERROR';
    }
  }

  // Handle Joi validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    details = { errors: (error as any).details };
  }

  // Handle JWT errors with security logging
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
    
    // Security audit for token issues
    professionalLogger.security('Invalid JWT token attempt', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    }, 'medium');
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Handle Redis errors
  else if (error.name === 'RedisError') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  }

  // Handle rate limiting
  else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = 'Too many requests';
    errorCode = 'RATE_LIMITED';
    
    // Security audit for potential abuse
    professionalLogger.security('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    }, 'high');
  }

  // Professional error logging with context
  const errorContext = {
    errorCode,
    message: error.message,
    stack: error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    correlationId: (req as any).correlationId,
    timestamp: new Date().toISOString(),
    service: 'user-service'
  };

  // Log error with appropriate level
  if (statusCode >= 500) {
    logger.error('Internal server error occurred', errorContext);
  } else if (statusCode >= 400) {
    logger.warn('Client error occurred', errorContext);
  } else {
    logger.info('Error handled successfully', errorContext);
  }

  // Audit log for security-related errors
  if (['INVALID_TOKEN', 'TOKEN_EXPIRED', 'RATE_LIMITED'].includes(errorCode)) {
    professionalLogger.audit('Security error handled', {
      errorCode,
      statusCode,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, (req as any).user?.userId);
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  // Include details in development mode
  if (process.env['NODE_ENV'] === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = details;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
