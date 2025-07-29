/**
 * UltraMarket Error Handling System
 * Comprehensive error classes and utilities for all microservices
 */

import { ErrorCode, HttpStatusCode } from '../types/api-responses';

// Base error class for all application errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any[];
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    code: string = ErrorCode.INTERNAL_ERROR,
    details?: any[],
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Authentication and Authorization Errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any[]) {
    super(HttpStatusCode.UNAUTHORIZED, message, ErrorCode.INVALID_CREDENTIALS, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any[]) {
    super(HttpStatusCode.FORBIDDEN, message, ErrorCode.INSUFFICIENT_PERMISSIONS, details);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired', details?: any[]) {
    super(HttpStatusCode.UNAUTHORIZED, message, ErrorCode.TOKEN_EXPIRED, details);
  }
}

export class AccountLockedError extends AppError {
  constructor(message: string = 'Account is locked', details?: any[]) {
    super(HttpStatusCode.FORBIDDEN, message, ErrorCode.ACCOUNT_LOCKED, details);
  }
}

// Validation Errors
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any[]) {
    super(HttpStatusCode.BAD_REQUEST, message, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class RequiredFieldError extends AppError {
  constructor(field: string, message?: string) {
    super(
      HttpStatusCode.BAD_REQUEST,
      message || `Required field '${field}' is missing`,
      ErrorCode.REQUIRED_FIELD_MISSING,
      [{ field, message: message || `Required field '${field}' is missing` }]
    );
  }
}

export class InvalidFormatError extends AppError {
  constructor(field: string, format: string, value?: any) {
    super(
      HttpStatusCode.BAD_REQUEST,
      `Invalid format for field '${field}'. Expected: ${format}`,
      ErrorCode.INVALID_FORMAT,
      [{ field, format, value }]
    );
  }
}

export class InvalidValueError extends AppError {
  constructor(field: string, message: string, value?: any) {
    super(HttpStatusCode.BAD_REQUEST, message, ErrorCode.INVALID_VALUE, [
      { field, message, value },
    ]);
  }
}

// Business Logic Errors
export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;

    super(HttpStatusCode.NOT_FOUND, message, ErrorCode.RESOURCE_NOT_FOUND, [{ resource, id }]);
  }
}

export class ResourceAlreadyExistsError extends AppError {
  constructor(resource: string, field: string, value: any) {
    super(
      HttpStatusCode.CONFLICT,
      `${resource} with ${field} '${value}' already exists`,
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      [{ resource, field, value }]
    );
  }
}

export class BusinessRuleViolationError extends AppError {
  constructor(message: string, details?: any[]) {
    super(HttpStatusCode.UNPROCESSABLE_ENTITY, message, ErrorCode.BUSINESS_RULE_VIOLATION, details);
  }
}

export class InsufficientStockError extends AppError {
  constructor(productId: string, requested: number, available: number) {
    super(
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      ErrorCode.INSUFFICIENT_STOCK,
      [{ productId, requested, available }]
    );
  }
}

export class PaymentFailedError extends AppError {
  constructor(message: string, transactionId?: string, details?: any[]) {
    super(HttpStatusCode.UNPROCESSABLE_ENTITY, message, ErrorCode.PAYMENT_FAILED, [
      { transactionId, ...details },
    ]);
  }
}

// System Errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any[]) {
    super(HttpStatusCode.INTERNAL_SERVER_ERROR, message, ErrorCode.DATABASE_ERROR, details, false);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any[]) {
    super(
      HttpStatusCode.BAD_GATEWAY,
      `External service '${service}' error: ${message}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      [{ service, message, ...details }],
      false
    );
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(HttpStatusCode.TOO_MANY_REQUESTS, message, ErrorCode.RATE_LIMIT_EXCEEDED, [
      { retryAfter },
    ]);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(
      HttpStatusCode.SERVICE_UNAVAILABLE,
      message,
      ErrorCode.SERVICE_UNAVAILABLE,
      undefined,
      false
    );
  }
}

// Legacy ApiError class for backward compatibility
export class ApiError extends AppError {
  constructor(statusCode: number, message: string, details?: any[], code?: string) {
    super(statusCode, message, code || ErrorCode.INTERNAL_ERROR, details);
  }
}

// Error utilities
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function createErrorResponse(error: AppError, requestId?: string) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    ...(requestId && { requestId }),
    timestamp: new Date().toISOString(),
  };
}

export function handleAsyncError(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Error mapping utilities
export const errorMap = {
  [ErrorCode.INVALID_CREDENTIALS]: AuthenticationError,
  [ErrorCode.TOKEN_EXPIRED]: TokenExpiredError,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: AuthorizationError,
  [ErrorCode.ACCOUNT_LOCKED]: AccountLockedError,
  [ErrorCode.VALIDATION_ERROR]: ValidationError,
  [ErrorCode.REQUIRED_FIELD_MISSING]: RequiredFieldError,
  [ErrorCode.INVALID_FORMAT]: InvalidFormatError,
  [ErrorCode.INVALID_VALUE]: InvalidValueError,
  [ErrorCode.RESOURCE_NOT_FOUND]: ResourceNotFoundError,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: ResourceAlreadyExistsError,
  [ErrorCode.BUSINESS_RULE_VIOLATION]: BusinessRuleViolationError,
  [ErrorCode.INSUFFICIENT_STOCK]: InsufficientStockError,
  [ErrorCode.PAYMENT_FAILED]: PaymentFailedError,
  [ErrorCode.DATABASE_ERROR]: DatabaseError,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: ExternalServiceError,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: RateLimitError,
  [ErrorCode.SERVICE_UNAVAILABLE]: ServiceUnavailableError,
};

export function createErrorFromCode(code: string, message?: string, details?: any[]): AppError {
  // For now, just return a generic AppError with the code
  return new AppError(
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    message || 'Unknown error',
    code,
    details
  );
}
