/**
 * 🛡️ ULTRA PROFESSIONAL INPUT VALIDATION SYSTEM
 * UltraMarket E-commerce Platform
 * 
 * Comprehensive protection against:
 * - SQL Injection attacks
 * - XSS (Cross-Site Scripting)
 * - NoSQL Injection
 * - Command Injection
 * - Path Traversal
 * - LDAP Injection
 * - File Upload attacks
 * - Data validation and sanitization
 * 
 * @author UltraMarket Security Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/ultra-professional-logger';

// Professional TypeScript interfaces
export interface ValidationResult {
  isValid: boolean;
  data?: any;
  errors: ValidationError[];
  securityThreats: SecurityThreat[];
  sanitizedData?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SecurityThreat {
  type: 'SQL_INJECTION' | 'XSS' | 'NOSQL_INJECTION' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'LDAP_INJECTION';
  field: string;
  payload: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  blocked: boolean;
}

export interface ValidationOptions {
  sanitize: boolean;
  strictMode: boolean;
  allowHtml: boolean;
  logThreats: boolean;
  blockOnThreat: boolean;
  maxStringLength: number;
  maxArrayLength: number;
  maxObjectDepth: number;
}

export interface FileValidationOptions {
  maxSize: number; // bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  scanForMalware: boolean;
  checkMagicBytes: boolean;
}

/**
 * Ultra Professional Input Validator
 */
export class UltraProfessionalValidator {
  private options: ValidationOptions;
  private securityPatterns: Map<string, RegExp[]>;

  constructor(options: Partial<ValidationOptions> = {}) {
    this.options = {
      sanitize: true,
      strictMode: true,
      allowHtml: false,
      logThreats: true,
      blockOnThreat: true,
      maxStringLength: 10000,
      maxArrayLength: 1000,
      maxObjectDepth: 10,
      ...options
    };

    // Initialize security threat patterns
    this.initializeSecurityPatterns();

    logger.security('🛡️ Ultra Professional Validator initialized', {
      strictMode: this.options.strictMode,
      sanitization: this.options.sanitize,
      threatLogging: this.options.logThreats
    });
  }

