"use strict";
/**
 * 🚀 PROFESSIONAL LOGGER - Order Service
 *
 * Professional order management logging with business intelligence,
 * inventory tracking, and O'zbekiston e-commerce compliance
 *
 * Version: 3.0.0 - Professional Integration
 * Date: 2024-12-28
 * Service: order-service (BUSINESS CRITICAL)
 */
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalLogger = exports.logger = void 0;
var winston_1 = __importDefault(require("winston"));
var path_1 = __importDefault(require("path"));
var crypto_1 = require("crypto");
// Professional logging levels for order management
var levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
};
// Professional colors for order operations
var colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
};
winston_1.default.addColors(colors);
// Service context for order management
var SERVICE_CONTEXT = {
    service: 'order-service',
    component: 'business-core',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    businessDomain: 'e-commerce'
};
// Professional console format with order context
var consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(function (_a) {
    var timestamp = _a.timestamp, level = _a.level, message = _a.message, meta = __rest(_a, ["timestamp", "level", "message"]);
    var correlationId = meta.correlationId || 'no-correlation';
    var serviceInfo = "[".concat(SERVICE_CONTEXT.service, ":").concat(SERVICE_CONTEXT.version, "]");
    var orderId = meta.orderId ? "[Order:".concat(meta.orderId, "]") : '';
    var customerId = meta.userId || meta.customerId ? "[Customer:".concat(meta.userId || meta.customerId, "]") : '';
    var metaString = '';
    if (Object.keys(meta).length > 0) {
        // Clean metadata for display
        var cleanMeta = __assign({}, meta);
        delete cleanMeta.orderId;
        delete cleanMeta.userId;
        delete cleanMeta.customerId;
        delete cleanMeta.correlationId;
        if (Object.keys(cleanMeta).length > 0) {
            metaString = " ".concat(JSON.stringify(cleanMeta));
        }
    }
    return "".concat(timestamp, " ").concat(serviceInfo).concat(orderId).concat(customerId, " [").concat(correlationId, "] ").concat(level, ": ").concat(message).concat(metaString);
}));
// Professional JSON format for order analytics
var jsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(function (info) {
    return JSON.stringify(__assign(__assign(__assign({}, info), SERVICE_CONTEXT), { correlationId: info.correlationId || (0, crypto_1.randomUUID)() }));
}));
// Professional transports for order management
var transports = [
    // Console transport for development
    new winston_1.default.transports.Console({
        format: consoleFormat,
        level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
    }),
];
// Enhanced file transports for order business intelligence
if (SERVICE_CONTEXT.environment === 'production') {
    var logDir = path_1.default.join(process.cwd(), 'logs');
    transports.push(
    // Critical error log for order failures
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'order-service-error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 100 * 1024 * 1024, // 100MB
        maxFiles: 15,
        tailable: true
    }), 
    // Order operations log
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'order-service.log'),
        format: jsonFormat,
        maxsize: 200 * 1024 * 1024, // 200MB for business operations
        maxFiles: 10,
        tailable: true
    }), 
    // Business audit log
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'order-service-audit.log'),
        level: 'info',
        format: jsonFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 30, // Keep more for business compliance
        tailable: true
    }), 
    // Inventory tracking log
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'order-service-inventory.log'),
        level: 'info',
        format: jsonFormat,
        maxsize: 25 * 1024 * 1024, // 25MB
        maxFiles: 20,
        tailable: true
    }), 
    // Customer analytics log
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'order-service-analytics.log'),
        level: 'info',
        format: jsonFormat,
        maxsize: 75 * 1024 * 1024, // 75MB for analytics
        maxFiles: 12,
        tailable: true
    }));
}
// Professional logger instance for order management
exports.logger = winston_1.default.createLogger({
    level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
    levels: levels,
    format: jsonFormat,
    transports: transports,
    exitOnError: false,
    defaultMeta: SERVICE_CONTEXT
});
// Professional order management logging methods
exports.professionalLogger = {
    // Basic logging methods
    error: function (message, meta) { return exports.logger.error(message, meta); },
    warn: function (message, meta) { return exports.logger.warn(message, meta); },
    info: function (message, meta) { return exports.logger.info(message, meta); },
    http: function (message, meta) { return exports.logger.http(message, meta); },
    verbose: function (message, meta) { return exports.logger.verbose(message, meta); },
    debug: function (message, meta) { return exports.logger.debug(message, meta); },
    // Business audit logging for order operations
    audit: function (action, details, userId, orderId) {
        var auditData = {
            audit: true,
            action: action,
            details: details,
            userId: userId,
            orderId: orderId,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service,
            businessDomain: 'order-management'
        };
        exports.logger.info("ORDER AUDIT: ".concat(action), auditData);
    },
    // Security logging for order operations
    security: function (event, details, severity) {
        if (severity === void 0) { severity = 'medium'; }
        var level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
        var securityData = {
            security: true,
            event: event,
            details: details,
            severity: severity,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        };
        exports.logger[level]("ORDER SECURITY: ".concat(event), securityData);
    },
    // Performance logging for order operations
    performance: function (operation, duration, metadata) {
        var performanceData = {
            performance: true,
            operation: operation,
            duration: duration,
            metadata: metadata,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        };
        exports.logger.info("ORDER PERFORMANCE: ".concat(operation), performanceData);
    },
    // Order lifecycle logging
    order: function (lifecycle, orderId, status, details, userId) {
        var orderData = {
            order: true,
            lifecycle: lifecycle,
            orderId: orderId,
            status: status,
            userId: userId,
            details: details,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service,
            businessDomain: 'order-management'
        };
        exports.logger.info("ORDER LIFECYCLE: ".concat(lifecycle), orderData);
    },
    // Inventory operations logging
    inventory: function (operation, productId, quantity, orderId, details, userId) {
        var inventoryData = {
            inventory: true,
            operation: operation,
            productId: productId,
            quantity: quantity,
            orderId: orderId,
            userId: userId,
            details: details,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service,
            businessDomain: 'inventory-management'
        };
        exports.logger.info("INVENTORY: ".concat(operation), inventoryData);
    },
    // Customer behavior analytics
    customer: function (action, userId, orderId, details) {
        var customerData = {
            customer: true,
            action: action,
            userId: userId,
            orderId: orderId,
            details: details,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service,
            businessDomain: 'customer-analytics'
        };
        exports.logger.info("CUSTOMER: ".concat(action), customerData);
    },
    // Business intelligence logging
    business: function (metric, value, dimensions, orderId, userId) {
        var businessData = {
            business: true,
            metric: metric,
            value: value,
            dimensions: dimensions,
            orderId: orderId,
            userId: userId,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service,
            businessDomain: 'business-intelligence'
        };
        exports.logger.info("BUSINESS METRIC: ".concat(metric), businessData);
    },
    // Shipping and fulfillment logging
    fulfillment: function (stage, orderId, details, userId) {
        var fulfillmentData = {
            fulfillment: true,
            stage: stage,
            orderId: orderId,
            userId: userId,
            details: details,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service,
            businessDomain: 'fulfillment'
        };
        exports.logger.info("FULFILLMENT: ".concat(stage), fulfillmentData);
    },
    // O'zbekiston compliance and regional logging
    compliance: function (complianceEvent, details, orderId, userId) {
        var complianceData = {
            compliance: true,
            event: complianceEvent,
            details: details,
            orderId: orderId,
            userId: userId,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service,
            region: 'uzbekistan',
            businessDomain: 'regulatory-compliance'
        };
        exports.logger.info("COMPLIANCE: ".concat(complianceEvent), complianceData);
    }
};
// Legacy compatibility - ensure existing code continues to work
exports.default = exports.logger;
