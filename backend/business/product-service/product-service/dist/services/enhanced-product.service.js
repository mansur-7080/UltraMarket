"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedProductService = exports.DuplicateProductError = exports.ProductValidationError = exports.ProductNotFoundError = exports.ProductServiceError = void 0;
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
const product_repository_1 = require("../repositories/product.repository");
/**
 * Error classes for the Product Service
 */
class ProductServiceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ProductServiceError';
    }
}
exports.ProductServiceError = ProductServiceError;
class ProductNotFoundError extends ProductServiceError {
    constructor(productId) {
        super(`Product with ID ${productId} not found`);
        this.name = 'ProductNotFoundError';
    }
}
exports.ProductNotFoundError = ProductNotFoundError;
class ProductValidationError extends ProductServiceError {
    validationErrors;
    constructor(errors) {
        super(`Product validation failed: ${errors.join(', ')}`);
        this.validationErrors = errors;
        this.name = 'ProductValidationError';
    }
}
exports.ProductValidationError = ProductValidationError;
class DuplicateProductError extends ProductServiceError {
    sku;
    constructor(sku) {
        super(`Product with SKU ${sku} already exists`);
        this.sku = sku;
        this.name = 'DuplicateProductError';
    }
}
exports.DuplicateProductError = DuplicateProductError;
/**
 * Enhanced Product Service with professional patterns and practices
 */
