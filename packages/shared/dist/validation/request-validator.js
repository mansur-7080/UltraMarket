"use strict";
/**
 * UltraMarket Shared - Request Validator
 * Professional request validation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.validateRequestOrThrow = validateRequestOrThrow;
exports.validateQuery = validateQuery;
exports.validateQueryOrThrow = validateQueryOrThrow;
exports.validateParams = validateParams;
exports.validateParamsOrThrow = validateParamsOrThrow;
exports.validatePagination = validatePagination;
exports.validateSearchParams = validateSearchParams;
exports.validateFileUpload = validateFileUpload;
exports.validateEmail = validateEmail;
exports.validatePhone = validatePhone;
exports.validatePassword = validatePassword;
exports.sanitizeString = sanitizeString;
exports.sanitizeEmail = sanitizeEmail;
exports.createValidationMiddleware = createValidationMiddleware;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
const api_error_1 = require("../errors/api-error");
/**
 * Validate request body against a Joi schema
 */
function validateRequest(data, schema) {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        errors: {
            wrap: {
                label: false,
            },
        },
    });
    return { error, value };
}
/**
 * Validate request body and throw error if invalid
 */
function validateRequestOrThrow(data, schema) {
    const { error, value } = validateRequest(data, schema);
    if (error) {
        const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            code: detail.type,
        }));
        throw new api_error_1.ApiError(400, 'Validation error', details);
    }
    return value;
}
/**
 * Validate query parameters
 */
function validateQuery(query, schema) {
    return validateRequest(query, schema);
}
/**
 * Validate query parameters and throw error if invalid
 */
function validateQueryOrThrow(query, schema) {
    const { error, value } = validateQuery(query, schema);
    if (error) {
        const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            code: detail.type,
        }));
        throw new api_error_1.ApiError(400, 'Invalid query parameters', details);
    }
    return value;
}
/**
 * Validate path parameters
 */
function validateParams(params, schema) {
    return validateRequest(params, schema);
}
/**
 * Validate path parameters and throw error if invalid
 */
function validateParamsOrThrow(params, schema) {
    const { error, value } = validateParams(params, schema);
    if (error) {
        const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            code: detail.type,
        }));
        throw new api_error_1.ApiError(400, 'Invalid path parameters', details);
    }
    return value;
}
/**
 * Sanitize and validate pagination parameters
 */
function validatePagination(query) {
    const schema = joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10),
    });
    const { error, value } = validateRequest(query, schema);
    if (error) {
        const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            code: detail.type,
        }));
        throw new api_error_1.ApiError(400, 'Invalid pagination parameters', details);
    }
    return {
        page: value.page,
        limit: value.limit,
        offset: (value.page - 1) * value.limit,
    };
}
/**
 * Validate and sanitize search parameters
 */
function validateSearchParams(query) {
    const schema = joi_1.default.object({
        search: joi_1.default.string().trim().max(100).optional(),
        filters: joi_1.default.object().unknown().optional(),
        sort: joi_1.default.object().unknown().optional(),
    });
    const { error, value } = validateRequest(query, schema);
    if (error) {
        const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            code: detail.type,
        }));
        throw new api_error_1.ApiError(400, 'Invalid search parameters', details);
    }
    return {
        search: value.search || '',
        filters: value.filters || {},
        sort: value.sort || {},
    };
}
/**
 * Validate file upload
 */
function validateFileUpload(file, options = {}) {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [], required = false } = options;
    if (required && !file) {
        throw new api_error_1.ApiError(400, 'File is required');
    }
    if (!file) {
        return;
    }
    if (file.size > maxSize) {
        throw new api_error_1.ApiError(400, `File size must be less than ${maxSize / 1024 / 1024}MB`);
    }
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        throw new api_error_1.ApiError(400, `File type must be one of: ${allowedTypes.join(', ')}`);
    }
}
/**
 * Validate email format
 */
function validateEmail(email) {
    const emailSchema = joi_1.default.string().email();
    const { error } = emailSchema.validate(email);
    return !error;
}
/**
 * Validate phone number format
 */
function validatePhone(phone) {
    const phoneSchema = joi_1.default.string().pattern(/^\+?[1-9]\d{1,14}$/);
    const { error } = phoneSchema.validate(phone);
    return !error;
}
/**
 * Validate password strength
 */
function validatePassword(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Sanitize string input
 */
function sanitizeString(input) {
    return input.trim().replace(/\s+/g, ' ');
}
/**
 * Sanitize email input
 */
function sanitizeEmail(email) {
    return email.trim().toLowerCase();
}
/**
 * Create a validation middleware for Express
 */
function createValidationMiddleware(schema, validateType = 'body') {
    return (req, res, next) => {
        try {
            const data = req[validateType];
            const validatedData = validateRequestOrThrow(data, schema);
            req[validateType] = validatedData;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=request-validator.js.map