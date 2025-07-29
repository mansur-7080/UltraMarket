/**
 * 🔒 ENVIRONMENT VALIDATOR - UltraMarket
 * 
 * Comprehensive environment variable validation and security checks
 * Prevents deployment with insecure configurations
 * 
 * @author UltraMarket Security Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import { z } from 'zod';
import crypto from 'crypto';

// Environment schema with strict validation
const environmentSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default(() => 3000),
  API_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  ADMIN_URL: z.string().url(),
  
  // Database
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default(() => 5432),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(32, 'Password must be at least 32 characters'),
  
  // Redis
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default(() => 6379),
  REDIS_PASSWORD: z.string().min(32, 'Redis password must be at least 32 characters'),
  REDIS_DB: z.string().transform(Number).pipe(z.number().min(0).max(15)).default(() => 0),
  
  // JWT & Authentication
  JWT_SECRET: z.string().min(64, 'JWT secret must be at least 64 characters'),
  JWT_REFRESH_SECRET: z.string().min(64, 'JWT refresh secret must be at least 64 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Admin Authentication (CRITICAL)
  ADMIN_PASSWORD_HASH: z.string().min(60, 'Admin password hash must be bcrypt hash'),
  ADMIN_MFA_SECRET: z.string().min(32, 'Admin MFA secret must be at least 32 characters'),
  
  // Email
  EMAIL_HOST: z.string().min(1),
  EMAIL_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default(() => 587),
  EMAIL_SECURE: z.string().transform(val => val === 'true').default(() => false),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  
  // Payment Providers
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  
  CLICK_SERVICE_ID: z.string().min(1),
  CLICK_MERCHANT_ID: z.string().min(1),
  CLICK_SECRET_KEY: z.string().min(1),
  CLICK_ENVIRONMENT: z.enum(['test', 'production']).default('test'),
  
  PAYME_MERCHANT_ID: z.string().min(1),
  PAYME_SECRET_KEY: z.string().min(1),
  PAYME_ENVIRONMENT: z.enum(['test', 'production']).default('test'),
  
  APELSIN_MERCHANT_ID: z.string().min(1),
  APELSIN_SECRET_KEY: z.string().min(1),
  APELSIN_ENVIRONMENT: z.enum(['test', 'production']).default('test'),
  
  // Shipping
  UZPOST_API_KEY: z.string().min(1),
  UZPOST_ENVIRONMENT: z.enum(['test', 'production']).default('test'),
  
  UZAUTO_API_KEY: z.string().min(1),
  UZAUTO_ENVIRONMENT: z.enum(['test', 'production']).default('test'),
  
  COURIER_API_KEY: z.string().min(1),
  COURIER_ENVIRONMENT: z.enum(['test', 'production']).default('test'),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  REACT_APP_SENTRY_DSN: z.string().url().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  
  // Cache & Performance
  CACHE_TTL: z.string().transform(Number).pipe(z.number().min(1)).default(() => 3600),
  CACHE_MAX_SIZE: z.string().transform(Number).pipe(z.number().min(1)).default(() => 1000),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().min(1)).default(() => 900000),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1)).default(() => 100),
  
  // Security
  CORS_ORIGINS: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1)).default(() => 1800),
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(16)).default(() => 12),
  PASSWORD_MIN_LENGTH: z.string().transform(Number).pipe(z.number().min(8).max(128)).default(() => 8),
  
  // External Services
  SMS_PROVIDER: z.string().min(1),
  SMS_API_KEY: z.string().min(1),
  SMS_SENDER: z.string().min(1),
  
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  
  // Analytics
  GA_TRACKING_ID: z.string().min(1),
  FB_PIXEL_ID: z.string().min(1),
  
  // File Storage
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  
  LOCAL_STORAGE_PATH: z.string().min(1).default('./uploads'),
  
  // Message Queue
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().min(1),
  KAFKA_GROUP_ID: z.string().min(1),
  
  // Metrics
  PROMETHEUS_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default(() => 9090),
  PROMETHEUS_PATH: z.string().min(1).default('/metrics'),
  
  // Development
  DEBUG: z.string().optional(),
  NODE_OPTIONS: z.string().optional(),
  
  // Test Environment
  TEST_DATABASE_URL: z.string().url().optional(),
  TEST_MONGODB_URI: z.string().url().optional(),
});

type EnvironmentConfig = z.infer<typeof environmentSchema>;

class EnvironmentValidator {
  private static instance: EnvironmentValidator | null = null;
  private config: EnvironmentConfig | null = null;
  private validationErrors: string[] = [];
  private securityWarnings: string[] = [];

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Validate environment variables
   */
  public validateEnvironment(): EnvironmentConfig {
    try {
      // Check for missing required variables
      this.checkRequiredVariables();
      
      // Parse and validate environment
      const envData = this.getEnvironmentData();
      this.config = environmentSchema.parse(envData);
      
      // Perform security checks
      this.performSecurityChecks();
      
      // Generate secure secrets if needed
      this.generateSecureSecrets();
      
      // Log validation results
      this.logValidationResults();
      
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors = (error as any).errors.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        );
      } else {
        this.validationErrors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      this.logValidationResults();
      throw new Error(`Environment validation failed:\n${this.validationErrors.join('\n')}`);
    }
  }

  /**
   * Check for required environment variables
   */
  private checkRequiredVariables(): void {
    const requiredVars = [
      'POSTGRES_PASSWORD',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ADMIN_PASSWORD_HASH',
      'ADMIN_MFA_SECRET',
      'EMAIL_PASS',
      'STRIPE_SECRET_KEY',
      'CLICK_SECRET_KEY',
      'PAYME_SECRET_KEY',
      'SESSION_SECRET',
      'SMS_API_KEY',
      'FIREBASE_PRIVATE_KEY',
      'AWS_SECRET_ACCESS_KEY'
    ];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value || value.includes('CHANGE_THIS') || value.includes('your_')) {
        this.validationErrors.push(`CRITICAL: ${varName} must be set to a secure value`);
      }
    }
  }

  /**
   * Get environment data with defaults
   */
  private getEnvironmentData(): Record<string, string> {
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '3000',
      API_URL: process.env.API_URL || 'http://localhost:8000',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
      ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:3001',
      
      POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
      POSTGRES_PORT: process.env.POSTGRES_PORT || '5432',
      POSTGRES_DB: process.env.POSTGRES_DB || 'ultramarket',
      POSTGRES_USER: process.env.POSTGRES_USER || 'ultramarket_user',
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
      
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: process.env.REDIS_PORT || '6379',
      REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
      REDIS_DB: process.env.REDIS_DB || '0',
      
      JWT_SECRET: process.env.JWT_SECRET || '',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
      JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '',
      ADMIN_MFA_SECRET: process.env.ADMIN_MFA_SECRET || '',
      
      EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
      EMAIL_PORT: process.env.EMAIL_PORT || '587',
      EMAIL_SECURE: process.env.EMAIL_SECURE || 'false',
      EMAIL_USER: process.env.EMAIL_USER || '',
      EMAIL_PASS: process.env.EMAIL_PASS || '',
      EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@ultramarket.com',
      
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
      
      CLICK_SERVICE_ID: process.env.CLICK_SERVICE_ID || '',
      CLICK_MERCHANT_ID: process.env.CLICK_MERCHANT_ID || '',
      CLICK_SECRET_KEY: process.env.CLICK_SECRET_KEY || '',
      CLICK_ENVIRONMENT: process.env.CLICK_ENVIRONMENT || 'test',
      
      PAYME_MERCHANT_ID: process.env.PAYME_MERCHANT_ID || '',
      PAYME_SECRET_KEY: process.env.PAYME_SECRET_KEY || '',
      PAYME_ENVIRONMENT: process.env.PAYME_ENVIRONMENT || 'test',
      
      APELSIN_MERCHANT_ID: process.env.APELSIN_MERCHANT_ID || '',
      APELSIN_SECRET_KEY: process.env.APELSIN_SECRET_KEY || '',
      APELSIN_ENVIRONMENT: process.env.APELSIN_ENVIRONMENT || 'test',
      
      UZPOST_API_KEY: process.env.UZPOST_API_KEY || '',
      UZPOST_ENVIRONMENT: process.env.UZPOST_ENVIRONMENT || 'test',
      
      UZAUTO_API_KEY: process.env.UZAUTO_API_KEY || '',
      UZAUTO_ENVIRONMENT: process.env.UZAUTO_ENVIRONMENT || 'test',
      
      COURIER_API_KEY: process.env.COURIER_API_KEY || '',
      COURIER_ENVIRONMENT: process.env.COURIER_ENVIRONMENT || 'test',
      
      SENTRY_DSN: process.env.SENTRY_DSN || '',
      REACT_APP_SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN || '',
      
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      LOG_FORMAT: process.env.LOG_FORMAT || 'json',
      
      CACHE_TTL: process.env.CACHE_TTL || '3600',
      CACHE_MAX_SIZE: process.env.CACHE_MAX_SIZE || '1000',
      
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
      
      CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001',
      SESSION_SECRET: process.env.SESSION_SECRET || '',
      SESSION_TIMEOUT: process.env.SESSION_TIMEOUT || '1800',
      BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || '12',
      PASSWORD_MIN_LENGTH: process.env.PASSWORD_MIN_LENGTH || '8',
      
      SMS_PROVIDER: process.env.SMS_PROVIDER || 'uzsms',
      SMS_API_KEY: process.env.SMS_API_KEY || '',
      SMS_SENDER: process.env.SMS_SENDER || 'UltraMarket',
      
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
      
      GA_TRACKING_ID: process.env.GA_TRACKING_ID || '',
      FB_PIXEL_ID: process.env.FB_PIXEL_ID || '',
      
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'ultramarket-storage',
      
      LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH || './uploads',
      
      KAFKA_BROKERS: process.env.KAFKA_BROKERS || 'localhost:9092',
      KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'ultramarket',
      KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'ultramarket-group',
      
      PROMETHEUS_PORT: process.env.PROMETHEUS_PORT || '9090',
      PROMETHEUS_PATH: process.env.PROMETHEUS_PATH || '/metrics',
      
      DEBUG: process.env.DEBUG || '',
      NODE_OPTIONS: process.env.NODE_OPTIONS || '',
      
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || '',
      TEST_MONGODB_URI: process.env.TEST_MONGODB_URI || '',
    };
  }

  /**
   * Perform security checks
   */
  private performSecurityChecks(): void {
    if (!this.config) return;

    // Check for weak passwords
    if (this.config.POSTGRES_PASSWORD.length < 32) {
      this.securityWarnings.push('PostgreSQL password is too weak (minimum 32 characters)');
    }

    if (this.config.JWT_SECRET.length < 64) {
      this.securityWarnings.push('JWT secret is too weak (minimum 64 characters)');
    }

    // Check for development in production
    if (this.config.NODE_ENV === 'production') {
      if (this.config.CLICK_ENVIRONMENT === 'test') {
        this.securityWarnings.push('Production environment using test Click configuration');
      }
      if (this.config.PAYME_ENVIRONMENT === 'test') {
        this.securityWarnings.push('Production environment using test Payme configuration');
      }
      if (this.config.APELSIN_ENVIRONMENT === 'test') {
        this.securityWarnings.push('Production environment using test Apelsin configuration');
      }
    }

    // Check for insecure defaults
    if (this.config.BCRYPT_ROUNDS < 12) {
      this.securityWarnings.push('BCRYPT_ROUNDS should be at least 12 for security');
    }

    if (this.config.PASSWORD_MIN_LENGTH < 8) {
      this.securityWarnings.push('PASSWORD_MIN_LENGTH should be at least 8');
    }
  }

  /**
   * Generate secure secrets if needed
   */
  private generateSecureSecrets(): void {
    if (!this.config) return;

    // Generate secure secrets for development
    if (this.config.NODE_ENV === 'development') {
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('CHANGE_THIS')) {
        const secureSecret = crypto.randomBytes(64).toString('hex');
        console.warn('⚠️  Generated secure JWT_SECRET for development. Set this in your .env file:');
        console.warn(`JWT_SECRET=${secureSecret}`);
      }

      if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('CHANGE_THIS')) {
        const secureSecret = crypto.randomBytes(64).toString('hex');
        console.warn('⚠️  Generated secure JWT_REFRESH_SECRET for development. Set this in your .env file:');
        console.warn(`JWT_REFRESH_SECRET=${secureSecret}`);
      }

      if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.includes('CHANGE_THIS')) {
        const secureSecret = crypto.randomBytes(32).toString('hex');
        console.warn('⚠️  Generated secure SESSION_SECRET for development. Set this in your .env file:');
        console.warn(`SESSION_SECRET=${secureSecret}`);
      }
    }
  }

  /**
   * Log validation results
   */
  private logValidationResults(): void {
    console.log('\n🔒 Environment Validation Results:');
    console.log('=====================================');
    
    if (this.validationErrors.length > 0) {
      console.error('❌ Validation Errors:');
      this.validationErrors.forEach(error => {
        console.error(`   ${error}`);
      });
    } else {
      console.log('✅ All environment variables validated successfully');
    }

    if (this.securityWarnings.length > 0) {
      console.warn('⚠️  Security Warnings:');
      this.securityWarnings.forEach(warning => {
        console.warn(`   ${warning}`);
      });
    } else {
      console.log('✅ No security warnings');
    }

    if (this.config) {
      console.log('\n📋 Configuration Summary:');
      console.log(`   Environment: ${this.config.NODE_ENV}`);
      console.log(`   Port: ${this.config.PORT}`);
      console.log(`   Database: ${this.config.POSTGRES_HOST}:${this.config.POSTGRES_PORT}`);
      console.log(`   Redis: ${this.config.REDIS_HOST}:${this.config.REDIS_PORT}`);
      console.log(`   Log Level: ${this.config.LOG_LEVEL}`);
      console.log(`   Bcrypt Rounds: ${this.config.BCRYPT_ROUNDS}`);
    }

    console.log('=====================================\n');
  }

  /**
   * Get validated configuration
   */
  public getConfig(): EnvironmentConfig {
    if (!this.config) {
      throw new Error('Environment not validated. Call validateEnvironment() first.');
    }
    return this.config;
  }

  /**
   * Check if environment is production
   */
  public isProduction(): boolean {
    return this.config?.NODE_ENV === 'production';
  }

  /**
   * Check if environment is development
   */
  public isDevelopment(): boolean {
    return this.config?.NODE_ENV === 'development';
  }

  /**
   * Get validation errors
   */
  public getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Get security warnings
   */
  public getSecurityWarnings(): string[] {
    return [...this.securityWarnings];
  }
}

// Export singleton instance
export const environmentValidator = EnvironmentValidator.getInstance();

// Export helper function
export function getValidatedEnv(): EnvironmentConfig {
  return environmentValidator.getConfig();
}

// Export validation function
export function validateEnvironment(): EnvironmentConfig {
  return environmentValidator.validateEnvironment();
} 