class EnhancedProductService {
    cacheService;
    DEFAULT_CACHE_TTL = 3600; // 1 hour
    PRODUCT_CACHE_PREFIX = 'product:';
    PRODUCTS_LIST_CACHE_PREFIX = 'products:list:';
    constructor(cacheService) {
        this.cacheService = cacheService;
    }
    /**
     * Create a new product with validation
     */
    async createProduct(productData) {
        try {
            // Validate product data
            const validationErrors = (0, validation_1.validateProduct)(productData);
            if (validationErrors.length > 0) {
                throw new ProductValidationError(validationErrors);
            }
            // Check for duplicate SKU
            const existingProduct = await product_repository_1.productRepository.findBySku(productData.sku);
            if (existingProduct) {
                throw new DuplicateProductError(productData.sku);
            }
            // Generate slug if not provided
            if (!productData.slug) {
                productData.slug = this.generateSlug(productData.name);
            }
            // Create the product
            const startTime = Date.now();
            const newProduct = await product_repository_1.productRepository.create(productData);
            logger_1.logger.info(`Product created successfully in ${Date.now() - startTime}ms`, {
                productId: newProduct.id,
                category: newProduct.category,
            });
            // Invalidate relevant cache entries
            await this.invalidateRelatedCaches(newProduct.category);
            return newProduct;
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error('Failed to create product', { error: error.message, stack: error.stack });
            throw new ProductServiceError(`Failed to create product: ${error.message}`);
        }
    }
    /**
     * Get a product by ID with caching
     */
    async getProductById(productId, includeDeleted = false) {
        try {
            const cacheKey = `${this.PRODUCT_CACHE_PREFIX}${productId}`;
            // Try to get from cache first
            const cachedProduct = await this.cacheService.get(cacheKey);
            if (cachedProduct) {
                logger_1.logger.debug('Product retrieved from cache', { productId });
                return cachedProduct;
            }
            // Get from database
            const startTime = Date.now();
            const product = await product_repository_1.productRepository.findById(productId, includeDeleted);
            logger_1.logger.debug(`Product fetched from database in ${Date.now() - startTime}ms`, { productId });
            if (!product) {
                throw new ProductNotFoundError(productId);
            }
            // Cache the product
            await this.cacheService.set(cacheKey, product, this.DEFAULT_CACHE_TTL, [
                `product:${product.id}`,
                `category:${product.category}`,
            ]);
            return product;
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error('Failed to retrieve product by ID', { productId, error: error.message });
            throw new ProductServiceError(`Failed to get product: ${error.message}`);
        }
    }
    /**
     * Get products with filtering, sorting and pagination
     */
    async getProducts(options = {}) {
        try {
            const { page = 1, limit = 20, filters = {}, sortBy = 'createdAt', sortOrder = 'desc', includeDeleted = false, } = options;
            // Build cache key based on query params
            const cacheKey = this.buildListCacheKey(options);
            // Try to get from cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                logger_1.logger.debug('Products list retrieved from cache', { page, limit, filters });
                return cachedResult;
            }
            // Get from database with timing
            const startTime = Date.now();
            const result = await product_repository_1.productRepository.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: this.buildQueryFilters(filters),
                orderBy: { [sortBy]: sortOrder },
                includeDeleted,
            });
            // Calculate pagination info
            const total = await product_repository_1.productRepository.count(this.buildQueryFilters(filters), includeDeleted);
            const pages = Math.ceil(total / limit);
            logger_1.logger.debug(`Products fetched from database in ${Date.now() - startTime}ms`, {
                count: result.length,
                total,
                page,
                filters: Object.keys(filters).length > 0 ? true : false,
            });
            const response = {
                products: result,
                total,
                pages,
            };
            // Cache the result
            const cacheTags = ['products:list'];
            if (filters.category)
                cacheTags.push(`category:${filters.category}`);
            if (filters.brand)
                cacheTags.push(`brand:${filters.brand}`);
            if (filters.vendorId)
                cacheTags.push(`vendor:${filters.vendorId}`);
            await this.cacheService.set(cacheKey, response, this.DEFAULT_CACHE_TTL, cacheTags);
            return response;
        }
        catch (error) {
            logger_1.logger.error('Failed to retrieve products list', {
                error: error.message,
                filters: options.filters,
            });
            throw new ProductServiceError(`Failed to get products: ${error.message}`);
        }
    }
    /**
     * Update a product with validation
     */
    async updateProduct(productId, updateData) {
        try {
            // Validate update data
            const validationErrors = (0, validation_1.validateProductUpdate)(updateData);
            if (validationErrors.length > 0) {
                throw new ProductValidationError(validationErrors);
            }
            // Check if product exists
            const existingProduct = await this.getProductById(productId);
            // If updating SKU, check for duplicates
            if (updateData.sku && updateData.sku !== existingProduct.sku) {
                const duplicateCheck = await product_repository_1.productRepository.findBySku(updateData.sku);
                if (duplicateCheck) {
                    throw new DuplicateProductError(updateData.sku);
                }
            }
            // Update slug if name is changed
            if (updateData.name && !updateData.slug) {
                updateData.slug = this.generateSlug(updateData.name);
            }
            // Perform update
            const startTime = Date.now();
            const updatedProduct = await product_repository_1.productRepository.update(productId, updateData);
            logger_1.logger.info(`Product updated successfully in ${Date.now() - startTime}ms`, {
                productId,
                fields: Object.keys(updateData).join(', '),
            });
            // Invalidate caches
            await this.cacheService.del(`${this.PRODUCT_CACHE_PREFIX}${productId}`);
            await this.invalidateRelatedCaches(existingProduct.category);
            if (updateData.category && updateData.category !== existingProduct.category) {
                await this.invalidateRelatedCaches(updateData.category);
            }
            return updatedProduct;
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error('Failed to update product', { productId, error: error.message });
            throw new ProductServiceError(`Failed to update product: ${error.message}`);
        }
    }
    /**
     * Delete a product (soft delete)
     */
    async deleteProduct(productId) {
        try {
            // Check if product exists
            const product = await this.getProductById(productId);
            // Soft delete the product
            await product_repository_1.productRepository.softDelete(productId);
            logger_1.logger.info(`Product soft deleted`, { productId });
            // Invalidate caches
            await this.cacheService.del(`${this.PRODUCT_CACHE_PREFIX}${productId}`);
            await this.invalidateRelatedCaches(product.category);
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error('Failed to delete product', { productId, error: error.message });
            throw new ProductServiceError(`Failed to delete product: ${error.message}`);
        }
    }
    /**
     * Permanently delete a product (hard delete)
     */
    async permanentlyDeleteProduct(productId) {
        try {
            // Check if product exists first
            const product = await this.getProductById(productId, true);
            // Hard delete the product
            await product_repository_1.productRepository.hardDelete(productId);
            logger_1.logger.info(`Product permanently deleted`, { productId });
            // Invalidate caches
            await this.cacheService.del(`${this.PRODUCT_CACHE_PREFIX}${productId}`);
            await this.invalidateRelatedCaches(product.category);
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error('Failed to permanently delete product', { productId, error: error.message });
            throw new ProductServiceError(`Failed to permanently delete product: ${error.message}`);
        }
    }
    /**
     * Bulk update product stock levels
     */
    async bulkUpdateStock(updates) {
        try {
            // Validate updates
            if (!Array.isArray(updates) || updates.length === 0) {
                throw new ProductValidationError(['Invalid bulk update format or empty updates array']);
            }
            // Make sure all stock values are valid numbers
            const invalidUpdates = updates.filter((update) => typeof update.newStock !== 'number' || update.newStock < 0);
            if (invalidUpdates.length > 0) {
                throw new ProductValidationError([
                    'Invalid stock values. Stock must be a non-negative number',
                ]);
            }
            // Perform bulk update
            const startTime = Date.now();
            await product_repository_1.productRepository.bulkUpdateStock(updates);
            logger_1.logger.info(`Bulk stock update completed in ${Date.now() - startTime}ms`, {
                count: updates.length,
            });
            // Invalidate product caches
            for (const update of updates) {
                await this.cacheService.del(`${this.PRODUCT_CACHE_PREFIX}${update.productId}`);
            }
            // Invalidate list caches that include stock status
            await this.cacheService.delByPattern(`${this.PRODUCTS_LIST_CACHE_PREFIX}*inStock*`);
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error('Failed to perform bulk stock update', { error: error.message });
            throw new ProductServiceError(`Failed to update stock: ${error.message}`);
        }
    }
    /**
     * Search products with optimized full-text search
     */
    async searchProducts(query, options = {}) {
        try {
            if (!query || query.trim().length === 0) {
                throw new ProductValidationError(['Search query cannot be empty']);
            }
            const { page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc' } = options;
            // Build cache key for this search
            const cacheKey = `${this.PRODUCTS_LIST_CACHE_PREFIX}search:${query.toLowerCase()}:page=${page}:limit=${limit}:sort=${sortBy}:${sortOrder}`;
            // Try to get from cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                logger_1.logger.debug('Search results retrieved from cache', { query, page, limit });
                return cachedResult;
            }
            // Perform the search with timing
            const startTime = Date.now();
            const result = await product_repository_1.productRepository.search(query, {
                skip: (page - 1) * limit,
                take: limit,
                sortBy,
                sortOrder,
            });
            logger_1.logger.debug(`Search performed in ${Date.now() - startTime}ms`, {
                query,
                resultsCount: result.products.length,
                total: result.total,
            });
            // Cache the results for a shorter period (search results change more often)
            await this.cacheService.set(cacheKey, result, 1800, ['products:search']);
            return result;
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error('Product search failed', { query, error: error.message });
            throw new ProductServiceError(`Product search failed: ${error.message}`);
        }
    }
    /**
     * Get featured products (optimized query)
     */
    async getFeaturedProducts(categoryId, limit = 10) {
        try {
            const cacheKey = `products:featured:${categoryId || 'all'}:limit=${limit}`;
            // Try to get from cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                logger_1.logger.debug('Featured products retrieved from cache', { categoryId, limit });
                return cachedResult;
            }
            // Get featured products
            const startTime = Date.now();
            const products = await product_repository_1.productRepository.getFeatured(categoryId, limit);
            logger_1.logger.debug(`Featured products fetched in ${Date.now() - startTime}ms`, {
                count: products.length,
                categoryId,
            });
            // Cache the results
            const cacheTags = ['products:featured'];
            if (categoryId)
                cacheTags.push(`category:${categoryId}`);
            await this.cacheService.set(cacheKey, products, this.DEFAULT_CACHE_TTL, cacheTags);
            return products;
        }
        catch (error) {
            logger_1.logger.error('Failed to get featured products', {
                categoryId,
                error: error.message,
            });
            throw new ProductServiceError(`Failed to get featured products: ${error.message}`);
        }
    }
    /**
     * Get related products based on current product
     */
    async getRelatedProducts(productId, limit = 8) {
        try {
            const cacheKey = `products:related:${productId}:limit=${limit}`;
            // Try to get from cache first
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult) {
                logger_1.logger.debug('Related products retrieved from cache', { productId, limit });
                return cachedResult;
            }
            // Get product to find related items
            const product = await this.getProductById(productId);
            // Get related products based on category and tags
            const startTime = Date.now();
            const relatedProducts = await product_repository_1.productRepository.getRelated(productId, product.category, JSON.parse(product.tags), limit);
            logger_1.logger.debug(`Related products fetched in ${Date.now() - startTime}ms`, {
                productId,
                count: relatedProducts.length,
            });
            // Cache the results
            await this.cacheService.set(cacheKey, relatedProducts, this.DEFAULT_CACHE_TTL, [
                `product:${productId}`,
                `category:${product.category}`,
            ]);
            return relatedProducts;
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error('Failed to get related products', { productId, error: error.message });
            throw new ProductServiceError(`Failed to get related products: ${error.message}`);
        }
    }
    /**
     * Get product by custom field (e.g. slug)
     */
    async getProductByField(field, value) {
        try {
            const cacheKey = `${this.PRODUCT_CACHE_PREFIX}${field}:${value}`;
            // Try to get from cache first
            const cachedProduct = await this.cacheService.get(cacheKey);
            if (cachedProduct) {
                logger_1.logger.debug(`Product retrieved from cache by ${field}`, { [field]: value });
                return cachedProduct;
            }
            // Get from database
            const startTime = Date.now();
            const product = await product_repository_1.productRepository.findByField(field, value);
            logger_1.logger.debug(`Product fetched from database by ${field} in ${Date.now() - startTime}ms`, {
                [field]: value,
            });
            if (!product) {
                throw new ProductServiceError(`Product with ${field} "${value}" not found`);
            }
            // Cache the product with both ID and field tags
            await this.cacheService.set(cacheKey, product, this.DEFAULT_CACHE_TTL, [
                `product:${product.id}`,
                `category:${product.category}`,
                `${field}:${value}`,
            ]);
            return product;
        }
        catch (error) {
            // Re-throw our custom errors
            if (error instanceof ProductServiceError) {
                throw error;
            }
            // Log and wrap other errors
            logger_1.logger.error(`Failed to retrieve product by ${field}`, {
                [field]: value,
                error: error.message,
            });
            throw new ProductServiceError(`Failed to get product by ${field}: ${error.message}`);
        }
    }
    /**
     * Check stock levels and update if below threshold
     * This can be run as a scheduled task
     */
    async checkLowStockProducts(threshold = 10) {
        try {
            const lowStockProducts = await product_repository_1.productRepository.findLowStock(threshold);
            if (lowStockProducts.length > 0) {
                logger_1.logger.warn('Low stock products detected', { count: lowStockProducts.length, threshold });
            }
            return lowStockProducts.map((p) => ({
                id: p.id,
                name: p.name,
                stock: p.stock,
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to check low stock products', { threshold, error: error.message });
            throw new ProductServiceError(`Failed to check low stock: ${error.message}`);
        }
    }
    /**
     * Generate a URL-friendly slug from a product name
     */
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    /**
     * Build database filters from the API filters
     */
    buildQueryFilters(filters) {
        const dbFilters = {};
        if (filters.category)
            dbFilters.category = filters.category;
        if (filters.brand)
            dbFilters.brand = filters.brand;
        if (filters.vendorId)
            dbFilters.vendorId = filters.vendorId;
        if (filters.isFeatured !== undefined)
            dbFilters.isFeatured = filters.isFeatured;
        // Price range filters
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            dbFilters.price = {};
            if (filters.minPrice !== undefined)
                dbFilters.price.gte = filters.minPrice;
            if (filters.maxPrice !== undefined)
                dbFilters.price.lte = filters.maxPrice;
        }
        // Stock filter
        if (filters.inStock !== undefined) {
            dbFilters.stock = filters.inStock ? { gt: 0 } : { equals: 0 };
        }
        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
            dbFilters.tags = {
                hasSome: filters.tags,
            };
        }
        return dbFilters;
    }
    /**
     * Build a cache key for list queries
     */
    buildListCacheKey(options) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', filters = {}, } = options;
        let cacheKey = `${this.PRODUCTS_LIST_CACHE_PREFIX}page=${page}:limit=${limit}:sort=${sortBy}:${sortOrder}`;
        // Add filters to cache key
        if (filters.category)
            cacheKey += `:category=${filters.category}`;
        if (filters.brand)
            cacheKey += `:brand=${filters.brand}`;
        if (filters.minPrice)
            cacheKey += `:minPrice=${filters.minPrice}`;
        if (filters.maxPrice)
            cacheKey += `:maxPrice=${filters.maxPrice}`;
        if (filters.inStock !== undefined)
            cacheKey += `:inStock=${filters.inStock}`;
        if (filters.isFeatured !== undefined)
            cacheKey += `:featured=${filters.isFeatured}`;
        if (filters.vendorId)
            cacheKey += `:vendor=${filters.vendorId}`;
        if (filters.tags && filters.tags.length > 0) {
            cacheKey += `:tags=${filters.tags.join(',')}`;
        }
        return cacheKey;
    }
    /**
     * Invalidate related caches for a category
     */
    async invalidateRelatedCaches(category) {
        // Invalidate category-specific caches
        await this.cacheService.invalidateByTags([`category:${category}`]);
        // Invalidate general product list caches
        await this.cacheService.invalidateByTags(['products:list', 'products:featured']);
    }
}
exports.EnhancedProductService = EnhancedProductService;
exports.default = EnhancedProductService;
//# sourceMappingURL=enhanced-product.service.js.map