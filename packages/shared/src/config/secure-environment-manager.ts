/**
 * 🔒 SECURE ENVIRONMENT MANAGER - UltraMarket
 * 
 * Barcha hardcoded credentials va environment variables ni xavfsiz boshqarish
 * Professional secrets management system
 * 
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import * as crypto from 'crypto';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logging/professional-logger';

// Environment validation schemas
const DatabaseConfigSchema = z.object({
  POSTGRES_HOST: z.string().min(1, 'PostgreSQL host is required'),
  POSTGRES_PORT: z.string().regex(/^\d+$/, 'Invalid port number').transform(Number),
  POSTGRES_DB: z.string().min(1, 'Database name is required'),
  POSTGRES_USER: z.string().min(1, 'Database user is required'),
  POSTGRES_PASSWORD: z.string().min(16, 'PostgreSQL password must be at least 16 characters'),
  
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  MONGODB_PASSWORD: z.string().min(16, 'MongoDB password must be at least 16 characters'),
  
  REDIS_HOST: z.string().min(1, 'Redis host is required'),
  REDIS_PORT: z.string().regex(/^\d+$/, 'Invalid Redis port').transform(Number),
  REDIS_PASSWORD: z.string().min(16, 'Redis password must be at least 16 characters'),
});

const SecurityConfigSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(64, 'JWT access secret must be at least 64 characters'),
  JWT_REFRESH_SECRET: z.string().min(64, 'JWT refresh secret must be at least 64 characters'),
  JWT_VERIFICATION_SECRET: z.string().min(64, 'JWT verification secret must be at least 64 characters'),
  
  ENCRYPTION_KEY: z.string().length(32, 'Encryption key must be exactly 32 characters for AES-256'),
  SESSION_SECRET: z.string().min(64, 'Session secret must be at least 64 characters'),
  BCRYPT_SALT_ROUNDS: z.string().regex(/^\d+$/, 'Invalid salt rounds').transform(Number),
});

const ExternalServicesSchema = z.object({
  // Payment Services (O'zbekiston)
  CLICK_MERCHANT_ID: z.string().min(1, 'Click merchant ID is required'),
  CLICK_SECRET_KEY: z.string().min(32, 'Click secret key must be at least 32 characters'),
  
  PAYME_MERCHANT_ID: z.string().min(1, 'Payme merchant ID is required'),
  PAYME_SECRET_KEY: z.string().min(32, 'Payme secret key must be at least 32 characters'),
  
  UZCARD_MERCHANT_ID: z.string().optional(),
  UZCARD_SECRET_KEY: z.string().optional(),
  
  // SMS Services (O'zbekiston) 
  ESKIZ_EMAIL: z.string().email('Invalid Eskiz email'),
  ESKIZ_PASSWORD: z.string().min(8, 'Eskiz password must be at least 8 characters'),
  
  PLAYMOBILE_LOGIN: z.string().optional(),
  PLAYMOBILE_PASSWORD: z.string().optional(),
  
  // Email Services
  SENDGRID_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

// Interface definitions
export interface SecureEnvironmentConfig {
  database: z.infer<typeof DatabaseConfigSchema>;
  security: z.infer<typeof SecurityConfigSchema>;
  externalServices: Partial<z.infer<typeof ExternalServicesSchema>>;
}

export interface SecretGenerationOptions {
  length: number;
  includeSymbols?: boolean;
  includeNumbers?: boolean;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
}

export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: SecureEnvironmentConfig;
}

/**
 * Professional Secure Environment Manager
 */
export class SecureEnvironmentManager {
  private static instance: SecureEnvironmentManager;
  private configCache: Map<string, any> = new Map();
  private isProduction: boolean = process.env['NODE_ENV'] === 'production';
  
  private constructor() {}
  
  public static getInstance(): SecureEnvironmentManager {
    if (!SecureEnvironmentManager.instance) {
      SecureEnvironmentManager.instance = new SecureEnvironmentManager();
    }
    return SecureEnvironmentManager.instance;
  }
  
  /**
   * Generate cryptographically secure random secret
   */
  generateSecureSecret(options: SecretGenerationOptions = { length: 64 }): string {
    const {
      length = 64,
      includeSymbols = true,
      includeNumbers = true,
      includeUppercase = true,
      includeLowercase = true
    } = options;
    
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let result = '';
    const array = new Uint32Array(length);
    crypto.randomBytes(length).forEach((byte, index) => {
      array[index] = byte;
    });
    
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    
    return result;
  }
  
