"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhancedProductPrismaRoutes = void 0;
/**
 * Enhanced Product Routes (Prisma Implementation)
 * REST API routes for the enhanced product service
 */
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const enhanced_product_controller_prisma_1 = require("../controllers/enhanced-product-controller-prisma");
const router = (0, express_1.Router)();
const controller = new enhanced_product_controller_prisma_1.EnhancedProductControllerPrisma();
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
router.post('/products', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Product name is required'),
    (0, express_validator_1.body)('slug').optional(),
    (0, express_validator_1.body)('sku').notEmpty().withMessage('SKU is required'),
    (0, express_validator_1.body)('price').isNumeric().withMessage('Price must be a number'),
    (0, express_validator_1.body)('categoryId').notEmpty().withMessage('Category ID is required'),
], controller.createProduct);
// PUT route with validation
router.put('/products/:id', [
    (0, express_validator_1.body)('name').optional(),
    (0, express_validator_1.body)('slug').optional(),
    (0, express_validator_1.body)('price').optional().isNumeric().withMessage('Price must be a number'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'])
        .withMessage('Invalid status'),
], controller.updateProduct);
// DELETE route
router.delete('/products/:id', controller.deleteProduct);
exports.enhancedProductPrismaRoutes = router;
//# sourceMappingURL=enhanced-product-prisma.routes.js.map