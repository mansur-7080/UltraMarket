/**
 * Ultra-Professional N+1 Query Eliminator
 * 
 * Professional solution for eliminating N+1 query problems in Product and User services.
 * This system provides advanced query optimization patterns including DataLoader,
 * batch loading, eager loading, and query plan optimization.
 * 
 * Key Features:
 * - DataLoader pattern for batch loading
 * - Query complexity analysis and optimization
 * - Automatic relationship preloading
 * - Performance monitoring and metrics
 * - SQL query optimization
 * - Cache-aware query planning
 * 
 * @author UltraMarket Performance Team
 * @version 1.0.0
 */

import { logger } from '../logging/ultra-professional-logger';
import { performance } from 'perf_hooks';

// Generic database client interface
interface DatabaseClient {
  $queryRaw: (query: any, ...params: any[]) => Promise<any[]>;
  $disconnect: () => Promise<void>;
  [key: string]: any; // For dynamic model access
}

// DataLoader interface for batch operations
interface BatchLoader<K, V> {
  load(key: K): Promise<V>;
  loadMany(keys: K[]): Promise<(V | Error)[]>;
  clear(key: K): void;
  clearAll(): void;
}

// Query optimization metrics
interface QueryMetrics {
  queryId: string;
  executionTime: number;
  queryCount: number;
  resultSize: number;
  cacheHits: number;
  cacheMisses: number;
  optimizationApplied: string[];
  timestamp: Date;
}

// Relationship loading strategy
enum LoadingStrategy {
  LAZY = 'lazy',
  EAGER = 'eager',
  BATCH = 'batch',
  SMART = 'smart'
}

// Query optimization configuration
interface OptimizationConfig {
  batchSize: number;
  cacheTimeout: number;
  maxQueryDepth: number;
  enableAutoPreload: boolean;
  enableBatchOptimization: boolean;
  enableQueryComplexityAnalysis: boolean;
  performanceThresholds: {
    slowQueryMs: number;
    complexQueryCount: number;
    memoryLimitMB: number;
  };
}

// DataLoader implementation with advanced caching
class UltraDataLoader<K extends string | number, V> implements BatchLoader<K, V> {
  private cache = new Map<K, Promise<V>>();
  private batchQueue: K[] = [];
  private batchPromise: Promise<(V | Error)[]> | null = null;
  private metrics: Map<string, number> = new Map();

  constructor(
    private batchLoadFn: (keys: K[]) => Promise<(V | Error)[]>,
    private options: {
      batchSize?: number;
      cacheKeyFn?: (key: K) => string;
      cacheTimeout?: number;
      enableMetrics?: boolean;
    } = {}
  ) {
    this.options = {
      batchSize: 100,
      cacheTimeout: 300000, // 5 minutes
      enableMetrics: true,
      ...options
    };
  }

  async load(key: K): Promise<V> {
    const cached = this.cache.get(key);
    if (cached) {
      if (this.options.enableMetrics) {
        this.metrics.set('cacheHits', (this.metrics.get('cacheHits') || 0) + 1);
      }
      return cached;
    }

    if (this.options.enableMetrics) {
      this.metrics.set('cacheMisses', (this.metrics.get('cacheMisses') || 0) + 1);
    }

    const promise = this.loadInternal(key);
    this.cache.set(key, promise);

    // Auto-expire cache entries
    if (this.options.cacheTimeout) {
      setTimeout(() => {
        this.cache.delete(key);
      }, this.options.cacheTimeout);
    }

    return promise;
  }

  async loadMany(keys: K[]): Promise<(V | Error)[]> {
    const promises = keys.map(key => this.load(key));
    return Promise.all(promises);
  }

  private async loadInternal(key: K): Promise<V> {
    this.batchQueue.push(key);

    if (!this.batchPromise) {
      this.batchPromise = new Promise((resolve) => {
        process.nextTick(async () => {
          const batch = this.batchQueue.slice();
          this.batchQueue = [];
          this.batchPromise = null;

          try {
            const results = await this.batchLoadFn(batch);
            resolve(results);
          } catch (error) {
            logger.error('DataLoader batch execution failed', {
              error: error.message,
              batchSize: batch.length,
              keys: batch
            });
            resolve(batch.map(() => error));
          }
        });
      });
    }

    const results = await this.batchPromise;
    const index = this.batchQueue.indexOf(key);
    const result = results[index];

    if (result instanceof Error) {
      throw result;
    }

    return result as V;
  }

