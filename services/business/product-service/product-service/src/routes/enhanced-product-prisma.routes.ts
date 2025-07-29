/**
 * Enhanced Product Routes (Prisma Implementation)
 * REST API routes for the enhanced product service
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { EnhancedProductControllerPrisma } from '../controllers/enhanced-product-controller-prisma';

const router = Router();
const controller = new EnhancedProductControllerPrisma();

// GET routes
router.get('/products', controller.getProducts);
router.get('/products/search', controller.searchProducts);
router.get('/products/featured', controller.getFeaturedProducts);
router.get('/products/new-arrivals', controller.getNewArrivals);
router.get('/products/trending', controller.getTrendingProducts);
router.get('/products/:id', controller.getProductById);
router.get('/products/slug/:slug', controller.getProductBySlug);
router.get('/products/related/:productId', controller.getRelatedProducts);
router.get('/categories', controller.getCategories);
router.get('/categories/:categoryId/products', controller.getProductsByCategory);

// POST route with validation
router.post(
  '/products',
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('slug').optional(),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('categoryId').notEmpty().withMessage('Category ID is required'),
  ],
  controller.createProduct
);

// PUT route with validation
router.put(
  '/products/:id',
  [
    body('name').optional(),
    body('slug').optional(),
    body('price').optional().isNumeric().withMessage('Price must be a number'),
    body('status')
      .optional()
      .isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'])
      .withMessage('Invalid status'),
  ],
  controller.updateProduct
);

// DELETE route
router.delete('/products/:id', controller.deleteProduct);

export const enhancedProductPrismaRoutes = router;
