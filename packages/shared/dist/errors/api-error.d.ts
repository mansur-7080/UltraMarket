/**
 * UltraMarket Shared - API Error Class
 * Professional error handling for API responses
 */
export interface ErrorDetail {
    field?: string;
    message: string;
    code?: string;
}
export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    details?: ErrorDetail[];
    constructor(statusCode: number, message: string, details?: ErrorDetail[], isOperational?: boolean);
    /**
     * Create a bad request error
     */
    static badRequest(message: string, details?: ErrorDetail[]): ApiError;
    /**
     * Create an unauthorized error
     */
    static unauthorized(message?: string): ApiError;
    /**
     * Create a forbidden error
     */
    static forbidden(message?: string): ApiError;
    /**
     * Create a not found error
     */
    static notFound(message?: string): ApiError;
    /**
     * Create a conflict error
     */
    static conflict(message: string, details?: ErrorDetail[]): ApiError;
    /**
     * Create a validation error
     */
    static validationError(message: string, details?: ErrorDetail[]): ApiError;
    /**
     * Create an internal server error
     */
    static internal(message?: string): ApiError;
    /**
     * Create a service unavailable error
     */
    static serviceUnavailable(message?: string): ApiError;
    /**
     * Convert error to JSON response
     */
    toJSON(): object;
    /**
     * Check if error is operational
     */
    isOperationalError(): boolean;
    /**
     * Get error details for logging
     */
    getErrorDetails(): object;
}
//# sourceMappingURL=api-error.d.ts.map