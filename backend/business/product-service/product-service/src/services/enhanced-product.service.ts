// Import product interface from repository instead of @prisma/client
import { AdvancedCacheService } from '../utils/advanced-cache.service';
import { logger } from '../utils/logger';
import { validateProduct, validateProductUpdate } from '../utils/validation';
import { productRepository, Product } from '../repositories/product.repository';

/**
 * Error classes for the Product Service
 */
export class ProductServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

export class ProductNotFoundError extends ProductServiceError {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductValidationError extends ProductServiceError {
  validationErrors: string[];

  constructor(errors: string[]) {
    super(`Product validation failed: ${errors.join(', ')}`);
    this.validationErrors = errors;
    this.name = 'ProductValidationError';
  }
}

export class DuplicateProductError extends ProductServiceError {
  sku: string;

  constructor(sku: string) {
    super(`Product with SKU ${sku} already exists`);
    this.sku = sku;
    this.name = 'DuplicateProductError';
  }
}

/**
 * Filter and pagination options for product queries
 */
export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  search?: string;
  vendorId?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductQueryOptions extends PaginationOptions {
  filters?: ProductFilters;
  includeDeleted?: boolean;
}

export interface BulkStockUpdate {
  productId: string;
  newStock: number;
}

/**
 * Enhanced Product Service with professional patterns and practices
 */
export class EnhancedProductService {
  private readonly DEFAULT_CACHE_TTL = 3600; // 1 hour
  private readonly PRODUCT_CACHE_PREFIX = 'product:';
  private readonly PRODUCTS_LIST_CACHE_PREFIX = 'products:list:';

  constructor(private cacheService: AdvancedCacheService) {}

  /**
   * Create a new product with validation
   */
  async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
    try {
      // Validate product data
      const validationErrors = validateProduct(productData);
      if (validationErrors.length > 0) {
        throw new ProductValidationError(validationErrors);
      }

      // Check for duplicate SKU
      const existingProduct = await productRepository.findBySku(productData.sku);
      if (existingProduct) {
        throw new DuplicateProductError(productData.sku);
      }

      // Generate slug if not provided
      if (!productData.slug) {
        productData.slug = this.generateSlug(productData.name);
      }

      // Create the product
      const startTime = Date.now();
      const newProduct = await productRepository.create(productData);
      logger.info(`Product created successfully in ${Date.now() - startTime}ms`, {
        productId: newProduct.id,
        category: newProduct.category,
      });

      // Invalidate relevant cache entries
      await this.invalidateRelatedCaches(newProduct.category);

      return newProduct;
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error('Failed to create product', { error: error.message, stack: error.stack });
      throw new ProductServiceError(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Get a product by ID with caching
   */
  async getProductById(productId: string, includeDeleted = false): Promise<Product> {
    try {
      const cacheKey = `${this.PRODUCT_CACHE_PREFIX}${productId}`;

      // Try to get from cache first
      const cachedProduct = await this.cacheService.get<Product>(cacheKey);
      if (cachedProduct) {
        logger.debug('Product retrieved from cache', { productId });
        return cachedProduct;
      }

      // Get from database
      const startTime = Date.now();
      const product = await productRepository.findById(productId, includeDeleted);
      logger.debug(`Product fetched from database in ${Date.now() - startTime}ms`, { productId });

      if (!product) {
        throw new ProductNotFoundError(productId);
      }

      // Cache the product
      await this.cacheService.set(cacheKey, product, this.DEFAULT_CACHE_TTL, [
        `product:${product.id}`,
        `category:${product.category}`,
      ]);

      return product;
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error('Failed to retrieve product by ID', { productId, error: error.message });
      throw new ProductServiceError(`Failed to get product: ${error.message}`);
    }
  }

  /**
   * Get products with filtering, sorting and pagination
   */
  async getProducts(
    options: ProductQueryOptions = {}
  ): Promise<{ products: Product[]; total: number; pages: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        filters = {},
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeDeleted = false,
      } = options;

      // Build cache key based on query params
      const cacheKey = this.buildListCacheKey(options);

      // Try to get from cache first
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug('Products list retrieved from cache', { page, limit, filters });
        return cachedResult;
      }

      // Get from database with timing
      const startTime = Date.now();
      const result = await productRepository.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: this.buildQueryFilters(filters),
        orderBy: { [sortBy]: sortOrder },
        includeDeleted,
      });

      // Calculate pagination info
      const total = await productRepository.count(this.buildQueryFilters(filters), includeDeleted);
      const pages = Math.ceil(total / limit);

      logger.debug(`Products fetched from database in ${Date.now() - startTime}ms`, {
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
      if (filters.category) cacheTags.push(`category:${filters.category}`);
      if (filters.brand) cacheTags.push(`brand:${filters.brand}`);
      if (filters.vendorId) cacheTags.push(`vendor:${filters.vendorId}`);

      await this.cacheService.set(cacheKey, response, this.DEFAULT_CACHE_TTL, cacheTags);

      return response;
    } catch (error) {
      logger.error('Failed to retrieve products list', {
        error: error.message,
        filters: options.filters,
      });
      throw new ProductServiceError(`Failed to get products: ${error.message}`);
    }
  }

