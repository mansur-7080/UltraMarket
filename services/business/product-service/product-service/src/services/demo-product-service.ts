/**
 * This file provides a mock implementation of the product service with appropriate
 * interfaces to demonstrate the service capabilities without requiring a database
 */

import { logger } from '../utils/logger';
import { AdvancedCacheService } from '../utils/advanced-cache.service';

// Define the Product interface
export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  slug: string;
  category: string;
  brand: string | null;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  stock: number;
  images: any;
  specifications: any;
  tags: any;
  vendorId: string | null;
  isFeatured: boolean;
  isActive: boolean;
  isDeleted: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

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
 * Product data validation utilities
 */
export function validateProduct(product: any): string[] {
  const errors: string[] = [];

  // Required fields validation
  if (!product.name || product.name.trim() === '') {
    errors.push('Product name is required');
  } else if (product.name.length > 255) {
    errors.push('Product name cannot exceed 255 characters');
  }

  if (!product.sku || product.sku.trim() === '') {
    errors.push('Product SKU is required');
  }

  if (!product.category || product.category.trim() === '') {
    errors.push('Product category is required');
  }

  // Price validation
  if (product.price === undefined || product.price === null) {
    errors.push('Product price is required');
  } else if (typeof product.price !== 'number' || isNaN(product.price)) {
    errors.push('Product price must be a valid number');
  } else if (product.price < 0) {
    errors.push('Product price cannot be negative');
  }

  // Stock validation
  if (product.stock === undefined || product.stock === null) {
    errors.push('Product stock is required');
  } else if (typeof product.stock !== 'number' || isNaN(product.stock)) {
    errors.push('Product stock must be a valid number');
  } else if (product.stock < 0) {
    errors.push('Product stock cannot be negative');
  }

  return errors;
}

export function validateProductUpdate(product: any): string[] {
  const errors: string[] = [];

  // Name validation (if provided)
  if (product.name !== undefined) {
    if (product.name.trim() === '') {
      errors.push('Product name cannot be empty');
    } else if (product.name.length > 255) {
      errors.push('Product name cannot exceed 255 characters');
    }
  }

  // Price validation (if provided)
  if (product.price !== undefined) {
    if (typeof product.price !== 'number' || isNaN(product.price)) {
      errors.push('Product price must be a valid number');
    } else if (product.price < 0) {
      errors.push('Product price cannot be negative');
    }
  }

  // Stock validation (if provided)
  if (product.stock !== undefined) {
    if (typeof product.stock !== 'number' || isNaN(product.stock)) {
      errors.push('Product stock must be a valid number');
    } else if (product.stock < 0) {
      errors.push('Product stock cannot be negative');
    }
  }

  return errors;
}

// Sample products for demonstration
const products: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality noise-cancelling wireless headphones with premium sound',
    sku: 'HEAD-PREMIUM-001',
    slug: 'premium-wireless-headphones',
    category: 'electronics',
    brand: 'AudioTech',
    price: 249.99,
    originalPrice: 299.99,
    discount: 16.67,
    stock: 50,
    images: JSON.stringify([
      { url: 'https://example.com/images/headphones-1.jpg', isMain: true },
      { url: 'https://example.com/images/headphones-2.jpg', isMain: false },
    ]),
    specifications: JSON.stringify({
      battery: '20 hours',
      connectivity: 'Bluetooth 5.0',
      weight: '250g',
    }),
    tags: JSON.stringify(['wireless', 'noise-cancelling', 'premium']),
    vendorId: 'vendor123',
    isFeatured: true,
    isActive: true,
    isDeleted: false,
    seoTitle: 'Premium Wireless Noise-Cancelling Headphones - AudioTech',
    seoDescription:
      'Experience crystal clear sound with AudioTech premium wireless headphones with advanced noise-cancellation.',
    seoKeywords: JSON.stringify(['headphones', 'wireless', 'noise-cancelling', 'premium audio']),
    createdAt: new Date('2023-01-15T10:00:00Z'),
    updatedAt: new Date('2023-01-15T10:00:00Z'),
    deletedAt: null,
  },
  {
    id: '2',
    name: 'Smartphone Pro Max',
    description: 'Latest flagship smartphone with advanced camera and performance',
    sku: 'PHONE-PRO-002',
    slug: 'smartphone-pro-max',
    category: 'electronics',
    brand: 'TechGiant',
    price: 999.99,
    originalPrice: 1099.99,
    discount: 9.09,
    stock: 25,
    images: JSON.stringify([
      { url: 'https://example.com/images/phone-1.jpg', isMain: true },
      { url: 'https://example.com/images/phone-2.jpg', isMain: false },
    ]),
    specifications: JSON.stringify({
      screen: '6.7 inches',
      processor: 'Octa-core',
      camera: '48MP + 12MP + 12MP',
      battery: '4500mAh',
    }),
    tags: JSON.stringify(['smartphone', 'camera', 'flagship']),
    vendorId: 'vendor456',
    isFeatured: true,
    isActive: true,
    isDeleted: false,
    seoTitle: 'Smartphone Pro Max - Latest Flagship Phone by TechGiant',
    seoDescription:
      'Discover the powerful Smartphone Pro Max with cutting-edge camera technology and all-day battery life.',
    seoKeywords: JSON.stringify([
      'smartphone',
      'camera phone',
      'flagship phone',
      'high performance',
    ]),
    createdAt: new Date('2023-02-10T14:30:00Z'),
    updatedAt: new Date('2023-02-10T14:30:00Z'),
    deletedAt: null,
  },
];

