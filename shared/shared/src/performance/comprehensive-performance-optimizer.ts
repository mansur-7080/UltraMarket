/**
 * ⚡ COMPREHENSIVE PERFORMANCE OPTIMIZER - UltraMarket
 * 
 * Advanced caching, query optimization, resource management
 * Complete performance monitoring va optimization system
 * 
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import NodeCache from 'node-cache';
import { createClient, RedisClientType } from 'redis';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { logger } from '../logging/professional-logger';

// Performance interfaces
export interface CacheOptions {
  ttl?: number; // seconds
  checkPeriod?: number; // seconds
  useClones?: boolean;
  deleteOnExpire?: boolean;
  enableLegacyCallbacks?: boolean;
  maxKeys?: number;
  maxMemoryPolicy?: 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu';
}

export interface PerformanceMetrics {
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    hits: number;
    misses: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  database: {
    activeConnections: number;
    slowQueries: number;
    averageQueryTime: number;
  };
  requests: {
    total: number;
    perSecond: number;
    errors: number;
    errorRate: number;
  };
}

export interface CompressionOptions {
  threshold: number;
  level: number;
  filter: (req: Request, res: Response) => boolean;
}

export interface QueryOptimizationOptions {
  enablePagination?: boolean;
  defaultLimit?: number;
  maxLimit?: number;
  enableSelect?: boolean;
  enableInclude?: boolean;
  maxIncludes?: number;
  enableBatching?: boolean;
  batchSize?: number;
}

/**
 * Multi-layer caching system
 */
export class MultiLayerCache {
  private memoryCache: NodeCache;
  private redisCache: RedisClientType | null = null;
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  
  constructor(
    options: CacheOptions = {},
    redisUrl?: string
  ) {
    // Memory cache (L1)
    this.memoryCache = new NodeCache({
      stdTTL: options.ttl || 300, // 5 minutes default
      checkperiod: options.checkPeriod || 120, // 2 minutes
      useClones: options.useClones || false,
      deleteOnExpire: options.deleteOnExpire || true,
      enableLegacyCallbacks: options.enableLegacyCallbacks || false,
      maxKeys: options.maxKeys || 1000
    });
    
    // Initialize Redis cache (L2) if URL provided
    if (redisUrl) {
      this.initializeRedisCache(redisUrl);
    }
    
    // Cache event listeners
    this.memoryCache.on('set', (key: string, value: any) => {
      this.cacheStats.sets++;
      logger.debug('🎯 Memory cache set', { key: this.sanitizeKey(key) });
    });
    
    this.memoryCache.on('del', (key: string, value: any) => {
      this.cacheStats.deletes++;
      logger.debug('🗑️ Memory cache delete', { key: this.sanitizeKey(key) });
    });
    
    this.memoryCache.on('expired', (key: string, value: any) => {
      logger.debug('⏰ Memory cache expired', { key: this.sanitizeKey(key) });
    });
  }
  
  private async initializeRedisCache(redisUrl: string): Promise<void> {
    try {
      this.redisCache = createClient({ url: redisUrl });
      
      this.redisCache.on('error', (error) => {
        logger.error('❌ Redis cache error', error);
      });
      
      this.redisCache.on('connect', () => {
        logger.info('✅ Redis cache connected');
      });
      
      await this.redisCache.connect();
      
    } catch (error) {
      logger.error('❌ Failed to initialize Redis cache', error);
      this.redisCache = null;
    }
  }
  
  /**
   * Get value from cache (L1 first, then L2)
   */
  async get<T>(key: string): Promise<T | null> {
    const sanitizedKey = this.sanitizeKey(key);
    
    try {
      // Try L1 cache first
      const memoryValue = this.memoryCache.get<T>(sanitizedKey);
      if (memoryValue !== undefined) {
        this.cacheStats.hits++;
        logger.debug('🎯 L1 cache hit', { key: sanitizedKey });
        return memoryValue;
      }
      
      // Try L2 cache (Redis)
      if (this.redisCache) {
        const redisValue = await this.redisCache.get(sanitizedKey);
        if (redisValue) {
          const parsedValue = JSON.parse(redisValue) as T;
          // Store in L1 for faster access
          this.memoryCache.set(sanitizedKey, parsedValue);
          this.cacheStats.hits++;
          logger.debug('🎯 L2 cache hit', { key: sanitizedKey });
          return parsedValue;
        }
      }
      
      this.cacheStats.misses++;
      logger.debug('❌ Cache miss', { key: sanitizedKey });
      return null;
      
    } catch (error) {
      logger.error('❌ Cache get error', error, { key: sanitizedKey });
      this.cacheStats.misses++;
      return null;
    }
  }
  
