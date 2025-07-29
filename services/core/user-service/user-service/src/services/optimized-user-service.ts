/**
 * Optimized User Service with N+1 Query Elimination
 * 
 * Professional implementation that eliminates N+1 query problems in User service
 * using advanced batching, DataLoader patterns, and query optimization techniques.
 * 
 * Key Performance Optimizations:
 * - N+1 query elimination for user addresses, orders, and statistics
 * - Batch loading of related entities using DataLoader pattern
 * - Smart query optimization based on usage patterns
 * - Parallel execution for multiple relationships
 * - Performance monitoring and metrics
 * - Memory-efficient caching with TTL
 * 
 * @author UltraMarket Performance Team
 * @version 1.0.0
 */

import { performance } from 'perf_hooks';

// Database client interface (generic for any ORM)
interface DatabaseClient {
  user: {
    findMany: (args: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
  address: {
    findMany: (args: any) => Promise<any[]>;
  };
  order: {
    findMany: (args: any) => Promise<any[]>;
    count: (args: any) => Promise<number>;
  };
  session: {
    findMany: (args: any) => Promise<any[]>;
  };
  $queryRaw: (query: any, ...params: any[]) => Promise<any[]>;
  $disconnect: () => Promise<void>;
}

// Simple logger implementation
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data || '')
};

// Enhanced User interface
interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  // Optimized relationship properties
  addresses?: any[];
  orders?: any[];
  orderStats?: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: Date;
  };
  sessions?: any[];
  recentActivity?: any[];
}

// DataLoader implementation for batch operations
class UserDataLoader<K extends string, V> {
  private cache = new Map<K, Promise<V>>();
  private batchQueue: K[] = [];
  private batchPromise: Promise<(V | Error)[]> | null = null;
  private batchSize: number;
  private cacheTimeout: number;

  constructor(
    private batchLoadFn: (keys: K[]) => Promise<(V | Error)[]>,
    options: { 
      batchSize?: number; 
      cacheTimeout?: number;
    } = {}
  ) {
    this.batchSize = options.batchSize || 100;
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes default
  }

  async load(key: K): Promise<V> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const promise = this.loadInternal(key);
    this.cache.set(key, promise);

    // Auto-expire cache entries
    setTimeout(() => {
      this.cache.delete(key);
    }, this.cacheTimeout);

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
          const batch = this.batchQueue.slice(0, this.batchSize);
          this.batchQueue = this.batchQueue.slice(this.batchSize);
          this.batchPromise = null;

          try {
            const results = await this.batchLoadFn(batch);
            resolve(results);
          } catch (error) {
            logger.error('UserDataLoader batch execution failed', {
              error: error.message,
              batchSize: batch.length
            });
            resolve(batch.map(() => error));
          }
        });
      });
    }

    const results = await this.batchPromise;
    const index = this.batchQueue.length < this.batchSize 
      ? this.batchQueue.indexOf(key) 
      : Math.min(this.batchQueue.indexOf(key), this.batchSize - 1);
    
    const result = results[index];

    if (result instanceof Error) {
      throw result;
    }

    return result as V;
  }

  clear(): void {
    this.cache.clear();
  }

  clearKey(key: K): void {
    this.cache.delete(key);
  }
}

// Enhanced user query options
interface OptimizedUserQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: {
    role?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    search?: string;
    createdAfter?: Date;
    createdBefore?: Date;
  };
  includes?: string[];
  optimizations?: {
    enableN1Elimination?: boolean;
    enableBatchLoading?: boolean;
    enableParallelExecution?: boolean;
    enableStatisticsOptimization?: boolean;
  };
}

// Performance metrics for monitoring
interface UserPerformanceMetrics {
  totalQueries: number;
  executionTime: number;
  cacheHitRatio: number;
  optimizationsApplied: string[];
  queryComplexity: number;
  usersProcessed: number;
}

export class OptimizedUserService {
  private db: DatabaseClient;
  private addressLoader: UserDataLoader<string, any[]>;
  private orderLoader: UserDataLoader<string, any[]>;
  private orderStatsLoader: UserDataLoader<string, any>;
  private sessionLoader: UserDataLoader<string, any[]>;
  private performanceMetrics: UserPerformanceMetrics[] = [];
  private cacheStats = {
    hits: 0,
    misses: 0
  };

