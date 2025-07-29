"use strict";
/**
 * UltraMarket Environment Validation
 * Comprehensive validation for all microservices environment variables
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationSchema = exports.paymentSchema = exports.securitySchema = exports.databaseSchema = exports.baseSchema = exports.serviceSchemas = void 0;
exports.validateEnvironment = validateEnvironment;
exports.checkProductionSecurity = checkProductionSecurity;
exports.generateSecureSecret = generateSecureSecret;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
const logger_1 = require("../logging/logger");
// Base environment schema
const baseSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development'),
    SERVICE_NAME: joi_1.default.string().required().description('Service name for logging and monitoring'),
    PORT: joi_1.default.number().port().default(3000),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),
});
exports.baseSchema = baseSchema;
// Database schema
const databaseSchema = joi_1.default.object({
    // PostgreSQL
    POSTGRES_HOST: joi_1.default.string().required(),
    POSTGRES_PORT: joi_1.default.number().port().default(5432),
    POSTGRES_DB: joi_1.default.string().required(),
    POSTGRES_USER: joi_1.default.string().required(),
    POSTGRES_PASSWORD: joi_1.default.string().min(8).required(),
    POSTGRES_SSL: joi_1.default.boolean().default(false),
    // MongoDB
    MONGODB_HOST: joi_1.default.string().required(),
    MONGODB_PORT: joi_1.default.number().port().default(27017),
    MONGODB_DB: joi_1.default.string().required(),
    MONGODB_USER: joi_1.default.string().required(),
    MONGODB_PASSWORD: joi_1.default.string().min(8).required(),
    // Redis
    REDIS_HOST: joi_1.default.string().required(),
    REDIS_PORT: joi_1.default.number().port().default(6379),
    REDIS_PASSWORD: joi_1.default.string().min(8).required(),
    REDIS_DB: joi_1.default.number().min(0).default(0),
});
exports.databaseSchema = databaseSchema;
// Security schema
const securitySchema = joi_1.default.object({
    JWT_SECRET: joi_1.default.string().min(32).required(),
    JWT_REFRESH_SECRET: joi_1.default.string().min(32).required(),
    JWT_EXPIRES_IN: joi_1.default.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d'),
    ENCRYPTION_KEY: joi_1.default.string().length(32).required(),
    HASH_SALT_ROUNDS: joi_1.default.number().min(10).max(15).default(12),
    API_KEY_SECRET: joi_1.default.string().min(32).required(),
    WEBHOOK_SECRET: joi_1.default.string().min(32).required(),
});
exports.securitySchema = securitySchema;
// Payment gateway schema (Uzbekistan)
const paymentSchema = joi_1.default.object({
    // Click
    CLICK_SERVICE_ID: joi_1.default.string().required(),
    CLICK_MERCHANT_ID: joi_1.default.string().required(),
    CLICK_SECRET_KEY: joi_1.default.string().required(),
    CLICK_USER_ID: joi_1.default.string().required(),
    // Payme
    PAYME_MERCHANT_ID: joi_1.default.string().required(),
    PAYME_SECRET_KEY: joi_1.default.string().required(),
    PAYME_ENDPOINT_PASSWORD: joi_1.default.string().required(),
    // UzCard
    UZCARD_MERCHANT_ID: joi_1.default.string().required(),
    UZCARD_SECRET_KEY: joi_1.default.string().required(),
});
exports.paymentSchema = paymentSchema;
// Communication schema
const communicationSchema = joi_1.default.object({
    // SMS
    ESKIZ_EMAIL: joi_1.default.string().email().required(),
    ESKIZ_PASSWORD: joi_1.default.string().required(),
    PLAYMOBILE_LOGIN: joi_1.default.string().required(),
    PLAYMOBILE_PASSWORD: joi_1.default.string().required(),
    // Email
    SMTP_HOST: joi_1.default.string().required(),
    SMTP_PORT: joi_1.default.number().port().default(587),
    SMTP_USER: joi_1.default.string().required(),
    SMTP_PASSWORD: joi_1.default.string().required(),
    SMTP_FROM: joi_1.default.string().email().required(),
});
exports.communicationSchema = communicationSchema;
// Service-specific schemas
exports.serviceSchemas = {
    // Auth Service
    'auth-service': baseSchema
        .concat(databaseSchema)
        .concat(securitySchema)
        .keys({
        BCRYPT_ROUNDS: joi_1.default.number().min(10).max(15).default(12),
        PASSWORD_RESET_EXPIRES: joi_1.default.string().default('1h'),
        EMAIL_VERIFICATION_EXPIRES: joi_1.default.string().default('24h'),
    }),
    // User Service
    'user-service': baseSchema.concat(databaseSchema).keys({
        USER_AVATAR_MAX_SIZE: joi_1.default.number().default(5242880), // 5MB
        USER_AVATAR_ALLOWED_TYPES: joi_1.default.string().default('jpg,jpeg,png,gif'),
    }),
    // Product Service
    'product-service': baseSchema.concat(databaseSchema).keys({
        PRODUCT_IMAGE_MAX_SIZE: joi_1.default.number().default(10485760), // 10MB
        PRODUCT_IMAGE_ALLOWED_TYPES: joi_1.default.string().default('jpg,jpeg,png,gif,webp'),
        ELASTICSEARCH_HOST: joi_1.default.string().required(),
        ELASTICSEARCH_PORT: joi_1.default.number().port().default(9200),
        ELASTICSEARCH_INDEX: joi_1.default.string().required(),
    }),
    // Cart Service
    'cart-service': baseSchema.concat(databaseSchema).keys({
        CART_EXPIRY_HOURS: joi_1.default.number().min(1).max(168).default(24), // 1-168 hours
        CART_MAX_ITEMS: joi_1.default.number().min(1).max(100).default(50),
    }),
    // Order Service
    'order-service': baseSchema
        .concat(databaseSchema)
        .concat(paymentSchema)
        .keys({
        ORDER_EXPIRY_HOURS: joi_1.default.number().min(1).max(72).default(24),
        ORDER_MAX_ITEMS: joi_1.default.number().min(1).max(100).default(50),
    }),
    // Payment Service
    'payment-service': baseSchema
        .concat(databaseSchema)
        .concat(paymentSchema)
        .keys({
        PAYMENT_TIMEOUT_SECONDS: joi_1.default.number().min(30).max(300).default(120),
        PAYMENT_RETRY_ATTEMPTS: joi_1.default.number().min(1).max(5).default(3),
    }),
    // Notification Service
    'notification-service': baseSchema
        .concat(databaseSchema)
        .concat(communicationSchema)
        .keys({
        NOTIFICATION_QUEUE_SIZE: joi_1.default.number().min(100).max(10000).default(1000),
        NOTIFICATION_RETRY_ATTEMPTS: joi_1.default.number().min(1).max(10).default(3),
    }),
    // Search Service
    'search-service': baseSchema.concat(databaseSchema).keys({
        ELASTICSEARCH_HOST: joi_1.default.string().required(),
        ELASTICSEARCH_PORT: joi_1.default.number().port().default(9200),
        ELASTICSEARCH_USERNAME: joi_1.default.string().default('elastic'),
        ELASTICSEARCH_PASSWORD: joi_1.default.string().required(),
        SEARCH_RESULTS_LIMIT: joi_1.default.number().min(10).max(100).default(20),
    }),
    // File Service
    'file-service': baseSchema.concat(databaseSchema).keys({
        FILE_STORAGE_TYPE: joi_1.default.string().valid('local', 's3', 'minio').default('local'),
        FILE_MAX_SIZE: joi_1.default.number().min(1048576).max(104857600).default(10485760), // 1MB - 100MB
        ALLOWED_FILE_TYPES: joi_1.default.string().default('jpg,jpeg,png,gif,pdf,doc,docx'),
        // S3 Configuration
        AWS_ACCESS_KEY_ID: joi_1.default.when('FILE_STORAGE_TYPE', {
            is: 's3',
            then: joi_1.default.string().required(),
            otherwise: joi_1.default.string().optional(),
        }),
        AWS_SECRET_ACCESS_KEY: joi_1.default.when('FILE_STORAGE_TYPE', {
            is: 's3',
            then: joi_1.default.string().required(),
            otherwise: joi_1.default.string().optional(),
        }),
        AWS_REGION: joi_1.default.when('FILE_STORAGE_TYPE', {
            is: 's3',
            then: joi_1.default.string().required(),
            otherwise: joi_1.default.string().optional(),
        }),
        AWS_S3_BUCKET: joi_1.default.when('FILE_STORAGE_TYPE', {
            is: 's3',
            then: joi_1.default.string().required(),
            otherwise: joi_1.default.string().optional(),
        }),
        // MinIO Configuration
        MINIO_ENDPOINT: joi_1.default.when('FILE_STORAGE_TYPE', {
            is: 'minio',
            then: joi_1.default.string().required(),
            otherwise: joi_1.default.string().optional(),
        }),
        MINIO_ACCESS_KEY: joi_1.default.when('FILE_STORAGE_TYPE', {
            is: 'minio',
            then: joi_1.default.string().required(),
            otherwise: joi_1.default.string().optional(),
        }),
        MINIO_SECRET_KEY: joi_1.default.when('FILE_STORAGE_TYPE', {
            is: 'minio',
            then: joi_1.default.string().required(),
            otherwise: joi_1.default.string().optional(),
        }),
    }),
    // API Gateway
    'api-gateway': baseSchema.keys({
        RATE_LIMIT_WINDOW_MS: joi_1.default.number().min(60000).max(3600000).default(900000), // 1min - 1hour
        RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().min(10).max(10000).default(100),
        CORS_ORIGIN: joi_1.default.string().required(),
        CORS_METHODS: joi_1.default.string().default('GET,POST,PUT,DELETE,OPTIONS'),
        CORS_HEADERS: joi_1.default.string().default('Content-Type,Authorization,X-Requested-With'),
        // Service URLs
        AUTH_SERVICE_URL: joi_1.default.string().uri().required(),
        USER_SERVICE_URL: joi_1.default.string().uri().required(),
        PRODUCT_SERVICE_URL: joi_1.default.string().uri().required(),
        CART_SERVICE_URL: joi_1.default.string().uri().required(),
        ORDER_SERVICE_URL: joi_1.default.string().uri().required(),
        PAYMENT_SERVICE_URL: joi_1.default.string().uri().required(),
        NOTIFICATION_SERVICE_URL: joi_1.default.string().uri().required(),
        SEARCH_SERVICE_URL: joi_1.default.string().uri().required(),
        FILE_SERVICE_URL: joi_1.default.string().uri().required(),
    }),
};
// Environment validation function
function validateEnvironment(serviceName, customSchema) {
    try {
        const schema = customSchema || exports.serviceSchemas[serviceName];
        if (!schema) {
            logger_1.logger.warn(`No validation schema found for service: ${serviceName}`);
            return;
        }
        const { error, value } = schema.validate(process.env, {
            allowUnknown: true,
            abortEarly: false,
            stripUnknown: false,
        });
        if (error) {
            const errorMessages = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
            }));
            logger_1.logger.error('Environment validation failed', {
                service: serviceName,
                errors: errorMessages,
            });
            console.error('\n🚨 Environment Validation Errors:');
            console.error('=====================================');
            errorMessages.forEach(({ field, message, value }) => {
                console.error(`❌ ${field}: ${message}`);
                if (value !== undefined) {
                    console.error(`   Current value: ${value}`);
                }
            });
            console.error('=====================================\n');
            process.exit(1);
        }
        // Update process.env with validated values
        Object.assign(process.env, value);
        logger_1.logger.info('Environment validation passed', {
            service: serviceName,
            environment: process.env.NODE_ENV,
            validatedFields: Object.keys(value).length,
        });
    }
    catch (validationError) {
        logger_1.logger.error('Environment validation error', {
            service: serviceName,
            error: validationError instanceof Error ? validationError.message : 'Unknown error',
        });
        console.error('\n🚨 Environment Validation System Error:');
        console.error('======================================');
        console.error(validationError);
        console.error('======================================\n');
        process.exit(1);
    }
}
// Production environment checker
function checkProductionSecurity() {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }
    const securityChecks = [
        {
            name: 'Default passwords',
            check: () => {
                const defaultPasswords = [
                    'password',
                    'admin',
                    '123456',
                    'ultramarket123',
                    'CHANGE_ME_IN_PRODUCTION',
                ];
                const envVars = Object.entries(process.env);
                const violations = envVars.filter(([key, value]) => key.toLowerCase().includes('password') &&
                    defaultPasswords.some((defaultPwd) => value?.includes(defaultPwd)));
                return violations.length === 0;
            },
        },
        {
            name: 'Strong JWT secrets',
            check: () => {
                const jwtSecret = process.env.JWT_SECRET;
                const refreshSecret = process.env.JWT_REFRESH_SECRET;
                return jwtSecret && jwtSecret.length >= 32 && refreshSecret && refreshSecret.length >= 32;
            },
        },
        {
            name: 'SSL/TLS enabled',
            check: () => {
                return process.env.POSTGRES_SSL === 'true' || process.env.POSTGRES_SSL === 'require';
            },
        },
        {
            name: 'Secure log level',
            check: () => {
                const logLevel = process.env.LOG_LEVEL;
                return logLevel === 'warn' || logLevel === 'error';
            },
        },
    ];
    const failedChecks = securityChecks.filter((check) => !check.check());
    if (failedChecks.length > 0) {
        logger_1.logger.error('Production security checks failed', {
            failedChecks: failedChecks.map((check) => check.name),
        });
        console.error('\n🚨 Production Security Violations:');
        console.error('==================================');
        failedChecks.forEach((check) => {
            console.error(`❌ ${check.name}`);
        });
        console.error('==================================\n');
        process.exit(1);
    }
    logger_1.logger.info('Production security checks passed');
}
// Helper function to generate strong secrets
function generateSecureSecret(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
}
//# sourceMappingURL=environment.js.map