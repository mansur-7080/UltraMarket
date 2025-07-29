import { Request, Response, NextFunction } from 'express';
// import { logger } from '@ultramarket/shared/logging/logger';
const logger = console;
// If ApiError is used, define it locally:
class ApiError extends Error {
  constructor(public statusCode: number, public override message: string) {
    super(message);
  }
}

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'email';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[];
  email?: boolean;
  pattern?: RegExp;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Simple validation function
 */
export const validateRequest = (req: Request, schema: ValidationSchema): ValidationResult => {
  const errors: string[] = [];
  const body = req.body || {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = body[field];

    // Check if required field is missing
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is not required and not provided
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rule.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`);
      continue;
    }

    if (rule.type === 'number' && typeof value !== 'number') {
      errors.push(`${field} must be a number`);
      continue;
    }

    if (rule.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${field} must be a boolean`);
      continue;
    }

    // String-specific validations
    if (rule.type === 'string' && typeof value === 'string') {
      // Length validations
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters long`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must be no more than ${rule.maxLength} characters long`);
      }

      // Email validation
      if (rule.email || (rule.type as string) === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field} must be a valid email address`);
        }
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }

    // Number-specific validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${field} must be no more than ${rule.max}`);
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Middleware to validate request body
 */
export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validation = validateRequest(req, schema);

    if (!validation.isValid) {
      logger.warn('Request validation failed', {
        errors: validation.errors,
        path: req.path,
        method: req.method,
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    return next();
  };
};

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validation = validateRequest({ body: req.query } as Request, schema);

    if (!validation.isValid) {
      logger.warn('Query validation failed', {
        errors: validation.errors,
        path: req.path,
        method: req.method,
      });

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: validation.errors,
      });
    }

    return next();
  };
};

/**
 * Middleware to validate URL parameters
 */
export const validateParams = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validation = validateRequest({ body: req.params } as Request, schema);

    if (!validation.isValid) {
      logger.warn('Parameter validation failed', {
        errors: validation.errors,
        path: req.path,
        method: req.method,
      });

      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors: validation.errors,
      });
    }

    return next();
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  pagination: {
    page: { type: 'number', required: false, min: 1 },
    limit: { type: 'number', required: false, min: 1, max: 100 },
  },
  email: {
    email: { type: 'string', required: true, email: true },
  },
  password: {
    password: { type: 'string', required: true, minLength: 8 },
  },
  id: {
    id: { type: 'string', required: true, minLength: 1 },
  },
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Remove undefined and null values
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === undefined || req.body[key] === null) {
        delete req.body[key];
      }
    });

    // Trim string values
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  return next();
};

/**
 * Middleware to validate content type
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.get('Content-Type');

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be application/json',
      });
    }
  }

  return next();
};
