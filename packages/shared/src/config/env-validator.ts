import Joi from 'joi';

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'staging' | 'test';
  PORT: number;
  
  // Database
  DATABASE_URL: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  
  // MongoDB
  MONGODB_URI: string;
  MONGODB_DB: string;
  
  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  
  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // Payment Gateways
  CLICK_SERVICE_ID?: string;
  CLICK_MERCHANT_ID?: string;
  CLICK_SECRET_KEY?: string;
  PAYME_MERCHANT_ID?: string;
  PAYME_SECRET_KEY?: string;
  APELSIN_MERCHANT_ID?: string;
  APELSIN_SECRET_KEY?: string;
  
  // Email
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_SECURE: boolean;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  EMAIL_FROM: string;
  
  // SMS Services
  ESKIZ_API_KEY?: string;
  PLAYMOBILE_API_KEY?: string;
  
  // Security
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  // Monitoring
  SENTRY_DSN?: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  
  // Service
  SERVICE_NAME: string;
  APP_VERSION: string;
}

const envSchema = Joi.object<EnvironmentConfig>({
  NODE_ENV: Joi.string().valid('development', 'production', 'staging', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  
  // Database - Required
  DATABASE_URL: Joi.string().uri().required(),
  POSTGRES_HOST: Joi.string().hostname().required(),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_DB: Joi.string().min(1).required(),
  POSTGRES_USER: Joi.string().min(1).required(),
  POSTGRES_PASSWORD: Joi.string().min(8).required(),
  
  // MongoDB - Required
  MONGODB_URI: Joi.string().uri().required(),
  MONGODB_DB: Joi.string().min(1).required(),
  
  // Redis - Required
  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow(''),
  REDIS_DB: Joi.number().min(0).max(15).default(0),
  
  // JWT - Required and must be secure
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  // Payment Gateways - Optional but recommended for production
  CLICK_SERVICE_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  CLICK_MERCHANT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  CLICK_SECRET_KEY: Joi.string().min(16).when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  PAYME_MERCHANT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  PAYME_SECRET_KEY: Joi.string().min(16).when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  APELSIN_MERCHANT_ID: Joi.string().optional(),
  APELSIN_SECRET_KEY: Joi.string().min(16).optional(),
  
  // Email - Required
  EMAIL_HOST: Joi.string().hostname().required(),
  EMAIL_PORT: Joi.number().port().default(587),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().min(8).required(),
  EMAIL_FROM: Joi.string().email().required(),
  
  // SMS Services - Optional
  ESKIZ_API_KEY: Joi.string().optional(),
  PLAYMOBILE_API_KEY: Joi.string().optional(),
  
  // Security
  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_WINDOW_MS: Joi.number().min(1000).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().min(1).default(100),
  
  // Monitoring
  SENTRY_DSN: Joi.string().uri().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // Service
  SERVICE_NAME: Joi.string().default('ultramarket-service'),
  APP_VERSION: Joi.string().default('1.0.0')
});

export class EnvironmentValidationError extends Error {
  constructor(message: string, public details: Joi.ValidationError) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

export function validateEnvironment(): EnvironmentConfig {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false
  });

  if (error) {
    const errorMessage = `Environment validation failed: ${error.details.map(d => d.message).join(', ')}`;
    throw new EnvironmentValidationError(errorMessage, error);
  }

  return value as EnvironmentConfig;
}

export function checkProductionReadiness(): {
  isReady: boolean;
  missingConfigs: string[];
  recommendations: string[];
} {
  const missingConfigs: string[] = [];
  const recommendations: string[] = [];

  try {
    const config = validateEnvironment();
    
    if (config.NODE_ENV === 'production') {
      // Check critical production configs
      if (!config.SENTRY_DSN) {
        missingConfigs.push('SENTRY_DSN - Error monitoring required');
      }
      
      if (!config.CLICK_SECRET_KEY && !config.PAYME_SECRET_KEY) {
        missingConfigs.push('Payment gateway credentials - At least one payment provider required');
      }
      
      if (config.JWT_SECRET.length < 64) {
        recommendations.push('JWT_SECRET should be at least 64 characters for production');
      }
      
      if (config.JWT_REFRESH_SECRET.length < 64) {
        recommendations.push('JWT_REFRESH_SECRET should be at least 64 characters for production');
      }
      
      if (config.CORS_ORIGIN === '*') {
        recommendations.push('CORS_ORIGIN should be specific domains in production');
      }
      
      if (!config.REDIS_PASSWORD) {
        recommendations.push('REDIS_PASSWORD should be set for production');
      }
      
      if (config.LOG_LEVEL === 'debug') {
        recommendations.push('LOG_LEVEL should be "warn" or "error" in production');
      }
    }
    
    return {
      isReady: missingConfigs.length === 0,
      missingConfigs,
      recommendations
    };
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      return {
        isReady: false,
        missingConfigs: [error.message],
        recommendations: []
      };
    }
    throw error;
  }
}

// Initialize and export validated config
let validatedConfig: EnvironmentConfig;

try {
  validatedConfig = validateEnvironment();
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  throw error;
}

export const env = validatedConfig;

// Production readiness check on startup
if (process.env.NODE_ENV === 'production') {
  const { isReady, missingConfigs, recommendations } = checkProductionReadiness();
  
  if (!isReady) {
    console.error('❌ Production readiness check failed:');
    missingConfigs.forEach(config => console.error(`  - ${config}`));
    process.exit(1);
  }
  
  if (recommendations.length > 0) {
    console.warn('⚠️  Production recommendations:');
    recommendations.forEach(rec => console.warn(`  - ${rec}`));
  }
  
  console.log('✅ Production environment validation passed');
}