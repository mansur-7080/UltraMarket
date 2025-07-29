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
    PORT: joi_1.default.number().port().default(3004),
    ALLOWED_ORIGINS: joi_1.default.string()
        .default('http://localhost:3000')
        .description('Allowed CORS origins'),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    REDIS_URL: joi_1.default.string().uri().optional().description('Redis connection URL'),
    REDIS_HOST: joi_1.default.string().hostname().default('localhost').description('Redis host'),
    REDIS_PORT: joi_1.default.number().port().default(6379).description('Redis port'),
    REDIS_PASSWORD: joi_1.default.string().optional().description('Redis password'),
    REDIS_DB: joi_1.default.number().integer().min(0).max(15).default(0).description('Redis database number'),
    CART_TTL: joi_1.default.number()
        .positive()
        .default(604800)
        .description('Cart TTL in seconds'),
    SESSION_TTL: joi_1.default.number()
        .positive()
        .default(1800)
        .description('Session TTL in seconds'),
    PRODUCT_SERVICE_URL: joi_1.default.string()
        .uri()
        .default('http://localhost:3003')
        .description('Product service URL'),
    USER_SERVICE_URL: joi_1.default.string()
        .uri()
        .default('http://localhost:3001')
        .description('User service URL'),
    TAX_RATE: joi_1.default.number()
        .min(0)
        .max(1)
        .default(0.12)
        .description('Tax rate'),
    FREE_SHIPPING_THRESHOLD: joi_1.default.number()
        .positive()
        .default(500000)
        .description('Free shipping threshold'),
    SHIPPING_COST: joi_1.default.number()
        .positive()
        .default(25000)
        .description('Standard shipping cost'),
    DEFAULT_CURRENCY: joi_1.default.string()
        .length(3)
        .uppercase()
        .default('UZS')
        .description('Default currency code'),
    RATE_LIMIT_WINDOW: joi_1.default.number()
        .positive()
        .default(900000)
        .description('Rate limit window in milliseconds'),
    RATE_LIMIT_MAX: joi_1.default.number().positive().default(2000).description('Maximum requests per window'),
    MAX_CART_ITEMS: joi_1.default.number().positive().default(100).description('Maximum items per cart'),
    MAX_ITEM_QUANTITY: joi_1.default.number().positive().default(50).description('Maximum quantity per item'),
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