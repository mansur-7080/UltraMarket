/**
 * Performance Optimization Utilities
 * Advanced performance monitoring and optimization tools for UltraMarket
 */

import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';
import { logger } from '../logging/logger';

// Performance monitoring interfaces
export interface PerformanceMetrics {
  timestamp: number;
  operation: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  cacheHit: boolean;
  queryCount: number;
  dbResponseTime?: number;
}

export interface CacheConfig {
  ttl: number; // seconds
  maxSize?: number;
  enableCompression?: boolean;
  namespace?: string;
}

export interface QueryOptimizationResult {
  optimizedQuery: string;
  suggestions: string[];
  estimatedPerformanceGain: number;
}

// Memory pool for object reuse
class MemoryPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, maxSize: number = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  size(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool.length = 0;
  }
}

// Advanced caching with compression and analytics
export class AdvancedCache {
  private redis: Redis;
  private hitCount: number = 0;
  private missCount: number = 0;
  private compressionEnabled: boolean;
  private namespace: string;

  constructor(
    redisInstance: Redis,
    namespace: string = 'ultramarket',
    compressionEnabled: boolean = true
  ) {
    this.redis = redisInstance;
    this.namespace = namespace;
    this.compressionEnabled = compressionEnabled;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private async compress(data: string): Promise<string> {
    if (!this.compressionEnabled) {
      return data;
    }

    // Simple compression for demo (in production, use proper compression library)
    return Buffer.from(data).toString('base64');
  }

  private async decompress(data: string): Promise<string> {
    if (!this.compressionEnabled) {
      return data;
    }

    return Buffer.from(data, 'base64').toString();
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();

    try {
      const cachedData = await this.redis.get(this.getKey(key));

      if (cachedData) {
        this.hitCount++;
        const decompressed = await this.decompress(cachedData);
        const result = JSON.parse(decompressed);

        logger.debug('Cache hit', {
          key,
          duration: performance.now() - startTime,
          hitRate: this.getHitRate(),
        });

        return result;
      }

      this.missCount++;

      logger.debug('Cache miss', {
        key,
        duration: performance.now() - startTime,
        hitRate: this.getHitRate(),
      });

      return null;
    } catch (error) {
      logger.error('Cache get error', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const startTime = performance.now();

    try {
      const serialized = JSON.stringify(value);
      const compressed = await this.compress(serialized);

      await this.redis.setex(this.getKey(key), ttl, compressed);

      logger.debug('Cache set', {
        key,
        ttl,
        size: serialized.length,
        compressedSize: compressed.length,
        compressionRatio: compressed.length / serialized.length,
        duration: performance.now() - startTime,
      });
    } catch (error) {
      logger.error('Cache set error', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      logger.error('Cache delete error', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.namespace}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache clear error', error);
    }
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }

  getStats() {
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: this.getHitRate(),
      namespace: this.namespace,
      compressionEnabled: this.compressionEnabled,
    };
  }

  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Query optimization analyzer
export class QueryOptimizer {
  private queryPatterns: Map<string, number> = new Map();
  private slowQueries: Array<{ query: string; duration: number; timestamp: number }> = [];

  analyzeQuery(query: string): QueryOptimizationResult {
    const suggestions: string[] = [];
    let estimatedPerformanceGain = 0;

    // Basic query analysis patterns
    if (query.includes('SELECT *')) {
      suggestions.push('Use specific column names instead of SELECT *');
      estimatedPerformanceGain += 20;
    }

    if (!query.includes('LIMIT') && query.includes('SELECT')) {
      suggestions.push('Add LIMIT clause to prevent large result sets');
      estimatedPerformanceGain += 15;
    }

    if (query.includes('OR') && !query.includes('UNION')) {
      suggestions.push('Consider using UNION instead of OR for better performance');
      estimatedPerformanceGain += 10;
    }

    if (query.includes("LIKE '%") && query.includes("%'")) {
      suggestions.push('Avoid leading wildcards in LIKE patterns, consider full-text search');
      estimatedPerformanceGain += 25;
    }

    if (!query.includes('WHERE') && query.includes('SELECT')) {
      suggestions.push('Add WHERE clause to filter results');
      estimatedPerformanceGain += 30;
    }

    // Index suggestions
    const tableMatches = query.match(/FROM\s+(\w+)/gi);
    const whereMatches = query.match(/WHERE\s+(\w+)/gi);

    if (tableMatches && whereMatches) {
      suggestions.push('Ensure indexes exist on WHERE clause columns');
      estimatedPerformanceGain += 40;
    }

    return {
      optimizedQuery: this.optimizeQuery(query),
      suggestions,
      estimatedPerformanceGain: Math.min(estimatedPerformanceGain, 80), // Cap at 80%
    };
  }

  private optimizeQuery(query: string): string {
    let optimized = query;

    // Replace SELECT * with specific columns (simplified)
    if (optimized.includes('SELECT *')) {
      optimized = optimized.replace('SELECT *', 'SELECT id, name, created_at');
    }

    // Add LIMIT if missing
    if (!optimized.includes('LIMIT') && optimized.includes('SELECT')) {
      optimized += ' LIMIT 100';
    }

    return optimized;
  }

  recordSlowQuery(query: string, duration: number): void {
    this.slowQueries.push({
      query,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }

    // Track query patterns
    const pattern = this.extractQueryPattern(query);
    this.queryPatterns.set(pattern, (this.queryPatterns.get(pattern) || 0) + 1);

    if (duration > 1000) {
      // Log queries slower than 1 second
      logger.warn('Slow query detected', {
        query: query.substring(0, 200),
        duration,
        pattern,
      });
    }
  }

  private extractQueryPattern(query: string): string {
    return query
      .replace(/\b\d+\b/g, '?') // Replace numbers with ?
      .replace(/'[^']*'/g, '?') // Replace strings with ?
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toUpperCase();
  }

  getSlowQueries(limit: number = 10) {
    return this.slowQueries.sort((a, b) => b.duration - a.duration).slice(0, limit);
  }

  getQueryPatterns() {
    return Array.from(this.queryPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }
}

// Performance monitor with metrics collection
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private memoryPool: MemoryPool<PerformanceMetrics>;
  private readonly maxMetrics: number = 1000;

  constructor() {
    this.memoryPool = new MemoryPool<PerformanceMetrics>(
      () => ({
        timestamp: 0,
        operation: '',
        duration: 0,
        memoryUsage: process.memoryUsage(),
        cacheHit: false,
        queryCount: 0,
      }),
      (metric) => {
        metric.timestamp = 0;
        metric.operation = '';
        metric.duration = 0;
        metric.cacheHit = false;
        metric.queryCount = 0;
      }
    );
  }

  startMeasurement(operation: string): () => PerformanceMetrics {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    return (
      cacheHit: boolean = false,
      queryCount: number = 0,
      dbResponseTime?: number
    ): PerformanceMetrics => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      const metric = this.memoryPool.acquire();
      metric.timestamp = Date.now();
      metric.operation = operation;
      metric.duration = endTime - startTime;
      metric.memoryUsage = {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
      };
      metric.cpuUsage = endCpu;
      metric.cacheHit = cacheHit;
      metric.queryCount = queryCount;
      metric.dbResponseTime = dbResponseTime;

      this.recordMetric(metric);
      return metric;
    };
  }

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      const removed = this.metrics.shift();
      if (removed) {
        this.memoryPool.release(removed);
      }
    }

    // Log slow operations
    if (metric.duration > 1000) {
      logger.warn('Slow operation detected', {
        operation: metric.operation,
        duration: metric.duration,
        memoryDelta: metric.memoryUsage.heapUsed,
        queryCount: metric.queryCount,
      });
    }
  }

  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter((m) => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAverageMetrics(operation?: string): Partial<PerformanceMetrics> {
    const relevantMetrics = this.getMetrics(operation);

    if (relevantMetrics.length === 0) {
      return {};
    }

    const sum = relevantMetrics.reduce(
      (acc, metric) => ({
        duration: acc.duration + metric.duration,
        queryCount: acc.queryCount + metric.queryCount,
        dbResponseTime: acc.dbResponseTime + (metric.dbResponseTime || 0),
        cacheHitCount: acc.cacheHitCount + (metric.cacheHit ? 1 : 0),
      }),
      {
        duration: 0,
        queryCount: 0,
        dbResponseTime: 0,
        cacheHitCount: 0,
      }
    );

    return {
      operation: operation || 'all',
      duration: sum.duration / relevantMetrics.length,
      queryCount: sum.queryCount / relevantMetrics.length,
      dbResponseTime: sum.dbResponseTime / relevantMetrics.length,
      cacheHit: sum.cacheHitCount / relevantMetrics.length > 0.5,
    };
  }

  getSlowestOperations(limit: number = 10): PerformanceMetrics[] {
    return [...this.metrics].sort((a, b) => b.duration - a.duration).slice(0, limit);
  }

  clearMetrics(): void {
    this.metrics.forEach((metric) => this.memoryPool.release(metric));
    this.metrics.length = 0;
  }

  getMemoryPoolStats() {
    return {
      poolSize: this.memoryPool.size(),
      activeMetrics: this.metrics.length,
      maxMetrics: this.maxMetrics,
    };
  }
}

// Batch processing optimizer
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private readonly batchSize: number;
  private readonly batchTimeout: number;
  private timer: NodeJS.Timeout | null = null;
  private processor: (items: T[]) => Promise<R[]>;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 100,
    batchTimeout: number = 1000
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
  }

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);