  /**
   * Generate base64 encoded secure secret
   */
  generateBase64Secret(byteLength: number = 32): string {
    return crypto.randomBytes(byteLength).toString('base64url');
  }
  
  /**
   * Generate secure password with specific requirements
   */
  generateSecurePassword(length: number = 24): string {
    // Ensure at least one of each character type
    let password = '';
    
    // Add at least one from each category
    password += this.generateSecureSecret({ length: 1, includeSymbols: false, includeNumbers: false, includeUppercase: true, includeLowercase: false });
    password += this.generateSecureSecret({ length: 1, includeSymbols: false, includeNumbers: false, includeUppercase: false, includeLowercase: true });
    password += this.generateSecureSecret({ length: 1, includeSymbols: false, includeNumbers: true, includeUppercase: false, includeLowercase: false });
    password += this.generateSecureSecret({ length: 1, includeSymbols: true, includeNumbers: false, includeUppercase: false, includeLowercase: false });
    
    // Fill rest with random characters
    const remaining = length - 4;
    if (remaining > 0) {
      password += this.generateSecureSecret({ length: remaining });
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  /**
   * Generate complete environment configuration
   */
  generateCompleteEnvironment(): Record<string, string> {
    const config = {
      // Application
      NODE_ENV: 'production',
      APP_NAME: 'UltraMarket',
      APP_VERSION: '2.0.0',
      
      // Database Configuration
      POSTGRES_HOST: 'postgres-primary',
      POSTGRES_PORT: '5432',
      POSTGRES_DB: 'ultramarket_prod',
      POSTGRES_USER: 'ultramarket_user',
      POSTGRES_PASSWORD: this.generateSecurePassword(32),
      
      MONGODB_URI: `mongodb://ultramarket_user:${this.generateSecurePassword(24)}@mongodb-primary:27017/ultramarket_prod?authSource=admin&ssl=true`,
      MONGODB_PASSWORD: this.generateSecurePassword(24),
      
      REDIS_HOST: 'redis-cluster',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: this.generateSecurePassword(24),
      
      // Security Configuration
      JWT_ACCESS_SECRET: this.generateBase64Secret(64),
      JWT_REFRESH_SECRET: this.generateBase64Secret(64),
      JWT_VERIFICATION_SECRET: this.generateBase64Secret(64),
      
      ENCRYPTION_KEY: this.generateBase64Secret(32).substring(0, 32),
      SESSION_SECRET: this.generateBase64Secret(64),
      BCRYPT_SALT_ROUNDS: '12',
      
      // Payment Services (O'zbekiston)
      CLICK_MERCHANT_ID: 'YOUR_CLICK_MERCHANT_ID',
      CLICK_SECRET_KEY: this.generateBase64Secret(32),
      
      PAYME_MERCHANT_ID: 'YOUR_PAYME_MERCHANT_ID',
      PAYME_SECRET_KEY: this.generateBase64Secret(32),
      
      UZCARD_MERCHANT_ID: 'YOUR_UZCARD_MERCHANT_ID',
      UZCARD_SECRET_KEY: this.generateBase64Secret(32),
      
      // SMS Services (O'zbekiston)
      ESKIZ_EMAIL: 'notifications@ultramarket.uz',
      ESKIZ_PASSWORD: this.generateSecurePassword(16),
      
      PLAYMOBILE_LOGIN: 'ultramarket_sms',
      PLAYMOBILE_PASSWORD: this.generateSecurePassword(16),
      
      // Email Configuration
      SENDGRID_API_KEY: 'SG.your_sendgrid_api_key_here',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'notifications@ultramarket.uz',
      SMTP_PASSWORD: this.generateSecurePassword(16),
    };
    
    return config;
  }
  
  /**
   * Validate environment configuration
   */
  validateEnvironment(): EnvironmentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
             // Database configuration validation
       const databaseResult = DatabaseConfigSchema.safeParse(process.env);
       if (!databaseResult.success) {
         databaseResult.error.issues.forEach(error => {
           errors.push(`Database Config - ${String(error.path)}: ${error.message}`);
         });
       }
       
       // Security configuration validation
       const securityResult = SecurityConfigSchema.safeParse(process.env);
       if (!securityResult.success) {
         securityResult.error.issues.forEach(error => {
           errors.push(`Security Config - ${error.path.join('.')}: ${error.message}`);
         });
       }
       
       // External services validation (partial)
       const externalResult = ExternalServicesSchema.partial().safeParse(process.env);
       if (!externalResult.success) {
         externalResult.error.issues.forEach(error => {
           warnings.push(`External Services - ${error.path.join('.')}: ${error.message}`);
         });
       }
      
      // Production-specific validations
      if (this.isProduction) {
        this.validateProductionSecurity(errors, warnings);
      }
      
      const config: SecureEnvironmentConfig = {
        database: databaseResult.success ? databaseResult.data : {} as any,
        security: securityResult.success ? securityResult.data : {} as any,
        externalServices: externalResult.success ? externalResult.data : {}
      };
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        config
      };
      
    } catch (error) {
      errors.push(`Environment validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }
  
  /**
   * Production-specific security validations
   */
  private validateProductionSecurity(errors: string[], warnings: string[]): void {
    const dangerousPatterns = [
      { key: 'JWT_ACCESS_SECRET', pattern: /(test|dev|demo|123|password)/i, message: 'JWT access secret contains weak patterns' },
      { key: 'POSTGRES_PASSWORD', pattern: /(admin|password|123|test|dev)/i, message: 'PostgreSQL password is too weak' },
      { key: 'REDIS_PASSWORD', pattern: /(redis|cache|123|test|dev)/i, message: 'Redis password is too weak' }
    ];
    
    dangerousPatterns.forEach(({ key, pattern, message }) => {
      const value = process.env[key];
      if (value && pattern.test(value)) {
        errors.push(`Production Security - ${key}: ${message}`);
      }
    });
    
    // Check if default development values are still being used
    const productionChecks = [
      { key: 'NODE_ENV', expected: 'production', message: 'NODE_ENV must be set to production' },
      { key: 'LOG_LEVEL', dangerous: ['debug'], message: 'Log level should not be debug in production' }
    ];
    
    productionChecks.forEach(({ key, expected, dangerous, message }) => {
      const value = process.env[key];
      if (expected && value !== expected) {
        warnings.push(`Production Config - ${key}: ${message}`);
      }
      if (dangerous && dangerous.includes(value)) {
        warnings.push(`Production Config - ${key}: ${message}`);
      }
    });
  }
  
  /**
   * Generate secure .env file
   */
  async generateEnvFile(outputPath: string = '.env.production'): Promise<void> {
    const config = this.generateCompleteEnvironment();
    
    const envContent = `# UltraMarket Production Environment Configuration
# Generated on: ${new Date().toISOString()}
# ⚠️  CRITICAL: Never commit this file to version control!
# ⚠️  IMPORTANT: Store this file securely and restrict access

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=${config.NODE_ENV}
APP_NAME=${config.APP_NAME}
APP_VERSION=${config.APP_VERSION}

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# PostgreSQL (Primary Database)
POSTGRES_HOST=${config.POSTGRES_HOST}
POSTGRES_PORT=${config.POSTGRES_PORT}
POSTGRES_DB=${config.POSTGRES_DB}
POSTGRES_USER=${config.POSTGRES_USER}
POSTGRES_PASSWORD=${config.POSTGRES_PASSWORD}

# MongoDB (Document Database)
MONGODB_URI=${config.MONGODB_URI}
MONGODB_PASSWORD=${config.MONGODB_PASSWORD}

# Redis (Cache & Session Store)
REDIS_HOST=${config.REDIS_HOST}
REDIS_PORT=${config.REDIS_PORT}
REDIS_PASSWORD=${config.REDIS_PASSWORD}

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# JWT Secrets (64+ characters for security)
JWT_ACCESS_SECRET=${config.JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${config.JWT_REFRESH_SECRET}
JWT_VERIFICATION_SECRET=${config.JWT_VERIFICATION_SECRET}

# Encryption & Session
ENCRYPTION_KEY=${config.ENCRYPTION_KEY}
SESSION_SECRET=${config.SESSION_SECRET}
BCRYPT_SALT_ROUNDS=${config.BCRYPT_SALT_ROUNDS}

# =============================================================================
# PAYMENT SERVICES (O'ZBEKISTON)
# =============================================================================

# Click Payment Gateway
CLICK_MERCHANT_ID=${config.CLICK_MERCHANT_ID}
CLICK_SECRET_KEY=${config.CLICK_SECRET_KEY}

# Payme Payment Gateway
PAYME_MERCHANT_ID=${config.PAYME_MERCHANT_ID}
PAYME_SECRET_KEY=${config.PAYME_SECRET_KEY}

# UzCard Payment Gateway
UZCARD_MERCHANT_ID=${config.UZCARD_MERCHANT_ID}
UZCARD_SECRET_KEY=${config.UZCARD_SECRET_KEY}

# =============================================================================
# SMS SERVICES (O'ZBEKISTON)
# =============================================================================

# Eskiz SMS Service
ESKIZ_EMAIL=${config.ESKIZ_EMAIL}
ESKIZ_PASSWORD=${config.ESKIZ_PASSWORD}

# PlayMobile SMS Service
PLAYMOBILE_LOGIN=${config.PLAYMOBILE_LOGIN}
PLAYMOBILE_PASSWORD=${config.PLAYMOBILE_PASSWORD}

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================

SENDGRID_API_KEY=${config.SENDGRID_API_KEY}
SMTP_HOST=${config.SMTP_HOST}
SMTP_PORT=${config.SMTP_PORT}
SMTP_USER=${config.SMTP_USER}
SMTP_PASSWORD=${config.SMTP_PASSWORD}

# =============================================================================
# PRODUCTION NOTES
# =============================================================================
# 1. Replace placeholder values (YOUR_*_HERE) with actual credentials
# 2. Store this file in a secure location
# 3. Use proper file permissions (chmod 600)
# 4. Never commit this file to version control
# 5. Regularly rotate secrets (monthly recommended)
# 6. Use environment-specific secret management in production (AWS Secrets Manager, HashiCorp Vault, etc.)
`;

    await fs.promises.writeFile(outputPath, envContent, { mode: 0o600 });
    
    logger.info('Secure environment file generated', {
      outputPath,
      fileSize: envContent.length,
      permissions: '0600'
    });
  }
  
  /**
   * Load and validate environment from file
   */
  async loadEnvironmentFromFile(filePath: string): Promise<EnvironmentValidationResult> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          isValid: false,
          errors: [`Environment file not found: ${filePath}`],
          warnings: []
        };
      }
      
      const content = await fs.promises.readFile(filePath, 'utf8');
      const envVars: Record<string, string> = {};
      
      // Parse .env file
      content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...values] = line.split('=');
          if (key && values.length > 0) {
            envVars[key] = values.join('=');
          }
        }
      });
      
      // Temporarily set environment variables for validation
      const originalEnv = { ...process.env };
      Object.assign(process.env, envVars);
      
      const result = this.validateEnvironment();
      
      // Restore original environment
      process.env = originalEnv;
      
      return result;
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to load environment file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }
  
  /**
   * Get configuration value with caching
   */
  getConfig<T>(key: string, defaultValue?: T): T {
    if (this.configCache.has(key)) {
      return this.configCache.get(key);
    }
    
    const value = process.env[key] || defaultValue;
    this.configCache.set(key, value);
    return value as T;
  }
  
  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
  }
  
  /**
   * Check if running in production mode
   */
  isProductionMode(): boolean {
    return this.isProduction;
  }
}

// Export singleton instance
export const secureEnvManager = SecureEnvironmentManager.getInstance();

// Helper functions
export const generateSecrets = () => secureEnvManager.generateCompleteEnvironment();
export const validateEnv = () => secureEnvManager.validateEnvironment();
export const createEnvFile = (path?: string) => secureEnvManager.generateEnvFile(path);

// Environment validation middleware for Express
export const environmentValidationMiddleware = (req: any, res: any, next: any) => {
  const result = secureEnvManager.validateEnvironment();
  
  if (!result.isValid) {
    logger.error('Environment validation failed', { errors: result.errors });
    return res.status(500).json({
      success: false,
      error: {
        code: 'ENVIRONMENT_VALIDATION_ERROR',
        message: 'Server configuration is invalid',
        details: result.errors
      }
    });
  }
  
  if (result.warnings.length > 0) {
    logger.warn('Environment validation warnings', { warnings: result.warnings });
  }
  
  next();
};

export default secureEnvManager; 