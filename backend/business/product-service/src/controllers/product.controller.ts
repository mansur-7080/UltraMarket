/**
 * Product Controller
 * Professional product management with comprehensive CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared/logging/logger';
import { ValidationError, NotFoundError, AuthorizationError } from '@ultramarket/shared/errors';
import {
  validateProductInput,
  validateProductUpdateInput,
  validateProductSearchInput,
} from '../validators/product.validator';
import {
  createProduct,
  findProductById,
  findProducts,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductCategories,
  getProductBrands,
  getProductStatistics,
} from '../services/product.service';
import { cacheProduct, getCachedProduct, invalidateProductCache } from '../services/cache.service';
import { logProductAction } from '../services/audit.service';
import {
  requireVendor,
  requireAdmin,
  requireOwnershipOrAdmin,
} from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class ProductController {
  /**
   * Create a new product
   * POST /api/v1/products
   */
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { error, value } = validateProductInput(req.body);
      if (error) {
        throw new ValidationError('Invalid product data', error.details);
      }

      const productData = value;
      const userId = (req as any).user?.id;

      // Create product
      const product = await createProduct({
        ...productData,
        vendorId: userId,
      });

      // Cache the product
      await cacheProduct(product);

      // Audit log
      await logProductAction('PRODUCT_CREATED', {
        userId,
        productId: product.id,
        productName: product.name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      logger.info('Product created successfully', {
        productId: product.id,
        vendorId: userId,
        operation: 'product_creation',
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   * GET /api/v1/products/:id
   */
  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Try to get from cache first
      let product = await getCachedProduct(id);

      if (!product) {
        // Get from database
        product = await findProductById(id);

        if (!product) {
          throw new NotFoundError('Product not found');
        }

        // Cache the product
        await cacheProduct(product);
      }

      logger.debug('Product retrieved successfully', {
        productId: id,
        operation: 'product_retrieval',
      });

      res.status(200).json({
        success: true,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all products with pagination and filtering
   * GET /api/v1/products
   */
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        brand,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status = 'ACTIVE',
      } = req.query;

      const filters = {
        category: category as string,
        brand: brand as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        status: status as string,
      };

      const products = await findProducts({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      logger.debug('Products retrieved successfully', {
        count: products.data.length,
        total: products.total,
        page: parseInt(page as string),
        operation: 'products_retrieval',
      });

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product
   * PUT /api/v1/products/:id
   */
  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Validate input
      const { error, value } = validateProductUpdateInput(req.body);
      if (error) {
        throw new ValidationError('Invalid product update data', error.details);
      }

      // Check if product exists
      const existingProduct = await findProductById(id);
      if (!existingProduct) {
        throw new NotFoundError('Product not found');
      }

      // Check ownership or admin role
      if (existingProduct.vendorId !== userId && (req as any).user?.role !== 'ADMIN') {
        throw new AuthorizationError('You can only update your own products');
      }

      // Update product
      const updatedProduct = await updateProduct(id, value);

      // Update cache
      await cacheProduct(updatedProduct);

      // Audit log
      await logProductAction('PRODUCT_UPDATED', {
        userId,
        productId: id,
        productName: updatedProduct.name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      logger.info('Product updated successfully', {
        productId: id,
        vendorId: userId,
        operation: 'product_update',
      });

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: { product: updatedProduct },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete product
   * DELETE /api/v1/products/:id
   */
  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Check if product exists
      const existingProduct = await findProductById(id);
      if (!existingProduct) {
        throw new NotFoundError('Product not found');
      }

      // Check ownership or admin role
      if (existingProduct.vendorId !== userId && (req as any).user?.role !== 'ADMIN') {
        throw new AuthorizationError('You can only delete your own products');
      }

      // Delete product
      await deleteProduct(id);

      // Invalidate cache
      await invalidateProductCache(id);

      // Audit log
      await logProductAction('PRODUCT_DELETED', {
        userId,
        productId: id,
        productName: existingProduct.name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      logger.info('Product deleted successfully', {
        productId: id,
        vendorId: userId,
        operation: 'product_deletion',
      });

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search products
   * GET /api/v1/products/search
   */
  static async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        q,
        page = 1,
        limit = 20,
        category,
        brand,
        minPrice,
        maxPrice,
        sortBy = 'relevance',
        sortOrder = 'desc',
      } = req.query;

      if (!q) {
        throw new ValidationError('Search query is required');
      }

      const searchResults = await searchProducts({
        query: q as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters: {
          category: category as string,
          brand: brand as string,
          minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        },
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      logger.debug('Product search completed', {
        query: q,
        results: searchResults.data.length,
        total: searchResults.total,
        operation: 'product_search',
      });

      res.status(200).json({
        success: true,
        data: searchResults,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product categories
   * GET /api/v1/products/categories
   */
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await getProductCategories();

      logger.debug('Product categories retrieved', {
        count: categories.length,
        operation: 'categories_retrieval',
      });

      res.status(200).json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product brands
   * GET /api/v1/products/brands
   */
  static async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await getProductBrands();

      logger.debug('Product brands retrieved', {
        count: brands.length,
        operation: 'brands_retrieval',
      });

      res.status(200).json({
        success: true,
        data: { brands },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product statistics
   * GET /api/v1/products/statistics
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await getProductStatistics();

      logger.debug('Product statistics retrieved', {
        operation: 'statistics_retrieval',
      });

      res.status(200).json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get vendor products
   * GET /api/v1/products/vendor/:vendorId
   */
  static async getVendorProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { vendorId } = req.params;
      const { page = 1, limit = 20, status = 'ACTIVE' } = req.query;

      const products = await findProducts({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters: {
          vendorId,
          status: status as string,
        },
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      logger.debug('Vendor products retrieved', {
        vendorId,
        count: products.data.length,
        total: products.total,
        operation: 'vendor_products_retrieval',
      });

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update products
   * PUT /api/v1/products/bulk-update
   */
  static async bulkUpdateProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { productIds, updates } = req.body;
      const userId = (req as any).user?.id;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new ValidationError('Product IDs array is required');
      }

      if (!updates || typeof updates !== 'object') {
        throw new ValidationError('Updates object is required');
      }

      // Validate that user owns all products or is admin
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundError('Some products not found');
      }

      const isAdmin = (req as any).user?.role === 'ADMIN';
      const unauthorizedProducts = products.filter((p) => p.vendorId !== userId && !isAdmin);

      if (unauthorizedProducts.length > 0) {
        throw new AuthorizationError('You can only update your own products');
      }

      // Bulk update
      const updatedProducts = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: updates,
      });

      // Invalidate cache for updated products
      for (const productId of productIds) {
        await invalidateProductCache(productId);
      }

      // Audit log
      await logProductAction('BULK_PRODUCT_UPDATE', {
        userId,
        productIds,
        updates,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      logger.info('Bulk product update completed', {
        userId,
        productCount: productIds.length,
        operation: 'bulk_product_update',
      });

      res.status(200).json({
        success: true,
        message: 'Products updated successfully',
        data: {
          updatedCount: updatedProducts.count,
          productIds,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product recommendations
   * GET /api/v1/products/:id/recommendations
   */
  static async getProductRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;

      // Check if product exists
      const product = await findProductById(id);
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      // Get recommendations based on category and brand
      const recommendations = await prisma.product.findMany({
        where: {
          id: { not: id },
          status: 'ACTIVE',
          OR: [{ category: product.category }, { brand: product.brand }],
        },
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      });

      logger.debug('Product recommendations retrieved', {
        productId: id,
        recommendationsCount: recommendations.length,
        operation: 'product_recommendations',
      });

      res.status(200).json({
        success: true,
        data: { recommendations },
      });
    } catch (error) {
      next(error);
    }
  }
}
