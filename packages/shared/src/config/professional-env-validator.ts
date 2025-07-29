/**
 * 🔒 Professional Environment Validation System
 * UltraMarket E-commerce Platform
 * 
 * Bu fayl barcha environment variables ni professional tarzda validate qiladi
 * va production-ready konfiguratsiyani ta'minlaydi
 */

import Joi from 'joi';
import crypto from 'crypto';

export interface UltraMarketEnvironmentConfig {
  // Core Application
  NODE_ENV: 'development' | 'production' | 'staging' | 'test';
  PORT: number;
  APP_NAME: string;
  APP_URL: string;
  API_VERSION: string;
  
  // Security & Authentication
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  ENCRYPTION_KEY: string;
  SESSION_SECRET: string;
  COOKIE_SECRET: string;
  CSRF_SECRET: string;
  
  // Database Connections
  DATABASE_URL: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_SSL: boolean;
  POSTGRES_POOL_MIN: number;
  POSTGRES_POOL_MAX: number;
  
  // MongoDB
  MONGODB_URI: string;
  MONGODB_DB: string;
  MONGODB_USER: string;
  MONGODB_PASSWORD: string;
  
  // Redis Cache
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_DB: number;
  REDIS_TTL: number;
  
  // Payment Gateways (Uzbekistan)
  CLICK_MERCHANT_ID: string;
  CLICK_SERVICE_ID: string;
  CLICK_SECRET_KEY: string;
  CLICK_API_URL: string;
  
  PAYME_MERCHANT_ID: string;
  PAYME_SECRET_KEY: string;
  PAYME_API_URL: string;
  
  UZCARD_MERCHANT_ID?: string;
  UZCARD_SECRET_KEY?: string;
  UZCARD_API_URL?: string;
  
  // SMS Services (Uzbekistan)
  ESKIZ_API_URL: string;
  ESKIZ_EMAIL: string;
  ESKIZ_PASSWORD: string;
  ESKIZ_FROM: string;
  
  PLAYMOBILE_API_URL?: string;
  PLAYMOBILE_LOGIN?: string;
  PLAYMOBILE_PASSWORD?: string;
  
  // Email Configuration
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;
  
  // Security & Rate Limiting
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  BCRYPT_ROUNDS: number;
  
  // Monitoring & Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  SENTRY_DSN?: string;
  PROMETHEUS_ENABLED: boolean;
  
  // Feature Flags
  FEATURE_RECOMMENDATIONS: boolean;
  FEATURE_ANALYTICS: boolean;
  FEATURE_NOTIFICATIONS: boolean;
  FEATURE_REVIEWS: boolean;
  FEATURE_CHAT: boolean;
  
  // Business Configuration
  DEFAULT_LANGUAGE: 'uz' | 'ru' | 'en';
  DEFAULT_CURRENCY: 'UZS' | 'USD';
  TAX_RATE: number;
  SHIPPING_COST: number;
  FREE_SHIPPING_THRESHOLD: number;
}

/**
 * 🛡️ Strong Secret Generator
 */
export class SecretGenerator {
  static generateStrongSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  static generateJWTSecret(): string {
    return this.generateStrongSecret(32);
  }
  
  static generateEncryptionKey(): string {
    return this.generateStrongSecret(32);
  }
  
  static isSecretStrong(secret: string): boolean {
    return secret.length >= 32 && /^[a-f0-9]+$/i.test(secret);
  }
}

/**
 * 🔍 Professional Environment Schema
 */
