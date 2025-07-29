/**
 * Enhanced Product Service (Prisma Implementation)
 * A high-performance product service using Prisma with SQL and multi-level caching
 */

// Import necessary types and services
import {
  Product,
  ProductType,
  ProductStatus,
  ProductError,
  ProductCreateInput,
  ProductUpdateInput,
  ProductQueryOptions,
  ProductListResult,
  Category,
} from '../types/product.types';
import AdvancedCacheService from '../utils/advanced-cache.service';
import { PrismaClient } from '@prisma/client';

/**
 * EnhancedProductService provides a comprehensive API for product management
 * with built-in multi-level caching and optimized database operations
 */
export class EnhancedProductServicePrisma {
  private prisma: PrismaClient;
  private cacheService: AdvancedCacheService;
  private readonly DEFAULT_CACHE_TTL = 3600; // 1 hour
  private readonly SHORT_CACHE_TTL = 300; // 5 minutes

  /**
   * Initialize the product service with database and cache
   */
  constructor() {
    this.prisma = new PrismaClient();
    this.cacheService = new AdvancedCacheService('redis://localhost:6379', {
      max: 1000,
      ttl: this.DEFAULT_CACHE_TTL * 1000,
    });
  }

  /**
   * Clear all product-related caches
   * @returns {Promise<void>}
   */
  async clearCache(): Promise<void> {
    await this.cacheService.delByPattern('product:*');
  }

  /**
   * Clear cache for a specific product
   * @param {string} id - The product ID
   * @returns {Promise<void>}
   */
  async clearProductCache(id: string): Promise<void> {
    await this.cacheService.del(`product:${id}`);
    await this.cacheService.delByPattern(`product:slug:*`);
    await this.cacheService.delByPattern(`products:list:*`);
  }

  /**
   * Convert database product to response format
   * @param {Product} product - The product entity
   * @returns {ProductResponse} - The formatted product response
   */
  private formatProductResponse(product: Product) {
    return {
      ...product,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : undefined,
    };
  }

