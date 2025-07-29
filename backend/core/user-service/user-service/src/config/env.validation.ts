import Joi from 'joi';
import { logger } from '../utils/logger';

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().port().default(3002),

  DATABASE_URL: Joi.string().uri().required().description('PostgreSQL database URL'),

  REDIS_URL: Joi.string().uri().required().description('Redis URL'),

  JWT_SECRET: Joi.string().min(32).required().description('JWT secret key'),

  JWT_EXPIRES_IN: Joi.string().default('15m').description('JWT access token expiration'),

  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d').description('JWT refresh token expiration'),

  ALLOWED_ORIGINS: Joi.string()
    .default('http://localhost:3000')
    .description('Allowed CORS origins'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Email configuration
  SMTP_HOST: Joi.string().hostname().optional().description('SMTP host'),

  SMTP_PORT: Joi.number().port().optional().description('SMTP port'),

  SMTP_USER: Joi.string().email().optional().description('SMTP username'),

  SMTP_PASS: Joi.string().optional().description('SMTP password'),

  // File upload configuration
  MAX_FILE_SIZE: Joi.number()
    .positive()
    .default(10485760) // 10MB
    .description('Maximum file size in bytes'),

  UPLOAD_PATH: Joi.string().default('./uploads').description('File upload path'),

  // Security configuration
  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12)
    .description('Bcrypt hash rounds'),

  RATE_LIMIT_WINDOW: Joi.number()
    .positive()
    .default(900000) // 15 minutes
    .description('Rate limit window in milliseconds'),

  RATE_LIMIT_MAX: Joi.number().positive().default(100).description('Maximum requests per window'),

  // Service URLs
  AUTH_SERVICE_URL: Joi.string().uri().optional().description('Auth service URL'),

  PRODUCT_SERVICE_URL: Joi.string().uri().optional().description('Product service URL'),

  ORDER_SERVICE_URL: Joi.string().uri().optional().description('Order service URL'),
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
