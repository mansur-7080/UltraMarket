"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRateLimit = exports.asyncHandler = exports.errorHandler = exports.PaymentFailedError = exports.CustomerBlockedError = exports.InsufficientStockError = exports.OrderNotFoundError = exports.AppError = exports.ErrorCategory = exports.ErrorSeverity = exports.OrderErrorCodes = void 0;
var logger_1 = require("../utils/logger");
var crypto_1 = require("crypto");
var perf_hooks_1 = require("perf_hooks");
// Professional Order Service Error Codes
var OrderErrorCodes;
(function (OrderErrorCodes) {
    // Order Management Errors
    OrderErrorCodes["ORDER_NOT_FOUND"] = "ORD_001";
    OrderErrorCodes["ORDER_INVALID_STATUS"] = "ORD_002";
    OrderErrorCodes["ORDER_CANNOT_CANCEL"] = "ORD_003";
    OrderErrorCodes["ORDER_ALREADY_PROCESSED"] = "ORD_004";
    OrderErrorCodes["ORDER_EXPIRED"] = "ORD_005";
    OrderErrorCodes["ORDER_LIMIT_EXCEEDED"] = "ORD_006";
    // Inventory Errors
    OrderErrorCodes["PRODUCT_OUT_OF_STOCK"] = "INV_001";
    OrderErrorCodes["INSUFFICIENT_QUANTITY"] = "INV_002";
    OrderErrorCodes["PRODUCT_DISCONTINUED"] = "INV_003";
    OrderErrorCodes["INVENTORY_LOCKED"] = "INV_004";
    OrderErrorCodes["RESERVATION_FAILED"] = "INV_005";
    // Customer Errors
    OrderErrorCodes["CUSTOMER_NOT_FOUND"] = "CUS_001";
    OrderErrorCodes["CUSTOMER_BLOCKED"] = "CUS_002";
    OrderErrorCodes["CUSTOMER_LIMIT_EXCEEDED"] = "CUS_003";
    OrderErrorCodes["ADDRESS_INVALID"] = "CUS_004";
    OrderErrorCodes["DELIVERY_UNAVAILABLE"] = "CUS_005";
    // Payment Integration Errors
    OrderErrorCodes["PAYMENT_METHOD_INVALID"] = "PAY_001";
    OrderErrorCodes["PAYMENT_FAILED"] = "PAY_002";
    OrderErrorCodes["PAYMENT_TIMEOUT"] = "PAY_003";
    OrderErrorCodes["REFUND_FAILED"] = "PAY_004";
    OrderErrorCodes["PAYMENT_VERIFICATION_FAILED"] = "PAY_005";
    // System Errors
    OrderErrorCodes["DATABASE_ERROR"] = "SYS_001";
    OrderErrorCodes["EXTERNAL_SERVICE_ERROR"] = "SYS_002";
    OrderErrorCodes["VALIDATION_ERROR"] = "SYS_003";
    OrderErrorCodes["AUTHENTICATION_ERROR"] = "SYS_004";
    OrderErrorCodes["AUTHORIZATION_ERROR"] = "SYS_005";
    OrderErrorCodes["RATE_LIMIT_EXCEEDED"] = "SYS_006";
    // Business Rule Errors
    OrderErrorCodes["MINIMUM_ORDER_NOT_MET"] = "BUS_001";
    OrderErrorCodes["MAXIMUM_ORDER_EXCEEDED"] = "BUS_002";
    OrderErrorCodes["DELIVERY_SLOT_UNAVAILABLE"] = "BUS_003";
    OrderErrorCodes["PROMOTION_INVALID"] = "BUS_004";
    OrderErrorCodes["REGION_RESTRICTED"] = "BUS_005";
})(OrderErrorCodes || (exports.OrderErrorCodes = OrderErrorCodes = {}));
// Professional Error Severity Levels
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
// Professional Error Categories
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["BUSINESS_LOGIC"] = "business_logic";
    ErrorCategory["SECURITY"] = "security";
    ErrorCategory["PERFORMANCE"] = "performance";
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["INTEGRATION"] = "integration";
    ErrorCategory["COMPLIANCE"] = "compliance";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