  /**
   * Initialize comprehensive security threat patterns
   */
  private initializeSecurityPatterns(): void {
    this.securityPatterns = new Map();

    // SQL Injection patterns (enhanced)
    this.securityPatterns.set('SQL_INJECTION', [
      // Classic SQL injection
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(UNION.*SELECT|SELECT.*FROM|INSERT.*INTO|UPDATE.*SET)/gi,
      /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/gi,
      /(\'|\"|`|;|--|\*|\/\*|\*\/)/g,
      
      // Advanced SQL injection
      /(\bxp_cmdshell\b|\bsp_executesql\b)/gi,
      /(waitfor\s+delay|benchmark\s*\(|sleep\s*\()/gi,
      /(information_schema|mysql\.user|pg_user)/gi,
      /(load_file\s*\(|into\s+outfile|into\s+dumpfile)/gi,
      
      // Blind SQL injection
      /(\d+\s*=\s*\d+|\'\s*=\s*\'|\".*\"\s*=\s*\".*\")/gi,
      /(true|false)\s*=\s*(true|false)/gi,
      /(if\s*\(|case\s+when|decode\s*\()/gi,
      
      // Time-based SQL injection
      /(sleep\s*\(\s*\d+\s*\)|pg_sleep\s*\(\s*\d+\s*\))/gi,
      /(waitfor\s+delay\s+[\'\"][\d:]+[\'\"])/gi,
      /(dbms_lock\.sleep\s*\(\s*\d+\s*\))/gi
    ]);

    // XSS patterns (comprehensive)
    this.securityPatterns.set('XSS', [
      // Script tags
      /<script[^>]*>.*?<\/script>/gis,
      /<script[^>]*>/gi,
      
      // Event handlers
      /on\w+\s*=\s*["\'].*?["\']|on\w+\s*=\s*[^>\s]*/gi,
      /(onload|onclick|onmouseover|onerror|onblur|onfocus|onchange|onsubmit)/gi,
      
      // JavaScript protocols
      /javascript\s*:/gi,
      /vbscript\s*:/gi,
      /data\s*:/gi,
      
      // HTML injection
      /<iframe[^>]*>.*?<\/iframe>/gis,
      /<object[^>]*>.*?<\/object>/gis,
      /<embed[^>]*>.*?<\/embed>/gis,
      /<applet[^>]*>.*?<\/applet>/gis,
      /<meta[^>]*>/gi,
      /<link[^>]*>/gi,
      
      // CSS injection
      /expression\s*\(/gi,
      /@import\s*["\'].*?["\']/gi,
      /style\s*=\s*["\'].*?["\'].*?(javascript|expression|behavior)/gi,
      
      // Advanced XSS
      /&#\d+;/g, // HTML entities
      /\\u[0-9a-fA-F]{4}/g, // Unicode escapes
      /\\x[0-9a-fA-F]{2}/g, // Hex escapes
      /%[0-9a-fA-F]{2}/g // URL encoding
    ]);

    // NoSQL Injection patterns
    this.securityPatterns.set('NOSQL_INJECTION', [
      /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists)/gi,
      /(\$or|\$and|\$not|\$nor)/gi,
      /(this\s*\.\s*\w+|function\s*\(|new\s+RegExp)/gi,
      /(\$eval|\$function|\$accumulator|\$reduce)/gi,
      /(ObjectId\s*\(|ISODate\s*\(|NumberLong\s*\()/gi
    ]);

    // Command Injection patterns
    this.securityPatterns.set('COMMAND_INJECTION', [
      /[;&|`$()]/g,
      /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|curl|wget|nc|nmap)\b/gi,
      /\b(rm|del|copy|move|mkdir|rmdir|chmod|chown)\b/gi,
      /\b(ping|tracert|nslookup|dig|host)\b/gi,
      /(>|<|>>|<<|\|)/g,
      /(\$\{|\$\(|`)/g
    ]);

    // Path Traversal patterns
    this.securityPatterns.set('PATH_TRAVERSAL', [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /\.\.\\?\//g,
      /(\/etc\/passwd|\/etc\/shadow|\/etc\/hosts)/gi,
      /(\\windows\\system32|\\windows\\system)/gi,
      /(proc\/self\/environ|proc\/version|proc\/cmdline)/gi
    ]);

    // LDAP Injection patterns
    this.securityPatterns.set('LDAP_INJECTION', [
      /[\(\)\*\&\|\!\=\<\>\~]/g,
      /(objectClass\s*=|cn\s*=|uid\s*=|mail\s*=)/gi,
      /(\|\s*\(|\&\s*\(|\!\s*\()/gi
    ]);
  }

  /**
   * Validate data with comprehensive security checks
   */
  public async validate<T>(
    data: any,
    schema: z.ZodSchema<T>,
    options: Partial<ValidationOptions> = {}
  ): Promise<ValidationResult> {
    const validationOptions = { ...this.options, ...options };
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      securityThreats: []
    };

    try {
      // Step 1: Security threat detection
      const threats = await this.detectSecurityThreats(data);
      result.securityThreats = threats;

      // Block if critical threats found and blocking is enabled
      if (validationOptions.blockOnThreat && threats.some(t => t.severity === 'CRITICAL')) {
        result.errors.push({
          field: 'security',
          message: 'Critical security threats detected',
          code: 'SECURITY_THREAT_BLOCKED',
          severity: 'CRITICAL'
        });

        // Log security incident
        if (validationOptions.logThreats) {
          logger.security('🚨 CRITICAL SECURITY THREAT BLOCKED', {
            threats: threats.filter(t => t.severity === 'CRITICAL'),
            data: this.sanitizeForLogging(data)
          });
        }

        return result;
      }

      // Step 2: Data sanitization (if enabled)
      let sanitizedData = data;
      if (validationOptions.sanitize) {
        sanitizedData = await this.sanitizeData(data, validationOptions);
        result.sanitizedData = sanitizedData;
      }

      // Step 3: Schema validation
      const schemaResult = schema.safeParse(sanitizedData);
      
      if (schemaResult.success) {
        result.isValid = true;
        result.data = schemaResult.data;
      } else {
        result.errors = schemaResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          severity: 'MEDIUM' as const
        }));
      }

      // Step 4: Additional custom validations
      const customValidationErrors = await this.performCustomValidations(sanitizedData, validationOptions);
      result.errors.push(...customValidationErrors);

      // Update validity based on all checks
      result.isValid = result.errors.length === 0;

      // Log validation result
      if (validationOptions.logThreats && (threats.length > 0 || !result.isValid)) {
        logger.warn('🔍 Validation completed with issues', {
          isValid: result.isValid,
          errorsCount: result.errors.length,
          threatsCount: threats.length,
          sanitized: validationOptions.sanitize
        });
      }

      return result;

    } catch (error) {
      logger.error('❌ Validation process failed', error);
      result.errors.push({
        field: 'system',
        message: 'Validation system error',
        code: 'VALIDATION_SYSTEM_ERROR',
        severity: 'HIGH'
      });
      return result;
    }
  }

  /**
   * Detect security threats in data
   */
  private async detectSecurityThreats(data: any, path: string = ''): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    if (typeof data === 'string') {
      // Check string for security patterns
      for (const [threatType, patterns] of this.securityPatterns.entries()) {
        for (const pattern of patterns) {
          const matches = data.match(pattern);
          if (matches) {
            threats.push({
              type: threatType as any,
              field: path || 'root',
              payload: matches[0],
              severity: this.calculateThreatSeverity(threatType, matches[0]),
              description: `Potential ${threatType.toLowerCase()} detected`,
              blocked: false
            });
          }
        }
      }
    } else if (Array.isArray(data)) {
      // Recursively check array elements
      for (let i = 0; i < data.length; i++) {
        const nestedThreats = await this.detectSecurityThreats(data[i], `${path}[${i}]`);
        threats.push(...nestedThreats);
      }
    } else if (typeof data === 'object' && data !== null) {
      // Recursively check object properties
      for (const [key, value] of Object.entries(data)) {
        const nestedPath = path ? `${path}.${key}` : key;
        const nestedThreats = await this.detectSecurityThreats(value, nestedPath);
        threats.push(...nestedThreats);
      }
    }

    return threats;
  }

  /**
   * Calculate threat severity
   */
  private calculateThreatSeverity(threatType: string, payload: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical patterns
    const criticalPatterns = [
      /drop\s+table/gi,
      /delete\s+from/gi,
      /truncate\s+table/gi,
      /<script[^>]*>.*?<\/script>/gi,
      /xp_cmdshell/gi,
      /sp_executesql/gi
    ];

    // High severity patterns
    const highPatterns = [
      /union.*select/gi,
      /select.*from/gi,
      /insert.*into/gi,
      /update.*set/gi,
      /on\w+\s*=/gi,
      /javascript:/gi
    ];

    for (const pattern of criticalPatterns) {
      if (pattern.test(payload)) return 'CRITICAL';
    }

    for (const pattern of highPatterns) {
      if (pattern.test(payload)) return 'HIGH';
    }

    // Check payload length and complexity
    if (payload.length > 100 || /[<>&"']/g.test(payload)) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Sanitize data recursively
   */
  private async sanitizeData(data: any, options: ValidationOptions): Promise<any> {
    if (typeof data === 'string') {
      return this.sanitizeString(data, options);
    } else if (Array.isArray(data)) {
      if (data.length > options.maxArrayLength) {
        throw new Error(`Array length exceeds maximum allowed: ${options.maxArrayLength}`);
      }
      return Promise.all(data.map(item => this.sanitizeData(item, options)));
    } else if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const sanitizedKey = this.sanitizeString(key, options);
        sanitized[sanitizedKey] = await this.sanitizeData(value, options);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Sanitize string with comprehensive cleaning
   */
  private sanitizeString(str: string, options: ValidationOptions): string {
    if (str.length > options.maxStringLength) {
      throw new Error(`String length exceeds maximum allowed: ${options.maxStringLength}`);
    }

    let sanitized = str;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // HTML sanitization
    if (!options.allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
    } else {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: []
      });
    }

    // Remove dangerous characters for SQL injection
    if (options.strictMode) {
      sanitized = sanitized.replace(/['"`;\\]/g, '');
    }

    // Encode special characters
    sanitized = validator.escape(sanitized);

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  /**
   * Perform custom validations
   */
  private async performCustomValidations(
    data: any,
    options: ValidationOptions
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check for suspicious patterns
    if (typeof data === 'object' && data !== null) {
      // Check for prototype pollution
      if ('__proto__' in data || 'constructor' in data || 'prototype' in data) {
        errors.push({
          field: 'object',
          message: 'Prototype pollution attempt detected',
          code: 'PROTOTYPE_POLLUTION',
          severity: 'CRITICAL'
        });
      }

      // Check object depth
      if (this.getObjectDepth(data) > options.maxObjectDepth) {
        errors.push({
          field: 'object',
          message: `Object depth exceeds maximum allowed: ${options.maxObjectDepth}`,
          code: 'OBJECT_DEPTH_EXCEEDED',
          severity: 'MEDIUM'
        });
      }
    }

    return errors;
  }

  /**
   * Calculate object depth
   */
  private getObjectDepth(obj: any, depth = 0): number {
    if (typeof obj !== 'object' || obj === null || depth > 50) {
      return depth;
    }

    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      const currentDepth = this.getObjectDepth(value, depth + 1);
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    return maxDepth;
  }

  /**
   * Validate file uploads
   */
  public async validateFile(
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    options: FileValidationOptions
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      securityThreats: []
    };

    try {
      // Check file size
      if (file.size > options.maxSize) {
        result.errors.push({
          field: 'file.size',
          message: `File size exceeds maximum allowed: ${options.maxSize} bytes`,
          code: 'FILE_SIZE_EXCEEDED',
          severity: 'MEDIUM'
        });
      }

      // Check file extension
      const extension = file.originalname.split('.').pop()?.toLowerCase();
      if (extension && !options.allowedExtensions.includes(extension)) {
        result.errors.push({
          field: 'file.extension',
          message: `File extension not allowed: ${extension}`,
          code: 'INVALID_FILE_EXTENSION',
          severity: 'HIGH'
        });
      }

      // Check MIME type
      if (!options.allowedTypes.includes(file.mimetype)) {
        result.errors.push({
          field: 'file.mimetype',
          message: `File type not allowed: ${file.mimetype}`,
          code: 'INVALID_FILE_TYPE',
          severity: 'HIGH'
        });
      }

      // Check magic bytes (file signature)
      if (options.checkMagicBytes) {
        const isValidSignature = this.validateFileSignature(file.buffer, file.mimetype);
        if (!isValidSignature) {
          result.securityThreats.push({
            type: 'XSS', // Could be a disguised malicious file
            field: 'file.signature',
            payload: file.originalname,
            severity: 'HIGH',
            description: 'File signature does not match declared MIME type',
            blocked: true
          });
        }
      }

      // Scan filename for path traversal
      if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        result.securityThreats.push({
          type: 'PATH_TRAVERSAL',
          field: 'file.filename',
          payload: file.originalname,
          severity: 'HIGH',
          description: 'Filename contains path traversal characters',
          blocked: true
        });
      }

      // Basic malware signature check (simplified)
      if (options.scanForMalware) {
        const malwareDetected = this.basicMalwareCheck(file.buffer);
        if (malwareDetected) {
          result.securityThreats.push({
            type: 'XSS', // Generic threat type for malware
            field: 'file.content',
            payload: 'Potential malware signature detected',
            severity: 'CRITICAL',
            description: 'File contains potential malware signatures',
            blocked: true
          });
        }
      }

      result.isValid = result.errors.length === 0 && 
                      !result.securityThreats.some(t => t.blocked);

      return result;

    } catch (error) {
      logger.error('❌ File validation failed', error);
      result.errors.push({
        field: 'file',
        message: 'File validation system error',
        code: 'FILE_VALIDATION_ERROR',
        severity: 'HIGH'
      });
      return result;
    }
  }

  /**
   * Validate file signature against MIME type
   */
  private validateFileSignature(buffer: Buffer, mimeType: string): boolean {
    const signatures: { [key: string]: number[][] } = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
      'text/plain': [], // Skip signature check for text files
      'application/json': [] // Skip signature check for JSON
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures || expectedSignatures.length === 0) {
      return true; // Skip validation for unknown or text types
    }

    return expectedSignatures.some(signature => {
      return signature.every((byte, index) => buffer[index] === byte);
    });
  }

  /**
   * Basic malware signature check
   */
  private basicMalwareCheck(buffer: Buffer): boolean {
    const malwareSignatures = [
      'eval(',
      'base64_decode',
      'shell_exec',
      'system(',
      'exec(',
      'passthru(',
      'file_get_contents',
      'fopen(',
      'fwrite(',
      'chmod(',
      '<?php',
      '<script>',
      'javascript:',
      'vbscript:'
    ];

    const content = buffer.toString('utf8').toLowerCase();
    return malwareSignatures.some(signature => content.includes(signature));
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private sanitizeForLogging(data: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = typeof value === 'object' ? this.sanitizeForLogging(value) : value;
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Create validation middleware for Express.js
   */
  public createMiddleware<T>(
    schema: z.ZodSchema<T>,
    options: Partial<ValidationOptions & { source: 'body' | 'query' | 'params' }> = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const source = options.source || 'body';
        const data = req[source];

        const result = await this.validate(data, schema, options);

        if (!result.isValid) {
          logger.warn('🚫 Request validation failed', {
            url: req.url,
            method: req.method,
            errors: result.errors,
            threats: result.securityThreats,
            ip: req.ip
          });

          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Request validation failed',
              details: result.errors,
              securityThreats: options.logThreats ? result.securityThreats : undefined
            }
          });
          return;
        }

        // Attach validated data to request
        if (result.sanitizedData) {
          req[source] = result.sanitizedData;
        }

        next();

      } catch (error) {
        logger.error('❌ Validation middleware error', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'VALIDATION_SYSTEM_ERROR',
            message: 'Validation system error'
          }
        });
      }
    };
  }
}

// Zod schema definitions for common UltraMarket entities
export const UltraMarketSchemas = {
  // User validation schemas
  userRegistration: z.object({
    email: z.string().email('Invalid email format').max(255),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
             'Password must contain uppercase, lowercase, number and special character'),
    firstName: z.string().min(1).max(50).regex(/^[a-zA-ZА-Яа-яЁё\s]+$/, 'Invalid name format'),
    lastName: z.string().min(1).max(50).regex(/^[a-zA-ZА-Яа-яЁё\s]+$/, 'Invalid name format'),
    phone: z.string().regex(/^\+998[0-9]{9}$/, 'Invalid Uzbekistan phone number format'),
    dateOfBirth: z.string().date().optional(),
    region: z.enum(['UZ', 'RU', 'EN']).optional()
  }),

  userLogin: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    deviceId: z.string().uuid('Invalid device ID format').optional(),
    rememberMe: z.boolean().optional()
  }),

  // Product validation schemas
  product: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000),
    price: z.number().min(0).max(1000000000), // Max 1 billion UZS
    currency: z.enum(['UZS', 'USD', 'EUR']).default('UZS'),
    categoryId: z.string().uuid('Invalid category ID'),
    brandId: z.string().uuid('Invalid brand ID').optional(),
    sku: z.string().regex(/^[A-Z0-9-]{3,20}$/, 'Invalid SKU format'),
    images: z.array(z.string().url()).max(10),
    specifications: z.record(z.string()).optional(),
    tags: z.array(z.string()).max(20).optional(),
    weight: z.number().min(0).optional(),
    dimensions: z.object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0)
    }).optional()
  }),

  // Order validation schemas
  order: z.object({
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).max(100),
      price: z.number().min(0)
    })).min(1).max(50),
    shippingAddress: z.object({
      street: z.string().min(1).max(200),
      city: z.string().min(1).max(100),
      region: z.string().min(1).max(100),
      postalCode: z.string().regex(/^[0-9]{6}$/, 'Invalid postal code'),
      country: z.string().default('UZ')
    }),
    paymentMethod: z.enum(['click', 'payme', 'uzcard', 'cash_on_delivery']),
    notes: z.string().max(500).optional()
  }),

  // File upload validation
  fileUpload: z.object({
    originalname: z.string().min(1).max(255),
    mimetype: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
    size: z.number().min(1).max(10 * 1024 * 1024) // 10MB max
  })
};

// Export default configured instance
export const validator = new UltraProfessionalValidator({
  sanitize: true,
  strictMode: process.env.NODE_ENV === 'production',
  allowHtml: false,
  logThreats: true,
  blockOnThreat: true,
  maxStringLength: parseInt(process.env.MAX_STRING_LENGTH || '10000'),
  maxArrayLength: parseInt(process.env.MAX_ARRAY_LENGTH || '1000'),
  maxObjectDepth: parseInt(process.env.MAX_OBJECT_DEPTH || '10')
});

// File validation options for different types
export const FileValidationOptions = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    scanForMalware: true,
    checkMagicBytes: true
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword'],
    allowedExtensions: ['pdf', 'txt', 'doc', 'docx'],
    scanForMalware: true,
    checkMagicBytes: true
  },
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png'],
    allowedExtensions: ['jpg', 'jpeg', 'png'],
    scanForMalware: false,
    checkMagicBytes: true
  }
}; 