/**
 * Secure Configuration Management System
 * UltraMarket E-commerce Platform
 * 
 * Bu fayl barcha secrets va environment variables ni xavfsiz boshqarish uchun
 */

import * as crypto from 'crypto';
import { z } from 'zod';

// Environment validation schemas
const DatabaseConfigSchema = z.object({
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().transform(Number).default(5432),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string().min(16), // Kamida 16 belgi
  
  MONGODB_URI: z.string().url(),
  REDIS_URL: z.string().url(),
});

const SecurityConfigSchema = z.object({
  JWT_SECRET: z.string().min(64), // Kamida 64 belgi
  JWT_REFRESH_SECRET: z.string().min(64),
  ENCRYPTION_KEY: z.string().length(32), // AES-256 uchun 32 bytes
  SESSION_SECRET: z.string().min(32),
});

const PaymentConfigSchema = z.object({
  CLICK_MERCHANT_ID: z.string(),
  CLICK_SECRET_KEY: z.string(),
  PAYME_MERCHANT_ID: z.string(), 
  PAYME_SECRET_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string().optional(),
});

const NotificationConfigSchema = z.object({
  ESKIZ_EMAIL: z.string().email(),
  ESKIZ_PASSWORD: z.string(),
  SENDGRID_API_KEY: z.string(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
});

// ❌ NOTO'G'RI - Hardcoded secrets
/*
const config = {
  database: {
    password: 'hardcoded_password_123',
    jwt_secret: 'weak_secret'
  }
};
*/

// ✅ TO'G'RI - Secure configuration management
export class SecureConfigManager {
  private static instance: SecureConfigManager;
  private configCache = new Map<string, any>();
  
  private constructor() {}
  
  public static getInstance(): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager();
    }
    return SecureConfigManager.instance;
  }

  // Strong secret generation
  public generateStrongSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Environment variables validation
  public validateEnvironment(): void {
    try {
      // Database config validation
      DatabaseConfigSchema.parse({
        POSTGRES_HOST: process.env['POSTGRES_HOST'],
        POSTGRES_PORT: process.env['POSTGRES_PORT'],
        POSTGRES_DB: process.env['POSTGRES_DB'],
        POSTGRES_USER: process.env['POSTGRES_USER'],
        POSTGRES_PASSWORD: process.env['POSTGRES_PASSWORD'],
        MONGODB_URI: process.env['MONGODB_URI'],
        REDIS_URL: process.env['REDIS_URL'],
      });

      // Security config validation
      SecurityConfigSchema.parse({
        JWT_SECRET: process.env['JWT_SECRET'],
        JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'],
        ENCRYPTION_KEY: process.env['ENCRYPTION_KEY'],
        SESSION_SECRET: process.env['SESSION_SECRET'],
      });

      console.log('✅ Environment validation passed');
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      process.exit(1);
    }
  }

  // Get database configuration
  public getDatabaseConfig() {
    return {
      postgres: {
        host: process.env['POSTGRES_HOST']!,
        port: parseInt(process.env['POSTGRES_PORT']!),
        database: process.env['POSTGRES_DB']!,
        username: process.env['POSTGRES_USER']!,
        password: process.env['POSTGRES_PASSWORD']!,
      },
      mongodb: {
        uri: process.env['MONGODB_URI']!,
      },
      redis: {
        url: process.env['REDIS_URL']!,
      },
    };
  }

  // Get security configuration
  public getSecurityConfig() {
    return {
      jwt: {
        secret: process.env.JWT_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
      encryption: {
        key: process.env.ENCRYPTION_KEY!,
        algorithm: 'aes-256-gcm',
      },
      session: {
        secret: process.env.SESSION_SECRET!,
        name: 'ultramarket.sid',
        cookie: {
          maxAge: 30 * 60 * 1000, // 30 minutes
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
        },
      },
    };
  }

  // Get payment configuration
  public getPaymentConfig() {
    return {
      click: {
        merchantId: process.env.CLICK_MERCHANT_ID!,
        secretKey: process.env.CLICK_SECRET_KEY!,
        endpoint: process.env.CLICK_ENDPOINT || 'https://api.click.uz/v2',
      },
      payme: {
        merchantId: process.env.PAYME_MERCHANT_ID!,
        secretKey: process.env.PAYME_SECRET_KEY!,
        endpoint: process.env.PAYME_ENDPOINT || 'https://checkout.paycom.uz/api',
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      },
    };
  }

  // Encrypt sensitive data
  public encryptData(data: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // Decrypt sensitive data
  public decryptData(encryptedData: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Singleton instance
export const configManager = SecureConfigManager.getInstance();

// Environment file template generator
export const generateEnvTemplate = (): string => {
  return `# UltraMarket Environment Configuration
# IMPORTANT: Never commit this file with real values!

# Application
NODE_ENV=production
PORT=3000
API_VERSION=v2

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ultramarket_prod
POSTGRES_USER=ultramarket_user
POSTGRES_PASSWORD=${SecureConfigManager.prototype.generateStrongSecret(32)}

MONGODB_URI=mongodb://ultramarket_user:${SecureConfigManager.prototype.generateStrongSecret(24)}@localhost:27017/ultramarket_prod
REDIS_URL=redis://localhost:6379

# Security Configuration
JWT_SECRET=${SecureConfigManager.prototype.generateStrongSecret(64)}
JWT_REFRESH_SECRET=${SecureConfigManager.prototype.generateStrongSecret(64)}
ENCRYPTION_KEY=${SecureConfigManager.prototype.generateStrongSecret(32)}
SESSION_SECRET=${SecureConfigManager.prototype.generateStrongSecret(32)}

# Payment Services
CLICK_MERCHANT_ID=your_click_merchant_id
CLICK_SECRET_KEY=${SecureConfigManager.prototype.generateStrongSecret(32)}
PAYME_MERCHANT_ID=your_payme_merchant_id
PAYME_SECRET_KEY=${SecureConfigManager.prototype.generateStrongSecret(32)}

# Notification Services
ESKIZ_EMAIL=notifications@ultramarket.uz
ESKIZ_PASSWORD=${SecureConfigManager.prototype.generateStrongSecret(16)}
SENDGRID_API_KEY=your_sendgrid_api_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
`;
};

// Docker secrets loader
export const loadDockerSecrets = (secretName: string): string => {
  try {
    const fs = require('fs');
    return fs.readFileSync(`/run/secrets/${secretName}`, 'utf8').trim();
  } catch (error) {
    throw new Error(`Failed to load Docker secret: ${secretName}`);
  }
};

// Kubernetes secrets loader
export const loadK8sSecret = (secretName: string, namespace: string = 'default'): string => {
  try {
    const fs = require('fs');
    return fs.readFileSync(`/var/secrets/${namespace}/${secretName}`, 'utf8').trim();
  } catch (error) {
    throw new Error(`Failed to load Kubernetes secret: ${secretName}`);
  }
};

// Health check for configuration
export const validateConfigHealth = (): { status: string; issues: string[] } => {
  const issues: string[] = [];
  
  // Check required environment variables
  const requiredVars = [
    'POSTGRES_PASSWORD',
    'JWT_SECRET', 
    'ENCRYPTION_KEY',
    'CLICK_SECRET_KEY',
    'PAYME_SECRET_KEY'
  ];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      issues.push(`Missing environment variable: ${varName}`);
    } else if (value.length < 16) {
      issues.push(`Weak ${varName}: minimum 16 characters required`);
    }
  });
  
  return {
    status: issues.length === 0 ? 'healthy' : 'unhealthy',
    issues
  };
}; 