  /**
   * Set value in both cache layers
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const sanitizedKey = this.sanitizeKey(key);
    
    try {
      // Set in L1 cache
      const memorySuccess = this.memoryCache.set(sanitizedKey, value, ttl || 300);
      
      // Set in L2 cache (Redis)
      let redisSuccess = true;
      if (this.redisCache) {
        try {
          await this.redisCache.setEx(sanitizedKey, ttl || 300, JSON.stringify(value));
        } catch (error) {
          logger.warn('⚠️ Redis cache set failed', { key: sanitizedKey, error });
          redisSuccess = false;
        }
      }
      
      if (memorySuccess) {
        logger.debug('✅ Cache set successful', { key: sanitizedKey, l1: memorySuccess, l2: redisSuccess });
      }
      
      return memorySuccess;
      
    } catch (error) {
      logger.error('❌ Cache set error', error, { key: sanitizedKey });
      return false;
    }
  }
  
  /**
   * Delete from both cache layers
   */
  async delete(key: string): Promise<boolean> {
    const sanitizedKey = this.sanitizeKey(key);
    
    try {
      // Delete from L1
      const memoryDeleted = this.memoryCache.del(sanitizedKey);
      
      // Delete from L2
      let redisDeleted = 0;
      if (this.redisCache) {
        try {
          redisDeleted = await this.redisCache.del(sanitizedKey);
        } catch (error) {
          logger.warn('⚠️ Redis cache delete failed', { key: sanitizedKey, error });
        }
      }
      
      logger.debug('🗑️ Cache delete', { 
        key: sanitizedKey, 
        l1Deleted: memoryDeleted, 
        l2Deleted: redisDeleted 
      });
      
      return memoryDeleted > 0 || redisDeleted > 0;
      
    } catch (error) {
      logger.error('❌ Cache delete error', error, { key: sanitizedKey });
      return false;
    }
  }
  
  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    try {
      // Clear L1
      this.memoryCache.flushAll();
      
      // Clear L2
      if (this.redisCache) {
        await this.redisCache.flushAll();
      }
      
      // Reset stats
      this.cacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
      
      logger.info('🗑️ All caches cleared');
      
    } catch (error) {
      logger.error('❌ Cache clear error', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): typeof this.cacheStats & { hitRate: number; keys: number } {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
    
    return {
      ...this.cacheStats,
      hitRate: Number(hitRate.toFixed(2)),
      keys: this.memoryCache.keys().length
    };
  }
  
  private sanitizeKey(key: string): string {
    // Remove potentially problematic characters
    return key.replace(/[^a-zA-Z0-9:_-]/g, '_').substring(0, 250);
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down cache system...');
    
    this.memoryCache.close();
    
    if (this.redisCache) {
      await this.redisCache.disconnect();
    }
    
    logger.info('✅ Cache system shutdown complete');
  }
}

/**
 * Performance monitoring system
 */
export class PerformanceMonitor {
  private metrics: {
    responseTimes: number[];
    requests: number;
    errors: number;
    startTime: number;
  } = {
    responseTimes: [],
    requests: 0,
    errors: 0,
    startTime: Date.now()
  };
  
  private readonly maxResponseTimes = 10000; // Keep only last 10k response times
  
  /**
   * Record request start time
   */
  recordRequestStart(req: Request): void {
    req.startTime = process.hrtime.bigint();
    this.metrics.requests++;
  }
  
