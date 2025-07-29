"use strict";
/**
 * 🔒 Professional Environment Validation System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha environment variables ni professional tarzda validate qiladi
 * va production-ready konfiguratsiyani ta'minlaydi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.environmentValidator = exports.ProfessionalEnvironmentValidator = exports.EnvironmentValidationError = exports.SecretGenerator = void 0;
exports.validateUltraMarketEnvironment = validateUltraMarketEnvironment;
exports.generateAndSaveSecrets = generateAndSaveSecrets;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
const crypto_1 = tslib_1.__importDefault(require("crypto"));
/**
 * 🛡️ Strong Secret Generator
 */
class SecretGenerator {
    static generateStrongSecret(length = 64) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    static generateJWTSecret() {
        return this.generateStrongSecret(32);
    }
    static generateEncryptionKey() {
        return this.generateStrongSecret(32);
    }
    static isSecretStrong(secret) {
        return secret.length >= 32 && /^[a-f0-9]+$/i.test(secret);
    }
}
exports.SecretGenerator = SecretGenerator;
/**
 * 🔍 Professional Environment Schema
 */
const professionalEnvSchema = joi_1.default.object({
    // Core Application
    NODE_ENV: joi_1.default.string()
        .valid('development', 'production', 'staging', 'test')
        .default('development'),
    PORT: joi_1.default.number().port().default(3000),
    APP_NAME: joi_1.default.string().default('UltraMarket'),
    APP_URL: joi_1.default.string().uri().required(),
    API_VERSION: joi_1.default.string().default('v1'),
    // Security & Authentication - KRITIK!
    JWT_ACCESS_SECRET: joi_1.default.string()
        .min(32)
        .required()
        .custom((value, helpers) => {
        if (!SecretGenerator.isSecretStrong(value)) {
            return helpers.error('any.invalid', {
                message: 'JWT_ACCESS_SECRET must be at least 32 hex characters'
            });
        }
        return value;
    })
        .messages({
        'string.min': 'JWT_ACCESS_SECRET must be at least 32 characters',
        'any.required': 'JWT_ACCESS_SECRET is required for security'
    }),
    JWT_REFRESH_SECRET: joi_1.default.string()
        .min(32)
        .required()
        .custom((value, helpers) => {
        if (!SecretGenerator.isSecretStrong(value)) {
            return helpers.error('any.invalid', {
                message: 'JWT_REFRESH_SECRET must be at least 32 hex characters'
            });
        }
        return value;
    }),
    JWT_ACCESS_EXPIRES_IN: joi_1.default.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d'),
    ENCRYPTION_KEY: joi_1.default.string()
        .length(64)
        .required()
        .custom((value, helpers) => {
        if (!SecretGenerator.isSecretStrong(value)) {
            return helpers.error('any.invalid', {
                message: 'ENCRYPTION_KEY must be exactly 64 hex characters'
            });
        }
        return value;
    }),
    SESSION_SECRET: joi_1.default.string().min(32).required(),
    COOKIE_SECRET: joi_1.default.string().min(32).required(),
    CSRF_SECRET: joi_1.default.string().min(32).required(),
    // Database - KRITIK!
    DATABASE_URL: joi_1.default.string().uri().required(),
    POSTGRES_HOST: joi_1.default.string().hostname().required(),
    POSTGRES_PORT: joi_1.default.number().port().default(5432),
    POSTGRES_DB: joi_1.default.string().min(1).required(),
    POSTGRES_USER: joi_1.default.string().min(1).required(),
    POSTGRES_PASSWORD: joi_1.default.string().min(8).required(),
    POSTGRES_SSL: joi_1.default.boolean().default(true),
    POSTGRES_POOL_MIN: joi_1.default.number().min(1).default(2),
    POSTGRES_POOL_MAX: joi_1.default.number().min(5).default(20),
    // MongoDB
    MONGODB_URI: joi_1.default.string().uri().required(),
    MONGODB_DB: joi_1.default.string().min(1).required(),
    MONGODB_USER: joi_1.default.string().min(1).required(),
    MONGODB_PASSWORD: joi_1.default.string().min(8).required(),
    // Redis
    REDIS_HOST: joi_1.default.string().hostname().required(),
    REDIS_PORT: joi_1.default.number().port().default(6379),
    REDIS_PASSWORD: joi_1.default.string().min(8).required(),
    REDIS_DB: joi_1.default.number().min(0).max(15).default(0),
    REDIS_TTL: joi_1.default.number().min(60).default(3600),
    // Payment Gateways - Production da MAJBURIY
    CLICK_MERCHANT_ID: joi_1.default.string().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    CLICK_SERVICE_ID: joi_1.default.string().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    CLICK_SECRET_KEY: joi_1.default.string().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required().min(32),
        otherwise: joi_1.default.optional()
    }),
    CLICK_API_URL: joi_1.default.string().uri().default('https://api.click.uz/v2'),
    PAYME_MERCHANT_ID: joi_1.default.string().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    PAYME_SECRET_KEY: joi_1.default.string().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required().min(32),
        otherwise: joi_1.default.optional()
    }),
    PAYME_API_URL: joi_1.default.string().uri().default('https://checkout.paycom.uz/api'),
    // SMS Services
    ESKIZ_API_URL: joi_1.default.string().uri().default('https://notify.eskiz.uz/api'),
    ESKIZ_EMAIL: joi_1.default.string().email().required(),
    ESKIZ_PASSWORD: joi_1.default.string().min(8).required(),
    ESKIZ_FROM: joi_1.default.string().default('4546'),
    // Email
    SMTP_HOST: joi_1.default.string().hostname().required(),
    SMTP_PORT: joi_1.default.number().port().default(587),
    SMTP_SECURE: joi_1.default.boolean().default(false),
    SMTP_USER: joi_1.default.string().email().required(),
    SMTP_PASSWORD: joi_1.default.string().min(8).required(),
    SMTP_FROM: joi_1.default.string().email().default('noreply@ultramarket.uz'),
    // Security
    CORS_ORIGIN: joi_1.default.string().required(),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().min(60000).default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().min(10).default(100),
    BCRYPT_ROUNDS: joi_1.default.number().min(10).max(15).default(12),
    // Monitoring
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    SENTRY_DSN: joi_1.default.string().uri().when('NODE_ENV', {
        is: 'production',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    PROMETHEUS_ENABLED: joi_1.default.boolean().default(true),
    // Feature Flags
    FEATURE_RECOMMENDATIONS: joi_1.default.boolean().default(true),
    FEATURE_ANALYTICS: joi_1.default.boolean().default(true),
    FEATURE_NOTIFICATIONS: joi_1.default.boolean().default(true),
    FEATURE_REVIEWS: joi_1.default.boolean().default(true),
    FEATURE_CHAT: joi_1.default.boolean().default(false),
    // Business
    DEFAULT_LANGUAGE: joi_1.default.string().valid('uz', 'ru', 'en').default('uz'),
    DEFAULT_CURRENCY: joi_1.default.string().valid('UZS', 'USD').default('UZS'),
    TAX_RATE: joi_1.default.number().min(0).max(1).default(0.12),
    SHIPPING_COST: joi_1.default.number().min(0).default(50000),
    FREE_SHIPPING_THRESHOLD: joi_1.default.number().min(0).default(1000000),
});
/**
 * 🚨 Critical Validation Errors
 */