  /**
   * Transform query options into Prisma query parameters
   * @param {ProductQueryOptions} options - Query options
   * @returns {object} - Prisma query parameters
   */
  private buildQueryOptions(options: ProductQueryOptions) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
      includeInactive = false,
    } = options;

    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = { [sortBy]: sortOrder.toLowerCase() };

    // Build where clauses
    const where: any = {};

    // Handle filters
    if (filters) {
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters.vendorId) {
        where.vendorId = filters.vendorId;
      }

      if (filters.minPrice || filters.maxPrice) {
        where.price = {};
        if (filters.minPrice) where.price.gte = filters.minPrice;
        if (filters.maxPrice) where.price.lte = filters.maxPrice;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.brand) {
        where.brand = filters.brand;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { brand: { contains: filters.search, mode: 'insensitive' } },
          { model: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Boolean filters
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.isFeatured !== undefined) {
        where.isFeatured = filters.isFeatured;
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

      // Handle tags (array contains)
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }
    }

    // Unless specifically included, only return active products
    if (!includeInactive && filters.isActive === undefined) {
      where.isActive = true;
    }

    return { skip, take, orderBy, where };
  }

  /**
   * Get a product by its ID
   * @param {string} id - Product ID
   * @returns {Promise<Product | null>} - Found product or null
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get<Product>(`product:${id}`);
      if (cached) {
        return cached;
      }

      // Fetch from database with category
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (!product) {
        return null;
      }

      // Store in cache and return
      await this.cacheService.set(`product:${id}`, product);

      return product;
    } catch (error) {
      throw new ProductError(
        `Error fetching product: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get a product by its slug
   * @param {string} slug - Product slug
   * @returns {Promise<Product | null>} - Found product or null
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get<Product>(`product:slug:${slug}`);
      if (cached) {
        return cached;
      }

      // Fetch from database with category
      const product = await this.prisma.product.findUnique({
        where: { slug },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (!product) {
        return null;
      }

      // Store in cache and return
      await this.cacheService.set(`product:slug:${slug}`, product);
      await this.cacheService.set(`product:${product.id}`, product);

      return product;
    } catch (error) {
      throw new ProductError(
        `Error fetching product by slug: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Search products by query string
   * @param {string} query - Search query
   * @param {ProductQueryOptions} options - Query options
   * @returns {Promise<ProductListResult>} - List of products with pagination
   */
  async searchProducts(query: string, options: ProductQueryOptions): Promise<ProductListResult> {
    try {
      const { page = 1, limit = 20 } = options;

      // Generate cache key based on query and options
      const cacheKey = `products:search:${query}:${JSON.stringify(options)}`;

      // Try to get from cache first
      const cached = await this.cacheService.get<ProductListResult>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query options
      const queryOptions = this.buildQueryOptions(options);

      // Add search conditions
      queryOptions.where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { model: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ];

      // Execute the query
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          ...queryOptions,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        }),
        this.prisma.product.count({ where: queryOptions.where }),
      ]);

      // Format the response
      const result: ProductListResult = {
        products: products.map((product) => this.formatProductResponse(product)),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };

      // Store in cache with shorter TTL for search results
      await this.cacheService.set(cacheKey, result, this.SHORT_CACHE_TTL);

      return result;
    } catch (error) {
      throw new ProductError(
        `Error searching products: ${(error as Error).message}`,
        'SEARCH_ERROR',
        500
      );
    }
  }

  /**
   * Get products with pagination and filtering
   * @param {ProductQueryOptions} options - Query options
   * @returns {Promise<ProductListResult>} - List of products with pagination
   */
  async getProducts(options: ProductQueryOptions): Promise<ProductListResult> {
    try {
      const { page = 1, limit = 20 } = options;

      // Generate cache key based on options
      const cacheKey = `products:list:${JSON.stringify(options)}`;

      // Try to get from cache first
      const cached = await this.cacheService.get<ProductListResult>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query options
      const queryOptions = this.buildQueryOptions(options);

      // Execute the query
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          ...queryOptions,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        }),
        this.prisma.product.count({ where: queryOptions.where }),
      ]);

      // Format the response
      const result: ProductListResult = {
        products: products.map((product) => this.formatProductResponse(product)),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };

      // Store in cache
      await this.cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      throw new ProductError(
        `Error fetching products: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get all categories with optional parent filter
   * @param {string} [parentId] - Optional parent category ID
   * @returns {Promise<Category[]>} - List of categories
   */
  async getCategories(parentId?: string): Promise<Category[]> {
    try {
      // Generate cache key
      const cacheKey = parentId ? `categories:parent:${parentId}` : 'categories:all';

      // Try to get from cache first
      const cached = await this.cacheService.get<Category[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query
      const where = parentId ? { parentId } : {};

      // Execute the query
      const categories = await this.prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          children: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Store in cache
      await this.cacheService.set(cacheKey, categories);

      return categories;
    } catch (error) {
      throw new ProductError(
        `Error fetching categories: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Create a new product
   * @param {ProductCreateInput} data - Product data
   * @returns {Promise<Product>} - Created product
   */
  async createProduct(data: ProductCreateInput): Promise<Product> {
    try {
      // Generate a slug if not provided
      if (!data.slug) {
        data.slug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Validate slug uniqueness
      const existingProductWithSlug = await this.prisma.product.findUnique({
        where: { slug: data.slug },
      });

      if (existingProductWithSlug) {
        throw new ProductError(
          `A product with slug "${data.slug}" already exists`,
          'DUPLICATE_SLUG',
          409
        );
      }

      // Create the product
      const product = await this.prisma.product.create({
        data: {
          ...data,
          // Set defaults for required fields
          status: data.status || ProductStatus.DRAFT,
          type: data.type || ProductType.PHYSICAL,
          isActive: data.isActive !== undefined ? data.isActive : false,
          isFeatured: data.isFeatured || false,
          isBestSeller: data.isBestSeller || false,
          isNewArrival: data.isNewArrival || false,
          isOnSale: data.isOnSale || false,
          tags: data.tags || [],
          currency: data.currency || 'USD',
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Clear relevant caches
      await this.clearCache();

      return product;
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }

      throw new ProductError(
        `Error creating product: ${(error as Error).message}`,
        'CREATE_ERROR',
        500
      );
    }
  }

  /**
   * Update an existing product
   * @param {string} id - Product ID
   * @param {ProductUpdateInput} data - Product data
   * @returns {Promise<Product | null>} - Updated product or null
   */
  async updateProduct(id: string, data: ProductUpdateInput): Promise<Product | null> {
    try {
      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return null;
      }

      // Validate slug uniqueness if provided
      if (data.slug && data.slug !== existingProduct.slug) {
        const productWithSlug = await this.prisma.product.findUnique({
          where: { slug: data.slug },
        });

        if (productWithSlug && productWithSlug.id !== id) {
          throw new ProductError(
            `A product with slug "${data.slug}" already exists`,
            'DUPLICATE_SLUG',
            409
          );
        }
      }

      // Update the product
      const product = await this.prisma.product.update({
        where: { id },
        data,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Clear product cache
      await this.clearProductCache(id);

      return product;
    } catch (error) {
      if (error instanceof ProductError) {
        throw error;
      }

      throw new ProductError(
        `Error updating product: ${(error as Error).message}`,
        'UPDATE_ERROR',
        500
      );
    }
  }

  /**
   * Delete a product
   * @param {string} id - Product ID
   * @returns {Promise<Product | null>} - Deleted product or null
   */
  async deleteProduct(id: string): Promise<Product | null> {
    try {
      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return null;
      }

      // Delete the product
      const product = await this.prisma.product.delete({
        where: { id },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Clear product cache and list cache
      await this.clearCache();

      return product;
    } catch (error) {
      throw new ProductError(
        `Error deleting product: ${(error as Error).message}`,
        'DELETE_ERROR',
        500
      );
    }
  }

  /**
   * Get products related to a specific product
   * @param {string} productId - Product ID
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Product[]>} - List of related products
   */
  async getRelatedProducts(productId: string, limit = 5): Promise<Product[]> {
    try {
      const cacheKey = `products:related:${productId}:${limit}`;

      // Try to get from cache first
      const cached = await this.cacheService.get<Product[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get the source product to find related ones
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true, tags: true },
      });

      if (!product) {
        return [];
      }

      // Find products in the same category with similar tags
      const relatedProducts = await this.prisma.product.findMany({
        where: {
          id: { not: productId },
          categoryId: product.categoryId,
          isActive: true,
        },
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Store in cache
      await this.cacheService.set(cacheKey, relatedProducts);

      return relatedProducts;
    } catch (error) {
      throw new ProductError(
        `Error fetching related products: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get top selling products
   * @param {string} [categoryId] - Optional category filter
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Product[]>} - List of top selling products
   */
  async getTopSellingProducts(categoryId?: string, limit = 10): Promise<Product[]> {
    try {
      const cacheKey = categoryId
        ? `products:top-selling:category:${categoryId}:${limit}`
        : `products:top-selling:${limit}`;

      // Try to get from cache first
      const cached = await this.cacheService.get<Product[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build where clause
      const where: any = {
        isActive: true,
        isBestSeller: true,
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Get top selling products
      const products = await this.prisma.product.findMany({
        where,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Store in cache
      await this.cacheService.set(cacheKey, products);

      return products;
    } catch (error) {
      throw new ProductError(
        `Error fetching top selling products: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get featured products
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Product[]>} - List of featured products
   */
  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    try {
      const cacheKey = `products:featured:${limit}`;

      // Try to get from cache first
      const cached = await this.cacheService.get<Product[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get featured products
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
        },
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Store in cache
      await this.cacheService.set(cacheKey, products);

      return products;
    } catch (error) {
      throw new ProductError(
        `Error fetching featured products: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get new arrival products
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Product[]>} - List of new arrival products
   */
  async getNewArrivals(limit = 10): Promise<Product[]> {
    try {
      const cacheKey = `products:new-arrivals:${limit}`;

      // Try to get from cache first
      const cached = await this.cacheService.get<Product[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get new arrivals
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          isNewArrival: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Store in cache
      await this.cacheService.set(cacheKey, products);

      return products;
    } catch (error) {
      throw new ProductError(
        `Error fetching new arrivals: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get products by IDs
   * @param {string[]} ids - Product IDs
   * @returns {Promise<Product[]>} - List of products
   */
  async getProductsByIds(ids: string[]): Promise<Product[]> {
    try {
      if (!ids.length) {
        return [];
      }

      const cacheKey = `products:by-ids:${ids.sort().join(',')}`;

      // Try to get from cache first
      const cached = await this.cacheService.get<Product[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get products by IDs
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: ids },
          isActive: true,
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Store individual products in cache as well
      await Promise.all(
        products.map((product) => this.cacheService.set(`product:${product.id}`, product))
      );

      // Store the full result in cache
      await this.cacheService.set(cacheKey, products);

      return products;
    } catch (error) {
      throw new ProductError(
        `Error fetching products by IDs: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get trending products (algorithm based on views and recent sales)
   * @param {number} limit - Maximum number of products to return
   * @returns {Promise<Product[]>} - List of trending products
   */
  async getTrendingProducts(limit = 10): Promise<Product[]> {
    try {
      const cacheKey = `products:trending:${limit}`;

      // Try to get from cache first with shorter TTL for trending
      const cached = await this.cacheService.get<Product[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get trending products (simulated with a mix of best sellers and new arrivals)
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [{ isBestSeller: true }, { isNewArrival: true }],
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Store in cache with shorter TTL
      await this.cacheService.set(cacheKey, products, this.SHORT_CACHE_TTL);

      return products;
    } catch (error) {
      throw new ProductError(
        `Error fetching trending products: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {ProductQueryOptions} options - Query options
   * @returns {Promise<ProductListResult>} - List of products with pagination
   */
  async getProductsByCategory(
    categoryId: string,
    options: ProductQueryOptions
  ): Promise<ProductListResult> {
    try {
      const { page = 1, limit = 20 } = options;

      // Override category filter
      const queryOptions = {
        ...options,
        filters: {
          ...options.filters,
          categoryId,
        },
      };

      return this.getProducts(queryOptions);
    } catch (error) {
      throw new ProductError(
        `Error fetching products by category: ${(error as Error).message}`,
        'FETCH_ERROR',
        500
      );
    }
  }
}
