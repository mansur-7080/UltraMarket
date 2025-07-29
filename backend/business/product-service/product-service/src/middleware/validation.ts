import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Product validation schema
const productSchema = Joi.object({
  name: Joi.string().required().max(200).messages({
    'string.empty': 'Product name is required',
    'string.max': 'Product name cannot exceed 200 characters'
  }),
  description: Joi.string().required().max(2000).messages({
    'string.empty': 'Product description is required',
    'string.max': 'Description cannot exceed 2000 characters'
  }),
  price: Joi.number().required().min(0).messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative'
  }),
  originalPrice: Joi.number().min(0).optional().messages({
    'number.base': 'Original price must be a number',
    'number.min': 'Original price cannot be negative'
  }),
  category: Joi.string().required().messages({
    'string.empty': 'Product category is required'
  }),
  subcategory: Joi.string().optional(),
  brand: Joi.string().required().messages({
    'string.empty': 'Product brand is required'
  }),
  sku: Joi.string().optional(),
  images: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one product image is required'
  }),
  thumbnail: Joi.string().required().messages({
    'string.empty': 'Product thumbnail is required'
  }),
  stock: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Stock must be a number',
    'number.min': 'Stock cannot be negative'
  }),
  weight: Joi.number().required().min(0).messages({
    'number.base': 'Weight must be a number',
    'number.min': 'Weight cannot be negative'
  }),
  dimensions: Joi.object({
    length: Joi.number().required().min(0).messages({
      'number.base': 'Length must be a number',
      'number.min': 'Length cannot be negative'
    }),
    width: Joi.number().required().min(0).messages({
      'number.base': 'Width must be a number',
      'number.min': 'Width cannot be negative'
    }),
    height: Joi.number().required().min(0).messages({
      'number.base': 'Height must be a number',
      'number.min': 'Height cannot be negative'
    })
  }).required(),
  specifications: Joi.object().default({}),
  tags: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
  isFeatured: Joi.boolean().default(false)
});

// Product update validation schema (all fields optional)
const productUpdateSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  brand: Joi.string().optional(),
  sku: Joi.string().optional(),
  images: Joi.array().items(Joi.string()).optional(),
  thumbnail: Joi.string().optional(),
  stock: Joi.number().integer().min(0).optional(),
  weight: Joi.number().min(0).optional(),
  dimensions: Joi.object({
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0)
  }).optional(),
  specifications: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional()
});

// Validation middleware
export const validateProduct = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = productSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      error: errorMessage
    });
    return;
  }
  
  next();
};

export const validateProductUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = productUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    res.status(400).json({
      success: false,
      error: errorMessage
    });
    return;
  }
  
  next();
};