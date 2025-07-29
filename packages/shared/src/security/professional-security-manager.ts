/**
 * 🛡️ PROFESSIONAL SECURITY MANAGER - ULTRAMARKET
 * 
 * Comprehensive security implementation with industry standards
 * Replaces scattered security implementations across microservices
 * 
 * @author UltraMarket Development Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
// Professional email/phone validation without external dependencies
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone regex for validation
const phoneRegex = /^(\+998|998)?[0-9]{9}$/;
import crypto from 'crypto';
import { logger } from '../logging/professional-logger';

/**
 * Professional Security Configuration Interface
 */
export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
  cors: {
    origins: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  helmet: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  csrf: {
    enabled: boolean;
    cookieName: string;
    headerName: string;
    secret: string;
  };
  validation: {
    maxBodySize: string;
    sanitizeInput: boolean;
    strictValidation: boolean;
  };
}

/**
 * Professional Security Manager
 */
export class ProfessionalSecurityManager {
  private static instance: ProfessionalSecurityManager;
  private config: SecurityConfig;
  private csrfTokens = new Map<string, { token: string; expires: Date }>();

  private constructor(config: SecurityConfig) {
    this.config = config;
    this.validateConfiguration();
    
    // Cleanup expired CSRF tokens every hour
    setInterval(() => this.cleanupExpiredCSRFTokens(), 60 * 60 * 1000);
    
    logger.info('🛡️ Professional Security Manager initialized', {
      features: this.getEnabledFeatures()
    });
  }

  public static getInstance(config?: SecurityConfig): ProfessionalSecurityManager {
    if (!ProfessionalSecurityManager.instance) {
      if (!config) {
        throw new Error('Security configuration required for first initialization');
      }
      ProfessionalSecurityManager.instance = new ProfessionalSecurityManager(config);
    }
    return ProfessionalSecurityManager.instance;
  }

