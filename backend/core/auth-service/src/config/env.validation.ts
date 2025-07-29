import { logger } from '../utils/logger';

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
  EMAIL_SERVICE: string;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  SMS_SERVICE: string;
  SMS_API_KEY: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  SESSION_SECRET: string;
  ENCRYPTION_KEY: string;
}

export function validateEnv(): EnvironmentConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const requiredVars = {
    DATABASE_URL: process.env['DATABASE_URL'],
    JWT_SECRET: process.env['JWT_SECRET'],
    JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'],
    JWT_ACCESS_SECRET: process.env['JWT_ACCESS_SECRET'],
    SESSION_SECRET: process.env['SESSION_SECRET'],
    ENCRYPTION_KEY: process.env['ENCRYPTION_KEY'],
  };

  // Check required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`${key} is required`);
    }
  });

  // Security validations
  const jwtSecrets = [
    process.env['JWT_SECRET'],
    process.env['JWT_REFRESH_SECRET'],
    process.env['JWT_ACCESS_SECRET'],
  ];

  jwtSecrets.forEach((secret, index) => {
    if (secret && secret.length < 32) {
      errors.push(`JWT secret ${index + 1} must be at least 32 characters long`);
    }
    if (secret && secret.length < 64) {
      warnings.push(`JWT secret ${index + 1} should be at least 64 characters for production`);
    }
  });

  // Environment-specific validations
  const nodeEnv = process.env['NODE_ENV'] || 'development';
  
  if (nodeEnv === 'production') {
    if (!process.env['EMAIL_SERVICE']) {
      errors.push('EMAIL_SERVICE is required in production');
    }
    if (!process.env['SMS_SERVICE']) {
      warnings.push('SMS_SERVICE is recommended in production');
    }
    if (process.env['CORS_ORIGIN']?.includes('localhost')) {
      warnings.push('CORS_ORIGIN should not include localhost in production');
    }
  }

  // Database URL validation
  const dbUrl = process.env['DATABASE_URL'];
  if (dbUrl && !dbUrl.includes('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Redis URL validation
  const redisUrl = process.env['REDIS_URL'];
  if (redisUrl && !redisUrl.startsWith('redis://')) {
    errors.push('REDIS_URL must be a valid Redis connection string');
  }

  // Port validation
  const port = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001;
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535');
  }

  // Rate limiting validation
  const rateLimitWindow = process.env['RATE_LIMIT_WINDOW_MS'] 
    ? parseInt(process.env['RATE_LIMIT_WINDOW_MS'], 10) 
    : 15 * 60 * 1000;
  
  const rateLimitMax = process.env['RATE_LIMIT_MAX_REQUESTS']
    ? parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'], 10)
    : 100;

  if (rateLimitWindow < 60000) {
    warnings.push('RATE_LIMIT_WINDOW_MS should be at least 60000ms (1 minute)');
  }

  if (rateLimitMax > 1000) {
    warnings.push('RATE_LIMIT_MAX_REQUESTS should not exceed 1000 for security');
  }

  // Log validation results
  if (warnings.length > 0) {
    logger.warn('Environment validation warnings:', { warnings });
  }

  if (errors.length > 0) {
    logger.error('Environment validation failed:', { errors });
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }

  logger.info('✅ Environment validation passed', {
    environment: nodeEnv,
    port,
    rateLimitWindow,
    rateLimitMax,
  });

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: dbUrl!,
    REDIS_URL: redisUrl || 'redis://localhost:6379',
    JWT_SECRET: process.env['JWT_SECRET']!,
    JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET']!,
    JWT_ACCESS_SECRET: process.env['JWT_ACCESS_SECRET']!,
    JWT_ACCESS_EXPIRES_IN: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
    EMAIL_SERVICE: process.env['EMAIL_SERVICE'] || '',
    EMAIL_HOST: process.env['EMAIL_HOST'] || '',
    EMAIL_PORT: process.env['EMAIL_PORT'] ? parseInt(process.env['EMAIL_PORT'], 10) : 587,
    EMAIL_USER: process.env['EMAIL_USER'] || '',
    EMAIL_PASS: process.env['EMAIL_PASS'] || '',
    SMS_SERVICE: process.env['SMS_SERVICE'] || '',
    SMS_API_KEY: process.env['SMS_API_KEY'] || '',
    RATE_LIMIT_WINDOW_MS: rateLimitWindow,
    RATE_LIMIT_MAX_REQUESTS: rateLimitMax,
    SESSION_SECRET: process.env['SESSION_SECRET']!,
    ENCRYPTION_KEY: process.env['ENCRYPTION_KEY']!,
  };
}
