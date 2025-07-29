/**
 * 🛡️ COMPREHENSIVE INPUT VALIDATION - UltraMarket
 * 
 * Barcha input validation, XSS, SQL injection himoyasi
 * Professional security validation system
 * 
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
// import * as validator from 'validator'; // Unused import removed
import { logger } from '../logging/professional-logger';

// Initialize DOMPurify for server-side usage
const window = new JSDOM('').window;
const domPurify = DOMPurify(window as any);

// Common validation patterns for Uzbekistan
const ValidationPatterns = {
  // O'zbekiston telefon raqami
  uzbekPhoneNumber: /^\+998[0-9]{9}$/,
  
  // Email validation (more strict)
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Strong password validation
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // UUID validation
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // URL slug
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  
  // Product SKU
  sku: /^[A-Z0-9-]{3,20}$/,
  
  // Uzbekistan postal code
  postalCode: /^\d{6}$/,
  
  // Card number (basic validation)
  cardNumber: /^[0-9]{16}$/,
  
  // Safe filename
  filename: /^[a-zA-Z0-9._-]+$/
};

// Security patterns for malicious input detection
const SecurityPatterns = {
  // SQL injection patterns
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\b)\s+\d+\s*[=<>]\s*\d+/gi,
    /('|"|`)\s*(OR|AND)\s+.*?[=<>]/gi,
    /(--|#|\/\*|\*\/)/g,
    /;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)/gi,
    /UNION\s+(ALL\s+)?SELECT/gi
  ],
  
  // XSS patterns
  xssPatterns: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<form[^>]*>.*?<\/form>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:/gi,
    /on\w+\s*=/gi
  ],
  
  // Path traversal patterns
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ],
  
  // Command injection patterns
  commandInjection: [
    /[;&|`$(){}]/g,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|curl|wget|rm|cp|mv)\b/gi,
    />\s*\/\w+/g,
    /<\s*\/\w+/g
  ],
  
  // NoSQL injection patterns
  nosqlInjection: [
    /\$\w+:/g,
    /{\s*\$\w+\s*:/g,
    /\$regex/gi,
    /\$where/gi,
    /\$ne/gi
  ]
};

// Comprehensive validation schemas
export const ValidationSchemas = {
  // User schemas
  userRegistration: z.object({
    firstName: z.string()
      .min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak')
      .max(50, 'Ism 50 ta belgidan oshmasligi kerak')
      .regex(/^[a-zA-ZА-Яа-яЁё\s]+$/, 'Ismda faqat harflar bo\'lishi mumkin'),
    
    lastName: z.string()
      .min(2, 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak')
      .max(50, 'Familiya 50 ta belgidan oshmasligi kerak')
      .regex(/^[a-zA-ZА-Яа-яЁё\s]+$/, 'Familiyada faqat harflar bo\'lishi mumkin'),
    
    email: z.string()
      .email('Noto\'g\'ri email format')
      .max(255, 'Email juda uzun')
      .toLowerCase()
      .refine(email => !email.includes('+'), 'Email + belgisini o\'z ichiga olmaydi'),
    
    phone: z.string()
      .regex(ValidationPatterns.uzbekPhoneNumber, 'Noto\'g\'ri telefon raqami (+998XXXXXXXXX)'),
    
    password: z.string()
      .min(8, 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak')
      .max(128, 'Parol juda uzun')
      .regex(ValidationPatterns.strongPassword, 'Parol kuchli emas'),
    
    dateOfBirth: z.string()
      .datetime('Noto\'g\'ri sana format')
      .optional(),
    
    gender: z.enum(['male', 'female', 'other']).optional()
  }),
  
  // Product schemas
  productCreate: z.object({
    name: z.string()
      .min(3, 'Mahsulot nomi kamida 3 ta belgidan iborat bo\'lishi kerak')
      .max(200, 'Mahsulot nomi 200 ta belgidan oshmasligi kerak')
      .transform(val => domPurify.sanitize(val, { ALLOWED_TAGS: [] })),
    
    description: z.string()
      .max(5000, 'Tavsif juda uzun')
      .transform(val => domPurify.sanitize(val, { 
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: [] 
      })),
    
    price: z.number()
      .positive('Narx musbat bo\'lishi kerak')
      .max(999999999, 'Narx juda katta')
      .multipleOf(0.01, 'Narx 2 xonali bo\'lishi kerak'),
    
    categoryId: z.string()
      .uuid('Noto\'g\'ri kategoriya ID'),
    
    sku: z.string()
      .regex(ValidationPatterns.sku, 'Noto\'g\'ri SKU format')
      .optional(),
    
    tags: z.array(z.string().max(50)).max(10, 'Juda ko\'p teglar').optional(),
    
    images: z.array(z.string().url()).max(10, 'Juda ko\'p rasmlar').optional()
  }),
  
  // Order schemas
  orderCreate: z.object({
    items: z.array(z.object({
      productId: z.string().uuid('Noto\'g\'ri mahsulot ID'),
      quantity: z.number().int().positive().max(100, 'Juda ko\'p miqdor'),
      price: z.number().positive('Narx musbat bo\'lishi kerak')
    })).min(1, 'Kamida 1 ta mahsulot bo\'lishi kerak'),
    
    shippingAddress: z.object({
      street: z.string().min(5, 'Ko\'cha manzili juda qisqa').max(200),
      city: z.string().min(2).max(100),
      region: z.string().min(2).max(100),
      postalCode: z.string().regex(ValidationPatterns.postalCode, 'Noto\'g\'ri pochta indeksi'),
      country: z.literal('UZ')
    }),
    
    paymentMethod: z.enum(['click', 'payme', 'uzcard', 'card'])
  }),
  
  // Comment/Review schemas
  reviewCreate: z.object({
    productId: z.string().uuid('Noto\'g\'ri mahsulot ID'),
    rating: z.number().int().min(1, 'Reyting kamida 1').max(5, 'Reyting ko\'pi bilan 5'),
    comment: z.string()
      .max(1000, 'Sharh juda uzun')
      .transform(val => domPurify.sanitize(val, { ALLOWED_TAGS: [] }))
      .optional()
  })
};

/**
 * Advanced security validation class
 */
