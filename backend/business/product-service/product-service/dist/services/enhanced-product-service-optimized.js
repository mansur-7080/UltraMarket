"use strict";
/**
 * Enhanced Product Service - Final implementation
 * Provides an advanced product management service with proper error handling, caching,
 * performance optimization, and SQL query execution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedProductService = exports.ProductError = exports.ProductType = exports.ProductStatus = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../utils/logger");
const perf_hooks_1 = require("perf_hooks");
const prisma_1 = tslib_1.__importDefault(require("../lib/prisma"));
// Define product-related enums
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["INACTIVE"] = "INACTIVE";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ProductType;
(function (ProductType) {
    ProductType["PHYSICAL"] = "PHYSICAL";
    ProductType["DIGITAL"] = "DIGITAL";
    ProductType["SERVICE"] = "SERVICE";
})(ProductType || (exports.ProductType = ProductType = {}));
/**
 * Custom error class for product-related errors
 */
class ProductError extends Error {
    code;
    statusCode;
    constructor(message, code = 'PRODUCT_ERROR', statusCode = 400) {
        super(message);
        this.name = 'ProductError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.ProductError = ProductError;
/**
 * Enhanced Product Service
 * Provides comprehensive product management functionality with advanced features
 */
class EnhancedProductService {
    cacheService;
    constructor(cacheService) {
        this.cacheService = cacheService;
        logger_1.logger.info('Enhanced Product Service initialized');
    }
    /**
     * Get products with pagination and filtering
     * @param options Query options for filtering and pagination
     */
    async getProducts(options = {}) {
        const start = perf_hooks_1.performance.now();
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', filters = {}, includeInactive = false, } = options;
        const skip = (page - 1) * limit;
        // Generate cache key based on query parameters
        const cacheKey = this.generateCacheKey('products', {
            page,
            limit,
            sortBy,
            sortOrder,
            filters,
            includeInactive,
        });
        try {
            // Try to get from cache first
            if (this.cacheService) {
                const cachedResult = await this.cacheService.get(cacheKey);
                if (cachedResult) {
                    logger_1.logger.debug(`Cache hit for products query: ${cacheKey}`);
                    return cachedResult;
                }
            }
            // Build where conditions for SQL
            let whereClause = '1=1'; // Always true base condition
            const whereParams = [];
            // Always filter out inactive products unless specifically included
            if (!includeInactive) {
                whereClause += ' AND is_active = true';
            }
            // Apply filters
            if (filters.categoryId) {
                whereClause += ' AND category_id = ?';
                whereParams.push(filters.categoryId);
            }
            if (filters.vendorId) {
                whereClause += ' AND vendor_id = ?';
                whereParams.push(filters.vendorId);
            }
            if (filters.status) {
                whereClause += ' AND status = ?';
                whereParams.push(filters.status);
            }
            if (filters.type) {
                whereClause += ' AND type = ?';
                whereParams.push(filters.type);
            }
            if (filters.isActive !== undefined) {
                whereClause += ' AND is_active = ?';
                whereParams.push(filters.isActive);
            }
            if (filters.isFeatured !== undefined) {
                whereClause += ' AND is_featured = ?';
                whereParams.push(filters.isFeatured);
            }
            if (filters.isBestSeller !== undefined) {
                whereClause += ' AND is_best_seller = ?';
                whereParams.push(filters.isBestSeller);
            }
            if (filters.isNewArrival !== undefined) {
                whereClause += ' AND is_new_arrival = ?';
                whereParams.push(filters.isNewArrival);
            }
            if (filters.isOnSale !== undefined) {
                whereClause += ' AND is_on_sale = ?';
                whereParams.push(filters.isOnSale);
            }
            // Price range filter
            if (filters.minPrice !== undefined) {
                whereClause += ' AND price >= ?';
                whereParams.push(filters.minPrice);
            }
            if (filters.maxPrice !== undefined) {
                whereClause += ' AND price <= ?';
                whereParams.push(filters.maxPrice);
            }
            // Text search
            if (filters.search) {
                whereClause += ' AND (name ILIKE ? OR description ILIKE ? OR sku ILIKE ? OR brand ILIKE ?)';
                const searchPattern = `%${filters.search}%`;
                whereParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
            }
            // Tags filter
            if (filters.tags && filters.tags.length > 0) {
                whereClause += ' AND tags ?| array[' + filters.tags.map(() => '?').join(',') + ']';
                whereParams.push(...filters.tags);
            }
            // Execute query and count in parallel for better performance
            const productsQuery = `
        SELECT p.*, 
               c.name as category_name,
               c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE ${whereClause}
        ORDER BY ${sortBy || 'created_at'} ${sortOrder || 'DESC'}
        LIMIT ${limit} OFFSET ${skip}
      `;
            const countQuery = `
        SELECT COUNT(*) as total
        FROM products
        WHERE ${whereClause}
      `;
            // Use Prisma's raw query capabilities
            const [productsResult, countResult] = await Promise.all([
                prisma_1.default.$queryRawUnsafe(productsQuery, ...whereParams),
                prisma_1.default.$queryRawUnsafe(countQuery, ...whereParams),
            ]);
            const products = productsResult;
            const total = parseInt(countResult[0].total, 10);
            const totalPages = Math.ceil(total / limit);
            // Process products to match expected format
            const processedProducts = await this.enrichProducts(products);
            const result = {
                products: processedProducts,
                total,
                page,
                limit,
                totalPages,
            };
            // Cache results
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, result, 300, // 5 minutes TTL
                ['products', `page:${page}`, 'list']);
            }
            const duration = perf_hooks_1.performance.now() - start;
            logger_1.logger.debug(`getProducts completed in ${duration.toFixed(2)}ms`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error getting products:', error);
            throw new ProductError('Failed to retrieve products', 'PRODUCT_FETCH_ERROR', 500);
        }
    }
    /**
     * Fetch additional product data to enrich the basic product records
     * @param products Basic product records from the database
     */
    async enrichProducts(products) {
        if (!products.length)
            return [];
        const productIds = products.map((p) => p.id);
        // Get images for all products in one query
        const images = await prisma_1.default.$queryRawUnsafe(`
      SELECT * FROM product_images
      WHERE product_id IN (${productIds.map(() => '?').join(',')})
      ORDER BY sort_order ASC
    `, ...productIds);
        // Get inventory for all products in one query
        const inventory = await prisma_1.default.$queryRawUnsafe(`
      SELECT * FROM inventory
      WHERE product_id IN (${productIds.map(() => '?').join(',')})
    `, ...productIds);
        // Organize the related data by product ID
        const imagesByProduct = this.groupBy(images, 'product_id');
        const inventoryByProduct = this.groupBy(inventory, 'product_id');
        // Enrich each product with its related data
        return products.map((product) => ({
            ...product,
            images: imagesByProduct[product.id] || [],
            inventory: inventoryByProduct[product.id]?.[0] || null,
        }));
    }
    /**
     * Utility function to group array items by a key
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const keyValue = String(item[key]);
            (result[keyValue] = result[keyValue] || []).push(item);
            return result;
        }, {});
    }
    /**
     * Get a single product by ID
     * @param id Product ID
     */
    async getProductById(id) {
        const start = perf_hooks_1.performance.now();
        const cacheKey = `product:${id}`;
        try {
            // Try to get from cache first
            if (this.cacheService) {
                const cachedProduct = await this.cacheService.get(cacheKey);
                if (cachedProduct) {
                    logger_1.logger.debug(`Cache hit for product: ${id}`);
                    return cachedProduct;
                }
            }
            // Fetch the product with a raw query
            const products = await prisma_1.default.$queryRawUnsafe(`
        SELECT p.*, 
               c.id as category_id, 
               c.name as category_name, 
               c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, id);
            if (!products || products.length === 0) {
                throw new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404);
            }
            const product = products[0];
            // Fetch related data
            const [images, inventory, variants, reviews] = await Promise.all([
                prisma_1.default.$queryRawUnsafe(`
          SELECT * FROM product_images
          WHERE product_id = ?
          ORDER BY sort_order ASC, is_main DESC
        `, id),
                prisma_1.default.$queryRawUnsafe(`
          SELECT * FROM inventory
          WHERE product_id = ?
        `, id),
                prisma_1.default.$queryRawUnsafe(`
          SELECT pv.*, i.quantity as inventory_quantity
          FROM product_variants pv
          LEFT JOIN inventory i ON pv.id = i.variant_id
          WHERE pv.product_id = ?
        `, id),
                prisma_1.default.$queryRawUnsafe(`
          SELECT * FROM reviews
          WHERE product_id = ?
          ORDER BY created_at DESC
          LIMIT 5
        `, id),
            ]);
            // Enrich the product with related data
            const enrichedProduct = {
                ...product,
                category: {
                    id: product.category_id,
                    name: product.category_name,
                    slug: product.category_slug,
                },
                images: images,
                inventory: inventory[0] || null,
                variants: variants,
                reviews: reviews,
            };
            // Cache product
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, enrichedProduct, 600, // 10 minutes TTL
                ['products', `product:${id}`, 'detail']);
            }
            const duration = perf_hooks_1.performance.now() - start;
            logger_1.logger.debug(`getProductById completed in ${duration.toFixed(2)}ms`);
            return enrichedProduct;
        }
        catch (error) {
            if (error instanceof ProductError)
                throw error;
            logger_1.logger.error(`Error retrieving product ${id}:`, error);
            throw new ProductError('Failed to retrieve product details', 'PRODUCT_FETCH_ERROR', 500);
        }
    }
    /**
     * Get a product by slug
     * @param slug Product slug
     */
    async getProductBySlug(slug) {
        const start = perf_hooks_1.performance.now();
        const cacheKey = `product:slug:${slug}`;
        try {
            // Try to get from cache first
            if (this.cacheService) {
                const cachedProduct = await this.cacheService.get(cacheKey);
                if (cachedProduct) {
                    logger_1.logger.debug(`Cache hit for product slug: ${slug}`);
                    return cachedProduct;
                }
            }
            // Fetch the product with a raw query
            const products = await prisma_1.default.$queryRawUnsafe(`
        SELECT p.*, 
               c.id as category_id, 
               c.name as category_name, 
               c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `, slug);
            if (!products || products.length === 0) {
                throw new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404);
            }
            const product = products[0];
            const productId = product.id;
            // Fetch related data
            const [images, inventory, variants, reviews] = await Promise.all([
                prisma_1.default.$queryRawUnsafe(`
          SELECT * FROM product_images
          WHERE product_id = ?
          ORDER BY sort_order ASC, is_main DESC
        `, productId),
                prisma_1.default.$queryRawUnsafe(`
          SELECT * FROM inventory
          WHERE product_id = ?
        `, productId),
                prisma_1.default.$queryRawUnsafe(`
          SELECT pv.*, i.quantity as inventory_quantity
          FROM product_variants pv
          LEFT JOIN inventory i ON pv.id = i.variant_id
          WHERE pv.product_id = ?
        `, productId),
                prisma_1.default.$queryRawUnsafe(`
          SELECT * FROM reviews
          WHERE product_id = ?
          ORDER BY created_at DESC
          LIMIT 5
        `, productId),
            ]);
            // Enrich the product with related data
            const enrichedProduct = {
                ...product,
                category: {
                    id: product.category_id,
                    name: product.category_name,
                    slug: product.category_slug,
                },
                images: images,
                inventory: inventory[0] || null,
                variants: variants,
                reviews: reviews,
            };
            // Cache product
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, enrichedProduct, 600, // 10 minutes TTL
                ['products', `product:slug:${slug}`, 'detail']);
            }
            const duration = perf_hooks_1.performance.now() - start;
            logger_1.logger.debug(`getProductBySlug completed in ${duration.toFixed(2)}ms`);
            return enrichedProduct;
        }
        catch (error) {
            if (error instanceof ProductError)
                throw error;
            logger_1.logger.error(`Error retrieving product by slug ${slug}:`, error);
            throw new ProductError('Failed to retrieve product details', 'PRODUCT_FETCH_ERROR', 500);
        }
    }
    /**
     * Create a new product
     * @param data Product data
     */
    async createProduct(data) {
        const start = perf_hooks_1.performance.now();
        try {
            // Check if SKU already exists
            const existingSku = await prisma_1.default.$queryRawUnsafe(`
        SELECT id FROM products WHERE sku = ?
      `, data.sku);
            if (existingSku && existingSku.length > 0) {
                throw new ProductError('Product with this SKU already exists', 'DUPLICATE_SKU', 409);
            }
            // Check if slug exists if provided
            if (data.slug) {
                const existingSlug = await prisma_1.default.$queryRawUnsafe(`
          SELECT id FROM products WHERE slug = ?
        `, data.slug);
                if (existingSlug && existingSlug.length > 0) {
                    throw new ProductError('Product with this slug already exists', 'DUPLICATE_SLUG', 409);
                }
            }
            // Generate slug if not provided
            const slug = data.slug || this.generateSlug(data.name);
            // Use a transaction for data consistency
            const product = await prisma_1.default.$transaction(async (tx) => {
                // Insert the product
                const insertResult = await tx.$queryRawUnsafe(`
          INSERT INTO products (
            name, slug, description, short_description, sku, 
            barcode, brand, model, weight, dimensions, 
            price, compare_price, cost_price, currency, 
            status, type, category_id, vendor_id, 
            attributes, specifications, warranty, 
            return_policy, shipping_info, tags, 
            is_active, is_featured, is_best_seller, 
            is_new_arrival, is_on_sale, sale_percentage, 
            sale_start_date, sale_end_date, meta_title, 
            meta_description, meta_keywords, published_at
          ) VALUES (
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, 
            ?, ?, ?, ?, 
            ?, ?, ?, 
            ?, ?, ?, 
            ?, ?, ?, 
            ?, ?, ?, 
            ?, ?, ?, 
            ?, ?, ?
          )
          RETURNING *
        `, data.name, slug, data.description, data.shortDescription, data.sku, data.barcode, data.brand, data.model, data.weight, JSON.stringify(data.dimensions || null), data.price, data.comparePrice, data.costPrice, data.currency || 'USD', data.status || 'DRAFT', data.type || 'PHYSICAL', data.categoryId, data.vendorId, JSON.stringify(data.attributes || null), JSON.stringify(data.specifications || null), data.warranty, data.returnPolicy, data.shippingInfo, JSON.stringify(data.tags || []), data.isActive !== undefined ? data.isActive : true, data.isFeatured || false, data.isBestSeller || false, data.isNewArrival || false, data.isOnSale || false, data.salePercentage, data.saleStartDate, data.saleEndDate, data.metaTitle, data.metaDescription, JSON.stringify(data.metaKeywords || []), data.publishedAt);
                const newProduct = insertResult[0];
                // Create price history record
                await tx.$queryRawUnsafe(`
          INSERT INTO price_history (
            product_id, price, currency, change_type, reason
          ) VALUES (
            ?, ?, ?, 'set', 'Initial price'
          )
        `, newProduct.id, data.price, data.currency || 'USD');
                return newProduct;
            });
            // Clear product list cache
            if (this.cacheService) {
                await this.cacheService.delByPattern('products:*');
            }
            const duration = perf_hooks_1.performance.now() - start;
            logger_1.logger.info(`Product created in ${duration.toFixed(2)}ms: ${product.id}`);
            return product;
        }
        catch (error) {
            if (error instanceof ProductError)
                throw error;
            logger_1.logger.error('Error creating product:', error);
            throw new ProductError('Failed to create product', 'PRODUCT_CREATE_ERROR', 500);
        }
    }
    /**
     * Update an existing product
     * @param id Product ID
     * @param data Update data
     */
    async updateProduct(id, data) {
        const start = perf_hooks_1.performance.now();
        try {
            // Check if product exists
            const existingProductResult = await prisma_1.default.$queryRawUnsafe(`
        SELECT * FROM products WHERE id = ?
      `, id);
            if (!existingProductResult || existingProductResult.length === 0) {
                throw new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404);
            }
            const existingProduct = existingProductResult[0];
            // Check if SKU is being changed and if new SKU exists
            if (data.sku && data.sku !== existingProduct.sku) {
                const existingSkuResult = await prisma_1.default.$queryRawUnsafe(`
          SELECT id FROM products WHERE sku = ? AND id != ?
        `, data.sku, id);
                if (existingSkuResult && existingSkuResult.length > 0) {
                    throw new ProductError('Product with this SKU already exists', 'DUPLICATE_SKU', 409);
                }
            }
            // Check if slug is being changed and if new slug exists
            if (data.slug && data.slug !== existingProduct.slug) {
                const existingSlugResult = await prisma_1.default.$queryRawUnsafe(`
          SELECT id FROM products WHERE slug = ? AND id != ?
        `, data.slug, id);
                if (existingSlugResult && existingSlugResult.length > 0) {
                    throw new ProductError('Product with this slug already exists', 'DUPLICATE_SLUG', 409);
                }
            }
            // Track if price is being updated
            const isPriceUpdate = data.price !== undefined && Number(data.price) !== Number(existingProduct.price);
            // Build update SQL parts
            const updates = [];
            const values = [];
            // Only include fields that are provided
            if (data.name !== undefined) {
                updates.push('name = ?');
                values.push(data.name);
            }
            if (data.slug !== undefined) {
                updates.push('slug = ?');
                values.push(data.slug);
            }
            else if (data.name !== undefined && !data.slug) {
                // Auto-update slug if name changes but slug wasn't explicitly set
                updates.push('slug = ?');
                values.push(this.generateSlug(data.name));
            }
            if (data.description !== undefined) {
                updates.push('description = ?');
                values.push(data.description);
            }
            if (data.shortDescription !== undefined) {
                updates.push('short_description = ?');
                values.push(data.shortDescription);
            }
            if (data.sku !== undefined) {
                updates.push('sku = ?');
                values.push(data.sku);
            }
            if (data.barcode !== undefined) {
                updates.push('barcode = ?');
                values.push(data.barcode);
            }
            if (data.brand !== undefined) {
                updates.push('brand = ?');
                values.push(data.brand);
            }
            if (data.model !== undefined) {
                updates.push('model = ?');
                values.push(data.model);
            }
            if (data.weight !== undefined) {
                updates.push('weight = ?');
                values.push(data.weight);
            }
            if (data.dimensions !== undefined) {
                updates.push('dimensions = ?');
                values.push(JSON.stringify(data.dimensions));
            }
            if (data.price !== undefined) {
                updates.push('price = ?');
                values.push(data.price);
            }
            if (data.comparePrice !== undefined) {
                updates.push('compare_price = ?');
                values.push(data.comparePrice);
            }
            if (data.costPrice !== undefined) {
                updates.push('cost_price = ?');
                values.push(data.costPrice);
            }
            if (data.currency !== undefined) {
                updates.push('currency = ?');
                values.push(data.currency);
            }
            if (data.status !== undefined) {
                updates.push('status = ?');
                values.push(data.status);
            }
            if (data.type !== undefined) {
                updates.push('type = ?');
                values.push(data.type);
            }
            if (data.categoryId !== undefined) {
                updates.push('category_id = ?');
                values.push(data.categoryId);
            }
            if (data.vendorId !== undefined) {
                updates.push('vendor_id = ?');
                values.push(data.vendorId);
            }
            if (data.attributes !== undefined) {
                updates.push('attributes = ?');
                values.push(JSON.stringify(data.attributes));
            }
            if (data.specifications !== undefined) {
                updates.push('specifications = ?');
                values.push(JSON.stringify(data.specifications));
            }
            if (data.warranty !== undefined) {
                updates.push('warranty = ?');
                values.push(data.warranty);
            }
            if (data.returnPolicy !== undefined) {
                updates.push('return_policy = ?');
                values.push(data.returnPolicy);
            }
            if (data.shippingInfo !== undefined) {
                updates.push('shipping_info = ?');
                values.push(data.shippingInfo);
            }
            if (data.tags !== undefined) {
                updates.push('tags = ?');
                values.push(JSON.stringify(data.tags));
            }
            if (data.isActive !== undefined) {
                updates.push('is_active = ?');
                values.push(data.isActive);
            }
            if (data.isFeatured !== undefined) {
                updates.push('is_featured = ?');
                values.push(data.isFeatured);
            }
            if (data.isBestSeller !== undefined) {
                updates.push('is_best_seller = ?');
                values.push(data.isBestSeller);
            }
            if (data.isNewArrival !== undefined) {
                updates.push('is_new_arrival = ?');
                values.push(data.isNewArrival);
            }
            if (data.isOnSale !== undefined) {
                updates.push('is_on_sale = ?');
                values.push(data.isOnSale);
            }
            if (data.salePercentage !== undefined) {
                updates.push('sale_percentage = ?');
                values.push(data.salePercentage);
            }
            if (data.saleStartDate !== undefined) {
                updates.push('sale_start_date = ?');
                values.push(data.saleStartDate);
            }
            if (data.saleEndDate !== undefined) {
                updates.push('sale_end_date = ?');
                values.push(data.saleEndDate);
            }
            if (data.metaTitle !== undefined) {
                updates.push('meta_title = ?');
                values.push(data.metaTitle);
            }
            if (data.metaDescription !== undefined) {
                updates.push('meta_description = ?');
                values.push(data.metaDescription);
            }
            if (data.metaKeywords !== undefined) {
                updates.push('meta_keywords = ?');
                values.push(JSON.stringify(data.metaKeywords));
            }
            if (data.publishedAt !== undefined) {
                updates.push('published_at = ?');
                values.push(data.publishedAt);
            }
            // Add updated_at timestamp
            updates.push('updated_at = CURRENT_TIMESTAMP');
            // Skip update if no fields to update
            if (updates.length === 0) {
                return await this.getProductById(id);
            }
            // Add ID to values array for the WHERE clause
            values.push(id);
            // Update the product using a transaction
            const updatedProduct = await prisma_1.default.$transaction(async (tx) => {
                // Update the product
                const updateResult = await tx.$queryRawUnsafe(`
          UPDATE products
          SET ${updates.join(', ')}
          WHERE id = ?
          RETURNING *
        `, ...values);
                const product = updateResult[0];
                // Create price history record if price changed
                if (isPriceUpdate) {
                    await tx.$queryRawUnsafe(`
            INSERT INTO price_history (
              product_id, price, currency, change_type, reason
            ) VALUES (
              ?, ?, ?, ?, ?
            )
          `, id, data.price, product.currency, Number(data.price) > Number(existingProduct.price) ? 'increase' : 'decrease', 'Price update');
                }
                return product;
            });
            // Invalidate caches
            if (this.cacheService) {
                // Clear specific product caches
                await this.cacheService.del(`product:${id}`);
                if (existingProduct.slug) {
                    await this.cacheService.del(`product:slug:${existingProduct.slug}`);
                }
                if (updatedProduct.slug && updatedProduct.slug !== existingProduct.slug) {
                    await this.cacheService.del(`product:slug:${updatedProduct.slug}`);
                }
                // Clear product list caches
                await this.cacheService.delByPattern('products:*');
            }
            const duration = perf_hooks_1.performance.now() - start;
            logger_1.logger.info(`Product updated in ${duration.toFixed(2)}ms: ${id}`);
            return updatedProduct;
        }
        catch (error) {
            if (error instanceof ProductError)
                throw error;
            logger_1.logger.error(`Error updating product ${id}:`, error);
            throw new ProductError('Failed to update product', 'PRODUCT_UPDATE_ERROR', 500);
        }
    }
    /**
     * Delete a product
     * @param id Product ID
     */
    async deleteProduct(id) {
        const start = perf_hooks_1.performance.now();
        try {
            // Check if product exists
            const existingProductResult = await prisma_1.default.$queryRawUnsafe(`
        SELECT * FROM products WHERE id = ?
      `, id);
            if (!existingProductResult || existingProductResult.length === 0) {
                throw new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404);
            }
            const existingProduct = existingProductResult[0];
            // Use transaction for deletion
            await prisma_1.default.$transaction(async (tx) => {
                // Delete product images
                await tx.$queryRawUnsafe(`
          DELETE FROM product_images
          WHERE product_id = ?
        `, id);
                // Delete inventory
                await tx.$queryRawUnsafe(`
          DELETE FROM inventory
          WHERE product_id = ?
        `, id);
                // Delete variants (and their inventory through ON DELETE CASCADE)
                await tx.$queryRawUnsafe(`
          DELETE FROM product_variants
          WHERE product_id = ?
        `, id);
                // Delete product relations
                await tx.$queryRawUnsafe(`
          DELETE FROM product_relations
          WHERE product_id = ? OR related_product_id = ?
        `, id, id);
                // Delete price history
                await tx.$queryRawUnsafe(`
          DELETE FROM price_history
          WHERE product_id = ?
        `, id);
                // Delete reviews
                await tx.$queryRawUnsafe(`
          DELETE FROM reviews
          WHERE product_id = ?
        `, id);
                // Finally delete the product
                await tx.$queryRawUnsafe(`
          DELETE FROM products
          WHERE id = ?
        `, id);
            });
            // Invalidate caches
            if (this.cacheService) {
                // Clear specific product caches
                await this.cacheService.del(`product:${id}`);
                await this.cacheService.del(`product:slug:${existingProduct.slug}`);
                // Clear product list caches
                await this.cacheService.delByPattern('products:*');
            }
            const duration = perf_hooks_1.performance.now() - start;
            logger_1.logger.info(`Product deleted in ${duration.toFixed(2)}ms: ${id}`);
            return { success: true, message: 'Product deleted successfully' };
        }
        catch (error) {
            if (error instanceof ProductError)
                throw error;
            logger_1.logger.error(`Error deleting product ${id}:`, error);
            throw new ProductError('Failed to delete product', 'PRODUCT_DELETE_ERROR', 500);
        }
    }
    /**
     * Search products with full text search capability
     * @param query Search query
     * @param options Additional search options
     */
    async searchProducts(query, options = {}) {
        const start = perf_hooks_1.performance.now();
        const { page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'DESC', filters = {}, } = options;
        // Generate cache key
        const cacheKey = this.generateCacheKey('search', {
            query,
            page,
            limit,
            sortBy,
            sortOrder,
            filters,
        });
        try {
            // Try to get from cache first
            if (this.cacheService) {
                const cachedResult = await this.cacheService.get(cacheKey);
                if (cachedResult) {
                    logger_1.logger.debug(`Cache hit for search query: ${query}`);
                    return cachedResult;
                }
            }
            // Determine skip value for pagination
            const skip = (page - 1) * limit;
            // Build base where condition
            let whereClause = 'p.is_active = true AND (p.name ILIKE ? OR p.description ILIKE ? OR p.sku ILIKE ? OR p.brand ILIKE ?)';
            const whereParams = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];
            // Apply additional filters
            if (filters.categoryId) {
                whereClause += ' AND p.category_id = ?';
                whereParams.push(filters.categoryId);
            }
            if (filters.vendorId) {
                whereClause += ' AND p.vendor_id = ?';
                whereParams.push(filters.vendorId);
            }
            if (filters.minPrice !== undefined) {
                whereClause += ' AND p.price >= ?';
                whereParams.push(String(filters.minPrice));
            }
            if (filters.maxPrice !== undefined) {
                whereClause += ' AND p.price <= ?';
                whereParams.push(String(filters.maxPrice));
            }
            // Determine sort order
            let orderByClause;
            if (sortBy === 'relevance') {
                // For relevance sorting, use multiple factors
                orderByClause = 'p.is_featured DESC, p.is_best_seller DESC, p.created_at DESC';
            }
            else {
                orderByClause = `p.${sortBy || 'created_at'} ${sortOrder || 'DESC'}`;
            }
            // Execute query and count in parallel
            const [productsResult, countResult] = await Promise.all([
                prisma_1.default.$queryRawUnsafe(`
          SELECT 
            p.*,
            c.name as category_name,
            c.slug as category_slug
          FROM 
            products p
          LEFT JOIN 
            categories c ON p.category_id = c.id
          WHERE 
            ${whereClause}
          ORDER BY 
            ${orderByClause}
          LIMIT ? OFFSET ?
        `, ...whereParams, limit, skip),
                prisma_1.default.$queryRawUnsafe(`
          SELECT 
            COUNT(*) as total
          FROM 
            products p
          WHERE 
            ${whereClause}
        `, ...whereParams),
            ]);
            const products = productsResult;
            const total = parseInt(countResult[0].total, 10);
            const totalPages = Math.ceil(total / limit);
            // Fetch images for the products
            const productIds = products.map((p) => p.id);
            let productImages = [];
            if (productIds.length > 0) {
                productImages = (await prisma_1.default.$queryRawUnsafe(`
          SELECT * FROM product_images
          WHERE product_id IN (${productIds.map(() => '?').join(',')})
          AND is_main = true
        `, ...productIds));
            }
            // Organize images by product ID
            const imagesByProduct = this.groupBy(productImages, 'product_id');
            // Enrich products with their main image
            const enrichedProducts = products.map((product) => ({
                ...product,
                images: imagesByProduct[product.id] || [],
            }));
            // Log search for analytics
            await this.logSearch(query, filters, products.length);
            const result = {
                query,
                products: enrichedProducts,
                total,
                page,
                limit,
                totalPages,
            };
            // Cache results (short TTL for search results)
            if (this.cacheService) {
                await this.cacheService.set(cacheKey, result, 180, // 3 minutes TTL
                ['search', `query:${query}`]);
            }
            const duration = perf_hooks_1.performance.now() - start;
            logger_1.logger.debug(`searchProducts completed in ${duration.toFixed(2)}ms`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error searching products for "${query}":`, error);
            throw new ProductError('Failed to search products', 'PRODUCT_SEARCH_ERROR', 500);
        }
    }
    /**
     * Log search query for analytics
     * @param query Search query
     * @param filters Search filters
     * @param resultsCount Number of results
     */
    async logSearch(query, filters, resultsCount) {
        try {
            await prisma_1.default.$queryRawUnsafe(`
        INSERT INTO search_logs (
          query, filters, results
        ) VALUES (
          ?, ?, ?
        )
      `, query, JSON.stringify(filters), resultsCount);
        }
        catch (error) {
            logger_1.logger.error('Error logging search:', error);
            // Non-critical error, don't throw
        }
    }
    /**
     * Generate a cache key based on parameters
     * @param prefix Cache key prefix
     * @param params Parameters to include in cache key
     */
    generateCacheKey(prefix, params) {
        // Sort keys for consistent cache keys
        const sortedKeys = Object.keys(params).sort();
        // Build key components
        const keyParts = sortedKeys.map((key) => {
            const value = params[key];
            if (typeof value === 'object' && value !== null) {
                return `${key}:${JSON.stringify(value)}`;
            }
            return `${key}:${value}`;
        });
        return `${prefix}:${keyParts.join(':')}`;
    }
    /**
     * Generate a slug from a product name
     * @param name Product name
     */
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}
exports.EnhancedProductService = EnhancedProductService;
//# sourceMappingURL=enhanced-product-service-optimized.js.map