const professionalEnvSchema = Joi.object<UltraMarketEnvironmentConfig>({
  // Core Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  APP_NAME: Joi.string().default('UltraMarket'),
  APP_URL: Joi.string().uri().required(),
  API_VERSION: Joi.string().default('v1'),
  
  // Security & Authentication - KRITIK!
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .required()
    .custom((value, helpers) => {
      if (!SecretGenerator.isSecretStrong(value)) {
        return helpers.error('any.invalid', {
          message: 'JWT_ACCESS_SECRET must be at least 32 hex characters'
        });
      }
      return value;
    })
    .messages({
      'string.min': 'JWT_ACCESS_SECRET must be at least 32 characters',
      'any.required': 'JWT_ACCESS_SECRET is required for security'
    }),
    
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .custom((value, helpers) => {
      if (!SecretGenerator.isSecretStrong(value)) {
        return helpers.error('any.invalid', {
          message: 'JWT_REFRESH_SECRET must be at least 32 hex characters'
        });
      }
      return value;
    }),
    
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  ENCRYPTION_KEY: Joi.string()
    .length(64)
    .required()
    .custom((value, helpers) => {
      if (!SecretGenerator.isSecretStrong(value)) {
        return helpers.error('any.invalid', {
          message: 'ENCRYPTION_KEY must be exactly 64 hex characters'
        });
      }
      return value;
    }),
    
  SESSION_SECRET: Joi.string().min(32).required(),
  COOKIE_SECRET: Joi.string().min(32).required(),
  CSRF_SECRET: Joi.string().min(32).required(),
  
  // Database - KRITIK!
  DATABASE_URL: Joi.string().uri().required(),
  POSTGRES_HOST: Joi.string().hostname().required(),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_DB: Joi.string().min(1).required(),
  POSTGRES_USER: Joi.string().min(1).required(),
  POSTGRES_PASSWORD: Joi.string().min(8).required(),
  POSTGRES_SSL: Joi.boolean().default(true),
  POSTGRES_POOL_MIN: Joi.number().min(1).default(2),
  POSTGRES_POOL_MAX: Joi.number().min(5).default(20),
  
  // MongoDB
  MONGODB_URI: Joi.string().uri().required(),
  MONGODB_DB: Joi.string().min(1).required(),
  MONGODB_USER: Joi.string().min(1).required(),
  MONGODB_PASSWORD: Joi.string().min(8).required(),
  
  // Redis
  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().min(8).required(),
  REDIS_DB: Joi.number().min(0).max(15).default(0),
  REDIS_TTL: Joi.number().min(60).default(3600),
  
  // Payment Gateways - Production da MAJBURIY
  CLICK_MERCHANT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  CLICK_SERVICE_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  CLICK_SECRET_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required().min(32),
    otherwise: Joi.optional()
  }),
  CLICK_API_URL: Joi.string().uri().default('https://api.click.uz/v2'),
  
  PAYME_MERCHANT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  PAYME_SECRET_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required().min(32),
    otherwise: Joi.optional()
  }),
  PAYME_API_URL: Joi.string().uri().default('https://checkout.paycom.uz/api'),
  
  // SMS Services
  ESKIZ_API_URL: Joi.string().uri().default('https://notify.eskiz.uz/api'),
  ESKIZ_EMAIL: Joi.string().email().required(),
  ESKIZ_PASSWORD: Joi.string().min(8).required(),
  ESKIZ_FROM: Joi.string().default('4546'),
  
  // Email
  SMTP_HOST: Joi.string().hostname().required(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().email().required(),
  SMTP_PASSWORD: Joi.string().min(8).required(),
  SMTP_FROM: Joi.string().email().default('noreply@ultramarket.uz'),
  
  // Security
  CORS_ORIGIN: Joi.string().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().min(60000).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().min(10).default(100),
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),
  
  // Monitoring
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  SENTRY_DSN: Joi.string().uri().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  PROMETHEUS_ENABLED: Joi.boolean().default(true),
  
  // Feature Flags
  FEATURE_RECOMMENDATIONS: Joi.boolean().default(true),
  FEATURE_ANALYTICS: Joi.boolean().default(true),
  FEATURE_NOTIFICATIONS: Joi.boolean().default(true),
  FEATURE_REVIEWS: Joi.boolean().default(true),
  FEATURE_CHAT: Joi.boolean().default(false),
  
  // Business
  DEFAULT_LANGUAGE: Joi.string().valid('uz', 'ru', 'en').default('uz'),
  DEFAULT_CURRENCY: Joi.string().valid('UZS', 'USD').default('UZS'),
  TAX_RATE: Joi.number().min(0).max(1).default(0.12),
  SHIPPING_COST: Joi.number().min(0).default(50000),
  FREE_SHIPPING_THRESHOLD: Joi.number().min(0).default(1000000),
});

/**
 * 🚨 Critical Validation Errors
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[],
    public readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'CRITICAL'
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * 🔧 Professional Environment Validator
 */
export class ProfessionalEnvironmentValidator {
  private config: UltraMarketEnvironmentConfig | null = null;
  private validationErrors: string[] = [];
  private validationWarnings: string[] = [];
  
  /**
   * Validate environment variables
   */
  public validateEnvironment(): UltraMarketEnvironmentConfig {
    const { error, value } = professionalEnvSchema.validate(process.env, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => {
        const field = detail.path.join('.');
        const message = detail.message;
        return `${field}: ${message}`;
      });
      
      this.validationErrors = errors;
      
      throw new EnvironmentValidationError(
        'Environment validation failed',
        errors,
        'CRITICAL'
      );
    }
    
    this.config = value as UltraMarketEnvironmentConfig;
    this.performSecurityChecks();
    
