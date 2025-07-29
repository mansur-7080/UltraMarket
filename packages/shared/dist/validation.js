"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.fileUploadSchema = exports.rateLimitSchema = exports.ValidationError = exports.validateRequest = exports.validateEnvironment = exports.sanitizeHtml = exports.sanitizeInput = exports.uuidSchema = exports.phoneSchema = exports.usernameSchema = exports.emailSchema = exports.apiGatewayEnvironmentSchema = exports.orderServiceEnvironmentSchema = exports.cartServiceEnvironmentSchema = exports.productServiceEnvironmentSchema = exports.userServiceEnvironmentSchema = exports.baseEnvironmentSchema = exports.databaseUrlSchema = exports.jwtSecretSchema = exports.passwordSchema = void 0;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
// Enhanced password validation schema
exports.passwordSchema = joi_1.default.string()
    .min(12)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
    'string.min': 'Password must be at least 12 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required',
});
// JWT secret validation (minimum 32 characters)
exports.jwtSecretSchema = joi_1.default.string().min(32).required().messages({
    'string.min': 'JWT secret must be at least 32 characters long',
    'any.required': 'JWT secret is required',
});
// Database URL validation
exports.databaseUrlSchema = joi_1.default.string()
    .uri({ scheme: ['postgresql', 'mongodb', 'redis'] })
    .required()
    .messages({
    'string.uri': 'Database URL must be a valid URI',
    'any.required': 'Database URL is required',
});
// Environment validation schemas
exports.baseEnvironmentSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string()
        .valid('development', 'staging', 'production', 'test')
        .default('development'),
    PORT: joi_1.default.number().port().default(3000),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    CORS_ORIGIN: joi_1.default.string().uri().default('http://localhost:3000'),
    API_RATE_LIMIT: joi_1.default.number().integer().min(1).max(10000).default(100),
    API_RATE_WINDOW: joi_1.default.number().integer().min(1).max(3600).default(900), // 15 minutes
});
// User Service specific environment validation
exports.userServiceEnvironmentSchema = exports.baseEnvironmentSchema.keys({
    DATABASE_URL: exports.databaseUrlSchema,
    REDIS_URL: joi_1.default.string().uri({ scheme: 'redis' }).required(),
    JWT_SECRET: exports.jwtSecretSchema,
    JWT_REFRESH_SECRET: exports.jwtSecretSchema,
    JWT_EXPIRES_IN: joi_1.default.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d'),
    BCRYPT_ROUNDS: joi_1.default.number().integer().min(10).max(15).default(12),
    EMAIL_SERVICE_URL: joi_1.default.string().uri().optional(),
    SMTP_HOST: joi_1.default.string().hostname().optional(),
    SMTP_PORT: joi_1.default.number().port().optional(),
    SMTP_USER: joi_1.default.string().email().optional(),
    SMTP_PASS: joi_1.default.string().optional(),
    UPLOAD_MAX_SIZE: joi_1.default.number().integer().min(1).max(100).default(10), // MB
    SESSION_SECRET: joi_1.default.string().min(32).required(),
    ENCRYPTION_KEY: joi_1.default.string().length(32).required(),
});
// Product Service specific environment validation
exports.productServiceEnvironmentSchema = exports.baseEnvironmentSchema.keys({
    MONGODB_URL: joi_1.default.string().uri({ scheme: 'mongodb' }).required(),
    REDIS_URL: joi_1.default.string().uri({ scheme: 'redis' }).required(),
    ELASTICSEARCH_URL: joi_1.default.string().uri().optional(),
    IMAGE_UPLOAD_PATH: joi_1.default.string().default('/uploads/products'),
    MAX_PRODUCT_IMAGES: joi_1.default.number().integer().min(1).max(20).default(10),
    PRODUCT_CACHE_TTL: joi_1.default.number().integer().min(60).max(86400).default(3600), // 1 hour
});
// Cart Service specific environment validation
exports.cartServiceEnvironmentSchema = exports.baseEnvironmentSchema.keys({
    REDIS_URL: joi_1.default.string().uri({ scheme: 'redis' }).required(),
    CART_EXPIRY_HOURS: joi_1.default.number().integer().min(1).max(168).default(24), // 1 day
    MAX_CART_ITEMS: joi_1.default.number().integer().min(1).max(1000).default(100),
    PRODUCT_SERVICE_URL: joi_1.default.string().uri().required(),
    USER_SERVICE_URL: joi_1.default.string().uri().required(),
});
// Order Service specific environment validation
exports.orderServiceEnvironmentSchema = exports.baseEnvironmentSchema.keys({
    DATABASE_URL: exports.databaseUrlSchema,
    REDIS_URL: joi_1.default.string().uri({ scheme: 'redis' }).required(),
    PAYMENT_SERVICE_URL: joi_1.default.string().uri().required(),
    INVENTORY_SERVICE_URL: joi_1.default.string().uri().required(),
    NOTIFICATION_SERVICE_URL: joi_1.default.string().uri().required(),
    ORDER_TIMEOUT_MINUTES: joi_1.default.number().integer().min(5).max(60).default(30),
});
// API Gateway specific environment validation
exports.apiGatewayEnvironmentSchema = exports.baseEnvironmentSchema.keys({
    JWT_SECRET: exports.jwtSecretSchema,
    RATE_LIMIT_GLOBAL: joi_1.default.number().integer().min(1).max(10000).default(1000),
    RATE_LIMIT_PER_IP: joi_1.default.number().integer().min(1).max(1000).default(100),
    TIMEOUT_SECONDS: joi_1.default.number().integer().min(1).max(300).default(30),
    MAX_REQUEST_SIZE: joi_1.default.string().default('10mb'),
    CORS_CREDENTIALS: joi_1.default.boolean().default(true),
});
// Input validation schemas
exports.emailSchema = joi_1.default.string()
    .email({ tlds: { allow: false } })
    .max(254)
    .required()
    .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email address is too long',
    'any.required': 'Email address is required',
});
exports.usernameSchema = joi_1.default.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must contain only alphanumeric characters',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username must not exceed 30 characters',
    'any.required': 'Username is required',
});
exports.phoneSchema = joi_1.default.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
    'string.pattern.base': 'Please provide a valid phone number',
});
exports.uuidSchema = joi_1.default.string()
    .uuid({ version: ['uuidv4'] })
    .required()
    .messages({
    'string.guid': 'Please provide a valid UUID',
    'any.required': 'ID is required',
});
// Sanitization functions
const sanitizeInput = (input) => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};
exports.sanitizeInput = sanitizeInput;
const sanitizeHtml = (html) => {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
};
exports.sanitizeHtml = sanitizeHtml;
// Validation helper functions
const validateEnvironment = (schema, env = process.env) => {
    const { error, value } = schema.validate(env, {
        allowUnknown: true,
        stripUnknown: false,
        abortEarly: false,
    });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message).join(', ');
        throw new Error(`Environment validation failed: ${errorMessages}`);
    }
    return value;
};
exports.validateEnvironment = validateEnvironment;
const validateRequest = (schema, data) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        const errorMessages = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
        }));
        throw new ValidationError('Request validation failed', errorMessages);
    }
    return value;
};
exports.validateRequest = validateRequest;
// Custom validation error class
class ValidationError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
// Rate limiting validation
exports.rateLimitSchema = joi_1.default.object({
    windowMs: joi_1.default.number().integer().min(1000).max(3600000).default(900000), // 15 minutes
    max: joi_1.default.number().integer().min(1).max(10000).default(100),
    message: joi_1.default.string().default('Too many requests from this IP, please try again later'),
    standardHeaders: joi_1.default.boolean().default(true),
    legacyHeaders: joi_1.default.boolean().default(false),
});
// File upload validation
exports.fileUploadSchema = joi_1.default.object({
    fieldName: joi_1.default.string().required(),
    maxFiles: joi_1.default.number().integer().min(1).max(20).default(5),
    maxSize: joi_1.default.number().integer().min(1024).max(104857600).default(10485760), // 10MB
    allowedMimeTypes: joi_1.default.array()
        .items(joi_1.default.string())
        .default(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    allowedExtensions: joi_1.default.array()
        .items(joi_1.default.string())
        .default(['.jpg', '.jpeg', '.png', '.gif', '.webp']),
});
// Export all schemas for easy access
exports.schemas = {
    password: exports.passwordSchema,
    jwtSecret: exports.jwtSecretSchema,
    databaseUrl: exports.databaseUrlSchema,
    email: exports.emailSchema,
    username: exports.usernameSchema,
    phone: exports.phoneSchema,
    uuid: exports.uuidSchema,
    rateLimit: exports.rateLimitSchema,
    fileUpload: exports.fileUploadSchema,
    environment: {
        base: exports.baseEnvironmentSchema,
        userService: exports.userServiceEnvironmentSchema,
        productService: exports.productServiceEnvironmentSchema,
        cartService: exports.cartServiceEnvironmentSchema,
        orderService: exports.orderServiceEnvironmentSchema,
        apiGateway: exports.apiGatewayEnvironmentSchema,
    },
};
//# sourceMappingURL=validation.js.map