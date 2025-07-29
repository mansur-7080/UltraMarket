import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Product validation schemas
export const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).required().trim(),
  description: Joi.string().min(10).max(2000).required(),
  shortDescription: Joi.string().max(300).optional(),
  price: Joi.number().min(0).required(),
  originalPrice: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).max(100).optional(),
  category: Joi.string().required().trim(),
  subcategory: Joi.string().optional().trim(),
  brand: Joi.string().required().trim(),
  sku: Joi.string().required().trim(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  specifications: Joi.object().optional(),
  inStock: Joi.boolean().optional(),
  quantity: Joi.number().min(0).required(),
  minQuantity: Joi.number().min(0).optional(),
  weight: Joi.number().min(0).optional(),
  dimensions: Joi.object({
    length: Joi.number().min(0).required(),
    width: Joi.number().min(0).required(),
    height: Joi.number().min(0).required(),
  }).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional(),
  seoKeywords: Joi.array().items(Joi.string().trim()).optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional().trim(),
  description: Joi.string().min(10).max(2000).optional(),
  shortDescription: Joi.string().max(300).optional(),
  price: Joi.number().min(0).optional(),
  originalPrice: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).max(100).optional(),
  category: Joi.string().optional().trim(),
  subcategory: Joi.string().optional().trim(),
  brand: Joi.string().optional().trim(),
  sku: Joi.string().optional().trim(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  specifications: Joi.object().optional(),
  inStock: Joi.boolean().optional(),
  quantity: Joi.number().min(0).optional(),
  minQuantity: Joi.number().min(0).optional(),
  weight: Joi.number().min(0).optional(),
  dimensions: Joi.object({
    length: Joi.number().min(0).required(),
    width: Joi.number().min(0).required(),
    height: Joi.number().min(0).required(),
  }).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  seoTitle: Joi.string().max(60).optional(),
  seoDescription: Joi.string().max(160).optional(),
  seoKeywords: Joi.array().items(Joi.string().trim()).optional(),
});

// Category validation schemas
export const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required().trim(),
  slug: Joi.string().min(1).max(100).required().trim().lowercase(),
  description: Joi.string().max(500).optional(),
  parentCategory: Joi.string().optional(),
  image: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().optional(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().trim(),
  slug: Joi.string().min(1).max(100).optional().trim().lowercase(),
  description: Joi.string().max(500).optional(),
  parentCategory: Joi.string().optional(),
  image: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().optional(),
});

// Review validation schemas
export const createReviewSchema = Joi.object({
  productId: Joi.string().required(),
  userId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().min(1).max(100).required().trim(),
  comment: Joi.string().min(10).max(1000).required(),
  verified: Joi.boolean().optional(),
});

// Query validation schemas
export const productQuerySchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  brand: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  inStock: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  search: Joi.string().min(1).optional(),
  sortBy: Joi.string().valid('name', 'price', 'rating', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

export const reviewQuerySchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(50).optional(),
});

// Validation middleware
export const validateProduct = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors,
      });
    }

    next();
  };
};
