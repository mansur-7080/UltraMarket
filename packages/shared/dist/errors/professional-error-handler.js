"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.createSystemError = exports.createBusinessError = exports.createAuthorizationError = exports.createAuthError = exports.createValidationError = exports.professionalErrorManager = exports.ProfessionalErrorManager = exports.ProfessionalError = exports.ErrorCategory = exports.ErrorSeverity = exports.ErrorCode = void 0;
const tslib_1 = require("tslib");
const professional_logger_1 = require("../logging/professional-logger");
const events_1 = tslib_1.__importDefault(require("events"));
/**
 * Professional Error Codes Enumeration
 */
var ErrorCode;
(function (ErrorCode) {
    // Authentication & Authorization
    ErrorCode["AUTH_TOKEN_MISSING"] = "AUTH_TOKEN_MISSING";
    ErrorCode["AUTH_TOKEN_INVALID"] = "AUTH_TOKEN_INVALID";
    ErrorCode["AUTH_TOKEN_EXPIRED"] = "AUTH_TOKEN_EXPIRED";
    ErrorCode["AUTH_INSUFFICIENT_PERMISSIONS"] = "AUTH_INSUFFICIENT_PERMISSIONS";
    // Validation Errors
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["REQUIRED_FIELD_MISSING"] = "REQUIRED_FIELD_MISSING";
    ErrorCode["INVALID_EMAIL_FORMAT"] = "INVALID_EMAIL_FORMAT";
    ErrorCode["INVALID_PHONE_FORMAT"] = "INVALID_PHONE_FORMAT";
    ErrorCode["PASSWORD_TOO_WEAK"] = "PASSWORD_TOO_WEAK";
    // Business Logic Errors
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["PRODUCT_NOT_FOUND"] = "PRODUCT_NOT_FOUND";
    ErrorCode["ORDER_NOT_FOUND"] = "ORDER_NOT_FOUND";
    ErrorCode["INSUFFICIENT_STOCK"] = "INSUFFICIENT_STOCK";
    ErrorCode["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    ErrorCode["CART_EMPTY"] = "CART_EMPTY";
    // System Errors
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["CACHE_ERROR"] = "CACHE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorCode["FILE_UPLOAD_ERROR"] = "FILE_UPLOAD_ERROR";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Technical Errors
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    // Security Errors
    ErrorCode["CSRF_TOKEN_MISSING"] = "CSRF_TOKEN_MISSING";
    ErrorCode["CSRF_TOKEN_INVALID"] = "CSRF_TOKEN_INVALID";
    ErrorCode["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    ErrorCode["ACCESS_DENIED"] = "ACCESS_DENIED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Error Severity Levels
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Error Categories
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["BUSINESS_LOGIC"] = "business_logic";
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["SECURITY"] = "security";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["DATABASE"] = "database";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
/**
 * Professional Application Error Class
 */
class ProfessionalError extends Error {
    code;
    statusCode;
    severity;
    category;
    details;
    field;
    value;
    suggestions;
    documentation;
    timestamp;
    requestId;
    userId;
    traceId;
    constructor(code, message, statusCode = 500, options = {}) {
        super(message);
        this.name = 'ProfessionalError';
        this.code = code;
        this.statusCode = statusCode;
        this.severity = options.severity || this.determineSeverity(statusCode);
        this.category = options.category || this.determineCategory(code);
        this.details = options.details || {};
        this.field = options.field;
        this.value = options.value;
        this.suggestions = options.suggestions || [];
        this.documentation = options.documentation;
        this.timestamp = new Date().toISOString();
        this.requestId = options.requestId;
        this.userId = options.userId;
        this.traceId = options.traceId;
        // Maintain stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ProfessionalError);
        }
        // Include original error if provided
        if (options.cause) {
            this.stack += `\nCaused by: ${options.cause.stack}`;
        }
    }
    determineSeverity(statusCode) {
        if (statusCode >= 500)
            return ErrorSeverity.CRITICAL;
        if (statusCode >= 400)
            return ErrorSeverity.HIGH;
        if (statusCode >= 300)
            return ErrorSeverity.MEDIUM;
        return ErrorSeverity.LOW;
    }
    determineCategory(code) {
        const codeStr = code.toString();
        if (codeStr.startsWith('AUTH_'))
            return ErrorCategory.AUTHENTICATION;
        if (codeStr.includes('PERMISSION'))
            return ErrorCategory.AUTHORIZATION;
        if (codeStr.includes('VALIDATION') || codeStr.includes('INVALID'))
            return ErrorCategory.VALIDATION;
        if (codeStr.includes('DATABASE'))
            return ErrorCategory.DATABASE;
        if (codeStr.includes('SECURITY') || codeStr.includes('CSRF') || codeStr.includes('SUSPICIOUS'))
            return ErrorCategory.SECURITY;
        if (codeStr.includes('NETWORK') || codeStr.includes('TIMEOUT'))
            return ErrorCategory.NETWORK;
        if (codeStr.includes('NOT_FOUND') || codeStr.includes('INSUFFICIENT'))
            return ErrorCategory.BUSINESS_LOGIC;
        return ErrorCategory.SYSTEM;
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            field: this.field,
            value: this.value,
            severity: this.severity,
            category: this.category,
            timestamp: this.timestamp,
            requestId: this.requestId,
            userId: this.userId,
            traceId: this.traceId,
            suggestions: this.suggestions,
            documentation: this.documentation
        };
    }
}
exports.ProfessionalError = ProfessionalError;
/**
 * Professional Error Manager
 */
class ProfessionalErrorManager extends events_1.default {
    static instance;
    errorCounts = new Map();
    recentErrors = [];
    maxRecentErrors = 1000;
    constructor() {
        super();
        this.setupErrorTracking();
    }
    static getInstance() {
        if (!ProfessionalErrorManager.instance) {
            ProfessionalErrorManager.instance = new ProfessionalErrorManager();
        }
        return ProfessionalErrorManager.instance;
    }
    /**
     * Create professional error with context
     */
    createError(code, message, statusCode, options) {
        const error = new ProfessionalError(code, message, statusCode, options);
        this.trackError(error);
        return error;
    }
    /**
     * Professional Express error middleware
     */
    getExpressErrorHandler() {
        return (error, req, res, next) => {
            // Generate request ID if not present
            const requestId = req.headers['x-request-id'] ||
                this.generateRequestId();
            let professionalError;
            // Convert regular errors to professional errors
            if (error instanceof ProfessionalError) {
                professionalError = error;
                professionalError.requestId = requestId;
            }
            else {
                // Handle different types of errors
                professionalError = this.convertToProfessionalError(error, requestId);
            }
            // Add request context
            professionalError.details.request = {
                method: req.method,
                url: req.url,
                headers: this.sanitizeHeaders(req.headers),
                query: req.query,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };
            // Track and log error
            this.trackError(professionalError);
            this.logError(professionalError, req);
            // Send error response
            this.sendErrorResponse(res, professionalError);
            // Emit error event for monitoring
            this.emit('error', { error: professionalError, request: req });
        };
    }
    /**
     * Async error wrapper for route handlers
     */
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch((error) => {
                // Add request context to error
                if (error instanceof ProfessionalError) {
                    error.requestId = req.headers['x-request-id'] ||
                        this.generateRequestId();
                }
                next(error);
            });
        };
    }
    /**
     * Validation error creator
     */
    createValidationError(field, value, message, suggestions = []) {
        return this.createError(ErrorCode.VALIDATION_ERROR, message, 400, {
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            field,
            value,
            suggestions: suggestions.length > 0 ? suggestions : [
                `Please provide a valid ${field}`,
                'Check the API documentation for correct format',
                'Contact support if the issue persists'
            ]
        });
    }
    /**
     * Authentication error creator
     */
    createAuthError(message = 'Authentication required', code = ErrorCode.AUTH_TOKEN_MISSING) {
        return this.createError(code, message, 401, {
            category: ErrorCategory.AUTHENTICATION,
            severity: ErrorSeverity.HIGH,
            suggestions: [
                'Provide a valid authentication token',
                'Check if your session has expired',
                'Login again if necessary'
            ]
        });
    }
    /**
     * Authorization error creator
     */
    createAuthorizationError(message = 'Insufficient permissions') {
        return this.createError(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, message, 403, {
            category: ErrorCategory.AUTHORIZATION,
            severity: ErrorSeverity.HIGH,
            suggestions: [
                'Contact administrator for required permissions',
                'Check your user role and permissions',
                'Ensure you are accessing the correct resource'
            ]
        });
    }
    /**
     * Business logic error creator
     */
    createBusinessError(code, message, details) {
        return this.createError(code, message, 400, {
            category: ErrorCategory.BUSINESS_LOGIC,
            severity: ErrorSeverity.MEDIUM,
            details
        });
    }
    /**
     * System error creator
     */
    createSystemError(message = 'Internal server error', originalError) {
        return this.createError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, {
            category: ErrorCategory.SYSTEM,
            severity: ErrorSeverity.CRITICAL,
            cause: originalError
        });
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
        const errorsByCode = Array.from(this.errorCounts.entries())
            .map(([code, count]) => ({ code, count }))
            .sort((a, b) => b.count - a.count);
        const errorsByCategory = new Map();
        const errorsBySeverity = new Map();
        this.recentErrors.forEach(({ error }) => {
            const categoryCount = errorsByCategory.get(error.category) || 0;
            errorsByCategory.set(error.category, categoryCount + 1);
            const severityCount = errorsBySeverity.get(error.severity) || 0;
            errorsBySeverity.set(error.severity, severityCount + 1);
        });
        const topErrors = errorsByCode.slice(0, 10).map(({ code, count }) => ({
            code,
            count,
            percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
        }));
        return {
            totalErrors,
            errorsByCode,
            errorsByCategory: Array.from(errorsByCategory.entries()).map(([category, count]) => ({ category, count })),
            errorsBySeverity: Array.from(errorsBySeverity.entries()).map(([severity, count]) => ({ severity, count })),
            recentErrorsCount: this.recentErrors.length,
            topErrors
        };
    }
    /**
     * Health check for error handling system
     */
    healthCheck() {
        const now = Date.now();
        const last5Minutes = now - (5 * 60 * 1000);
        const recentErrors = this.recentErrors.filter(({ timestamp }) => timestamp > last5Minutes);
        const criticalErrors = recentErrors.filter(({ error }) => error.severity === ErrorSeverity.CRITICAL).length;
        const errorRate = recentErrors.length / 5; // Errors per minute
        const healthy = errorRate < 10 && criticalErrors < 5; // Thresholds
        return {
            healthy,
            errorRate,
            criticalErrors,
            recentErrors: recentErrors.length
        };
    }
    // Private helper methods
    setupErrorTracking() {
        // Cleanup old errors every hour
        setInterval(() => {
            const now = Date.now();
            const oneHourAgo = now - (60 * 60 * 1000);
            this.recentErrors = this.recentErrors.filter(({ timestamp }) => timestamp > oneHourAgo);
            professional_logger_1.logger.debug('🧹 Error tracking cleanup completed', {
                remainingErrors: this.recentErrors.length
            });
        }, 60 * 60 * 1000);
    }
    trackError(error) {
        // Update error counts
        const currentCount = this.errorCounts.get(error.code) || 0;
        this.errorCounts.set(error.code, currentCount + 1);
        // Add to recent errors
        this.recentErrors.push({ error, timestamp: Date.now() });
        // Maintain max recent errors limit
        if (this.recentErrors.length > this.maxRecentErrors) {
            this.recentErrors = this.recentErrors.slice(-this.maxRecentErrors);
        }
        // Emit tracking event
        this.emit('error-tracked', { error });
    }
    logError(error, req) {
        const logData = {
            errorCode: error.code,
            message: error.message,
            severity: error.severity,
            category: error.category,
            statusCode: error.statusCode,
            requestId: error.requestId,
            userId: error.userId,
            traceId: error.traceId,
            field: error.field,
            value: error.value,
            details: error.details,
            stack: error.stack,
            ...(req && {
                request: {
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                }
            })
        };
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                professional_logger_1.logger.error('🚨 CRITICAL ERROR', logData);
                break;
            case ErrorSeverity.HIGH:
                professional_logger_1.logger.error('❌ HIGH SEVERITY ERROR', logData);
                break;
            case ErrorSeverity.MEDIUM:
                professional_logger_1.logger.warn('⚠️ MEDIUM SEVERITY ERROR', logData);
                break;
            case ErrorSeverity.LOW:
                professional_logger_1.logger.info('ℹ️ LOW SEVERITY ERROR', logData);
                break;
        }
    }
    sendErrorResponse(res, error) {
        // Don't expose internal details in production
        const isProduction = process.env.NODE_ENV === 'production';
        const errorResponse = {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                severity: error.severity,
                category: error.category,
                timestamp: error.timestamp,
                requestId: error.requestId,
                field: error.field,
                suggestions: error.suggestions,
                documentation: error.documentation,
                ...((!isProduction || error.severity !== ErrorSeverity.CRITICAL) && {
                    details: error.details,
                    value: error.value,
                    userId: error.userId,
                    traceId: error.traceId
                })
            },
            meta: {
                requestId: error.requestId || 'unknown',
                timestamp: new Date().toISOString(),
                version: process.env.APP_VERSION || '1.0.0',
                endpoint: res.req?.url || 'unknown',
                method: res.req?.method || 'unknown'
            }
        };
        res.status(error.statusCode).json(errorResponse);
    }
    convertToProfessionalError(error, requestId) {
        // Handle specific error types
        if (error.name === 'ValidationError') {
            return this.createValidationError('validation', error.message, error.message);
        }
        if (error.name === 'CastError') {
            return this.createValidationError('cast', error.message, 'Invalid data format');
        }
        if (error.name === 'MongoError' || error.name === 'MongoServerError') {
            return this.createError(ErrorCode.DATABASE_ERROR, 'Database operation failed', 500, {
                category: ErrorCategory.DATABASE,
                severity: ErrorSeverity.HIGH,
                details: { originalError: error.message },
                requestId
            });
        }
        if (error.name === 'TimeoutError') {
            return this.createError(ErrorCode.TIMEOUT_ERROR, 'Operation timed out', 408, {
                category: ErrorCategory.NETWORK,
                severity: ErrorSeverity.MEDIUM,
                requestId
            });
        }
        // Default to system error
        return this.createSystemError(error.message, error);
    }
    sanitizeHeaders(headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        const sanitized = { ...headers };
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    generateRequestId() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
}
exports.ProfessionalErrorManager = ProfessionalErrorManager;
// Export singleton instance and convenience functions
exports.professionalErrorManager = ProfessionalErrorManager.getInstance();
// Convenience error creators
exports.createValidationError = exports.professionalErrorManager.createValidationError.bind(exports.professionalErrorManager);
exports.createAuthError = exports.professionalErrorManager.createAuthError.bind(exports.professionalErrorManager);
exports.createAuthorizationError = exports.professionalErrorManager.createAuthorizationError.bind(exports.professionalErrorManager);
exports.createBusinessError = exports.professionalErrorManager.createBusinessError.bind(exports.professionalErrorManager);
exports.createSystemError = exports.professionalErrorManager.createSystemError.bind(exports.professionalErrorManager);
// Middleware exports
exports.errorHandler = exports.professionalErrorManager.getExpressErrorHandler();
exports.asyncHandler = exports.professionalErrorManager.asyncHandler.bind(exports.professionalErrorManager);
// Error manager events for monitoring integration
exports.professionalErrorManager.on('error', ({ error, request }) => {
    // Integration point for external monitoring services
    if (error.severity === ErrorSeverity.CRITICAL) {
        // Send to alerting system
        professional_logger_1.logger.error('🚨 CRITICAL ERROR ALERT', {
            error: error.toJSON(),
            request: {
                method: request.method,
                url: request.url,
                ip: request.ip
            }
        });
    }
});
professional_logger_1.logger.info('🏗️ Professional Error Handler loaded', {
    version: '3.0.0',
    features: [
        'Standardized error codes',
        'Severity-based categorization',
        'Request context tracking',
        'Error statistics',
        'Security-aware logging',
        'Monitoring integration',
        'Async error handling',
        'Professional error responses'
    ]
});
//# sourceMappingURL=professional-error-handler.js.map