  /**
   * Update a product with validation
   */
  async updateProduct(productId: string, updateData: Partial<Product>): Promise<Product> {
    try {
      // Validate update data
      const validationErrors = validateProductUpdate(updateData);
      if (validationErrors.length > 0) {
        throw new ProductValidationError(validationErrors);
      }

      // Check if product exists
      const existingProduct = await this.getProductById(productId);

      // If updating SKU, check for duplicates
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const duplicateCheck = await productRepository.findBySku(updateData.sku);
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
      const updatedProduct = await productRepository.update(productId, updateData);
      logger.info(`Product updated successfully in ${Date.now() - startTime}ms`, {
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
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error('Failed to update product', { productId, error: error.message });
      throw new ProductServiceError(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      // Check if product exists
      const product = await this.getProductById(productId);

      // Soft delete the product
      await productRepository.softDelete(productId);
      logger.info(`Product soft deleted`, { productId });

      // Invalidate caches
      await this.cacheService.del(`${this.PRODUCT_CACHE_PREFIX}${productId}`);
      await this.invalidateRelatedCaches(product.category);
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error('Failed to delete product', { productId, error: error.message });
      throw new ProductServiceError(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Permanently delete a product (hard delete)
   */
  async permanentlyDeleteProduct(productId: string): Promise<void> {
    try {
      // Check if product exists first
      const product = await this.getProductById(productId, true);

      // Hard delete the product
      await productRepository.hardDelete(productId);
      logger.info(`Product permanently deleted`, { productId });

      // Invalidate caches
      await this.cacheService.del(`${this.PRODUCT_CACHE_PREFIX}${productId}`);
      await this.invalidateRelatedCaches(product.category);
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error('Failed to permanently delete product', { productId, error: error.message });
      throw new ProductServiceError(`Failed to permanently delete product: ${error.message}`);
    }
  }

  /**
   * Bulk update product stock levels
   */
  async bulkUpdateStock(updates: BulkStockUpdate[]): Promise<void> {
    try {
      // Validate updates
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new ProductValidationError(['Invalid bulk update format or empty updates array']);
      }

      // Make sure all stock values are valid numbers
      const invalidUpdates = updates.filter(
        (update) => typeof update.newStock !== 'number' || update.newStock < 0
      );

      if (invalidUpdates.length > 0) {
        throw new ProductValidationError([
          'Invalid stock values. Stock must be a non-negative number',
        ]);
      }

      // Perform bulk update
      const startTime = Date.now();
      await productRepository.bulkUpdateStock(updates);
      logger.info(`Bulk stock update completed in ${Date.now() - startTime}ms`, {
        count: updates.length,
      });

      // Invalidate product caches
      for (const update of updates) {
        await this.cacheService.del(`${this.PRODUCT_CACHE_PREFIX}${update.productId}`);
      }

      // Invalidate list caches that include stock status
      await this.cacheService.delByPattern(`${this.PRODUCTS_LIST_CACHE_PREFIX}*inStock*`);
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error('Failed to perform bulk stock update', { error: error.message });
      throw new ProductServiceError(`Failed to update stock: ${error.message}`);
    }
  }

  /**
   * Search products with optimized full-text search
   */
  async searchProducts(
    query: string,
    options: Omit<ProductQueryOptions, 'filters'> = {}
  ): Promise<{ products: Product[]; total: number; pages: number }> {
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
        logger.debug('Search results retrieved from cache', { query, page, limit });
        return cachedResult;
      }

      // Perform the search with timing
      const startTime = Date.now();
      const result = await productRepository.search(query, {
        skip: (page - 1) * limit,
        take: limit,
        sortBy,
        sortOrder,
      });

      logger.debug(`Search performed in ${Date.now() - startTime}ms`, {
        query,
        resultsCount: result.products.length,
        total: result.total,
      });

      // Cache the results for a shorter period (search results change more often)
      await this.cacheService.set(cacheKey, result, 1800, ['products:search']);

      return result;
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error('Product search failed', { query, error: error.message });
      throw new ProductServiceError(`Product search failed: ${error.message}`);
    }
  }

  /**
   * Get featured products (optimized query)
   */
  async getFeaturedProducts(categoryId?: string, limit = 10): Promise<Product[]> {
    try {
      const cacheKey = `products:featured:${categoryId || 'all'}:limit=${limit}`;

      // Try to get from cache first
      const cachedResult = await this.cacheService.get<Product[]>(cacheKey);
      if (cachedResult) {
        logger.debug('Featured products retrieved from cache', { categoryId, limit });
        return cachedResult;
      }

      // Get featured products
      const startTime = Date.now();
      const products = await productRepository.getFeatured(categoryId, limit);
      logger.debug(`Featured products fetched in ${Date.now() - startTime}ms`, {
        count: products.length,
        categoryId,
      });

      // Cache the results
      const cacheTags = ['products:featured'];
      if (categoryId) cacheTags.push(`category:${categoryId}`);
      await this.cacheService.set(cacheKey, products, this.DEFAULT_CACHE_TTL, cacheTags);

      return products;
    } catch (error) {
      logger.error('Failed to get featured products', {
        categoryId,
        error: error.message,
      });
      throw new ProductServiceError(`Failed to get featured products: ${error.message}`);
    }
  }

  /**
   * Get related products based on current product
   */
  async getRelatedProducts(productId: string, limit = 8): Promise<Product[]> {
    try {
      const cacheKey = `products:related:${productId}:limit=${limit}`;

      // Try to get from cache first
      const cachedResult = await this.cacheService.get<Product[]>(cacheKey);
      if (cachedResult) {
        logger.debug('Related products retrieved from cache', { productId, limit });
        return cachedResult;
      }

      // Get product to find related items
      const product = await this.getProductById(productId);

      // Get related products based on category and tags
      const startTime = Date.now();
      const relatedProducts = await productRepository.getRelated(
        productId,
        product.category,
        JSON.parse(product.tags as string),
        limit
      );

      logger.debug(`Related products fetched in ${Date.now() - startTime}ms`, {
        productId,
        count: relatedProducts.length,
      });

      // Cache the results
      await this.cacheService.set(cacheKey, relatedProducts, this.DEFAULT_CACHE_TTL, [
        `product:${productId}`,
        `category:${product.category}`,
      ]);

      return relatedProducts;
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error('Failed to get related products', { productId, error: error.message });
      throw new ProductServiceError(`Failed to get related products: ${error.message}`);
    }
  }

  /**
   * Get product by custom field (e.g. slug)
   */
  async getProductByField(field: string, value: string): Promise<Product> {
    try {
      const cacheKey = `${this.PRODUCT_CACHE_PREFIX}${field}:${value}`;

      // Try to get from cache first
      const cachedProduct = await this.cacheService.get<Product>(cacheKey);
      if (cachedProduct) {
        logger.debug(`Product retrieved from cache by ${field}`, { [field]: value });
        return cachedProduct;
      }

      // Get from database
      const startTime = Date.now();
      const product = await productRepository.findByField(field, value);
      logger.debug(`Product fetched from database by ${field} in ${Date.now() - startTime}ms`, {
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
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ProductServiceError) {
        throw error;
      }

      // Log and wrap other errors
      logger.error(`Failed to retrieve product by ${field}`, {
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
  async checkLowStockProducts(
    threshold = 10
  ): Promise<{ id: string; name: string; stock: number }[]> {
    try {
      const lowStockProducts = await productRepository.findLowStock(threshold);

      if (lowStockProducts.length > 0) {
        logger.warn('Low stock products detected', { count: lowStockProducts.length, threshold });
      }

      return lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
      }));
    } catch (error) {
      logger.error('Failed to check low stock products', { threshold, error: error.message });
      throw new ProductServiceError(`Failed to check low stock: ${error.message}`);
    }
  }

  /**
   * Generate a URL-friendly slug from a product name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Build database filters from the API filters
   */
  private buildQueryFilters(filters: ProductFilters): Record<string, any> {
    const dbFilters: Record<string, any> = {};

    if (filters.category) dbFilters.category = filters.category;
    if (filters.brand) dbFilters.brand = filters.brand;
    if (filters.vendorId) dbFilters.vendorId = filters.vendorId;
    if (filters.isFeatured !== undefined) dbFilters.isFeatured = filters.isFeatured;

    // Price range filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      dbFilters.price = {};
      if (filters.minPrice !== undefined) dbFilters.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) dbFilters.price.lte = filters.maxPrice;
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
  private buildListCacheKey(options: ProductQueryOptions): string {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = options;

    let cacheKey = `${this.PRODUCTS_LIST_CACHE_PREFIX}page=${page}:limit=${limit}:sort=${sortBy}:${sortOrder}`;

    // Add filters to cache key
    if (filters.category) cacheKey += `:category=${filters.category}`;
    if (filters.brand) cacheKey += `:brand=${filters.brand}`;
    if (filters.minPrice) cacheKey += `:minPrice=${filters.minPrice}`;
    if (filters.maxPrice) cacheKey += `:maxPrice=${filters.maxPrice}`;
    if (filters.inStock !== undefined) cacheKey += `:inStock=${filters.inStock}`;
    if (filters.isFeatured !== undefined) cacheKey += `:featured=${filters.isFeatured}`;
    if (filters.vendorId) cacheKey += `:vendor=${filters.vendorId}`;
    if (filters.tags && filters.tags.length > 0) {
      cacheKey += `:tags=${filters.tags.join(',')}`;
    }

    return cacheKey;
  }

  /**
   * Invalidate related caches for a category
   */
  private async invalidateRelatedCaches(category: string): Promise<void> {
    // Invalidate category-specific caches
    await this.cacheService.invalidateByTags([`category:${category}`]);

    // Invalidate general product list caches
    await this.cacheService.invalidateByTags(['products:list', 'products:featured']);
  }
}

export default EnhancedProductService;
