"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedProductControllerPrisma = void 0;
const express_validator_1 = require("express-validator");
const enhanced_product_service_prisma_1 = require("../services/enhanced-product-service-prisma");
const product_types_1 = require("../types/product.types");
/**
 * EnhancedProductController provides REST API endpoints for product management
 * with built-in validation and error handling
 */
class EnhancedProductControllerPrisma {
    productService;
    constructor() {
        this.productService = new enhanced_product_service_prisma_1.EnhancedProductServicePrisma();
    }
    /**
     * Get all products with pagination and filtering
     */
    getProducts = async (req, res) => {
        try {
            const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', categoryId, vendorId, minPrice, maxPrice, status, type, isActive, isFeatured, isBestSeller, isNewArrival, isOnSale, brand, includeInactive, } = req.query;
            const filters = {};
            // Apply filters from query params
            if (categoryId)
                filters.categoryId = categoryId;
            if (vendorId)
                filters.vendorId = vendorId;
            if (minPrice)
                filters.minPrice = parseFloat(minPrice);
            if (maxPrice)
                filters.maxPrice = parseFloat(maxPrice);
            if (status)
                filters.status = status;
            if (type)
                filters.type = type;
            if (brand)
                filters.brand = brand;
            // Boolean filters
            if (isActive !== undefined)
                filters.isActive = isActive === 'true';
            if (isFeatured !== undefined)
                filters.isFeatured = isFeatured === 'true';
            if (isBestSeller !== undefined)
                filters.isBestSeller = isBestSeller === 'true';
            if (isNewArrival !== undefined)
                filters.isNewArrival = isNewArrival === 'true';
            if (isOnSale !== undefined)
                filters.isOnSale = isOnSale === 'true';
            // Get products
            const result = await this.productService.getProducts({
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder,
                filters,
                includeInactive: includeInactive === 'true',
            });
            res.json(result);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Get a product by ID
     */
    getProductById = async (req, res) => {
        try {
            const { id } = req.params;
            const product = await this.productService.getProductById(id);
            if (!product) {
                res.status(404).json({ message: 'Product not found' });
                return;
            }
            res.json(product);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Get a product by slug
     */
    getProductBySlug = async (req, res) => {
        try {
            const { slug } = req.params;
            const product = await this.productService.getProductBySlug(slug);
            if (!product) {
                res.status(404).json({ message: 'Product not found' });
                return;
            }
            res.json(product);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Search products
     */
    searchProducts = async (req, res) => {
        try {
            const { q, page, limit, sortBy, sortOrder } = req.query;
            if (!q) {
                res.status(400).json({ message: 'Search query is required' });
                return;
            }
            const result = await this.productService.searchProducts(q, {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                sortBy: sortBy,
                sortOrder: sortOrder,
            });
            res.json(result);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Create a new product
     */
    createProduct = async (req, res) => {
        try {
            // Validate request
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const productData = req.body;
            const product = await this.productService.createProduct(productData);
            res.status(201).json(product);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Update an existing product
     */
    updateProduct = async (req, res) => {
        try {
            // Validate request
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const { id } = req.params;
            const productData = req.body;
            const product = await this.productService.updateProduct(id, productData);
            if (!product) {
                res.status(404).json({ message: 'Product not found' });
                return;
            }
            res.json(product);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Delete a product
     */
    deleteProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const product = await this.productService.deleteProduct(id);
            if (!product) {
                res.status(404).json({ message: 'Product not found' });
                return;
            }
            res.json({ message: 'Product deleted successfully', product });
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Get categories
     */
    getCategories = async (req, res) => {
        try {
            const { parentId } = req.query;
            const categories = await this.productService.getCategories(parentId);
            res.json(categories);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Get featured products
     */
    getFeaturedProducts = async (req, res) => {
        try {
            const { limit } = req.query;
            const products = await this.productService.getFeaturedProducts(limit ? parseInt(limit) : 10);
            res.json(products);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Get new arrivals
     */
    getNewArrivals = async (req, res) => {
        try {
            const { limit } = req.query;
            const products = await this.productService.getNewArrivals(limit ? parseInt(limit) : 10);
            res.json(products);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Get trending products
     */
    getTrendingProducts = async (req, res) => {
        try {
            const { limit } = req.query;
            const products = await this.productService.getTrendingProducts(limit ? parseInt(limit) : 10);
            res.json(products);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Get products by category
     */
    getProductsByCategory = async (req, res) => {
        try {
            const { categoryId } = req.params;
            const { page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const result = await this.productService.getProductsByCategory(categoryId, {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder,
            });
            res.json(result);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Get related products
     */
    getRelatedProducts = async (req, res) => {
        try {
            const { productId } = req.params;
            const { limit } = req.query;
            const products = await this.productService.getRelatedProducts(productId, limit ? parseInt(limit) : 5);
            res.json(products);
        }
        catch (error) {
            this.handleError(error, res);
        }
    };
    /**
     * Error handler helper
     */
    handleError = (error, res) => {
        console.error('Product controller error:', error);
        if (error instanceof product_types_1.ProductError) {
            res.status(error.statusCode).json({
                error: error.code,
                message: error.message,
                details: error.details,
            });
            return;
        }
        res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
        });
    };
}
exports.EnhancedProductControllerPrisma = EnhancedProductControllerPrisma;
//# sourceMappingURL=enhanced-product-controller-prisma.js.map