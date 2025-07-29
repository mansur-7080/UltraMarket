"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
const logger_1 = require("../utils/logger");
// Environment validation schema
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().port().default(3003),
    MONGODB_URI: joi_1.default.string().uri().required().description('MongoDB connection URI'),
    ALLOWED_ORIGINS: joi_1.default.string()
        .default('http://localhost:3000')
        .description('Allowed CORS origins'),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    // JWT configuration
    JWT_SECRET: joi_1.default.string().min(32).required().description('JWT secret key'),
    JWT_EXPIRES_IN: joi_1.default.string().default('15m').description('JWT access token expiration'),
    // File upload configuration
    MAX_FILE_SIZE: joi_1.default.number()
        .positive()
        .default(10485760) // 10MB
        .description('Maximum file size in bytes'),
    UPLOAD_PATH: joi_1.default.string().default('./uploads').description('File upload path'),
    // Image processing
    IMAGE_QUALITY: joi_1.default.number().min(1).max(100).default(80).description('Image compression quality'),
    // Cache configuration
    REDIS_URL: joi_1.default.string().uri().optional().description('Redis URL for caching'),
    CACHE_TTL: joi_1.default.number()
        .positive()
        .default(3600) // 1 hour
        .description('Cache TTL in seconds'),
    // Search configuration
    ELASTICSEARCH_URL: joi_1.default.string().uri().optional().description('Elasticsearch URL for search'),
    // External service URLs
    USER_SERVICE_URL: joi_1.default.string().uri().optional().description('User service URL'),
    ORDER_SERVICE_URL: joi_1.default.string().uri().optional().description('Order service URL'),
    // Currency and localization
    DEFAULT_CURRENCY: joi_1.default.string()
        .length(3)
        .uppercase()
        .default('UZS')
        .description('Default currency code'),
    DEFAULT_LOCALE: joi_1.default.string().default('uz-UZ').description('Default locale'),
    // Rate limiting
    RATE_LIMIT_WINDOW: joi_1.default.number()
        .positive()
        .default(900000) // 15 minutes
        .description('Rate limit window in milliseconds'),
    RATE_LIMIT_MAX: joi_1.default.number().positive().default(1000).description('Maximum requests per window'),
}).unknown();
// Validate environment variables
const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env);
    if (error) {
        logger_1.logger.error('Environment validation failed:', {
            error: error.details.map((detail) => ({
                key: detail.path.join('.'),
                message: detail.message,
            })),
        });
        throw new Error(`Environment validation failed: ${error.message}`);
    }
    // Update process.env with validated values
    Object.assign(process.env, value);
    logger_1.logger.info('✅ Environment validation passed');
    return value;
};
exports.validateEnv = validateEnv;
//# sourceMappingURL=env.validation.js.map