"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
var joi_1 = __importDefault(require("joi"));
var logger_1 = require("../utils/logger");
// Environment validation schema
var envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().port().default(3005),
    ALLOWED_ORIGINS: joi_1.default.string()
        .default('http://localhost:3000')
        .description('Allowed CORS origins'),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    // Database configuration
    DATABASE_URL: joi_1.default.string().uri().required().description('PostgreSQL connection URL'),
    // External service URLs
    PRODUCT_SERVICE_URL: joi_1.default.string()
        .uri()
        .default('http://localhost:3003')
        .description('Product service URL'),
    CART_SERVICE_URL: joi_1.default.string()
        .uri()
        .default('http://localhost:3004')
        .description('Cart service URL'),
    USER_SERVICE_URL: joi_1.default.string()
        .uri()
        .default('http://localhost:3001')
        .description('User service URL'),
    PAYMENT_SERVICE_URL: joi_1.default.string()
        .uri()
        .default('http://localhost:3006')
        .description('Payment service URL'),
    // JWT configuration
    JWT_SECRET: joi_1.default.string().min(32).required().description('JWT secret key'),
    JWT_EXPIRES_IN: joi_1.default.string().default('15m').description('JWT access token expiration'),
    // Payment gateway configuration
    CLICK_MERCHANT_ID: joi_1.default.string().optional().description('Click merchant ID'),
    CLICK_SECRET_KEY: joi_1.default.string().optional().description('Click secret key'),
    PAYME_MERCHANT_ID: joi_1.default.string().optional().description('Payme merchant ID'),
    PAYME_SECRET_KEY: joi_1.default.string().optional().description('Payme secret key'),
    // Business configuration
    TAX_RATE: joi_1.default.number()
        .min(0)
        .max(1)
        .default(0.12) // 12% VAT in Uzbekistan
        .description('Tax rate'),
    SHIPPING_COST: joi_1.default.number()
        .positive()
        .default(25000) // 25,000 UZS
        .description('Standard shipping cost'),
    FREE_SHIPPING_THRESHOLD: joi_1.default.number()
        .positive()
        .default(500000) // 500,000 UZS
        .description('Free shipping threshold'),
    DEFAULT_CURRENCY: joi_1.default.string()
        .length(3)
        .uppercase()
        .default('UZS')
        .description('Default currency code'),
    // Order configuration
    ORDER_EXPIRY_MINUTES: joi_1.default.number()
        .positive()
        .default(30)
        .description('Order expiry time in minutes'),
    MAX_ORDER_ITEMS: joi_1.default.number().positive().default(100).description('Maximum items per order'),
    // Notification configuration
    EMAIL_SERVICE_URL: joi_1.default.string().uri().optional().description('Email service URL'),
    SMS_SERVICE_URL: joi_1.default.string().uri().optional().description('SMS service URL'),
    // Rate limiting
    RATE_LIMIT_WINDOW: joi_1.default.number()
        .positive()
        .default(900000) // 15 minutes
        .description('Rate limit window in milliseconds'),
    RATE_LIMIT_MAX: joi_1.default.number().positive().default(1000).description('Maximum requests per window'),
}).unknown();
// Validate environment variables
var validateEnv = function () {
    var _a = envSchema.validate(process.env), error = _a.error, value = _a.value;
    if (error) {
        logger_1.logger.error('Environment validation failed:', {
            error: error.details.map(function (detail) { return ({
                key: detail.path.join('.'),
                message: detail.message,
            }); }),
        });
        throw new Error("Environment validation failed: ".concat(error.message));
    }
    // Update process.env with validated values
    Object.assign(process.env, value);
    logger_1.logger.info('✅ Environment validation passed');
    return value;
};
exports.validateEnv = validateEnv;
