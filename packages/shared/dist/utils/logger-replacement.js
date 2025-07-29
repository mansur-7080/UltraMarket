"use strict";
/**
 * Professional Logger System - Console.log Replacement
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha console.log statements ni almashtirish uchun ishlatiladi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNoConsoleLog = exports.paymentLogger = exports.orderLogger = exports.productLogger = exports.authLogger = exports.ProductionLogger = exports.createLogger = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
// Professional logger configuration
const createLogger = (serviceName) => {
    return winston_1.default.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const logData = {
                timestamp,
                level: level.toUpperCase(),
                service: serviceName,
                message,
                ...meta
            };
            if (stack) {
                logData.stack = stack;
            }
            return JSON.stringify(logData);
        })),
        transports: [
            // Console transport faqat development uchun
            ...(process.env.NODE_ENV !== 'production' ? [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                })
            ] : []),
            // File transport barcha environment lar uchun
            new winston_1.default.transports.File({
                filename: `logs/${serviceName}/error.log`,
                level: 'error',
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 5,
                tailable: true
            }),
            new winston_1.default.transports.File({
                filename: `logs/${serviceName}/combined.log`,
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 10,
                tailable: true
            })
        ],
        exitOnError: false
    });
};
exports.createLogger = createLogger;
// ❌ NOTO'G'RI - Console.log ishlatish
// console.log('User created:', userData);
// console.error('Database error:', error);
// ✅ TO'G'RI - Professional logging
class ProductionLogger {
    logger;
    constructor(serviceName) {
        this.logger = (0, exports.createLogger)(serviceName);
    }
    // Info level logging
    info(message, meta) {
        this.logger.info(message, {
            requestId: this.generateRequestId(),
            ...meta
        });
    }
    // Error level logging
    error(message, error, meta) {
        this.logger.error(message, {
            requestId: this.generateRequestId(),
            error: error?.message,
            stack: error?.stack,
            ...meta
        });
    }
    // Warning level logging
    warn(message, meta) {
        this.logger.warn(message, {
            requestId: this.generateRequestId(),
            ...meta
        });
    }
    // Debug level logging (faqat development da)
    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(message, {
                requestId: this.generateRequestId(),
                ...meta
            });
        }
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.ProductionLogger = ProductionLogger;
// Service-specific loggers
exports.authLogger = new ProductionLogger('auth-service');
exports.productLogger = new ProductionLogger('product-service');
exports.orderLogger = new ProductionLogger('order-service');
exports.paymentLogger = new ProductionLogger('payment-service');
// ESLint rule to prevent console.log in production
// .eslintrc.js ga qo'shish kerak:
/*
module.exports = {
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  }
};
*/
// Pre-commit hook - console.log ni tekshirish
const validateNoConsoleLog = (filePath) => {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    const consoleRegex = /console\.(log|error|warn|info|debug)/g;
    const matches = content.match(consoleRegex);
    if (matches && matches.length > 0) {
        console.error(`❌ Console statements found in ${filePath}:`);
        matches.forEach((match) => console.error(`  - ${match}`));
        return false;
    }
    return true;
};
exports.validateNoConsoleLog = validateNoConsoleLog;
//# sourceMappingURL=logger-replacement.js.map