  constructor(databaseClient: DatabaseClient) {
    this.db = databaseClient;
    this.initializeDataLoaders();
  }

  /**
   * Initialize DataLoaders for batch operations
   */
  private initializeDataLoaders(): void {
    // User Addresses DataLoader
    this.addressLoader = new UserDataLoader(
      async (userIds: string[]) => {
        const addresses = await this.db.address.findMany({
          where: { 
            userId: { in: userIds },
            isActive: true 
          },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        });

        return userIds.map(userId => 
          addresses.filter(addr => addr.userId === userId)
        );
      },
      { batchSize: 50, cacheTimeout: 600000 } // 10 minutes for addresses
    );

    // User Orders DataLoader
    this.orderLoader = new UserDataLoader(
      async (userIds: string[]) => {
        const orders = await this.db.order.findMany({
          where: { userId: { in: userIds } },
          orderBy: { createdAt: 'desc' },
          take: 10 * userIds.length // Latest 10 orders per user
        });

        return userIds.map(userId => 
          orders.filter(order => order.userId === userId).slice(0, 10)
        );
      },
      { batchSize: 50, cacheTimeout: 300000 } // 5 minutes for orders
    );

    // User Order Statistics DataLoader
    this.orderStatsLoader = new UserDataLoader(
      async (userIds: string[]) => {
        // Use raw SQL for better performance on aggregations
        const stats = await this.db.$queryRaw`
          SELECT 
            user_id as "userId",
            COUNT(*)::int as "totalOrders",
            COALESCE(SUM(total_amount), 0)::numeric as "totalSpent",
            MAX(created_at) as "lastOrderDate"
          FROM orders 
          WHERE user_id = ANY(${userIds}) AND status = 'completed'
          GROUP BY user_id
        `;

        return userIds.map(userId => {
          const userStats = stats.find((s: any) => s.userId === userId);
          return userStats || {
            userId,
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null
          };
        });
      },
      { batchSize: 100, cacheTimeout: 900000 } // 15 minutes for stats
    );

    // User Sessions DataLoader
    this.sessionLoader = new UserDataLoader(
      async (userIds: string[]) => {
        const sessions = await this.db.session.findMany({
          where: { 
            userId: { in: userIds },
            isActive: true 
          },
          orderBy: { createdAt: 'desc' },
          take: 5 * userIds.length // Latest 5 sessions per user
        });

        return userIds.map(userId => 
          sessions.filter(session => session.userId === userId).slice(0, 5)
        );
      },
      { batchSize: 50, cacheTimeout: 300000 } // 5 minutes for sessions
    );
  }

