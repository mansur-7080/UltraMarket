"use strict";
/**
 * Enhanced Product Service with Prisma
 * Professional implementation with robust error handling, validation, and caching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedProductService = exports.ProductType = exports.ProductStatus = exports.DuplicateProductError = exports.ProductValidationError = exports.ProductNotFoundError = exports.ProductServiceError = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../utils/logger");
const perf_hooks_1 = require("perf_hooks");
const prisma_1 = tslib_1.__importDefault(require("../lib/prisma"));
// Define SQL utility functions
const SQL = {
    raw: (value) => value,
};
// Custom error classes for better error handling
class ProductServiceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ProductServiceError';
    }
}
exports.ProductServiceError = ProductServiceError;
class ProductNotFoundError extends ProductServiceError {
    constructor(productId) {
        super(`Product not found with ID: ${productId}`);
        this.name = 'ProductNotFoundError';
    }
}
exports.ProductNotFoundError = ProductNotFoundError;
class ProductValidationError extends ProductServiceError {
    validationErrors;
    constructor(message, validationErrors) {
        super(message);
        this.name = 'ProductValidationError';
        this.validationErrors = validationErrors;
    }
}
exports.ProductValidationError = ProductValidationError;
class DuplicateProductError extends ProductServiceError {
    constructor(sku) {
        super(`Product with SKU "${sku}" already exists`);
        this.name = 'DuplicateProductError';
    }
}
exports.DuplicateProductError = DuplicateProductError;
// Define product status and type enums
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ProductType;
(function (ProductType) {
    ProductType["PHYSICAL"] = "PHYSICAL";
    ProductType["DIGITAL"] = "DIGITAL";
    ProductType["SERVICE"] = "SERVICE";
    ProductType["SUBSCRIPTION"] = "SUBSCRIPTION";
})(ProductType || (exports.ProductType = ProductType = {}));
// Utility function to calculate current price with discount
const calculateCurrentPrice = (price, salePercentage) => {
    if (salePercentage && salePercentage > 0) {
        return Number(price) - Number(price) * (salePercentage / 100);
    }
    return Number(price);
};
// Utility function to generate slug
const generateSlug = (name, id) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .concat('-', id.substring(id.length - 6));
};
class EnhancedProductService {
    cacheService;
    constructor(cacheService) {
        this.cacheService = cacheService;
    }
    /**
     * Get all products with pagination, filtering, and caching
     */
    async getProducts(options) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const { page, limit, filters, sortBy, sortOrder, select, includeInactive } = options;
            const skip = (page - 1) * limit;
            // Generate cache key based on request parameters
            const cacheKey = `products:${JSON.stringify({
                page,
                limit,
                filters,
                sortBy,
                sortOrder,
                select,
                includeInactive,
            })}`;
            // Try to get from cache first
            if (this.cacheService) {
                const cachedResult = await this.cacheService.get(cacheKey);
                if (cachedResult) {
                    logger_1.logger.debug('Products returned from cache', {
                        page,
                        limit,
                        cacheKey,
                    });
                    return cachedResult;
                }
            }
            // Build query for Prisma
            const where = {};
            // Only include active products by default unless explicitly requested
            if (!includeInactive) {
                where.isActive = true;
            }
            else if (filters.isActive !== undefined) {
                where.isActive = filters.isActive;
            }
            if (filters.categoryId) {
                where.categoryId = filters.categoryId;
            }
            if (filters.brand) {
                where.brand = filters.brand;
            }
            if (filters.minPrice || filters.maxPrice) {
                where.price = {};
                if (filters.minPrice)
                    where.price.gte = filters.minPrice;
                if (filters.maxPrice)
                    where.price.lte = filters.maxPrice;
            }
            if (filters.isFeatured !== undefined) {
                where.isFeatured = filters.isFeatured;
            }
            if (filters.vendorId) {
                where.vendorId = filters.vendorId;
            }
            if (filters.tags && filters.tags.length > 0) {
                where.tags = { hasSome: filters.tags };
            }
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.type) {
                where.type = filters.type;
            }
            if (filters.isBestSeller !== undefined) {
                where.isBestSeller = filters.isBestSeller;
            }
            if (filters.isNewArrival !== undefined) {
                where.isNewArrival = filters.isNewArrival;
            }
            if (filters.isOnSale !== undefined) {
                where.isOnSale = filters.isOnSale;
            }
            if (filters.search) {
                // Use OR conditions for search
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                    { shortDescription: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            // Build sort for Prisma
            const orderBy = {};
            orderBy[sortBy || 'createdAt'] = sortOrder || 'desc';
            // Execute query and count in parallel for better performance
            const [products, total] = await Promise.all([
                prisma_1.default.$queryRaw `
          SELECT * FROM products 
          WHERE ${SQL.raw(this.buildWhereClause(where))}
          ORDER BY ${SQL.raw(`"${sortBy || 'createdAt'}" ${sortOrder || 'DESC'}`)}
          LIMIT ${limit} OFFSET ${skip}
        `,
                prisma_1.default.$queryRaw `
          SELECT COUNT(*) FROM products 
          WHERE ${SQL.raw(this.buildWhereClause(where))}
        `,
            ]);
            const result = {
                products,
                total: Number(total[0].count),
                page,
                limit,
                totalPages: Math.ceil(Number(total[0].count) / limit),
            };
            // Cache results
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, result, 300, // 5 minutes TTL
                ['products', `page:${page}`]);
            }
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.debug('Products query completed', {
                duration: `${duration}ms`,
                count: products.length,
                total: total[0].count,
                page,
            });
            return result;
        }
        catch (error) {
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.error('Failed to get products', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`,
                options,
            });
            throw new ProductServiceError(`Failed to retrieve products: ${error.message}`);
        }
    }
    /**
     * Build SQL where clause from filters
     */
    buildWhereClause(where) {
        const conditions = [];
        Object.entries(where).forEach(([key, value]) => {
            if (key === 'OR' && Array.isArray(value)) {
                const orConditions = value.map((condition) => {
                    return Object.entries(condition)
                        .map(([field, val]) => {
                        if (typeof val === 'object' && val !== null) {
                            const op = Object.keys(val)[0];
                            const opValue = val[op];
                            if (op === 'contains') {
                                return `"${field}" ILIKE '%${opValue}%'`;
                            }
                        }
                        return `"${field}" = '${val}'`;
                    })
                        .join(' AND ');
                });
                conditions.push(`(${orConditions.join(' OR ')})`);
            }
            else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.entries(value).forEach(([op, val]) => {
                    if (op === 'gte') {
                        conditions.push(`"${key}" >= ${val}`);
                    }
                    else if (op === 'lte') {
                        conditions.push(`"${key}" <= ${val}`);
                    }
                    else if (op === 'hasSome' && Array.isArray(val)) {
                        conditions.push(`"${key}" && ARRAY[${val.map((item) => `'${item}'`).join(',')}]::text[]`);
                    }
                });
            }
            else if (Array.isArray(value)) {
                conditions.push(`"${key}" = ANY(ARRAY[${value.map((v) => `'${v}'`).join(',')}]::text[])`);
            }
            else if (typeof value === 'boolean') {
                conditions.push(`"${key}" = ${value}`);
            }
            else if (value === null) {
                conditions.push(`"${key}" IS NULL`);
            }
            else {
                conditions.push(`"${key}" = '${value}'`);
            }
        });
        return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    }
    /**
     * Get product by ID with caching
     */
    async getProductById(id) {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Try to get from cache
            const cacheKey = `product:${id}`;
            if (this.cacheService) {
                const cachedProduct = await this.cacheService.get(cacheKey);
                if (cachedProduct) {
                    logger_1.logger.debug('Product returned from cache', { productId: id });
                    return cachedProduct;
                }
            }
            // Get from database
            const product = await prisma_1.default.$queryRaw `
        SELECT * FROM products WHERE id = ${id} LIMIT 1
      `;
            if (!product || product.length === 0) {
                throw new ProductNotFoundError(id);
            }
            // Cache the product
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, product[0], 3600, // 1 hour TTL
                ['products', `product:${id}`]);
            }
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.debug('Product retrieved by ID', {
                duration: `${duration}ms`,
                productId: id,
            });
            return product[0];
        }
        catch (error) {
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            if (error instanceof ProductNotFoundError) {
                logger_1.logger.info('Product not found', { productId: id, duration: `${duration}ms` });
                throw error;
            }
            logger_1.logger.error('Failed to get product by ID', {
                error: error.message,
                stack: error.stack,
                productId: id,
                duration: `${duration}ms`,
            });
            throw new ProductServiceError(`Failed to retrieve product: ${error.message}`);
        }
    }
    /**
     * Get product by slug with caching
     */
    async getProductBySlug(slug) {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Try to get from cache
            const cacheKey = `product:slug:${slug}`;
            if (this.cacheService) {
                const cachedProduct = await this.cacheService.get(cacheKey);
                if (cachedProduct) {
                    logger_1.logger.debug('Product returned from cache by slug', { slug });
                    return cachedProduct;
                }
            }
            // Get from database
            const product = await prisma_1.default.$queryRaw `
        SELECT * FROM products WHERE slug = ${slug} AND "isActive" = true LIMIT 1
      `;
            if (!product || product.length === 0) {
                logger_1.logger.info('Product not found by slug', { slug });
                return null;
            }
            // Cache the product
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, product[0], 3600, // 1 hour TTL
                ['products', `product:${product[0].id}`]);
            }
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.debug('Product retrieved by slug', {
                duration: `${duration}ms`,
                slug,
            });
            return product[0];
        }
        catch (error) {
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.error('Failed to get product by slug', {
                error: error.message,
                stack: error.stack,
                slug,
                duration: `${duration}ms`,
            });
            throw new ProductServiceError(`Failed to retrieve product by slug: ${error.message}`);
        }
    }
    /**
     * Create new product with enhanced validation
     */
    async createProduct(productData) {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Validate data manually for more detailed error messages
            const validationErrors = this.validateProductData(productData);
            if (Object.keys(validationErrors).length > 0) {
                throw new ProductValidationError('Product validation failed', validationErrors);
            }
            // Check if SKU already exists
            const existingProducts = await prisma_1.default.$queryRaw `
        SELECT id FROM products WHERE sku = ${productData.sku} LIMIT 1
      `;
            if (existingProducts && existingProducts.length > 0) {
                throw new DuplicateProductError(productData.sku);
            }
            // Generate slug if not provided
            if (!productData.slug && productData.name) {
                productData.slug = productData.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
            }
            // Prepare numeric values
            const price = typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price;
            const comparePrice = productData.comparePrice
                ? typeof productData.comparePrice === 'string'
                    ? parseFloat(productData.comparePrice)
                    : productData.comparePrice
                : null;
            const costPrice = productData.costPrice
                ? typeof productData.costPrice === 'string'
                    ? parseFloat(productData.costPrice)
                    : productData.costPrice
                : null;
            // Create product using raw SQL
            const columns = [];
            const values = [];
            const placeholders = [];
            let counter = 1;
            for (const [key, value] of Object.entries(productData)) {
                if (value !== undefined && value !== null) {
                    columns.push(`"${key}"`);
                    values.push(value);
                    placeholders.push(`$${counter++}`);
                }
            }
            // Add createdAt and updatedAt
            columns.push('"createdAt"');
            values.push(new Date());
            placeholders.push(`$${counter++}`);
            columns.push('"updatedAt"');
            values.push(new Date());
            placeholders.push(`$${counter++}`);
            // Generate the SQL query
            const query = `
        INSERT INTO products (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
            // Execute the query
            const product = await prisma_1.default.$queryRawUnsafe(query, ...values);
            // Invalidate relevant caches
            if (this.cacheService) {
                await this.cacheService.invalidateByTags(['products']);
            }
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.info('Product created successfully', {
                duration: `${duration}ms`,
                productId: product[0].id,
                sku: product[0].sku,
            });
            return product[0];
        }
        catch (error) {
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            if (error instanceof ProductValidationError || error instanceof DuplicateProductError) {
                logger_1.logger.warn('Product creation failed with validation errors', {
                    errors: error instanceof ProductValidationError
                        ? error.validationErrors
                        : { sku: 'Duplicate SKU' },
                    duration: `${duration}ms`,
                });
                throw error;
            }
            logger_1.logger.error('Failed to create product', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`,
                sku: productData.sku,
            });
            throw new ProductServiceError(`Failed to create product: ${error.message}`);
        }
    }
    /**
     * Validate product data manually for detailed error messages
     */
    validateProductData(data) {
        const errors = {};
        // Required fields
        if (!data.name)
            errors.name = 'Product name is required';
        else if (data.name.length > 200)
            errors.name = 'Product name cannot exceed 200 characters';
        if (data.description && data.description.length > 2000)
            errors.description = 'Product description cannot exceed 2000 characters';
        if (!data.sku)
            errors.sku = 'SKU is required';
        else if (!/^[A-Z0-9\-]{5,20}$/.test(data.sku.toUpperCase())) {
            errors.sku = 'SKU must be 5-20 alphanumeric characters or hyphens';
        }
        if (!data.categoryId)
            errors.categoryId = 'Category ID is required';
        if (data.price === undefined)
            errors.price = 'Price is required';
        else {
            const priceValue = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
            if (isNaN(priceValue) || priceValue < 0)
                errors.price = 'Price must be a valid positive number';
        }
        // Optional fields with validation
        if (data.comparePrice !== undefined) {
            const comparePrice = typeof data.comparePrice === 'string' ? parseFloat(data.comparePrice) : data.comparePrice;
            if (isNaN(comparePrice) || comparePrice < 0) {
                errors.comparePrice = 'Compare price must be a valid positive number';
            }
        }
        if (data.salePercentage !== undefined &&
            (isNaN(data.salePercentage) || data.salePercentage < 0 || data.salePercentage > 100)) {
            errors.salePercentage = 'Sale percentage must be a number between 0 and 100';
        }
        // SEO validations
        if (data.metaTitle && data.metaTitle.length > 70) {
            errors.metaTitle = 'Meta title cannot exceed 70 characters';
        }
        if (data.metaDescription && data.metaDescription.length > 160) {
            errors.metaDescription = 'Meta description cannot exceed 160 characters';
        }
        if (data.metaKeywords && data.metaKeywords.length > 255) {
            errors.metaKeywords = 'Meta keywords cannot exceed 255 characters';
        }
        return errors;
    }
    /**
     * Update product with validation and caching
     */
    async updateProduct(id, updateData) {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Validate update data
            const validationErrors = this.validateProductUpdateData(updateData);
            if (Object.keys(validationErrors).length > 0) {
                throw new ProductValidationError('Product validation failed', validationErrors);
            }
            // Check if product exists
            const existingProducts = await prisma_1.default.$queryRaw `
        SELECT * FROM products WHERE id = ${id} LIMIT 1
      `;
            if (!existingProducts || existingProducts.length === 0) {
                throw new ProductNotFoundError(id);
            }
            const existingProduct = existingProducts[0];
            // Check if updating to a duplicate SKU
            if (updateData.sku && updateData.sku !== existingProduct.sku) {
                const duplicateSku = await prisma_1.default.$queryRaw `
          SELECT id FROM products 
          WHERE sku = ${updateData.sku} AND id != ${id} 
          LIMIT 1
        `;
                if (duplicateSku && duplicateSku.length > 0) {
                    throw new DuplicateProductError(updateData.sku);
                }
            }
            // Generate slug from name if name is changed and slug is not provided
            if (updateData.name && !updateData.slug) {
                updateData.slug = updateData.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
                    .concat('-', id.substring(id.length - 6));
            }
            // Update product
            const updates = [];
            const values = [];
            let counter = 1;
            for (const [key, value] of Object.entries(updateData)) {
                if (value !== undefined && value !== null) {
                    updates.push(`"${key}" = $${counter++}`);
                    values.push(value);
                }
            }
            // Add updatedAt timestamp
            updates.push(`"updatedAt" = $${counter++}`);
            values.push(new Date());
            // Add the ID for WHERE clause
            values.push(id);
            // Generate and execute the query
            const query = `
        UPDATE products
        SET ${updates.join(', ')}
        WHERE id = $${counter}
        RETURNING *
      `;
            const updatedProduct = await prisma_1.default.$queryRawUnsafe(query, ...values);
            // Invalidate caches
            if (this.cacheService) {
                await Promise.all([
                    this.cacheService.del(`product:${id}`),
                    this.cacheService.invalidateByTags([`product:${id}`]),
                    this.cacheService.invalidateByTags(['products']),
                ]);
            }
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.info('Product updated successfully', {
                duration: `${duration}ms`,
                productId: id,
            });
            return updatedProduct[0];
        }
        catch (error) {
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            if (error instanceof ProductValidationError ||
                error instanceof ProductNotFoundError ||
                error instanceof DuplicateProductError) {
                logger_1.logger.warn('Product update failed', {
                    error: error.message,
                    productId: id,
                    duration: `${duration}ms`,
                });
                throw error;
            }
            logger_1.logger.error('Failed to update product', {
                error: error.message,
                stack: error.stack,
                productId: id,
                duration: `${duration}ms`,
            });
            throw new ProductServiceError(`Failed to update product: ${error.message}`);
        }
    }
    /**
     * Validate product update data
     */
    validateProductUpdateData(data) {
        const errors = {};
        if (data.name !== undefined && data.name.length > 200) {
            errors.name = 'Product name cannot exceed 200 characters';
        }
        if (data.description !== undefined && data.description.length > 2000) {
            errors.description = 'Product description cannot exceed 2000 characters';
        }
        if (data.sku !== undefined && !/^[A-Z0-9\-]{5,20}$/.test(data.sku.toUpperCase())) {
            errors.sku = 'SKU must be 5-20 alphanumeric characters or hyphens';
        }
        if (data.price !== undefined) {
            const priceValue = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
            if (isNaN(priceValue) || priceValue < 0) {
                errors.price = 'Price must be a valid positive number';
            }
        }
        if (data.comparePrice !== undefined) {
            const comparePrice = typeof data.comparePrice === 'string' ? parseFloat(data.comparePrice) : data.comparePrice;
            if (isNaN(comparePrice) || comparePrice < 0) {
                errors.comparePrice = 'Compare price must be a valid positive number';
            }
        }
        if (data.salePercentage !== undefined &&
            (isNaN(data.salePercentage) || data.salePercentage < 0 || data.salePercentage > 100)) {
            errors.salePercentage = 'Sale percentage must be a number between 0 and 100';
        }
        // SEO validations
        if (data.metaTitle && data.metaTitle.length > 70) {
            errors.metaTitle = 'Meta title cannot exceed 70 characters';
        }
        if (data.metaDescription && data.metaDescription.length > 160) {
            errors.metaDescription = 'Meta description cannot exceed 160 characters';
        }
        if (data.metaKeywords && data.metaKeywords.length > 255) {
            errors.metaKeywords = 'Meta keywords cannot exceed 255 characters';
        }
        return errors;
    }
    /**
     * Delete product by ID with proper cleanup
     */
    async deleteProduct(id) {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Check if product exists
            const existingProducts = await prisma_1.default.$queryRaw `
        SELECT * FROM products WHERE id = ${id} LIMIT 1
      `;
            if (!existingProducts || existingProducts.length === 0) {
                throw new ProductNotFoundError(id);
            }
            const deletedProduct = existingProducts[0];
            // Delete product
            await prisma_1.default.$queryRaw `
        DELETE FROM products WHERE id = ${id}
      `;
            // Invalidate caches
            if (this.cacheService) {
                await Promise.all([
                    this.cacheService.del(`product:${id}`),
                    this.cacheService.del(`product:slug:${deletedProduct.slug}`),
                    this.cacheService.invalidateByTags([`product:${id}`]),
                    this.cacheService.invalidateByTags(['products']),
                ]);
            }
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.info('Product deleted successfully', {
                duration: `${duration}ms`,
                productId: id,
                sku: deletedProduct.sku,
            });
            return { success: true, id, message: 'Product deleted successfully' };
        }
        catch (error) {
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            if (error instanceof ProductNotFoundError) {
                logger_1.logger.warn('Product deletion failed - not found', {
                    productId: id,
                    duration: `${duration}ms`,
                });
                throw error;
            }
            logger_1.logger.error('Failed to delete product', {
                error: error.message,
                stack: error.stack,
                productId: id,
                duration: `${duration}ms`,
            });
            throw new ProductServiceError(`Failed to delete product: ${error.message}`);
        }
    }
    /**
     * Get product statistics with caching
     */
    async getProductStats() {
        const startTime = perf_hooks_1.performance.now();
        try {
            const cacheKey = 'product:stats';
            // Try to get from cache
            if (this.cacheService) {
                const cachedStats = await this.cacheService.get(cacheKey);
                if (cachedStats) {
                    logger_1.logger.debug('Product stats returned from cache');
                    return cachedStats;
                }
            }
            // Get counts by category
            const categoryCounts = await prisma_1.default.$queryRaw `
        SELECT "categoryId", COUNT(*) as count 
        FROM products 
        WHERE "isActive" = true 
        GROUP BY "categoryId"
      `;
            // Get counts by brand
            const brandCounts = await prisma_1.default.$queryRaw `
        SELECT brand, COUNT(*) as count 
        FROM products 
        WHERE "isActive" = true AND brand IS NOT NULL 
        GROUP BY brand
      `;
            // Get price statistics
            const priceStats = await prisma_1.default.$queryRaw `
        SELECT 
          MIN(price) as "minPrice", 
          MAX(price) as "maxPrice", 
          AVG(price) as "avgPrice" 
        FROM products 
        WHERE "isActive" = true
      `;
            // Combine results
            const result = {
                totalActiveProducts: await this.countProducts({ isActive: true }),
                totalProducts: await this.countProducts({}),
                categoryCounts,
                brandCounts: brandCounts,
                priceStats: priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 },
            };
            // Cache the results
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, result, 3600, // 1 hour TTL
                ['products', 'stats']);
            }
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.debug('Product stats generated', {
                duration: `${duration}ms`,
            });
            return result;
        }
        catch (error) {
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.error('Failed to get product stats', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`,
            });
            throw new ProductServiceError(`Failed to get product stats: ${error.message}`);
        }
    }
    /**
     * Count products based on filters
     */
    async countProducts(where) {
        const whereClause = this.buildWhereClause(where);
        const result = await prisma_1.default.$queryRaw `
      SELECT COUNT(*) as count FROM products 
      WHERE ${SQL.raw(whereClause)}
    `;
        return Number(result[0].count);
    }
    /**
     * Bulk update product stock levels
     */
    async bulkUpdateStock(updates) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const results = {
                success: [],
                failed: [],
            };
            // Process each update one by one
            for (const update of updates) {
                try {
                    if (isNaN(update.stock) || update.stock < 0) {
                        results.failed.push({
                            id: update.id,
                            error: 'Stock must be a non-negative number',
                        });
                        continue;
                    }
                    // Update the stock level
                    const updatedProduct = await prisma_1.default.$queryRaw `
            UPDATE products 
            SET stock = ${update.stock}, "updatedAt" = NOW() 
            WHERE id = ${update.id} 
            RETURNING id
          `;
                    if (!updatedProduct || updatedProduct.length === 0) {
                        results.failed.push({
                            id: update.id,
                            error: 'Product not found',
                        });
                    }
                    else {
                        results.success.push(update.id);
                    }
                }
                catch (error) {
                    results.failed.push({
                        id: update.id,
                        error: error.message,
                    });
                }
            }
            // Invalidate caches for updated products
            if (this.cacheService) {
                await Promise.all([
                    ...results.success.map((id) => this.cacheService.del(`product:${id}`)),
                    this.cacheService.invalidateByTags(['products']),
                ]);
            }
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.info('Bulk stock update completed', {
                duration: `${duration}ms`,
                total: updates.length,
                succeeded: results.success.length,
                failed: results.failed.length,
            });
            return results;
        }
        catch (error) {
            const duration = Math.round(perf_hooks_1.performance.now() - startTime);
            logger_1.logger.error('Failed to bulk update stock', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`,
            });
            throw new ProductServiceError(`Failed to bulk update stock: ${error.message}`);
        }
    }
}
exports.EnhancedProductService = EnhancedProductService;
//# sourceMappingURL=prisma-enhanced-product.service.js.map