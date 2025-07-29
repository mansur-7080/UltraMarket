/**
 * Advanced Performance Optimization System
 * UltraMarket E-commerce Platform
 * 
 * Bu fayl N+1 queries, caching, va database optimization issues ni hal qilish uchun
 */

// import { PrismaClient } from '@prisma/client'; // Optional import
let PrismaClient: any = null;
try {
  const prisma = require('@prisma/client');
  PrismaClient = prisma.PrismaClient;
} catch (error) {
  console.warn('Prisma not available, using fallback');
  PrismaClient = class MockPrismaClient {
    constructor() {}
    async $connect() {}
    async $disconnect() {}
  };
}
import Redis from 'redis';
import { createLogger } from '../utils/logger-replacement';

const perfLogger = createLogger('performance-optimizer');

// ❌ NOTO'G'RI - N+1 Query Problems
/*
// Har bir product uchun alohida query
const products = await prisma.product.findMany();
for (const product of products) {
  const vendor = await prisma.vendor.findUnique({ 
    where: { id: product.vendorId } 
  });
  const reviews = await prisma.review.findMany({ 
    where: { productId: product.id } 
  });
  // N+1 problem - 1 + N*2 queries!
}

// Cache yo'q
app.get('/products', async (req, res) => {
  const products = await prisma.product.findMany(); // Har safar DB ga borish
  res.json(products);
});
*/

// ✅ TO'G'RI - Optimized approach

export interface CacheConfig {
  redis: {
    url: string;
    prefix: string;
    defaultTTL: number;
  };
  queryOptimization: {
    batchSize: number;
    maxIncludes: number;
    enableEagerLoading: boolean;
  };
}

export class AdvancedPerformanceOptimizer {
  private prisma: any;
  private redis: Redis.RedisClientType;
  private config: CacheConfig;
  private queryTracker: Map<string, QueryMetrics> = new Map();

  constructor(prisma: any, redisClient: Redis.RedisClientType, config: CacheConfig) {
    this.prisma = prisma;
    this.redis = redisClient;
    this.config = config;
  }