  /**
   * Record request completion
   */
  recordRequestEnd(req: Request, res: Response): void {
    if (req.startTime) {
      const duration = Number(process.hrtime.bigint() - req.startTime) / 1000000; // Convert to ms
      this.metrics.responseTimes.push(duration);
      
      // Keep only recent response times
      if (this.metrics.responseTimes.length > this.maxResponseTimes) {
        this.metrics.responseTimes.shift();
      }
      
      // Count errors
      if (res.statusCode >= 400) {
        this.metrics.errors++;
      }
      
      // Log slow requests
      if (duration > 1000) { // > 1 second
        logger.warn('🐌 Slow request detected', {
          method: req.method,
          path: req.path,
          duration: `${duration.toFixed(2)}ms`,
          statusCode: res.statusCode
        });
      }
    }
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const responseTimes = this.metrics.responseTimes.slice().sort((a, b) => a - b);
    const uptime = Date.now() - this.metrics.startTime;
    const memoryUsage = process.memoryUsage();
    
    // Calculate percentiles
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    return {
      responseTime: {
        avg: responseTimes.length > 0 
          ? Number((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)) 
          : 0,
        min: responseTimes.length > 0 ? responseTimes[0] : 0,
        max: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0,
        p95: responseTimes.length > 0 ? responseTimes[p95Index] || 0 : 0,
        p99: responseTimes.length > 0 ? responseTimes[p99Index] || 0 : 0
      },
      cache: {
        hitRate: 0, // Will be filled by cache system
        missRate: 0,
        totalRequests: 0,
        hits: 0,
        misses: 0
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        free: Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        percentage: Number(((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2))
      },
      database: {
        activeConnections: 0, // Will be filled by database manager
        slowQueries: 0,
        averageQueryTime: 0
      },
      requests: {
        total: this.metrics.requests,
        perSecond: uptime > 0 ? Number((this.metrics.requests / (uptime / 1000)).toFixed(2)) : 0,
        errors: this.metrics.errors,
        errorRate: this.metrics.requests > 0 
          ? Number(((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)) 
          : 0
      }
    };
  }
  
  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      responseTimes: [],
      requests: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    logger.info('📊 Performance metrics reset');
  }
}

/**
 * Professional Performance Optimizer
 */
export class ProfessionalPerformanceOptimizer {
  private cache: MultiLayerCache;
  private monitor: PerformanceMonitor;
  private isOptimizationEnabled: boolean = true;
  
  constructor(
    cacheOptions?: CacheOptions,
    redisUrl?: string
  ) {
    this.cache = new MultiLayerCache(cacheOptions, redisUrl);
    this.monitor = new PerformanceMonitor();
    
    logger.info('⚡ Professional Performance Optimizer initialized');
  }
  
  /**
   * Caching middleware for Express
   */
  cacheMiddleware(options: { 
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    condition?: (req: Request) => boolean;
  } = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.isOptimizationEnabled) {
        return next();
      }
      
      const { ttl = 300, keyGenerator, condition } = options;
      
      // Check condition
      if (condition && !condition(req)) {
        return next();
      }
      
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
      
      try {
        // Check cache
        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
          logger.debug('🎯 Cache hit for request', { 
            method: req.method, 
            path: req.path,
            cacheKey: cacheKey.substring(0, 50) + '...'
          });
          
          return res.json(cachedData);
        }
        
        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(body: any) {
          // Cache successful responses only
          if (res.statusCode < 400) {
            // Don't await - cache in background
            this.cache.set(cacheKey, body, ttl).catch(error => {
              logger.warn('⚠️ Failed to cache response', { error, cacheKey });
            });
          }
          
          return originalJson.call(this, body);
        }.bind(this);
        
