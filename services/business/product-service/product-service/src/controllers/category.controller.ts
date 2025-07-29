import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import {
  CategoryService,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryParams,
} from '../services/category.service';
import { logger, AppError } from '../shared';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Get all categories with pagination and filtering
   */
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      // Cast query params to CategoryQueryParams
      const queryParams: CategoryQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        parentId: req.query.parentId === 'null' ? null : (req.query.parentId as string),
        includeChildren: req.query.includeChildren === 'true',
        sortBy: (req.query.sortBy as string) || 'sortOrder',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const categories = await this.categoryService.getCategories(queryParams);

      logger.info('Categories retrieved successfully', {
        count: categories.items.length,
        page: categories.page,
        totalItems: categories.total,
      });

      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get category tree
   */
  getCategoryTree = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

      const categories = await this.categoryService.getCategoryTree(isActive);

      logger.info('Category tree retrieved successfully', {
        count: categories.length,
      });

      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single category by ID
   */
  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const includeChildren = req.query.includeChildren === 'true';

      const category = await this.categoryService.getCategoryById(id, includeChildren);
      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single category by slug
   */
  getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const includeChildren = req.query.includeChildren === 'true';

      const category = await this.categoryService.getCategoryBySlug(slug, includeChildren);
      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new category
   */
  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const categoryData: CreateCategoryDto = req.body;
      const newCategory = await this.categoryService.createCategory(categoryData);

      logger.info('Category created successfully', { id: newCategory.id });
      res.status(201).json(newCategory);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an existing category
   */
  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const { id } = req.params;
      const categoryData: UpdateCategoryDto = req.body;
      const updatedCategory = await this.categoryService.updateCategory(id, categoryData);

      logger.info('Category updated successfully', { id });
      res.json(updatedCategory);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a category
   */
  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await this.categoryService.deleteCategory(id);

      logger.info('Category deleted successfully', { id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Input validation rules
   */
  static validateCreateCategory = [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('parentId').optional().isUUID().withMessage('Parent ID must be a valid UUID'),
  ];

  static validateUpdateCategory = [
    body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string'),
    body('parentId').optional().isUUID().withMessage('Parent ID must be a valid UUID'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
  ];

  static validateGetCategories = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1-100'),
  ];
}