  // ✅ N+1 Query Optimization
  async getProductsWithRelations(filters: ProductFilters = {}): Promise<EnrichedProduct[]> {
    const startTime = Date.now();

    try {
      // Single optimized query with all relations
      const products = await this.prisma.product.findMany({
        where: this.buildProductFilters(filters),
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              businessNameRu: true,
              rating: true,
              region: true,
              verificationLevel: true,
              badges: true
            }
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Latest 5 reviews only
          },
          categories: {
            select: {
              id: true,
              name: true,
              nameRu: true,
              slug: true
            }
          },
          specifications: {
            select: {
              name: true,
              value: true,
              unit: true,
              category: true
            }
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
              cartItems: true
            }
          }
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: this.buildProductOrderBy(filters.sortBy, filters.sortOrder)
      });

      // Calculate performance metrics
      const queryTime = Date.now() - startTime;
      this.trackQuery('getProductsWithRelations', queryTime, products.length);

      // Enrich with calculated fields
      const enrichedProducts = products.map(this.enrichProduct);

      perfLogger.info('Products fetched with relations', {
        count: products.length,
        queryTime,
        filters,
        service: 'performance-optimizer'
      });

      return enrichedProducts;

    } catch (error) {
      perfLogger.error('Error in getProductsWithRelations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        queryTime: Date.now() - startTime
      });
      throw error;
    }
  }

  // ✅ Advanced Caching System
  async getCachedData<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl: number = this.config.redis.defaultTTL
  ): Promise<T> {
    const cacheKey = `${this.config.redis.prefix}:${key}`;
    const startTime = Date.now();

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        perfLogger.debug('Cache hit', {
          key: cacheKey,
          responseTime: Date.now() - startTime
        });
        return JSON.parse(cached);
      }

      // Cache miss - fetch from source
      const data = await fetchFunction();
      
      // Store in cache with TTL
      await this.redis.setEx(cacheKey, ttl, JSON.stringify(data));
      
      const totalTime = Date.now() - startTime;
      perfLogger.info('Cache miss - data fetched and cached', {
        key: cacheKey,
        ttl,
        totalTime,
        cacheTime: totalTime - startTime
      });

      return data;

    } catch (error) {
      perfLogger.error('Cache operation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key: cacheKey
      });
      
      // Fallback to direct fetch
      return fetchFunction();
    }
  }

  // ✅ Batch Operations for Better Performance  
  async batchCreateProducts(productsData: CreateProductData[]): Promise<BatchResult<Product>> {
    const startTime = Date.now();
    const batchSize = this.config.queryOptimization.batchSize;
    const results: BatchResult<Product> = {
      successful: [],
      failed: [],
      totalCount: productsData.length,
      processedCount: 0
    };

    try {
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < productsData.length; i += batchSize) {
        const batch = productsData.slice(i, i + batchSize);
        
        try {
          const batchResults = await this.prisma.$transaction(
            batch.map(productData => 
              this.prisma.product.create({
                data: productData,
                include: {
                  vendor: true,
                  categories: true
                }
              })
            )
          );

          results.successful.push(...batchResults);
          results.processedCount += batchResults.length;

          // Clear related cache
          await this.invalidateProductCache();

        } catch (batchError) {
          perfLogger.warn('Batch operation failed', {
            batchIndex: i / batchSize,
            batchSize: batch.length,
            error: batchError instanceof Error ? batchError.message : 'Unknown error'
          });

          // Process individually for this batch
          for (const productData of batch) {
            try {
              const product = await this.prisma.product.create({
                data: productData,
                include: {
                  vendor: true,
                  categories: true
                }
              });
              results.successful.push(product);
              results.processedCount++;
            } catch (individualError) {
              results.failed.push({
                data: productData,
                error: individualError instanceof Error ? individualError.message : 'Unknown error'
              });
            }
          }
        }

        // Add delay between batches to prevent overloading
        if (i + batchSize < productsData.length) {
          await this.sleep(100); // 100ms delay
        }
      }

      const totalTime = Date.now() - startTime;
      perfLogger.info('Batch product creation completed', {
        totalCount: results.totalCount,
        successfulCount: results.successful.length,
        failedCount: results.failed.length,
        processingTime: totalTime,
        throughput: Math.round(results.processedCount / (totalTime / 1000))
      });

      return results;

    } catch (error) {
      perfLogger.error('Batch creation operation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalCount: productsData.length,
        processedCount: results.processedCount
      });
      throw error;
    }
  }

  // ✅ Intelligent Query Optimization
  async optimizeQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>,
    options: QueryOptimizationOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const queryKey = `query:${queryName}:${JSON.stringify(options)}`;

    try {
      // Check if this query should be cached
      if (options.enableCache && options.cacheTTL) {
        return await this.getCachedData(queryKey, queryFunction, options.cacheTTL);
      }

      // Execute query with timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), options.timeout || 30000)
      );

      const result = await Promise.race([queryFunction(), timeoutPromise]);
      
      const queryTime = Date.now() - startTime;
      this.trackQuery(queryName, queryTime, Array.isArray(result) ? result.length : 1);

      // Warn about slow queries
      if (queryTime > 1000) {
        perfLogger.warn('Slow query detected', {
          queryName,
          queryTime,
          options,
          recommendation: 'Consider adding indexes or optimizing query structure'
        });
      }

      return result;

    } catch (error) {
      const queryTime = Date.now() - startTime;
      perfLogger.error('Query optimization failed', {
        queryName,
        queryTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      });
      throw error;
    }
  }

  // ✅ Connection Pool Monitoring
  async monitorDatabasePerformance(): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    try {
      // Gather database metrics
      const [
        connectionMetrics,
        queryMetrics,
        cacheMetrics
      ] = await Promise.all([
        this.getConnectionMetrics(),
        this.getQueryMetrics(),
        this.getCacheMetrics()
      ]);

      const metrics: PerformanceMetrics = {
        timestamp: new Date().toISOString(),
        database: connectionMetrics,
        queries: queryMetrics,
        cache: cacheMetrics,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      perfLogger.info('Performance metrics collected', {
        collectionTime: Date.now() - startTime,
        metrics
      });

      return metrics;

    } catch (error) {
      perfLogger.error('Performance monitoring failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ✅ Cache Management
  async invalidateProductCache(productId?: string): Promise<void> {
    try {
      if (productId) {
        // Invalidate specific product cache
        await this.redis.del(`${this.config.redis.prefix}:product:${productId}`);
        await this.redis.del(`${this.config.redis.prefix}:product:relations:${productId}`);
      } else {
        // Invalidate all product-related cache
        const keys = await this.redis.keys(`${this.config.redis.prefix}:product*`);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }

      perfLogger.debug('Product cache invalidated', {
        productId: productId || 'all',
        service: 'performance-optimizer'
      });

    } catch (error) {
      perfLogger.error('Cache invalidation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId
      });
    }
  }

  // Helper methods
  private enrichProduct = (product: any): EnrichedProduct => {
    return {
      ...product,
      avgRating: product._count.reviews > 0 
        ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
        : 0,
      totalReviews: product._count.reviews,
      favoriteCount: product._count.favorites,
      inCartCount: product._count.cartItems,
      isPopular: product._count.cartItems > 10,
      priceFormatted: this.formatPrice(product.price),
      discountPercentage: product.originalPrice 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0
    };
  };

  private buildProductFilters(filters: ProductFilters) {
    const where: any = {};

    if (filters.category) where.categories = { some: { slug: filters.category } };
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }
    if (filters.inStock) where.stockQuantity = { gt: 0 };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { nameRu: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return where;
  }

  private buildProductOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    switch (sortBy) {
      case 'price':
        return { price: sortOrder };
      case 'rating':
        return { avgRating: sortOrder };
      case 'popularity':
        return { totalSold: sortOrder };
      case 'newest':
        return { createdAt: sortOrder };
      default:
        return { createdAt: 'desc' };
    }
  }

  private trackQuery(name: string, duration: number, resultCount: number) {
    const existing = this.queryTracker.get(name) || {
      name,
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      totalResults: 0
    };

    existing.count++;
    existing.totalDuration += duration;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    existing.minDuration = Math.min(existing.minDuration, duration);
    existing.totalResults += resultCount;

    this.queryTracker.set(name, existing);
  }

  private async getConnectionMetrics(): Promise<DatabaseMetrics> {
    // Mock implementation - in real scenario, get from Prisma metrics
    return {
      activeConnections: 10,
      idleConnections: 5,
      waitingConnections: 0,
      maxConnections: 20,
      connectionErrors: 0
    };
  }

  private async getQueryMetrics(): Promise<QueryMetrics[]> {
    return Array.from(this.queryTracker.entries()).map(([queryName, metrics]) => ({
      name: queryName,
      count: metrics.count,
      totalDuration: metrics.totalDuration,
      avgDuration: metrics.avgDuration,
      maxDuration: metrics.maxDuration,
      minDuration: metrics.minDuration,
      totalResults: metrics.totalResults
    }));
  }

  private async getCacheMetrics(): Promise<CacheMetrics> {
    try {
      const info = await this.redis.info('stats');
      const lines = info.split('\r\n');
      
      const getMetric = (key: string) => {
        const line = lines.find(l => l.startsWith(key));
        return line ? parseInt(line.split(':')[1]) || 0 : 0;
      };

      return {
        hitCount: getMetric('keyspace_hits'),
        missCount: getMetric('keyspace_misses'),
        hitRate: 0, // Calculate from hit/miss
        totalKeys: getMetric('db0:keys'),
        memoryUsage: getMetric('used_memory'),
        evictedKeys: getMetric('evicted_keys')
      };
    } catch {
      return {
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 0,
        evictedKeys: 0
      };
    }
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(price);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Type definitions
interface ProductFilters {
  category?: string;
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'price' | 'rating' | 'popularity' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

interface EnrichedProduct {
  id: string;
  name: string;
  nameRu?: string;
  price: number;
  originalPrice?: number;
  avgRating: number;
  totalReviews: number;
  favoriteCount: number;
  inCartCount: number;
  isPopular: boolean;
  priceFormatted: string;
  discountPercentage: number;
  vendor: any;
  reviews: any[];
  categories: any[];
  specifications: any[];
}

interface CreateProductData {
  name: string;
  nameRu?: string;
  description: string;
  price: number;
  vendorId: string;
  categoryIds: string[];
  specifications: any[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  vendorId: string;
}

interface BatchResult<T> {
  successful: T[];
  failed: Array<{ data: any; error: string }>;
  totalCount: number;
  processedCount: number;
}

interface QueryOptimizationOptions {
  enableCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  retries?: number;
}

interface QueryMetrics {
  name: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  totalResults: number;
}

interface DatabaseMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  maxConnections: number;
  connectionErrors: number;
}

interface CacheMetrics {
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  evictedKeys: number;
}

interface PerformanceMetrics {
  timestamp: string;
  database: DatabaseMetrics;
  queries: QueryMetrics[];
  cache: CacheMetrics;
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
  };
}

// Export the optimizer
export default AdvancedPerformanceOptimizer;

/**
 * USAGE EXAMPLES:
 * 
 * // Initialize the optimizer
 * const optimizer = new AdvancedPerformanceOptimizer(prisma, redisClient, config);
 * 
 * // Use optimized queries
 * const products = await optimizer.getProductsWithRelations({
 *   category: 'electronics',
 *   inStock: true,
 *   limit: 20
 * });
 * 
 * // Use intelligent caching
 * const popularProducts = await optimizer.getCachedData(
 *   'popular-products',
 *   () => getPopularProducts(),
 *   3600 // 1 hour TTL
 * );
 * 
 * // Batch operations
 * const results = await optimizer.batchCreateProducts(productDataArray);
 * 
 * // Monitor performance
 * const metrics = await optimizer.monitorDatabasePerformance();
 */ 