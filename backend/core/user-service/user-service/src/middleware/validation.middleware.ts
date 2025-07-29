import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './error.middleware';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against Joi schema
 */
export const validate = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');

      return next(new ValidationError(errorMessage));
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Validates request body
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return validate(schema, 'body');
};

/**
 * Validates query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return validate(schema, 'query');
};

/**
 * Validates route parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return validate(schema, 'params');
};
