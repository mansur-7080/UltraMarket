/**
 * Product Routes
 * RESTful API endpoints for product management
 */

import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validateRequest } from '@ultramarket/shared/middleware/validation';
import { productValidation } from '../validators/product.validator';

const router = Router();

// ===== PRODUCT CRUD ROUTES =====

/**
 * GET /api/v1/products
 * Get all products with filtering, pagination, and search
 */
router.get('/', ProductController.getProducts);

/**
 * GET /api/v1/products/featured
 * Get featured products
 */
router.get('/featured', ProductController.getFeaturedProducts);

/**
 * GET /api/v1/products/search
 * Search products
 */
router.get('/search', ProductController.searchProducts);

/**
 * GET /api/v1/products/:id
 * Get product by ID
 */
router.get('/:id', ProductController.getProductById);

/**
 * POST /api/v1/products
 * Create new product
 */
router.post('/', 
  productValidation.create,
  validateRequest,
  ProductController.createProduct
);

/**
 * PUT /api/v1/products/:id
 * Update product
 */
router.put('/:id', 
  productValidation.update,
  validateRequest,
  ProductController.updateProduct
);

/**
 * PATCH /api/v1/products/:id
 * Partially update product
 */
router.patch('/:id', 
  productValidation.patch,
  validateRequest,
  ProductController.patchProduct
);

/**
 * DELETE /api/v1/products/:id
 * Delete product
 */
router.delete('/:id', ProductController.deleteProduct);

// ===== PRODUCT IMAGE ROUTES =====

/**
 * POST /api/v1/products/:id/images
 * Upload product images
 */
router.post('/:id/images', ProductController.uploadImages);

/**
 * DELETE /api/v1/products/:id/images/:imageId
 * Delete product image
 */
router.delete('/:id/images/:imageId', ProductController.deleteImage);

// ===== PRODUCT VARIANT ROUTES =====

/**
 * GET /api/v1/products/:id/variants
 * Get product variants
 */
router.get('/:id/variants', ProductController.getVariants);

/**
 * POST /api/v1/products/:id/variants
 * Create product variant
 */
router.post('/:id/variants', 
  productValidation.createVariant,
  validateRequest,
  ProductController.createVariant
);

/**
 * PUT /api/v1/products/:id/variants/:variantId
 * Update product variant
 */
router.put('/:id/variants/:variantId', 
  productValidation.updateVariant,
  validateRequest,
  ProductController.updateVariant
);

/**
 * DELETE /api/v1/products/:id/variants/:variantId
 * Delete product variant
 */
router.delete('/:id/variants/:variantId', ProductController.deleteVariant);

// ===== PRODUCT INVENTORY ROUTES =====

/**
 * GET /api/v1/products/:id/inventory
 * Get product inventory
 */
router.get('/:id/inventory', ProductController.getInventory);

/**
 * PUT /api/v1/products/:id/inventory
 * Update product inventory
 */
router.put('/:id/inventory', 
  productValidation.updateInventory,
  validateRequest,
  ProductController.updateInventory
);

// ===== BULK OPERATIONS =====

/**
 * POST /api/v1/products/bulk
 * Bulk create products
 */
router.post('/bulk', 
  productValidation.bulkCreate,
  validateRequest,
  ProductController.bulkCreate
);

/**
 * PUT /api/v1/products/bulk
 * Bulk update products
 */
router.put('/bulk', 
  productValidation.bulkUpdate,
  validateRequest,
  ProductController.bulkUpdate
);

/**
 * DELETE /api/v1/products/bulk
 * Bulk delete products
 */
router.delete('/bulk', 
  productValidation.bulkDelete,
  validateRequest,
  ProductController.bulkDelete
);

export default router; 