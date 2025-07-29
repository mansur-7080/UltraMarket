"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPerformanceMiddleware = exports.compressionMiddleware = exports.monitoringMiddleware = exports.cacheMiddleware = exports.performanceOptimizer = exports.createPerformanceOptimizer = exports.ProfessionalPerformanceOptimizer = exports.PerformanceMonitor = exports.MultiLayerCache = void 0;
const tslib_1 = require("tslib");
const node_cache_1 = tslib_1.__importDefault(require("node-cache"));
const redis_1 = require("redis");
const compression_1 = tslib_1.__importDefault(require("compression"));
const professional_logger_1 = require("../logging/professional-logger");
/**
 * Multi-layer caching system
 */
class MultiLayerCache {
    memoryCache;
    redisCache = null;
    cacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0
    };
    constructor(options = {}, redisUrl) {
        // Memory cache (L1)
        this.memoryCache = new node_cache_1.default({
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
        this.memoryCache.on('set', (key, _value) => {
            this.cacheStats.sets++;
            professional_logger_1.logger.debug('🎯 Memory cache set', { key: this.sanitizeKey(key) });
        });
        this.memoryCache.on('del', (key, _value) => {
            this.cacheStats.deletes++;
            professional_logger_1.logger.debug('🗑️ Memory cache delete', { key: this.sanitizeKey(key) });
        });
        this.memoryCache.on('expired', (key, _value) => {
            professional_logger_1.logger.debug('⏰ Memory cache expired', { key: this.sanitizeKey(key) });
        });
    }
    async initializeRedisCache(redisUrl) {
        try {
            this.redisCache = (0, redis_1.createClient)({ url: redisUrl });
            this.redisCache.on('error', (error) => {
                professional_logger_1.logger.error('❌ Redis cache error', error);
            });
            this.redisCache.on('connect', () => {
                professional_logger_1.logger.info('✅ Redis cache connected');
            });
            await this.redisCache.connect();
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Failed to initialize Redis cache', error);
            this.redisCache = null;
        }
    }
    /**
     * Get value from cache (L1 first, then L2)
     */
    async get(key) {
        const sanitizedKey = this.sanitizeKey(key);
        try {
            // Try L1 cache first
            const memoryValue = this.memoryCache.get(sanitizedKey);
            if (memoryValue !== undefined) {
                this.cacheStats.hits++;
                professional_logger_1.logger.debug('🎯 L1 cache hit', { key: sanitizedKey });
                return memoryValue;
            }
            // Try L2 cache (Redis)
            if (this.redisCache) {
                const redisValue = await this.redisCache.get(sanitizedKey);
                if (redisValue) {
                    const parsedValue = JSON.parse(redisValue);
                    // Store in L1 for faster access
                    this.memoryCache.set(sanitizedKey, parsedValue);
                    this.cacheStats.hits++;
                    professional_logger_1.logger.debug('🎯 L2 cache hit', { key: sanitizedKey });
                    return parsedValue;
                }
            }
            this.cacheStats.misses++;
            professional_logger_1.logger.debug('❌ Cache miss', { key: sanitizedKey });
            return null;
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Cache get error', error, { key: sanitizedKey });
            this.cacheStats.misses++;
            return null;
        }
    }
    /**
     * Set value in both cache layers
     */
    async set(key, value, ttl) {
        const sanitizedKey = this.sanitizeKey(key);
        try {
            // Set in L1 cache
            const memorySuccess = this.memoryCache.set(sanitizedKey, value, ttl || 300);
            // Set in L2 cache (Redis)
            let redisSuccess = true;
            if (this.redisCache) {
                try {
                    await this.redisCache.setEx(sanitizedKey, ttl || 300, JSON.stringify(value));
                }
                catch (error) {
                    professional_logger_1.logger.warn('⚠️ Redis cache set failed', { key: sanitizedKey, error });
                    redisSuccess = false;
                }
            }
            if (memorySuccess) {
                professional_logger_1.logger.debug('✅ Cache set successful', { key: sanitizedKey, l1: memorySuccess, l2: redisSuccess });
            }
            return memorySuccess;
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Cache set error', error, { key: sanitizedKey });
            return false;
        }
    }
    /**
     * Delete from both cache layers
     */
    async delete(key) {
        const sanitizedKey = this.sanitizeKey(key);
        try {
            // Delete from L1
            const memoryDeleted = this.memoryCache.del(sanitizedKey);
            // Delete from L2
            let redisDeleted = 0;
            if (this.redisCache) {
                try {
                    redisDeleted = await this.redisCache.del(sanitizedKey);
                }
                catch (error) {
                    professional_logger_1.logger.warn('⚠️ Redis cache delete failed', { key: sanitizedKey, error });
                }
            }
            professional_logger_1.logger.debug('🗑️ Cache delete', {
                key: sanitizedKey,
                l1Deleted: memoryDeleted,
                l2Deleted: redisDeleted
            });
            return memoryDeleted > 0 || redisDeleted > 0;
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Cache delete error', error, { key: sanitizedKey });
            return false;
        }
    }
    /**
     * Clear all cache layers
     */
    async clear() {
        try {
            // Clear L1
            this.memoryCache.flushAll();
            // Clear L2
            if (this.redisCache) {
                await this.redisCache.flushAll();
            }
            // Reset stats
            this.cacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
            professional_logger_1.logger.info('🗑️ All caches cleared');
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Cache clear error', error);
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        const hitRate = total > 0 ? (this.cacheStats.hits / total) * 100 : 0;
        return {
            ...this.cacheStats,
            hitRate: Number(hitRate.toFixed(2)),
            keys: this.memoryCache.keys().length
        };
    }
    sanitizeKey(key) {
        // Remove potentially problematic characters
        return key.replace(/[^a-zA-Z0-9:_-]/g, '_').substring(0, 250);
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        professional_logger_1.logger.info('🛑 Shutting down cache system...');
        this.memoryCache.close();
        if (this.redisCache) {
            await this.redisCache.disconnect();
        }
        professional_logger_1.logger.info('✅ Cache system shutdown complete');
    }
}
exports.MultiLayerCache = MultiLayerCache;
/**
 * Performance monitoring system
 */
class PerformanceMonitor {
    metrics = {
        responseTimes: [],
        requests: 0,
        errors: 0,
        startTime: Date.now()
    };
    maxResponseTimes = 10000; // Keep only last 10k response times
    /**
     * Record request start time
     */
    recordRequestStart(req) {
        req.startTime = process.hrtime.bigint();
        this.metrics.requests++;
    }
    /**
     * Record request completion
     */
    recordRequestEnd(req, res) {
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
                professional_logger_1.logger.warn('🐌 Slow request detected', {
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
    getMetrics() {
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
    resetMetrics() {
        this.metrics = {
            responseTimes: [],
            requests: 0,
            errors: 0,
            startTime: Date.now()
        };
        professional_logger_1.logger.info('📊 Performance metrics reset');
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * Professional Performance Optimizer
 */
class ProfessionalPerformanceOptimizer {
    cache;
    monitor;
    isOptimizationEnabled = true;
    constructor(cacheOptions, redisUrl) {
        this.cache = new MultiLayerCache(cacheOptions, redisUrl);
        this.monitor = new PerformanceMonitor();
        professional_logger_1.logger.info('⚡ Professional Performance Optimizer initialized');
    }
    /**
     * Caching middleware for Express
     */
    cacheMiddleware(options = {}) {
        return async (req, res, next) => {
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
                    professional_logger_1.logger.debug('🎯 Cache hit for request', {
                        method: req.method,
                        path: req.path,
                        cacheKey: cacheKey.substring(0, 50) + '...'
                    });
                    return res.json(cachedData);
                }
                // Override res.json to cache the response
                const originalJson = res.json;
                const optimizer = this; // Capture this reference
                res.json = function (body) {
                    // Cache successful responses only
                    if (res.statusCode < 400) {
                        // Don't await - cache in background
                        optimizer.cache.set(cacheKey, body, ttl).catch((error) => {
                            professional_logger_1.logger.warn('⚠️ Failed to cache response', { error, cacheKey });
                        });
                    }
                    return originalJson.call(this, body);
                };
                next();
            }
            catch (error) {
                professional_logger_1.logger.error('❌ Cache middleware error', error);
                next();
            }
        };
    }
    /**
     * Performance monitoring middleware
     */
    monitoringMiddleware() {
        return (req, res, next) => {
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
    compressionMiddleware(options = {}) {
        const compressionOptions = {
            threshold: options.threshold || 1024, // 1KB
            level: options.level || 6, // Default compression level
            filter: options.filter || ((req, res) => {
                // Don't compress if cache-control is set to no-transform
                if (res.getHeader('cache-control')?.toString().includes('no-transform')) {
                    return false;
                }
                // Only compress text-based content types
                const contentType = res.getHeader('content-type')?.toString() || '';
                return /json|text|javascript|css|xml|html/.test(contentType);
            })
        };
        return (0, compression_1.default)({
            threshold: compressionOptions.threshold,
            level: compressionOptions.level,
            filter: compressionOptions.filter
        });
    }
    /**
     * Query optimization helper
     */
    optimizeQuery(baseQuery, options = {}) {
        const { enablePagination = true, defaultLimit = 20, maxLimit = 100, enableSelect = true, enableInclude = true, maxIncludes = 5, req, defaultFields } = options;
        let optimizedQuery = { ...baseQuery };
        if (req) {
            // Pagination
            if (enablePagination) {
                const page = Math.max(1, parseInt(req.query.page) || 1);
                const limit = Math.min(maxLimit, parseInt(req.query.limit) || defaultLimit);
                const offset = (page - 1) * limit;
                optimizedQuery.skip = offset;
                optimizedQuery.take = limit;
            }
            // Select fields optimization
            if (enableSelect && req.query.select) {
                const requestedFields = req.query.select.split(',');
                const allowedFields = defaultFields || [];
                if (allowedFields.length > 0) {
                    const select = {};
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
                const requestedIncludes = req.query.include.split(',').slice(0, maxIncludes);
                const include = {};
                requestedIncludes.forEach(relation => {
                    include[relation] = true;
                });
                optimizedQuery.include = include;
            }
            // Sorting
            if (req.query.sortBy) {
                const sortBy = req.query.sortBy;
                const sortOrder = req.query.sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';
                optimizedQuery.orderBy = {
                    [sortBy]: sortOrder
                };
            }
        }
        professional_logger_1.logger.debug('🔧 Query optimized', {
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
    async getMetrics() {
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
    toggleOptimization(enabled) {
        this.isOptimizationEnabled = enabled;
        professional_logger_1.logger.info(`⚡ Performance optimization ${enabled ? 'enabled' : 'disabled'}`);
    }
    /**
     * Clear all caches
     */
    async clearCaches() {
        await this.cache.clear();
    }
    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.monitor.resetMetrics();
    }
    /**
     * Get cache instance for manual operations
     */
    getCache() {
        return this.cache;
    }
    /**
     * Health check for performance system
     */
    async healthCheck() {
        const metrics = await this.getMetrics();
        const issues = [];
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
        professional_logger_1.logger.info('🏥 Performance health check completed', {
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
    async shutdown() {
        professional_logger_1.logger.info('🛑 Shutting down performance optimizer...');
        await this.cache.shutdown();
        professional_logger_1.logger.info('✅ Performance optimizer shutdown complete');
    }
}
exports.ProfessionalPerformanceOptimizer = ProfessionalPerformanceOptimizer;
// Factory function
const createPerformanceOptimizer = (cacheOptions, redisUrl) => {
    return new ProfessionalPerformanceOptimizer(cacheOptions, redisUrl);
};
exports.createPerformanceOptimizer = createPerformanceOptimizer;
// Default instance
exports.performanceOptimizer = new ProfessionalPerformanceOptimizer({
    ttl: 300, // 5 minutes
    maxKeys: 10000,
    checkPeriod: 120 // 2 minutes
}, process.env.REDIS_URL);
// Utility functions for easy integration
const cacheMiddleware = (options) => exports.performanceOptimizer.cacheMiddleware(options);
exports.cacheMiddleware = cacheMiddleware;
const monitoringMiddleware = () => exports.performanceOptimizer.monitoringMiddleware();
exports.monitoringMiddleware = monitoringMiddleware;
const compressionMiddleware = (options) => exports.performanceOptimizer.compressionMiddleware(options);
exports.compressionMiddleware = compressionMiddleware;
// Global performance middleware for Express apps
const setupPerformanceMiddleware = (app) => {
    app.use((0, exports.monitoringMiddleware)());
    app.use((0, exports.compressionMiddleware)());
    professional_logger_1.logger.info('⚡ Performance middleware setup complete');
};
exports.setupPerformanceMiddleware = setupPerformanceMiddleware;
exports.default = ProfessionalPerformanceOptimizer;
//# sourceMappingURL=comprehensive-performance-optimizer.js.map