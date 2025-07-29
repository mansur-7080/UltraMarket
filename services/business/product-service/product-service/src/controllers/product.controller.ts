import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { ProductService } from '../services/product.service';
import { logger, AppError } from '../shared';
import { 
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
  ProductStatus
} from '../models/product.model';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Get all products with pagination and filtering
   */
  getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      // Cast query params to ProductQueryParams
      const queryParams: ProductQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        category: req.query.category as string,
        brand: req.query.brand as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        status: req.query.status as ProductStatus,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        isFeatured: req.query.isFeatured ? req.query.isFeatured === 'true' : undefined,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      };

      const products = await this.productService.getProducts(queryParams);
      
      logger.info('Products retrieved successfully', {
        count: products.items.length,
        page: products.page,
        totalItems: products.total
      });

      res.json(products);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single product by ID
   */
  getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single product by slug
   */
  getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const product = await this.productService.getProductBySlug(slug);
      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new product
   */
  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }
      
      // In a real app, get userId from JWT token
      const userId = req.headers['x-user-id'] as string || '00000000-0000-0000-0000-000000000000';
      
      const productData: CreateProductDto = req.body;
      const newProduct = await this.productService.createProduct(productData, userId);
      
      logger.info('Product created successfully', { id: newProduct.id });
      res.status(201).json(newProduct);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an existing product
   */
  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }
      
      const { id } = req.params;
      // In a real app, get userId from JWT token
      const userId = req.headers['x-user-id'] as string || '00000000-0000-0000-0000-000000000000';
      
      const productData: UpdateProductDto = req.body;
      const updatedProduct = await this.productService.updateProduct(id, productData, userId);
      
      logger.info('Product updated successfully', { id });
      res.json(updatedProduct);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a product
   */
  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // In a real app, get userId from JWT token
      const userId = req.headers['x-user-id'] as string || '00000000-0000-0000-0000-000000000000';
      
      await this.productService.deleteProduct(id, userId);
      
      logger.info('Product deleted successfully', { id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Input validation rules
   */
  static validateCreateProduct = [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('sku').isString().notEmpty().withMessage('SKU is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('categoryId').isUUID().withMessage('Valid category ID is required'),
  ];

  static validateUpdateProduct = [
    body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string'),
    body('sku').optional().isString().notEmpty().withMessage('SKU must be a non-empty string'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID'),
  ];

  static validateGetProducts = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a non-negative number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a non-negative number'),
  ];
}
