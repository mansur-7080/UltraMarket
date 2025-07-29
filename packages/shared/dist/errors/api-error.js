"use strict";
/**
 * UltraMarket Shared - API Error Class
 * Professional error handling for API responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(statusCode, message, details, isOperational = true) {
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
    static badRequest(message, details) {
        return new ApiError(400, message, details);
    }
    /**
     * Create an unauthorized error
     */
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }
    /**
     * Create a forbidden error
     */
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message);
    }
    /**
     * Create a not found error
     */
    static notFound(message = 'Resource not found') {
        return new ApiError(404, message);
    }
    /**
     * Create a conflict error
     */
    static conflict(message, details) {
        return new ApiError(409, message, details);
    }
    /**
     * Create a validation error
     */
    static validationError(message, details) {
        return new ApiError(422, message, details);
    }
    /**
     * Create an internal server error
     */
    static internal(message = 'Internal server error') {
        return new ApiError(500, message, undefined, false);
    }
    /**
     * Create a service unavailable error
     */
    static serviceUnavailable(message = 'Service unavailable') {
        return new ApiError(503, message, undefined, false);
    }
    /**
     * Convert error to JSON response
     */
    toJSON() {
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
    isOperationalError() {
        return this.isOperational;
    }
    /**
     * Get error details for logging
     */
    getErrorDetails() {
        return {
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            stack: this.stack,
            isOperational: this.isOperational,
        };
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=api-error.js.map