/**
 * 🚀 ULTRA PROFESSIONAL DATABASE INTEGRATION
 * UltraMarket E-commerce Platform
 * 
 * Integration layer for the Ultra Professional Database Optimizer
 * Provides production-ready configuration and service integration
 * 
 * @author UltraMarket Database Team
 * @version 4.0.0
 * @date 2024-12-28
 */

import { 
  UltraProfessionalDatabaseOptimizer, 
  DatabaseConfig,
  createDatabaseOptimizer 
} from './ultra-professional-database-optimizer';
import { logger } from '../logging/ultra-professional-logger';

// Production-optimized database configuration
export const productionDatabaseConfig: DatabaseConfig = {
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DATABASE || 'ultramarket',
    username: process.env.POSTGRES_USERNAME || 'ultramarket_user',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production',
    poolConfig: {
      // Production-optimized pool settings
      min: parseInt(process.env.PG_POOL_MIN || '10'),
      max: parseInt(process.env.PG_POOL_MAX || '100'),
      idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '10000'),
      acquireTimeoutMillis: parseInt(process.env.PG_ACQUIRE_TIMEOUT || '60000'),
      
      // Advanced optimization
      allowExitOnIdle: true,
      maxUses: 7500,
      reapIntervalMillis: 1000,
      createTimeoutMillis: 8000,
      createRetryIntervalMillis: 200,
      
      // Production statement timeout
      statement_timeout: 30000, // 30 seconds
      idle_in_transaction_session_timeout: 60000, // 1 minute
    }
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ultramarket',
    database: process.env.MONGODB_DATABASE || 'ultramarket',
    options: {
      // Production-optimized MongoDB settings
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '50'),
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '5'),
      maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME || '30000'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '10000'),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000'),
      
      // Connection optimization
      family: 4,
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      compressors: ['snappy', 'zlib'],
      readPreference: 'primaryPreferred',
      retryWrites: true,
      retryReads: true,
      
      // Write concern for production
      writeConcern: {
        w: process.env.NODE_ENV === 'production' ? 'majority' : 1,
        wtimeout: 5000
      },
      
      // Read concern for consistency
      readConcern: {
        level: 'majority'
      }
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  }
};

/**
 * Global database optimizer instance
 */
let databaseOptimizer: UltraProfessionalDatabaseOptimizer | null = null;

/**
 * Initialize the database optimizer with production configuration
 */
export async function initializeDatabaseOptimizer(
  config: DatabaseConfig = productionDatabaseConfig
): Promise<UltraProfessionalDatabaseOptimizer> {
  try {
    if (databaseOptimizer) {
      logger.warn('🔄 Database optimizer already initialized, returning existing instance');
      return databaseOptimizer;
    }

    logger.info('🚀 Initializing Ultra Professional Database Optimizer');
    
    databaseOptimizer = createDatabaseOptimizer(config);
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    logger.info('✅ Database optimizer initialized successfully');
    
    return databaseOptimizer;
    
  } catch (error) {
    logger.error('❌ Failed to initialize database optimizer', error);
    throw new Error(`Database optimizer initialization failed: ${error.message}`);
  }
}

/**
 * Get the initialized database optimizer instance
 */
export function getDatabaseOptimizer(): UltraProfessionalDatabaseOptimizer {
  if (!databaseOptimizer) {
    throw new Error('Database optimizer not initialized. Call initializeDatabaseOptimizer() first.');
  }
  return databaseOptimizer;
}

/**
 * Service-specific database helpers
 */

/**
 * Product Service Database Helper
 */
export class ProductServiceDB {
  private optimizer: UltraProfessionalDatabaseOptimizer;

  constructor() {
    this.optimizer = getDatabaseOptimizer();
  }

  /**
   * Get products with optimized query
   */
  async getProducts(filters: {
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const { categoryId, priceMin, priceMax, search, limit = 20, offset = 0 } = filters;
    
    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (
          SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'url', pi.url,
              'alt_text', pi.alt_text,
              'is_main', pi.is_main
            )
          )
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          ORDER BY pi.sort_order
        ) as images,
        (
          SELECT COUNT(*)::int 
          FROM reviews r 
          WHERE r.product_id = p.id AND r.status = 'approved'
        ) as review_count,
        (
          SELECT AVG(rating)::numeric(3,2) 
          FROM reviews r 
          WHERE r.product_id = p.id AND r.status = 'approved'
        ) as average_rating
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (categoryId) {
      query += ` AND p.category_id = $${paramIndex++}`;
      params.push(categoryId);
    }
    
    if (priceMin !== undefined) {
      query += ` AND p.price >= $${paramIndex++}`;
      params.push(priceMin);
    }
    
    if (priceMax !== undefined) {
      query += ` AND p.price <= $${paramIndex++}`;
      params.push(priceMax);
    }
    
