"use strict";
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
exports.requestLogger = exports.errorHandler = void 0;
var shared_1 = require("@ultramarket/shared");
var errorHandler = function (err, req, res, next) {
    var statusCode = err.statusCode || 500;
    var message = err.message || 'Internal Server Error';
    // Log error details
    shared_1.logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: statusCode,
    });
    // Don't leak error details in production
    var errorResponse = __assign({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message }, (process.env.NODE_ENV !== 'production' && { stack: err.stack }));
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
var requestLogger = function (req, res, next) {
    var start = Date.now();
    res.on('finish', function () {
        var duration = Date.now() - start;
        shared_1.logger.info('Request processed', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: "".concat(duration, "ms"),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
    });
    next();
};
exports.requestLogger = requestLogger;
