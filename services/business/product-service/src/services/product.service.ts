/**
 * Product Service
 * Professional product management with Prisma and Redis caching
 */

import { PrismaClient, Product, Category, Brand, ProductStatus, ProductVisibility } from '@prisma/client';
import { RedisClientType } from 'redis';
import { logger } from '@ultramarket/shared/logging/logger';
import { cacheKey, cacheConfig } from '../config/redis';

export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  isFeatured?: boolean;
  isDigital?: boolean;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  tags?: string[];
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductMetrics {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  averagePrice: number;
  totalValue: number;
  topCategories: Array<{ categoryId: string; count: number; name: string }>;
  topBrands: Array<{ brandId: string; count: number; name: string }>;
  recentActivity: Array<{ action: string; count: number; date: Date }>;
}

export class ProductService {
  constructor(
    private prisma: PrismaClient,
    private redis: RedisClientType
  ) {}

  // ===== PRODUCT METHODS =====

  async createProduct(data: any, userId: string): Promise<Product> {
    try {
      logger.info('Creating new product', { sku: data.sku, userId });

      const product = await this.prisma.product.create({
        data: {
          ...data,
          slug: this.generateSlug(data.name),
          createdBy: userId,
          updatedBy: userId
        },
        include: {
          category: true,
          brand: true,
          images: true,
          variants: true,
          attributes: true,
          inventory: true
        }
      });

      // Clear relevant caches
      await this.clearProductCaches();

      logger.info('Product created successfully', { productId: product.id, sku: product.sku });
      return product;
    } catch (error) {
      logger.error('Failed to create product', { error, data });
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const cacheKeyStr = cacheKey.product(id);
      
      // Try cache first
      const cached = await this.redis.get(cacheKeyStr);
      if (cached) {
        logger.debug('Product retrieved from cache', { productId: id });
        return JSON.parse(cached);
      }

      // Fetch from database
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { position: 'asc' }
          },
          variants: {
            include: {
              inventory: true
            }
          },
          attributes: {
            orderBy: { position: 'asc' }
          },
          inventory: true
        }
      });

      if (product) {
        // Cache the result
        await this.redis.setEx(cacheKeyStr, cacheConfig.ttl.medium, JSON.stringify(product));
        logger.debug('Product cached', { productId: id });
      }

      return product;
    } catch (error) {
      logger.error('Failed to get product', { error, productId: id });
      throw error;
    }
  }

  async getProducts(filters: ProductFilters = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filterOptions
      } = filters;

      const skip = (page - 1) * limit;
      const cacheKeyStr = cacheKey.products(JSON.stringify(filters));

      // Try cache first
      const cached = await this.redis.get(cacheKeyStr);
      if (cached) {
        logger.debug('Products retrieved from cache', { filters });
        return JSON.parse(cached);
      }

      // Build where clause
      const where: any = {};

      if (filterOptions.categoryId) {
        where.categoryId = filterOptions.categoryId;
      }

      if (filterOptions.brandId) {
        where.brandId = filterOptions.brandId;
      }

      if (filterOptions.status) {
        where.status = filterOptions.status;
      }

      if (filterOptions.visibility) {
        where.visibility = filterOptions.visibility;
      }

      if (filterOptions.isFeatured !== undefined) {
        where.isFeatured = filterOptions.isFeatured;
      }

      if (filterOptions.isDigital !== undefined) {
        where.isDigital = filterOptions.isDigital;
      }

      if (filterOptions.priceMin || filterOptions.priceMax) {
        where.price = {};
        if (filterOptions.priceMin) where.price.gte = filterOptions.priceMin;
        if (filterOptions.priceMax) where.price.lte = filterOptions.priceMax;
      }

      if (filterOptions.search) {
        where.OR = [
          { name: { contains: filterOptions.search, mode: 'insensitive' } },
          { description: { contains: filterOptions.search, mode: 'insensitive' } },
          { sku: { contains: filterOptions.search, mode: 'insensitive' } }
        ];
      }

      if (filterOptions.tags && filterOptions.tags.length > 0) {
        where.tags = {
          hasSome: filterOptions.tags
        };
      }

      if (filterOptions.inStock) {
        where.inventory = {
          availableQuantity: {
            gt: 0
          }
        };
      }

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Fetch products and total count
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            category: true,
            brand: true,
            images: {
              where: { isPrimary: true },
              take: 1
            },
            inventory: true
          },
          orderBy,
          skip,
          take: limit
        }),
        this.prisma.product.count({ where })
      ]);

      const result = {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      // Cache the result
      await this.redis.setEx(cacheKeyStr, cacheConfig.ttl.short, JSON.stringify(result));

      logger.info('Products retrieved successfully', { 
        count: products.length, 
        total, 
        page, 
        filters: filterOptions 
      });

      return result;
    } catch (error) {
      logger.error('Failed to get products', { error, filters });
      throw error;
    }
  }

  async updateProduct(id: string, data: any, userId: string): Promise<Product> {
    try {
      logger.info('Updating product', { productId: id, userId });

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId
        },
        include: {
          category: true,
          brand: true,
          images: true,
          variants: true,
          attributes: true,
          inventory: true
        }
      });

      // Clear caches
      await this.clearProductCache(id);
      await this.clearProductCaches();

      logger.info('Product updated successfully', { productId: id });
      return product;
    } catch (error) {
      logger.error('Failed to update product', { error, productId: id });
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      logger.info('Deleting product', { productId: id });

      await this.prisma.product.delete({
        where: { id }
      });

      // Clear caches
      await this.clearProductCache(id);
      await this.clearProductCaches();

      logger.info('Product deleted successfully', { productId: id });
    } catch (error) {
      logger.error('Failed to delete product', { error, productId: id });
      throw error;
    }
  }

  // ===== CATEGORY METHODS =====

  async getCategories(): Promise<Category[]> {
    try {
      const cacheKeyStr = cacheKey.categories();
      
      // Try cache first
      const cached = await this.redis.get(cacheKeyStr);
      if (cached) {
        return JSON.parse(cached);
      }

      const categories = await this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          children: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: [
          { level: 'asc' },
          { position: 'asc' }
        ]
      });

      // Cache the result
      await this.redis.setEx(cacheKeyStr, cacheConfig.ttl.long, JSON.stringify(categories));

      return categories;
    } catch (error) {
      logger.error('Failed to get categories', error);
      throw error;
    }
  }

  // ===== BRAND METHODS =====

  async getBrands(): Promise<Brand[]> {
    try {
      const cacheKeyStr = cacheKey.brands();
      
      // Try cache first
      const cached = await this.redis.get(cacheKeyStr);
      if (cached) {
        return JSON.parse(cached);
      }

      const brands = await this.prisma.brand.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Cache the result
      await this.redis.setEx(cacheKeyStr, cacheConfig.ttl.long, JSON.stringify(brands));

      return brands;
    } catch (error) {
      logger.error('Failed to get brands', error);
      throw error;
    }
  }

  // ===== METRICS METHODS =====

  async getMetrics(): Promise<ProductMetrics> {
    try {
      const cacheKeyStr = cacheKey.metrics();
      
      // Try cache first
      const cached = await this.redis.get(cacheKeyStr);
      if (cached) {
        return JSON.parse(cached);
      }

      const [
        totalProducts,
        publishedProducts,
        draftProducts,
        averagePrice,
        topCategories,
        topBrands
      ] = await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.product.count({ where: { status: 'DRAFT' } }),
        this.prisma.product.aggregate({
          _avg: { price: true }
        }),
        this.prisma.category.findMany({
          include: {
            _count: {
              select: { products: true }
            }
          },
          orderBy: {
            products: {
              _count: 'desc'
            }
          },
          take: 10
        }),
        this.prisma.brand.findMany({
          include: {
            _count: {
              select: { products: true }
            }
          },
          orderBy: {
            products: {
              _count: 'desc'
            }
          },
          take: 10
        })
      ]);

      const metrics: ProductMetrics = {
        totalProducts,
        publishedProducts,
        draftProducts,
        outOfStockProducts: 0, // TODO: Calculate based on inventory
        lowStockProducts: 0,   // TODO: Calculate based on inventory
        averagePrice: Number(averagePrice._avg.price) || 0,
        totalValue: 0, // TODO: Calculate total inventory value
        topCategories: topCategories.map(cat => ({
          categoryId: cat.id,
          name: cat.name,
          count: cat._count.products
        })),
        topBrands: topBrands.map(brand => ({
          brandId: brand.id,
          name: brand.name,
          count: brand._count.products
        })),
        recentActivity: [] // TODO: Implement activity tracking
      };

      // Cache the result
      await this.redis.setEx(cacheKeyStr, cacheConfig.ttl.short, JSON.stringify(metrics));

      return metrics;
    } catch (error) {
      logger.error('Failed to get metrics', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async clearProductCache(productId: string): Promise<void> {
    try {
      await this.redis.del(cacheKey.product(productId));
    } catch (error) {
      logger.warn('Failed to clear product cache', { error, productId });
    }
  }

  private async clearProductCaches(): Promise<void> {
    try {
      const keys = await this.redis.keys('products:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      
      // Also clear related caches
      await this.redis.del([
        cacheKey.categories(),
        cacheKey.brands(),
        cacheKey.metrics()
      ]);
    } catch (error) {
      logger.warn('Failed to clear product caches', error);
    }
  }
} 