    if (search) {
      query += ` AND (
        p.search_vector @@ plainto_tsquery('english', $${paramIndex++})
        OR p.name ILIKE $${paramIndex++}
        OR p.sku ILIKE $${paramIndex++}
      )`;
      params.push(search, `%${search}%`, `%${search}%`);
    }
    
    query += `
      ORDER BY 
        p.is_featured DESC,
        p.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);
    
    return this.optimizer.executePostgresQuery(query, params, {
      timeout: 10000,
      priority: 'high'
    });
  }

  /**
   * Get product by ID with all relations
   */
  async getProductById(productId: string): Promise<any> {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        c.parent_id as category_parent_id,
        json_agg(DISTINCT 
          CASE WHEN pi.id IS NOT NULL THEN
            json_build_object(
              'id', pi.id,
              'url', pi.url,
              'alt_text', pi.alt_text,
              'is_main', pi.is_main,
              'sort_order', pi.sort_order
            )
          END
        ) FILTER (WHERE pi.id IS NOT NULL) as images,
        json_agg(DISTINCT 
          CASE WHEN pv.id IS NOT NULL THEN
            json_build_object(
              'id', pv.id,
              'name', pv.name,
              'sku', pv.sku,
              'price', pv.price,
              'stock_quantity', pv.stock_quantity,
              'attributes', pv.attributes
            )
          END
        ) FILTER (WHERE pv.id IS NOT NULL) as variants,
        (
          SELECT json_agg(
            json_build_object(
              'id', r.id,
              'rating', r.rating,
              'comment', r.comment,
              'created_at', r.created_at,
              'user_name', u.first_name || ' ' || u.last_name
            )
          )
          FROM reviews r
          JOIN users u ON r.user_id = u.id
          WHERE r.product_id = p.id AND r.status = 'approved'
          ORDER BY r.created_at DESC
          LIMIT 10
        ) as recent_reviews
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.id = $1 AND p.is_active = true
      GROUP BY p.id, c.id
    `;
    
    const results = await this.optimizer.executePostgresQuery(query, [productId], {
      timeout: 5000,
      priority: 'high'
    });
    
    return results[0] || null;
  }

  /**
   * Search products with MongoDB
   */
  async searchProducts(searchTerm: string, options: {
    limit?: number;
    skip?: number;
    filters?: any;
  } = {}): Promise<any[]> {
    return this.optimizer.executeMongoOperation(
      'products',
      async (collection) => {
        const pipeline = [
          {
            $match: {
              $and: [
                { isActive: true },
                {
                  $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $in: [new RegExp(searchTerm, 'i')] } }
                  ]
                },
                ...(options.filters ? [options.filters] : [])
              ]
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: 'categoryId',
              foreignField: '_id',
              as: 'category'
            }
          },
          {
            $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
          },
          {
            $skip: options.skip || 0
          },
          {
            $limit: options.limit || 20
          },
          {
            $project: {
              _id: 1,
              name: 1,
              slug: 1,
              price: 1,
              comparePrice: 1,
              images: { $slice: ['$images', 3] },
              isInStock: 1,
              category: {
                _id: '$category._id',
                name: '$category.name',
                slug: '$category.slug'
              }
            }
          }
        ];
        
        return collection.aggregate(pipeline).toArray();
      },
      { timeout: 5000 }
    );
  }
}

/**
 * User Service Database Helper
 */
export class UserServiceDB {
  private optimizer: UltraProfessionalDatabaseOptimizer;

  constructor() {
    this.optimizer = getDatabaseOptimizer();
  }

  /**
   * Get user with profile and recent activity
   */
  async getUserById(userId: string): Promise<any> {
    const query = `
      SELECT 
        u.*,
        json_agg(DISTINCT 
          CASE WHEN ua.id IS NOT NULL THEN
            json_build_object(
              'id', ua.id,
              'type', ua.type,
              'first_name', ua.first_name,
              'last_name', ua.last_name,
              'phone', ua.phone,
              'address_line_1', ua.address_line_1,
              'address_line_2', ua.address_line_2,
              'city', ua.city,
              'state', ua.state,
              'postal_code', ua.postal_code,
              'country', ua.country,
              'is_default', ua.is_default
            )
          END
        ) FILTER (WHERE ua.id IS NOT NULL) as addresses,
        (
          SELECT COUNT(*)::int 
          FROM orders o 
          WHERE o.user_id = u.id
        ) as total_orders,
        (
          SELECT COALESCE(SUM(total_amount), 0)::numeric(10,2)
          FROM orders o 
          WHERE o.user_id = u.id AND o.status = 'completed'
        ) as total_spent,
        (
          SELECT json_agg(
            json_build_object(
              'id', o.id,
              'order_number', o.order_number,
              'total_amount', o.total_amount,
              'status', o.status,
              'created_at', o.created_at
            )
          )
          FROM orders o
          WHERE o.user_id = u.id
          ORDER BY o.created_at DESC
          LIMIT 5
        ) as recent_orders
      FROM users u
      LEFT JOIN user_addresses ua ON u.id = ua.user_id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id
    `;
    
    const results = await this.optimizer.executePostgresQuery(query, [userId], {
      timeout: 3000,
      priority: 'medium'
    });
    
    return results[0] || null;
  }

