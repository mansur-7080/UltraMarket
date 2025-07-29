import Joi from 'joi';
import { logger } from '../utils/logger';

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().port().default(3004),

  ALLOWED_ORIGINS: Joi.string()
    .default('http://localhost:3000')
    .description('Allowed CORS origins'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Redis configuration
  REDIS_URL: Joi.string().uri().optional().description('Redis connection URL'),

  REDIS_HOST: Joi.string().hostname().default('localhost').description('Redis host'),

  REDIS_PORT: Joi.number().port().default(6379).description('Redis port'),

  REDIS_PASSWORD: Joi.string().optional().description('Redis password'),

  REDIS_DB: Joi.number().integer().min(0).max(15).default(0).description('Redis database number'),

  // Cache configuration
  CART_TTL: Joi.number()
    .positive()
    .default(604800) // 7 days
    .description('Cart TTL in seconds'),

  SESSION_TTL: Joi.number()
    .positive()
    .default(1800) // 30 minutes
    .description('Session TTL in seconds'),

  // External service URLs
  PRODUCT_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3003')
    .description('Product service URL'),

  USER_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3001')
    .description('User service URL'),

  // Business configuration
  TAX_RATE: Joi.number()
    .min(0)
    .max(1)
    .default(0.12) // 12% VAT in Uzbekistan
    .description('Tax rate'),

  FREE_SHIPPING_THRESHOLD: Joi.number()
    .positive()
    .default(500000) // 500,000 UZS
    .description('Free shipping threshold'),

  SHIPPING_COST: Joi.number()
    .positive()
    .default(25000) // 25,000 UZS
    .description('Standard shipping cost'),

  DEFAULT_CURRENCY: Joi.string()
    .length(3)
    .uppercase()
    .default('UZS')
    .description('Default currency code'),

  // Rate limiting
  RATE_LIMIT_WINDOW: Joi.number()
    .positive()
    .default(900000) // 15 minutes
    .description('Rate limit window in milliseconds'),

  RATE_LIMIT_MAX: Joi.number().positive().default(2000).description('Maximum requests per window'),

  // Cart limits
  MAX_CART_ITEMS: Joi.number().positive().default(100).description('Maximum items per cart'),

  MAX_ITEM_QUANTITY: Joi.number().positive().default(50).description('Maximum quantity per item'),
}).unknown();

// Validate environment variables
export const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env);

  if (error) {
    logger.error('Environment validation failed:', {
      error: error.details.map((detail) => ({
        key: detail.path.join('.'),
        message: detail.message,
      })),
    });
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  // Update process.env with validated values
  Object.assign(process.env, value);

  logger.info('✅ Environment validation passed');
  return value;
};
