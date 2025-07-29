"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    logger_1.logger.info(`Incoming request: ${req.method} ${req.path}`, {
        method: req.method,
        url: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        timestamp: new Date().toISOString(),
    });
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        logger_1.logger.info(`Request completed: ${req.method} ${req.path}`, {
            method: req.method,
            url: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.userId,
            timestamp: new Date().toISOString(),
        });
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
exports.stream = {
    write: (message) => {
        logger_1.logger.info(message.trim());
    },
};
//# sourceMappingURL=logger.middleware.js.map