/**
 * Enhanced Product Controller (Prisma Implementation)
 * REST API controller for the enhanced product service
 */
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { EnhancedProductServicePrisma } from '../services/enhanced-product-service-prisma';
import {
  ProductError,
  ProductStatus,
  ProductType,
  ProductCreateInput,
  ProductUpdateInput,
} from '../types/product.types';

/**
 * EnhancedProductController provides REST API endpoints for product management
 * with built-in validation and error handling
 */
export class EnhancedProductControllerPrisma {
  private productService: EnhancedProductServicePrisma;

  constructor() {
    this.productService = new EnhancedProductServicePrisma();
  }

  /**
   * Get all products with pagination and filtering
   */
  public getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
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
        brand,
        includeInactive,
      } = req.query;

      const filters: any = {};

      // Apply filters from query params
      if (categoryId) filters.categoryId = categoryId as string;
      if (vendorId) filters.vendorId = vendorId as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (status) filters.status = status as ProductStatus;
      if (type) filters.type = type as ProductType;
      if (brand) filters.brand = brand as string;

      // Boolean filters
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
      if (isBestSeller !== undefined) filters.isBestSeller = isBestSeller === 'true';
      if (isNewArrival !== undefined) filters.isNewArrival = isNewArrival === 'true';
      if (isOnSale !== undefined) filters.isOnSale = isOnSale === 'true';

      // Get products
      const result = await this.productService.getProducts({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        filters,
        includeInactive: includeInactive === 'true',
      });

      res.json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get a product by ID
   */
  public getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);

      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get a product by slug
   */
  public getProductBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const product = await this.productService.getProductBySlug(slug);

      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Search products
   */
  public searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, page, limit, sortBy, sortOrder } = req.query;

      if (!q) {
        res.status(400).json({ message: 'Search query is required' });
        return;
      }

      const result = await this.productService.searchProducts(q as string, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Create a new product
   */
  public createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const productData: ProductCreateInput = req.body;
      const product = await this.productService.createProduct(productData);

      res.status(201).json(product);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update an existing product
   */
  public updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const productData: ProductUpdateInput = req.body;

      const product = await this.productService.updateProduct(id, productData);

      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Delete a product
   */
  public deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await this.productService.deleteProduct(id);

      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      res.json({ message: 'Product deleted successfully', product });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get categories
   */
  public getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId } = req.query;
      const categories = await this.productService.getCategories(parentId as string);

      res.json(categories);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get featured products
   */
  public getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit } = req.query;
      const products = await this.productService.getFeaturedProducts(
        limit ? parseInt(limit as string) : 10
      );

      res.json(products);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get new arrivals
   */
  public getNewArrivals = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit } = req.query;
      const products = await this.productService.getNewArrivals(
        limit ? parseInt(limit as string) : 10
      );

      res.json(products);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get trending products
   */
  public getTrendingProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit } = req.query;
      const products = await this.productService.getTrendingProducts(
        limit ? parseInt(limit as string) : 10
      );

      res.json(products);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get products by category
   */
  public getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const { page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const result = await this.productService.getProductsByCategory(categoryId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get related products
   */
  public getRelatedProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const { limit } = req.query;

      const products = await this.productService.getRelatedProducts(
        productId,
        limit ? parseInt(limit as string) : 5
      );

      res.json(products);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Error handler helper
   */
  private handleError = (error: any, res: Response): void => {
    console.error('Product controller error:', error);

    if (error instanceof ProductError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  };
}
