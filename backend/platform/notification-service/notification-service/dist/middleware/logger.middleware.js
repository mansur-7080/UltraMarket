"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, url, ip } = req;
    // Log request start
    logger_1.logger.info('Request started', {
        method,
        url,
        ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        logger_1.logger.info('Request completed', {
            method,
            url,
            ip,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date().toISOString(),
        });
        // Call original end method and return the response
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
const errorLogger = (err, req, res, next) => {
    logger_1.logger.error('Request error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    next(err);
};
exports.errorLogger = errorLogger;
//# sourceMappingURL=logger.middleware.js.map