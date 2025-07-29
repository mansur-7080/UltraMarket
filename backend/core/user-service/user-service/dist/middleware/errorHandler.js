"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, _next) => {
    logger_1.logger.error('Error occurred', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        operation: 'error_handler',
    });
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env['NODE_ENV'] === 'development' ? error.message : 'Something went wrong',
    });
};
exports.errorHandler = errorHandler;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            operation: 'request_log',
        });
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=errorHandler.js.map