"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = void 0;
var logger_1 = require("../utils/logger");
// Security middleware
var securityMiddleware = function (req, res, next) {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Log suspicious activity
    var suspiciousPatterns = [
        /script/i,
        /javascript/i,
        /vbscript/i,
        /onload/i,
        /onerror/i,
        /eval/i,
        /expression/i,
        /alert/i,
        /document\.cookie/i,
        /window\.location/i,
    ];
    var requestData = JSON.stringify({
        url: req.url,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    var isSuspicious = suspiciousPatterns.some(function (pattern) { return pattern.test(requestData); });
    if (isSuspicious) {
        logger_1.logger.warn('Suspicious request detected', {
            ip: req.ip,
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent'),
            body: req.body,
            query: req.query,
            timestamp: new Date().toISOString(),
        });
    }
    next();
};
exports.securityMiddleware = securityMiddleware;
