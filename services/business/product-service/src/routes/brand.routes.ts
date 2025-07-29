/**
 * Brand Routes
 * RESTful API endpoints for brand management
 */

import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import { validateRequest } from '@ultramarket/shared/middleware/validation';
import { brandValidation } from '../validators/brand.validator';

const router = Router();

/**
 * GET /api/v1/brands
 * Get all brands
 */
router.get('/', BrandController.getBrands);

/**
 * GET /api/v1/brands/:id
 * Get brand by ID
 */
router.get('/:id', BrandController.getBrandById);

/**
 * GET /api/v1/brands/:id/products
 * Get products by brand
 */
router.get('/:id/products', BrandController.getBrandProducts);

/**
 * POST /api/v1/brands
 * Create new brand
 */
router.post('/', 
  brandValidation.create,
  validateRequest,
  BrandController.createBrand
);

/**
 * PUT /api/v1/brands/:id
 * Update brand
 */
router.put('/:id', 
  brandValidation.update,
  validateRequest,
  BrandController.updateBrand
);

/**
 * DELETE /api/v1/brands/:id
 * Delete brand
 */
router.delete('/:id', BrandController.deleteBrand);

export default router; 