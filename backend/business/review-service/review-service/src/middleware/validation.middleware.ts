import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  skipFunctions?: boolean;
  convert?: boolean;
}

/**
 * Generic validation middleware factory
 */
export const validateRequest = (schema: Joi.ObjectSchema, options: ValidationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationOptions: Joi.ValidationOptions = {
        abortEarly: options.abortEarly ?? false,
        allowUnknown: options.allowUnknown ?? false,
        stripUnknown: options.stripUnknown ?? true,
        skipFunctions: options.skipFunctions ?? true,
        convert: options.convert ?? true,
      };

      const { error, value } = schema.validate(req.body, validationOptions);

      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          type: detail.type,
        }));

        logger.warn('Validation failed', {
          route: req.path,
          method: req.method,
          errors: validationErrors,
          body: req.body,
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
        return;
      }

      // Replace request body with validated and sanitized data
      req.body = value;

      logger.debug('Validation successful', {
        route: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema, options: ValidationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationOptions: Joi.ValidationOptions = {
        abortEarly: options.abortEarly ?? false,
        allowUnknown: options.allowUnknown ?? true,
        stripUnknown: options.stripUnknown ?? true,
        skipFunctions: options.skipFunctions ?? true,
        convert: options.convert ?? true,
      };

      const { error, value } = schema.validate(req.query, validationOptions);

      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          type: detail.type,
        }));

        logger.warn('Query validation failed', {
          route: req.path,
          method: req.method,
          errors: validationErrors,
          query: req.query,
        });

        res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: validationErrors,
        });
        return;
      }

      // Replace request query with validated and sanitized data
      req.query = value;

      logger.debug('Query validation successful', {
        route: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('Query validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Query validation error',
        error: 'VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Validate URL parameters
 */
export const validateParams = (schema: Joi.ObjectSchema, options: ValidationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationOptions: Joi.ValidationOptions = {
        abortEarly: options.abortEarly ?? false,
        allowUnknown: options.allowUnknown ?? false,
        stripUnknown: options.stripUnknown ?? true,
        skipFunctions: options.skipFunctions ?? true,
        convert: options.convert ?? true,
      };

      const { error, value } = schema.validate(req.params, validationOptions);

      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          type: detail.type,
        }));

        logger.warn('Params validation failed', {
          route: req.path,
          method: req.method,
          errors: validationErrors,
          params: req.params,
        });

        res.status(400).json({
          success: false,
          message: 'Parameters validation failed',
          errors: validationErrors,
        });
        return;
      }

      // Replace request params with validated and sanitized data
      req.params = value;

      logger.debug('Params validation successful', {
        route: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('Params validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Parameters validation error',
        error: 'VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Comprehensive validation middleware (body, query, params)
 */
export const validateAll = (
  schemas: {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
  },
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationOptions: Joi.ValidationOptions = {
        abortEarly: options.abortEarly ?? false,
        allowUnknown: options.allowUnknown ?? false,
        stripUnknown: options.stripUnknown ?? true,
        skipFunctions: options.skipFunctions ?? true,
        convert: options.convert ?? true,
      };

      const errors: any[] = [];

      // Validate body
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, validationOptions);
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'body',
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value,
              type: detail.type,
            }))
          );
        } else {
          req.body = value;
        }
      }

      // Validate query
      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, {
          ...validationOptions,
          allowUnknown: true, // Allow unknown query parameters
        });
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'query',
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value,
              type: detail.type,
            }))
          );
        } else {
          req.query = value;
        }
      }

      // Validate params
      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, validationOptions);
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'params',
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value,
              type: detail.type,
            }))
          );
        } else {
          req.params = value;
        }
      }

      if (errors.length > 0) {
        logger.warn('Comprehensive validation failed', {
          route: req.path,
          method: req.method,
          errors,
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }

      logger.debug('Comprehensive validation successful', {
        route: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('Comprehensive validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Sanitize HTML content
 */
export const sanitizeHtml = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const sanitizeString = (str: string): string => {
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }

      return obj;
    };

    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    logger.debug('HTML sanitization completed', {
      route: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error('HTML sanitization error:', error);
    next(); // Continue on error
  }
};

/**
 * Validate file uploads
 */
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  required?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxFiles = 5,
        required = false,
      } = options;

      const files = req.files as Express.Multer.File[] | undefined;

      if (required && (!files || files.length === 0)) {
        res.status(400).json({
          success: false,
          message: 'File upload is required',
          error: 'FILE_REQUIRED',
        });
        return;
      }

      if (files && files.length > 0) {
        if (files.length > maxFiles) {
          res.status(400).json({
            success: false,
            message: `Maximum ${maxFiles} files allowed`,
            error: 'TOO_MANY_FILES',
          });
          return;
        }

        for (const file of files) {
          if (file.size > maxSize) {
            res.status(400).json({
              success: false,
              message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
              error: 'FILE_TOO_LARGE',
            });
            return;
          }

          if (!allowedTypes.includes(file.mimetype)) {
            res.status(400).json({
              success: false,
              message: `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
              error: 'INVALID_FILE_TYPE',
            });
            return;
          }
        }
      }

      logger.debug('File upload validation successful', {
        route: req.path,
        method: req.method,
        fileCount: files?.length || 0,
      });

      next();
    } catch (error) {
      logger.error('File upload validation error:', error);
      res.status(500).json({
        success: false,
        message: 'File validation error',
        error: 'FILE_VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Rate limiting validation
 */
export const validateRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const rateLimitHeaders = {
      'X-RateLimit-Limit': res.getHeader('X-RateLimit-Limit'),
      'X-RateLimit-Remaining': res.getHeader('X-RateLimit-Remaining'),
      'X-RateLimit-Reset': res.getHeader('X-RateLimit-Reset'),
    };

    // Check if rate limit headers are present
    if (rateLimitHeaders['X-RateLimit-Remaining'] === '0') {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        route: req.path,
        method: req.method,
        headers: rateLimitHeaders,
      });

      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitHeaders['X-RateLimit-Reset'],
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Rate limit validation error:', error);
    next(); // Continue on error
  }
};

/**
 * Custom validation error handler
 */
export const handleValidationError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof ValidationError) {
    logger.warn('Validation error handled', {
      route: req.path,
      method: req.method,
      error: error.message,
      details: error.details,
    });

    res.status(400).json({
      success: false,
      message: error.message,
      error: 'VALIDATION_ERROR',
      details: error.details,
    });
    return;
  }

  next(error);
};

export default validateRequest;
