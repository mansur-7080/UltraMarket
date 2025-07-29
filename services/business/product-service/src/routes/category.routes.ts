/**
 * Category Routes
 * RESTful API endpoints for category management
 */

import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validateRequest } from '@ultramarket/shared/middleware/validation';
import { categoryValidation } from '../validators/category.validator';

const router = Router();

/**
 * GET /api/v1/categories
 * Get all categories with hierarchy
 */
router.get('/', CategoryController.getCategories);

/**
 * GET /api/v1/categories/:id
 * Get category by ID
 */
router.get('/:id', CategoryController.getCategoryById);

/**
 * GET /api/v1/categories/:id/products
 * Get products in category
 */
router.get('/:id/products', CategoryController.getCategoryProducts);

/**
 * POST /api/v1/categories
 * Create new category
 */
router.post('/', 
  categoryValidation.create,
  validateRequest,
  CategoryController.createCategory
);

/**
 * PUT /api/v1/categories/:id
 * Update category
 */
router.put('/:id', 
  categoryValidation.update,
  validateRequest,
  CategoryController.updateCategory
);

/**
 * DELETE /api/v1/categories/:id
 * Delete category
 */
router.delete('/:id', CategoryController.deleteCategory);

export default router; 