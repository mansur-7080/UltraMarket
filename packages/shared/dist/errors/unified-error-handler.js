"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.createNotFoundError = exports.createAuthError = exports.createValidationError = exports.createBusinessError = exports.throwError = exports.ProfessionalErrorHandler = exports.ApplicationError = exports.ErrorSeverity = exports.ErrorCodes = void 0;
const library_1 = require("@prisma/client/runtime/library");
const zod_1 = require("zod");
const professional_logger_1 = require("../logging/professional-logger");
// Error types and codes
var ErrorCodes;
(function (ErrorCodes) {
    // Authentication errors
    ErrorCodes["AUTHENTICATION_FAILED"] = "AUTH_001";
    ErrorCodes["TOKEN_EXPIRED"] = "AUTH_002";
    ErrorCodes["TOKEN_INVALID"] = "AUTH_003";
    ErrorCodes["INSUFFICIENT_PERMISSIONS"] = "AUTH_004";
    ErrorCodes["USER_NOT_FOUND"] = "AUTH_005";
    // Validation errors
    ErrorCodes["VALIDATION_FAILED"] = "VAL_001";
    ErrorCodes["INVALID_INPUT"] = "VAL_002";
    ErrorCodes["REQUIRED_FIELD_MISSING"] = "VAL_003";
    ErrorCodes["INVALID_FORMAT"] = "VAL_004";
    // Database errors
    ErrorCodes["DATABASE_ERROR"] = "DB_001";
    ErrorCodes["RECORD_NOT_FOUND"] = "DB_002";
    ErrorCodes["UNIQUE_CONSTRAINT_VIOLATION"] = "DB_003";
    ErrorCodes["FOREIGN_KEY_CONSTRAINT_VIOLATION"] = "DB_004";
    ErrorCodes["CONNECTION_ERROR"] = "DB_005";
    // Business logic errors
    ErrorCodes["BUSINESS_RULE_VIOLATION"] = "BIZ_001";
    ErrorCodes["INSUFFICIENT_INVENTORY"] = "BIZ_002";
    ErrorCodes["INVALID_OPERATION"] = "BIZ_003";
    ErrorCodes["PAYMENT_FAILED"] = "BIZ_004";
    // External service errors
    ErrorCodes["PAYMENT_SERVICE_ERROR"] = "EXT_001";
    ErrorCodes["SMS_SERVICE_ERROR"] = "EXT_002";
    ErrorCodes["EMAIL_SERVICE_ERROR"] = "EXT_003";
    ErrorCodes["FILE_UPLOAD_ERROR"] = "EXT_004";
    // System errors
    ErrorCodes["INTERNAL_SERVER_ERROR"] = "SYS_001";
    ErrorCodes["SERVICE_UNAVAILABLE"] = "SYS_002";
    ErrorCodes["RATE_LIMIT_EXCEEDED"] = "SYS_003";
    ErrorCodes["NETWORK_ERROR"] = "SYS_004";
    // Security errors
    ErrorCodes["SECURITY_THREAT_DETECTED"] = "SEC_001";
    ErrorCodes["SUSPICIOUS_ACTIVITY"] = "SEC_002";
    ErrorCodes["IP_BLOCKED"] = "SEC_003";
    ErrorCodes["CAPTCHA_REQUIRED"] = "SEC_004";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
// Error severity levels
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
// Uzbek error messages
const ErrorMessages = {
    // Authentication errors
    [ErrorCodes.AUTHENTICATION_FAILED]: {
        uz: 'Autentifikatsiya muvaffaqiyatsiz tugadi',
        en: 'Authentication failed'
    },
    [ErrorCodes.TOKEN_EXPIRED]: {
        uz: 'Tokenning muddati tugagan',
        en: 'Token has expired'
    },
    [ErrorCodes.TOKEN_INVALID]: {
        uz: 'Noto\'g\'ri token',
        en: 'Invalid token'
    },
    [ErrorCodes.INSUFFICIENT_PERMISSIONS]: {
        uz: 'Yetarli ruxsat yo\'q',
        en: 'Insufficient permissions'
    },
    [ErrorCodes.USER_NOT_FOUND]: {
        uz: 'Foydalanuvchi topilmadi',
        en: 'User not found'
    },
    // Validation errors
    [ErrorCodes.VALIDATION_FAILED]: {
        uz: 'Ma\'lumotlarni tekshirish muvaffaqiyatsiz',
        en: 'Validation failed'
    },
    [ErrorCodes.INVALID_INPUT]: {
        uz: 'Noto\'g\'ri ma\'lumot kiritildi',
        en: 'Invalid input provided'
    },
    [ErrorCodes.REQUIRED_FIELD_MISSING]: {
        uz: 'Majburiy maydon to\'ldirilmagan',
        en: 'Required field is missing'
    },
    [ErrorCodes.INVALID_FORMAT]: {
        uz: 'Noto\'g\'ri format',
        en: 'Invalid format'
    },
    // Database errors
    [ErrorCodes.DATABASE_ERROR]: {
        uz: 'Ma\'lumotlar bazasi xatosi',
        en: 'Database error'
    },
    [ErrorCodes.RECORD_NOT_FOUND]: {
        uz: 'Yozuv topilmadi',
        en: 'Record not found'
    },
    [ErrorCodes.UNIQUE_CONSTRAINT_VIOLATION]: {
        uz: 'Bunday ma\'lumot allaqachon mavjud',
        en: 'This record already exists'
    },
    [ErrorCodes.FOREIGN_KEY_CONSTRAINT_VIOLATION]: {
        uz: 'Bog\'liq ma\'lumot topilmadi',
        en: 'Related record not found'
    },
    [ErrorCodes.CONNECTION_ERROR]: {
        uz: 'Ulanish xatosi',
        en: 'Connection error'
    },
    // Business logic errors
    [ErrorCodes.BUSINESS_RULE_VIOLATION]: {
        uz: 'Biznes qoidasi buzildi',
        en: 'Business rule violation'
    },
    [ErrorCodes.INSUFFICIENT_INVENTORY]: {
        uz: 'Yetarli mahsulot yo\'q',
        en: 'Insufficient inventory'
    },
    [ErrorCodes.INVALID_OPERATION]: {
        uz: 'Noto\'g\'ri operatsiya',
        en: 'Invalid operation'
    },
    [ErrorCodes.PAYMENT_FAILED]: {
        uz: 'To\'lov muvaffaqiyatsiz',
        en: 'Payment failed'
    },
    // External service errors
    [ErrorCodes.PAYMENT_SERVICE_ERROR]: {
        uz: 'To\'lov xizmati xatosi',
        en: 'Payment service error'
    },
    [ErrorCodes.SMS_SERVICE_ERROR]: {
        uz: 'SMS xizmati xatosi',
        en: 'SMS service error'
    },
    [ErrorCodes.EMAIL_SERVICE_ERROR]: {
        uz: 'Email xizmati xatosi',
        en: 'Email service error'
    },
    [ErrorCodes.FILE_UPLOAD_ERROR]: {
        uz: 'Fayl yuklash xatosi',
        en: 'File upload error'
    },
    // System errors
    [ErrorCodes.INTERNAL_SERVER_ERROR]: {
        uz: 'Ichki server xatosi',
        en: 'Internal server error'
    },
    [ErrorCodes.SERVICE_UNAVAILABLE]: {
        uz: 'Xizmat mavjud emas',
        en: 'Service unavailable'
    },
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: {
        uz: 'Juda ko\'p so\'rov yuborildi',
        en: 'Too many requests'
    },
    [ErrorCodes.NETWORK_ERROR]: {
        uz: 'Tarmoq xatosi',
        en: 'Network error'
    },
    // Security errors
    [ErrorCodes.SECURITY_THREAT_DETECTED]: {
        uz: 'Xavfsizlik tahdidi aniqlandi',
        en: 'Security threat detected'
    },
    [ErrorCodes.SUSPICIOUS_ACTIVITY]: {
        uz: 'Shubhali faoliyat aniqlandi',
        en: 'Suspicious activity detected'
    },
    [ErrorCodes.IP_BLOCKED]: {
        uz: 'IP manzil bloklangan',
        en: 'IP address blocked'
    },
    [ErrorCodes.CAPTCHA_REQUIRED]: {
        uz: 'CAPTCHA talab qilinadi',
        en: 'CAPTCHA required'
    }
};
/**
 * Custom Application Error class
 */
class ApplicationError extends Error {
    code;
    severity;
    statusCode;
    correlationId;
    details;
    timestamp;
    constructor(code, message, details = {}, correlationId) {
        const errorMessage = message || ErrorMessages[code]?.uz || 'Noma\'lum xato';
        super(errorMessage);
        this.name = 'ApplicationError';
        this.code = code;
        this.message = errorMessage;
        this.details = details;
        this.correlationId = correlationId || this.generateCorrelationId();
        this.timestamp = new Date().toISOString();
        // Set severity and status code based on error code
        this.severity = this.getSeverity(code);
        this.statusCode = this.getStatusCode(code);
        // Capture stack trace
        Error.captureStackTrace(this, ApplicationError);
    }
    getSeverity(code) {
        if (code.startsWith('SEC_') || code === ErrorCodes.AUTHENTICATION_FAILED) {
            return ErrorSeverity.HIGH;
        }
        if (code.startsWith('DB_') || code.startsWith('SYS_')) {
            return ErrorSeverity.MEDIUM;
        }
        if (code.startsWith('VAL_') || code.startsWith('BIZ_')) {
            return ErrorSeverity.LOW;
        }
        return ErrorSeverity.MEDIUM;
    }
    getStatusCode(code) {
        // Authentication errors
        if ([ErrorCodes.AUTHENTICATION_FAILED, ErrorCodes.TOKEN_EXPIRED, ErrorCodes.TOKEN_INVALID].includes(code)) {
            return 401;
        }
        if (code === ErrorCodes.INSUFFICIENT_PERMISSIONS) {
            return 403;
        }
        // Not found errors
        if ([ErrorCodes.USER_NOT_FOUND, ErrorCodes.RECORD_NOT_FOUND].includes(code)) {
            return 404;
        }
        // Validation errors
        if (code.startsWith('VAL_')) {
            return 400;
        }
        // Conflict errors
        if ([ErrorCodes.UNIQUE_CONSTRAINT_VIOLATION, ErrorCodes.BUSINESS_RULE_VIOLATION].includes(code)) {
            return 409;
        }
        // Rate limiting
        if (code === ErrorCodes.RATE_LIMIT_EXCEEDED) {
            return 429;
        }
        // Service unavailable
        if ([ErrorCodes.SERVICE_UNAVAILABLE, ErrorCodes.CONNECTION_ERROR].includes(code)) {
            return 503;
        }
        // Default to 500 for system errors
        return 500;
    }
    generateCorrelationId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            severity: this.severity,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            correlationId: this.correlationId,
            details: this.details,
            stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
        };
    }
}
exports.ApplicationError = ApplicationError;
/**
 * Professional Error Handler class
 */
