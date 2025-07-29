"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.refreshTokenSchema = exports.profileUpdateSchema = exports.passwordChangeSchema = exports.passwordResetSchema = exports.loginSchema = exports.registrationSchema = void 0;
exports.validateRegistrationInput = validateRegistrationInput;
exports.validateLoginInput = validateLoginInput;
exports.validatePasswordResetInput = validatePasswordResetInput;
exports.validatePasswordChangeInput = validatePasswordChangeInput;
exports.validateProfileUpdateInput = validateProfileUpdateInput;
exports.validateRefreshTokenInput = validateRefreshTokenInput;
exports.validateResetPasswordInput = validateResetPasswordInput;
exports.sanitizeInput = sanitizeInput;
exports.isValidEmail = isValidEmail;
exports.isStrongPassword = isStrongPassword;
const joi_1 = __importDefault(require("joi"));
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
exports.registrationSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
    }),
    firstName: joi_1.default.string()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces',
        'any.required': 'First name is required',
    }),
    lastName: joi_1.default.string()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces',
        'any.required': 'Last name is required',
    }),
    phone: joi_1.default.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .messages({
        'string.pattern.base': 'Please provide a valid phone number',
    }),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string().required().messages({
        'any.required': 'Password is required',
    }),
});
exports.passwordResetSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
});
exports.passwordChangeSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        'any.required': 'Current password is required',
    }),
    newPassword: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password must not exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required',
    }),
});
exports.profileUpdateSchema = joi_1.default.object({
    firstName: joi_1.default.string()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .optional()
        .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces',
    }),
    lastName: joi_1.default.string()
        .min(2)
        .max(50)
        .pattern(/^[a-zA-Z\s]+$/)
        .optional()
        .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces',
    }),
    phone: joi_1.default.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .messages({
        'string.pattern.base': 'Please provide a valid phone number',
    }),
});
exports.refreshTokenSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required().messages({
        'any.required': 'Refresh token is required',
    }),
});
exports.resetPasswordSchema = joi_1.default.object({
    token: joi_1.default.string().required().messages({
        'any.required': 'Reset token is required',
    }),
    newPassword: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password must not exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required',
    }),
});
function validateRegistrationInput(data) {
    try {
        return exports.registrationSchema.validate(data, { abortEarly: false });
    }
    catch (error) {
        logger.error('Registration validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
function validateLoginInput(data) {
    try {
        return exports.loginSchema.validate(data, { abortEarly: false });
    }
    catch (error) {
        logger.error('Login validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
function validatePasswordResetInput(data) {
    try {
        return exports.passwordResetSchema.validate(data, { abortEarly: false });
    }
    catch (error) {
        logger.error('Password reset validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
function validatePasswordChangeInput(data) {
    try {
        return exports.passwordChangeSchema.validate(data, { abortEarly: false });
    }
    catch (error) {
        logger.error('Password change validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
function validateProfileUpdateInput(data) {
    try {
        return exports.profileUpdateSchema.validate(data, { abortEarly: false });
    }
    catch (error) {
        logger.error('Profile update validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
function validateRefreshTokenInput(data) {
    try {
        return exports.refreshTokenSchema.validate(data, { abortEarly: false });
    }
    catch (error) {
        logger.error('Refresh token validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
function validateResetPasswordInput(data) {
    try {
        return exports.resetPasswordSchema.validate(data, { abortEarly: false });
    }
    catch (error) {
        logger.error('Reset password validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
function sanitizeInput(data) {
    if (typeof data === 'string') {
        return data.trim();
    }
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                sanitized[key] = value.trim();
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    return data;
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    return (password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar);
}
//# sourceMappingURL=auth.validator.js.map