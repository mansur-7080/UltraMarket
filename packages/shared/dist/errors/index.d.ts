/**
 * UltraMarket Error Handling System
 * Comprehensive error classes and utilities for all microservices
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    readonly details?: any[];
    readonly timestamp: string;
    constructor(statusCode: number, message: string, code?: string, details?: any[], isOperational?: boolean);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, details?: any[]);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, details?: any[]);
}
export declare class TokenExpiredError extends AppError {
    constructor(message?: string, details?: any[]);
}
export declare class AccountLockedError extends AppError {
    constructor(message?: string, details?: any[]);
}
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: any[]);
}
export declare class RequiredFieldError extends AppError {
    constructor(field: string, message?: string);
}
export declare class InvalidFormatError extends AppError {
    constructor(field: string, format: string, value?: any);
}
export declare class InvalidValueError extends AppError {
    constructor(field: string, message: string, value?: any);
}
export declare class ResourceNotFoundError extends AppError {
    constructor(resource: string, id?: string);
}
export declare class ResourceAlreadyExistsError extends AppError {
    constructor(resource: string, field: string, value: any);
}
export declare class BusinessRuleViolationError extends AppError {
    constructor(message: string, details?: any[]);
}
export declare class InsufficientStockError extends AppError {
    constructor(productId: string, requested: number, available: number);
}
export declare class PaymentFailedError extends AppError {
    constructor(message: string, transactionId?: string, details?: any[]);
}
export declare class DatabaseError extends AppError {
    constructor(message?: string, details?: any[]);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string, details?: any[]);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string, retryAfter?: number);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
export declare class ApiError extends AppError {
    constructor(statusCode: number, message: string, details?: any[], code?: string);
}
export declare function isOperationalError(error: Error): boolean;
export declare function createErrorResponse(error: AppError, requestId?: string): {
    timestamp: string;
    requestId?: string | undefined;
    success: boolean;
    error: {
        stack?: string | undefined;
        code: string;
        message: string;
        details: any[] | undefined;
        timestamp: string;
    };
};
export declare function handleAsyncError(fn: Function): (req: any, res: any, next: any) => void;
export declare const errorMap: {
    INVALID_CREDENTIALS: typeof AuthenticationError;
    TOKEN_EXPIRED: typeof TokenExpiredError;
    INSUFFICIENT_PERMISSIONS: typeof AuthorizationError;
    ACCOUNT_LOCKED: typeof AccountLockedError;
    VALIDATION_ERROR: typeof ValidationError;
    REQUIRED_FIELD_MISSING: typeof RequiredFieldError;
    INVALID_FORMAT: typeof InvalidFormatError;
    INVALID_VALUE: typeof InvalidValueError;
    RESOURCE_NOT_FOUND: typeof ResourceNotFoundError;
    RESOURCE_ALREADY_EXISTS: typeof ResourceAlreadyExistsError;
    BUSINESS_RULE_VIOLATION: typeof BusinessRuleViolationError;
    INSUFFICIENT_STOCK: typeof InsufficientStockError;
    PAYMENT_FAILED: typeof PaymentFailedError;
    DATABASE_ERROR: typeof DatabaseError;
    EXTERNAL_SERVICE_ERROR: typeof ExternalServiceError;
    RATE_LIMIT_EXCEEDED: typeof RateLimitError;
    SERVICE_UNAVAILABLE: typeof ServiceUnavailableError;
};
export declare function createErrorFromCode(code: string, message?: string, details?: any[]): AppError;
//# sourceMappingURL=index.d.ts.map