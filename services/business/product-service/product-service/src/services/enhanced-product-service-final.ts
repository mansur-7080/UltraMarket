/**
 * Enhanced Product Service - Final implementation
 * Provides an advanced product management service with proper error handling, caching,
 * performance optimization, and SQL query execution.
 */

import { logger } from '../utils/logger';
import { AdvancedCacheService } from '../utils/advanced-cache.service';
import { performance } from 'perf_hooks';
import prisma from '../lib/prisma';
import { ProductStatus, ProductType, Prisma } from '@prisma/client';

/**
 * Custom error class for product-related errors
 */
export class ProductError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'PRODUCT_ERROR', statusCode = 400) {
    super(message);
    this.name = 'ProductError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

/**
 * Interface for product filters
 */
export interface ProductFilters {
  categoryId?: string;
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  type?: ProductType;
  isActive?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  search?: string;
  tags?: string[];
}

/**
 * Interface for product query options
 */
export interface ProductQueryOptions extends PaginationOptions {
  filters?: ProductFilters;
  includeInactive?: boolean;
}

/**
 * Enhanced Product Service
 * Provides comprehensive product management functionality with advanced features
 */
export class EnhancedProductService {
  constructor(private cacheService?: AdvancedCacheService) {
    logger.info('Enhanced Product Service initialized');
  }

