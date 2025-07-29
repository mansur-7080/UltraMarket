/**
 * Enhanced Product Service
 * Professional implementation with robust error handling, validation, and caching
 * Prisma-based implementation for optimal performance and type safety
 */

import { logger } from '../utils/logger';
import { AdvancedCacheService } from '../utils/advanced-cache.service';
import { performance } from 'perf_hooks';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

// Define product status and type enums (matching Prisma schema)
export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  SERVICE = 'SERVICE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

// Custom error classes for better error handling
export class ProductServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

export class ProductNotFoundError extends ProductServiceError {
  constructor(productId: string) {
    super(`Product not found with ID: ${productId}`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductValidationError extends ProductServiceError {
  public validationErrors: Record<string, string>;

  constructor(message: string, validationErrors: Record<string, string>) {
    super(message);
    this.name = 'ProductValidationError';
    this.validationErrors = validationErrors;
  }
}

export class DuplicateProductError extends ProductServiceError {
  constructor(sku: string) {
    super(`Product with SKU "${sku}" already exists`);
    this.name = 'DuplicateProductError';
  }
}

// Utility function to calculate current price with discount
const calculateCurrentPrice = (price: number, salePercentage: number | null): number => {
  if (salePercentage && salePercentage > 0) {
    return Number(price) - Number(price) * (salePercentage / 100);
  }
  return Number(price);
};

// Utility function to generate slug
const generateSlug = (name: string, id: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat('-', id.substring(id.length - 6));
};

export interface ProductFilters {
  categoryId?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  vendorId?: string;
  tags?: string[];
  status?: string;
  type?: string;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
}

export interface ProductQueryOptions {
  page: number;
  limit: number;
  filters: ProductFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  includeInactive?: boolean; // Admin option
  select?: Prisma.ProductSelect; // Fields to include/exclude
}

// Product create data matching Prisma schema
export interface ProductCreateData {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  brand?: string;
  model?: string;
  weight?: number;
  dimensions?: Prisma.JsonValue;
  price: number | string;
  comparePrice?: number | string;
  costPrice?: number | string;
  currency?: string;
  status?: string;
  type?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  salePercentage?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string[];
  attributes?: Prisma.JsonValue;
  specifications?: Prisma.JsonValue;
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: string;
  categoryId: string;
  vendorId?: string;
}

export class EnhancedProductService {
  private cacheService: AdvancedCacheService;

  constructor(cacheService?: AdvancedCacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Get all products with pagination, filtering, and caching
   */
  async getProducts(options: ProductQueryOptions) {
    const startTime = performance.now();

    try {
      const { page, limit, filters, sortBy, sortOrder, projection, includeInactive } = options;
      const skip = (page - 1) * limit;

      // Generate cache key based on request parameters
      const cacheKey = `products:${JSON.stringify({
        page,
        limit,
        filters,
        sortBy,
        sortOrder,
        projection,
        includeInactive,
      })}`;

      // Try to get from cache first
      if (this.cacheService) {
        const cachedResult = await this.cacheService.get(cacheKey);
        if (cachedResult) {
          logger.debug('Products returned from cache', {
            page,
            limit,
            cacheKey,
          });
          return cachedResult;
        }
      }

      // Build query
      const query = this.buildProductQuery(filters, includeInactive);

      // Build sort object
      const sort: Record<string, number> = {};
      sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with optimized projection
      const selectFields = projection || '';

      // Execute query and count in parallel for better performance
      const [products, total] = await Promise.all([
        Product.find(query).sort(sort).skip(skip).limit(limit).select(selectFields).lean(),
        Product.countDocuments(query),
      ]);

      const result = {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }; // Cache results
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          result,
          300, // 5 minutes TTL
          ['products', `page:${page}`]
        );
      }

      const duration = Math.round(performance.now() - startTime);
      logger.debug('Products query completed', {
        duration: `${duration}ms`,
        count: products.length,
        total,
        page,
      });

      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      logger.error('Failed to get products', {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
        options,
      });
      throw new ProductServiceError(`Failed to retrieve products: ${error.message}`);
    }
  }

  /**
   * Build optimized query for product filtering
   */
  private buildProductQuery(
    filters: ProductFilters,
    includeInactive?: boolean
  ): Record<string, any> {
    const query: Record<string, any> = {};

    // Only include active products by default unless explicitly requested
    if (!includeInactive) {
      query.isActive = true;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.brand) {
      query.brand = filters.brand;
    }

    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }

    if (filters.inStock !== undefined) {
      query.stock = filters.inStock ? { $gt: 0 } : { $lte: 0 };
    }

    if (filters.isActive !== undefined && includeInactive) {
      query.isActive = filters.isActive;
    }

    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }

    if (filters.vendorId) {
      query.vendorId = filters.vendorId;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.ratings && filters.ratings.length > 0) {
      query.rating = { $in: filters.ratings };
    }

    if (filters.search) {
      // Use text index for better performance
      query.$text = { $search: filters.search };
    }

    return query;
  }

