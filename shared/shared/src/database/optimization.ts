import { logger } from '../logging/logger';
import { DatabaseError } from '../errors/AppError';

// Database connection configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolMin?: number;
  poolMax?: number;
  poolIdle?: number;
  acquireTimeout?: number;
  timeout?: number;
}

// Query performance monitoring
export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  rows?: number;
  cached?: boolean;
}

// Database optimization utilities
export class DatabaseOptimizer {
  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThreshold: number = 1000; // 1 second

  constructor(slowQueryThreshold: number = 1000) {
    this.slowQueryThreshold = slowQueryThreshold;
  }

  /**
   * Monitor query performance
   */
  async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    expectedRows?: number
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Log metrics
      const metrics: QueryMetrics = {
        query: queryName,
        duration,
        timestamp: new Date(),
        rows: Array.isArray(result) ? result.length : expectedRows,
      };

      this.queryMetrics.push(metrics);

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          query: queryName,
          duration,
          threshold: this.slowQueryThreshold,
          rows: metrics.rows,
        });
      } else {
        logger.debug('Query executed', {
          query: queryName,
          duration,
          rows: metrics.rows,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Query failed', {
        query: queryName,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new DatabaseError(`Query failed: ${queryName}`, {
        query: queryName,
        duration,
        originalError: error,
      });
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    slowestQueries: QueryMetrics[];
  } {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        slowestQueries: [],
      };
    }

    const totalDuration = this.queryMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const slowQueries = this.queryMetrics.filter(
      (metric) => metric.duration > this.slowQueryThreshold
    );
    const slowestQueries = [...this.queryMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalQueries: this.queryMetrics.length,
      averageDuration: totalDuration / this.queryMetrics.length,
      slowQueries: slowQueries.length,
      slowestQueries,
    };
  }

  /**
   * Clear query metrics
   */
  clearMetrics(): void {
    this.queryMetrics = [];
  }
}

// PostgreSQL optimization utilities
export class PostgreSQLOptimizer {
  /**
   * Generate index creation SQL for common patterns
   */
  static generateIndexes(): string[] {
    return [
      // User table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);',

      // Product table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON products(category);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand ON products(brand);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stock ON products(stock);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON products(created_at);',
      "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));",
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price_category ON products(category, price);',

      // Order table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);',

      // Order items indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);',

      // Cart table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_user_id ON cart(user_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_product_id ON cart(product_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_user_product ON cart(user_id, product_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_updated_at ON cart(updated_at);',

      // Payment table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_order_id ON payments(order_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_method ON payments(payment_method);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at ON payments(created_at);',

      // Session table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active ON sessions(is_active) WHERE is_active = true;',

      // Audit log indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);',
    ];
  }

  /**
   * Generate database optimization queries
   */
  static generateOptimizationQueries(): string[] {
    return [
      // Update table statistics
      'ANALYZE users;',
      'ANALYZE products;',
      'ANALYZE orders;',
      'ANALYZE order_items;',
      'ANALYZE cart;',
      'ANALYZE payments;',
      'ANALYZE sessions;',
      'ANALYZE audit_logs;',

      // Vacuum tables
      'VACUUM ANALYZE users;',
      'VACUUM ANALYZE products;',
      'VACUUM ANALYZE orders;',
      'VACUUM ANALYZE order_items;',
      'VACUUM ANALYZE cart;',
      'VACUUM ANALYZE payments;',
      'VACUUM ANALYZE sessions;',
      'VACUUM ANALYZE audit_logs;',
    ];
  }

  /**
   * Get slow query analysis
   */
  static getSlowQueryAnalysis(): string[] {
    return [
      `
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE mean_time > 100
      ORDER BY mean_time DESC 
      LIMIT 20;
      `,

      `
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY abs(correlation) DESC;
      `,

      `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan
      FROM pg_stat_user_indexes 
      WHERE idx_scan = 0
      ORDER BY schemaname, tablename;
      `,
    ];
  }
}

// MongoDB optimization utilities
export class MongoDBOptimizer {
  /**
   * Generate MongoDB indexes
   */
  static generateIndexes(): Array<{ collection: string; index: object; options?: object }> {
    return [
      // Products collection
      { collection: 'products', index: { category: 1 } },
      { collection: 'products', index: { brand: 1 } },
      { collection: 'products', index: { price: 1 } },
      { collection: 'products', index: { tags: 1 } },
      { collection: 'products', index: { isActive: 1 } },
      { collection: 'products', index: { createdAt: -1 } },
      { collection: 'products', index: { name: 'text', description: 'text' } },
      { collection: 'products', index: { category: 1, price: 1 } },
      { collection: 'products', index: { brand: 1, category: 1 } },

      // Reviews collection
      { collection: 'reviews', index: { productId: 1 } },
      { collection: 'reviews', index: { userId: 1 } },
      { collection: 'reviews', index: { rating: 1 } },
      { collection: 'reviews', index: { createdAt: -1 } },
      { collection: 'reviews', index: { productId: 1, createdAt: -1 } },

      // Categories collection
      { collection: 'categories', index: { slug: 1 }, options: { unique: true } },
      { collection: 'categories', index: { parentId: 1 } },
      { collection: 'categories', index: { isActive: 1 } },

      // Search logs collection
      { collection: 'searchLogs', index: { query: 1 } },
      { collection: 'searchLogs', index: { userId: 1 } },
      { collection: 'searchLogs', index: { createdAt: -1 } },
      {
        collection: 'searchLogs',
        index: { createdAt: 1 },
        options: { expireAfterSeconds: 2592000 },
      }, // 30 days

      // Analytics collection
      { collection: 'analytics', index: { event: 1 } },
      { collection: 'analytics', index: { userId: 1 } },
      { collection: 'analytics', index: { productId: 1 } },
      { collection: 'analytics', index: { timestamp: -1 } },
      {
        collection: 'analytics',
        index: { timestamp: 1 },
        options: { expireAfterSeconds: 7776000 },
      }, // 90 days
    ];
  }