  /**
   * Get products with pagination and filtering
   * @param options Query options for filtering and pagination
   */
  async getProducts(options: ProductQueryOptions = {}) {
    const start = performance.now();
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      filters = {},
      includeInactive = false,
    } = options;

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
          logger.debug(`Cache hit for products query: ${cacheKey}`);
          return cachedResult;
        }
      }

      // Build where conditions
      const where: Prisma.ProductWhereInput = {};

      // Always filter out deleted products
      where.isActive = includeInactive ? undefined : true;

      // Apply filters
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.vendorId) where.vendorId = filters.vendorId;
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
      if (filters.isBestSeller !== undefined) where.isBestSeller = filters.isBestSeller;
      if (filters.isNewArrival !== undefined) where.isNewArrival = filters.isNewArrival;
      if (filters.isOnSale !== undefined) where.isOnSale = filters.isOnSale;

      // Price range filter
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
      }

      // Text search
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { brand: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags,
        };
      }

      // Execute query and count in parallel for better performance
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder.toLowerCase(),
          },
          skip,
          take: limit,
          include: {
            category: true,
            images: true,
            inventory: true,
            variants: {
              include: {
                inventory: true,
              },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const result = {
        products,
        total,
        page,
        limit,
        totalPages,
      };

      // Cache results
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          result,
          300, // 5 minutes TTL
          ['products', `page:${page}`, 'list']
        );
      }

      const duration = performance.now() - start;
      logger.debug(`getProducts completed in ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      logger.error('Error getting products:', error);
      throw new ProductError('Failed to retrieve products', 'PRODUCT_FETCH_ERROR', 500);
    }
  }

  /**
   * Get a single product by ID
   * @param id Product ID
   */
  async getProductById(id: string) {
    const start = performance.now();
    const cacheKey = `product:${id}`;

    try {
      // Try to get from cache first
      if (this.cacheService) {
        const cachedProduct = await this.cacheService.get(cacheKey);
        if (cachedProduct) {
          logger.debug(`Cache hit for product: ${id}`);
          return cachedProduct;
        }
      }

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          inventory: true,
          variants: {
            include: {
              inventory: true,
            },
          },
          reviews: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!product) {
        throw new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404);
      }

      // Cache product
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          product,
          600, // 10 minutes TTL
          ['products', `product:${id}`, 'detail']
        );
      }

      const duration = performance.now() - start;
      logger.debug(`getProductById completed in ${duration.toFixed(2)}ms`);

      return product;
    } catch (error) {
      if (error instanceof ProductError) throw error;

      logger.error(`Error retrieving product ${id}:`, error);
      throw new ProductError('Failed to retrieve product details', 'PRODUCT_FETCH_ERROR', 500);
    }
  }

  /**
   * Get a product by slug
   * @param slug Product slug
   */
  async getProductBySlug(slug: string) {
    const start = performance.now();
    const cacheKey = `product:slug:${slug}`;

    try {
      // Try to get from cache first
      if (this.cacheService) {
        const cachedProduct = await this.cacheService.get(cacheKey);
        if (cachedProduct) {
          logger.debug(`Cache hit for product slug: ${slug}`);
          return cachedProduct;
        }
      }

      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          inventory: true,
          variants: {
            include: {
              inventory: true,
            },
          },
          reviews: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!product) {
        throw new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404);
      }

      // Cache product
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          product,
          600, // 10 minutes TTL
          ['products', `product:slug:${slug}`, 'detail']
        );
      }

      const duration = performance.now() - start;
      logger.debug(`getProductBySlug completed in ${duration.toFixed(2)}ms`);

      return product;
    } catch (error) {
      if (error instanceof ProductError) throw error;

      logger.error(`Error retrieving product by slug ${slug}:`, error);
      throw new ProductError('Failed to retrieve product details', 'PRODUCT_FETCH_ERROR', 500);
    }
  }

  /**
   * Create a new product
   * @param data Product data
   */
  async createProduct(data: Prisma.ProductCreateInput) {
    const start = performance.now();

    try {
      // Check if SKU already exists
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku) {
        throw new ProductError('Product with this SKU already exists', 'DUPLICATE_SKU', 409);
      }

      // Check if slug exists if provided
      if (data.slug) {
        const existingSlug = await prisma.product.findUnique({
          where: { slug: data.slug },
        });

        if (existingSlug) {
          throw new ProductError('Product with this slug already exists', 'DUPLICATE_SLUG', 409);
        }
      }

      // Generate slug if not provided
      if (!data.slug) {
        data.slug = this.generateSlug(data.name);
      }

      // Use transaction to ensure data consistency
      const product = await prisma.$transaction(async (tx) => {
        // Create the product
        const newProduct = await tx.product.create({
          data: {
            ...data,
            // Handle relational data correctly
            images: data.images,
            category: {
              connect: { id: data.category.connect.id },
            },
            ...(data.vendor ? { vendor: { connect: { id: data.vendor.connect.id } } } : {}),
            inventory: data.inventory
              ? {
                  create: data.inventory.create,
                }
              : undefined,
          },
          include: {
            category: true,
            images: true,
            inventory: true,
          },
        });

        // Create price history record
        await tx.priceHistory.create({
          data: {
            productId: newProduct.id,
            price: newProduct.price,
            currency: newProduct.currency,
            changeType: 'set',
            reason: 'Initial price',
          },
        });

        return newProduct;
      });

      // Clear product list cache
      if (this.cacheService) {
        await this.cacheService.invalidate(['products', 'list']);
      }

      const duration = performance.now() - start;
      logger.info(`Product created in ${duration.toFixed(2)}ms: ${product.id}`);

      return product;
    } catch (error) {
      if (error instanceof ProductError) throw error;

      logger.error('Error creating product:', error);
      throw new ProductError('Failed to create product', 'PRODUCT_CREATE_ERROR', 500);
    }
  }

  /**
   * Update an existing product
   * @param id Product ID
   * @param data Update data
   */
  async updateProduct(id: string, data: Prisma.ProductUpdateInput) {
    const start = performance.now();

    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404);
      }

      // Check if SKU is being changed and if new SKU exists
      if (data.sku && data.sku !== existingProduct.sku) {
        const existingSku = await prisma.product.findUnique({
          where: { sku: String(data.sku) },
        });

        if (existingSku && existingSku.id !== id) {
          throw new ProductError('Product with this SKU already exists', 'DUPLICATE_SKU', 409);
        }
      }

      // Check if slug is being changed and if new slug exists
      if (data.slug && data.slug !== existingProduct.slug) {
        const existingSlug = await prisma.product.findUnique({
          where: { slug: String(data.slug) },
        });

        if (existingSlug && existingSlug.id !== id) {
          throw new ProductError('Product with this slug already exists', 'DUPLICATE_SLUG', 409);
        }
      }

      // Track if price is being updated
      const isPriceUpdate =
        data.price !== undefined && Number(data.price) !== Number(existingProduct.price);

      // Update the product using a transaction
      const updatedProduct = await prisma.$transaction(async (tx) => {
        // Update the product
        const product = await tx.product.update({
          where: { id },
          data,
          include: {
            category: true,
            images: true,
            inventory: true,
            variants: {
              include: {
                inventory: true,
              },
            },
          },
        });

        // Create price history record if price changed
        if (isPriceUpdate) {
          await tx.priceHistory.create({
            data: {
              productId: product.id,
              price: Number(data.price),
              currency: product.currency,
              changeType:
                Number(data.price) > Number(existingProduct.price) ? 'increase' : 'decrease',
              reason: 'Price update',
            },
          });
        }

        return product;
      });

      // Invalidate caches
      if (this.cacheService) {
        await Promise.all([
          this.cacheService.invalidate([`product:${id}`]),
          this.cacheService.invalidate([`product:slug:${updatedProduct.slug}`]),
          this.cacheService.invalidate(['products', 'list']),
        ]);
      }

      const duration = performance.now() - start;
      logger.info(`Product updated in ${duration.toFixed(2)}ms: ${id}`);

      return updatedProduct;
    } catch (error) {
      if (error instanceof ProductError) throw error;

      logger.error(`Error updating product ${id}:`, error);
      throw new ProductError('Failed to update product', 'PRODUCT_UPDATE_ERROR', 500);
    }
  }

  /**
   * Delete a product
   * @param id Product ID
   */
  async deleteProduct(id: string) {
    const start = performance.now();

    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404);
      }

      // Use transaction for deletion
      await prisma.$transaction(async (tx) => {
        // Delete product images
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        // Delete inventory
        await tx.inventory.deleteMany({
          where: { productId: id },
        });

        // Delete variants
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        // Delete product relations
        await tx.productRelation.deleteMany({
          where: {
            OR: [{ productId: id }, { relatedProductId: id }],
          },
        });

        // Delete price history
        await tx.priceHistory.deleteMany({
          where: { productId: id },
        });

        // Delete reviews
        await tx.review.deleteMany({
          where: { productId: id },
        });

        // Finally delete the product
        await tx.product.delete({
          where: { id },
        });
      });

      // Invalidate caches
      if (this.cacheService) {
        await Promise.all([
          this.cacheService.invalidate([`product:${id}`]),
          this.cacheService.invalidate([`product:slug:${existingProduct.slug}`]),
          this.cacheService.invalidate(['products', 'list']),
        ]);
      }

      const duration = performance.now() - start;
      logger.info(`Product deleted in ${duration.toFixed(2)}ms: ${id}`);

      return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
      if (error instanceof ProductError) throw error;

      logger.error(`Error deleting product ${id}:`, error);
      throw new ProductError('Failed to delete product', 'PRODUCT_DELETE_ERROR', 500);
    }
  }

  /**
   * Search products with full text search capability
   * @param query Search query
   * @param options Additional search options
   */
  async searchProducts(query: string, options: ProductQueryOptions = {}) {
    const start = performance.now();
    const {
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'DESC',
      filters = {},
    } = options;

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
          logger.debug(`Cache hit for search query: ${query}`);
          return cachedResult;
        }
      }

      // Determine skip value for pagination
      const skip = (page - 1) * limit;

      // Build base where condition with full-text search
      const where: Prisma.ProductWhereInput = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
        isActive: true,
      };

      // Apply additional filters
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.vendorId) where.vendorId = filters.vendorId;
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
      }

      // Determine sort field and order
      let orderBy: any;
      if (sortBy === 'relevance') {
        // For relevance sorting, we use a combination of factors
        orderBy = [{ isFeatured: 'desc' }, { isBestSeller: 'desc' }, { createdAt: 'desc' }];
      } else {
        orderBy = { [sortBy]: sortOrder.toLowerCase() };
      }

      // Execute query and count in parallel for better performance
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            category: true,
            images: {
              orderBy: {
                isMain: 'desc',
              },
              take: 1,
            },
            inventory: true,
          },
        }),
        prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Log search for analytics
      await this.logSearch(query, filters, products.length);

      const result = {
        query,
        products,
        total,
        page,
        limit,
        totalPages,
      };

      // Cache results (short TTL for search results)
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          result,
          180, // 3 minutes TTL
          ['search', `query:${query}`]
        );
      }

      const duration = performance.now() - start;
      logger.debug(`searchProducts completed in ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      logger.error(`Error searching products for "${query}":`, error);
      throw new ProductError('Failed to search products', 'PRODUCT_SEARCH_ERROR', 500);
    }
  }

  /**
   * Log search query for analytics
   * @param query Search query
   * @param filters Search filters
   * @param resultsCount Number of results
   */
  private async logSearch(query: string, filters: ProductFilters, resultsCount: number) {
    try {
      await prisma.searchLog.create({
        data: {
          query,
          filters: filters as any,
          results: resultsCount,
        },
      });
    } catch (error) {
      logger.error('Error logging search:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Generate a cache key based on parameters
   * @param prefix Cache key prefix
   * @param params Parameters to include in cache key
   */
  private generateCacheKey(prefix: string, params: Record<string, any>): string {
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
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
