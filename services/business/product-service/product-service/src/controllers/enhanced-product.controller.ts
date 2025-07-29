/**
 * Enhanced Product Controller
 * Exposes Enhanced Product Service functionality through REST API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  EnhancedProductService,
  ProductError,
  ProductStatus,
  ProductType,
} from '../services/enhanced-product-service-optimized';
import { AdvancedCacheService } from '../utils/advanced-cache.service';
import { logger } from '../utils/logger';

// Define types for API responses
interface ProductListResponse {
  products: any[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Initialize services
const cacheService = new AdvancedCacheService(
  process.env.REDIS_URL || 'redis://localhost:6379',
  { max: 1000, ttl: 60 * 1000 } // 1000 items, 1 minute TTL for memory cache
);

const productService = new EnhancedProductService(cacheService);

/**
 * Error wrapper for async route handlers
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Controller for product-related endpoints
 */
export class ProductController {
  /**
   * Get products with filtering and pagination
   * GET /products
   */
  static getProducts = [
    // Validation
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc', 'ASC', 'DESC']),
    query('categoryId').optional().isString(),
    query('vendorId').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('status').optional().isIn(Object.values(ProductStatus)),
    query('type').optional().isIn(Object.values(ProductType)),
    query('isActive').optional().isBoolean().toBoolean(),
    query('isFeatured').optional().isBoolean().toBoolean(),
    query('isBestSeller').optional().isBoolean().toBoolean(),
    query('isNewArrival').optional().isBoolean().toBoolean(),
    query('isOnSale').optional().isBoolean().toBoolean(),
    query('tags').optional().isString(),

    asyncHandler(async (req: Request, res: Response) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation error',
        });
      }

      // Parse query parameters
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        categoryId,
        vendorId,
        minPrice,
        maxPrice,
        status,
        type,
        isActive,
        isFeatured,
        isBestSeller,
        isNewArrival,
        isOnSale,
        tags: tagsString,
      } = req.query;

      // Parse tags if provided
      const tags = tagsString ? String(tagsString).split(',') : undefined;

      // Build filters
      const filters: Record<string, any> = {
        categoryId: categoryId ? String(categoryId) : undefined,
        vendorId: vendorId ? String(vendorId) : undefined,
        minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
        maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
        status: status ? (String(status) as ProductStatus) : undefined,
        type: type ? (String(type) as ProductType) : undefined,
        isActive: isActive !== undefined ? String(isActive).toLowerCase() === 'true' : undefined,
        isFeatured:
          isFeatured !== undefined ? String(isFeatured).toLowerCase() === 'true' : undefined,
        isBestSeller:
          isBestSeller !== undefined ? String(isBestSeller).toLowerCase() === 'true' : undefined,
        isNewArrival:
          isNewArrival !== undefined ? String(isNewArrival).toLowerCase() === 'true' : undefined,
        isOnSale: isOnSale !== undefined ? String(isOnSale).toLowerCase() === 'true' : undefined,
        tags,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      // Get products
      const result = await productService.getProducts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc' | 'ASC' | 'DESC',
        filters,
      });

      // Type assertion for the result
      const typedResult = result as ProductListResponse;

      return res.status(200).json({
        success: true,
        products: typedResult.products,
        totalCount: typedResult.totalCount,
        page: typedResult.page,
        limit: typedResult.limit,
        totalPages: typedResult.totalPages,
      });
    }),
  ];

  /**
   * Get a product by ID
   * GET /products/:id
   */
  static getProductById = [
    // Validation
    param('id').isUUID().withMessage('Invalid product ID'),

    asyncHandler(async (req: Request, res: Response) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation error',
        });
      }

      const { id } = req.params;
      const product = await productService.getProductById(id);

      return res.status(200).json({
        success: true,
        product,
      });
    }),
  ];

  /**
   * Get a product by slug
   * GET /products/slug/:slug
   */
  static getProductBySlug = [
    // Validation
    param('slug').isString().withMessage('Invalid product slug'),

    asyncHandler(async (req: Request, res: Response) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation error',
        });
      }

      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);

      return res.status(200).json({
        success: true,
        product,
      });
    }),
  ];

  /**
   * Search products
   * GET /products/search
   */
  static searchProducts = [
    // Validation
    query('query').isString().notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc', 'ASC', 'DESC']),
    query('categoryId').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),

    asyncHandler(async (req: Request, res: Response) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation error',
        });
      }

      const {
        query: searchQuery,
        page,
        limit,
        sortBy,
        sortOrder,
        categoryId,
        minPrice,
        maxPrice,
      } = req.query;

      // Build filters
      const filters: Record<string, any> = {
        categoryId: categoryId ? String(categoryId) : undefined,
        minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
        maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      // Search products
      const result = await productService.searchProducts(searchQuery as string, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc' | 'ASC' | 'DESC',
        filters,
      });

      // Type assertion for the result
      const typedResult = result as ProductListResponse;

      return res.status(200).json({
        success: true,
        products: typedResult.products,
        totalCount: typedResult.totalCount,
        page: typedResult.page,
        limit: typedResult.limit,
        totalPages: typedResult.totalPages,
      });
    }),
  ];

  /**
   * Create a product
   * POST /products
   */
  static createProduct = [
    // Validation - required fields
    body('name').isString().notEmpty().withMessage('Product name is required'),
    body('description').optional().isString(),
    body('shortDescription').optional().isString(),
    body('sku').isString().notEmpty().withMessage('SKU is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('categoryId').isUUID().withMessage('Valid category ID is required'),

    // Optional fields validation
    body('barcode').optional().isString(),
    body('brand').optional().isString(),
    body('model').optional().isString(),
    body('weight').optional().isFloat({ min: 0 }),
    body('dimensions').optional().isObject(),
    body('comparePrice').optional().isFloat({ min: 0 }),
    body('costPrice').optional().isFloat({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('status').optional().isIn(Object.values(ProductStatus)),
    body('type').optional().isIn(Object.values(ProductType)),
    body('vendorId').optional().isUUID(),
    body('attributes').optional().isObject(),
    body('specifications').optional().isObject(),
    body('warranty').optional().isString(),
    body('returnPolicy').optional().isString(),
    body('shippingInfo').optional().isString(),
    body('tags').optional().isArray(),
    body('slug').optional().isString(),
    body('isActive').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
    body('isBestSeller').optional().isBoolean(),
    body('isNewArrival').optional().isBoolean(),
    body('isOnSale').optional().isBoolean(),
    body('salePercentage').optional().isInt({ min: 1, max: 99 }),
    body('saleStartDate').optional().isISO8601(),
    body('saleEndDate').optional().isISO8601(),
    body('metaTitle').optional().isString(),
    body('metaDescription').optional().isString(),
    body('metaKeywords').optional().isArray(),
    body('publishedAt').optional().isISO8601(),

    asyncHandler(async (req: Request, res: Response) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation error',
        });
      }

      // Create product
      const productData = req.body;
      const product = await productService.createProduct(productData);

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product,
      });
    }),
  ];

  /**
   * Update a product
   * PUT /products/:id
   */
  static updateProduct = [
    // ID validation
    param('id').isUUID().withMessage('Invalid product ID'),

    // Optional fields validation - any field can be updated
    body('name').optional().isString().notEmpty(),
    body('description').optional().isString(),
    body('shortDescription').optional().isString(),
    body('sku').optional().isString().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('categoryId').optional().isUUID(),
    body('barcode').optional().isString(),
    body('brand').optional().isString(),
    body('model').optional().isString(),
    body('weight').optional().isFloat({ min: 0 }),
    body('dimensions').optional().isObject(),
    body('comparePrice').optional().isFloat({ min: 0 }),
    body('costPrice').optional().isFloat({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('status').optional().isIn(Object.values(ProductStatus)),
    body('type').optional().isIn(Object.values(ProductType)),
    body('vendorId').optional().isUUID(),
    body('attributes').optional().isObject(),
    body('specifications').optional().isObject(),
    body('warranty').optional().isString(),
    body('returnPolicy').optional().isString(),
    body('shippingInfo').optional().isString(),
    body('tags').optional().isArray(),
    body('slug').optional().isString(),
    body('isActive').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
    body('isBestSeller').optional().isBoolean(),
    body('isNewArrival').optional().isBoolean(),
    body('isOnSale').optional().isBoolean(),
    body('salePercentage').optional().isInt({ min: 1, max: 99 }),
    body('saleStartDate').optional().isISO8601(),
    body('saleEndDate').optional().isISO8601(),
    body('metaTitle').optional().isString(),
    body('metaDescription').optional().isString(),
    body('metaKeywords').optional().isArray(),
    body('publishedAt').optional().isISO8601(),

    asyncHandler(async (req: Request, res: Response) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation error',
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Update product
      const updatedProduct = await productService.updateProduct(id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct,
      });
    }),
  ];

  /**
   * Delete a product
   * DELETE /products/:id
   */
  static deleteProduct = [
    // Validation
    param('id').isUUID().withMessage('Invalid product ID'),

    asyncHandler(async (req: Request, res: Response) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation error',
        });
      }

      const { id } = req.params;

      // Delete product
      await productService.deleteProduct(id);

      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    }),
  ];
}

/**
 * Error handler middleware
 */
export const productErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Product API Error:', err);

  if (err instanceof ProductError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
