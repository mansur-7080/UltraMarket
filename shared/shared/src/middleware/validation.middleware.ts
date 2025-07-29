import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/AppError';
import { logger } from '../logging/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Validation options
interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
}

// Default validation options
const defaultOptions: ValidationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
};

// Validation middleware factory
export const validate = (
  schema: {
    body?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    headers?: Joi.ObjectSchema;
  },
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationOptions = { ...defaultOptions, ...options };
    const errors: Record<string, string[]> = {};

    try {
      // Validate request body
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, validationOptions);
        if (error) {
          errors.body = error.details.map((detail) => detail.message);
        } else {
          req.body = value;
        }
      }

      // Validate request params
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, validationOptions);
        if (error) {
          errors.params = error.details.map((detail) => detail.message);
        } else {
          req.params = value;
        }
      }

      // Validate request query
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, validationOptions);
        if (error) {
          errors.query = error.details.map((detail) => detail.message);
        } else {
          req.query = value;
        }
      }

      // Validate request headers
      if (schema.headers) {
        const { error, value } = schema.headers.validate(req.headers, validationOptions);
        if (error) {
          errors.headers = error.details.map((detail) => detail.message);
        } else {
          req.headers = value;
        }
      }

      // If there are validation errors, throw ValidationError
      if (Object.keys(errors).length > 0) {
        logger.warn('Validation failed', {
          url: req.url,
          method: req.method,
          errors,
          userId: req.user?.userId,
        });

        throw new ValidationError(errors, 'Request validation failed');
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(error.toJSON());
      }

      logger.error('Validation middleware error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // MongoDB ObjectId validation
  mongoId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),

  // UUID validation
  uuid: Joi.string().uuid().required(),

  // Email validation
  email: Joi.string().email().required(),

  // Password validation (strong password)
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  // Phone number validation (Uzbekistan format)
  phoneUz: Joi.string()
    .pattern(/^(\+998|998)?[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in Uzbekistan format (+998XXXXXXXXX)',
    }),

  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  },

  // Date range
  dateRange: {
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  },

  // Price validation (in UZS)
  price: Joi.number().integer().min(0).max(999999999).required(),

  // Uzbekistan region validation
  region: Joi.string()
    .valid(
      'tashkent',
      'samarkand',
      'bukhara',
      'andijan',
      'fergana',
      'namangan',
      'kashkadarya',
      'surkhandarya',
      'jizzakh',
      'syrdarya',
      'navoiy',
      'khorezm',
      'karakalpakstan'
    )
    .required(),
};

// User validation schemas
export const userSchemas = {
  register: {
    body: Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      email: commonSchemas.email,
      password: commonSchemas.password,
      phone: commonSchemas.phoneUz,
      dateOfBirth: Joi.date().max('now').optional(),
      gender: Joi.string().valid('male', 'female', 'other').optional(),
      region: commonSchemas.region.optional(),
      acceptTerms: Joi.boolean().valid(true).required(),
    }),
  },

  login: {
    body: Joi.object({
      email: commonSchemas.email,
      password: Joi.string().required(),
      rememberMe: Joi.boolean().default(false),
    }),
  },

  updateProfile: {
    body: Joi.object({
      firstName: Joi.string().min(2).max(50).optional(),
      lastName: Joi.string().min(2).max(50).optional(),
      phone: commonSchemas.phoneUz.optional(),
      dateOfBirth: Joi.date().max('now').optional(),
      gender: Joi.string().valid('male', 'female', 'other').optional(),
      region: commonSchemas.region.optional(),
    }),
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: commonSchemas.password,
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
    }),
  },
};

// Product validation schemas
export const productSchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().min(2).max(200).required(),
      description: Joi.string().max(2000).required(),
      price: commonSchemas.price,
      discountPrice: Joi.number().integer().min(0).less(Joi.ref('price')).optional(),
      category: Joi.string().required(),
      subcategory: Joi.string().optional(),
      brand: Joi.string().max(100).optional(),
      sku: Joi.string().max(50).optional(),
      barcode: Joi.string().max(50).optional(),
      weight: Joi.number().positive().optional(),
      dimensions: Joi.object({
        length: Joi.number().positive(),
        width: Joi.number().positive(),
        height: Joi.number().positive(),
      }).optional(),
      specifications: Joi.object().optional(),
      tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
      images: Joi.array().items(Joi.string().uri()).max(10).optional(),
      isActive: Joi.boolean().default(true),
      stock: Joi.number().integer().min(0).required(),
      minStock: Joi.number().integer().min(0).default(0),
    }),
  },

  update: {
    params: Joi.object({
      id: commonSchemas.mongoId,
    }),
    body: Joi.object({
      name: Joi.string().min(2).max(200).optional(),
      description: Joi.string().max(2000).optional(),
      price: commonSchemas.price.optional(),
      discountPrice: Joi.number().integer().min(0).optional(),
      category: Joi.string().optional(),
      subcategory: Joi.string().optional(),
      brand: Joi.string().max(100).optional(),
      sku: Joi.string().max(50).optional(),
      barcode: Joi.string().max(50).optional(),
      weight: Joi.number().positive().optional(),
      dimensions: Joi.object({
        length: Joi.number().positive(),
        width: Joi.number().positive(),
        height: Joi.number().positive(),
      }).optional(),
      specifications: Joi.object().optional(),
      tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
      images: Joi.array().items(Joi.string().uri()).max(10).optional(),
      isActive: Joi.boolean().optional(),
      stock: Joi.number().integer().min(0).optional(),
      minStock: Joi.number().integer().min(0).optional(),
    }),
  },

  search: {
    query: Joi.object({
      q: Joi.string().max(200).optional(),
      category: Joi.string().optional(),
      minPrice: Joi.number().integer().min(0).optional(),
      maxPrice: Joi.number().integer().min(0).optional(),
      brand: Joi.string().optional(),
      inStock: Joi.boolean().optional(),
      ...commonSchemas.pagination,
    }),
  },
};

