"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../utils/logger");
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().port().default(3002),
    DATABASE_URL: joi_1.default.string().uri().required().description('PostgreSQL database URL'),
    REDIS_URL: joi_1.default.string().uri().required().description('Redis URL'),
    JWT_SECRET: joi_1.default.string().min(32).required().description('JWT secret key'),
    JWT_EXPIRES_IN: joi_1.default.string().default('15m').description('JWT access token expiration'),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d').description('JWT refresh token expiration'),
    ALLOWED_ORIGINS: joi_1.default.string()
        .default('http://localhost:3000')
        .description('Allowed CORS origins'),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    SMTP_HOST: joi_1.default.string().hostname().optional().description('SMTP host'),
    SMTP_PORT: joi_1.default.number().port().optional().description('SMTP port'),
    SMTP_USER: joi_1.default.string().email().optional().description('SMTP username'),
    SMTP_PASS: joi_1.default.string().optional().description('SMTP password'),
    MAX_FILE_SIZE: joi_1.default.number()
        .positive()
        .default(10485760)
        .description('Maximum file size in bytes'),
    UPLOAD_PATH: joi_1.default.string().default('./uploads').description('File upload path'),
    BCRYPT_ROUNDS: joi_1.default.number()
        .integer()
        .min(10)
        .max(15)
        .default(12)
        .description('Bcrypt hash rounds'),
    RATE_LIMIT_WINDOW: joi_1.default.number()
        .positive()
        .default(900000)
        .description('Rate limit window in milliseconds'),
    RATE_LIMIT_MAX: joi_1.default.number().positive().default(100).description('Maximum requests per window'),
    AUTH_SERVICE_URL: joi_1.default.string().uri().optional().description('Auth service URL'),
    PRODUCT_SERVICE_URL: joi_1.default.string().uri().optional().description('Product service URL'),
    ORDER_SERVICE_URL: joi_1.default.string().uri().optional().description('Order service URL'),
}).unknown();
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
    Object.assign(process.env, value);
    logger_1.logger.info('✅ Environment validation passed');
    return value;
};
exports.validateEnv = validateEnv;
//# sourceMappingURL=env.validation.js.map