      const itemIndex = this.batch.length - 1;

      if (this.batch.length >= this.batchSize) {
        this.flush()
          .then((results) => resolve(results[itemIndex]))
          .catch(reject);
      } else {
        if (this.timer) {
          clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
          this.flush()
            .then((results) => resolve(results[itemIndex]))
            .catch(reject);
        }, this.batchTimeout);
      }
    });
  }

  private async flush(): Promise<R[]> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length === 0) {
      return [];
    }

    const currentBatch = this.batch.splice(0);

    try {
      return await this.processor(currentBatch);
    } catch (error) {
      logger.error('Batch processing error', error);
      throw error;
    }
  }

  async finish(): Promise<void> {
    if (this.batch.length > 0) {
      await this.flush();
    }
  }

  getCurrentBatchSize(): number {
    return this.batch.length;
  }
}

// Connection pool manager
export class ConnectionPoolManager {
  private pools: Map<string, any> = new Map();
  private poolConfigs: Map<string, any> = new Map();

  createPool<T>(
    name: string,
    factory: () => T,
    destroyer: (connection: T) => void,
    config: {
      min: number;
      max: number;
      acquireTimeoutMillis: number;
      idleTimeoutMillis: number;
    }
  ): void {
    // Simplified pool implementation
    const pool = {
      connections: [] as T[],
      activeConnections: new Set<T>(),
      config,
      factory,
      destroyer,
    };

    this.pools.set(name, pool);
    this.poolConfigs.set(name, config);

    // Pre-create minimum connections
    for (let i = 0; i < config.min; i++) {
      pool.connections.push(factory());
    }
  }

