"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';
    logger_1.logger.error('API Gateway Error:', {
        error: message,
        statusCode,
        code,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        correlationId: req.headers['x-correlation-id'],
        stack: err.stack,
    });
    res.status(statusCode).json({
        error: {
            message,
            code,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
            correlationId: req.headers['x-correlation-id'],
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map