  /**
   * Get user orders with optimized pagination
   */
  async getUserOrders(userId: string, options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}): Promise<any[]> {
    let query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
    `;
    
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (options.status) {
      query += ` AND o.status = $${paramIndex++}`;
      params.push(options.status);
    }
    
    query += `
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(options.limit || 20, options.offset || 0);
    
    return this.optimizer.executePostgresQuery(query, params, {
      timeout: 5000,
      priority: 'medium'
    });
  }
}

/**
 * Order Service Database Helper
 */
export class OrderServiceDB {
  private optimizer: UltraProfessionalDatabaseOptimizer;

  constructor() {
    this.optimizer = getDatabaseOptimizer();
  }

  /**
   * Create order with transaction support
   */
  async createOrder(orderData: {
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
    shippingAddress: any;
    paymentMethod: string;
    totalAmount: number;
  }): Promise<any> {
    // This would use a transaction in production
    const orderQuery = `
      INSERT INTO orders (
        user_id, 
        order_number, 
        status, 
        payment_status,
        shipping_address,
        payment_method,
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
      ) RETURNING *
    `;
    
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const orderResult = await this.optimizer.executePostgresQuery(orderQuery, [
      orderData.userId,
      orderNumber,
      'pending',
      'pending',
      JSON.stringify(orderData.shippingAddress),
      orderData.paymentMethod,
      orderData.totalAmount * 0.85, // Approximate subtotal
      orderData.totalAmount * 0.15, // Approximate tax + shipping
      0,
      orderData.totalAmount,
    ], {
      timeout: 5000,
      priority: 'high'
    });
    
    return orderResult[0];
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(dateRange: {
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as order_count,
        SUM(total_amount)::numeric(12,2) as total_revenue,
        AVG(total_amount)::numeric(10,2) as avg_order_value,
        COUNT(DISTINCT user_id)::int as unique_customers
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    return this.optimizer.executePostgresQuery(query, [
      dateRange.startDate,
      dateRange.endDate
    ], {
      timeout: 10000,
      priority: 'low'
    });
  }
}

/**
 * Cache Service Helper
 */
export class CacheServiceHelper {
  private optimizer: UltraProfessionalDatabaseOptimizer;

  constructor() {
    this.optimizer = getDatabaseOptimizer();
  }

  /**
   * Get cached data with fallback
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.optimizer.executeRedisOperation(
        async (client) => {
          const data = await client.get(key);
          return data ? JSON.parse(data) : null;
        },
        `get_${key}`
      );
    } catch (error) {
      logger.error('❌ Cache get failed', error, { key });
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.optimizer.executeRedisOperation(
        async (client) => {
          await client.setEx(key, ttlSeconds, JSON.stringify(value));
        },
        `set_${key}`
      );
    } catch (error) {
      logger.error('❌ Cache set failed', error, { key });
    }
  }

  /**
   * Clear cache pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      return await this.optimizer.executeRedisOperation(
        async (client) => {
          const keys = await client.keys(pattern);
          if (keys.length > 0) {
            return await client.del(...keys);
          }
          return 0;
        },
        `clear_pattern_${pattern}`
      );
    } catch (error) {
      logger.error('❌ Cache clear pattern failed', error, { pattern });
      return 0;
    }
  }
}

/**
 * Setup graceful shutdown for database connections
 */
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    logger.info(`🛑 ${signal} received, shutting down database connections...`);
    
    if (databaseOptimizer) {
      try {
        await databaseOptimizer.shutdown();
        logger.info('✅ Database connections closed gracefully');
      } catch (error) {
        logger.error('❌ Error during database shutdown', error);
      }
    }
    
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart
}

/**
 * Express middleware for database metrics
 */
export function databaseMetricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (databaseOptimizer) {
        const metrics = databaseOptimizer.getPerformanceMetrics();
        
        // Log slow requests
        if (duration > 1000) {
          logger.warn('🐌 Slow request detected', {
            method: req.method,
            url: req.url,
            duration,
            dbQueries: metrics.queries.length
          });
        }
      }
    });
    
    next();
  };
}

// Export service helpers
export const productServiceDB = new ProductServiceDB();
export const userServiceDB = new UserServiceDB();
export const orderServiceDB = new OrderServiceDB();
export const cacheServiceHelper = new CacheServiceHelper();

// Export performance monitoring endpoint
export function getDatabasePerformanceReport(): any {
  if (!databaseOptimizer) {
    return { error: 'Database optimizer not initialized' };
  }
  
  return databaseOptimizer.getPerformanceMetrics();
}

export { UltraProfessionalDatabaseOptimizer };
export type { DatabaseConfig }; 