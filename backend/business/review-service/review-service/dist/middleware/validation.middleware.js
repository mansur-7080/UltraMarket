"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationError = exports.validateRateLimit = exports.validateFileUpload = exports.sanitizeHtml = exports.validateAll = exports.validateParams = exports.validateQuery = exports.validateRequest = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const validateRequest = (schema, options = {}) => {
    return (req, res, next) => {
        try {
            const validationOptions = {
                abortEarly: options.abortEarly ?? false,
                allowUnknown: options.allowUnknown ?? false,
                stripUnknown: options.stripUnknown ?? true,
                skipFunctions: options.skipFunctions ?? true,
                convert: options.convert ?? true,
            };
            const { error, value } = schema.validate(req.body, validationOptions);
            if (error) {
                const validationErrors = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                    type: detail.type,
                }));
                logger_1.logger.warn('Validation failed', {
                    route: req.path,
                    method: req.method,
                    errors: validationErrors,
                    body: req.body,
                });
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors,
                });
                return;
            }
            req.body = value;
            logger_1.logger.debug('Validation successful', {
                route: req.path,
                method: req.method,
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Validation middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Validation error',
                error: 'VALIDATION_ERROR',
            });
        }
    };
};
exports.validateRequest = validateRequest;
const validateQuery = (schema, options = {}) => {
    return (req, res, next) => {
        try {
            const validationOptions = {
                abortEarly: options.abortEarly ?? false,
                allowUnknown: options.allowUnknown ?? true,
                stripUnknown: options.stripUnknown ?? true,
                skipFunctions: options.skipFunctions ?? true,
                convert: options.convert ?? true,
            };
            const { error, value } = schema.validate(req.query, validationOptions);
            if (error) {
                const validationErrors = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                    type: detail.type,
                }));
                logger_1.logger.warn('Query validation failed', {
                    route: req.path,
                    method: req.method,
                    errors: validationErrors,
                    query: req.query,
                });
                res.status(400).json({
                    success: false,
                    message: 'Query validation failed',
                    errors: validationErrors,
                });
                return;
            }
            req.query = value;
            logger_1.logger.debug('Query validation successful', {
                route: req.path,
                method: req.method,
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Query validation middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Query validation error',
                error: 'VALIDATION_ERROR',
            });
        }
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema, options = {}) => {
    return (req, res, next) => {
        try {
            const validationOptions = {
                abortEarly: options.abortEarly ?? false,
                allowUnknown: options.allowUnknown ?? false,
                stripUnknown: options.stripUnknown ?? true,
                skipFunctions: options.skipFunctions ?? true,
                convert: options.convert ?? true,
            };
            const { error, value } = schema.validate(req.params, validationOptions);
            if (error) {
                const validationErrors = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                    type: detail.type,
                }));
                logger_1.logger.warn('Params validation failed', {
                    route: req.path,
                    method: req.method,
                    errors: validationErrors,
                    params: req.params,
                });
                res.status(400).json({
                    success: false,
                    message: 'Parameters validation failed',
                    errors: validationErrors,
                });
                return;
            }
            req.params = value;
            logger_1.logger.debug('Params validation successful', {
                route: req.path,
                method: req.method,
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Params validation middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Parameters validation error',
                error: 'VALIDATION_ERROR',
            });
        }
    };
};
exports.validateParams = validateParams;
const validateAll = (schemas, options = {}) => {
    return (req, res, next) => {
        try {
            const validationOptions = {
                abortEarly: options.abortEarly ?? false,
                allowUnknown: options.allowUnknown ?? false,
                stripUnknown: options.stripUnknown ?? true,
                skipFunctions: options.skipFunctions ?? true,
                convert: options.convert ?? true,
            };
            const errors = [];
            if (schemas.body) {
                const { error, value } = schemas.body.validate(req.body, validationOptions);
                if (error) {
                    errors.push(...error.details.map((detail) => ({
                        location: 'body',
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value,
                        type: detail.type,
                    })));
                }
                else {
                    req.body = value;
                }
            }
            if (schemas.query) {
                const { error, value } = schemas.query.validate(req.query, {
                    ...validationOptions,
                    allowUnknown: true,
                });
                if (error) {
                    errors.push(...error.details.map((detail) => ({
                        location: 'query',
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value,
                        type: detail.type,
                    })));
                }
                else {
                    req.query = value;
                }
            }
            if (schemas.params) {
                const { error, value } = schemas.params.validate(req.params, validationOptions);
                if (error) {
                    errors.push(...error.details.map((detail) => ({
                        location: 'params',
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value,
                        type: detail.type,
                    })));
                }
                else {
                    req.params = value;
                }
            }
            if (errors.length > 0) {
                logger_1.logger.warn('Comprehensive validation failed', {
                    route: req.path,
                    method: req.method,
                    errors,
                });
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors,
                });
                return;
            }
            logger_1.logger.debug('Comprehensive validation successful', {
                route: req.path,
                method: req.method,
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Comprehensive validation middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Validation error',
                error: 'VALIDATION_ERROR',
            });
        }
    };
};
exports.validateAll = validateAll;
const sanitizeHtml = (req, res, next) => {
    try {
        const sanitizeString = (str) => {
            return str
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<[^>]*>/g, '')
                .trim();
        };
        const sanitizeObject = (obj) => {
            if (typeof obj === 'string') {
                return sanitizeString(obj);
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            if (obj && typeof obj === 'object') {
                const sanitized = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        sanitized[key] = sanitizeObject(obj[key]);
                    }
                }
                return sanitized;
            }
            return obj;
        };
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        logger_1.logger.debug('HTML sanitization completed', {
            route: req.path,
            method: req.method,
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('HTML sanitization error:', error);
        next();
    }
};
exports.sanitizeHtml = sanitizeHtml;
const validateFileUpload = (options) => {
    return (req, res, next) => {
        try {
            const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], maxFiles = 5, required = false, } = options;
            const files = req.files;
            if (required && (!files || files.length === 0)) {
                res.status(400).json({
                    success: false,
                    message: 'File upload is required',
                    error: 'FILE_REQUIRED',
                });
                return;
            }
            if (files && files.length > 0) {
                if (files.length > maxFiles) {
                    res.status(400).json({
                        success: false,
                        message: `Maximum ${maxFiles} files allowed`,
                        error: 'TOO_MANY_FILES',
                    });
                    return;
                }
                for (const file of files) {
                    if (file.size > maxSize) {
                        res.status(400).json({
                            success: false,
                            message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
                            error: 'FILE_TOO_LARGE',
                        });
                        return;
                    }
                    if (!allowedTypes.includes(file.mimetype)) {
                        res.status(400).json({
                            success: false,
                            message: `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
                            error: 'INVALID_FILE_TYPE',
                        });
                        return;
                    }
                }
            }
            logger_1.logger.debug('File upload validation successful', {
                route: req.path,
                method: req.method,
                fileCount: files?.length || 0,
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('File upload validation error:', error);
            res.status(500).json({
                success: false,
                message: 'File validation error',
                error: 'FILE_VALIDATION_ERROR',
            });
        }
    };
};
exports.validateFileUpload = validateFileUpload;
const validateRateLimit = (req, res, next) => {
    try {
        const rateLimitHeaders = {
            'X-RateLimit-Limit': res.getHeader('X-RateLimit-Limit'),
            'X-RateLimit-Remaining': res.getHeader('X-RateLimit-Remaining'),
            'X-RateLimit-Reset': res.getHeader('X-RateLimit-Reset'),
        };
        if (rateLimitHeaders['X-RateLimit-Remaining'] === '0') {
            logger_1.logger.warn('Rate limit exceeded', {
                ip: req.ip,
                route: req.path,
                method: req.method,
                headers: rateLimitHeaders,
            });
            res.status(429).json({
                success: false,
                message: 'Rate limit exceeded',
                error: 'RATE_LIMIT_EXCEEDED',
                retryAfter: rateLimitHeaders['X-RateLimit-Reset'],
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Rate limit validation error:', error);
        next();
    }
};
exports.validateRateLimit = validateRateLimit;
const handleValidationError = (error, req, res, next) => {
    if (error instanceof errors_1.ValidationError) {
        logger_1.logger.warn('Validation error handled', {
            route: req.path,
            method: req.method,
            error: error.message,
            details: error.details,
        });
        res.status(400).json({
            success: false,
            message: error.message,
            error: 'VALIDATION_ERROR',
            details: error.details,
        });
        return;
    }
    next(error);
};
exports.handleValidationError = handleValidationError;
exports.default = exports.validateRequest;
//# sourceMappingURL=validation.middleware.js.map