export class SecurityValidator {
  /**
   * Check for SQL injection patterns
   */
  static checkSQLInjection(input: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];
    
    SecurityPatterns.sqlInjection.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push(`SQL_INJECTION_PATTERN_${index + 1}`);
      }
    });
    
    return {
      isValid: threats.length === 0,
      threats
    };
  }
  
  /**
   * Check for XSS patterns
   */
  static checkXSS(input: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];
    
    SecurityPatterns.xssPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push(`XSS_PATTERN_${index + 1}`);
      }
    });
    
    return {
      isValid: threats.length === 0,
      threats
    };
  }
  
  /**
   * Check for path traversal
   */
  static checkPathTraversal(input: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];
    
    SecurityPatterns.pathTraversal.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push(`PATH_TRAVERSAL_PATTERN_${index + 1}`);
      }
    });
    
    return {
      isValid: threats.length === 0,
      threats
    };
  }
  
  /**
   * Check for command injection
   */
  static checkCommandInjection(input: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];
    
    SecurityPatterns.commandInjection.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push(`COMMAND_INJECTION_PATTERN_${index + 1}`);
      }
    });
    
    return {
      isValid: threats.length === 0,
      threats
    };
  }
  
  /**
   * Check for NoSQL injection
   */
  static checkNoSQLInjection(input: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];
    
    SecurityPatterns.nosqlInjection.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push(`NOSQL_INJECTION_PATTERN_${index + 1}`);
      }
    });
    
    return {
      isValid: threats.length === 0,
      threats
    };
  }
  
  /**
   * Sanitize HTML input
   */
  static sanitizeHTML(input: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }): string {
    const { allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br'], allowedAttributes = [] } = options || {};
    
    return domPurify.sanitize(input, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes
      // REMOVE_EMPTY_ELEMENTS: true, // Not supported in this version
      // REMOVE_DATA_PREFIX: true // Not supported in this version
    });
  }
  
  /**
   * Comprehensive security validation
   */
  static validateSecurity(input: string): { 
    isValid: boolean; 
    threats: string[]; 
    sanitized: string 
  } {
    const allThreats: string[] = [];
    
    // Check all security patterns
    const sqlCheck = this.checkSQLInjection(input);
    allThreats.push(...sqlCheck.threats);
    
    const xssCheck = this.checkXSS(input);
    allThreats.push(...xssCheck.threats);
    
    const pathCheck = this.checkPathTraversal(input);
    allThreats.push(...pathCheck.threats);
    
    const cmdCheck = this.checkCommandInjection(input);
    allThreats.push(...cmdCheck.threats);
    
    const nosqlCheck = this.checkNoSQLInjection(input);
    allThreats.push(...nosqlCheck.threats);
    
    return {
      isValid: allThreats.length === 0,
      threats: allThreats,
      sanitized: this.sanitizeHTML(input)
    };
  }
  
  /**
   * Recursively sanitize object
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeHTML(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  }
  
  /**
   * Validate file upload security
   */
  static validateFileUpload(file: {
    filename: string;
    mimetype: string;
    size: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Check filename
    if (!ValidationPatterns.filename.test(file.filename)) {
      errors.push('Fayl nomi noto\'g\'ri belgilarni o\'z ichiga oladi');
    }
    
    // Check mimetype
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('Fayl turi qo\'llab-quvvatlanmaydi');
    }
    
    // Check size
    if (file.size > maxSize) {
      errors.push('Fayl hajmi juda katta (maksimal 10MB)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Professional validation middleware factory
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Security check for all string inputs
      const checkSecurityRecursive = (obj: any): { isValid: boolean; threats: string[] } => {
        const allThreats: string[] = [];
        
        const traverse = (current: any) => {
          if (typeof current === 'string') {
            const securityCheck = SecurityValidator.validateSecurity(current);
            allThreats.push(...securityCheck.threats);
          } else if (typeof current === 'object' && current !== null) {
            Object.values(current).forEach(traverse);
          }
        };
        
        traverse(obj);
        
        return {
          isValid: allThreats.length === 0,
          threats: allThreats
        };
      };

      // Security validation
      const securityCheck = checkSecurityRecursive(req.body);
      if (!securityCheck.isValid) {
        logger.security('Security threat detected in request', 'high', {
          threats: securityCheck.threats,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          body: req.body
        });
        
        return res.status(400).json({
          success: false,
          error: {
            code: 'SECURITY_THREAT_DETECTED',
            message: 'Xavfsizlik tahdidi aniqlandi',
            threats: securityCheck.threats
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize input data
      req.body = SecurityValidator.sanitizeObject(req.body);
      
      // Schema validation
      const validatedData = schema.parse(req.body);
      req.body = validatedData;

      next();
      
    } catch (error) {
      logger.error('Request validation failed', error, {
        path: req.path,
        method: req.method,
        body: req.body,
        ip: req.ip
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Kiritilgan ma\'lumotlar noto\'g\'ri',
            details: error.issues.map(err => ({
              field: String(err.path),
              message: err.message,
              code: err.code
            }))
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validatsiya xatosi'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Rate limiting middleware
 */
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'Juda ko\'p so\'rovlar. Keyinroq qayta urinib ko\'ring.'
      }
    },
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator || ((req: Request) => {
      return req.user?.id || req.ip || 'anonymous';
    }),
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        userId: req.user?.id
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Juda ko\'p so\'rovlar. Keyinroq qayta urinib ko\'ring.',
          retryAfter: Math.round(options.windowMs / 1000)
        }
      });
    }
  });
};