// Professional AppError class
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(message, statusCode, errorCode, severity, category, context) {
        if (severity === void 0) { severity = ErrorSeverity.MEDIUM; }
        if (category === void 0) { category = ErrorCategory.BUSINESS_LOGIC; }
        if (context === void 0) { context = {}; }
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.errorCode = errorCode;
        _this.severity = severity;
        _this.category = category;
        _this.isOperational = true;
        _this.context = context;
        _this.correlationId = (0, crypto_1.randomUUID)();
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
// Specific Error Classes for Order Service
var OrderNotFoundError = /** @class */ (function (_super) {
    __extends(OrderNotFoundError, _super);
    function OrderNotFoundError(orderId, context) {
        if (context === void 0) { context = {}; }
        return _super.call(this, "Order with ID ".concat(orderId, " not found"), 404, OrderErrorCodes.ORDER_NOT_FOUND, ErrorSeverity.MEDIUM, ErrorCategory.BUSINESS_LOGIC, __assign({ orderId: orderId }, context)) || this;
    }
    return OrderNotFoundError;
}(AppError));
exports.OrderNotFoundError = OrderNotFoundError;
var InsufficientStockError = /** @class */ (function (_super) {
    __extends(InsufficientStockError, _super);
    function InsufficientStockError(productId, requestedQuantity, availableQuantity, context) {
        if (context === void 0) { context = {}; }
        return _super.call(this, "Insufficient stock for product ".concat(productId, ". Requested: ").concat(requestedQuantity, ", Available: ").concat(availableQuantity), 409, OrderErrorCodes.INSUFFICIENT_QUANTITY, ErrorSeverity.HIGH, ErrorCategory.BUSINESS_LOGIC, __assign({ productId: productId, requestedQuantity: requestedQuantity, availableQuantity: availableQuantity }, context)) || this;
    }
    return InsufficientStockError;
}(AppError));
exports.InsufficientStockError = InsufficientStockError;
var CustomerBlockedError = /** @class */ (function (_super) {
    __extends(CustomerBlockedError, _super);
    function CustomerBlockedError(customerId, reason, context) {
        if (context === void 0) { context = {}; }
        return _super.call(this, "Customer ".concat(customerId, " is blocked: ").concat(reason), 403, OrderErrorCodes.CUSTOMER_BLOCKED, ErrorSeverity.HIGH, ErrorCategory.SECURITY, __assign({ customerId: customerId, reason: reason }, context)) || this;
    }
    return CustomerBlockedError;
}(AppError));
exports.CustomerBlockedError = CustomerBlockedError;
var PaymentFailedError = /** @class */ (function (_super) {
    __extends(PaymentFailedError, _super);
    function PaymentFailedError(paymentId, reason, context) {
        if (context === void 0) { context = {}; }
        return _super.call(this, "Payment failed for ".concat(paymentId, ": ").concat(reason), 402, OrderErrorCodes.PAYMENT_FAILED, ErrorSeverity.HIGH, ErrorCategory.INTEGRATION, __assign({ paymentId: paymentId, reason: reason }, context)) || this;
    }
    return PaymentFailedError;
}(AppError));
exports.PaymentFailedError = PaymentFailedError;
// Professional Error Handler Middleware
var errorHandler = function (error, req, res, next) {
    var _a, _b, _c;
    var startTime = req.startTime || perf_hooks_1.performance.now();
    var duration = perf_hooks_1.performance.now() - startTime;
    var appError;
    // Convert known errors to AppError format
    if (error instanceof AppError) {
        appError = error;
    }
    else {
        // Handle specific database and system errors
        appError = convertToAppError(error, req);
    }
    // Security audit for failed operations
    logSecurityAudit(appError, req);
    // Business intelligence logging
    logBusinessIntelligence(appError, req);
    // Compliance logging for order operations
    logComplianceEvent(appError, req);
    // Performance monitoring
    logPerformanceMetrics(appError, req, duration);
    // Professional structured error logging
    logger_1.logger.error('Order service error occurred', {
        // Error Details
        errorId: appError.correlationId,
        errorCode: appError.errorCode,
        message: appError.message,
        severity: appError.severity,
        category: appError.category,
        statusCode: appError.statusCode,
        stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined,
        // Request Context
        method: req.method,
        url: req.url,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        correlationId: req.headers['x-correlation-id'] || appError.correlationId,
        // User Context (masked for security)
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
        userRole: (_b = req.user) === null || _b === void 0 ? void 0 : _b.role,
        customerId: (_c = req.customer) === null || _c === void 0 ? void 0 : _c.id,
        // Business Context
        orderId: appError.context.orderId,
        productIds: appError.context.productIds,
        totalAmount: appError.context.totalAmount,
        paymentMethod: appError.context.paymentMethod,
        // Performance Metrics
        responseTime: duration,
        memoryUsage: process.memoryUsage(),
        // System Context
        service: 'order-service',
        version: process.env.SERVICE_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        // Additional Context
        context: appError.context
    });
    // Professional error response format
    var errorResponse = {
        success: false,
        error: {
            id: appError.correlationId,
            code: appError.errorCode,
            message: appError.message,
            severity: appError.severity,
            category: appError.category,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        },
        meta: {
            correlationId: req.headers['x-correlation-id'] || appError.correlationId,
            service: 'order-service',
            version: process.env.SERVICE_VERSION || '1.0.0'
        }
    };
    // Include additional details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = appError.stack;
        errorResponse.error.context = appError.context;
    }
    res.status(appError.statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Convert generic errors to AppError
function convertToAppError(error, req) {
    // Prisma/Database Errors
    if (error.name === 'PrismaClientKnownRequestError') {
        var prismaError = error;
        if (prismaError.code === 'P2002') {
            return new AppError('Resource already exists', 409, OrderErrorCodes.ORDER_ALREADY_PROCESSED, ErrorSeverity.MEDIUM, ErrorCategory.BUSINESS_LOGIC, { prismaCode: prismaError.code, meta: prismaError.meta });
        }
        else if (prismaError.code === 'P2025') {
            return new AppError('Resource not found', 404, OrderErrorCodes.ORDER_NOT_FOUND, ErrorSeverity.MEDIUM, ErrorCategory.BUSINESS_LOGIC, { prismaCode: prismaError.code });
        }
        return new AppError('Database operation failed', 500, OrderErrorCodes.DATABASE_ERROR, ErrorSeverity.HIGH, ErrorCategory.SYSTEM, { prismaCode: prismaError.code });
    }
    // JWT Errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return new AppError('Authentication failed', 401, OrderErrorCodes.AUTHENTICATION_ERROR, ErrorSeverity.HIGH, ErrorCategory.SECURITY, { jwtError: error.name });
    }
    // Validation Errors
    if (error.name === 'ValidationError') {
        return new AppError('Invalid data provided', 400, OrderErrorCodes.VALIDATION_ERROR, ErrorSeverity.MEDIUM, ErrorCategory.BUSINESS_LOGIC, { validationDetails: error.details });
    }
    // Timeout Errors
    if (error.name === 'TimeoutError') {
        return new AppError('Request timeout', 408, OrderErrorCodes.EXTERNAL_SERVICE_ERROR, ErrorSeverity.HIGH, ErrorCategory.PERFORMANCE, { timeout: true });
    }
    // Generic Internal Server Error
    return new AppError('Internal server error', 500, OrderErrorCodes.DATABASE_ERROR, ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM, { originalError: error.message });
}
// Security audit logging
function logSecurityAudit(error, req) {
    var _a;
    if (error.category === ErrorCategory.SECURITY || error.statusCode === 401 || error.statusCode === 403) {
        logger_1.professionalLogger.security('Security violation detected', {
            event: 'access_denied',
            errorCode: error.errorCode,
            severity: error.severity,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            reason: error.message,
            timestamp: new Date().toISOString(),
            correlationId: error.correlationId
        });
    }
}
// Business intelligence logging
function logBusinessIntelligence(error, req) {
    var _a, _b;
    // Log business-critical errors for analytics
    var businessCriticalCodes = [
        OrderErrorCodes.PRODUCT_OUT_OF_STOCK,
        OrderErrorCodes.INSUFFICIENT_QUANTITY,
        OrderErrorCodes.PAYMENT_FAILED,
        OrderErrorCodes.ORDER_LIMIT_EXCEEDED,
        OrderErrorCodes.CUSTOMER_LIMIT_EXCEEDED
    ];
    if (businessCriticalCodes.includes(error.errorCode)) {
        logger_1.professionalLogger.business('order_operation_failed', 1, {
            errorCode: error.errorCode,
            category: error.category,
            customerId: (_a = req.customer) === null || _a === void 0 ? void 0 : _a.id,
            productIds: error.context.productIds,
            failureReason: error.message,
            impactLevel: error.severity,
            correlationId: error.correlationId
        }, error.context.orderId, (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId);
    }
}
// Compliance logging
function logComplianceEvent(error, req) {
    var _a, _b, _c;
    // Log compliance-relevant events
    var complianceCriticalCodes = [
        OrderErrorCodes.CUSTOMER_BLOCKED,
        OrderErrorCodes.REGION_RESTRICTED,
        OrderErrorCodes.PAYMENT_VERIFICATION_FAILED
    ];
    if (complianceCriticalCodes.includes(error.errorCode)) {
        logger_1.professionalLogger.compliance('order_compliance_violation', {
            errorCode: error.errorCode,
            severity: error.severity,
            customerId: (_a = req.customer) === null || _a === void 0 ? void 0 : _a.id,
            region: (_b = req.customer) === null || _b === void 0 ? void 0 : _b.region,
            violationType: error.errorCode,
            details: error.context,
            correlationId: error.correlationId
        }, error.context.orderId, (_c = req.user) === null || _c === void 0 ? void 0 : _c.userId);
    }
}
// Performance metrics logging
function logPerformanceMetrics(error, req, duration) {
    if (error.category === ErrorCategory.PERFORMANCE || duration > 5000) { // 5 seconds threshold
        logger_1.logger.warn('Performance issue detected', {
            event: 'slow_error_response',
            errorCode: error.errorCode,
            duration: duration,
            memoryUsage: process.memoryUsage(),
            path: req.path,
            method: req.method,
            threshold_exceeded: duration > 5000,
            timestamp: new Date().toISOString(),
            correlationId: error.correlationId
        });
    }
}
// Professional async handler wrapper
var asyncHandler = function (fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Rate limiting error handler
var handleRateLimit = function (req, res) {
    var error = new AppError('Too many requests, please try again later', 429, OrderErrorCodes.RATE_LIMIT_EXCEEDED, ErrorSeverity.MEDIUM, ErrorCategory.SECURITY);
    logger_1.professionalLogger.security('Rate limit exceeded', {
        event: 'rate_limit_exceeded',
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    res.status(429).json({
        success: false,
        error: {
            code: error.errorCode,
            message: error.message,
            timestamp: new Date().toISOString()
        }
    });
};
exports.handleRateLimit = handleRateLimit;
