"use strict";
/**
 * Performance Optimization Utilities
 * Advanced performance monitoring and optimization tools for UltraMarket
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionPoolManager = exports.queryOptimizer = exports.performanceMonitor = exports.ConnectionPoolManager = exports.BatchProcessor = exports.PerformanceMonitor = exports.QueryOptimizer = exports.AdvancedCache = void 0;
exports.withPerformanceMonitoring = withPerformanceMonitoring;
exports.withCaching = withCaching;
exports.debounce = debounce;
exports.throttle = throttle;
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../logging/logger");
// Memory pool for object reuse
class MemoryPool {
    pool = [];
    factory;
    reset;
    maxSize;
    constructor(factory, reset, maxSize = 100) {
        this.factory = factory;
        this.reset = reset;
        this.maxSize = maxSize;
    }
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.factory();
    }
    release(obj) {
        if (this.pool.length < this.maxSize) {
            this.reset(obj);
            this.pool.push(obj);
        }
    }
    size() {
        return this.pool.length;
    }
    clear() {
        this.pool.length = 0;
    }
}
// Advanced caching with compression and analytics
class AdvancedCache {
    redis;
    hitCount = 0;
    missCount = 0;
    compressionEnabled;
    namespace;
    constructor(redisInstance, namespace = 'ultramarket', compressionEnabled = true) {
        this.redis = redisInstance;
        this.namespace = namespace;
        this.compressionEnabled = compressionEnabled;
    }
    getKey(key) {
        return `${this.namespace}:${key}`;
    }
    async compress(data) {
        if (!this.compressionEnabled) {
            return data;
        }
        // Simple compression for demo (in production, use proper compression library)
        return Buffer.from(data).toString('base64');
    }
    async decompress(data) {
        if (!this.compressionEnabled) {
            return data;
        }
        return Buffer.from(data, 'base64').toString();
    }
    async get(key) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const cachedData = await this.redis.get(this.getKey(key));
            if (cachedData) {
                this.hitCount++;
                const decompressed = await this.decompress(cachedData);
                const result = JSON.parse(decompressed);
                logger_1.logger.debug('Cache hit', {
                    key,
                    duration: perf_hooks_1.performance.now() - startTime,
                    hitRate: this.getHitRate(),
                });
                return result;
            }
            this.missCount++;
            logger_1.logger.debug('Cache miss', {
                key,
                duration: perf_hooks_1.performance.now() - startTime,
                hitRate: this.getHitRate(),
            });
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', error);
            return null;
        }
    }
    async set(key, value, ttl) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const serialized = JSON.stringify(value);
            const compressed = await this.compress(serialized);
            await this.redis.setex(this.getKey(key), ttl, compressed);
            logger_1.logger.debug('Cache set', {
                key,
                ttl,
                size: serialized.length,
                compressedSize: compressed.length,
                compressionRatio: compressed.length / serialized.length,
                duration: perf_hooks_1.performance.now() - startTime,
            });
        }
        catch (error) {
            logger_1.logger.error('Cache set error', error);
        }
    }
    async del(key) {
        try {
            await this.redis.del(this.getKey(key));
        }
        catch (error) {
            logger_1.logger.error('Cache delete error', error);
        }
    }
    async clear() {
        try {
            const keys = await this.redis.keys(`${this.namespace}:*`);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            logger_1.logger.error('Cache clear error', error);
        }
    }
    getHitRate() {
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
    resetStats() {
        this.hitCount = 0;
        this.missCount = 0;
    }
}
exports.AdvancedCache = AdvancedCache;
// Query optimization analyzer
class QueryOptimizer {
    queryPatterns = new Map();
    slowQueries = [];
    analyzeQuery(query) {
        const suggestions = [];
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
    optimizeQuery(query) {
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
    recordSlowQuery(query, duration) {
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
            logger_1.logger.warn('Slow query detected', {
                query: query.substring(0, 200),
                duration,
                pattern,
            });
        }
    }
    extractQueryPattern(query) {
        return query
            .replace(/\b\d+\b/g, '?') // Replace numbers with ?
            .replace(/'[^']*'/g, '?') // Replace strings with ?
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .toUpperCase();
    }
    getSlowQueries(limit = 10) {
        return this.slowQueries.sort((a, b) => b.duration - a.duration).slice(0, limit);
    }
    getQueryPatterns() {
        return Array.from(this.queryPatterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
    }
}
exports.QueryOptimizer = QueryOptimizer;
// Performance monitor with metrics collection
class PerformanceMonitor {
    metrics = [];
    memoryPool;
    maxMetrics = 1000;
    constructor() {
        this.memoryPool = new MemoryPool(() => ({
            timestamp: 0,
            operation: '',
            duration: 0,
            memoryUsage: process.memoryUsage(),
            cacheHit: false,
            queryCount: 0,
        }), (metric) => {
            metric.timestamp = 0;
            metric.operation = '';
            metric.duration = 0;
            metric.cacheHit = false;
            metric.queryCount = 0;
        });
    }
    startMeasurement(operation) {
        const startTime = perf_hooks_1.performance.now();
        const startMemory = process.memoryUsage();
        const startCpu = process.cpuUsage();
        return (cacheHit = false, queryCount = 0, dbResponseTime) => {
            const endTime = perf_hooks_1.performance.now();
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
    recordMetric(metric) {
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
            logger_1.logger.warn('Slow operation detected', {
                operation: metric.operation,
                duration: metric.duration,
                memoryDelta: metric.memoryUsage.heapUsed,
                queryCount: metric.queryCount,
            });
        }
    }
    getMetrics(operation) {
        if (operation) {
            return this.metrics.filter((m) => m.operation === operation);
        }
        return [...this.metrics];
    }
    getAverageMetrics(operation) {
        const relevantMetrics = this.getMetrics(operation);
        if (relevantMetrics.length === 0) {
            return {};
        }
        const sum = relevantMetrics.reduce((acc, metric) => ({
            duration: acc.duration + metric.duration,
            queryCount: acc.queryCount + metric.queryCount,
            dbResponseTime: acc.dbResponseTime + (metric.dbResponseTime || 0),
            cacheHitCount: acc.cacheHitCount + (metric.cacheHit ? 1 : 0),
        }), {
            duration: 0,
            queryCount: 0,
            dbResponseTime: 0,
            cacheHitCount: 0,
        });
        return {
            operation: operation || 'all',
            duration: sum.duration / relevantMetrics.length,
            queryCount: sum.queryCount / relevantMetrics.length,
            dbResponseTime: sum.dbResponseTime / relevantMetrics.length,
            cacheHit: sum.cacheHitCount / relevantMetrics.length > 0.5,
        };
    }
    getSlowestOperations(limit = 10) {
        return [...this.metrics].sort((a, b) => b.duration - a.duration).slice(0, limit);
    }
    clearMetrics() {
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
exports.PerformanceMonitor = PerformanceMonitor;
// Batch processing optimizer
class BatchProcessor {
    batch = [];
    batchSize;
    batchTimeout;
    timer = null;
    processor;
    constructor(processor, batchSize = 100, batchTimeout = 1000) {
        this.processor = processor;
        this.batchSize = batchSize;
        this.batchTimeout = batchTimeout;
    }
    async add(item) {
        return new Promise((resolve, reject) => {
            this.batch.push(item);
            const itemIndex = this.batch.length - 1;
            if (this.batch.length >= this.batchSize) {
                this.flush()
                    .then((results) => resolve(results[itemIndex]))
                    .catch(reject);
            }
            else {
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
    async flush() {
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
        }
        catch (error) {
            logger_1.logger.error('Batch processing error', error);
            throw error;
        }
    }
    async finish() {
        if (this.batch.length > 0) {
            await this.flush();
        }
    }
    getCurrentBatchSize() {
        return this.batch.length;
    }
}
exports.BatchProcessor = BatchProcessor;
// Connection pool manager
class ConnectionPoolManager {
    pools = new Map();
    poolConfigs = new Map();
    createPool(name, factory, destroyer, config) {
        // Simplified pool implementation
        const pool = {
            connections: [],
            activeConnections: new Set(),
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
    async acquire(poolName) {
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
    release(poolName, connection) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            return;
        }
        pool.activeConnections.delete(connection);
        if (pool.connections.length < pool.config.max) {
            pool.connections.push(connection);
        }
        else {
            pool.destroyer(connection);
        }
    }
    getPoolStats(poolName) {
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
        const stats = {};
        for (const poolName of this.pools.keys()) {
            stats[poolName] = this.getPoolStats(poolName);
        }
        return stats;
    }
    async closePool(poolName) {
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
    async closeAllPools() {
        const poolNames = Array.from(this.pools.keys());
        await Promise.all(poolNames.map((name) => this.closePool(name)));
    }
}
exports.ConnectionPoolManager = ConnectionPoolManager;
// Export singletons
exports.performanceMonitor = new PerformanceMonitor();
exports.queryOptimizer = new QueryOptimizer();
exports.connectionPoolManager = new ConnectionPoolManager();
// Utility functions for performance optimization
function withPerformanceMonitoring(operation, fn) {
    return async (...args) => {
        const endMeasurement = exports.performanceMonitor.startMeasurement(operation);
        try {
            const result = await fn(...args);
            endMeasurement();
            return result;
        }
        catch (error) {
            endMeasurement();
            throw error;
        }
    };
}
function withCaching(cache, keyGenerator, ttl, fn) {
    return async (...args) => {
        const cacheKey = keyGenerator(...args);
        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached !== null) {
            return cached;
        }
        // Execute function and cache result
        const result = await fn(...args);
        await cache.set(cacheKey, result, ttl);
        return result;
    };
}
function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
function throttle(fn, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
//# sourceMappingURL=optimization.js.map