// Pre-configured rate limiters
export const RateLimiters = {
  // General API
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // requests per window
    message: 'Juda ko\'p so\'rovlar'
  }),
  
  // Authentication
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 10, // requests per window
    message: 'Juda ko\'p login urinishlar'
  }),
  
  // Registration
  registration: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // requests per window
    message: 'Juda ko\'p ro\'yxatdan o\'tish urinishlar'
  }),
  
  // Password reset
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // requests per window
    message: 'Juda ko\'p parol tiklash urinishlar'
  }),
  
  // File upload
  fileUpload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // requests per window
    message: 'Juda ko\'p fayl yuklash'
  })
};

// Middleware combinations
export const SecurityMiddleware = {
  // Basic security for all routes
  basic: [
    RateLimiters.general,
    (req: Request, res: Response, next: NextFunction) => {
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Remove sensitive headers
      res.removeHeader('X-Powered-By');
      res.removeHeader('Server');
      
      next();
    }
  ],
  
  // Authentication routes
  auth: [
    RateLimiters.auth,
    validateRequest(ValidationSchemas.userRegistration.partial())
  ],
  
  // Registration routes
  registration: [
    RateLimiters.registration,
    validateRequest(ValidationSchemas.userRegistration)
  ],
  
  // Product creation
  productCreate: [
    RateLimiters.general,
    validateRequest(ValidationSchemas.productCreate)
  ],
  
  // Order creation
  orderCreate: [
    RateLimiters.general,
    validateRequest(ValidationSchemas.orderCreate)
  ]
};

export default {
  ValidationSchemas,
  SecurityValidator,
  validateRequest,
  createRateLimit,
  RateLimiters,
  SecurityMiddleware
}; 