"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityLogger = exports.performanceMonitor = exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl, ip, headers } = req;
    logger_1.logger.info('Incoming request', {
        method,
        url: originalUrl,
        ip,
        userAgent: headers['user-agent'],
        timestamp: new Date().toISOString(),
    });
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        const { statusCode } = res;
        logger_1.logger.info('Request completed', {
            method,
            url: originalUrl,
            statusCode,
            duration: `${duration}ms`,
            ip,
            timestamp: new Date().toISOString(),
        });
        originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
const performanceMonitor = (req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        if (duration > 1000) {
            logger_1.logger.warn('Slow request detected', {
                method: req.method,
                url: req.originalUrl,
                duration: `${duration.toFixed(2)}ms`,
                statusCode: res.statusCode,
            });
        }
        logger_1.logger.debug('Request performance', {
            method: req.method,
            url: req.originalUrl,
            duration: `${duration.toFixed(2)}ms`,
            statusCode: res.statusCode,
        });
    });
    next();
};
exports.performanceMonitor = performanceMonitor;
const securityLogger = (req, res, next) => {
    const { method, originalUrl, ip, headers } = req;
    const suspiciousPatterns = [
        /\.\.\//,
        /<script>/i,
        /union\s+select/i,
        /eval\(/i,
    ];
    const userAgent = headers['user-agent'] || '';
    const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(originalUrl) || pattern.test(userAgent));
    if (isSuspicious) {
        logger_1.logger.warn('Suspicious request detected', {
            method,
            url: originalUrl,
            ip,
            userAgent,
            timestamp: new Date().toISOString(),
        });
    }
    next();
};
exports.securityLogger = securityLogger;
//# sourceMappingURL=requestLogger.js.map