export declare class UltraMarketError extends Error {
    code: string;
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, code?: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends UltraMarketError {
    constructor(message: string, code?: string);
}
export declare class AuthenticationError extends UltraMarketError {
    constructor(message?: string, code?: string);
}
export declare class AuthorizationError extends UltraMarketError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends UltraMarketError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends UltraMarketError {
    constructor(message?: string, code?: string);
}
export declare class RateLimitError extends UltraMarketError {
    constructor(message?: string, code?: string);
}
export declare function createError(message: string, code?: string, statusCode?: number): UltraMarketError;
export declare function createValidationError(message: string, code?: string): ValidationError;
export declare function createAuthenticationError(message?: string, code?: string): AuthenticationError;
export declare function createAuthorizationError(message?: string, code?: string): AuthorizationError;
export declare function createNotFoundError(message?: string, code?: string): NotFoundError;
export declare function createConflictError(message?: string, code?: string): ConflictError;
export declare function createRateLimitError(message?: string, code?: string): RateLimitError;
//# sourceMappingURL=errors.d.ts.map