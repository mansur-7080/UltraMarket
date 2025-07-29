import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        logger.warn('Request body validation failed', {
          errors: errorMessages,
          body: req.body,
        });
        throw new ValidationError(errorMessages.join(', '));
      }

      req.body = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        logger.warn('Request query validation failed', {
          errors: errorMessages,
          query: req.query,
        });
        throw new ValidationError(errorMessages.join(', '));
      }

      req.query = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        logger.warn('Request params validation failed', {
          errors: errorMessages,
          params: req.params,
        });
        throw new ValidationError(errorMessages.join(', '));
      }

      req.params = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateRequest = (options: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: string[] = [];

      // Validate body
      if (options.body) {
        const { error, value } = options.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          errors.push(...error.details.map((detail) => `Body: ${detail.message}`));
        } else {
          req.body = value;
        }
      }

      // Validate query
      if (options.query) {
        const { error, value } = options.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          errors.push(...error.details.map((detail) => `Query: ${detail.message}`));
        } else {
          req.query = value;
        }
      }

      // Validate params
      if (options.params) {
        const { error, value } = options.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          errors.push(...error.details.map((detail) => `Params: ${detail.message}`));
        } else {
          req.params = value;
        }
      }

      if (errors.length > 0) {
        logger.warn('Request validation failed', {
          errors,
          body: req.body,
          query: req.query,
          params: req.params,
        });
        throw new ValidationError(errors.join(', '));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
