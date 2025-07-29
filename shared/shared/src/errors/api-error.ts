/**
 * UltraMarket Shared - API Error Class
 * Professional error handling for API responses
 */

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: ErrorDetail[];

  constructor(statusCode: number, message: string, details?: ErrorDetail[], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }

    // Set the prototype explicitly
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Create a bad request error
   */
  static badRequest(message: string, details?: ErrorDetail[]): ApiError {
    return new ApiError(400, message, details);
  }

  /**
   * Create an unauthorized error
   */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Create a not found error
   */
  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Create a conflict error
   */
  static conflict(message: string, details?: ErrorDetail[]): ApiError {
    return new ApiError(409, message, details);
  }

  /**
   * Create a validation error
   */
  static validationError(message: string, details?: ErrorDetail[]): ApiError {
    return new ApiError(422, message, details);
  }

  /**
   * Create an internal server error
   */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }

  /**
   * Create a service unavailable error
   */
  static serviceUnavailable(message = 'Service unavailable'): ApiError {
    return new ApiError(503, message, undefined, false);
  }

  /**
   * Convert error to JSON response
   */
  toJSON(): object {
    return {
      success: false,
      error: {
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Check if error is operational
   */
  isOperationalError(): boolean {
    return this.isOperational;
  }

  /**
   * Get error details for logging
   */
  getErrorDetails(): object {
    return {
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
      isOperational: this.isOperational,
    };
  }
}
