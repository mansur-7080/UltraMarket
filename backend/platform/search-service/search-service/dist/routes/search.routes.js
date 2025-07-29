"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const search_controller_1 = require("../controllers/search.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
const searchController = new search_controller_1.SearchController();
router.get('/products', rate_limit_middleware_1.rateLimitMiddleware.search, auth_middleware_1.optionalAuthMiddleware, [
    (0, express_validator_1.query)('q').optional().isString().trim(),
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('brand').optional().isString(),
    (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }),
    (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }),
    (0, express_validator_1.query)('rating').optional().isFloat({ min: 0, max: 5 }),
    (0, express_validator_1.query)('sortBy').optional().isIn(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('inStock').optional().isBoolean(),
], searchController.searchProducts.bind(searchController));
router.get('/suggestions', rate_limit_middleware_1.rateLimitMiddleware.suggestions, [
    (0, express_validator_1.query)('q').isString().isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 20 }),
], searchController.getSearchSuggestions.bind(searchController));
router.get('/popular', rate_limit_middleware_1.rateLimitMiddleware.analytics, [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1h', '1d', '7d', '30d']),
], searchController.getPopularQueries.bind(searchController));
router.get('/filters', rate_limit_middleware_1.rateLimitMiddleware.filters, [(0, express_validator_1.query)('category').optional().isString(), (0, express_validator_1.query)('brand').optional().isString()], searchController.getSearchFilters.bind(searchController));
router.post('/track/click', rate_limit_middleware_1.rateLimitMiddleware.tracking, auth_middleware_1.optionalAuthMiddleware, [
    (0, express_validator_1.body)('query').isString().notEmpty().withMessage('Query is required'),
    (0, express_validator_1.body)('productId').isString().notEmpty().withMessage('Product ID is required'),
    (0, express_validator_1.body)('position').optional().isInt({ min: 0 }),
], searchController.trackSearchClick.bind(searchController));
router.get('/analytics', auth_middleware_1.authMiddleware, rate_limit_middleware_1.rateLimitMiddleware.analytics, [
    (0, express_validator_1.query)('startDate').isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.query)('endDate').isISO8601().withMessage('Valid end date is required'),
    (0, express_validator_1.query)('groupBy').optional().isIn(['hour', 'day', 'week', 'month']),
    (0, express_validator_1.query)('metrics').optional().isString(),
], searchController.getSearchAnalytics.bind(searchController));
router.post('/index/bulk', auth_middleware_1.authMiddleware, rate_limit_middleware_1.rateLimitMiddleware.indexing, [
    (0, express_validator_1.body)('products').isArray({ min: 1 }).withMessage('Products array is required'),
    (0, express_validator_1.body)('products.*.id').isString().notEmpty(),
    (0, express_validator_1.body)('products.*.name').isString().notEmpty(),
    (0, express_validator_1.body)('products.*.price').isFloat({ min: 0 }),
], searchController.bulkIndexProducts.bind(searchController));
router.delete('/index/clear', auth_middleware_1.authMiddleware, rate_limit_middleware_1.rateLimitMiddleware.admin, searchController.clearSearchIndex.bind(searchController));
router.get('/health', searchController.getSearchHealth.bind(searchController));
exports.default = router;
//# sourceMappingURL=search.routes.js.map