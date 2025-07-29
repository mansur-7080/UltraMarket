/**
 * Product Validation Schemas
 * Using Zod for runtime validation
 */

import { z } from 'zod';
import { body, param, query } from 'express-validator';

// Zod schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().max(500, 'Short description too long').optional(),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU too long'),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  brandId: z.string().uuid('Invalid brand ID').optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['cm', 'in'])
  }).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'HIDDEN']).default('PUBLIC'),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional()
});

export const updateProductSchema = createProductSchema.partial();

// Express-validator middleware
export const productValidation = {
  create: [
    body('name').notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name too long'),
    body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be positive'),
    body('categoryId').isUUID().withMessage('Invalid category ID'),
    body('brandId').optional().isUUID().withMessage('Invalid brand ID'),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']).withMessage('Invalid status'),
    body('visibility').optional().isIn(['PUBLIC', 'PRIVATE', 'HIDDEN']).withMessage('Invalid visibility')
  ],

  update: [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be positive'),
    body('categoryId').optional().isUUID().withMessage('Invalid category ID'),
    body('brandId').optional().isUUID().withMessage('Invalid brand ID')
  ],

  patch: [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be positive')
  ],

  createVariant: [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('name').notEmpty().withMessage('Variant name is required'),
    body('sku').notEmpty().withMessage('Variant SKU is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be positive')
  ],

  updateVariant: [
    param('id').isUUID().withMessage('Invalid product ID'),
    param('variantId').isUUID().withMessage('Invalid variant ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be positive')
  ],

  updateInventory: [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative integer'),
    body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be non-negative')
  ],

  bulkCreate: [
    body('products').isArray({ min: 1 }).withMessage('Products array is required'),
    body('products.*.name').notEmpty().withMessage('Product name is required'),
    body('products.*.sku').notEmpty().withMessage('Product SKU is required')
  ],

  bulkUpdate: [
    body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
    body('productIds.*').isUUID().withMessage('Invalid product ID'),
    body('updates').isObject().withMessage('Updates object is required')
  ],

  bulkDelete: [
    body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
    body('productIds.*').isUUID().withMessage('Invalid product ID')
  ]
}; 