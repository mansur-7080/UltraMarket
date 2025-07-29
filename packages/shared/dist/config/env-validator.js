"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.EnvironmentValidationError = void 0;
exports.validateEnvironment = validateEnvironment;
exports.checkProductionReadiness = checkProductionReadiness;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'staging', 'test').default('development'),
    PORT: joi_1.default.number().port().default(3000),
    // Database - Required
    DATABASE_URL: joi_1.default.string().uri().required(),
    POSTGRES_HOST: joi_1.default.string().hostname().required(),
    POSTGRES_PORT: joi_1.default.number().port().default(5432),
    POSTGRES_DB: joi_1.default.string().min(1).required(),
    POSTGRES_USER: joi_1.default.string().min(1).required(),
    POSTGRES_PASSWORD: joi_1.default.string().min(8).required(),
    // MongoDB - Required
    MONGODB_URI: joi_1.default.string().uri().required(),
    MONGODB_DB: joi_1.default.string().min(1).required(),
    // Redis - Required
    REDIS_HOST: joi_1.default.string().hostname().required(),
    REDIS_PORT: joi_1.default.number().port().default(6379),
    REDIS_PASSWORD: joi_1.default.string().allow(''),
    REDIS_DB: joi_1.default.number().min(0).max(15).default(0),
    // JWT - Required and must be secure
    JWT_SECRET: joi_1.default.string().min(32).required(),
    JWT_REFRESH_SECRET: joi_1.default.string().min(32).required(),
    JWT_ACCESS_EXPIRES_IN: joi_1.default.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d'),
    // Payment Gateways - Optional but recommended for production
    CLICK_SERVICE_ID: joi_1.default.string().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    CLICK_MERCHANT_ID: joi_1.default.string().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    CLICK_SECRET_KEY: joi_1.default.string().min(16).when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    PAYME_MERCHANT_ID: joi_1.default.string().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    PAYME_SECRET_KEY: joi_1.default.string().min(16).when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    APELSIN_MERCHANT_ID: joi_1.default.string().optional(),
    APELSIN_SECRET_KEY: joi_1.default.string().min(16).optional(),
    // Email - Required
    EMAIL_HOST: joi_1.default.string().hostname().required(),
    EMAIL_PORT: joi_1.default.number().port().default(587),
    EMAIL_SECURE: joi_1.default.boolean().default(false),
    EMAIL_USER: joi_1.default.string().email().required(),
    EMAIL_PASS: joi_1.default.string().min(8).required(),
    EMAIL_FROM: joi_1.default.string().email().required(),
    // SMS Services - Optional
    ESKIZ_API_KEY: joi_1.default.string().optional(),
    PLAYMOBILE_API_KEY: joi_1.default.string().optional(),
    // Security
    CORS_ORIGIN: joi_1.default.string().default('*'),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().min(1000).default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().min(1).default(100),
    // Monitoring
    SENTRY_DSN: joi_1.default.string().uri().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    // Service
    SERVICE_NAME: joi_1.default.string().default('ultramarket-service'),
    APP_VERSION: joi_1.default.string().default('1.0.0')
});
class EnvironmentValidationError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'EnvironmentValidationError';
    }
}
exports.EnvironmentValidationError = EnvironmentValidationError;
function validateEnvironment() {
    const { error, value } = envSchema.validate(process.env, {
        allowUnknown: true,
        stripUnknown: false
    });
    if (error) {
        const errorMessage = `Environment validation failed: ${error.details.map(d => d.message).join(', ')}`;
        throw new EnvironmentValidationError(errorMessage, error);
    }
    return value;
}
function checkProductionReadiness() {
    const missingConfigs = [];
    const recommendations = [];
    try {
        const config = validateEnvironment();
        if (config.NODE_ENV === 'production') {
            // Check critical production configs
            if (!config.SENTRY_DSN) {
                missingConfigs.push('SENTRY_DSN - Error monitoring required');
            }
            if (!config.CLICK_SECRET_KEY && !config.PAYME_SECRET_KEY) {
                missingConfigs.push('Payment gateway credentials - At least one payment provider required');
            }
            if (config.JWT_SECRET.length < 64) {
                recommendations.push('JWT_SECRET should be at least 64 characters for production');
            }
            if (config.JWT_REFRESH_SECRET.length < 64) {
                recommendations.push('JWT_REFRESH_SECRET should be at least 64 characters for production');
            }
            if (config.CORS_ORIGIN === '*') {
                recommendations.push('CORS_ORIGIN should be specific domains in production');
            }
            if (!config.REDIS_PASSWORD) {
                recommendations.push('REDIS_PASSWORD should be set for production');
            }
            if (config.LOG_LEVEL === 'debug') {
                recommendations.push('LOG_LEVEL should be "warn" or "error" in production');
            }
        }
        return {
            isReady: missingConfigs.length === 0,
            missingConfigs,
            recommendations
        };
    }
    catch (error) {
        if (error instanceof EnvironmentValidationError) {
            return {
                isReady: false,
                missingConfigs: [error.message],
                recommendations: []
            };
        }
        throw error;
    }
}
// Initialize and export validated config
let validatedConfig;
try {
    validatedConfig = validateEnvironment();
}
catch (error) {
    if (error instanceof EnvironmentValidationError) {
        console.error('❌ Environment validation failed:');
        console.error(error.message);
        console.error('\nPlease check your .env file and ensure all required variables are set.');
        process.exit(1);
    }
    throw error;
}
exports.env = validatedConfig;
// Production readiness check on startup
if (process.env.NODE_ENV === 'production') {
    const { isReady, missingConfigs, recommendations } = checkProductionReadiness();
    if (!isReady) {
        console.error('❌ Production readiness check failed:');
        missingConfigs.forEach(config => console.error(`  - ${config}`));
        process.exit(1);
    }
    if (recommendations.length > 0) {
        console.warn('⚠️  Production recommendations:');
        recommendations.forEach(rec => console.warn(`  - ${rec}`));
    }
    console.log('✅ Production environment validation passed');
}
//# sourceMappingURL=env-validator.js.map