class ProfessionalErrorHandler {
    static errorCounts = new Map();
    static alertThresholds = new Map();
    static {
        // Set alert thresholds
        ProfessionalErrorHandler.alertThresholds.set(ErrorCodes.DATABASE_ERROR, 10);
        ProfessionalErrorHandler.alertThresholds.set(ErrorCodes.AUTHENTICATION_FAILED, 50);
        ProfessionalErrorHandler.alertThresholds.set(ErrorCodes.SECURITY_THREAT_DETECTED, 1);
    }
    /**
     * Convert various error types to ApplicationError
     */
    static normalizeError(error, correlationId) {
        // Already an ApplicationError
        if (error instanceof ApplicationError) {
            return error;
        }
        // Prisma errors
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            return ProfessionalErrorHandler.handlePrismaError(error, correlationId);
        }
        // Zod validation errors
        if (error instanceof zod_1.ZodError) {
            return new ApplicationError(ErrorCodes.VALIDATION_FAILED, 'Ma\'lumotlarni tekshirish muvaffaqiyatsiz', {
                validationErrors: error.errors.map(err => ({
                    field: String(err.path),
                    message: err.message,
                    code: err.code
                }))
            }, correlationId);
        }
        // JWT errors
        if (error.name === 'JsonWebTokenError') {
            return new ApplicationError(ErrorCodes.TOKEN_INVALID, undefined, { originalError: error.message }, correlationId);
        }
        if (error.name === 'TokenExpiredError') {
            return new ApplicationError(ErrorCodes.TOKEN_EXPIRED, undefined, { originalError: error.message }, correlationId);
        }
        // Network/Connection errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return new ApplicationError(ErrorCodes.CONNECTION_ERROR, 'Ulanish xatosi', { originalError: error.message, code: error.code }, correlationId);
        }
        // Generic error
        return new ApplicationError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message || 'Ichki server xatosi', { originalError: error.message, stack: error.stack }, correlationId);
    }
    /**
     * Handle Prisma-specific errors
     */
    static handlePrismaError(error, correlationId) {
        switch (error.code) {
            case 'P2002': // Unique constraint violation
                return new ApplicationError(ErrorCodes.UNIQUE_CONSTRAINT_VIOLATION, 'Bunday ma\'lumot allaqachon mavjud', { field: error.meta?.target, originalError: error.message }, correlationId);
            case 'P2025': // Record not found
                return new ApplicationError(ErrorCodes.RECORD_NOT_FOUND, 'Yozuv topilmadi', { originalError: error.message }, correlationId);
            case 'P2003': // Foreign key constraint violation
                return new ApplicationError(ErrorCodes.FOREIGN_KEY_CONSTRAINT_VIOLATION, 'Bog\'liq ma\'lumot topilmadi', { field: error.meta?.field_name, originalError: error.message }, correlationId);
            case 'P2028': // Transaction API error
                return new ApplicationError(ErrorCodes.DATABASE_ERROR, 'Ma\'lumotlar bazasi operatsiya xatosi', { originalError: error.message }, correlationId);
            default:
                return new ApplicationError(ErrorCodes.DATABASE_ERROR, 'Ma\'lumotlar bazasi xatosi', { code: error.code, originalError: error.message }, correlationId);
        }
    }
    /**
     * Express error handling middleware
     */
    static middleware() {
        return (error, req, res, next) => {
            const correlationId = req.headers['x-correlation-id'] ||
                req.headers['x-request-id'] ||
                `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const normalizedError = ProfessionalErrorHandler.normalizeError(error, correlationId);
            // Update error counts for monitoring
            ProfessionalErrorHandler.updateErrorCounts(normalizedError.code);
            // Log error with appropriate level
            ProfessionalErrorHandler.logError(normalizedError, req);
            // Check for alert thresholds
            ProfessionalErrorHandler.checkAlertThresholds(normalizedError.code);
            // Send response
            const response = {
                success: false,
                error: {
                    code: normalizedError.code,
                    message: normalizedError.message,
                    correlationId: normalizedError.correlationId,
                    timestamp: normalizedError.timestamp,
                    ...(process.env.NODE_ENV === 'development' && {
                        details: normalizedError.details,
                        stack: normalizedError.stack
                    })
                }
            };
            res.status(normalizedError.statusCode).json(response);
        };
    }
    /**
     * Async wrapper for route handlers
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    /**
     * Log error with context
     */
    static logError(error, req) {
        const context = {
            correlationId: error.correlationId,
            code: error.code,
            severity: error.severity,
            details: error.details,
            ...(req && {
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.userId
            })
        };
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                professional_logger_1.logger.error(`🚨 CRITICAL ERROR: ${error.message}`, error, context);
                break;
            case ErrorSeverity.HIGH:
                professional_logger_1.logger.error(`🔥 HIGH SEVERITY: ${error.message}`, error, context);
                break;
            case ErrorSeverity.MEDIUM:
                professional_logger_1.logger.warn(`⚠️  MEDIUM SEVERITY: ${error.message}`, context);
                break;
            case ErrorSeverity.LOW:
                professional_logger_1.logger.info(`ℹ️  LOW SEVERITY: ${error.message}`, context);
                break;
        }
    }
    /**
     * Update error count statistics
     */
    static updateErrorCounts(code) {
        const current = ProfessionalErrorHandler.errorCounts.get(code) || 0;
        ProfessionalErrorHandler.errorCounts.set(code, current + 1);
    }
    /**
     * Check if error count exceeds alert threshold
     */
    static checkAlertThresholds(code) {
        const threshold = ProfessionalErrorHandler.alertThresholds.get(code);
        const count = ProfessionalErrorHandler.errorCounts.get(code) || 0;
        if (threshold && count >= threshold) {
            professional_logger_1.logger.security(`Alert: Error ${code} exceeded threshold`, 'critical', {
                errorCode: code,
                count,
                threshold,
                timeWindow: '1 hour'
            });
            // Reset count after alert
            ProfessionalErrorHandler.errorCounts.set(code, 0);
        }
    }
    /**
     * Get error statistics
     */
    static getErrorStats() {
        const stats = {};
        ProfessionalErrorHandler.errorCounts.forEach((count, code) => {
            stats[code] = count;
        });
        return stats;
    }
    /**
     * Create a custom error
     */
    static createError(code, message, details, correlationId) {
        return new ApplicationError(code, message, details, correlationId);
    }
}
exports.ProfessionalErrorHandler = ProfessionalErrorHandler;
// Utility functions
const throwError = (code, message, details) => {
    throw new ApplicationError(code, message, details);
};
exports.throwError = throwError;
const createBusinessError = (message, details) => {
    return new ApplicationError(ErrorCodes.BUSINESS_RULE_VIOLATION, message, details);
};
exports.createBusinessError = createBusinessError;
const createValidationError = (message, details) => {
    return new ApplicationError(ErrorCodes.VALIDATION_FAILED, message, details);
};
exports.createValidationError = createValidationError;
const createAuthError = (message) => {
    return new ApplicationError(ErrorCodes.AUTHENTICATION_FAILED, message);
};
exports.createAuthError = createAuthError;
const createNotFoundError = (resource = 'Resource') => {
    return new ApplicationError(ErrorCodes.RECORD_NOT_FOUND, `${resource} topilmadi`);
};
exports.createNotFoundError = createNotFoundError;
// Express middleware helpers
exports.errorHandler = ProfessionalErrorHandler.middleware();
exports.asyncHandler = ProfessionalErrorHandler.asyncHandler;
exports.default = ProfessionalErrorHandler;
//# sourceMappingURL=unified-error-handler.js.map