  /**
   * Generate aggregation pipeline optimizations
   */
  static getOptimizedAggregations(): Record<string, object[]> {
    return {
      // Product search with facets
      productSearch: [
        { $match: { isActive: true } },
        { $addFields: { score: { $meta: 'textScore' } } },
        { $sort: { score: { $meta: 'textScore' }, createdAt: -1 } },
        {
          $facet: {
            products: [{ $limit: 20 }],
            categories: [
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            brands: [{ $group: { _id: '$brand', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
            priceRange: [
              {
                $group: {
                  _id: null,
                  minPrice: { $min: '$price' },
                  maxPrice: { $max: '$price' },
                },
              },
            ],
          },
        },
      ],

      // Popular products
      popularProducts: [
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'analytics',
            localField: '_id',
            foreignField: 'productId',
            as: 'views',
          },
        },
        { $addFields: { viewCount: { $size: '$views' } } },
        { $sort: { viewCount: -1, createdAt: -1 } },
        { $limit: 20 },
        { $project: { views: 0 } },
      ],

      // Category statistics
      categoryStats: [
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            productCount: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
        { $sort: { productCount: -1 } },
      ],
    };
  }
}

// Cache optimization utilities
export class CacheOptimizer {
  private hitCount: number = 0;
  private missCount: number = 0;
  private totalRequests: number = 0;

  /**
   * Track cache hit
   */
  trackHit(): void {
    this.hitCount++;
    this.totalRequests++;
  }

  /**
   * Track cache miss
   */
  trackMiss(): void {
    this.missCount++;
    this.totalRequests++;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    hitCount: number;
    missCount: number;
  } {
    return {
      hitRate: this.totalRequests > 0 ? (this.hitCount / this.totalRequests) * 100 : 0,
      missRate: this.totalRequests > 0 ? (this.missCount / this.totalRequests) * 100 : 0,
      totalRequests: this.totalRequests,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
    this.totalRequests = 0;
  }

  /**
   * Generate cache keys
   */
  static generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key];
          return result;
        },
        {} as Record<string, any>
      );

    const paramString = JSON.stringify(sortedParams);
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(paramString).digest('hex');

    return `${prefix}:${hash}`;
  }

  /**
   * Cache TTL strategies
   */
  static getTTLStrategies(): Record<string, number> {
    return {
      // Short-term cache (5 minutes)
      userSession: 5 * 60,
      cartItems: 5 * 60,

      // Medium-term cache (1 hour)
      productDetails: 60 * 60,
      categoryList: 60 * 60,
      userProfile: 60 * 60,

      // Long-term cache (24 hours)
      staticContent: 24 * 60 * 60,
      siteConfiguration: 24 * 60 * 60,

      // Very long-term cache (7 days)
      productImages: 7 * 24 * 60 * 60,
      staticAssets: 7 * 24 * 60 * 60,
    };
  }
}

// Connection pool optimizer
export class ConnectionPoolOptimizer {
  /**
   * Calculate optimal pool size based on system resources
   */
  static calculateOptimalPoolSize(): {
    min: number;
    max: number;
    idle: number;
    acquire: number;
  } {
    const cpuCount = require('os').cpus().length;
    const memoryGB = require('os').totalmem() / (1024 * 1024 * 1024);

    // Base calculations on CPU and memory
    const basePoolSize = Math.max(2, Math.min(cpuCount * 2, 20));
    const maxPoolSize = Math.max(basePoolSize, Math.min(cpuCount * 4, 50));

    return {
      min: Math.max(2, Math.floor(basePoolSize * 0.5)),
      max: maxPoolSize,
      idle: 30000, // 30 seconds
      acquire: 60000, // 60 seconds
    };
  }

  /**
   * Monitor connection pool health
   */
  static monitorPoolHealth(poolStats: any): void {
    const { size, available, using, waiting } = poolStats;

    const utilizationRate = (using / size) * 100;
    const availabilityRate = (available / size) * 100;

    logger.info('Connection pool stats', {
      size,
      available,
      using,
      waiting,
      utilizationRate: `${utilizationRate.toFixed(2)}%`,
      availabilityRate: `${availabilityRate.toFixed(2)}%`,
    });

    // Alert on high utilization
    if (utilizationRate > 80) {
      logger.warn('High connection pool utilization', {
        utilizationRate: `${utilizationRate.toFixed(2)}%`,
        recommendation: 'Consider increasing pool size',
      });
    }

    // Alert on waiting connections
    if (waiting > 0) {
      logger.warn('Connections waiting for pool', {
        waiting,
        recommendation: 'Check for connection leaks or increase pool size',
      });
    }
  }
}

// Default export
export default {
  DatabaseOptimizer,
  PostgreSQLOptimizer,
  MongoDBOptimizer,
  CacheOptimizer,
  ConnectionPoolOptimizer,
};