    return this.config;
  }
  
  /**
   * Perform additional security checks
   */
  private performSecurityChecks(): void {
    if (!this.config) return;
    
    const warnings: string[] = [];
    
    // Production security checks
    if (this.config.NODE_ENV === 'production') {
      if (!this.config.POSTGRES_SSL) {
        warnings.push('POSTGRES_SSL should be true in production');
      }
      
      if (this.config.LOG_LEVEL === 'debug') {
        warnings.push('LOG_LEVEL should not be debug in production');
      }
      
      if (this.config.CORS_ORIGIN.includes('localhost')) {
        warnings.push('CORS_ORIGIN should not include localhost in production');
      }
      
      if (!this.config.SENTRY_DSN) {
        warnings.push('SENTRY_DSN is recommended for production monitoring');
      }
      
      // Check for weak secrets
      if (this.config.JWT_ACCESS_SECRET.includes('dev_') || 
          this.config.JWT_ACCESS_SECRET.includes('test_')) {
        warnings.push('JWT_ACCESS_SECRET appears to be a development secret');
      }
    }
    
    // Check for default passwords
    const defaultPasswords = ['password', 'admin', 'secret', '123456'];
    defaultPasswords.forEach(defaultPass => {
      if (this.config!.POSTGRES_PASSWORD.toLowerCase().includes(defaultPass)) {
        warnings.push('POSTGRES_PASSWORD appears to use a default/weak password');
      }
    });
    
    this.validationWarnings = warnings;
    
    if (warnings.length > 0) {
      console.warn('🟡 Environment validation warnings:');
      warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
    }
  }
  
  /**
   * Get validated configuration
   */
  public getConfig(): UltraMarketEnvironmentConfig {
    if (!this.config) {
      throw new Error('Environment not validated. Call validateEnvironment() first.');
    }
    return this.config;
  }
  
  /**
   * Generate missing secrets
   */
  public generateMissingSecrets(): Record<string, string> {
    const missingSecrets: Record<string, string> = {};
    
    if (!process.env.JWT_ACCESS_SECRET) {
      missingSecrets.JWT_ACCESS_SECRET = SecretGenerator.generateJWTSecret();
    }
    
    if (!process.env.JWT_REFRESH_SECRET) {
      missingSecrets.JWT_REFRESH_SECRET = SecretGenerator.generateJWTSecret();
    }
    
    if (!process.env.ENCRYPTION_KEY) {
      missingSecrets.ENCRYPTION_KEY = SecretGenerator.generateEncryptionKey();
    }
    
    if (!process.env.SESSION_SECRET) {
      missingSecrets.SESSION_SECRET = SecretGenerator.generateStrongSecret();
    }
    
    if (!process.env.COOKIE_SECRET) {
      missingSecrets.COOKIE_SECRET = SecretGenerator.generateStrongSecret();
    }
    
    if (!process.env.CSRF_SECRET) {
      missingSecrets.CSRF_SECRET = SecretGenerator.generateStrongSecret();
    }
    
    return missingSecrets;
  }
  
  /**
   * Production readiness check
   */
  public checkProductionReadiness(): {
    isReady: boolean;
    criticalIssues: string[];
    warnings: string[];
  } {
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    
    try {
      this.validateEnvironment();
    } catch (error) {
      if (error instanceof EnvironmentValidationError) {
        criticalIssues.push(...error.errors);
      }
    }
    
    warnings.push(...this.validationWarnings);
    
    return {
      isReady: criticalIssues.length === 0,
      criticalIssues,
      warnings
    };
  }
}

/**
 * 🌟 Global Validator Instance
 */
export const environmentValidator = new ProfessionalEnvironmentValidator();

/**
 * 🚀 Quick validation function
 */
export function validateUltraMarketEnvironment(): UltraMarketEnvironmentConfig {
  return environmentValidator.validateEnvironment();
}

/**
 * 🔑 Generate and save secrets to .env file
 */
export function generateAndSaveSecrets(envFilePath: string = '.env'): void {
  const fs = require('fs');
  const path = require('path');
  
  const missingSecrets = environmentValidator.generateMissingSecrets();
  
  if (Object.keys(missingSecrets).length === 0) {
    console.log('✅ All secrets are already configured');
    return;
  }
  
  let envContent = '';
  
  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, 'utf8');
  }
  
  Object.entries(missingSecrets).forEach(([key, value]) => {
    if (!envContent.includes(`${key}=`)) {
      envContent += `\n${key}=${value}`;
      console.log(`✅ Generated ${key}`);
    }
  });
  
  fs.writeFileSync(envFilePath, envContent);
  console.log(`✅ Secrets saved to ${envFilePath}`);
}

export default {
  ProfessionalEnvironmentValidator,
  SecretGenerator,
  environmentValidator,
  validateUltraMarketEnvironment,
  generateAndSaveSecrets
}; 