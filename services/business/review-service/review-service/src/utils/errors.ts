/**
 * Custom Error Classes for Review Service
 */

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT', details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'TOO_MANY_REQUESTS');
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, true, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, message?: string, details?: any) {
    super(
      message || `External service ${service} is unavailable`,
      503,
      true,
      'EXTERNAL_SERVICE_ERROR',
      { service, ...details }
    );
  }
}

// Review-specific errors
export class ReviewError extends ApiError {
  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message, statusCode, true, 'REVIEW_ERROR', details);
  }
}

export class ReviewNotFoundError extends NotFoundError {
  constructor() {
    super('Review');
  }
}

export class ReviewAlreadyExistsError extends ConflictError {
  constructor() {
    super('You have already reviewed this product');
  }
}

export class ReviewPermissionError extends ForbiddenError {
  constructor(action: string = 'perform this action') {
    super(`You don't have permission to ${action} on this review`);
  }
}

export class ReviewModerationError extends ApiError {
  constructor(message: string = 'Review moderation failed') {
    super(message, 422, true, 'REVIEW_MODERATION_ERROR');
  }
}

export class ReviewVotingError extends ApiError {
  constructor(message: string = 'Review voting failed') {
    super(message, 422, true, 'REVIEW_VOTING_ERROR');
  }
}

export class ReviewFlagError extends ApiError {
  constructor(message: string = 'Review flagging failed') {
    super(message, 422, true, 'REVIEW_FLAG_ERROR');
  }
}

export class ReviewReplyError extends ApiError {
  constructor(message: string = 'Review reply failed') {
    super(message, 422, true, 'REVIEW_REPLY_ERROR');
  }
}

// Error handler utility functions
export const handleDatabaseError = (error: any): ApiError => {
  if (error.name === 'ValidationError') {
    return new ValidationError('Invalid data provided', error.errors);
  }

  if (error.name === 'CastError') {
    return new ValidationError('Invalid ID format');
  }

  if (error.code === 11000) {
    return new ConflictError('Duplicate entry', error.keyValue);
  }

  return new DatabaseError('Database operation failed', error.message);
};

export const handleAsyncError = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response formatter
export const formatErrorResponse = (error: ApiError) => {
  const response: any = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    },
  };

  if (error.details) {
    response.error.details = error.details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
};

// Error logging utility
export const logError = (error: Error, context?: any) => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  };

  if (error instanceof ApiError) {
    errorInfo.statusCode = error.statusCode;
    errorInfo.code = error.code;
    errorInfo.isOperational = error.isOperational;
    errorInfo.details = error.details;
  }

  console.error('Error occurred:', errorInfo);
};

// Validation error formatter
export const formatValidationError = (errors: any[]): ValidationError => {
  const formattedErrors = errors.map((error) => ({
    field: error.path || error.field,
    message: error.message,
    value: error.value,
  }));

  return new ValidationError('Validation failed', formattedErrors);
};

// HTTP status code utilities
export const isClientError = (statusCode: number): boolean => {
  return statusCode >= 400 && statusCode < 500;
};

export const isServerError = (statusCode: number): boolean => {
  return statusCode >= 500;
};

export const isOperationalError = (error: Error): boolean => {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
};

// Error constants
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  REVIEW_ERROR: 'REVIEW_ERROR',
  REVIEW_MODERATION_ERROR: 'REVIEW_MODERATION_ERROR',
  REVIEW_VOTING_ERROR: 'REVIEW_VOTING_ERROR',
  REVIEW_FLAG_ERROR: 'REVIEW_FLAG_ERROR',
  REVIEW_REPLY_ERROR: 'REVIEW_REPLY_ERROR',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
