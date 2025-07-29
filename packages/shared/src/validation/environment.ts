/**
 * UltraMarket Environment Validation
 * Comprehensive validation for all microservices environment variables
 */

import Joi from 'joi';

// Base environment schema
const baseEnvironmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),

  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  HOST: Joi.string().hostname().default('localhost'),

  API_VERSION: Joi.string()
    .pattern(/^v\d+$/)
    .default('v1'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').default('info'),

  CORS_ORIGIN: Joi.alternatives()
    .try(Joi.string().uri(), Joi.string().valid('*'), Joi.array().items(Joi.string().uri()))
    .default('*'),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000), // 15 minutes

  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(100),

  HEALTH_CHECK_TIMEOUT: Joi.number().integer().min(1000).default(5000),

  REQUEST_TIMEOUT: Joi.number().integer().min(1000).default(30000),
});

// Database environment schema
const databaseEnvironmentSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required().description('PostgreSQL connection string'),

  DATABASE_HOST: Joi.string().hostname().default('localhost'),

  DATABASE_PORT: Joi.number().integer().min(1).max(65535).default(5432),

  DATABASE_NAME: Joi.string().alphanum().min(1).max(63).required(),

  DATABASE_USER: Joi.string().min(1).required(),

  DATABASE_PASSWORD: Joi.string().min(1).required(),

  DATABASE_SSL: Joi.boolean().default(false),

  DATABASE_POOL_MIN: Joi.number().integer().min(0).default(2),

  DATABASE_POOL_MAX: Joi.number().integer().min(1).default(10),

  DATABASE_TIMEOUT: Joi.number().integer().min(1000).default(60000),
});

// Redis environment schema
const redisEnvironmentSchema = Joi.object({
  REDIS_URL: Joi.string().uri().optional().description('Redis connection string'),

  REDIS_HOST: Joi.string().hostname().default('localhost'),

  REDIS_PORT: Joi.number().integer().min(1).max(65535).default(6379),

  REDIS_PASSWORD: Joi.string().optional(),

  REDIS_DB: Joi.number().integer().min(0).max(15).default(0),

  REDIS_TTL: Joi.number().integer().min(1).default(3600), // 1 hour

  REDIS_MAX_RETRIES: Joi.number().integer().min(0).default(3),

  REDIS_RETRY_DELAY: Joi.number().integer().min(100).default(1000),
});

// JWT environment schema
const jwtEnvironmentSchema = Joi.object({
  JWT_SECRET: Joi.string().min(32).required().description('JWT signing secret'),

  JWT_REFRESH_SECRET: Joi.string().min(32).required().description('JWT refresh token secret'),

  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('1h'),

  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d'),

  JWT_ALGORITHM: Joi.string()
    .valid('HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512')
    .default('HS256'),

  JWT_ISSUER: Joi.string().default('ultramarket'),

  JWT_AUDIENCE: Joi.string().default('ultramarket-api'),
});

// Message Queue environment schema
const messageQueueEnvironmentSchema = Joi.object({
  RABBITMQ_URL: Joi.string().uri().required().description('RabbitMQ connection string'),

  RABBITMQ_HOST: Joi.string().hostname().default('localhost'),

  RABBITMQ_PORT: Joi.number().integer().min(1).max(65535).default(5672),

  RABBITMQ_USER: Joi.string().default('guest'),

  RABBITMQ_PASSWORD: Joi.string().default('guest'),

  RABBITMQ_VHOST: Joi.string().default('/'),

  RABBITMQ_PREFETCH: Joi.number().integer().min(1).default(10),

  RABBITMQ_RETRY_ATTEMPTS: Joi.number().integer().min(0).default(3),

  RABBITMQ_RETRY_DELAY: Joi.number().integer().min(100).default(1000),
});

