"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
const joi_1 = __importDefault(require("joi"));
const envSchema = joi_1.default
    .object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().default(3008),
    // Database
    DATABASE_URL: joi_1.default.string().required(),
    // JWT
    JWT_SECRET: joi_1.default.string().required(),
    // Email Configuration
    SMTP_HOST: joi_1.default.string().required(),
    SMTP_PORT: joi_1.default.number().default(587),
    SMTP_USER: joi_1.default.string().required(),
    SMTP_PASSWORD: joi_1.default.string().required(),
    SMTP_FROM: joi_1.default.string().email().required(),
    // SMS Configuration - Uzbekistan providers
    ESKIZ_API_KEY: joi_1.default.string().optional(),
    ESKIZ_SENDER: joi_1.default.string().optional(),
    PLAY_MOBILE_API_KEY: joi_1.default.string().optional(),
    PLAY_MOBILE_SENDER: joi_1.default.string().optional(),
    UCELL_API_KEY: joi_1.default.string().optional(),
    UCELL_SENDER: joi_1.default.string().optional(),
    BEELINE_API_KEY: joi_1.default.string().optional(),
    BEELINE_SENDER: joi_1.default.string().optional(),
    // Push Notification Configuration
    FCM_SERVER_KEY: joi_1.default.string().optional(),
    APNS_KEY_ID: joi_1.default.string().optional(),
    APNS_TEAM_ID: joi_1.default.string().optional(),
    APNS_BUNDLE_ID: joi_1.default.string().optional(),
    APNS_PRIVATE_KEY: joi_1.default.string().optional(),
    // Redis Configuration
    REDIS_URL: joi_1.default.string().optional(),
    REDIS_HOST: joi_1.default.string().default('localhost'),
    REDIS_PORT: joi_1.default.number().default(6379),
    REDIS_PASSWORD: joi_1.default.string().optional(),
    // RabbitMQ Configuration
    RABBITMQ_URL: joi_1.default.string().optional(),
    RABBITMQ_HOST: joi_1.default.string().default('localhost'),
    RABBITMQ_PORT: joi_1.default.number().default(5672),
    RABBITMQ_USER: joi_1.default.string().default('guest'),
    RABBITMQ_PASSWORD: joi_1.default.string().default('guest'),
    // Logging
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().default(100),
    // Health Check
    HEALTH_CHECK_TIMEOUT: joi_1.default.number().default(5000),
})
    .unknown();
const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env);
    if (error) {
        throw new Error(`Environment validation error: ${error.message}`);
    }
    return value;
};
exports.validateEnv = validateEnv;
//# sourceMappingURL=env.validation.js.map