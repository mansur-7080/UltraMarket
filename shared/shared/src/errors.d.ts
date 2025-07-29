export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    constructor(message: string, statusCode: number, isOperational?: boolean, code?: string);
}
export declare function createError(statusCode: number, message: string, code?: string): AppError;
export declare class BadRequestError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ValidationError extends AppError {
    readonly errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>, message?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string, code?: string);
}
export declare const ErrorCode: {
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS";
    readonly EMAIL_ALREADY_VERIFIED: "EMAIL_ALREADY_VERIFIED";
    readonly PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND";
    readonly PRODUCT_OUT_OF_STOCK: "PRODUCT_OUT_OF_STOCK";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly ORDER_ALREADY_CANCELLED: "ORDER_ALREADY_CANCELLED";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
};
export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
//# sourceMappingURL=errors.d.ts.map