"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedUserService = void 0;
const perf_hooks_1 = require("perf_hooks");
const logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data || ''),
    debug: (message, data) => console.debug(`[DEBUG] ${message}`, data || '')
};
class UserDataLoader {
    batchLoadFn;
    cache = new Map();
    batchQueue = [];
    batchPromise = null;
    batchSize;
    cacheTimeout;
    constructor(batchLoadFn, options = {}) {
        this.batchLoadFn = batchLoadFn;
        this.batchSize = options.batchSize || 100;
        this.cacheTimeout = options.cacheTimeout || 300000;
    }
    async load(key) {
        const cached = this.cache.get(key);
        if (cached) {
            return cached;
        }
        const promise = this.loadInternal(key);
        this.cache.set(key, promise);
        setTimeout(() => {
            this.cache.delete(key);
        }, this.cacheTimeout);
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
                    const batch = this.batchQueue.slice(0, this.batchSize);
                    this.batchQueue = this.batchQueue.slice(this.batchSize);
                    this.batchPromise = null;
                    try {
                        const results = await this.batchLoadFn(batch);
                        resolve(results);
                    }
                    catch (error) {
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
        return result;
    }
    clear() {
        this.cache.clear();
    }
    clearKey(key) {
        this.cache.delete(key);
    }
}
class OptimizedUserService {
    db;
    addressLoader;
    orderLoader;
    orderStatsLoader;
    sessionLoader;
    performanceMetrics = [];
    cacheStats = {
        hits: 0,
        misses: 0
    };
    constructor(databaseClient) {
        this.db = databaseClient;
        this.initializeDataLoaders();
    }
    initializeDataLoaders() {
        this.addressLoader = new UserDataLoader(async (userIds) => {
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
            return userIds.map(userId => addresses.filter(addr => addr.userId === userId));
        }, { batchSize: 50, cacheTimeout: 600000 });
        this.orderLoader = new UserDataLoader(async (userIds) => {
            const orders = await this.db.order.findMany({
                where: { userId: { in: userIds } },
                orderBy: { createdAt: 'desc' },
                take: 10 * userIds.length
            });
            return userIds.map(userId => orders.filter(order => order.userId === userId).slice(0, 10));
        }, { batchSize: 50, cacheTimeout: 300000 });
        this.orderStatsLoader = new UserDataLoader(async (userIds) => {
            const stats = await this.db.$queryRaw `
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
                const userStats = stats.find((s) => s.userId === userId);
                return userStats || {
                    userId,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: null
                };
            });
        }, { batchSize: 100, cacheTimeout: 900000 });
        this.sessionLoader = new UserDataLoader(async (userIds) => {
            const sessions = await this.db.session.findMany({
                where: {
                    userId: { in: userIds },
                    isActive: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5 * userIds.length
            });
            return userIds.map(userId => sessions.filter(session => session.userId === userId).slice(0, 5));
        }, { batchSize: 50, cacheTimeout: 300000 });
    }
    async getUsers(options = {}) {
        const startTime = perf_hooks_1.performance.now();
        const queryId = `users_query_${Date.now()}`;
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', filters = {}, includes = ['addresses', 'orderStats'], optimizations = {
            enableN1Elimination: true,
            enableBatchLoading: true,
            enableParallelExecution: true,
            enableStatisticsOptimization: true
        } } = options;
        try {
            logger.info('Starting optimized user query', {
                queryId,
                page,
                limit,
                filtersCount: Object.keys(filters).length,
                includes,
                optimizations
            });
            const where = this.buildOptimizedWhereClause(filters);
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
                const executionTime = perf_hooks_1.performance.now() - startTime;
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
            let users;
            let appliedOptimizations = [];
            if (optimizations.enableN1Elimination && userIds.length > 3) {
                users = await this.loadUsersWithN1Elimination(userIds, includes, optimizations);
                appliedOptimizations.push('n1_elimination', 'batch_loading');
            }
            else {
                users = await this.loadUsersTraditional(userIds, includes);
                appliedOptimizations.push('traditional_loading');
            }
            if (optimizations.enableParallelExecution && includes.includes('recentActivity')) {
                users = await this.enhanceUsersWithRecentActivity(users);
                appliedOptimizations.push('parallel_enhancement');
            }
            const executionTime = perf_hooks_1.performance.now() - startTime;
            const totalPages = Math.ceil(total / limit);
            const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses;
            const cacheHitRatio = totalCacheRequests > 0
                ? this.cacheStats.hits / totalCacheRequests
                : 0;
            const performanceData = {
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
        }
        catch (error) {
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger.error('Optimized user query failed', {
                queryId,
                error: error.message,
                executionTime: `${executionTime.toFixed(2)}ms`
            });
            throw error;
        }
    }
    async getUserById(userId, options = {}) {
        const startTime = perf_hooks_1.performance.now();
        const { includes = ['addresses', 'orderStats', 'sessions'], enableOptimizations = true } = options;
        try {
            if (enableOptimizations) {
                const users = await this.loadUsersWithN1Elimination([userId], includes, {
                    enableN1Elimination: true,
                    enableBatchLoading: true,
                    enableParallelExecution: true,
                    enableStatisticsOptimization: true
                });
                const user = users[0] || null;
                const executionTime = perf_hooks_1.performance.now() - startTime;
                logger.info('Optimized single user loaded', {
                    userId,
                    found: !!user,
                    executionTime: `${executionTime.toFixed(2)}ms`,
                    includes,
                    optimization: 'n1_elimination'
                });
                return user;
            }
            else {
                return this.loadSingleUserTraditional(userId, includes);
            }
        }
        catch (error) {
            logger.error('Failed to load optimized user', {
                userId,
                error: error.message,
                includes
            });
            throw error;
        }
    }
    async loadUsersWithN1Elimination(userIds, includes, optimizations) {
        const startTime = perf_hooks_1.performance.now();
        const users = await this.db.user.findMany({
            where: { id: { in: userIds } },
            orderBy: { createdAt: 'desc' }
        });
        const relationshipPromises = [];
        if (includes.includes('addresses')) {
            relationshipPromises.push(Promise.all(users.map(u => this.addressLoader.load(u.id))));
        }
        else {
            relationshipPromises.push(Promise.resolve([]));
        }
        if (includes.includes('orders')) {
            relationshipPromises.push(Promise.all(users.map(u => this.orderLoader.load(u.id))));
        }
        else {
            relationshipPromises.push(Promise.resolve([]));
        }
        if (includes.includes('orderStats')) {
            relationshipPromises.push(Promise.all(users.map(u => this.orderStatsLoader.load(u.id))));
        }
        else {
            relationshipPromises.push(Promise.resolve([]));
        }
        if (includes.includes('sessions')) {
            relationshipPromises.push(Promise.all(users.map(u => this.sessionLoader.load(u.id))));
        }
        else {
            relationshipPromises.push(Promise.resolve([]));
        }
        const [addresses, orders, orderStats, sessions] = await Promise.all(relationshipPromises);
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
        const executionTime = perf_hooks_1.performance.now() - startTime;
        logger.debug('N+1 elimination completed for users', {
            userCount: users.length,
            includes,
            executionTime: `${executionTime.toFixed(2)}ms`
        });
        return enhancedUsers;
    }
    async loadUsersTraditional(userIds, includes) {
        const includeConfig = {};
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
    async loadSingleUserTraditional(userId, includes) {
        const includeConfig = {};
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
    async enhanceUsersWithRecentActivity(users) {
        const userIds = users.map(u => u.id);
        const recentActivity = await this.db.$queryRaw `
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
        return users.map(user => {
            const enhanced = { ...user };
            enhanced.recentActivity = recentActivity
                .filter((activity) => activity.userId === user.id)
                .slice(0, 10);
            return enhanced;
        });
    }
    buildOptimizedWhereClause(filters) {
        const where = {};
        if (filters.role)
            where.role = filters.role;
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.isEmailVerified !== undefined)
            where.isEmailVerified = filters.isEmailVerified;
        if (filters.createdAfter || filters.createdBefore) {
            where.createdAt = {};
            if (filters.createdAfter)
                where.createdAt.gte = filters.createdAfter;
            if (filters.createdBefore)
                where.createdAt.lte = filters.createdBefore;
        }
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
    calculateQueryCount(includes, optimizations) {
        let baseQueries = 2;
        if (!optimizations.enableN1Elimination) {
            baseQueries += includes.length * 8;
        }
        else {
            baseQueries += includes.length;
        }
        if (optimizations.enableStatisticsOptimization) {
            baseQueries += 1;
        }
        return baseQueries;
    }
    calculateQueryComplexity(filters, includes) {
        let complexity = 1;
        complexity += Object.keys(filters).length * 0.5;
        complexity += includes.length;
        if (filters.search)
            complexity += 2;
        if (filters.createdAfter || filters.createdBefore)
            complexity += 1;
        if (includes.includes('orderStats'))
            complexity += 2;
        return complexity;
    }
    recordPerformanceMetrics(metrics) {
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
    getPerformanceReport() {
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
        const optimizationCounts = new Map();
        this.performanceMetrics.forEach(m => {
            m.optimizationsApplied.forEach(opt => {
                optimizationCounts.set(opt, (optimizationCounts.get(opt) || 0) + 1);
            });
        });
        const mostUsedOptimizations = Array.from(optimizationCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([opt]) => opt);
        const recommendations = [];
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
    clearCaches() {
        this.addressLoader.clear();
        this.orderLoader.clear();
        this.orderStatsLoader.clear();
        this.sessionLoader.clear();
        this.cacheStats = { hits: 0, misses: 0 };
        logger.info('User service caches cleared');
    }
    clearUserCache(userId) {
        this.addressLoader.clearKey(userId);
        this.orderLoader.clearKey(userId);
        this.orderStatsLoader.clearKey(userId);
        this.sessionLoader.clearKey(userId);
        logger.debug('User cache cleared', { userId });
    }
    async warmUpCache(userIds) {
        const startTime = perf_hooks_1.performance.now();
        try {
            await Promise.all([
                this.addressLoader.loadMany(userIds),
                this.orderStatsLoader.loadMany(userIds)
            ]);
            const executionTime = perf_hooks_1.performance.now() - startTime;
            logger.info('User cache warmed up', {
                userCount: userIds.length,
                executionTime: `${executionTime.toFixed(2)}ms`
            });
        }
        catch (error) {
            logger.error('Failed to warm up user cache', {
                error: error.message,
                userIds: userIds.slice(0, 5)
            });
        }
    }
    async shutdown() {
        this.clearCaches();
        await this.db.$disconnect();
        logger.info('Optimized User Service shutdown completed');
    }
}
exports.OptimizedUserService = OptimizedUserService;
exports.default = OptimizedUserService;
//# sourceMappingURL=optimized-user-service.js.map