class EnvironmentValidationError extends Error {
    errors;
    severity;
    constructor(message, errors, severity = 'CRITICAL') {
        super(message);
        this.errors = errors;
        this.severity = severity;
        this.name = 'EnvironmentValidationError';
    }
}
exports.EnvironmentValidationError = EnvironmentValidationError;
/**
 * 🔧 Professional Environment Validator
 */
class ProfessionalEnvironmentValidator {
    config = null;
    validationErrors = [];
    validationWarnings = [];
    /**
     * Validate environment variables
     */
    validateEnvironment() {
        const { error, value } = professionalEnvSchema.validate(process.env, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });
        if (error) {
            const errors = error.details.map(detail => {
                const field = detail.path.join('.');
                const message = detail.message;
                return `${field}: ${message}`;
            });
            this.validationErrors = errors;
            throw new EnvironmentValidationError('Environment validation failed', errors, 'CRITICAL');
        }
        this.config = value;
        this.performSecurityChecks();
        return this.config;
    }
    /**
     * Perform additional security checks
     */
    performSecurityChecks() {
        if (!this.config)
            return;
        const warnings = [];
        // Production security checks
        if (this.config.NODE_ENV === 'production') {
            if (!this.config.POSTGRES_SSL) {
                warnings.push('POSTGRES_SSL should be true in production');
            }
            if (this.config.LOG_LEVEL === 'debug') {
                warnings.push('LOG_LEVEL should not be debug in production');
            }
            if (this.config.CORS_ORIGIN.includes('localhost')) {
                warnings.push('CORS_ORIGIN should not include localhost in production');
            }
            if (!this.config.SENTRY_DSN) {
                warnings.push('SENTRY_DSN is recommended for production monitoring');
            }
            // Check for weak secrets
            if (this.config.JWT_ACCESS_SECRET.includes('dev_') ||
                this.config.JWT_ACCESS_SECRET.includes('test_')) {
                warnings.push('JWT_ACCESS_SECRET appears to be a development secret');
            }
        }
        // Check for default passwords
        const defaultPasswords = ['password', 'admin', 'secret', '123456'];
        defaultPasswords.forEach(defaultPass => {
            if (this.config.POSTGRES_PASSWORD.toLowerCase().includes(defaultPass)) {
                warnings.push('POSTGRES_PASSWORD appears to use a default/weak password');
            }
        });
        this.validationWarnings = warnings;
        if (warnings.length > 0) {
            console.warn('🟡 Environment validation warnings:');
            warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
        }
    }
    /**
     * Get validated configuration
     */
    getConfig() {
        if (!this.config) {
            throw new Error('Environment not validated. Call validateEnvironment() first.');
        }
        return this.config;
    }
    /**
     * Generate missing secrets
     */
    generateMissingSecrets() {
        const missingSecrets = {};
        if (!process.env.JWT_ACCESS_SECRET) {
            missingSecrets.JWT_ACCESS_SECRET = SecretGenerator.generateJWTSecret();
        }
        if (!process.env.JWT_REFRESH_SECRET) {
            missingSecrets.JWT_REFRESH_SECRET = SecretGenerator.generateJWTSecret();
        }
        if (!process.env.ENCRYPTION_KEY) {
            missingSecrets.ENCRYPTION_KEY = SecretGenerator.generateEncryptionKey();
        }
        if (!process.env.SESSION_SECRET) {
            missingSecrets.SESSION_SECRET = SecretGenerator.generateStrongSecret();
        }
        if (!process.env.COOKIE_SECRET) {
            missingSecrets.COOKIE_SECRET = SecretGenerator.generateStrongSecret();
        }
        if (!process.env.CSRF_SECRET) {
            missingSecrets.CSRF_SECRET = SecretGenerator.generateStrongSecret();
        }
        return missingSecrets;
    }
    /**
     * Production readiness check
     */
    checkProductionReadiness() {
        const criticalIssues = [];
        const warnings = [];
        try {
            this.validateEnvironment();
        }
        catch (error) {
            if (error instanceof EnvironmentValidationError) {
                criticalIssues.push(...error.errors);
            }
        }
        warnings.push(...this.validationWarnings);
        return {
            isReady: criticalIssues.length === 0,
            criticalIssues,
            warnings
        };
    }
}
exports.ProfessionalEnvironmentValidator = ProfessionalEnvironmentValidator;
/**
 * 🌟 Global Validator Instance
 */