// External services environment schema
const externalServicesEnvironmentSchema = Joi.object({
  // Payment gateway
  STRIPE_SECRET_KEY: Joi.string().pattern(/^sk_/).optional(),

  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  PAYPAL_CLIENT_ID: Joi.string().optional(),

  PAYPAL_CLIENT_SECRET: Joi.string().optional(),

  // Email service
  SMTP_HOST: Joi.string().hostname().optional(),

  SMTP_PORT: Joi.number().integer().valid(25, 465, 587, 2525).optional(),

  SMTP_USER: Joi.string().email().optional(),

  SMTP_PASSWORD: Joi.string().optional(),

  SMTP_FROM: Joi.string().email().optional(),

  // AWS services
  AWS_ACCESS_KEY_ID: Joi.string().optional(),

  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),

  AWS_REGION: Joi.string().optional(),

  AWS_S3_BUCKET: Joi.string().optional(),

  // Elasticsearch
  ELASTICSEARCH_URL: Joi.string().uri().optional(),

  ELASTICSEARCH_USERNAME: Joi.string().optional(),

  ELASTICSEARCH_PASSWORD: Joi.string().optional(),
});

// Service-specific schemas
export const serviceEnvironmentSchemas = {
  'auth-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(jwtEnvironmentSchema),

  'user-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema),

  'product-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema)
    .concat(
      externalServicesEnvironmentSchema.fork(
        ['ELASTICSEARCH_URL', 'ELASTICSEARCH_USERNAME', 'ELASTICSEARCH_PASSWORD'],
        (schema) => schema
      )
    ),

  'order-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema),

  'payment-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema)
    .concat(
      externalServicesEnvironmentSchema.fork(
        ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
        (schema) => schema
      )
    ),

  'cart-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema),

  'notification-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema)
    .concat(
      externalServicesEnvironmentSchema.fork(
        ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'],
        (schema) => schema
      )
    ),

  'search-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema)
    .concat(
      externalServicesEnvironmentSchema.fork(
        ['ELASTICSEARCH_URL', 'ELASTICSEARCH_USERNAME', 'ELASTICSEARCH_PASSWORD'],
        (schema) => schema
      )
    ),

  'api-gateway': baseEnvironmentSchema.concat(redisEnvironmentSchema).concat(jwtEnvironmentSchema),

  'pc-builder-service': baseEnvironmentSchema
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema),

  'dynamic-pricing-service': baseEnvironmentSchema
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema),

  'analytics-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema),

  'inventory-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema),

  'review-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema),

  'shipping-service': baseEnvironmentSchema
    .concat(databaseEnvironmentSchema)
    .concat(redisEnvironmentSchema)
    .concat(messageQueueEnvironmentSchema),
};

// Environment validation function
export function validateEnvironment(
  serviceName: string,
  env: Record<string, string | undefined> = process.env
): {
  error?: string;
  value?: Record<string, unknown>;
} {
  const schema = serviceEnvironmentSchemas[serviceName];

  if (!schema) {
    return {
      error: `Unknown service: ${serviceName}. Available services: ${Object.keys(serviceEnvironmentSchemas).join(', ')}`,
    };
  }

  const { error, value } = schema.validate(env, {
    allowUnknown: true,
    stripUnknown: false,
    abortEarly: false,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => `${detail.path.join('.')}: ${detail.message}`)
      .join(', ');

    return {
      error: `Environment validation failed for ${serviceName}: ${errorMessage}`,
    };
  }

  return { value };
}

// Environment validation middleware
export function createEnvironmentValidator(serviceName: string) {
  return (req: unknown, res: unknown, next: () => void) => {
    const { error } = validateEnvironment(serviceName);

    if (error) {
      console.error(`Environment validation error: ${error}`);
      process.exit(1);
    }

    next();
  };
}

// Validate environment on import
export function validateEnvironmentOnStartup(serviceName: string): void {
  const { error, value } = validateEnvironment(serviceName);

  if (error) {
    console.error(`🚨 Environment validation failed for ${serviceName}:`);
    console.error(error);
    process.exit(1);
  }

  console.log(`✅ Environment validation passed for ${serviceName}`);

  // Log important configuration in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Configuration:', {
      NODE_ENV: value?.NODE_ENV,
      PORT: value?.PORT,
      HOST: value?.HOST,
      API_VERSION: value?.API_VERSION,
      LOG_LEVEL: value?.LOG_LEVEL,
    });
  }
}

// Export individual schemas for testing
export {
  baseEnvironmentSchema,
  databaseEnvironmentSchema,
  redisEnvironmentSchema,
  jwtEnvironmentSchema,
  messageQueueEnvironmentSchema,
  externalServicesEnvironmentSchema,
};

// Default export
export default {
  validateEnvironment,
  validateEnvironmentOnStartup,
  createEnvironmentValidator,
  serviceEnvironmentSchemas,
};
