import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { logger } from '../logging/logger';

// Rate limiting configurations
export const rateLimitConfigs = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Authentication rate limiting (stricter)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
      error: 'Too many login attempts from this IP, please try again later.',
      retryAfter: 15 * 60,
    },
    skipSuccessfulRequests: true,
  }),

  // File upload rate limiting
  fileUpload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 file uploads per hour
    message: {
      error: 'Too many file upload attempts.',
      retryAfter: 60 * 60,
    },
  }),
};

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Input validation utilities
export class SecurityValidator {
  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate phone number (Uzbekistan format)
  static isValidUzbekPhone(phone: string): boolean {
    const uzbekPhoneRegex = /^\+998[0-9]{9}$/;
    return uzbekPhoneRegex.test(phone);
  }

  // Validate password strength
  static isStrongPassword(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*]/.test(password)
    );
  }

  // Sanitize string input
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input.trim().replace(/[<>]/g, '').replace(/['"]/g, '').substring(0, 1000);
  }
}

// Security audit logging
export class SecurityAudit {
  static logSecurityEvent(event: string, details: Record<string, any>): void {
    logger.warn('Security Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  static logAuthAttempt(email: string, ip: string, success: boolean): void {
    this.logSecurityEvent('AUTH_ATTEMPT', {
      email,
      ip,
      success,
    });
  }

  static logSuspiciousActivity(description: string, ip: string): void {
    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      description,
      ip,
    });
  }
}

// Encryption utilities
export class SecurityCrypto {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate secure token
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate API key
  static generateApiKey(): string {
    const prefix = 'uk_';
    const randomPart = crypto.randomBytes(24).toString('hex');
    return `${prefix}${randomPart}`;
  }
}

// SQL injection protection middleware
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /['";\x00\x1a]/,
  ];

  const checkSqlInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return sqlPatterns.some((pattern) => pattern.test(obj));
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some((value) => checkSqlInjection(value));
    }

    return false;
  };

  if (checkSqlInjection(req.body) || checkSqlInjection(req.query)) {
    SecurityAudit.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
      ip: req.ip,
      endpoint: req.path,
      method: req.method,
    });

    res.status(400).json({
      success: false,
      error: 'Invalid request detected',
    });
    return;
  }

  next();
};

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
  ];

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      let sanitized = obj;
      xssPatterns.forEach((pattern) => {
        sanitized = sanitized.replace(pattern, '');
      });
      return sanitized;
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);

  next();
};

// Export security middleware bundle
export const securityMiddleware = {
  rateLimit: rateLimitConfigs,
  headers: securityHeaders,
  sqlInjectionProtection,
  xssProtection,
};
