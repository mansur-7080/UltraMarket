/**
 * 🚨 PROFESSIONAL ERROR HANDLER - ULTRAMARKET
 *
 * Unified error handling system across all microservices
 * Standardizes error responses, logging, and monitoring
 *
 * @author UltraMarket Development Team
 * @version 3.0.0
 * @date 2024-12-28
 */
import { Request, Response, NextFunction } from 'express';
import EventEmitter from 'events';
/**
 * Professional Error Codes Enumeration
 */
export declare enum ErrorCode {
    AUTH_TOKEN_MISSING = "AUTH_TOKEN_MISSING",
    AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID",
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
    AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_INSUFFICIENT_PERMISSIONS",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",
    INVALID_EMAIL_FORMAT = "INVALID_EMAIL_FORMAT",
    INVALID_PHONE_FORMAT = "INVALID_PHONE_FORMAT",
    PASSWORD_TOO_WEAK = "PASSWORD_TOO_WEAK",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND",
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND",
    INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    CART_EMPTY = "CART_EMPTY",
    DATABASE_ERROR = "DATABASE_ERROR",
    CACHE_ERROR = "CACHE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    CSRF_TOKEN_MISSING = "CSRF_TOKEN_MISSING",
    CSRF_TOKEN_INVALID = "CSRF_TOKEN_INVALID",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    ACCESS_DENIED = "ACCESS_DENIED"
}
/**
 * Error Severity Levels
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Error Categories
 */
export declare enum ErrorCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    VALIDATION = "validation",
    BUSINESS_LOGIC = "business_logic",
    SYSTEM = "system",
    SECURITY = "security",
    NETWORK = "network",
    DATABASE = "database"
}
/**
 * Professional Error Interface
 */
export interface ProfessionalErrorDetails {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    field?: string;
    value?: any;
    severity: ErrorSeverity;
    category: ErrorCategory;
    timestamp: string;
    requestId?: string;
    userId?: string;
    traceId?: string;
    suggestions?: string[];
    documentation?: string;
}
/**
 * Professional Error Response Interface
 */
export interface ErrorResponse {
    success: false;
    error: ProfessionalErrorDetails;
    meta?: {
        requestId: string;
        timestamp: string;
        version: string;
        endpoint: string;
        method: string;
    };
}
/**
 * Professional Application Error Class
 */
export declare class ProfessionalError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly severity: ErrorSeverity;
    readonly category: ErrorCategory;
    readonly details: Record<string, any>;
    readonly field?: string;
    readonly value?: any;
    readonly suggestions: string[];
    readonly documentation?: string;
    readonly timestamp: string;
    readonly requestId?: string;
    readonly userId?: string;
    readonly traceId?: string;
    constructor(code: ErrorCode, message: string, statusCode?: number, options?: {
        severity?: ErrorSeverity;
        category?: ErrorCategory;
        details?: Record<string, any>;
        field?: string;
        value?: any;
        suggestions?: string[];
        documentation?: string;
        requestId?: string;
        userId?: string;
        traceId?: string;
        cause?: Error;
    });
    private determineSeverity;
    private determineCategory;
    toJSON(): ProfessionalErrorDetails;
}
/**
 * Professional Error Manager
 */
export declare class ProfessionalErrorManager extends EventEmitter {
    private static instance;
    private errorCounts;
    private recentErrors;
    private maxRecentErrors;
    private constructor();
    static getInstance(): ProfessionalErrorManager;
    /**
     * Create professional error with context
     */
    createError(code: ErrorCode, message: string, statusCode?: number, options?: Parameters<typeof ProfessionalError.prototype.constructor>[3]): ProfessionalError;
    /**
     * Professional Express error middleware
     */
    getExpressErrorHandler(): (error: Error | ProfessionalError, req: Request, res: Response, next: NextFunction) => void;
    /**
     * Async error wrapper for route handlers
     */
    asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Validation error creator
     */
    createValidationError(field: string, value: any, message: string, suggestions?: string[]): ProfessionalError;
    /**
     * Authentication error creator
     */
    createAuthError(message?: string, code?: ErrorCode): ProfessionalError;
    /**
     * Authorization error creator
     */
    createAuthorizationError(message?: string): ProfessionalError;
    /**
     * Business logic error creator
     */
    createBusinessError(code: ErrorCode, message: string, details?: Record<string, any>): ProfessionalError;
    /**
     * System error creator
     */
    createSystemError(message?: string, originalError?: Error): ProfessionalError;
    /**
     * Get error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByCode: Array<{
            code: ErrorCode;
            count: number;
        }>;
        errorsByCategory: Array<{
            category: ErrorCategory;
            count: number;
        }>;
        errorsBySeverity: Array<{
            severity: ErrorSeverity;
            count: number;
        }>;
        recentErrorsCount: number;
        topErrors: Array<{
            code: ErrorCode;
            count: number;
            percentage: number;
        }>;
    };
    /**
     * Health check for error handling system
     */
    healthCheck(): {
        healthy: boolean;
        errorRate: number;
        criticalErrors: number;
        recentErrors: number;
    };
    private setupErrorTracking;
    private trackError;
    private logError;
    private sendErrorResponse;
    private convertToProfessionalError;
    private sanitizeHeaders;
    private generateRequestId;
}
export declare const professionalErrorManager: ProfessionalErrorManager;
export declare const createValidationError: (field: string, value: any, message: string, suggestions?: string[]) => ProfessionalError;
export declare const createAuthError: (message?: string, code?: ErrorCode) => ProfessionalError;
export declare const createAuthorizationError: (message?: string) => ProfessionalError;
export declare const createBusinessError: (code: ErrorCode, message: string, details?: Record<string, any>) => ProfessionalError;
export declare const createSystemError: (message?: string, originalError?: Error) => ProfessionalError;
export declare const errorHandler: (error: Error | ProfessionalError, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=professional-error-handler.d.ts.map