// Order validation schemas
export const orderSchemas = {
  create: {
    body: Joi.object({
      items: Joi.array()
        .items(
          Joi.object({
            productId: commonSchemas.mongoId,
            quantity: Joi.number().integer().min(1).max(100).required(),
            price: commonSchemas.price,
          })
        )
        .min(1)
        .max(50)
        .required(),

      shippingAddress: Joi.object({
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        phone: commonSchemas.phoneUz,
        region: commonSchemas.region,
        city: Joi.string().max(100).required(),
        address: Joi.string().max(200).required(),
        zipCode: Joi.string().max(10).optional(),
        instructions: Joi.string().max(500).optional(),
      }).required(),

      paymentMethod: Joi.string().valid('click', 'payme', 'uzcard', 'cash').required(),
      notes: Joi.string().max(500).optional(),
    }),
  },

  updateStatus: {
    params: Joi.object({
      id: commonSchemas.mongoId,
    }),
    body: Joi.object({
      status: Joi.string()
        .valid(
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'refunded'
        )
        .required(),
      notes: Joi.string().max(500).optional(),
    }),
  },
};

// Cart validation schemas
export const cartSchemas = {
  addItem: {
    body: Joi.object({
      productId: commonSchemas.mongoId,
      quantity: Joi.number().integer().min(1).max(100).required(),
    }),
  },

  updateItem: {
    params: Joi.object({
      productId: commonSchemas.mongoId,
    }),
    body: Joi.object({
      quantity: Joi.number().integer().min(1).max(100).required(),
    }),
  },

  removeItem: {
    params: Joi.object({
      productId: commonSchemas.mongoId,
    }),
  },
};

// Payment validation schemas
export const paymentSchemas = {
  initiate: {
    body: Joi.object({
      orderId: commonSchemas.mongoId,
      amount: commonSchemas.price,
      paymentMethod: Joi.string().valid('click', 'payme', 'uzcard').required(),
      returnUrl: Joi.string().uri().optional(),
      cancelUrl: Joi.string().uri().optional(),
    }),
  },

  webhook: {
    body: Joi.object({
      // This will vary based on payment provider
      // Common fields for Uzbekistan payment systems
      merchant_trans_id: Joi.string().required(),
      service_id: Joi.string().required(),
      amount: Joi.number().required(),
      status: Joi.string().required(),
      sign_time: Joi.string().required(),
      sign_string: Joi.string().required(),
    }),
  },
};

// File upload validation
export const fileSchemas = {
  upload: {
    body: Joi.object({
      category: Joi.string().valid('product', 'avatar', 'document').required(),
      description: Joi.string().max(200).optional(),
    }),
  },
};

// Admin validation schemas
export const adminSchemas = {
  createUser: {
    body: Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      email: commonSchemas.email,
      password: commonSchemas.password,
      phone: commonSchemas.phoneUz,
      role: Joi.string().valid('admin', 'moderator', 'manager').required(),
      permissions: Joi.array().items(Joi.string()).optional(),
      isActive: Joi.boolean().default(true),
    }),
  },

  updateUser: {
    params: Joi.object({
      id: commonSchemas.mongoId,
    }),
    body: Joi.object({
      firstName: Joi.string().min(2).max(50).optional(),
      lastName: Joi.string().min(2).max(50).optional(),
      email: commonSchemas.email.optional(),
      phone: commonSchemas.phoneUz.optional(),
      role: Joi.string().valid('admin', 'moderator', 'manager').optional(),
      permissions: Joi.array().items(Joi.string()).optional(),
      isActive: Joi.boolean().optional(),
    }),
  },
};

// Default export
export default validate;