  async acquire<T>(poolName: string): Promise<T> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    if (pool.connections.length > 0) {
      const connection = pool.connections.pop();
      pool.activeConnections.add(connection);
      return connection;
    }

    if (pool.activeConnections.size < pool.config.max) {
      const connection = pool.factory();
      pool.activeConnections.add(connection);
      return connection;
    }

    throw new Error(`Pool ${poolName} exhausted`);
  }

  release<T>(poolName: string, connection: T): void {
    const pool = this.pools.get(poolName);
    if (!pool) {
      return;
    }

    pool.activeConnections.delete(connection);

    if (pool.connections.length < pool.config.max) {
      pool.connections.push(connection);
    } else {
      pool.destroyer(connection);
    }
  }

  getPoolStats(poolName: string) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      return null;
    }

    return {
      available: pool.connections.length,
      active: pool.activeConnections.size,
      total: pool.connections.length + pool.activeConnections.size,
      config: this.poolConfigs.get(poolName),
    };
  }

  getAllPoolStats() {
    const stats: Record<string, any> = {};
    for (const poolName of this.pools.keys()) {
      stats[poolName] = this.getPoolStats(poolName);
    }
    return stats;
  }

  async closePool(poolName: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      return;
    }

    // Close all connections
    for (const connection of pool.connections) {
      pool.destroyer(connection);
    }

    for (const connection of pool.activeConnections) {
      pool.destroyer(connection);
    }

    this.pools.delete(poolName);
    this.poolConfigs.delete(poolName);
  }

  async closeAllPools(): Promise<void> {
    const poolNames = Array.from(this.pools.keys());
    await Promise.all(poolNames.map((name) => this.closePool(name)));
  }
}

// Export singletons
export const performanceMonitor = new PerformanceMonitor();
export const queryOptimizer = new QueryOptimizer();
export const connectionPoolManager = new ConnectionPoolManager();

// Utility functions for performance optimization
export function withPerformanceMonitoring<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const endMeasurement = performanceMonitor.startMeasurement(operation);

    try {
      const result = await fn(...args);
      endMeasurement();
      return result;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  };
}

export function withCaching<T extends any[], R>(
  cache: AdvancedCache,
  keyGenerator: (...args: T) => string,
  ttl: number,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const cacheKey = keyGenerator(...args);

    // Try to get from cache first
    const cached = await cache.get<R>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await cache.set(cacheKey, result, ttl);

    return result;
  };
}

export function debounce<T extends any[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: T): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends any[]>(
  fn: (...args: T) => void,
  limit: number
): (...args: T) => void {
  let inThrottle: boolean;

  return (...args: T): void => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
