/**
 * 🚨 UNIFIED ERROR HANDLER - UltraMarket
 *
 * Professional error handling, logging, va user-friendly responses
 * Centralized error management system
 *
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */
import { Request, Response, NextFunction } from 'express';
export declare enum ErrorCodes {
    AUTHENTICATION_FAILED = "AUTH_001",
    TOKEN_EXPIRED = "AUTH_002",
    TOKEN_INVALID = "AUTH_003",
    INSUFFICIENT_PERMISSIONS = "AUTH_004",
    USER_NOT_FOUND = "AUTH_005",
    VALIDATION_FAILED = "VAL_001",
    INVALID_INPUT = "VAL_002",
    REQUIRED_FIELD_MISSING = "VAL_003",
    INVALID_FORMAT = "VAL_004",
    DATABASE_ERROR = "DB_001",
    RECORD_NOT_FOUND = "DB_002",
    UNIQUE_CONSTRAINT_VIOLATION = "DB_003",
    FOREIGN_KEY_CONSTRAINT_VIOLATION = "DB_004",
    CONNECTION_ERROR = "DB_005",
    BUSINESS_RULE_VIOLATION = "BIZ_001",
    INSUFFICIENT_INVENTORY = "BIZ_002",
    INVALID_OPERATION = "BIZ_003",
    PAYMENT_FAILED = "BIZ_004",
    PAYMENT_SERVICE_ERROR = "EXT_001",
    SMS_SERVICE_ERROR = "EXT_002",
    EMAIL_SERVICE_ERROR = "EXT_003",
    FILE_UPLOAD_ERROR = "EXT_004",
    INTERNAL_SERVER_ERROR = "SYS_001",
    SERVICE_UNAVAILABLE = "SYS_002",
    RATE_LIMIT_EXCEEDED = "SYS_003",
    NETWORK_ERROR = "SYS_004",
    SECURITY_THREAT_DETECTED = "SEC_001",
    SUSPICIOUS_ACTIVITY = "SEC_002",
    IP_BLOCKED = "SEC_003",
    CAPTCHA_REQUIRED = "SEC_004"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface BaseError {
    code: ErrorCodes;
    message: string;
    severity: ErrorSeverity;
    statusCode: number;
    timestamp: string;
    correlationId?: string;
    details?: Record<string, any>;
    stack?: string;
}
/**
 * Custom Application Error class
 */
export declare class ApplicationError extends Error {
    readonly code: ErrorCodes;
    readonly severity: ErrorSeverity;
    readonly statusCode: number;
    readonly correlationId: string;
    readonly details: Record<string, any>;
    readonly timestamp: string;
    constructor(code: ErrorCodes, message?: string, details?: Record<string, any>, correlationId?: string);
    private getSeverity;
    private getStatusCode;
    private generateCorrelationId;
    toJSON(): BaseError;
}
/**
 * Professional Error Handler class
 */
export declare class ProfessionalErrorHandler {
    private static errorCounts;
    private static alertThresholds;
    /**
     * Convert various error types to ApplicationError
     */
    static normalizeError(error: any, correlationId?: string): ApplicationError;
    /**
     * Handle Prisma-specific errors
     */
    private static handlePrismaError;
    /**
     * Express error handling middleware
     */
    static middleware(): (error: any, req: Request, res: Response, next: NextFunction) => void;
    /**
     * Async wrapper for route handlers
     */
    static asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Log error with context
     */
    private static logError;
    /**
     * Update error count statistics
     */
    private static updateErrorCounts;
    /**
     * Check if error count exceeds alert threshold
     */
    private static checkAlertThresholds;
    /**
     * Get error statistics
     */
    static getErrorStats(): Record<string, number>;
    /**
     * Create a custom error
     */
    static createError(code: ErrorCodes, message?: string, details?: Record<string, any>, correlationId?: string): ApplicationError;
}
export declare const throwError: (code: ErrorCodes, message?: string, details?: Record<string, any>) => never;
export declare const createBusinessError: (message: string, details?: Record<string, any>) => ApplicationError;
export declare const createValidationError: (message: string, details?: Record<string, any>) => ApplicationError;
export declare const createAuthError: (message?: string) => ApplicationError;
export declare const createNotFoundError: (resource?: string) => ApplicationError;
export declare const errorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: typeof ProfessionalErrorHandler.asyncHandler;
export default ProfessionalErrorHandler;
//# sourceMappingURL=unified-error-handler.d.ts.map