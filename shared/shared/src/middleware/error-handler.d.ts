/**
 * UltraMarket Error Handler Middleware
 * Professional error handling for Express applications
 */
import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code: string;
    details?: unknown;
    constructor(message: string, statusCode?: number, code?: string, isOperational?: boolean, details?: unknown);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
        timestamp: string;
        requestId?: string;
    };
    meta?: {
        timestamp: string;
        requestId: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}
export declare function formatErrorResponse(error: AppError | Error, requestId?: string): ApiResponse;
export declare function logError(error: AppError | Error, req: Request, operation?: string): void;
export declare function errorHandler(error: AppError | Error, req: Request, res: Response, next: NextFunction): void;
export declare function asyncHandler<T extends Request, U extends Response>(fn: (req: T, res: U, next: NextFunction) => Promise<any>): (req: T, res: U, next: NextFunction) => void;
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response, next: NextFunction): void;
export declare function handleValidationError(error: any): ValidationError;
export declare function handleDatabaseError(error: any): AppError;
export declare function handleRateLimitError(req: Request): RateLimitError;
export declare function setupErrorMonitoring(): void;
//# sourceMappingURL=error-handler.d.ts.map