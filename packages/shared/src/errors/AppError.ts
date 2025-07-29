import { logger } from '../logging/logger';

// Error codes enum
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_BLACKLISTED = 'TOKEN_BLACKLISTED',
  WEAK_JWT_SECRET = 'WEAK_JWT_SECRET',
  MISSING_AUTH_HEADER = 'MISSING_AUTH_HEADER',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Business Logic
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',
  ORDER_ALREADY_PROCESSED = 'ORDER_ALREADY_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',

  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
}

// Base Application Error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code: string = ErrorCode.INTERNAL_ERROR,
    context?: Record<string, any>
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Log error creation
    logger.error(`AppError created: ${message}`, {
      statusCode,
      code,
      isOperational,
      context,
      stack: this.stack,
    });
  }

  // Convert to JSON for API responses
  toJSON(): Record<string, any> {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp.toISOString(),
        ...(this.context && { context: this.context }),
      },
    };
  }

  // Get user-friendly message
  getUserMessage(): string {
    // Map technical errors to user-friendly messages
    const userMessages: Record<string, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Tizimga kirish talab qilinadi',
      [ErrorCode.FORBIDDEN]: "Sizda bu amalni bajarish uchun ruxsat yo'q",
      [ErrorCode.TOKEN_EXPIRED]: 'Sessiya muddati tugagan, qayta kiring',
      [ErrorCode.INVALID_TOKEN]: "Noto'g'ri token",
      [ErrorCode.VALIDATION_ERROR]: "Kiritilgan ma'lumotlar noto'g'ri",
      [ErrorCode.RECORD_NOT_FOUND]: "Ma'lumot topilmadi",
      [ErrorCode.DUPLICATE_RECORD]: "Bu ma'lumot allaqachon mavjud",
      [ErrorCode.INSUFFICIENT_BALANCE]: "Hisobda yetarli mablag' yo'q",
      [ErrorCode.PRODUCT_OUT_OF_STOCK]: "Mahsulot qoldiqda yo'q",
      [ErrorCode.PAYMENT_FAILED]: "To'lov amalga oshmadi",
      [ErrorCode.RATE_LIMIT_EXCEEDED]: "Juda ko'p so'rov yuborildi, biroz kuting",
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Xizmat vaqtincha mavjud emas',
      [ErrorCode.INTERNAL_ERROR]: 'Ichki xatolik yuz berdi',
    };

    return userMessages[this.code] || this.message;
  }
}

// Validation Error
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(
    errors: Record<string, string[]>,
    message: string = 'Validation failed',
    context?: Record<string, any>
  ) {
    super(message, 422, true, ErrorCode.VALIDATION_ERROR, context);
    this.errors = errors;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      error: {
        ...super.toJSON().error,
        errors: this.errors,
      },
    };
  }
}

// Authentication Error
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    code: string = ErrorCode.UNAUTHORIZED,
    context?: Record<string, any>
  ) {
    super(message, 401, true, code, context);
  }
}

// Authorization Error
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(message, 403, true, ErrorCode.FORBIDDEN, context);
  }
}

// Not Found Error
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 404, true, ErrorCode.RECORD_NOT_FOUND, context);
  }
}

// Conflict Error
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', context?: Record<string, any>) {
    super(message, 409, true, ErrorCode.DUPLICATE_RECORD, context);
  }
}

// Rate Limit Error
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, true, ErrorCode.RATE_LIMIT_EXCEEDED, context);
  }
}

// Database Error
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context?: Record<string, any>) {
    super(message, 500, true, ErrorCode.DATABASE_ERROR, context);
  }
}

// External Service Error
export class ExternalServiceError extends AppError {
  constructor(
    serviceName: string,
    message: string = 'External service error',
    context?: Record<string, any>
  ) {
    super(`${serviceName}: ${message}`, 502, true, ErrorCode.EXTERNAL_SERVICE_ERROR, {
      serviceName,
      ...context,
    });
  }
}

// Payment Error
export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed', context?: Record<string, any>) {
    super(message, 402, true, ErrorCode.PAYMENT_FAILED, context);
  }
}

// Business Logic Error
export class BusinessLogicError extends AppError {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, 400, true, code, context);
  }
}

// File Upload Error
export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed', context?: Record<string, any>) {
    super(message, 400, true, ErrorCode.FILE_UPLOAD_ERROR, context);
  }
}

// Error factory functions
export const createValidationError = (
  field: string,
  message: string,
  context?: Record<string, any>
): ValidationError => {
  return new ValidationError({ [field]: [message] }, `Validation failed: ${field}`, context);
};

export const createAuthError = (
  message: string = 'Authentication required',
  context?: Record<string, any>
): AuthenticationError => {
  return new AuthenticationError(message, ErrorCode.UNAUTHORIZED, context);
};

export const createNotFoundError = (
  resource: string,
  id?: string | number,
  context?: Record<string, any>
): NotFoundError => {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  return new NotFoundError(message, { resource, id, ...context });
};

// Error handler utility
export const handleError = (
  error: unknown,
  defaultMessage: string = 'An error occurred'
): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    logger.error('Unhandled error converted to AppError', {
      originalError: error.message,
      stack: error.stack,
    });

    return new AppError(error.message || defaultMessage, 500, false, ErrorCode.INTERNAL_ERROR, {
      originalError: error.message,
    });
  }

  logger.error('Unknown error converted to AppError', {
    error: String(error),
  });

  return new AppError(defaultMessage, 500, false, ErrorCode.INTERNAL_ERROR, {
    originalError: String(error),
  });
};

// Error response formatter
export const formatErrorResponse = (error: AppError) => {
  const response = error.toJSON();

  // In production, hide sensitive information
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    response.error = {
      message: 'Internal server error',
      code: ErrorCode.INTERNAL_ERROR,
      statusCode: 500,
      timestamp: error.timestamp.toISOString(),
    };
  }

  return response;
};

// Default export
export default AppError;
