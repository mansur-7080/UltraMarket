"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.requestLogger = void 0;
var logger_1 = require("../utils/logger");
// Request logging middleware
var requestLogger = function (req, res, next) {
    var _a;
    var start = Date.now();
    // Log request start
    logger_1.logger.info("Incoming request: ".concat(req.method, " ").concat(req.path), {
        method: req.method,
        url: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
        timestamp: new Date().toISOString(),
    });
    // Override res.end to log response
    var originalEnd = res.end;
    res.end = function (chunk, encoding) {
        var _a;
        var duration = Date.now() - start;
        // Log response
        logger_1.logger.info("Request completed: ".concat(req.method, " ").concat(req.path), {
            method: req.method,
            url: req.path,
            statusCode: res.statusCode,
            duration: "".concat(duration, "ms"),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
            timestamp: new Date().toISOString(),
        });
        // Call original end method
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
// Morgan-style stream for winston
exports.stream = {
    write: function (message) {
        logger_1.logger.info(message.trim());
    },
};
