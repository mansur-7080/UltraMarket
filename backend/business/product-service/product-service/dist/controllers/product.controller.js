"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const express_validator_1 = require("express-validator");
const product_service_1 = require("../services/product.service");
const shared_1 = require("../shared");
class ProductController {
    productService;
    constructor() {
        this.productService = new product_service_1.ProductService();
    }
    /**
     * Get all products with pagination and filtering
     */
    getProducts = async (req, res, next) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new shared_1.AppError(400, 'Validation failed');
            }
            // Cast query params to ProductQueryParams
            const queryParams = {
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                search: req.query.search,
                category: req.query.category,
                brand: req.query.brand,
                minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
                maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
                status: req.query.status,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                isFeatured: req.query.isFeatured ? req.query.isFeatured === 'true' : undefined,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',
                tags: req.query.tags ? req.query.tags.split(',') : undefined,
            };
            const products = await this.productService.getProducts(queryParams);
            shared_1.logger.info('Products retrieved successfully', {
                count: products.items.length,
                page: products.page,
                totalItems: products.total
            });
            res.json(products);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get a single product by ID
     */
    getProductById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await this.productService.getProductById(id);
            res.json(product);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get a single product by slug
     */
    getProductBySlug = async (req, res, next) => {
        try {
            const { slug } = req.params;
            const product = await this.productService.getProductBySlug(slug);
            res.json(product);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Create a new product
     */
    createProduct = async (req, res, next) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new shared_1.AppError(400, 'Validation failed');
            }
            // In a real app, get userId from JWT token
            const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
            const productData = req.body;
            const newProduct = await this.productService.createProduct(productData, userId);
            shared_1.logger.info('Product created successfully', { id: newProduct.id });
            res.status(201).json(newProduct);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Update an existing product
     */
    updateProduct = async (req, res, next) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new shared_1.AppError(400, 'Validation failed');
            }
            const { id } = req.params;
            // In a real app, get userId from JWT token
            const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
            const productData = req.body;
            const updatedProduct = await this.productService.updateProduct(id, productData, userId);
            shared_1.logger.info('Product updated successfully', { id });
            res.json(updatedProduct);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Delete a product
     */
    deleteProduct = async (req, res, next) => {
        try {
            const { id } = req.params;
            // In a real app, get userId from JWT token
            const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
            await this.productService.deleteProduct(id, userId);
            shared_1.logger.info('Product deleted successfully', { id });
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Input validation rules
     */
    static validateCreateProduct = [
        (0, express_validator_1.body)('name').isString().notEmpty().withMessage('Name is required'),
        (0, express_validator_1.body)('sku').isString().notEmpty().withMessage('SKU is required'),
        (0, express_validator_1.body)('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
        (0, express_validator_1.body)('categoryId').isUUID().withMessage('Valid category ID is required'),
    ];
    static validateUpdateProduct = [
        (0, express_validator_1.body)('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string'),
        (0, express_validator_1.body)('sku').optional().isString().notEmpty().withMessage('SKU must be a non-empty string'),
        (0, express_validator_1.body)('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
        (0, express_validator_1.body)('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID'),
    ];
    static validateGetProducts = [
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
        (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a non-negative number'),
        (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a non-negative number'),
    ];
}
exports.ProductController = ProductController;
//# sourceMappingURL=product.controller.js.map