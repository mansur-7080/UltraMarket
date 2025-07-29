"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.securityAuditMiddleware = exports.authenticationSecurityMiddleware = exports.userDataProtectionMiddleware = exports.userSpecificSecurityMiddleware = exports.threatDetectionMiddleware = exports.professionalSecurityHeaders = exports.correlationTrackingMiddleware = exports.applyUserServiceSecurity = exports.SecurityErrorCodes = void 0;
const logger_1 = require("../utils/logger");
const crypto_1 = require("crypto");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
var SecurityErrorCodes;
(function (SecurityErrorCodes) {
    SecurityErrorCodes["RATE_LIMIT_EXCEEDED"] = "SEC_001";
    SecurityErrorCodes["IP_BLOCKED"] = "SEC_002";
    SecurityErrorCodes["SUSPICIOUS_ACTIVITY"] = "SEC_003";
    SecurityErrorCodes["SQL_INJECTION_ATTEMPT"] = "SEC_004";
    SecurityErrorCodes["XSS_ATTEMPT"] = "SEC_005";
    SecurityErrorCodes["CSRF_VIOLATION"] = "SEC_006";
    SecurityErrorCodes["PATH_TRAVERSAL_ATTEMPT"] = "SEC_007";
    SecurityErrorCodes["DATA_EXFILTRATION_ATTEMPT"] = "SEC_008";
    SecurityErrorCodes["INVALID_AUTHENTICATION"] = "SEC_009";
    SecurityErrorCodes["UNAUTHORIZED_ACCESS"] = "SEC_010";
    SecurityErrorCodes["MALFORMED_REQUEST"] = "SEC_011";
    SecurityErrorCodes["SECURITY_HEADER_VIOLATION"] = "SEC_012";
})(SecurityErrorCodes || (exports.SecurityErrorCodes = SecurityErrorCodes = {}));
const ADVANCED_THREAT_PATTERNS = {
    sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
        /(UNION.*SELECT|SELECT.*FROM|INSERT.*INTO|UPDATE.*SET)/i,
        /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/i,
        /(\'|\"|`|;|--|\*|\/\*|\*\/)/,
        /(\bxp_cmdshell\b|\bsp_executesql\b)/i
    ],
    xss: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=\s*["\'].*?["\']|on\w+\s*=\s*[^>\s]*/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /<object[^>]*>.*?<\/object>/gi,
        /<embed[^>]*>.*?<\/embed>/gi,
        /expression\s*\(/gi,
        /vbscript:/gi
    ],
    pathTraversal: [
        /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/gi,
        /%2e%2e%2f|%2e%2e%5c|%252e%252e%252f/gi,
        /\/etc\/passwd|\/etc\/shadow|\/etc\/hosts/gi,
        /\\windows\\system32|\\windows\\system/gi,
        /proc\/self\/environ|proc\/version|proc\/cmdline/gi
    ]
};
const USER_SERVICE_SECURITY_PATTERNS = {
    sensitiveUserFields: ['password', 'email', 'phone', 'passport', 'address', 'inn', 'birthDate'],
    suspiciousUserOperations: [
        /\/users\/\d+\/password/,
        /\/users\/\d+\/email/,
        /\/users\/\d+\/phone/,
        /\/auth\/reset-password/,
        /\/auth\/verify-email/,
        /\/auth\/change-password/
    ],
    bruteForcePatterns: [
        /\/auth\/login/,
        /\/auth\/verify/,
        /\/users\/profile/
    ]
};
const createUserServiceRateLimiter = () => (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
    handler: (req, res) => {
        logger_1.professionalLogger.security('Rate limit exceeded', {
            event: 'rate_limit_exceeded',
            ip: req.ip,
            endpoint: `${req.method} ${req.path}`,
            correlationId: req.correlationId,
            severity: 'high'
        });
        res.status(429).json({
            success: false,
            error: {
                code: SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
                message: 'Too many requests, please try again later',
                correlationId: req.correlationId
            }
        });
    }
});
const createAuthRateLimiter = () => (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.professionalLogger.security('Auth rate limit exceeded', {
            event: 'auth_rate_limit_exceeded',
            ip: req.ip,
            endpoint: `${req.method} ${req.path}`,
            correlationId: req.correlationId,
            severity: 'critical'
        });
        res.status(429).json({
            success: false,
            error: {
                code: SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
                message: 'Too many authentication attempts',
                correlationId: req.correlationId
            }
        });
    }
});
const applyUserServiceSecurity = (app) => {
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
    app.use(exports.correlationTrackingMiddleware);
    app.use(exports.professionalSecurityHeaders);
    app.use(createUserServiceRateLimiter());
    app.use('/auth', createAuthRateLimiter());
    app.use(exports.threatDetectionMiddleware);
    app.use(exports.userSpecificSecurityMiddleware);
    app.use(exports.userDataProtectionMiddleware);
    app.use(exports.authenticationSecurityMiddleware);
    app.use(exports.securityAuditMiddleware);
};
exports.applyUserServiceSecurity = applyUserServiceSecurity;
const correlationTrackingMiddleware = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || (0, crypto_1.randomUUID)();
    req.correlationId = correlationId;
    req.startTime = Date.now();
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Service', 'user-service');
    next();
};
exports.correlationTrackingMiddleware = correlationTrackingMiddleware;
const professionalSecurityHeaders = (req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
};
exports.professionalSecurityHeaders = professionalSecurityHeaders;
const threatDetectionMiddleware = (req, res, next) => {
    const correlationId = req.correlationId || (0, crypto_1.randomUUID)();
    const threats = detectThreats(req);
    if (threats.length > 0) {
        const clientIP = req.ip || req.socket.remoteAddress;
        logger_1.professionalLogger.security('Security threats detected', {
            event: 'threats_detected',
            threats,
            ip: clientIP,
            endpoint: `${req.method} ${req.path}`,
            userAgent: req.get('User-Agent'),
            correlationId,
            severity: 'high'
        });
        const highSeverityThreats = ['sql_injection', 'xss', 'path_traversal'];
        if (threats.some(threat => highSeverityThreats.includes(threat.type))) {
            res.status(400).json({
                success: false,
                error: {
                    code: SecurityErrorCodes.SUSPICIOUS_ACTIVITY,
                    message: 'Request blocked due to security policy',
                    correlationId
                }
            });
            return;
        }
    }
    next();
};
exports.threatDetectionMiddleware = threatDetectionMiddleware;
const userSpecificSecurityMiddleware = (req, res, next) => {
    const correlationId = req.correlationId || (0, crypto_1.randomUUID)();
    const clientIP = req.ip || req.socket.remoteAddress;
    if (isUserSensitiveOperation(req)) {
        logger_1.professionalLogger.security('Sensitive user operation detected', {
            event: 'sensitive_user_operation',
            endpoint: `${req.method} ${req.path}`,
            ip: clientIP,
            userAgent: req.get('User-Agent'),
            correlationId,
            severity: 'high'
        });
        if (!req.headers.authorization && requiresAuthentication(req)) {
            logger_1.professionalLogger.security('Unauthenticated sensitive operation attempt', {
                event: 'unauthenticated_sensitive_operation',
                endpoint: `${req.method} ${req.path}`,
                ip: clientIP,
                correlationId,
                severity: 'critical'
            });
            res.status(401).json({
                success: false,
                error: {
                    code: SecurityErrorCodes.INVALID_AUTHENTICATION,
                    message: 'Authentication required for this operation',
                    correlationId
                }
            });
            return;
        }
    }
    if (isBruteForcePattern(req)) {
        logger_1.professionalLogger.security('Potential brute force attempt', {
            event: 'brute_force_attempt',
            endpoint: `${req.method} ${req.path}`,
            ip: clientIP,
            userAgent: req.get('User-Agent'),
            correlationId,
            severity: 'high'
        });
    }
    next();
};
exports.userSpecificSecurityMiddleware = userSpecificSecurityMiddleware;
const userDataProtectionMiddleware = (req, res, next) => {
    const correlationId = req.correlationId || (0, crypto_1.randomUUID)();
    if (req.body && typeof req.body === 'object') {
        req.maskedBody = maskUserSensitiveData(req.body);
    }
    if (req.body) {
        const dataViolations = detectUserDataViolations(req.body);
        if (dataViolations.length > 0) {
            logger_1.professionalLogger.security('User data policy violation', {
                event: 'user_data_violation',
                violations: dataViolations,
                endpoint: `${req.method} ${req.path}`,
                ip: req.ip,
                correlationId,
                severity: 'medium'
            });
        }
    }
    const originalSend = res.send;
    res.send = function (data) {
        if (data && typeof data === 'string') {
            try {
                const responseData = JSON.parse(data);
                if (responseData.user || responseData.users) {
                    const sanitizedData = sanitizeUserResponse(responseData);
                    return originalSend.call(this, JSON.stringify(sanitizedData));
                }
            }
            catch (e) {
            }
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.userDataProtectionMiddleware = userDataProtectionMiddleware;
const authenticationSecurityMiddleware = (req, res, next) => {
    const correlationId = req.correlationId || (0, crypto_1.randomUUID)();
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        if (!isValidTokenFormat(token)) {
            logger_1.professionalLogger.security('Invalid token format detected', {
                event: 'invalid_token_format',
                endpoint: `${req.method} ${req.path}`,
                ip: req.ip,
                tokenLength: token.length,
                correlationId,
                severity: 'medium'
            });
            res.status(401).json({
                success: false,
                error: {
                    code: SecurityErrorCodes.INVALID_AUTHENTICATION,
                    message: 'Invalid token format',
                    correlationId
                }
            });
            return;
        }
        if (!hasGoodTokenEntropy(token)) {
            logger_1.professionalLogger.security('Low entropy token detected', {
                event: 'weak_token_detected',
                endpoint: `${req.method} ${req.path}`,
                ip: req.ip,
                correlationId,
                severity: 'high'
            });
        }
    }
    if (req.path.includes('/auth/')) {
        logger_1.professionalLogger.audit('Authentication operation', {
            action: 'auth_operation',
            endpoint: `${req.method} ${req.path}`,
            hasAuth: !!authHeader,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            correlationId
        });
    }
    next();
};
exports.authenticationSecurityMiddleware = authenticationSecurityMiddleware;
const securityAuditMiddleware = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        const endTime = Date.now();
        const duration = endTime - (req.startTime || endTime);
        logger_1.professionalLogger.audit('API request completed', {
            action: 'api_request_completed',
            correlationId: req.correlationId,
            service: 'user-service',
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.userId
        });
        return originalSend.call(this, data);
    };
    next();
};
exports.securityAuditMiddleware = securityAuditMiddleware;
function detectThreats(req) {
    const threats = [];
    const requestData = {
        url: req.url,
        body: JSON.stringify(req.body || {}),
        query: JSON.stringify(req.query || {}),
        headers: JSON.stringify(req.headers || {})
    };
    ADVANCED_THREAT_PATTERNS.sqlInjection.forEach(pattern => {
        Object.entries(requestData).forEach(([location, data]) => {
            if (pattern.test(data)) {
                threats.push({ type: 'sql_injection', pattern: pattern.source, location });
            }
        });
    });
    ADVANCED_THREAT_PATTERNS.xss.forEach(pattern => {
        Object.entries(requestData).forEach(([location, data]) => {
            if (pattern.test(data)) {
                threats.push({ type: 'xss', pattern: pattern.source, location });
            }
        });
    });
    ADVANCED_THREAT_PATTERNS.pathTraversal.forEach(pattern => {
        Object.entries(requestData).forEach(([location, data]) => {
            if (pattern.test(data)) {
                threats.push({ type: 'path_traversal', pattern: pattern.source, location });
            }
        });
    });
    return threats;
}
function isUserSensitiveOperation(req) {
    return USER_SERVICE_SECURITY_PATTERNS.suspiciousUserOperations.some(pattern => pattern.test(req.path));
}
function requiresAuthentication(req) {
    const publicEndpoints = ['/health', '/metrics', '/auth/login', '/auth/register'];
    return !publicEndpoints.some(endpoint => req.path.startsWith(endpoint));
}
function isBruteForcePattern(req) {
    return USER_SERVICE_SECURITY_PATTERNS.bruteForcePatterns.some(pattern => pattern.test(req.path));
}
function maskUserSensitiveData(data) {
    const maskedData = JSON.parse(JSON.stringify(data));
    const maskRecursive = (obj) => {
        if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                if (USER_SERVICE_SECURITY_PATTERNS.sensitiveUserFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                    obj[key] = '***MASKED***';
                }
                else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    maskRecursive(obj[key]);
                }
            });
        }
    };
    maskRecursive(maskedData);
    return maskedData;
}
function detectUserDataViolations(data) {
    const violations = [];
    const uzbekPatterns = {
        passport: /[A-Z]{2}\d{7}/g,
        phone: /(\+998|998)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g,
        inn: /\b\d{9}\b/g
    };
    const dataString = JSON.stringify(data);
    Object.entries(uzbekPatterns).forEach(([type, pattern]) => {
        if (pattern.test(dataString)) {
            violations.push(`potential_${type}_exposure`);
        }
    });
    return violations;
}
function sanitizeUserResponse(data) {
    const sanitized = JSON.parse(JSON.stringify(data));
    const sanitizeUser = (user) => {
        if (user && typeof user === 'object') {
            const sensitiveFields = ['password', 'passwordHash', 'salt', 'refreshToken', 'resetToken'];
            sensitiveFields.forEach(field => {
                delete user[field];
            });
            if (user.email) {
                const [username, domain] = user.email.split('@');
                user.email = `${username.slice(0, 2)}***@${domain}`;
            }
            if (user.phone) {
                user.phone = user.phone.replace(/(\d{3})\d{3}(\d{2})/, '$1***$2');
            }
        }
        return user;
    };
    if (sanitized.user) {
        sanitized.user = sanitizeUser(sanitized.user);
    }
    if (sanitized.users && Array.isArray(sanitized.users)) {
        sanitized.users = sanitized.users.map(sanitizeUser);
    }
    return sanitized;
}
function isValidTokenFormat(token) {
    const parts = token.split('.');
    if (parts.length !== 3)
        return false;
    try {
        parts.forEach(part => {
            Buffer.from(part, 'base64');
        });
        return true;
    }
    catch (e) {
        return false;
    }
}
function hasGoodTokenEntropy(token) {
    const uniqueChars = new Set(token).size;
    const entropyRatio = uniqueChars / token.length;
    return entropyRatio >= 0.4;
}
exports.securityMiddleware = exports.userSpecificSecurityMiddleware;
exports.default = {
    applyUserServiceSecurity: exports.applyUserServiceSecurity,
    userSpecificSecurityMiddleware: exports.userSpecificSecurityMiddleware,
    userDataProtectionMiddleware: exports.userDataProtectionMiddleware,
    authenticationSecurityMiddleware: exports.authenticationSecurityMiddleware,
    correlationTrackingMiddleware: exports.correlationTrackingMiddleware,
    professionalSecurityHeaders: exports.professionalSecurityHeaders,
    threatDetectionMiddleware: exports.threatDetectionMiddleware,
    securityAuditMiddleware: exports.securityAuditMiddleware
};
//# sourceMappingURL=security.middleware.js.map