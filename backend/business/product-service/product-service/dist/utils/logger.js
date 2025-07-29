"use strict";
/**
 * 🚀 PROFESSIONAL LOGGER - Product Service
 *
 * Professional logging system with structured logs, correlation tracking,
 * performance monitoring, and security audit capabilities
 *
 * Version: 3.0.0 - Professional Integration
 * Date: 2024-12-28
 * Service: product-service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalLogger = exports.logger = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const path_1 = tslib_1.__importDefault(require("path"));
const crypto_1 = require("crypto");
// Professional logging levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
};
// Professional colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
};
winston_1.default.addColors(colors);
// Service context
const SERVICE_CONTEXT = {
    service: 'product-service',
    component: 'business',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development'
};
// Professional console format with service context
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const correlationId = meta.correlationId || 'no-correlation';
    const serviceInfo = `[${SERVICE_CONTEXT.service}:${SERVICE_CONTEXT.version}]`;
    let metaString = '';
    if (Object.keys(meta).length > 0) {
        metaString = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} ${serviceInfo} [${correlationId}] ${level}: ${message}${metaString}`;
}));
// Professional JSON format for structured logging
const jsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf((info) => {
    return JSON.stringify({
        ...info,
        ...SERVICE_CONTEXT,
        correlationId: info.correlationId || (0, crypto_1.randomUUID)(),
    });
}));
// Professional transports
const transports = [
    // Console transport with colors
    new winston_1.default.transports.Console({
        format: consoleFormat,
        level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
    }),
];
// File transports for production
if (SERVICE_CONTEXT.environment === 'production') {
    const logDir = path_1.default.join(process.cwd(), 'logs');
    transports.push(
    // Error log file
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'product-service-error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10,
        tailable: true
    }), 
    // Combined log file
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'product-service.log'),
        format: jsonFormat,
        maxsize: 100 * 1024 * 1024, // 100MB
        maxFiles: 5,
        tailable: true
    }), 
    // Audit log file
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'product-service-audit.log'),
        level: 'info',
        format: jsonFormat,
        maxsize: 25 * 1024 * 1024, // 25MB
        maxFiles: 20,
        tailable: true
    }));
}
// Professional logger instance
exports.logger = winston_1.default.createLogger({
    level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
    levels,
    format: jsonFormat,
    transports,
    exitOnError: false,
    defaultMeta: SERVICE_CONTEXT
});
// Professional logging methods with context
exports.professionalLogger = {
    // Basic logging methods
    error: (message, meta) => exports.logger.error(message, meta),
    warn: (message, meta) => exports.logger.warn(message, meta),
    info: (message, meta) => exports.logger.info(message, meta),
    http: (message, meta) => exports.logger.http(message, meta),
    verbose: (message, meta) => exports.logger.verbose(message, meta),
    debug: (message, meta) => exports.logger.debug(message, meta),
    // Professional audit logging for business operations
    audit: (action, details, userId) => {
        exports.logger.info(`AUDIT: ${action}`, {
            audit: true,
            action,
            details,
            userId,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    },
    // Security logging for product operations
    security: (event, details, severity = 'medium') => {
        const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
        exports.logger[level](`SECURITY: ${event}`, {
            security: true,
            event,
            details,
            severity,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    },
    // Performance logging for database and cache operations
    performance: (operation, duration, metadata) => {
        exports.logger.info(`PERFORMANCE: ${operation}`, {
            performance: true,
            operation,
            duration,
            metadata,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    },
    // Business operation logging for product catalog operations
    business: (operation, productId, details, userId) => {
        exports.logger.info(`BUSINESS: ${operation}`, {
            business: true,
            operation,
            productId,
            userId,
            details,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    },
    // Inventory operations logging
    inventory: (operation, productId, details, userId) => {
        exports.logger.info(`INVENTORY: ${operation}`, {
            inventory: true,
            operation,
            productId,
            userId,
            details,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    },
    // Search operations logging
    search: (query, results, userId, metadata) => {
        exports.logger.info(`SEARCH: Query executed`, {
            search: true,
            query,
            results,
            userId,
            metadata,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    }
};
// Legacy compatibility - ensure existing code continues to work
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map