        next();
        
      } catch (error) {
        logger.error('❌ Cache middleware error', error);
        next();
      }
    };
  }
  
  /**
   * Performance monitoring middleware
   */
  monitoringMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      this.monitor.recordRequestStart(req);
      
      res.on('finish', () => {
        this.monitor.recordRequestEnd(req, res);
      });
      
      next();
    };
  }
  
  /**
   * Response compression middleware with optimization
   */
  compressionMiddleware(options: Partial<CompressionOptions> = {}) {
    const compressionOptions = {
      threshold: options.threshold || 1024, // 1KB
      level: options.level || 6, // Default compression level
      filter: options.filter || ((req: Request, res: Response) => {
        // Don't compress if cache-control is set to no-transform
        if (res.getHeader('cache-control')?.toString().includes('no-transform')) {
          return false;
        }
        
        // Only compress text-based content types
        const contentType = res.getHeader('content-type')?.toString() || '';
        return /json|text|javascript|css|xml|html/.test(contentType);
      })
    };
    
    return compression({
      threshold: compressionOptions.threshold,
      level: compressionOptions.level,
      filter: compressionOptions.filter
    });
  }
  
  /**
   * Query optimization helper
   */
  optimizeQuery<T>(
    baseQuery: any,
    options: QueryOptimizationOptions & { 
      req?: Request; 
      defaultFields?: string[];
    } = {}
  ): any {
    const {
      enablePagination = true,
      defaultLimit = 20,
      maxLimit = 100,
      enableSelect = true,
      enableInclude = true,
      maxIncludes = 5,
      req,
      defaultFields
    } = options;
    
    let optimizedQuery = { ...baseQuery };
    
    if (req) {
      // Pagination
      if (enablePagination) {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(maxLimit, parseInt(req.query.limit as string) || defaultLimit);
        const offset = (page - 1) * limit;
        
        optimizedQuery.skip = offset;
        optimizedQuery.take = limit;
      }
      
      // Select fields optimization
      if (enableSelect && req.query.select) {
        const requestedFields = (req.query.select as string).split(',');
        const allowedFields = defaultFields || [];
        
        if (allowedFields.length > 0) {
          const select: Record<string, boolean> = {};
          requestedFields.forEach(field => {
            if (allowedFields.includes(field)) {
              select[field] = true;
            }
          });
          
          if (Object.keys(select).length > 0) {
            optimizedQuery.select = select;
          }
        }
      }
      
      // Include relations optimization  
      if (enableInclude && req.query.include) {
        const requestedIncludes = (req.query.include as string).split(',').slice(0, maxIncludes);
        const include: Record<string, boolean> = {};
        
        requestedIncludes.forEach(relation => {
          include[relation] = true;
        });
        
        optimizedQuery.include = include;
      }
      
      // Sorting
      if (req.query.sortBy) {
        const sortBy = req.query.sortBy as string;
        const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';
        
        optimizedQuery.orderBy = {
          [sortBy]: sortOrder
        };
      }
    }
    
    logger.debug('🔧 Query optimized', {
      originalKeys: Object.keys(baseQuery),
      optimizedKeys: Object.keys(optimizedQuery),
      optimizations: {
        pagination: !!optimizedQuery.skip,
        select: !!optimizedQuery.select,
        include: !!optimizedQuery.include,
        orderBy: !!optimizedQuery.orderBy
      }
    });
    
    return optimizedQuery;
  }
  
  /**
   * Get comprehensive performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    const baseMetrics = this.monitor.getMetrics();
    const cacheStats = this.cache.getStats();
    
    return {
      ...baseMetrics,
      cache: {
        hitRate: cacheStats.hitRate,
        missRate: Number((100 - cacheStats.hitRate).toFixed(2)),
        totalRequests: cacheStats.hits + cacheStats.misses,
        hits: cacheStats.hits,
        misses: cacheStats.misses
      }
    };
  }
  
  /**
   * Enable/disable optimization
   */
  toggleOptimization(enabled: boolean): void {
    this.isOptimizationEnabled = enabled;
    logger.info(`⚡ Performance optimization ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    await this.cache.clear();
  }
  
  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.monitor.resetMetrics();
  }
  
  /**
   * Get cache instance for manual operations
   */
  getCache(): MultiLayerCache {
    return this.cache;
  }
  
  /**
   * Health check for performance system
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    metrics: PerformanceMetrics;
    issues: string[];
  }> {
    const metrics = await this.getMetrics();
    const issues: string[] = [];
    
    // Check for performance issues
    if (metrics.responseTime.avg > 500) {
      issues.push('Average response time is high (>500ms)');
    }
    
    if (metrics.memory.percentage > 90) {
      issues.push('Memory usage is critical (>90%)');
    }
    
    if (metrics.cache.hitRate < 50) {
      issues.push('Cache hit rate is low (<50%)');
    }
    
    if (metrics.requests.errorRate > 5) {
      issues.push('Error rate is high (>5%)');
    }
    
    const healthy = issues.length === 0;
    
    logger.info('🏥 Performance health check completed', {
      healthy,
      issuesCount: issues.length
    });
    
    return {
      healthy,
      metrics,
      issues
    };
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down performance optimizer...');
    await this.cache.shutdown();
    logger.info('✅ Performance optimizer shutdown complete');
  }
}

// Factory function
export const createPerformanceOptimizer = (
  cacheOptions?: CacheOptions,
  redisUrl?: string
): ProfessionalPerformanceOptimizer => {
  return new ProfessionalPerformanceOptimizer(cacheOptions, redisUrl);
};

// Default instance
export const performanceOptimizer = new ProfessionalPerformanceOptimizer({
  ttl: 300, // 5 minutes
  maxKeys: 10000,
  checkPeriod: 120 // 2 minutes
}, process.env.REDIS_URL);

// Utility functions for easy integration
export const cacheMiddleware = (options?: Parameters<ProfessionalPerformanceOptimizer['cacheMiddleware']>[0]) => 
  performanceOptimizer.cacheMiddleware(options);

export const monitoringMiddleware = () => performanceOptimizer.monitoringMiddleware();

export const compressionMiddleware = (options?: Partial<CompressionOptions>) => 
  performanceOptimizer.compressionMiddleware(options);

// Global performance middleware for Express apps
export const setupPerformanceMiddleware = (app: any) => {
  app.use(monitoringMiddleware());
  app.use(compressionMiddleware());
  
  logger.info('⚡ Performance middleware setup complete');
};

export default ProfessionalPerformanceOptimizer; 