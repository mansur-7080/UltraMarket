/**
 * Enhanced Product API Routes
 * Defines all routes for the enhanced product service
 */

import express from 'express';
import { ProductController, productErrorHandler } from '../controllers/enhanced-product.controller';
import { validateToken, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * Enhanced Product routes
 */

// GET endpoints
router.get('/', ProductController.getProducts);
router.get('/search', ProductController.searchProducts);
router.get('/slug/:slug', ProductController.getProductBySlug);
router.get('/:id', ProductController.getProductById);

// Protected routes requiring authentication
// POST endpoints
router.post('/', [validateToken, requireAdmin], ProductController.createProduct);

// PUT endpoints
router.put('/:id', [validateToken, requireAdmin], ProductController.updateProduct);

// DELETE endpoints
router.delete('/:id', [validateToken, requireAdmin], ProductController.deleteProduct);

// Error handling middleware
router.use(productErrorHandler);

export default router;
