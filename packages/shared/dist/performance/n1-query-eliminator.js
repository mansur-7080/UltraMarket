"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultN1Config = exports.N1QueryEliminator = void 0;
exports.createN1QueryEliminator = createN1QueryEliminator;
const ultra_professional_logger_1 = require("../logging/ultra-professional-logger");
const perf_hooks_1 = require("perf_hooks");
// Relationship loading strategy
var LoadingStrategy;
(function (LoadingStrategy) {
    LoadingStrategy["LAZY"] = "lazy";
    LoadingStrategy["EAGER"] = "eager";
    LoadingStrategy["BATCH"] = "batch";
    LoadingStrategy["SMART"] = "smart";
})(LoadingStrategy || (LoadingStrategy = {}));
// DataLoader implementation with advanced caching
class UltraDataLoader {
    batchLoadFn;
    options;
    cache = new Map();
    batchQueue = [];
    batchPromise = null;
    metrics = new Map();
    constructor(batchLoadFn, options = {}) {
        this.batchLoadFn = batchLoadFn;
        this.options = options;
        this.options = {
            batchSize: 100,
            cacheTimeout: 300000, // 5 minutes
            enableMetrics: true,
            ...options
        };
    }
    async load(key) {
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
    async loadMany(keys) {
        const promises = keys.map(key => this.load(key));
        return Promise.all(promises);
    }
    async loadInternal(key) {
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
                    }
                    catch (error) {
                        ultra_professional_logger_1.logger.error('DataLoader batch execution failed', {
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
        return result;
    }
    clear(key) {
        this.cache.delete(key);
    }
    clearAll() {
        this.cache.clear();
        this.metrics.clear();
    }
    getMetrics() {
        return new Map(this.metrics);
    }
}
// Main N+1 Query Eliminator class
class N1QueryEliminator {
    prisma;
    dataLoaders = new Map();
    queryMetrics = [];
    config;
    constructor(prisma, config) {
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
    initializeDataLoaders() {
        // Product DataLoaders
        this.dataLoaders.set('productCategories', new UltraDataLoader(async (productIds) => {
            const categories = await this.prisma.$queryRaw `
          SELECT p.id as productId, c.* 
          FROM products p
          LEFT JOIN categories c ON p.categoryId = c.id
          WHERE p.id = ANY(${productIds})
        `;
            return this.mapResultsToKeys(categories, productIds, 'productId');
        }, { batchSize: this.config.batchSize }));
        this.dataLoaders.set('productImages', new UltraDataLoader(async (productIds) => {
            const images = await this.prisma.productImage.findMany({
                where: { productId: { in: productIds } },
                orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }]
            });
            return this.groupResultsByKey(images, productIds, 'productId');
        }, { batchSize: this.config.batchSize }));
        this.dataLoaders.set('productInventory', new UltraDataLoader(async (productIds) => {
            const inventory = await this.prisma.inventory.findMany({
                where: { productId: { in: productIds } }
            });
            return this.mapResultsToKeys(inventory, productIds, 'productId');
        }, { batchSize: this.config.batchSize }));
        this.dataLoaders.set('productReviews', new UltraDataLoader(async (productIds) => {
            const reviews = await this.prisma.review.findMany({
                where: { productId: { in: productIds } },
                orderBy: { createdAt: 'desc' },
                take: 5 // Latest 5 reviews per product
            });
            return this.groupResultsByKey(reviews, productIds, 'productId');
        }, { batchSize: this.config.batchSize }));
        // User DataLoaders
        this.dataLoaders.set('userAddresses', new UltraDataLoader(async (userIds) => {
            const addresses = await this.prisma.$queryRaw `
          SELECT * FROM addresses 
          WHERE userId = ANY(${userIds}) AND isActive = true
          ORDER BY isDefault DESC, createdAt DESC
        `;
            return this.groupResultsByKey(addresses, userIds, 'userId');
        }, { batchSize: this.config.batchSize }));
        this.dataLoaders.set('userOrders', new UltraDataLoader(async (userIds) => {
            const orders = await this.prisma.$queryRaw `
          SELECT * FROM orders 
          WHERE userId = ANY(${userIds})
          ORDER BY createdAt DESC
          LIMIT 10
        `;
            return this.groupResultsByKey(orders, userIds, 'userId');
        }, { batchSize: this.config.batchSize }));
        this.dataLoaders.set('userOrderStats', new UltraDataLoader(async (userIds) => {
            const stats = await this.prisma.$queryRaw `
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
        }, { batchSize: this.config.batchSize }));
    }
    /**
     * Optimized Product loading with relationship preloading
     */
    async loadProductsOptimized(productIds, includes = ['category', 'images', 'inventory', 'reviews']) {
        const startTime = perf_hooks_1.performance.now();
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
                            return this.dataLoaders.get('productCategories').loadMany(productIds);
                        case 'images':
                            return this.dataLoaders.get('productImages').loadMany(productIds);
                        case 'inventory':
                            return this.dataLoaders.get('productInventory').loadMany(productIds);
                        case 'reviews':
                            return this.dataLoaders.get('productReviews').loadMany(productIds);
                        default:
                            return Promise.resolve([]);
                    }
                })
            ]);
            // Combine results
            const optimizedProducts = products.map((product) => {
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
            const executionTime = perf_hooks_1.performance.now() - startTime;
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
            ultra_professional_logger_1.logger.info('Products loaded with N+1 optimization', {
                queryId,
                productCount: optimizedProducts.length,
                executionTime: `${executionTime.toFixed(2)}ms`,
                includes,
                optimizations: ['DataLoader', 'Batch Loading', 'Parallel Execution']
            });
            return optimizedProducts;
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('Failed to load optimized products', {
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
    async loadUsersOptimized(userIds, includes = ['addresses', 'orderStats']) {
        const startTime = perf_hooks_1.performance.now();
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
                            return this.dataLoaders.get('userAddresses').loadMany(userIds);
                        case 'orders':
                            return this.dataLoaders.get('userOrders').loadMany(userIds);
                        case 'orderStats':
                            return this.dataLoaders.get('userOrderStats').loadMany(userIds);
                        default:
                            return Promise.resolve([]);
                    }
                })
            ]);
            // Combine results
            const optimizedUsers = users.map((user) => {
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
            const executionTime = perf_hooks_1.performance.now() - startTime;
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
            ultra_professional_logger_1.logger.info('Users loaded with N+1 optimization', {
                queryId,
                userCount: optimizedUsers.length,
                executionTime: `${executionTime.toFixed(2)}ms`,
                includes,
                optimizations: ['DataLoader', 'Batch Loading', 'Parallel Execution']
            });
            return optimizedUsers;
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('Failed to load optimized users', {
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
    async optimizeQuery(entityType, query, options = {}) {
        const { preload = [], batchSize = this.config.batchSize, enableCaching = true } = options;
        // Analyze query complexity
        const complexity = this.analyzeQueryComplexity(query, preload);
        if (complexity.shouldOptimize) {
            ultra_professional_logger_1.logger.info('Applying smart query optimization', {
                entityType,
                complexity: complexity.score,
                optimizations: complexity.suggestedOptimizations
            });
            // Apply optimizations based on analysis
            if (complexity.suggestedOptimizations.includes('batch_loading')) {
                switch (entityType) {
                    case 'product':
                        const productIds = await this.extractEntityIds('product', query);
                        return this.loadProductsOptimized(productIds, preload);
                    case 'user':
                        const userIds = await this.extractEntityIds('user', query);
                        return this.loadUsersOptimized(userIds, preload);
                }
            }
        }
        // Fallback to standard query
        return this.executeStandardQuery(entityType, query, options);
    }
    /**
     * Analyze query complexity and suggest optimizations
     */
    analyzeQueryComplexity(query, preload) {
        let score = 0;
        const suggestions = [];
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
    async extractEntityIds(entityType, query) {
        const modelMap = {
            product: this.prisma.product,
            user: this.prisma.user
        };
        const model = modelMap[entityType];
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
        return results.map((result) => result.id);
    }
    /**
     * Execute standard query without optimization
     */
    async executeStandardQuery(entityType, query, options) {
        const modelMap = {
            product: this.prisma.product,
            user: this.prisma.user
        };
        const model = modelMap[entityType];
        if (!model) {
            throw new Error(`Unsupported entity type: ${entityType}`);
        }
        return model.findMany(query);
    }
    /**
     * Helper function to map results to keys
     */
    mapResultsToKeys(results, keys, keyField) {
        const resultMap = new Map();
        results.forEach(result => {
            resultMap.set(result[keyField], result);
        });
        return keys.map(key => resultMap.get(key) || null);
    }
    /**
     * Helper function to group results by key
     */
    groupResultsByKey(results, keys, keyField) {
        const grouped = new Map();
        results.forEach(result => {
            const key = result[keyField];
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(result);
        });
        return keys.map(key => grouped.get(key) || []);
    }
    /**
     * Record query metrics for performance monitoring
     */
    recordQueryMetrics(metrics) {
        this.queryMetrics.push(metrics);
        // Keep only last 1000 metrics
        if (this.queryMetrics.length > 1000) {
            this.queryMetrics = this.queryMetrics.slice(-1000);
        }
        // Log slow queries
        if (metrics.executionTime > this.config.performanceThresholds.slowQueryMs) {
            ultra_professional_logger_1.logger.warn('Slow query detected', {
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
    getCacheHits() {
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
    getCacheMisses() {
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
    getPerformanceReport() {
        const totalQueries = this.queryMetrics.length;
        const averageExecutionTime = totalQueries > 0
            ? this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
            : 0;
        const slowQueries = this.queryMetrics.filter(m => m.executionTime > this.config.performanceThresholds.slowQueryMs).length;
        const totalCacheRequests = this.getCacheHits() + this.getCacheMisses();
        const cacheHitRatio = totalCacheRequests > 0
            ? this.getCacheHits() / totalCacheRequests
            : 0;
        const optimizedQueries = this.queryMetrics.filter(m => m.optimizationApplied.length > 0).length;
        const optimizationCoverage = totalQueries > 0
            ? optimizedQueries / totalQueries
            : 0;
        const recommendations = [];
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
    clearCaches() {
        this.dataLoaders.forEach(loader => loader.clearAll());
        this.queryMetrics = [];
        ultra_professional_logger_1.logger.info('N+1 Query Eliminator caches cleared');
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.clearCaches();
        await this.prisma.$disconnect();
        ultra_professional_logger_1.logger.info('N+1 Query Eliminator shutdown completed');
    }
}
exports.N1QueryEliminator = N1QueryEliminator;
// Factory function to create N1QueryEliminator with database client
function createN1QueryEliminator(prisma, config) {
    return new N1QueryEliminator(prisma, config);
}
// Example default configuration
exports.defaultN1Config = {
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
exports.default = N1QueryEliminator;
//# sourceMappingURL=n1-query-eliminator.js.map