  /**
   * Get product by ID with caching
   */
  async getProductById(id: string) {
    const startTime = performance.now();

    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ProductNotFoundError(id);
      }

      // Try to get from cache
      const cacheKey = `product:${id}`;
      if (this.cacheService) {
        const cachedProduct = await this.cacheService.get(cacheKey);
        if (cachedProduct) {
          logger.debug('Product returned from cache', { productId: id });
          return cachedProduct;
        }
      }

      // Get from database
      const product = await Product.findById(id).lean();

      if (!product) {
        throw new ProductNotFoundError(id);
      } // Cache the product
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          product,
          3600, // 1 hour TTL
          ['products', `product:${id}`]
        );
      }

      const duration = Math.round(performance.now() - startTime);
      logger.debug('Product retrieved by ID', {
        duration: `${duration}ms`,
        productId: id,
      });

      return product;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      if (error instanceof ProductNotFoundError) {
        logger.info('Product not found', { productId: id, duration: `${duration}ms` });
        throw error;
      }

      logger.error('Failed to get product by ID', {
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
  async getProductBySlug(slug: string) {
    const startTime = performance.now();

    try {
      // Try to get from cache
      const cacheKey = `product:slug:${slug}`;
      if (this.cacheService) {
        const cachedProduct = await this.cacheService.get(cacheKey);
        if (cachedProduct) {
          logger.debug('Product returned from cache by slug', { slug });
          return cachedProduct;
        }
      }

      // Get from database
      const product = await Product.findOne({ slug, isActive: true }).lean();

      if (!product) {
        logger.info('Product not found by slug', { slug });
        return null;
      } // Cache the product
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          product,
          3600, // 1 hour TTL
          ['products', `product:${product.id}`]
        );
      }

      const duration = Math.round(performance.now() - startTime);
      logger.debug('Product retrieved by slug', {
        duration: `${duration}ms`,
        slug,
      });

      return product;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      logger.error('Failed to get product by slug', {
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
  async createProduct(productData: ProductCreateData) {
    const startTime = performance.now();

    try {
      // Validate data manually for more detailed error messages
      const validationErrors = this.validateProductData(productData);
      if (Object.keys(validationErrors).length > 0) {
        throw new ProductValidationError('Product validation failed', validationErrors);
      }

      // Check if SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: productData.sku },
      });

      if (existingProduct) {
        throw new DuplicateProductError(productData.sku);
      }

      // Generate slug if not provided
      if (!productData.slug && productData.name) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Create product using Prisma transaction
      const product = await prisma.$transaction(async (tx) => {
        return await tx.product.create({
          data: {
            ...productData,
            // Ensure numeric values are properly handled
            price:
              typeof productData.price === 'string'
                ? parseFloat(productData.price)
                : productData.price,
            comparePrice: productData.comparePrice
              ? typeof productData.comparePrice === 'string'
                ? parseFloat(productData.comparePrice)
                : productData.comparePrice
              : null,
            costPrice: productData.costPrice
              ? typeof productData.costPrice === 'string'
                ? parseFloat(productData.costPrice)
                : productData.costPrice
              : null,
          },
        });
      });

      // Invalidate relevant caches
      if (this.cacheService) {
        await this.cacheService.invalidateByTags(['products']);
      }

      const duration = Math.round(performance.now() - startTime);
      logger.info('Product created successfully', {
        duration: `${duration}ms`,
        productId: product._id,
        sku: product.sku,
      });

      return product.toObject();
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();

      const duration = Math.round(performance.now() - startTime);

      if (error instanceof ProductValidationError || error instanceof DuplicateProductError) {
        // Log validation errors at info level since they're expected errors
        logger.info('Product creation validation failed', {
          error: error.message,
          ...(error instanceof ProductValidationError && {
            validationErrors: error.validationErrors,
          }),
          duration: `${duration}ms`,
        });
        throw error;
      }

      logger.error('Failed to create product', {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
      });

      throw new ProductServiceError(`Failed to create product: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Validate product data manually for detailed error messages
   */
  private validateProductData(data: ProductCreateData): Record<string, string> {
    const errors: Record<string, string> = {};

    // Required fields
    if (!data.name) errors.name = 'Product name is required';
    else if (data.name.length > 200) errors.name = 'Product name cannot exceed 200 characters';

    if (data.description && data.description.length > 2000)
      errors.description = 'Product description cannot exceed 2000 characters';

    if (!data.sku) errors.sku = 'SKU is required';
    else if (!/^[A-Z0-9\-]{5,20}$/.test(data.sku.toUpperCase())) {
      errors.sku = 'SKU must be 5-20 alphanumeric characters or hyphens';
    }

    if (!data.categoryId) errors.categoryId = 'Category ID is required';

    if (data.price === undefined) errors.price = 'Price is required';
    else {
      const priceValue = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
      if (isNaN(priceValue) || priceValue < 0)
        errors.price = 'Price must be a valid positive number';
    }

    // Optional fields with validation
    if (data.comparePrice !== undefined) {
      const comparePrice =
        typeof data.comparePrice === 'string' ? parseFloat(data.comparePrice) : data.comparePrice;
      if (isNaN(comparePrice) || comparePrice < 0) {
        errors.comparePrice = 'Compare price must be a valid positive number';
      }
    }

    if (
      data.salePercentage !== undefined &&
      (isNaN(data.salePercentage) || data.salePercentage < 0 || data.salePercentage > 100)
    ) {
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
  async updateProduct(id: string, updateData: Partial<ProductCreateData>) {
    const startTime = performance.now();
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ProductNotFoundError(id);
      }

      // Check if product exists
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        throw new ProductNotFoundError(id);
      }

      // If SKU is being changed, check for duplicates
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const duplicateSku = await Product.findOne({
          sku: updateData.sku,
          _id: { $ne: id },
        });

        if (duplicateSku) {
          throw new DuplicateProductError(updateData.sku);
        }
      }

      // Validate update data
      const validationErrors = this.validateProductUpdateData(updateData);
      if (Object.keys(validationErrors).length > 0) {
        throw new ProductValidationError('Product update validation failed', validationErrors);
      }

      // Update the product
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true, session }
      ).lean();

      // Commit transaction
      await session.commitTransaction();

      // Invalidate caches
      if (this.cacheService) {
        await Promise.all([
          this.cacheService.del(`product:${id}`),
          this.cacheService.invalidateByTags([`product:${id}`]),
          this.cacheService.invalidateByTags(['products']),
        ]);
      }

      const duration = Math.round(performance.now() - startTime);
      logger.info('Product updated successfully', {
        duration: `${duration}ms`,
        productId: id,
      });

      return updatedProduct;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();

      const duration = Math.round(performance.now() - startTime);

      if (
        error instanceof ProductNotFoundError ||
        error instanceof ProductValidationError ||
        error instanceof DuplicateProductError
      ) {
        logger.info('Product update failed with validation error', {
          error: error.message,
          productId: id,
          duration: `${duration}ms`,
        });
        throw error;
      }

      logger.error('Failed to update product', {
        error: error.message,
        stack: error.stack,
        productId: id,
        duration: `${duration}ms`,
      });

      throw new ProductServiceError(`Failed to update product: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Validate product update data
   */
  private validateProductUpdateData(data: Partial<ProductCreateData>): Record<string, string> {
    const errors: Record<string, string> = {};

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
      const comparePrice =
        typeof data.comparePrice === 'string' ? parseFloat(data.comparePrice) : data.comparePrice;
      if (isNaN(comparePrice) || comparePrice < 0) {
        errors.comparePrice = 'Compare price must be a valid positive number';
      }
    }

    if (
      data.salePercentage !== undefined &&
      (isNaN(data.salePercentage) || data.salePercentage < 0 || data.salePercentage > 100)
    ) {
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
   * Delete product by ID
   */
  async deleteProduct(id: string) {
    const startTime = performance.now();
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ProductNotFoundError(id);
      }

      // Delete product
      const deletedProduct = await Product.findByIdAndDelete(id).session(session);

      if (!deletedProduct) {
        throw new ProductNotFoundError(id);
      }

      await session.commitTransaction();

      // Invalidate caches
      if (this.cacheService) {
        await Promise.all([
          this.cacheService.del(`product:${id}`),
          this.cacheService.del(`product:slug:${deletedProduct.slug}`),
          this.cacheService.invalidateByTags([`product:${id}`]),
          this.cacheService.invalidateByTags(['products']),
        ]);
      }

      const duration = Math.round(performance.now() - startTime);
      logger.info('Product deleted successfully', {
        duration: `${duration}ms`,
        productId: id,
      });

      return { success: true, deletedId: id };
    } catch (error) {
      await session.abortTransaction();

      const duration = Math.round(performance.now() - startTime);

      if (error instanceof ProductNotFoundError) {
        logger.info('Product delete failed - not found', {
          productId: id,
          duration: `${duration}ms`,
        });
        throw error;
      }

      logger.error('Failed to delete product', {
        error: error.message,
        stack: error.stack,
        productId: id,
        duration: `${duration}ms`,
      });

      throw new ProductServiceError(`Failed to delete product: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Get product count by various criteria for analytics
   */
  async getProductStats() {
    try {
      const startTime = performance.now();

      // Cache key for stats
      const cacheKey = 'product:stats';

      // Try to get from cache
      if (this.cacheService) {
        const cachedStats = await this.cacheService.get(cacheKey);
        if (cachedStats) {
          return cachedStats;
        }
      }

      // Use aggregation pipeline for efficient stats calculation
      const [stats] = await Product.aggregate([
        {
          $facet: {
            totalProducts: [{ $count: 'count' }],
            activeProducts: [{ $match: { isActive: true } }, { $count: 'count' }],
            featuredProducts: [{ $match: { isFeatured: true } }, { $count: 'count' }],
            outOfStock: [{ $match: { stock: { $lte: 0 } } }, { $count: 'count' }],
            byCategory: [
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            byBrand: [
              { $group: { _id: '$brand', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            priceStats: [
              {
                $group: {
                  _id: null,
                  minPrice: { $min: '$price' },
                  maxPrice: { $max: '$price' },
                  avgPrice: { $avg: '$price' },
                },
              },
            ],
          },
        },
      ]);

      // Process results
      const result = {
        totalProducts: stats.totalProducts[0]?.count || 0,
        activeProducts: stats.activeProducts[0]?.count || 0,
        featuredProducts: stats.featuredProducts[0]?.count || 0,
        outOfStock: stats.outOfStock[0]?.count || 0,
        byCategory: stats.byCategory,
        byBrand: stats.byBrand,
        priceStats: stats.priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 },
      };

      // Cache the results
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          result,
          3600, // 1 hour TTL
          ['products', 'stats']
        );
      }

      const duration = Math.round(performance.now() - startTime);
      logger.debug('Product stats generated', {
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      logger.error('Failed to get product stats', {
        error: error.message,
        stack: error.stack,
      });
      throw new ProductServiceError(`Failed to generate product statistics: ${error.message}`);
    }
  }

  /**
   * Bulk update product stock levels for inventory synchronization
   */
  async bulkUpdateStock(updates: Array<{ productId: string; newStock: number }>) {
    const startTime = performance.now();
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const results = {
        success: [] as string[],
        notFound: [] as string[],
        failed: [] as string[],
      };

      // Process all updates in bulk
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { _id: update.productId },
          update: { $set: { stock: update.newStock, updatedAt: new Date() } },
        },
      }));

      const bulkResult = await Product.bulkWrite(bulkOps, { session });

      // Validate results
      if (bulkResult.matchedCount !== updates.length) {
        // Find which products were not found
        const foundProductIds = new Set<string>();

        // Get list of products that were found
        const foundProducts = await Product.find(
          {
            _id: { $in: updates.map((u) => u.productId) },
          },
          '_id'
        )
          .session(session)
          .lean();

        foundProducts.forEach((p) => foundProductIds.add(p._id.toString()));

        // Determine which products were not found
        updates.forEach((update) => {
          if (foundProductIds.has(update.productId)) {
            results.success.push(update.productId);
          } else {
            results.notFound.push(update.productId);
          }
        });
      } else {
        results.success = updates.map((u) => u.productId);
      }

      await session.commitTransaction();

      // Invalidate caches for updated products
      if (this.cacheService) {
        await Promise.all([
          ...results.success.map((id) => this.cacheService.del(`product:${id}`)),
          this.cacheService.invalidateByTags(['products']),
        ]);
      }

      const duration = Math.round(performance.now() - startTime);
      logger.info('Bulk stock update completed', {
        duration: `${duration}ms`,
        total: updates.length,
        succeeded: results.success.length,
        notFound: results.notFound.length,
        failed: results.failed.length,
      });

      return results;
    } catch (error) {
      await session.abortTransaction();

      const duration = Math.round(performance.now() - startTime);
      logger.error('Failed to update stock in bulk', {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
        updateCount: updates.length,
      });

      throw new ProductServiceError(`Failed to update stock levels: ${error.message}`);
    } finally {
      session.endSession();
    }
  }
}

export default EnhancedProductService;
