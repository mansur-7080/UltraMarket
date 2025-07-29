"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentType = exports.sanitizeBody = exports.commonSchemas = exports.validateParams = exports.validateQuery = exports.validateBody = exports.validateRequest = void 0;
const logger = console;
class ApiError extends Error {
    statusCode;
    message;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
    }
}
const validateRequest = (req, schema) => {
    const errors = [];
    const body = req.body || {};
    for (const [field, rule] of Object.entries(schema)) {
        const value = body[field];
        if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
        }
        if (!rule.required && (value === undefined || value === null || value === '')) {
            continue;
        }
        if (rule.type === 'string' && typeof value !== 'string') {
            errors.push(`${field} must be a string`);
            continue;
        }
        if (rule.type === 'number' && typeof value !== 'number') {
            errors.push(`${field} must be a number`);
            continue;
        }
        if (rule.type === 'boolean' && typeof value !== 'boolean') {
            errors.push(`${field} must be a boolean`);
            continue;
        }
        if (rule.type === 'string' && typeof value === 'string') {
            if (rule.minLength && value.length < rule.minLength) {
                errors.push(`${field} must be at least ${rule.minLength} characters long`);
            }
            if (rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${field} must be no more than ${rule.maxLength} characters long`);
            }
            if (rule.email || rule.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors.push(`${field} must be a valid email address`);
                }
            }
            if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${field} format is invalid`);
            }
        }
        if (rule.type === 'number' && typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                errors.push(`${field} must be at least ${rule.min}`);
            }
            if (rule.max !== undefined && value > rule.max) {
                errors.push(`${field} must be no more than ${rule.max}`);
            }
        }
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.validateRequest = validateRequest;
const validateBody = (schema) => {
    return (req, res, next) => {
        const validation = (0, exports.validateRequest)(req, schema);
        if (!validation.isValid) {
            logger.warn('Request validation failed', {
                errors: validation.errors,
                path: req.path,
                method: req.method,
            });
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors,
            });
        }
        return next();
    };
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const validation = (0, exports.validateRequest)({ body: req.query }, schema);
        if (!validation.isValid) {
            logger.warn('Query validation failed', {
                errors: validation.errors,
                path: req.path,
                method: req.method,
            });
            return res.status(400).json({
                success: false,
                message: 'Query validation failed',
                errors: validation.errors,
            });
        }
        return next();
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        const validation = (0, exports.validateRequest)({ body: req.params }, schema);
        if (!validation.isValid) {
            logger.warn('Parameter validation failed', {
                errors: validation.errors,
                path: req.path,
                method: req.method,
            });
            return res.status(400).json({
                success: false,
                message: 'Parameter validation failed',
                errors: validation.errors,
            });
        }
        return next();
    };
};
exports.validateParams = validateParams;
exports.commonSchemas = {
    pagination: {
        page: { type: 'number', required: false, min: 1 },
        limit: { type: 'number', required: false, min: 1, max: 100 },
    },
    email: {
        email: { type: 'string', required: true, email: true },
    },
    password: {
        password: { type: 'string', required: true, minLength: 8 },
    },
    id: {
        id: { type: 'string', required: true, minLength: 1 },
    },
};
const sanitizeBody = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach((key) => {
            if (req.body[key] === undefined || req.body[key] === null) {
                delete req.body[key];
            }
        });
        Object.keys(req.body).forEach((key) => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    return next();
};
exports.sanitizeBody = sanitizeBody;
const validateContentType = (req, res, next) => {
    const contentType = req.get('Content-Type');
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type must be application/json',
            });
        }
    }
    return next();
};
exports.validateContentType = validateContentType;
//# sourceMappingURL=validationMiddleware.js.map