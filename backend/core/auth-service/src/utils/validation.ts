/**
 * Professional request validation utility
 */

import { Request } from 'express';
import { logger } from '../utils/logger';

// Types for schema validation
interface StringRules {
  type: 'string';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  enum?: string[];
}

interface NumberRules {
  type: 'number';
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
}

interface BooleanRules {
  type: 'boolean';
  required?: boolean;
}

interface DateRules {
  type: 'date';
  required?: boolean;
  min?: Date;
  max?: Date;
}

interface ArrayRules {
  type: 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  items?: ValidationRules;
}

interface ObjectRules {
  type: 'object';
  required?: boolean;
  properties?: Record<string, ValidationRules>;
}

type ValidationRules =
  | StringRules
  | NumberRules
  | BooleanRules
  | DateRules
  | ArrayRules
  | ObjectRules;

interface ValidationSchema {
  [key: string]: ValidationRules;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Email regex pattern from https://emailregex.com/
 * Follows RFC 5322 standard
 */
const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Validate request body against a schema
 * @param req Express request object
 * @param schema Validation schema
 * @returns Validation result
 */
export function validateRequest(req: Request, schema: ValidationSchema): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: {},
  };

  // Get data to validate (body, query, params)
  const data = req.body;

  // Track validation start time for performance monitoring
  const startTime = performance.now();

  // Validate each field against schema
  for (const field of Object.keys(schema)) {
    const rules = schema[field];
    if (!rules) continue; // Skip if rules is undefined
    
    const value = data[field];
    const fieldErrors: string[] = [];

    // Check required field
    if (rules.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${field} is required`);
      result.isValid = false;
      result.errors[field] = fieldErrors;
      continue; // Skip further validation for this field
    }

    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Validate based on type
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          fieldErrors.push(`${field} must be a string`);
        } else if (rules.type === 'string') {
          // Validate string length
          if (rules.minLength !== undefined && value.length < rules.minLength) {
            fieldErrors.push(`${field} must be at least ${rules.minLength} characters long`);
          }

          if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            fieldErrors.push(`${field} must not exceed ${rules.maxLength} characters`);
          }

          // Validate email format
          if (rules.email && !EMAIL_REGEX.test(value)) {
            fieldErrors.push(`${field} must be a valid email address`);
          }

          // Validate pattern
          if (rules.pattern && !rules.pattern.test(value)) {
            fieldErrors.push(`${field} format is invalid`);
          }

          // Validate enum values
          if (rules.enum && !rules.enum.includes(value)) {
            fieldErrors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          fieldErrors.push(`${field} must be a number`);
        } else if (rules.type === 'number') {
          // Validate number range
          if (rules.min !== undefined && value < rules.min) {
            fieldErrors.push(`${field} must be at least ${rules.min}`);
          }

          if (rules.max !== undefined && value > rules.max) {
            fieldErrors.push(`${field} must not exceed ${rules.max}`);
          }

          // Validate integer
          if (rules.integer && !Number.isInteger(value)) {
            fieldErrors.push(`${field} must be an integer`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          fieldErrors.push(`${field} must be a boolean`);
        }
        break;

      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          fieldErrors.push(`${field} must be a valid date`);
        } else if (rules.type === 'date') {
          // Validate date range
          if (rules.min && dateValue < rules.min) {
            fieldErrors.push(`${field} must be after ${rules.min.toISOString()}`);
          }

          if (rules.max && dateValue > rules.max) {
            fieldErrors.push(`${field} must be before ${rules.max.toISOString()}`);
          }
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          fieldErrors.push(`${field} must be an array`);
        } else if (rules.type === 'array') {
          // Validate array length
          if (rules.minLength !== undefined && value.length < rules.minLength) {
            fieldErrors.push(`${field} must contain at least ${rules.minLength} items`);
          }

          if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            fieldErrors.push(`${field} must not contain more than ${rules.maxLength} items`);
          }

          // Validate array items
          if (rules.items && value.length > 0) {
            value.forEach((item, index) => {
              const itemErrors = validateValue(`${field}[${index}]`, item, rules.items!);
              if (itemErrors.length > 0) {
                fieldErrors.push(...itemErrors);
              }
            });
          }
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          fieldErrors.push(`${field} must be an object`);
        } else if (rules.type === 'object' && rules.properties) {
          // Validate object properties
          Object.keys(rules.properties).forEach((propName) => {
            const propRules = rules.properties![propName];
            const propValue = value[propName];
            const propErrors = validateValue(`${field}.${propName}`, propValue, propRules);

            if (propErrors.length > 0) {
              fieldErrors.push(...propErrors);
            }
          });
        }
        break;
    }

    // Add field errors to result
    if (fieldErrors.length > 0) {
      result.isValid = false;
      result.errors[field] = fieldErrors;
    }
  }

  // Log validation performance for monitoring
  const endTime = performance.now();
  const validationTime = Math.round(endTime - startTime);

  // Log only for slow validations (> 50ms) or failures
  if (validationTime > 50 || !result.isValid) {
    logger.debug('Request validation', {
      path: req.path,
      validationTime: `${validationTime}ms`,
      isValid: result.isValid,
      errorCount: Object.keys(result.errors).length,
    });
  }

  return result;
}

/**
 * Helper function to validate a single value against rules
 * @param name Field name
 * @param value Field value
 * @param rules Validation rules
 * @returns Array of error messages
 */
function validateValue(name: string, value: any, rules: ValidationRules | undefined): string[] {
  if (!rules) return []; // Return empty array if rules is undefined
  
  const tempSchema = { [name]: rules };
  const tempData = { [name]: value };

  // Create a mock request with the value
  const mockReq = {
    body: tempData,
  } as Request;

  const result = validateRequest(mockReq, tempSchema);
  return result.errors[name] || [];
}
