"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Search products
router.get('/products', [
    (0, express_validator_1.query)('q').notEmpty().withMessage('Search query is required'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('category').optional().isMongoId(),
    (0, express_validator_1.query)('brand').optional().isString(),
    (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }),
    (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }),
    (0, express_validator_1.query)('sort').optional().isIn(['relevance', 'name', 'price', 'createdAt', 'rating', 'sales']),
    (0, express_validator_1.query)('order').optional().isIn(['asc', 'desc']),
    (0, express_validator_1.query)('inStock').optional().isBoolean(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }
        const { q, page = 1, limit = 20, category, brand, minPrice, maxPrice, sort = 'relevance', order = 'desc', inStock, } = req.query;
        // Build search filter
        const filter = {
            isActive: true,
            $text: { $search: q },
        };
        if (category)
            filter.categoryId = category;
        if (brand)
            filter.brand = { $regex: brand, $options: 'i' };
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice)
                filter.price.$gte = parseFloat(minPrice);
            if (maxPrice)
                filter.price.$lte = parseFloat(maxPrice);
        }
        if (inStock === 'true')
            filter.stock = { $gt: 0 };
        // Build sort object
        let sortObj = {};
        if (sort === 'relevance') {
            sortObj = { score: { $meta: 'textScore' } };
        }
        else {
            sortObj[sort] = order === 'asc' ? 1 : -1;
        }
        // Execute search with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [products, total] = await Promise.all([
            Product_1.Product.find(filter)
                .populate('category', 'name slug')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product_1.Product.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / parseInt(limit));
        logger_1.logger.info('Product search completed', {
            query: q,
            count: products.length,
            total,
            page: parseInt(page),
        });
        res.status(200).json({
            success: true,
            data: {
                query: q,
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Product search failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Search categories
router.get('/categories', [
    (0, express_validator_1.query)('q').notEmpty().withMessage('Search query is required'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }
        const { q, page = 1, limit = 20 } = req.query;
        // Build search filter
        const filter = {
            isActive: true,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { slug: { $regex: q, $options: 'i' } },
            ],
        };
        // Execute search with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [categories, total] = await Promise.all([
            Category_1.Category.find(filter)
                .populate('parent', 'name slug')
                .sort({ sortOrder: 1, name: 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Category_1.Category.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / parseInt(limit));
        logger_1.logger.info('Category search completed', {
            query: q,
            count: categories.length,
            total,
        });
        res.status(200).json({
            success: true,
            data: {
                query: q,
                categories,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Category search failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Autocomplete products
router.get('/autocomplete/products', [
    (0, express_validator_1.query)('q').notEmpty().withMessage('Search query is required'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 10 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }
        const { q, limit = 5 } = req.query;
        // Build autocomplete filter
        const filter = {
            isActive: true,
            $or: [
                { name: { $regex: `^${q}`, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } },
                { brand: { $regex: `^${q}`, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } },
            ],
        };
        const suggestions = await Product_1.Product.find(filter)
            .select('name brand sku thumbnail price')
            .sort({ 'sales.total': -1, name: 1 })
            .limit(parseInt(limit))
            .lean();
        logger_1.logger.info('Product autocomplete completed', {
            query: q,
            count: suggestions.length,
        });
        res.status(200).json({
            success: true,
            data: {
                query: q,
                suggestions,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Product autocomplete failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Autocomplete categories
router.get('/autocomplete/categories', [
    (0, express_validator_1.query)('q').notEmpty().withMessage('Search query is required'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 10 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }
        const { q, limit = 5 } = req.query;
        // Build autocomplete filter
        const filter = {
            isActive: true,
            $or: [
                { name: { $regex: `^${q}`, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } },
                { slug: { $regex: `^${q}`, $options: 'i' } },
            ],
        };
        const suggestions = await Category_1.Category.find(filter)
            .select('name slug description image productCount')
            .sort({ productCount: -1, name: 1 })
            .limit(parseInt(limit))
            .lean();
        logger_1.logger.info('Category autocomplete completed', {
            query: q,
            count: suggestions.length,
        });
        res.status(200).json({
            success: true,
            data: {
                query: q,
                suggestions,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Category autocomplete failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Get search suggestions
router.get('/suggestions', [(0, express_validator_1.query)('q').notEmpty().withMessage('Search query is required')], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }
        const { q } = req.query;
        // Get popular brands
        const brands = await Product_1.Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);
        // Get popular categories
        const categories = await Category_1.Category.aggregate([
            { $match: { isActive: true } },
            { $sort: { productCount: -1 } },
            { $limit: 5 },
        ]);
        // Get recent searches (in a real app, this would come from user search history)
        const recentSearches = ['laptop', 'smartphone', 'headphones', 'gaming', 'electronics'];
        logger_1.logger.info('Search suggestions generated', { query: q });
        res.status(200).json({
            success: true,
            data: {
                query: q,
                suggestions: {
                    brands: brands.map((b) => ({ name: b._id, count: b.count })),
                    categories: categories.map((c) => ({
                        name: c.name,
                        slug: c.slug,
                        count: c.productCount,
                    })),
                    recentSearches,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Search suggestions failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
// Get search analytics
router.get('/analytics', [(0, express_validator_1.query)('period').optional().isIn(['day', 'week', 'month', 'year'])], async (req, res) => {
    try {
        const { period = 'day' } = req.query;
        // Calculate date range based on period
        const now = new Date();
        let startDate;
        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        // Get popular search terms (in a real app, this would come from search logs)
        const popularSearches = [
            { term: 'laptop', count: 1250 },
            { term: 'smartphone', count: 980 },
            { term: 'headphones', count: 750 },
            { term: 'gaming', count: 620 },
            { term: 'electronics', count: 540 },
        ];
        // Get search trends
        const searchTrends = [
            { date: '2024-01-01', searches: 1200 },
            { date: '2024-01-02', searches: 1350 },
            { date: '2024-01-03', searches: 1100 },
            { date: '2024-01-04', searches: 1400 },
            { date: '2024-01-05', searches: 1600 },
        ];
        logger_1.logger.info('Search analytics generated', { period });
        res.status(200).json({
            success: true,
            data: {
                period,
                analytics: {
                    popularSearches,
                    searchTrends,
                    totalSearches: 6650,
                    uniqueSearches: 3200,
                    avgSearchLength: 4.2,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Search analytics failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=search.routes.js.map