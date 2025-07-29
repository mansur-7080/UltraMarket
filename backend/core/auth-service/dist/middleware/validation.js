"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBooleanField = exports.validateDateField = exports.validateUuidField = exports.validateArrayField = exports.validateNumberField = exports.validateStringLength = exports.requireFields = exports.validatePasswordField = exports.validateEmailField = exports.validateRequest = void 0;
const logger = console;
const validateAndSanitize = (data, schema) => {
    return data;
};
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
class ApiError extends Error {
    statusCode;
    message;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
    }
}
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            if (schema.body) {
                req.body = validateAndSanitize(req.body, schema.body);
            }
            if (schema.query) {
                req.query = validateAndSanitize(req.query, schema.query);
            }
            if (schema.params) {
                req.params = validateAndSanitize(req.params, schema.params);
            }
            return next();
        }
        catch (error) {
            logger.warn('Request validation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                path: req.path,
                method: req.method,
                body: req.body,
            });
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Validation failed',
                errors: getValidationErrors(error),
            });
        }
    };
};
exports.validateRequest = validateRequest;
const validateEmailField = (fieldName = 'email') => {
    return (req, res, next) => {
        const email = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
        if (!email) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} is required`,
            });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${fieldName} format`,
            });
        }
        return next();
    };
};
exports.validateEmailField = validateEmailField;
const validatePasswordField = (fieldName = 'password') => {
    return (req, res, next) => {
        const password = req.body[fieldName];
        if (!password) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} is required`,
            });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be at least 8 characters long with uppercase, lowercase, number, and special character`,
            });
        }
        return next();
    };
};
exports.validatePasswordField = validatePasswordField;
const requireFields = (fields) => {
    return (req, res, next) => {
        const missingFields = [];
        for (const field of fields) {
            if (!req.body[field] && !req.query[field] && !req.params[field]) {
                missingFields.push(field);
            }
        }
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }
        return next();
    };
};
exports.requireFields = requireFields;
const validateStringLength = (fieldName, minLength, maxLength) => {
    return (req, res, next) => {
        const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
        if (!value) {
            return next();
        }
        if (typeof value !== 'string') {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be a string`,
            });
        }
        if (minLength && value.length < minLength) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be at least ${minLength} characters long`,
            });
        }
        if (maxLength && value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be no more than ${maxLength} characters long`,
            });
        }
        return next();
    };
};
exports.validateStringLength = validateStringLength;
const validateNumberField = (fieldName, min, max) => {
    return (req, res, next) => {
        const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
        if (!value) {
            return next();
        }
        const numValue = Number(value);
        if (isNaN(numValue)) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be a valid number`,
            });
        }
        if (min !== undefined && numValue < min) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be at least ${min}`,
            });
        }
        if (max !== undefined && numValue > max) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be no more than ${max}`,
            });
        }
        return next();
    };
};
exports.validateNumberField = validateNumberField;
const validateArrayField = (fieldName, minLength, maxLength) => {
    return (req, res, next) => {
        const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
        if (!value) {
            return next();
        }
        if (!Array.isArray(value)) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be an array`,
            });
        }
        if (minLength && value.length < minLength) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must have at least ${minLength} items`,
            });
        }
        if (maxLength && value.length > maxLength) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must have no more than ${maxLength} items`,
            });
        }
        return next();
    };
};
exports.validateArrayField = validateArrayField;
const validateUuidField = (fieldName) => {
    return (req, res, next) => {
        const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
        if (!value) {
            return next();
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be a valid UUID`,
            });
        }
        return next();
    };
};
exports.validateUuidField = validateUuidField;
const validateDateField = (fieldName) => {
    return (req, res, next) => {
        const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
        if (!value) {
            return next();
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be a valid date`,
            });
        }
        return next();
    };
};
exports.validateDateField = validateDateField;
const validateBooleanField = (fieldName) => {
    return (req, res, next) => {
        const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
        if (!value) {
            return next();
        }
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            return res.status(400).json({
                success: false,
                message: `${fieldName} must be a boolean`,
            });
        }
        if (typeof value === 'string') {
            if (req.body[fieldName]) {
                req.body[fieldName] = value === 'true';
            }
            else if (req.query[fieldName]) {
                req.query[fieldName] = value === 'true';
            }
            else if (req.params[fieldName]) {
                req.params[fieldName] = value === 'true';
            }
        }
        return next();
    };
};
exports.validateBooleanField = validateBooleanField;
function getValidationErrors(error) {
    if (error instanceof Error) {
        return [error.message];
    }
    return ['Validation failed'];
}
//# sourceMappingURL=validation.js.map