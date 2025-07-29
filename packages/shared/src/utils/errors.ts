/**
 * 🚀 ULTRAMARKET SHARED ERROR UTILITIES
 * Centralized error handling utilities
 */

export class UltraMarketError extends Error {
  public code: string;
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'UltraMarketError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

export class ValidationError extends UltraMarketError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, code, 400);
  }
}

export class AuthenticationError extends UltraMarketError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTHENTICATION_ERROR') {
    super(message, code, 401);
  }
}

export class AuthorizationError extends UltraMarketError {
  constructor(message: string = 'Access denied', code: string = 'AUTHORIZATION_ERROR') {
    super(message, code, 403);
  }
}

export class NotFoundError extends UltraMarketError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND_ERROR') {
    super(message, code, 404);
  }
}

export class ConflictError extends UltraMarketError {
  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT_ERROR') {
    super(message, code, 409);
  }
}

export class RateLimitError extends UltraMarketError {
  constructor(message: string = 'Rate limit exceeded', code: string = 'RATE_LIMIT_ERROR') {
    super(message, code, 429);
  }
}

export function createError(
  message: string,
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500
): UltraMarketError {
  return new UltraMarketError(message, code, statusCode);
}

export function createValidationError(message: string, code?: string): ValidationError {
  return new ValidationError(message, code);
}

export function createAuthenticationError(message?: string, code?: string): AuthenticationError {
  return new AuthenticationError(message, code);
}

export function createAuthorizationError(message?: string, code?: string): AuthorizationError {
  return new AuthorizationError(message, code);
}

export function createNotFoundError(message?: string, code?: string): NotFoundError {
  return new NotFoundError(message, code);
}

export function createConflictError(message?: string, code?: string): ConflictError {
  return new ConflictError(message, code);
}

export function createRateLimitError(message?: string, code?: string): RateLimitError {
  return new RateLimitError(message, code);
} 