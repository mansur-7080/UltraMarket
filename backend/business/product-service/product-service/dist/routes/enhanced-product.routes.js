"use strict";
/**
 * Enhanced Product API Routes
 * Defines all routes for the enhanced product service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const enhanced_product_controller_1 = require("../controllers/enhanced-product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * Enhanced Product routes
 */
// GET endpoints
router.get('/', enhanced_product_controller_1.ProductController.getProducts);
router.get('/search', enhanced_product_controller_1.ProductController.searchProducts);
router.get('/slug/:slug', enhanced_product_controller_1.ProductController.getProductBySlug);
router.get('/:id', enhanced_product_controller_1.ProductController.getProductById);
// Protected routes requiring authentication
// POST endpoints
router.post('/', [auth_middleware_1.validateToken, auth_middleware_1.requireAdmin], enhanced_product_controller_1.ProductController.createProduct);
// PUT endpoints
router.put('/:id', [auth_middleware_1.validateToken, auth_middleware_1.requireAdmin], enhanced_product_controller_1.ProductController.updateProduct);
// DELETE endpoints
router.delete('/:id', [auth_middleware_1.validateToken, auth_middleware_1.requireAdmin], enhanced_product_controller_1.ProductController.deleteProduct);
// Error handling middleware
router.use(enhanced_product_controller_1.productErrorHandler);
exports.default = router;
//# sourceMappingURL=enhanced-product.routes.js.map