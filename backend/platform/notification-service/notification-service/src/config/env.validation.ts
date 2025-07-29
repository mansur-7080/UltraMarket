import joi from 'joi';

const envSchema = joi
  .object({
    NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
    PORT: joi.number().default(3008),

    // Database
    DATABASE_URL: joi.string().required(),

    // JWT
    JWT_SECRET: joi.string().required(),

    // Email Configuration
    SMTP_HOST: joi.string().required(),
    SMTP_PORT: joi.number().default(587),
    SMTP_USER: joi.string().required(),
    SMTP_PASSWORD: joi.string().required(),
    SMTP_FROM: joi.string().email().required(),

    // SMS Configuration - Uzbekistan providers
    ESKIZ_API_KEY: joi.string().optional(),
    ESKIZ_SENDER: joi.string().optional(),
    PLAY_MOBILE_API_KEY: joi.string().optional(),
    PLAY_MOBILE_SENDER: joi.string().optional(),
    UCELL_API_KEY: joi.string().optional(),
    UCELL_SENDER: joi.string().optional(),
    BEELINE_API_KEY: joi.string().optional(),
    BEELINE_SENDER: joi.string().optional(),

    // Push Notification Configuration
    FCM_SERVER_KEY: joi.string().optional(),
    APNS_KEY_ID: joi.string().optional(),
    APNS_TEAM_ID: joi.string().optional(),
    APNS_BUNDLE_ID: joi.string().optional(),
    APNS_PRIVATE_KEY: joi.string().optional(),

    // Redis Configuration
    REDIS_URL: joi.string().optional(),
    REDIS_HOST: joi.string().default('localhost'),
    REDIS_PORT: joi.number().default(6379),
    REDIS_PASSWORD: joi.string().optional(),

    // RabbitMQ Configuration
    RABBITMQ_URL: joi.string().optional(),
    RABBITMQ_HOST: joi.string().default('localhost'),
    RABBITMQ_PORT: joi.number().default(5672),
    RABBITMQ_USER: joi.string().default('guest'),
    RABBITMQ_PASSWORD: joi.string().default('guest'),

    // Logging
    LOG_LEVEL: joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: joi.number().default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: joi.number().default(100),

    // Health Check
    HEALTH_CHECK_TIMEOUT: joi.number().default(5000),
  })
  .unknown();

export const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env);

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
};
