import { Request, Response, NextFunction } from 'express';
import {
  validateAndSanitize,
  validateEmail,
  validatePassword,
} from '@ultramarket/shared/validation/validation';
import { logger } from '@ultramarket/shared/logging/logger';

/**
 * Request validation middleware
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schema.body) {
        req.body = validateAndSanitize(req.body, schema.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = validateAndSanitize(req.query, schema.query);
      }

      // Validate path parameters
      if (schema.params) {
        req.params = validateAndSanitize(req.params, schema.params);
      }

      next();
    } catch (error) {
      logger.warn('Request validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
        body: req.body,
      });

      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Validation failed',
        errors: getValidationErrors(error),
      });
    }
  };
};

/**
 * Email validation middleware
 */
export const validateEmailField = (fieldName: string = 'email') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const email = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];

    if (!email) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required`,
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${fieldName} format`,
      });
    }

    next();
  };
};

/**
 * Password validation middleware
 */
export const validatePasswordField = (fieldName: string = 'password') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const password = req.body[fieldName];

    if (!password) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required`,
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be at least 8 characters long with uppercase, lowercase, number, and special character`,
      });
    }

    next();
  };
};

/**
 * Required fields validation middleware
 */
export const requireFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!req.body[field] && !req.query[field] && !req.params[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * String length validation middleware
 */
export const validateStringLength = (fieldName: string, minLength?: number, maxLength?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];

    if (!value) {
      return next();
    }

    if (typeof value !== 'string') {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a string`,
      });
    }

    if (minLength && value.length < minLength) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be at least ${minLength} characters long`,
      });
    }

    if (maxLength && value.length > maxLength) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be no more than ${maxLength} characters long`,
      });
    }

    next();
  };
};

/**
 * Number validation middleware
 */
export const validateNumberField = (fieldName: string, min?: number, max?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];

    if (!value) {
      return next();
    }

    const numValue = Number(value);

    if (isNaN(numValue)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a valid number`,
      });
    }

    if (min !== undefined && numValue < min) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be at least ${min}`,
      });
    }

    if (max !== undefined && numValue > max) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be no more than ${max}`,
      });
    }

    next();
  };
};

/**
 * Array validation middleware
 */
export const validateArrayField = (fieldName: string, minLength?: number, maxLength?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];

    if (!value) {
      return next();
    }

    if (!Array.isArray(value)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be an array`,
      });
    }

    if (minLength && value.length < minLength) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must have at least ${minLength} items`,
      });
    }

    if (maxLength && value.length > maxLength) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must have no more than ${maxLength} items`,
      });
    }

    next();
  };
};

/**
 * UUID validation middleware
 */
export const validateUuidField = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];

    if (!value) {
      return next();
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a valid UUID`,
      });
    }

    next();
  };
};

/**
 * Date validation middleware
 */
export const validateDateField = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];

    if (!value) {
      return next();
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a valid date`,
      });
    }

    next();
  };
};

/**
 * Boolean validation middleware
 */
export const validateBooleanField = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];

    if (!value) {
      return next();
    }

    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a boolean`,
      });
    }

    // Convert string to boolean if needed
    if (typeof value === 'string') {
      if (req.body[fieldName]) {
        req.body[fieldName] = value === 'true';
      } else if (req.query[fieldName]) {
        (req.query as any)[fieldName] = value === 'true';
      } else if (req.params[fieldName]) {
        req.params[fieldName] = value === 'true';
      }
    }

    next();
  };
};

/**
 * Extract validation errors from error message
 */
function getValidationErrors(error: any): string[] {
  if (error instanceof Error) {
    return [error.message];
  }
  return ['Validation failed'];
}