/**
 * Mock implementation of product repository
 */
export const productRepository = {
  async findById(id: string): Promise<Product | null> {
    const product = products.find((p) => p.id === id);
    return product || null;
  },

  async findBySku(sku: string): Promise<Product | null> {
    const product = products.find((p) => p.sku === sku);
    return product || null;
  },

  async findByField(field: string, value: string): Promise<Product | null> {
    const product = products.find((p) => (p as any)[field] === value);
    return product || null;
  },

  async findMany(options: any): Promise<Product[]> {
    // Simple implementation for demo
    return products.slice(0, options.take || 20);
  },

  async count(): Promise<number> {
    return products.length;
  },

  async create(data: any): Promise<Product> {
    const newProduct: Product = {
      id: String(products.length + 1),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    products.push(newProduct);
    return newProduct;
  },

  async update(id: string, data: any): Promise<Product> {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    products[index] = {
      ...products[index],
      ...data,
      updatedAt: new Date(),
    };

    return products[index];
  },

  async softDelete(id: string): Promise<void> {
    const index = products.findIndex((p) => p.id === id);
    if (index !== -1) {
      products[index].isDeleted = true;
      products[index].deletedAt = new Date();
    }
  },

  async hardDelete(id: string): Promise<void> {
    const index = products.findIndex((p) => p.id === id);
    if (index !== -1) {
      products.splice(index, 1);
    }
  },

  async bulkUpdateStock(updates: BulkStockUpdate[]): Promise<void> {
    for (const update of updates) {
      const product = products.find((p) => p.id === update.productId);
      if (product) {
        product.stock = update.newStock;
      }
    }
  },

  async search(): Promise<{ products: Product[]; total: number }> {
    return { products: products.slice(0, 5), total: products.length };
  },

  async getFeatured(): Promise<Product[]> {
    return products.filter((p) => p.isFeatured);
  },

  async getRelated(): Promise<Product[]> {
    return products.slice(0, 4);
  },

  async findLowStock(threshold: number): Promise<Product[]> {
    return products.filter((p) => p.stock <= threshold);
  },
};

/**
 * Mock implementation of the advanced cache service
 */
export class MockCacheService implements AdvancedCacheService {
  private cache = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidateByTags(): Promise<void> {
    // Mock implementation
  }

  async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async close(): Promise<void> {
    this.cache.clear();
  }

  getHealth(): any {
    return { memory: true, redis: true, redisConnected: true };
  }

  getMetrics(): any {
    return { memorySize: this.cache.size, memoryItemCount: this.cache.size };
  }
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
      logger.error('Failed to create product', { error: error.message });
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
      const product = await productRepository.findById(productId);
      logger.debug(`Product fetched from database in ${Date.now() - startTime}ms`, { productId });

      if (!product) {
        throw new ProductNotFoundError(productId);
      }

      // Cache the product
      await this.cacheService.set(cacheKey, product, this.DEFAULT_CACHE_TTL);

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
      const { page = 1, limit = 20, filters = {} } = options;

      // Build cache key based on query params
      const cacheKey = this.buildListCacheKey(options);

      // Try to get from cache first
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug('Products list retrieved from cache', { page, limit });
        return cachedResult;
      }

      // Get from database with timing
      const startTime = Date.now();
      const products = await productRepository.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: filters,
      });

      // Calculate pagination info
      const total = await productRepository.count();
      const pages = Math.ceil(total / limit);

      logger.debug(`Products fetched from database in ${Date.now() - startTime}ms`, {
        count: products.length,
        total,
        page,
      });

      const response = {
        products,
        total,
        pages,
      };

      // Cache the result
      await this.cacheService.set(cacheKey, response, this.DEFAULT_CACHE_TTL);

      return response;
    } catch (error) {
      logger.error('Failed to retrieve products list', { error: error.message });
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
      const product = await this.getProductById(productId);

      // Hard delete the product
      await productRepository.hardDelete(productId);
      logger.info(`Product permanently deleted`, { productId });

      // Invalidate caches
      await this.cacheService.del(`${this.PRODUCT_CACHE_PREFIX}${productId}`);
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
   * Generate a URL-friendly slug from a product name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
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
    // In a real implementation, this would invalidate related caches by tag
    await this.cacheService.delByPattern(
      `${this.PRODUCTS_LIST_CACHE_PREFIX}*category=${category}*`
    );
  }
}

export default EnhancedProductService;
