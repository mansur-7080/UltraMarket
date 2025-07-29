"use strict";
/**
 * Enhanced Product Controller
 * Exposes Enhanced Product Service functionality through REST API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.productErrorHandler = exports.ProductController = void 0;
const express_validator_1 = require("express-validator");
const enhanced_product_service_optimized_1 = require("../services/enhanced-product-service-optimized");
const advanced_cache_service_1 = require("../utils/advanced-cache.service");
const logger_1 = require("../utils/logger");
// Initialize services
const cacheService = new advanced_cache_service_1.AdvancedCacheService(process.env.REDIS_URL || 'redis://localhost:6379', { max: 1000, ttl: 60 * 1000 } // 1000 items, 1 minute TTL for memory cache
);
const productService = new enhanced_product_service_optimized_1.EnhancedProductService(cacheService);
/**
 * Error wrapper for async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
/**
 * Controller for product-related endpoints
 */
class ProductController {
    /**
     * Get products with filtering and pagination
     * GET /products
     */
    static getProducts = [
        // Validation
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        (0, express_validator_1.query)('sortBy').optional().isString(),
        (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc', 'ASC', 'DESC']),
        (0, express_validator_1.query)('categoryId').optional().isString(),
        (0, express_validator_1.query)('vendorId').optional().isString(),
        (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }).toFloat(),
        (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
        (0, express_validator_1.query)('status').optional().isIn(Object.values(enhanced_product_service_optimized_1.ProductStatus)),
        (0, express_validator_1.query)('type').optional().isIn(Object.values(enhanced_product_service_optimized_1.ProductType)),
        (0, express_validator_1.query)('isActive').optional().isBoolean().toBoolean(),
        (0, express_validator_1.query)('isFeatured').optional().isBoolean().toBoolean(),
        (0, express_validator_1.query)('isBestSeller').optional().isBoolean().toBoolean(),
        (0, express_validator_1.query)('isNewArrival').optional().isBoolean().toBoolean(),
        (0, express_validator_1.query)('isOnSale').optional().isBoolean().toBoolean(),
        (0, express_validator_1.query)('tags').optional().isString(),
        asyncHandler(async (req, res) => {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                    message: 'Validation error',
                });
            }
            // Parse query parameters
            const { page, limit, sortBy, sortOrder, categoryId, vendorId, minPrice, maxPrice, status, type, isActive, isFeatured, isBestSeller, isNewArrival, isOnSale, tags: tagsString, } = req.query;
            // Parse tags if provided
            const tags = tagsString ? String(tagsString).split(',') : undefined;
            // Build filters
            const filters = {
                categoryId: categoryId ? String(categoryId) : undefined,
                vendorId: vendorId ? String(vendorId) : undefined,
                minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
                maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
                status: status ? String(status) : undefined,
                type: type ? String(type) : undefined,
                isActive: isActive !== undefined ? String(isActive).toLowerCase() === 'true' : undefined,
                isFeatured: isFeatured !== undefined ? String(isFeatured).toLowerCase() === 'true' : undefined,
                isBestSeller: isBestSeller !== undefined ? String(isBestSeller).toLowerCase() === 'true' : undefined,
                isNewArrival: isNewArrival !== undefined ? String(isNewArrival).toLowerCase() === 'true' : undefined,
                isOnSale: isOnSale !== undefined ? String(isOnSale).toLowerCase() === 'true' : undefined,
                tags,
            };
            // Remove undefined filters
            Object.keys(filters).forEach((key) => {
                if (filters[key] === undefined) {
                    delete filters[key];
                }
            });
            // Get products
            const result = await productService.getProducts({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder,
                filters,
            });
            // Type assertion for the result
            const typedResult = result;
            return res.status(200).json({
                success: true,
                products: typedResult.products,
                totalCount: typedResult.totalCount,
                page: typedResult.page,
                limit: typedResult.limit,
                totalPages: typedResult.totalPages,
            });
        }),
    ];
    /**
     * Get a product by ID
     * GET /products/:id
     */
    static getProductById = [
        // Validation
        (0, express_validator_1.param)('id').isUUID().withMessage('Invalid product ID'),
        asyncHandler(async (req, res) => {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                    message: 'Validation error',
                });
            }
            const { id } = req.params;
            const product = await productService.getProductById(id);
            return res.status(200).json({
                success: true,
                product,
            });
        }),
    ];
    /**
     * Get a product by slug
     * GET /products/slug/:slug
     */
    static getProductBySlug = [
        // Validation
        (0, express_validator_1.param)('slug').isString().withMessage('Invalid product slug'),
        asyncHandler(async (req, res) => {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                    message: 'Validation error',
                });
            }
            const { slug } = req.params;
            const product = await productService.getProductBySlug(slug);
            return res.status(200).json({
                success: true,
                product,
            });
        }),
    ];
    /**
     * Search products
     * GET /products/search
     */
    static searchProducts = [
        // Validation
        (0, express_validator_1.query)('query').isString().notEmpty().withMessage('Search query is required'),
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        (0, express_validator_1.query)('sortBy').optional().isString(),
        (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc', 'ASC', 'DESC']),
        (0, express_validator_1.query)('categoryId').optional().isString(),
        (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }).toFloat(),
        (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
        asyncHandler(async (req, res) => {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                    message: 'Validation error',
                });
            }
            const { query: searchQuery, page, limit, sortBy, sortOrder, categoryId, minPrice, maxPrice, } = req.query;
            // Build filters
            const filters = {
                categoryId: categoryId ? String(categoryId) : undefined,
                minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
                maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
            };
            // Remove undefined filters
            Object.keys(filters).forEach((key) => {
                if (filters[key] === undefined) {
                    delete filters[key];
                }
            });
            // Search products
            const result = await productService.searchProducts(searchQuery, {
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder,
                filters,
            });
            // Type assertion for the result
            const typedResult = result;
            return res.status(200).json({
                success: true,
                products: typedResult.products,
                totalCount: typedResult.totalCount,
                page: typedResult.page,
                limit: typedResult.limit,
                totalPages: typedResult.totalPages,
            });
        }),
    ];
    /**
     * Create a product
     * POST /products
     */
    static createProduct = [
        // Validation - required fields
        (0, express_validator_1.body)('name').isString().notEmpty().withMessage('Product name is required'),
        (0, express_validator_1.body)('description').optional().isString(),
        (0, express_validator_1.body)('shortDescription').optional().isString(),
        (0, express_validator_1.body)('sku').isString().notEmpty().withMessage('SKU is required'),
        (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
        (0, express_validator_1.body)('categoryId').isUUID().withMessage('Valid category ID is required'),
        // Optional fields validation
        (0, express_validator_1.body)('barcode').optional().isString(),
        (0, express_validator_1.body)('brand').optional().isString(),
        (0, express_validator_1.body)('model').optional().isString(),
        (0, express_validator_1.body)('weight').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('dimensions').optional().isObject(),
        (0, express_validator_1.body)('comparePrice').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('costPrice').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('currency').optional().isString().isLength({ min: 3, max: 3 }),
        (0, express_validator_1.body)('status').optional().isIn(Object.values(enhanced_product_service_optimized_1.ProductStatus)),
        (0, express_validator_1.body)('type').optional().isIn(Object.values(enhanced_product_service_optimized_1.ProductType)),
        (0, express_validator_1.body)('vendorId').optional().isUUID(),
        (0, express_validator_1.body)('attributes').optional().isObject(),
        (0, express_validator_1.body)('specifications').optional().isObject(),
        (0, express_validator_1.body)('warranty').optional().isString(),
        (0, express_validator_1.body)('returnPolicy').optional().isString(),
        (0, express_validator_1.body)('shippingInfo').optional().isString(),
        (0, express_validator_1.body)('tags').optional().isArray(),
        (0, express_validator_1.body)('slug').optional().isString(),
        (0, express_validator_1.body)('isActive').optional().isBoolean(),
        (0, express_validator_1.body)('isFeatured').optional().isBoolean(),
        (0, express_validator_1.body)('isBestSeller').optional().isBoolean(),
        (0, express_validator_1.body)('isNewArrival').optional().isBoolean(),
        (0, express_validator_1.body)('isOnSale').optional().isBoolean(),
        (0, express_validator_1.body)('salePercentage').optional().isInt({ min: 1, max: 99 }),
        (0, express_validator_1.body)('saleStartDate').optional().isISO8601(),
        (0, express_validator_1.body)('saleEndDate').optional().isISO8601(),
        (0, express_validator_1.body)('metaTitle').optional().isString(),
        (0, express_validator_1.body)('metaDescription').optional().isString(),
        (0, express_validator_1.body)('metaKeywords').optional().isArray(),
        (0, express_validator_1.body)('publishedAt').optional().isISO8601(),
        asyncHandler(async (req, res) => {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                    message: 'Validation error',
                });
            }
            // Create product
            const productData = req.body;
            const product = await productService.createProduct(productData);
            return res.status(201).json({
                success: true,
                message: 'Product created successfully',
                product,
            });
        }),
    ];
    /**
     * Update a product
     * PUT /products/:id
     */
    static updateProduct = [
        // ID validation
        (0, express_validator_1.param)('id').isUUID().withMessage('Invalid product ID'),
        // Optional fields validation - any field can be updated
        (0, express_validator_1.body)('name').optional().isString().notEmpty(),
        (0, express_validator_1.body)('description').optional().isString(),
        (0, express_validator_1.body)('shortDescription').optional().isString(),
        (0, express_validator_1.body)('sku').optional().isString().notEmpty(),
        (0, express_validator_1.body)('price').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('categoryId').optional().isUUID(),
        (0, express_validator_1.body)('barcode').optional().isString(),
        (0, express_validator_1.body)('brand').optional().isString(),
        (0, express_validator_1.body)('model').optional().isString(),
        (0, express_validator_1.body)('weight').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('dimensions').optional().isObject(),
        (0, express_validator_1.body)('comparePrice').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('costPrice').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('currency').optional().isString().isLength({ min: 3, max: 3 }),
        (0, express_validator_1.body)('status').optional().isIn(Object.values(enhanced_product_service_optimized_1.ProductStatus)),
        (0, express_validator_1.body)('type').optional().isIn(Object.values(enhanced_product_service_optimized_1.ProductType)),
        (0, express_validator_1.body)('vendorId').optional().isUUID(),
        (0, express_validator_1.body)('attributes').optional().isObject(),
        (0, express_validator_1.body)('specifications').optional().isObject(),
        (0, express_validator_1.body)('warranty').optional().isString(),
        (0, express_validator_1.body)('returnPolicy').optional().isString(),
        (0, express_validator_1.body)('shippingInfo').optional().isString(),
        (0, express_validator_1.body)('tags').optional().isArray(),
        (0, express_validator_1.body)('slug').optional().isString(),
        (0, express_validator_1.body)('isActive').optional().isBoolean(),
        (0, express_validator_1.body)('isFeatured').optional().isBoolean(),
        (0, express_validator_1.body)('isBestSeller').optional().isBoolean(),
        (0, express_validator_1.body)('isNewArrival').optional().isBoolean(),
        (0, express_validator_1.body)('isOnSale').optional().isBoolean(),
        (0, express_validator_1.body)('salePercentage').optional().isInt({ min: 1, max: 99 }),
        (0, express_validator_1.body)('saleStartDate').optional().isISO8601(),
        (0, express_validator_1.body)('saleEndDate').optional().isISO8601(),
        (0, express_validator_1.body)('metaTitle').optional().isString(),
        (0, express_validator_1.body)('metaDescription').optional().isString(),
        (0, express_validator_1.body)('metaKeywords').optional().isArray(),
        (0, express_validator_1.body)('publishedAt').optional().isISO8601(),
        asyncHandler(async (req, res) => {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                    message: 'Validation error',
                });
            }
            const { id } = req.params;
            const updateData = req.body;
            // Update product
            const updatedProduct = await productService.updateProduct(id, updateData);
            return res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                product: updatedProduct,
            });
        }),
    ];
    /**
     * Delete a product
     * DELETE /products/:id
     */
    static deleteProduct = [
        // Validation
        (0, express_validator_1.param)('id').isUUID().withMessage('Invalid product ID'),
        asyncHandler(async (req, res) => {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                    message: 'Validation error',
                });
            }
            const { id } = req.params;
            // Delete product
            await productService.deleteProduct(id);
            return res.status(200).json({
                success: true,
                message: 'Product deleted successfully',
            });
        }),
    ];
}
exports.ProductController = ProductController;
/**
 * Error handler middleware
 */
const productErrorHandler = (err, req, res, next) => {
    logger_1.logger.error('Product API Error:', err);
    if (err instanceof enhanced_product_service_optimized_1.ProductError) {
        return res.status(err.statusCode).json({
            success: false,
            code: err.code,
            message: err.message,
        });
    }
    // Default error response
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
exports.productErrorHandler = productErrorHandler;
//# sourceMappingURL=enhanced-product.controller.js.map