  /**
   * Get comprehensive rate limiting middleware
   */
  public getRateLimitMiddleware(customOptions?: Partial<SecurityConfig['rateLimit']>) {
    const options = { ...this.config.rateLimit, ...customOptions };
    
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message,
          retryAfter: Math.ceil(options.windowMs / 1000),
          timestamp: new Date().toISOString()
        }
      },
      standardHeaders: options.standardHeaders,
      legacyHeaders: options.legacyHeaders,
      
             // Professional rate limit handler (removed onLimitReached for compatibility)
      
             // Skip rate limiting for health checks and monitoring
       skip: (req: any) => {
         const healthCheckPaths = ['/health', '/metrics', '/status'];
         return healthCheckPaths.some(path => req.path.startsWith(path));
       }
    });
  }

  /**
   * Get comprehensive CORS middleware
   */
  public getCORSMiddleware() {
    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (this.config.cors.origins.includes('*')) {
          return callback(null, true);
        }
        
        if (this.config.cors.origins.includes(origin)) {
          return callback(null, true);
        }
        
        // Log blocked CORS request
        logger.warn('🚫 CORS request blocked', {
          origin,
          allowedOrigins: this.config.cors.origins
        });
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: this.config.cors.credentials,
      methods: this.config.cors.methods,
      allowedHeaders: this.config.cors.allowedHeaders,
      
      // Additional security headers
      preflightContinue: false,
      optionsSuccessStatus: 204
    });
  }

  /**
   * Get comprehensive Helmet middleware for security headers
   */
  public getHelmetMiddleware() {
    return helmet({
      contentSecurityPolicy: this.config.helmet.contentSecurityPolicy ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "https:"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      } : false,
      
      crossOriginEmbedderPolicy: this.config.helmet.crossOriginEmbedderPolicy,
      
      hsts: {
        maxAge: this.config.helmet.hsts.maxAge,
        includeSubDomains: this.config.helmet.hsts.includeSubDomains,
        preload: this.config.helmet.hsts.preload
      },
      
      // Additional security headers
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: "same-origin" },
      permittedCrossDomainPolicies: false,
      
      // Hide Express server information
      hidePoweredBy: true
    });
  }

  /**
   * Professional input validation middleware
   */
  public getInputValidationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate and sanitize request body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body);
        }

        // Validate query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query);
        }

        // Validate URL parameters
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params);
        }

        // Check for suspicious patterns
        const suspiciousPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /vbscript:/gi,
          /onload\s*=/gi,
          /onerror\s*=/gi,
          /eval\s*\(/gi,
          /expression\s*\(/gi
        ];

        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        const bodyString = JSON.stringify(req.body || {});
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(fullUrl) || pattern.test(bodyString)) {
            logger.error('🚨 Suspicious input detected', {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              url: req.url,
              method: req.method,
              pattern: pattern.source
            });
            
            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_INPUT',
                message: 'Request contains potentially malicious content',
                timestamp: new Date().toISOString()
              }
            });
          }
        }

        next();
        
      } catch (error) {
        logger.error('❌ Input validation error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: req.ip
        });
        
        res.status(500).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * Professional CSRF protection middleware
   */
  public getCSRFProtectionMiddleware() {
    if (!this.config.csrf.enabled) {
      return (req: Request, _res: Response, next: NextFunction) => next();
    }

    return (req: Request, res: Response, next: NextFunction) => {
      // Skip CSRF for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const token = req.get(this.config.csrf.headerName) || 
                   req.body?.[this.config.csrf.cookieName];

      if (!token) {
        logger.warn('🛡️ CSRF token missing', {
          ip: req.ip,
          method: req.method,
          url: req.url
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'CSRF_TOKEN_MISSING',
            message: 'CSRF token is required',
            timestamp: new Date().toISOString()
          }
        });
      }

      if (!this.validateCSRFToken(token)) {
        logger.warn('🚫 Invalid CSRF token', {
          ip: req.ip,
          method: req.method,
          url: req.url,
          token: token.substring(0, 10) + '...'
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token',
            timestamp: new Date().toISOString()
          }
        });
      }

      next();
    };
  }

  /**
   * Generate CSRF token for session
   */
  public generateCSRFToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    this.csrfTokens.set(sessionId, { token, expires });
    
    logger.debug('🎫 CSRF token generated', {
      sessionId,
      expires: expires.toISOString()
    });
    
    return token;
  }

  /**
   * Validate CSRF token
   */
  private validateCSRFToken(token: string): boolean {
    for (const [, csrfData] of this.csrfTokens.entries()) {
      if (csrfData.token === token && csrfData.expires > new Date()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Professional email validation
   */
  public validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
         return emailRegex.test(email) && 
            email.length <= 254 &&
            !this.containsSuspiciousPatterns(email);
  }

  /**
   * Professional phone validation (Uzbekistan format)
   */
  public validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }
    
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Uzbekistan phone number patterns
    const uzbekPatterns = [
      /^998\d{9}$/,     // +998XXXXXXXXX
      /^9\d{8}$/,       // 9XXXXXXXX (local format)
      /^\d{9}$/         // XXXXXXXXX (local without 9)
    ];
    
    return uzbekPatterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Professional password strength validation
   */
  public validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        score: 0,
        feedback: ['Password is required']
      };
    }

    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain lowercase letters');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain uppercase letters');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain numbers');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password must contain special characters');
    } else {
      score += 2;
    }

    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      feedback.push('Password contains common patterns');
      score = Math.max(0, score - 2);
    }

    return {
      isValid: feedback.length === 0 && score >= 4,
      score: Math.min(score, 6),
      feedback
    };
  }

  /**
   * Professional SQL injection detection
   */
  public detectSQLInjection(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    const sqlPatterns = [
      /('|(\\'))|(;|--)|(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SCRIPT|SELECT|UNION|UPDATE)\b)/gi,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\\')|((\%3B)|(;)))/i,
      /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Professional XSS detection
   */
  public detectXSS(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip suspicious keys
      if (this.containsSuspiciousPatterns(key)) {
        logger.warn('🚨 Suspicious object key detected', { key });
        continue;
      }
      
      sanitized[key] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  /**
   * Sanitize individual values
   */
  private sanitizeValue(value: any): any {
    if (typeof value !== 'string') {
      return value;
    }

    if (!this.config.validation.sanitizeInput) {
      return value;
    }

    // Remove potential XSS
    let sanitized = value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    // Basic HTML escape for critical characters
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    return sanitized;
  }

  /**
   * Check for suspicious patterns
   */
  private containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /\.\./,           // Directory traversal
      /\0/,             // Null bytes
      /\r\n/,           // CRLF injection
      /\x00-\x1F/,      // Control characters
      /__proto__/,      // Prototype pollution
      /constructor/,    // Constructor manipulation
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Clean up expired CSRF tokens
   */
  private cleanupExpiredCSRFTokens(): void {
    const now = new Date();
    let cleanupCount = 0;
    
    for (const [sessionId, csrfData] of this.csrfTokens.entries()) {
      if (csrfData.expires <= now) {
        this.csrfTokens.delete(sessionId);
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      logger.debug('🧹 CSRF tokens cleaned up', {
        cleanedCount: cleanupCount,
        remainingCount: this.csrfTokens.size
      });
    }
  }

  /**
   * Get enabled security features
   */
  private getEnabledFeatures(): string[] {
    const features: string[] = [];
    
    if (this.config.rateLimit.max > 0) features.push('Rate Limiting');
    if (this.config.cors.origins.length > 0) features.push('CORS');
    if (this.config.helmet.contentSecurityPolicy) features.push('CSP');
    if (this.config.helmet.hsts.maxAge > 0) features.push('HSTS');
    if (this.config.csrf.enabled) features.push('CSRF Protection');
    if (this.config.validation.sanitizeInput) features.push('Input Sanitization');
    
    return features;
  }

  /**
   * Validate security configuration
   */
  private validateConfiguration(): void {
    const { rateLimit, cors, helmet, csrf } = this.config;
    
    // Validate rate limit configuration
    if (rateLimit.windowMs < 1000) {
      logger.warn('⚠️ Rate limit window is very short (< 1 second)');
    }
    
    if (rateLimit.max > 1000) {
      logger.warn('⚠️ Rate limit is very high (> 1000 requests)');
    }
    
    // Validate CORS configuration
    if (cors.origins.includes('*') && cors.credentials) {
      logger.warn('⚠️ CORS wildcard with credentials is insecure');
    }
    
    // Validate HSTS configuration
    if (helmet.hsts.maxAge < 86400) {
      logger.warn('⚠️ HSTS max-age is less than 24 hours');
    }
    
    // Validate CSRF configuration
    if (csrf.enabled && !csrf.secret) {
      throw new Error('CSRF secret is required when CSRF protection is enabled');
    }
    
    logger.info('✅ Security configuration validated');
  }
}

/**
 * Create default security configuration
 */
export const createDefaultSecurityConfig = (): SecurityConfig => {
  return {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per window
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    },
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
    },
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year
        includeSubDomains: true,
        preload: true
      }
    },
    csrf: {
      enabled: process.env.CSRF_ENABLED === 'true',
      cookieName: process.env.CSRF_COOKIE_NAME || '_csrf',
      headerName: process.env.CSRF_HEADER_NAME || 'X-CSRF-Token',
      secret: process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex')
    },
    validation: {
      maxBodySize: process.env.MAX_BODY_SIZE || '1mb',
      sanitizeInput: process.env.SANITIZE_INPUT === 'true',
      strictValidation: process.env.STRICT_VALIDATION === 'true'
    }
  };
};

// Export configured instance
const defaultConfig = createDefaultSecurityConfig();
export const professionalSecurity = ProfessionalSecurityManager.getInstance(defaultConfig);

// Export individual middleware for convenience
export const rateLimitMiddleware = professionalSecurity.getRateLimitMiddleware();
export const corsMiddleware = professionalSecurity.getCORSMiddleware();
export const helmetMiddleware = professionalSecurity.getHelmetMiddleware();
export const inputValidationMiddleware = professionalSecurity.getInputValidationMiddleware();
export const csrfProtectionMiddleware = professionalSecurity.getCSRFProtectionMiddleware();

logger.info('🏗️ Professional Security Manager loaded', {
  version: '3.0.0',
  features: [
    'Advanced Rate Limiting',
    'Comprehensive CORS',
    'Security Headers (Helmet)',
    'Input Validation & Sanitization',
    'CSRF Protection',
    'XSS Detection',
    'SQL Injection Detection',
    'Password Strength Validation'
  ]
}); 