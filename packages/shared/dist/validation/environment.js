"use strict";
/**
 * UltraMarket Environment Validation
 * Comprehensive validation for all microservices environment variables
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalServicesEnvironmentSchema = exports.messageQueueEnvironmentSchema = exports.jwtEnvironmentSchema = exports.redisEnvironmentSchema = exports.databaseEnvironmentSchema = exports.baseEnvironmentSchema = exports.serviceEnvironmentSchemas = void 0;
exports.validateEnvironment = validateEnvironment;
exports.createEnvironmentValidator = createEnvironmentValidator;
exports.validateEnvironmentOnStartup = validateEnvironmentOnStartup;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
// Base environment schema
const baseEnvironmentSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string()
        .valid('development', 'staging', 'production', 'test')
        .default('development'),
    PORT: joi_1.default.number().integer().min(1).max(65535).default(3000),
    HOST: joi_1.default.string().hostname().default('localhost'),
    API_VERSION: joi_1.default.string()
        .pattern(/^v\d+$/)
        .default('v1'),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug', 'trace').default('info'),
    CORS_ORIGIN: joi_1.default.alternatives()
        .try(joi_1.default.string().uri(), joi_1.default.string().valid('*'), joi_1.default.array().items(joi_1.default.string().uri()))
        .default('*'),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().integer().min(1000).default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().integer().min(1).default(100),
    HEALTH_CHECK_TIMEOUT: joi_1.default.number().integer().min(1000).default(5000),
    REQUEST_TIMEOUT: joi_1.default.number().integer().min(1000).default(30000),
});
exports.baseEnvironmentSchema = baseEnvironmentSchema;
// Database environment schema
const databaseEnvironmentSchema = joi_1.default.object({
    DATABASE_URL: joi_1.default.string().uri().required().description('PostgreSQL connection string'),
    DATABASE_HOST: joi_1.default.string().hostname().default('localhost'),
    DATABASE_PORT: joi_1.default.number().integer().min(1).max(65535).default(5432),
    DATABASE_NAME: joi_1.default.string().alphanum().min(1).max(63).required(),
    DATABASE_USER: joi_1.default.string().min(1).required(),
    DATABASE_PASSWORD: joi_1.default.string().min(1).required(),
    DATABASE_SSL: joi_1.default.boolean().default(false),
    DATABASE_POOL_MIN: joi_1.default.number().integer().min(0).default(2),
    DATABASE_POOL_MAX: joi_1.default.number().integer().min(1).default(10),
    DATABASE_TIMEOUT: joi_1.default.number().integer().min(1000).default(60000),
});
exports.databaseEnvironmentSchema = databaseEnvironmentSchema;
// Redis environment schema
const redisEnvironmentSchema = joi_1.default.object({
    REDIS_URL: joi_1.default.string().uri().optional().description('Redis connection string'),
    REDIS_HOST: joi_1.default.string().hostname().default('localhost'),
    REDIS_PORT: joi_1.default.number().integer().min(1).max(65535).default(6379),
    REDIS_PASSWORD: joi_1.default.string().optional(),
    REDIS_DB: joi_1.default.number().integer().min(0).max(15).default(0),
    REDIS_TTL: joi_1.default.number().integer().min(1).default(3600), // 1 hour
    REDIS_MAX_RETRIES: joi_1.default.number().integer().min(0).default(3),
    REDIS_RETRY_DELAY: joi_1.default.number().integer().min(100).default(1000),
});
exports.redisEnvironmentSchema = redisEnvironmentSchema;
// JWT environment schema
const jwtEnvironmentSchema = joi_1.default.object({
    JWT_SECRET: joi_1.default.string().min(32).required().description('JWT signing secret'),
    JWT_REFRESH_SECRET: joi_1.default.string().min(32).required().description('JWT refresh token secret'),
    JWT_EXPIRES_IN: joi_1.default.string()
        .pattern(/^\d+[smhd]$/)
        .default('1h'),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string()
        .pattern(/^\d+[smhd]$/)
        .default('7d'),
    JWT_ALGORITHM: joi_1.default.string()
        .valid('HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512')
        .default('HS256'),
    JWT_ISSUER: joi_1.default.string().default('ultramarket'),
    JWT_AUDIENCE: joi_1.default.string().default('ultramarket-api'),
});
exports.jwtEnvironmentSchema = jwtEnvironmentSchema;
// Message Queue environment schema
const messageQueueEnvironmentSchema = joi_1.default.object({
    RABBITMQ_URL: joi_1.default.string().uri().required().description('RabbitMQ connection string'),
    RABBITMQ_HOST: joi_1.default.string().hostname().default('localhost'),
    RABBITMQ_PORT: joi_1.default.number().integer().min(1).max(65535).default(5672),
    RABBITMQ_USER: joi_1.default.string().default('guest'),
    RABBITMQ_PASSWORD: joi_1.default.string().default('guest'),
    RABBITMQ_VHOST: joi_1.default.string().default('/'),
    RABBITMQ_PREFETCH: joi_1.default.number().integer().min(1).default(10),
    RABBITMQ_RETRY_ATTEMPTS: joi_1.default.number().integer().min(0).default(3),
    RABBITMQ_RETRY_DELAY: joi_1.default.number().integer().min(100).default(1000),
});
exports.messageQueueEnvironmentSchema = messageQueueEnvironmentSchema;
// External services environment schema
const externalServicesEnvironmentSchema = joi_1.default.object({
    // Payment gateway
    STRIPE_SECRET_KEY: joi_1.default.string().pattern(/^sk_/).optional(),
    STRIPE_WEBHOOK_SECRET: joi_1.default.string().optional(),
    PAYPAL_CLIENT_ID: joi_1.default.string().optional(),
    PAYPAL_CLIENT_SECRET: joi_1.default.string().optional(),
    // Email service
    SMTP_HOST: joi_1.default.string().hostname().optional(),
    SMTP_PORT: joi_1.default.number().integer().valid(25, 465, 587, 2525).optional(),
    SMTP_USER: joi_1.default.string().email().optional(),
    SMTP_PASSWORD: joi_1.default.string().optional(),
    SMTP_FROM: joi_1.default.string().email().optional(),
    // AWS services
    AWS_ACCESS_KEY_ID: joi_1.default.string().optional(),
    AWS_SECRET_ACCESS_KEY: joi_1.default.string().optional(),
    AWS_REGION: joi_1.default.string().optional(),
    AWS_S3_BUCKET: joi_1.default.string().optional(),
    // Elasticsearch
    ELASTICSEARCH_URL: joi_1.default.string().uri().optional(),
    ELASTICSEARCH_USERNAME: joi_1.default.string().optional(),
    ELASTICSEARCH_PASSWORD: joi_1.default.string().optional(),
});
exports.externalServicesEnvironmentSchema = externalServicesEnvironmentSchema;
// Service-specific schemas
exports.serviceEnvironmentSchemas = {
    'auth-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(jwtEnvironmentSchema),
    'user-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema),
    'product-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema)
        .concat(externalServicesEnvironmentSchema.fork(['ELASTICSEARCH_URL', 'ELASTICSEARCH_USERNAME', 'ELASTICSEARCH_PASSWORD'], (schema) => schema)),
    'order-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema),
    'payment-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema)
        .concat(externalServicesEnvironmentSchema.fork(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'], (schema) => schema)),
    'cart-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema),
    'notification-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema)
        .concat(externalServicesEnvironmentSchema.fork(['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'], (schema) => schema)),
    'search-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema)
        .concat(externalServicesEnvironmentSchema.fork(['ELASTICSEARCH_URL', 'ELASTICSEARCH_USERNAME', 'ELASTICSEARCH_PASSWORD'], (schema) => schema)),
    'api-gateway': baseEnvironmentSchema.concat(redisEnvironmentSchema).concat(jwtEnvironmentSchema),
    'pc-builder-service': baseEnvironmentSchema
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema),
    'dynamic-pricing-service': baseEnvironmentSchema
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema),
    'analytics-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema),
    'inventory-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema),
    'review-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema),
    'shipping-service': baseEnvironmentSchema
        .concat(databaseEnvironmentSchema)
        .concat(redisEnvironmentSchema)
        .concat(messageQueueEnvironmentSchema),
};
// Environment validation function
function validateEnvironment(serviceName, env = process.env) {
    const schema = exports.serviceEnvironmentSchemas[serviceName];
    if (!schema) {
        return {
            error: `Unknown service: ${serviceName}. Available services: ${Object.keys(exports.serviceEnvironmentSchemas).join(', ')}`,
        };
    }
    const { error, value } = schema.validate(env, {
        allowUnknown: true,
        stripUnknown: false,
        abortEarly: false,
    });
    if (error) {
        const errorMessage = error.details
            .map((detail) => `${detail.path.join('.')}: ${detail.message}`)
            .join(', ');
        return {
            error: `Environment validation failed for ${serviceName}: ${errorMessage}`,
        };
    }
    return { value };
}
// Environment validation middleware
function createEnvironmentValidator(serviceName) {
    return (req, res, next) => {
        const { error } = validateEnvironment(serviceName);
        if (error) {
            console.error(`Environment validation error: ${error}`);
            process.exit(1);
        }
        next();
    };
}
// Validate environment on import
function validateEnvironmentOnStartup(serviceName) {
    const { error, value } = validateEnvironment(serviceName);
    if (error) {
        console.error(`🚨 Environment validation failed for ${serviceName}:`);
        console.error(error);
        process.exit(1);
    }
    console.log(`✅ Environment validation passed for ${serviceName}`);
    // Log important configuration in development
    if (process.env.NODE_ENV === 'development') {
        console.log('📋 Configuration:', {
            NODE_ENV: value?.NODE_ENV,
            PORT: value?.PORT,
            HOST: value?.HOST,
            API_VERSION: value?.API_VERSION,
            LOG_LEVEL: value?.LOG_LEVEL,
        });
    }
}
// Default export
exports.default = {
    validateEnvironment,
    validateEnvironmentOnStartup,
    createEnvironmentValidator,
    serviceEnvironmentSchemas: exports.serviceEnvironmentSchemas,
};
//# sourceMappingURL=environment.js.map