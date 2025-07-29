/**
 * UltraMarket Shared - Request Validator
 * Professional request validation utilities
 */

import Joi from 'joi';
import { ApiError } from '../errors/api-error';

export interface ValidationResult<T> {
  error?: Joi.ValidationError;
  value: T;
}

/**
 * Validate request body against a Joi schema
 */
export function validateRequest<T>(data: any, schema: Joi.ObjectSchema<T>): ValidationResult<T> {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    errors: {
      wrap: {
        label: false,
      },
    },
  });

  return { error, value };
}

/**
 * Validate request body and throw error if invalid
 */
export function validateRequestOrThrow<T>(data: any, schema: Joi.ObjectSchema<T>): T {
  const { error, value } = validateRequest(data, schema);

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type,
    }));

    throw new ApiError(400, 'Validation error', details);
  }

  return value;
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(query: any, schema: Joi.ObjectSchema<T>): ValidationResult<T> {
  return validateRequest(query, schema);
}

/**
 * Validate query parameters and throw error if invalid
 */
export function validateQueryOrThrow<T>(query: any, schema: Joi.ObjectSchema<T>): T {
  const { error, value } = validateQuery(query, schema);

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type,
    }));

    throw new ApiError(400, 'Invalid query parameters', details);
  }

  return value;
}

/**
 * Validate path parameters
 */
export function validateParams<T>(params: any, schema: Joi.ObjectSchema<T>): ValidationResult<T> {
  return validateRequest(params, schema);
}

/**
 * Validate path parameters and throw error if invalid
 */
export function validateParamsOrThrow<T>(params: any, schema: Joi.ObjectSchema<T>): T {
  const { error, value } = validateParams(params, schema);

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type,
    }));

    throw new ApiError(400, 'Invalid path parameters', details);
  }

  return value;
}

/**
 * Sanitize and validate pagination parameters
 */
export function validatePagination(query: any): {
  page: number;
  limit: number;
  offset: number;
} {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  });

  const { error, value } = validateRequest(query, schema);

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type,
    }));

    throw new ApiError(400, 'Invalid pagination parameters', details);
  }

  return {
    page: value.page,
    limit: value.limit,
    offset: (value.page - 1) * value.limit,
  };
}

/**
 * Validate and sanitize search parameters
 */
export function validateSearchParams(query: any): {
  search: string;
  filters: Record<string, any>;
  sort: Record<string, 'asc' | 'desc'>;
} {
  const schema = Joi.object({
    search: Joi.string().trim().max(100).optional(),
    filters: Joi.object().unknown().optional(),
    sort: Joi.object().unknown().optional(),
  });

  const { error, value } = validateRequest(query, schema);

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type,
    }));

    throw new ApiError(400, 'Invalid search parameters', details);
  }

  return {
    search: value.search || '',
    filters: value.filters || {},
    sort: value.sort || {},
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: any,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  } = {}
): void {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], required = false } = options;

  if (required && !file) {
    throw new ApiError(400, 'File is required');
  }

  if (!file) {
    return;
  }

  if (file.size > maxSize) {
    throw new ApiError(400, `File size must be less than ${maxSize / 1024 / 1024}MB`);
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    throw new ApiError(400, `File type must be one of: ${allowedTypes.join(', ')}`);
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailSchema = Joi.string().email();
  const { error } = emailSchema.validate(email);
  return !error;
}

/**
 * Validate phone number format
 */
export function validatePhone(phone: string): boolean {
  const phoneSchema = Joi.string().pattern(/^\+?[1-9]\d{1,14}$/);
  const { error } = phoneSchema.validate(phone);
  return !error;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Create a validation middleware for Express
 */
export function createValidationMiddleware<T>(
  schema: Joi.ObjectSchema<T>,
  validateType: 'body' | 'query' | 'params' = 'body'
) {
  return (req: any, res: any, next: any) => {
    try {
      const data = req[validateType];
      const validatedData = validateRequestOrThrow(data, schema);
      req[validateType] = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
}
