import Joi from 'joi';
import { logger } from '../utils/logger';

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().port().default(3003),

  MONGODB_URI: Joi.string().uri().required().description('MongoDB connection URI'),

  ALLOWED_ORIGINS: Joi.string()
    .default('http://localhost:3000')
    .description('Allowed CORS origins'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // JWT configuration
  JWT_SECRET: Joi.string().min(32).required().description('JWT secret key'),

  JWT_EXPIRES_IN: Joi.string().default('15m').description('JWT access token expiration'),

  // File upload configuration
  MAX_FILE_SIZE: Joi.number()
    .positive()
    .default(10485760) // 10MB
    .description('Maximum file size in bytes'),

  UPLOAD_PATH: Joi.string().default('./uploads').description('File upload path'),

  // Image processing
  IMAGE_QUALITY: Joi.number().min(1).max(100).default(80).description('Image compression quality'),

  // Cache configuration
  REDIS_URL: Joi.string().uri().optional().description('Redis URL for caching'),

  CACHE_TTL: Joi.number()
    .positive()
    .default(3600) // 1 hour
    .description('Cache TTL in seconds'),

  // Search configuration
  ELASTICSEARCH_URL: Joi.string().uri().optional().description('Elasticsearch URL for search'),

  // External service URLs
  USER_SERVICE_URL: Joi.string().uri().optional().description('User service URL'),

  ORDER_SERVICE_URL: Joi.string().uri().optional().description('Order service URL'),

  // Currency and localization
  DEFAULT_CURRENCY: Joi.string()
    .length(3)
    .uppercase()
    .default('UZS')
    .description('Default currency code'),

  DEFAULT_LOCALE: Joi.string().default('uz-UZ').description('Default locale'),

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