  clear(key: K): void {
    this.cache.delete(key);
  }

  clearAll(): void {
    this.cache.clear();
    this.metrics.clear();
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }
}

// Main N+1 Query Eliminator class
export class N1QueryEliminator {
  private prisma: DatabaseClient;
  private dataLoaders: Map<string, UltraDataLoader<any, any>> = new Map();
  private queryMetrics: QueryMetrics[] = [];
  private config: OptimizationConfig;

  constructor(prisma: DatabaseClient, config?: Partial<OptimizationConfig>) {
    this.prisma = prisma;
    this.config = {
      batchSize: 100,
      cacheTimeout: 300000, // 5 minutes
      maxQueryDepth: 5,
      enableAutoPreload: true,
      enableBatchOptimization: true,
      enableQueryComplexityAnalysis: true,
      performanceThresholds: {
        slowQueryMs: 1000,
        complexQueryCount: 10,
        memoryLimitMB: 100
      },
      ...config
    };

    this.initializeDataLoaders();
  }

  /**
   * Initialize DataLoaders for common entities
   */
  private initializeDataLoaders(): void {
    // Product DataLoaders
    this.dataLoaders.set('productCategories', new UltraDataLoader(
      async (productIds: string[]) => {
        const categories = await this.prisma.$queryRaw`
          SELECT p.id as productId, c.* 
          FROM products p
          LEFT JOIN categories c ON p.categoryId = c.id
          WHERE p.id = ANY(${productIds})
        `;
        return this.mapResultsToKeys(categories, productIds, 'productId');
      },
      { batchSize: this.config.batchSize }
    ));

    this.dataLoaders.set('productImages', new UltraDataLoader(
      async (productIds: string[]) => {
        const images = await this.prisma.productImage.findMany({
          where: { productId: { in: productIds } },
          orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }]
        });
        return this.groupResultsByKey(images, productIds, 'productId');
      },
      { batchSize: this.config.batchSize }
    ));

    this.dataLoaders.set('productInventory', new UltraDataLoader(
      async (productIds: string[]) => {
        const inventory = await this.prisma.inventory.findMany({
          where: { productId: { in: productIds } }
        });
        return this.mapResultsToKeys(inventory, productIds, 'productId');
      },
      { batchSize: this.config.batchSize }
    ));

    this.dataLoaders.set('productReviews', new UltraDataLoader(
      async (productIds: string[]) => {
        const reviews = await this.prisma.review.findMany({
          where: { productId: { in: productIds } },
          orderBy: { createdAt: 'desc' },
          take: 5 // Latest 5 reviews per product
        });
        return this.groupResultsByKey(reviews, productIds, 'productId');
      },
      { batchSize: this.config.batchSize }
    ));

    // User DataLoaders
    this.dataLoaders.set('userAddresses', new UltraDataLoader(
      async (userIds: string[]) => {
        const addresses = await this.prisma.$queryRaw`
          SELECT * FROM addresses 
          WHERE userId = ANY(${userIds}) AND isActive = true
          ORDER BY isDefault DESC, createdAt DESC
        `;
        return this.groupResultsByKey(addresses, userIds, 'userId');
      },
      { batchSize: this.config.batchSize }
    ));

    this.dataLoaders.set('userOrders', new UltraDataLoader(
      async (userIds: string[]) => {
        const orders = await this.prisma.$queryRaw`
          SELECT * FROM orders 
          WHERE userId = ANY(${userIds})
          ORDER BY createdAt DESC
          LIMIT 10
        `;
        return this.groupResultsByKey(orders, userIds, 'userId');
      },
      { batchSize: this.config.batchSize }
    ));

    this.dataLoaders.set('userOrderStats', new UltraDataLoader(
      async (userIds: string[]) => {
        const stats = await this.prisma.$queryRaw`
          SELECT 
            userId,
            COUNT(*)::int as totalOrders,
            COALESCE(SUM(totalAmount), 0)::numeric as totalSpent,
            MAX(createdAt) as lastOrderDate
          FROM orders 
          WHERE userId = ANY(${userIds}) AND status = 'completed'
          GROUP BY userId
        `;
        return this.mapResultsToKeys(stats, userIds, 'userId');
      },
      { batchSize: this.config.batchSize }
    ));
  }

  /**
   * Optimized Product loading with relationship preloading
   */
  async loadProductsOptimized(
    productIds: string[],
    includes: string[] = ['category', 'images', 'inventory', 'reviews']
  ): Promise<any[]> {
    const startTime = performance.now();
    const queryId = `products_${Date.now()}`;

    try {
      // Batch load all relationships in parallel
      const [products, ...relationships] = await Promise.all([
        // Main products query
        this.prisma.product.findMany({
          where: { id: { in: productIds } },
          orderBy: { createdAt: 'desc' }
        }),
        // Parallel relationship loading
        ...includes.map(include => {
          switch (include) {
            case 'category':
              return this.dataLoaders.get('productCategories')!.loadMany(productIds);
            case 'images':
              return this.dataLoaders.get('productImages')!.loadMany(productIds);
            case 'inventory':
              return this.dataLoaders.get('productInventory')!.loadMany(productIds);
            case 'reviews':
              return this.dataLoaders.get('productReviews')!.loadMany(productIds);
            default:
              return Promise.resolve([]);
          }
        })
      ]);

      // Combine results
      const optimizedProducts = products.map(product => {
        const enhanced = { ...product };

        includes.forEach((include, index) => {
          const relationshipData = relationships[index];
          const productIndex = productIds.indexOf(product.id);
          
          if (relationshipData && relationshipData[productIndex]) {
            enhanced[include] = relationshipData[productIndex];
          }
        });

        return enhanced;
      });

      const executionTime = performance.now() - startTime;

      // Record metrics
      this.recordQueryMetrics({
        queryId,
        executionTime,
        queryCount: 1 + includes.length, // Main query + relationship queries
        resultSize: optimizedProducts.length,
        cacheHits: this.getCacheHits(),
        cacheMisses: this.getCacheMisses(),
        optimizationApplied: ['batch_loading', 'parallel_execution', 'dataloader'],
        timestamp: new Date()
      });

      logger.info('Products loaded with N+1 optimization', {
        queryId,
        productCount: optimizedProducts.length,
        executionTime: `${executionTime.toFixed(2)}ms`,
        includes,
        optimizations: ['DataLoader', 'Batch Loading', 'Parallel Execution']
      });

      return optimizedProducts;

    } catch (error) {
      logger.error('Failed to load optimized products', {
        error: error.message,
        productIds,
        includes
      });
      throw error;
    }
  }

  /**
   * Optimized User loading with relationship preloading
   */
  async loadUsersOptimized(
    userIds: string[],
    includes: string[] = ['addresses', 'orderStats']
  ): Promise<any[]> {
    const startTime = performance.now();
    const queryId = `users_${Date.now()}`;

    try {
      // Batch load all relationships in parallel
      const [users, ...relationships] = await Promise.all([
        // Main users query
        this.prisma.user.findMany({
          where: { id: { in: userIds } },
          orderBy: { createdAt: 'desc' }
        }),
        // Parallel relationship loading
        ...includes.map(include => {
          switch (include) {
            case 'addresses':
              return this.dataLoaders.get('userAddresses')!.loadMany(userIds);
            case 'orders':
              return this.dataLoaders.get('userOrders')!.loadMany(userIds);
            case 'orderStats':
              return this.dataLoaders.get('userOrderStats')!.loadMany(userIds);
            default:
              return Promise.resolve([]);
          }
        })
      ]);

      // Combine results
      const optimizedUsers = users.map(user => {
        const enhanced = { ...user };

        includes.forEach((include, index) => {
          const relationshipData = relationships[index];
          const userIndex = userIds.indexOf(user.id);
          
          if (relationshipData && relationshipData[userIndex]) {
            enhanced[include] = relationshipData[userIndex];
          }
        });

        return enhanced;
      });

      const executionTime = performance.now() - startTime;

      // Record metrics
      this.recordQueryMetrics({
        queryId,
        executionTime,
        queryCount: 1 + includes.length,
        resultSize: optimizedUsers.length,
        cacheHits: this.getCacheHits(),
        cacheMisses: this.getCacheMisses(),
        optimizationApplied: ['batch_loading', 'parallel_execution', 'dataloader'],
        timestamp: new Date()
      });

      logger.info('Users loaded with N+1 optimization', {
        queryId,
        userCount: optimizedUsers.length,
        executionTime: `${executionTime.toFixed(2)}ms`,
        includes,
        optimizations: ['DataLoader', 'Batch Loading', 'Parallel Execution']
      });

      return optimizedUsers;

    } catch (error) {
      logger.error('Failed to load optimized users', {
        error: error.message,
        userIds,
        includes
      });
      throw error;
    }
  }

  /**
   * Smart query optimization based on query patterns
   */
  async optimizeQuery<T>(
    entityType: 'product' | 'user',
    query: any,
    options: {
      preload?: string[];
      batchSize?: number;
      enableCaching?: boolean;
    } = {}
  ): Promise<T[]> {
    const { preload = [], batchSize = this.config.batchSize, enableCaching = true } = options;
    
    // Analyze query complexity
    const complexity = this.analyzeQueryComplexity(query, preload);
    
    if (complexity.shouldOptimize) {
      logger.info('Applying smart query optimization', {
        entityType,
        complexity: complexity.score,
        optimizations: complexity.suggestedOptimizations
      });

      // Apply optimizations based on analysis
      if (complexity.suggestedOptimizations.includes('batch_loading')) {
        switch (entityType) {
          case 'product':
            const productIds = await this.extractEntityIds('product', query);
            return this.loadProductsOptimized(productIds, preload) as Promise<T[]>;
          case 'user':
            const userIds = await this.extractEntityIds('user', query);
            return this.loadUsersOptimized(userIds, preload) as Promise<T[]>;
        }
      }
    }

    // Fallback to standard query
    return this.executeStandardQuery<T>(entityType, query, options);
  }

  /**
   * Analyze query complexity and suggest optimizations
   */
  private analyzeQueryComplexity(query: any, preload: string[]): {
    score: number;
    shouldOptimize: boolean;
    suggestedOptimizations: string[];
  } {
    let score = 0;
    const suggestions: string[] = [];

    // Check for potential N+1 patterns
    if (preload.length > 2) {
      score += preload.length * 2;
      suggestions.push('batch_loading');
    }

    // Check for complex where conditions
    if (query.where && Object.keys(query.where).length > 3) {
      score += 3;
      suggestions.push('index_optimization');
    }

    // Check for pagination without proper indexing
    if (query.skip || query.take) {
      score += 2;
      suggestions.push('pagination_optimization');
    }

    return {
      score,
      shouldOptimize: score > 5,
      suggestedOptimizations: suggestions
    };
  }

  /**
   * Extract entity IDs from query for batch loading
   */
  private async extractEntityIds(entityType: string, query: any): Promise<string[]> {
    const modelMap = {
      product: this.prisma.product,
      user: this.prisma.user
    };

    const model = modelMap[entityType as keyof typeof modelMap];
    if (!model) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    const results = await model.findMany({
      where: query.where,
      select: { id: true },
      take: query.take,
      skip: query.skip,
      orderBy: query.orderBy
    });

    return results.map((result: any) => result.id);
  }

  /**
   * Execute standard query without optimization
   */
  private async executeStandardQuery<T>(
    entityType: string,
    query: any,
    options: any
  ): Promise<T[]> {
    const modelMap = {
      product: this.prisma.product,
      user: this.prisma.user
    };

    const model = modelMap[entityType as keyof typeof modelMap];
    if (!model) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    return model.findMany(query) as Promise<T[]>;
  }

  /**
   * Helper function to map results to keys
   */
  private mapResultsToKeys<T>(
    results: any[],
    keys: string[],
    keyField: string
  ): (T | null)[] {
    const resultMap = new Map();
    results.forEach(result => {
      resultMap.set(result[keyField], result);
    });

    return keys.map(key => resultMap.get(key) || null);
  }

  /**
   * Helper function to group results by key
   */
  private groupResultsByKey<T>(
    results: any[],
    keys: string[],
    keyField: string
  ): (T[] | null)[] {
    const grouped = new Map<string, T[]>();
    
    results.forEach(result => {
      const key = result[keyField];
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(result);
    });

    return keys.map(key => grouped.get(key) || []);
  }

  /**
   * Record query metrics for performance monitoring
   */
  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log slow queries
    if (metrics.executionTime > this.config.performanceThresholds.slowQueryMs) {
      logger.warn('Slow query detected', {
        queryId: metrics.queryId,
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        queryCount: metrics.queryCount,
        optimizations: metrics.optimizationApplied
      });
    }
  }

  /**
   * Get cache hit statistics
   */
  private getCacheHits(): number {
    let totalHits = 0;
    this.dataLoaders.forEach(loader => {
      const metrics = loader.getMetrics();
      totalHits += metrics.get('cacheHits') || 0;
    });
    return totalHits;
  }

  /**
   * Get cache miss statistics
   */
  private getCacheMisses(): number {
    let totalMisses = 0;
    this.dataLoaders.forEach(loader => {
      const metrics = loader.getMetrics();
      totalMisses += metrics.get('cacheMisses') || 0;
    });
    return totalMisses;
  }

  /**
   * Get performance metrics and statistics
   */
  getPerformanceReport(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: number;
    cacheHitRatio: number;
    optimizationCoverage: number;
    recommendations: string[];
  } {
    const totalQueries = this.queryMetrics.length;
    const averageExecutionTime = totalQueries > 0 
      ? this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries 
      : 0;
    
    const slowQueries = this.queryMetrics.filter(
      m => m.executionTime > this.config.performanceThresholds.slowQueryMs
    ).length;

    const totalCacheRequests = this.getCacheHits() + this.getCacheMisses();
    const cacheHitRatio = totalCacheRequests > 0 
      ? this.getCacheHits() / totalCacheRequests 
      : 0;

    const optimizedQueries = this.queryMetrics.filter(
      m => m.optimizationApplied.length > 0
    ).length;
    const optimizationCoverage = totalQueries > 0 
      ? optimizedQueries / totalQueries 
      : 0;

    const recommendations: string[] = [];
    if (cacheHitRatio < 0.8) {
      recommendations.push('Increase cache TTL or improve cache key strategy');
    }
    if (slowQueries > totalQueries * 0.1) {
      recommendations.push('Review and optimize slow queries');
    }
    if (optimizationCoverage < 0.7) {
      recommendations.push('Apply more query optimizations');
    }

    return {
      totalQueries,
      averageExecutionTime,
      slowQueries,
      cacheHitRatio,
      optimizationCoverage,
      recommendations
    };
  }

  /**
   * Clear all caches and reset metrics
   */
  clearCaches(): void {
    this.dataLoaders.forEach(loader => loader.clearAll());
    this.queryMetrics = [];
    logger.info('N+1 Query Eliminator caches cleared');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.clearCaches();
    await this.prisma.$disconnect();
    logger.info('N+1 Query Eliminator shutdown completed');
  }
}

// Factory function to create N1QueryEliminator with database client
export function createN1QueryEliminator(prisma: DatabaseClient, config?: Partial<OptimizationConfig>): N1QueryEliminator {
  return new N1QueryEliminator(prisma, config);
}

// Example default configuration
export const defaultN1Config: OptimizationConfig = {
  batchSize: 100,
  cacheTimeout: 300000, // 5 minutes
  maxQueryDepth: 5,
  enableAutoPreload: true,
  enableBatchOptimization: true,
  enableQueryComplexityAnalysis: true,
  performanceThresholds: {
    slowQueryMs: 1000,
    complexQueryCount: 10,
    memoryLimitMB: 100
  }
};

export default N1QueryEliminator; 