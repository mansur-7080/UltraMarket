import Joi from 'joi';
import { logger } from '../utils/logger';

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().port().default(3005),

  ALLOWED_ORIGINS: Joi.string()
    .default('http://localhost:3000')
    .description('Allowed CORS origins'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Database configuration
  DATABASE_URL: Joi.string().uri().required().description('PostgreSQL connection URL'),

  // External service URLs
  PRODUCT_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3003')
    .description('Product service URL'),

  CART_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3004')
    .description('Cart service URL'),

  USER_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3001')
    .description('User service URL'),

  PAYMENT_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3006')
    .description('Payment service URL'),

  // JWT configuration
  JWT_SECRET: Joi.string().min(32).required().description('JWT secret key'),

  JWT_EXPIRES_IN: Joi.string().default('15m').description('JWT access token expiration'),

  // Payment gateway configuration
  CLICK_MERCHANT_ID: Joi.string().optional().description('Click merchant ID'),

  CLICK_SECRET_KEY: Joi.string().optional().description('Click secret key'),

  PAYME_MERCHANT_ID: Joi.string().optional().description('Payme merchant ID'),

  PAYME_SECRET_KEY: Joi.string().optional().description('Payme secret key'),

  // Business configuration
  TAX_RATE: Joi.number()
    .min(0)
    .max(1)
    .default(0.12) // 12% VAT in Uzbekistan
    .description('Tax rate'),

  SHIPPING_COST: Joi.number()
    .positive()
    .default(25000) // 25,000 UZS
    .description('Standard shipping cost'),

  FREE_SHIPPING_THRESHOLD: Joi.number()
    .positive()
    .default(500000) // 500,000 UZS
    .description('Free shipping threshold'),

  DEFAULT_CURRENCY: Joi.string()
    .length(3)
    .uppercase()
    .default('UZS')
    .description('Default currency code'),

  // Order configuration
  ORDER_EXPIRY_MINUTES: Joi.number()
    .positive()
    .default(30)
    .description('Order expiry time in minutes'),

  MAX_ORDER_ITEMS: Joi.number().positive().default(100).description('Maximum items per order'),

  // Notification configuration
  EMAIL_SERVICE_URL: Joi.string().uri().optional().description('Email service URL'),

  SMS_SERVICE_URL: Joi.string().uri().optional().description('SMS service URL'),

  // Rate limiting
  RATE_LIMIT_WINDOW: Joi.number()
    .positive()
    .default(900000) // 15 minutes
    .description('Rate limit window in milliseconds'),

  RATE_LIMIT_MAX: Joi.number().positive().default(1000).description('Maximum requests per window'),
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