exports.environmentValidator = new ProfessionalEnvironmentValidator();
/**
 * 🚀 Quick validation function
 */
function validateUltraMarketEnvironment() {
    return exports.environmentValidator.validateEnvironment();
}
/**
 * 🔑 Generate and save secrets to .env file
 */
function generateAndSaveSecrets(envFilePath = '.env') {
    const fs = require('fs');
    const path = require('path');
    const missingSecrets = exports.environmentValidator.generateMissingSecrets();
    if (Object.keys(missingSecrets).length === 0) {
        console.log('✅ All secrets are already configured');
        return;
    }
    let envContent = '';
    if (fs.existsSync(envFilePath)) {
        envContent = fs.readFileSync(envFilePath, 'utf8');
    }
    Object.entries(missingSecrets).forEach(([key, value]) => {
        if (!envContent.includes(`${key}=`)) {
            envContent += `\n${key}=${value}`;
            console.log(`✅ Generated ${key}`);
        }
    });
    fs.writeFileSync(envFilePath, envContent);
    console.log(`✅ Secrets saved to ${envFilePath}`);
}
exports.default = {
    ProfessionalEnvironmentValidator,
    SecretGenerator,
    environmentValidator: exports.environmentValidator,
    validateUltraMarketEnvironment,
    generateAndSaveSecrets
};
//# sourceMappingURL=professional-env-validator.js.map