  /**
   * Get users with comprehensive N+1 optimization
   */
  async getUsers(options: OptimizedUserQueryOptions = {}): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    performance: UserPerformanceMetrics;
  }> {
    const startTime = performance.now();
    const queryId = `users_query_${Date.now()}`;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
      includes = ['addresses', 'orderStats'],
      optimizations = {
        enableN1Elimination: true,
        enableBatchLoading: true,
        enableParallelExecution: true,
        enableStatisticsOptimization: true
      }
    } = options;

    try {
      logger.info('Starting optimized user query', {
        queryId,
        page,
        limit,
        filtersCount: Object.keys(filters).length,
        includes,
        optimizations
      });

      // Step 1: Build optimized where clause
      const where = this.buildOptimizedWhereClause(filters);

      // Step 2: Get user IDs with pagination (minimal data first)
      const [userResults, total] = await Promise.all([
        this.db.user.findMany({
          where,
          select: { id: true },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.user.count({ where })
      ]);

      const userIds = userResults.map(u => u.id);

      if (userIds.length === 0) {
        const executionTime = performance.now() - startTime;
        return {
          users: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          performance: {
            totalQueries: 2,
            executionTime,
            cacheHitRatio: 0,
            optimizationsApplied: ['early_exit'],
            queryComplexity: 1,
            usersProcessed: 0
          }
        };
      }

      // Step 3: Load users with optimized relationships
      let users: User[];
      let appliedOptimizations: string[] = [];

      if (optimizations.enableN1Elimination && userIds.length > 3) {
        users = await this.loadUsersWithN1Elimination(userIds, includes, optimizations);
        appliedOptimizations.push('n1_elimination', 'batch_loading');
      } else {
        users = await this.loadUsersTraditional(userIds, includes);
        appliedOptimizations.push('traditional_loading');
      }

      // Step 4: Apply parallel enhancements if needed
      if (optimizations.enableParallelExecution && includes.includes('recentActivity')) {
        users = await this.enhanceUsersWithRecentActivity(users);
        appliedOptimizations.push('parallel_enhancement');
      }

      const executionTime = performance.now() - startTime;
      const totalPages = Math.ceil(total / limit);

      // Calculate cache hit ratio
      const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses;
      const cacheHitRatio = totalCacheRequests > 0 
        ? this.cacheStats.hits / totalCacheRequests 
        : 0;

      // Record performance metrics
      const performanceData: UserPerformanceMetrics = {
        totalQueries: this.calculateQueryCount(includes, optimizations),
        executionTime,
        cacheHitRatio,
        optimizationsApplied: appliedOptimizations,
        queryComplexity: this.calculateQueryComplexity(filters, includes),
        usersProcessed: users.length
      };

      this.recordPerformanceMetrics(performanceData);

      logger.info('Optimized user query completed', {
        queryId,
        userCount: users.length,
        total,
        executionTime: `${executionTime.toFixed(2)}ms`,
        optimizations: appliedOptimizations,
        cacheHitRatio: cacheHitRatio.toFixed(3)
      });

      return {
        users,
        total,
        page,
        limit,
        totalPages,
        performance: performanceData
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      logger.error('Optimized user query failed', {
        queryId,
        error: error.message,
        executionTime: `${executionTime.toFixed(2)}ms`
      });

      throw error;
    }
  }

  /**
   * Get single user with optimized loading
   */
  async getUserById(
    userId: string,
    options: {
      includes?: string[];
      enableOptimizations?: boolean;
    } = {}
  ): Promise<User | null> {
    const startTime = performance.now();
    const { 
      includes = ['addresses', 'orderStats', 'sessions'], 
      enableOptimizations = true 
    } = options;

    try {
      if (enableOptimizations) {
        const users = await this.loadUsersWithN1Elimination([userId], includes, {
          enableN1Elimination: true,
          enableBatchLoading: true,
          enableParallelExecution: true,
          enableStatisticsOptimization: true
        });
        
        const user = users[0] || null;
        const executionTime = performance.now() - startTime;
        
        logger.info('Optimized single user loaded', {
          userId,
          found: !!user,
          executionTime: `${executionTime.toFixed(2)}ms`,
          includes,
          optimization: 'n1_elimination'
        });

        return user;
      } else {
        return this.loadSingleUserTraditional(userId, includes);
      }
    } catch (error) {
      logger.error('Failed to load optimized user', {
        userId,
        error: error.message,
        includes
      });
      throw error;
    }
  }

  /**
   * Load users with N+1 elimination using DataLoaders
   */
  private async loadUsersWithN1Elimination(
    userIds: string[], 
    includes: string[],
    optimizations: any
  ): Promise<User[]> {
    const startTime = performance.now();

    // Load base users
    const users = await this.db.user.findMany({
      where: { id: { in: userIds } },
      orderBy: { createdAt: 'desc' }
    });

    // Parallel loading of relationships using DataLoaders
    const relationshipPromises: Promise<any>[] = [];

    if (includes.includes('addresses')) {
      relationshipPromises.push(
        Promise.all(users.map(u => this.addressLoader.load(u.id)))
      );
    } else {
      relationshipPromises.push(Promise.resolve([]));
    }

    if (includes.includes('orders')) {
      relationshipPromises.push(
        Promise.all(users.map(u => this.orderLoader.load(u.id)))
      );
    } else {
      relationshipPromises.push(Promise.resolve([]));
    }

    if (includes.includes('orderStats')) {
      relationshipPromises.push(
        Promise.all(users.map(u => this.orderStatsLoader.load(u.id)))
      );
    } else {
      relationshipPromises.push(Promise.resolve([]));
    }

    if (includes.includes('sessions')) {
      relationshipPromises.push(
        Promise.all(users.map(u => this.sessionLoader.load(u.id)))
      );
    } else {
      relationshipPromises.push(Promise.resolve([]));
    }

    // Wait for all relationships to load
    const [addresses, orders, orderStats, sessions] = await Promise.all(relationshipPromises);

    // Combine results
    const enhancedUsers = users.map((user, index) => {
      const enhanced = { ...user };

      if (includes.includes('addresses') && addresses[index]) {
        enhanced.addresses = addresses[index];
      }

      if (includes.includes('orders') && orders[index]) {
        enhanced.orders = orders[index];
      }

      if (includes.includes('orderStats') && orderStats[index]) {
        enhanced.orderStats = orderStats[index];
      }

      if (includes.includes('sessions') && sessions[index]) {
        enhanced.sessions = sessions[index];
      }

      return enhanced;
    });

    const executionTime = performance.now() - startTime;
    logger.debug('N+1 elimination completed for users', {
      userCount: users.length,
      includes,
      executionTime: `${executionTime.toFixed(2)}ms`
    });

    return enhancedUsers;
  }

  /**
   * Traditional user loading (fallback)
   */
  private async loadUsersTraditional(userIds: string[], includes: string[]): Promise<User[]> {
    const includeConfig: any = {};
    
    if (includes.includes('addresses')) {
      includeConfig.addresses = {
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
      };
    }
    
    if (includes.includes('orders')) {
      includeConfig.orders = {
        take: 10,
        orderBy: { createdAt: 'desc' }
      };
    }
    
    if (includes.includes('sessions')) {
      includeConfig.sessions = {
        where: { isActive: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      };
    }

    return this.db.user.findMany({
      where: { id: { in: userIds } },
      include: includeConfig,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Load single user with traditional approach
   */
  private async loadSingleUserTraditional(userId: string, includes: string[]): Promise<User | null> {
    const includeConfig: any = {};
    
    if (includes.includes('addresses')) {
      includeConfig.addresses = {
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
      };
    }
    
    if (includes.includes('orders')) {
      includeConfig.orders = {
        take: 10,
        orderBy: { createdAt: 'desc' }
      };
    }
    
    if (includes.includes('sessions')) {
      includeConfig.sessions = {
        where: { isActive: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      };
    }

    return this.db.user.findUnique({
      where: { id: userId },
      include: includeConfig
    });
  }

  /**
   * Enhance users with recent activity data
   */
  private async enhanceUsersWithRecentActivity(users: User[]): Promise<User[]> {
    const userIds = users.map(u => u.id);

    // Load recent activity in parallel (orders, sessions, etc.)
    const recentActivity = await this.db.$queryRaw`
      SELECT 
        user_id as "userId",
        'order' as "type",
        id,
        created_at as "timestamp",
        total_amount as "amount",
        status
      FROM orders 
      WHERE user_id = ANY(${userIds}) 
        AND created_at > NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        user_id as "userId",
        'session' as "type",
        id,
        created_at as "timestamp",
        NULL as "amount",
        'active' as "status"
      FROM sessions 
      WHERE user_id = ANY(${userIds}) 
        AND created_at > NOW() - INTERVAL '7 days'
      
      ORDER BY "timestamp" DESC
      LIMIT 50
    `;

    // Map activity to users
    return users.map(user => {
      const enhanced = { ...user };
      enhanced.recentActivity = recentActivity
        .filter((activity: any) => activity.userId === user.id)
        .slice(0, 10);
      return enhanced;
    });
  }

  /**
   * Build optimized where clause
   */
  private buildOptimizedWhereClause(filters: any): any {
    const where: any = {};

    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.isEmailVerified !== undefined) where.isEmailVerified = filters.isEmailVerified;

    // Date range optimization
    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
      if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
    }

    // Search optimization
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return where;
  }

  /**
   * Calculate query count for performance monitoring
   */
  private calculateQueryCount(includes: string[], optimizations: any): number {
    let baseQueries = 2; // user list + count

    if (!optimizations.enableN1Elimination) {
      baseQueries += includes.length * 8; // Approximate N+1 queries
    } else {
      baseQueries += includes.length; // Batch queries
    }

    if (optimizations.enableStatisticsOptimization) {
      baseQueries += 1; // Additional stats query
    }

    return baseQueries;
  }

  /**
   * Calculate query complexity score
   */
  private calculateQueryComplexity(filters: any, includes: string[]): number {
    let complexity = 1;
    complexity += Object.keys(filters).length * 0.5;
    complexity += includes.length;
    
    if (filters.search) complexity += 2;
    if (filters.createdAfter || filters.createdBefore) complexity += 1;
    if (includes.includes('orderStats')) complexity += 2; // Stats queries are more complex

    return complexity;
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(metrics: UserPerformanceMetrics): void {
    this.performanceMetrics.push(metrics);

    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }

    if (metrics.executionTime > 1000) {
      logger.warn('Slow user query detected', {
        executionTime: `${metrics.executionTime.toFixed(2)}ms`,
        totalQueries: metrics.totalQueries,
        usersProcessed: metrics.usersProcessed,
        optimizations: metrics.optimizationsApplied
      });
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    averageExecutionTime: number;
    totalQueries: number;
    averageQueryComplexity: number;
    averageCacheHitRatio: number;
    totalUsersProcessed: number;
    mostUsedOptimizations: string[];
    recommendations: string[];
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageExecutionTime: 0,
        totalQueries: 0,
        averageQueryComplexity: 0,
        averageCacheHitRatio: 0,
        totalUsersProcessed: 0,
        mostUsedOptimizations: [],
        recommendations: ['No data available yet']
      };
    }

    const avgExecutionTime = this.performanceMetrics.reduce((sum, m) => sum + m.executionTime, 0) / this.performanceMetrics.length;
    const totalQueries = this.performanceMetrics.reduce((sum, m) => sum + m.totalQueries, 0);
    const avgComplexity = this.performanceMetrics.reduce((sum, m) => sum + m.queryComplexity, 0) / this.performanceMetrics.length;
    const avgCacheHitRatio = this.performanceMetrics.reduce((sum, m) => sum + m.cacheHitRatio, 0) / this.performanceMetrics.length;
    const totalUsersProcessed = this.performanceMetrics.reduce((sum, m) => sum + m.usersProcessed, 0);

    const optimizationCounts = new Map<string, number>();
    this.performanceMetrics.forEach(m => {
      m.optimizationsApplied.forEach(opt => {
        optimizationCounts.set(opt, (optimizationCounts.get(opt) || 0) + 1);
      });
    });

    const mostUsedOptimizations = Array.from(optimizationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([opt]) => opt);

    const recommendations: string[] = [];
    if (avgExecutionTime > 800) {
      recommendations.push('Consider enabling more aggressive user data caching');
    }
    if (avgCacheHitRatio < 0.7) {
      recommendations.push('Optimize user data cache strategy');
    }
    if (avgComplexity > 6) {
      recommendations.push('Simplify user query patterns where possible');
    }
    if (totalQueries > this.performanceMetrics.length * 10) {
      recommendations.push('Enable N+1 elimination for all user queries');
    }

    return {
      averageExecutionTime: avgExecutionTime,
      totalQueries,
      averageQueryComplexity: avgComplexity,
      averageCacheHitRatio: avgCacheHitRatio,
      totalUsersProcessed,
      mostUsedOptimizations,
      recommendations
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.addressLoader.clear();
    this.orderLoader.clear();
    this.orderStatsLoader.clear();
    this.sessionLoader.clear();
    
    // Reset cache stats
    this.cacheStats = { hits: 0, misses: 0 };
    
    logger.info('User service caches cleared');
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userId: string): void {
    this.addressLoader.clearKey(userId);
    this.orderLoader.clearKey(userId);
    this.orderStatsLoader.clearKey(userId);
    this.sessionLoader.clearKey(userId);
    
    logger.debug('User cache cleared', { userId });
  }

  /**
   * Warm up cache for frequently accessed users
   */
  async warmUpCache(userIds: string[]): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Pre-load common user data
      await Promise.all([
        this.addressLoader.loadMany(userIds),
        this.orderStatsLoader.loadMany(userIds)
      ]);
      
      const executionTime = performance.now() - startTime;
      logger.info('User cache warmed up', {
        userCount: userIds.length,
        executionTime: `${executionTime.toFixed(2)}ms`
      });
    } catch (error) {
      logger.error('Failed to warm up user cache', {
        error: error.message,
        userIds: userIds.slice(0, 5) // Log first 5 IDs only
      });
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.clearCaches();
    await this.db.$disconnect();
    logger.info('Optimized User Service shutdown completed');
  }
}

export default OptimizedUserService; 