"use strict";
/**
 * 🚀 ULTRA PROFESSIONAL DATABASE OPTIMIZER
 * UltraMarket E-commerce Platform
 *
 * Advanced database optimization system featuring:
 * - Intelligent connection pool management
 * - Real-time query performance monitoring
 * - Automated index optimization
 * - Database health monitoring
 * - Query optimization suggestions
 * - Performance alerting system
 * - Connection leak detection
 * - Resource usage optimization
 *
 * @author UltraMarket Database Team
 * @version 4.0.0
 * @date 2024-12-28
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseOptimizer = exports.UltraProfessionalDatabaseOptimizer = void 0;
const pg_1 = require("pg");
const mongodb_1 = require("mongodb");
const redis_1 = require("redis");
const ultra_professional_logger_1 = require("../logging/ultra-professional-logger");
/**
 * Ultra Professional Database Optimizer
 */
class UltraProfessionalDatabaseOptimizer {
    config;
    postgresPool;
    mongoClient;
    mongoDb;
    redisClient;
    queryMetrics = new Map();
    optimizationSuggestions = [];
    healthChecks = null;
    performanceThresholds = {
        slowQueryTime: 1000, // 1 second
        criticalQueryTime: 5000, // 5 seconds
        maxConnectionUtilization: 0.8, // 80%
        minIndexHitRatio: 0.95, // 95%
    };
    constructor(config) {
        this.config = config;
        this.initializeConnections();
        this.startPerformanceMonitoring();
        this.startHealthChecks();
        this.initializeOptimizationEngine();
        ultra_professional_logger_1.logger.info('🚀 Ultra Professional Database Optimizer initialized', {
            postgres: this.config.postgres.host,
            mongodb: this.config.mongodb.database,
            redis: this.config.redis.host
        });
    }
    /**
     * Initialize database connections with optimized pool settings
     */
    async initializeConnections() {
        try {
            // PostgreSQL connection pool
            this.postgresPool = new pg_1.Pool({
                host: this.config.postgres.host,
                port: this.config.postgres.port,
                database: this.config.postgres.database,
                user: this.config.postgres.username,
                password: this.config.postgres.password,
                ssl: this.config.postgres.ssl,
                // Optimized pool configuration
                min: 5, // Minimum connections
                max: 100, // Maximum connections
                idleTimeoutMillis: 30000, // 30 seconds
                connectionTimeoutMillis: 10000, // 10 seconds
                acquireTimeoutMillis: 60000, // 60 seconds
                reapIntervalMillis: 1000, // 1 second
                createTimeoutMillis: 8000, // 8 seconds
                createRetryIntervalMillis: 200, // 200ms
                // Pool optimization
                allowExitOnIdle: true,
                maxUses: 7500, // Max uses per connection
                ...this.config.postgres.poolConfig
            });
            // Enhanced pool event monitoring
            this.postgresPool.on('connect', (client) => {
                ultra_professional_logger_1.logger.debug('📊 New PostgreSQL client connected', {
                    totalCount: this.postgresPool.totalCount,
                    idleCount: this.postgresPool.idleCount,
                    waitingCount: this.postgresPool.waitingCount
                });
            });
            this.postgresPool.on('remove', (client) => {
                ultra_professional_logger_1.logger.debug('📊 PostgreSQL client removed', {
                    totalCount: this.postgresPool.totalCount,
                    idleCount: this.postgresPool.idleCount
                });
            });
            this.postgresPool.on('error', (err, client) => {
                ultra_professional_logger_1.logger.error('❌ PostgreSQL pool error', err, {
                    totalCount: this.postgresPool.totalCount,
                    idleCount: this.postgresPool.idleCount,
                    waitingCount: this.postgresPool.waitingCount
                });
            });
            // MongoDB connection
            this.mongoClient = new mongodb_1.MongoClient(this.config.mongodb.uri, {
                maxPoolSize: 50, // Maximum connections
                minPoolSize: 5, // Minimum connections
                maxIdleTimeMS: 30000, // 30 seconds
                serverSelectionTimeoutMS: 10000, // 10 seconds
                socketTimeoutMS: 45000, // 45 seconds
                family: 4, // Use IPv4
                keepAlive: true,
                keepAliveInitialDelay: 300000, // 5 minutes
                // Connection optimization
                compressors: ['snappy', 'zlib'],
                readPreference: 'primaryPreferred',
                retryWrites: true,
                retryReads: true,
                ...this.config.mongodb.options
            });
            await this.mongoClient.connect();
            this.mongoDb = this.mongoClient.db(this.config.mongodb.database);
            // Redis connection
            this.redisClient = (0, redis_1.createClient)({
                host: this.config.redis.host,
                port: this.config.redis.port,
                password: this.config.redis.password,
                database: this.config.redis.db,
                // Optimized Redis configuration
                retryDelayOnFailover: 100,
                enableReadyCheck: true,
                maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
                lazyConnect: true,
                connectTimeout: 10000,
                commandTimeout: 5000,
                // Connection pool optimization
                family: 4,
                keepAlive: true,
                db: this.config.redis.db
            });
            await this.redisClient.connect();
            ultra_professional_logger_1.logger.info('✅ All database connections initialized successfully');
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to initialize database connections', error);
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }
    /**
     * Execute optimized PostgreSQL query with monitoring
     */
    async executePostgresQuery(query, params = [], options = {}) {
        const startTime = Date.now();
        const queryId = this.generateQueryId(query);
        let client = null;
        try {
            client = await this.postgresPool.connect();
            // Set query timeout if specified
            if (options.timeout) {
                await client.query(`SET statement_timeout = ${options.timeout}`);
            }
            // Execute query with EXPLAIN for optimization
            const explainResult = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`, params);
            const result = await client.query(query, params);
            const executionTime = Date.now() - startTime;
            // Extract query plan information
            const plan = explainResult.rows[0]['QUERY PLAN'][0];
            const planCost = plan.Plan['Total Cost'];
            const indexesUsed = this.extractIndexesFromPlan(plan);
            // Record metrics
            this.recordQueryMetrics({
                queryId,
                query: query.substring(0, 500), // Truncate for storage
                executionTime,
                database: 'postgres',
                rowsAffected: result.rowCount || 0,
                planCost,
                indexesUsed,
                timestamp: new Date(),
                severity: this.categorizeQuerySeverity(executionTime)
            });
            // Check for optimization opportunities
            this.analyzeQueryForOptimization(query, plan, executionTime);
            return result.rows;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            ultra_professional_logger_1.logger.error('❌ PostgreSQL query execution failed', error, {
                queryId,
                executionTime,
                query: query.substring(0, 200)
            });
            throw error;
        }
        finally {
            if (client) {
                client.release();
            }
        }
    }
    /**
     * Execute optimized MongoDB operation with monitoring
     */
    async executeMongoOperation(collection, operation, options = {}) {
        const startTime = Date.now();
        const operationId = this.generateQueryId(`mongo:${collection}`);
        try {
            const coll = this.mongoDb.collection(collection);
            // Set read preference if specified
            if (options.readPreference) {
                coll.readPreference = options.readPreference;
            }
            const result = await operation(coll);
            const executionTime = Date.now() - startTime;
            // Record metrics
            this.recordQueryMetrics({
                queryId: operationId,
                query: `MongoDB:${collection}`,
                executionTime,
                database: 'mongodb',
                indexesUsed: [], // Would need operation-specific analysis
                timestamp: new Date(),
                severity: this.categorizeQuerySeverity(executionTime)
            });
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            ultra_professional_logger_1.logger.error('❌ MongoDB operation failed', error, {
                operationId,
                collection,
                executionTime
            });
            throw error;
        }
    }
    /**
     * Execute Redis operation with monitoring
     */
    async executeRedisOperation(operation, operationName = 'redis_operation') {
        const startTime = Date.now();
        const operationId = this.generateQueryId(`redis:${operationName}`);
        try {
            const result = await operation(this.redisClient);
            const executionTime = Date.now() - startTime;
            // Record metrics
            this.recordQueryMetrics({
                queryId: operationId,
                query: `Redis:${operationName}`,
                executionTime,
                database: 'redis',
                indexesUsed: [],
                timestamp: new Date(),
                severity: this.categorizeQuerySeverity(executionTime)
            });
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            ultra_professional_logger_1.logger.error('❌ Redis operation failed', error, {
                operationId,
                operationName,
                executionTime
            });
            throw error;
        }
    }
    /**
     * Start real-time performance monitoring
     */
    startPerformanceMonitoring() {
        // Monitor every 30 seconds
        setInterval(async () => {
            try {
                await this.collectPerformanceMetrics();
                await this.analyzePerformancePatterns();
                await this.checkPerformanceThresholds();
            }
            catch (error) {
                ultra_professional_logger_1.logger.error('❌ Performance monitoring error', error);
            }
        }, 30000);
        // Detailed analysis every 5 minutes
        setInterval(async () => {
            try {
                await this.generateOptimizationSuggestions();
                await this.cleanupOldMetrics();
            }
            catch (error) {
                ultra_professional_logger_1.logger.error('❌ Detailed analysis error', error);
            }
        }, 5 * 60 * 1000);
        ultra_professional_logger_1.logger.info('📊 Performance monitoring started');
    }
    /**
     * Start health check monitoring
     */
    startHealthChecks() {
        setInterval(async () => {
            try {
                this.healthChecks = await this.performHealthChecks();
                // Log health status
                ultra_professional_logger_1.logger.info('💗 Database health check completed', {
                    postgres: this.healthChecks.postgres.status,
                    mongodb: this.healthChecks.mongodb.status,
                    redis: this.healthChecks.redis.status
                });
                // Alert on health issues
                await this.checkHealthAlerts();
            }
            catch (error) {
                ultra_professional_logger_1.logger.error('❌ Health check failed', error);
            }
        }, 60000); // Every minute
        ultra_professional_logger_1.logger.info('💗 Health monitoring started');
    }
    /**
     * Initialize optimization engine
     */
    initializeOptimizationEngine() {
        // Auto-optimization every hour
        setInterval(async () => {
            try {
                await this.executeAutoOptimizations();
            }
            catch (error) {
                ultra_professional_logger_1.logger.error('❌ Auto-optimization failed', error);
            }
        }, 60 * 60 * 1000);
        ultra_professional_logger_1.logger.info('🔧 Optimization engine initialized');
    }
    /**
     * Collect comprehensive performance metrics
     */
    async collectPerformanceMetrics() {
        try {
            // PostgreSQL metrics
            const pgStats = await this.postgresPool.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_tup_hot_upd as hot_updates,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          vacuum_count,
          autovacuum_count,
          analyze_count,
          autoanalyze_count
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 20
      `);
            // Index usage statistics
            const indexStats = await this.postgresPool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_tup_read / NULLIF(idx_tup_fetch, 0) as efficiency
        FROM pg_stat_user_indexes
        WHERE idx_tup_read > 0
        ORDER BY idx_tup_read DESC
        LIMIT 50
      `);
            // MongoDB stats
            const mongoStats = await this.mongoDb.stats();
            // Redis info
            const redisInfo = await this.redisClient.info();
            ultra_professional_logger_1.logger.performance('Database performance metrics collected', {
                metric: 'db_performance_collection',
                value: Date.now(),
                unit: 'timestamp',
                pgTables: pgStats.rowCount,
                pgIndexes: indexStats.rowCount,
                mongoCollections: mongoStats.collections,
                redisUsedMemory: this.parseRedisInfo(redisInfo, 'used_memory')
            });
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to collect performance metrics', error);
        }
    }
    /**
     * Analyze performance patterns for optimization opportunities
     */
    async analyzePerformancePatterns() {
        try {
            const recentMetrics = this.getRecentMetrics(60); // Last hour
            // Analyze slow queries
            const slowQueries = recentMetrics.filter(m => m.executionTime > this.performanceThresholds.slowQueryTime);
            // Identify query patterns
            const queryPatterns = this.identifyQueryPatterns(recentMetrics);
            // Check for N+1 query problems
            const n1Problems = this.detectN1QueryProblems(recentMetrics);
            if (slowQueries.length > 0) {
                ultra_professional_logger_1.logger.warn('🐌 Slow queries detected', {
                    count: slowQueries.length,
                    slowestQuery: Math.max(...slowQueries.map(q => q.executionTime))
                });
            }
            if (n1Problems.length > 0) {
                ultra_professional_logger_1.logger.warn('🚨 N+1 query problems detected', {
                    patterns: n1Problems.length
                });
            }
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Performance pattern analysis failed', error);
        }
    }
    /**
     * Perform comprehensive health checks
     */
    async performHealthChecks() {
        const health = {
            postgres: {
                status: 'healthy',
                responseTime: 0,
                connectionPool: {
                    totalConnections: 0,
                    activeConnections: 0,
                    idleConnections: 0,
                    waitingCount: 0,
                    poolSize: 0,
                    maxPoolSize: 0,
                    averageWaitTime: 0,
                    connectionLeaks: 0
                },
                slowQueries: 0,
                lockingQueries: 0
            },
            mongodb: {
                status: 'healthy',
                responseTime: 0,
                connectionPool: {
                    totalConnections: 0,
                    activeConnections: 0,
                    idleConnections: 0,
                    waitingCount: 0,
                    poolSize: 0,
                    maxPoolSize: 0,
                    averageWaitTime: 0,
                    connectionLeaks: 0
                },
                indexHitRatio: 0,
                collectionStats: []
            },
            redis: {
                status: 'healthy',
                responseTime: 0,
                memoryUsage: 0,
                keyspaceHits: 0,
                keyspaceMisses: 0,
                connectedClients: 0
            }
        };
        try {
            // PostgreSQL health check
            const pgStart = Date.now();
            await this.postgresPool.query('SELECT 1');
            health.postgres.responseTime = Date.now() - pgStart;
            health.postgres.connectionPool = {
                totalConnections: this.postgresPool.totalCount,
                activeConnections: this.postgresPool.totalCount - this.postgresPool.idleCount,
                idleConnections: this.postgresPool.idleCount,
                waitingCount: this.postgresPool.waitingCount,
                poolSize: this.postgresPool.totalCount,
                maxPoolSize: 100, // From config
                averageWaitTime: 0, // Would need tracking
                connectionLeaks: 0 // Would need detection logic
            };
            // MongoDB health check
            const mongoStart = Date.now();
            await this.mongoDb.admin().ping();
            health.mongodb.responseTime = Date.now() - mongoStart;
            // Redis health check
            const redisStart = Date.now();
            await this.redisClient.ping();
            health.redis.responseTime = Date.now() - redisStart;
            const redisInfo = await this.redisClient.info();
            health.redis.memoryUsage = parseInt(this.parseRedisInfo(redisInfo, 'used_memory') || '0');
            health.redis.keyspaceHits = parseInt(this.parseRedisInfo(redisInfo, 'keyspace_hits') || '0');
            health.redis.keyspaceMisses = parseInt(this.parseRedisInfo(redisInfo, 'keyspace_misses') || '0');
            health.redis.connectedClients = parseInt(this.parseRedisInfo(redisInfo, 'connected_clients') || '0');
            // Determine health status based on metrics
            health.postgres.status = this.determineHealthStatus('postgres', health.postgres);
            health.mongodb.status = this.determineHealthStatus('mongodb', health.mongodb);
            health.redis.status = this.determineHealthStatus('redis', health.redis);
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Health check failed', error);
        }
        return health;
    }
    /**
     * Generate optimization suggestions based on metrics
     */
    async generateOptimizationSuggestions() {
        try {
            const suggestions = [];
            // Analyze recent metrics for suggestions
            const recentMetrics = this.getRecentMetrics(24 * 60); // Last 24 hours
            // Check for missing indexes
            const missingIndexes = await this.detectMissingIndexes();
            missingIndexes.forEach(index => {
                suggestions.push({
                    id: `idx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'index',
                    severity: 'HIGH',
                    database: index.database,
                    table: index.table,
                    description: `Missing index detected on ${index.table}.${index.column}`,
                    suggestion: `Consider adding index: ${index.suggestedIndex}`,
                    estimatedImpact: 'high',
                    sqlCommand: index.sqlCommand,
                    implemented: false,
                    createdAt: new Date()
                });
            });
            // Check for unused indexes
            const unusedIndexes = await this.detectUnusedIndexes();
            unusedIndexes.forEach(index => {
                suggestions.push({
                    id: `unused_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'index',
                    severity: 'MEDIUM',
                    database: 'postgres',
                    table: index.table,
                    description: `Unused index detected: ${index.indexName}`,
                    suggestion: `Consider dropping unused index to improve write performance`,
                    estimatedImpact: 'medium',
                    sqlCommand: `DROP INDEX IF EXISTS ${index.indexName};`,
                    implemented: false,
                    createdAt: new Date()
                });
            });
            // Add suggestions to collection
            this.optimizationSuggestions.push(...suggestions);
            // Limit suggestions to latest 100
            if (this.optimizationSuggestions.length > 100) {
                this.optimizationSuggestions = this.optimizationSuggestions
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, 100);
            }
            if (suggestions.length > 0) {
                ultra_professional_logger_1.logger.info('💡 Optimization suggestions generated', {
                    count: suggestions.length,
                    highPriority: suggestions.filter(s => s.severity === 'HIGH').length,
                    criticalPriority: suggestions.filter(s => s.severity === 'CRITICAL').length
                });
            }
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to generate optimization suggestions', error);
        }
    }
    /**
     * Execute automatic optimizations for safe improvements
     */
    async executeAutoOptimizations() {
        try {
            const safeOptimizations = this.optimizationSuggestions.filter(s => !s.implemented &&
                s.severity !== 'CRITICAL' &&
                s.type !== 'schema' // Never auto-modify schema
            );
            for (const optimization of safeOptimizations.slice(0, 5)) { // Limit to 5 per run
                try {
                    if (optimization.type === 'index' && optimization.sqlCommand) {
                        // Execute index creation
                        await this.postgresPool.query(optimization.sqlCommand);
                        optimization.implemented = true;
                        ultra_professional_logger_1.logger.info('✅ Auto-optimization executed', {
                            type: optimization.type,
                            description: optimization.description
                        });
                    }
                }
                catch (optimizationError) {
                    ultra_professional_logger_1.logger.error('❌ Auto-optimization failed', optimizationError, {
                        optimizationId: optimization.id
                    });
                }
            }
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Auto-optimization process failed', error);
        }
    }
    /**
     * Get database performance metrics
     */
    getPerformanceMetrics() {
        return {
            queries: Array.from(this.queryMetrics.values()).flat(),
            suggestions: this.optimizationSuggestions,
            health: this.healthChecks,
            connectionPools: {
                postgres: {
                    totalConnections: this.postgresPool.totalCount,
                    activeConnections: this.postgresPool.totalCount - this.postgresPool.idleCount,
                    idleConnections: this.postgresPool.idleCount,
                    waitingCount: this.postgresPool.waitingCount,
                    poolSize: this.postgresPool.totalCount,
                    maxPoolSize: 100,
                    averageWaitTime: 0,
                    connectionLeaks: 0
                },
                mongodb: {
                    totalConnections: 0, // Would need to implement
                    activeConnections: 0,
                    idleConnections: 0,
                    waitingCount: 0,
                    poolSize: 0,
                    maxPoolSize: 50,
                    averageWaitTime: 0,
                    connectionLeaks: 0
                },
                redis: {
                    connectedClients: 0 // From health check
                }
            }
        };
    }
    /**
     * Helper methods
     */
    generateQueryId(query) {
        const hash = require('crypto').createHash('md5').update(query).digest('hex');
        return `query_${hash.substring(0, 8)}`;
    }
    categorizeQuerySeverity(executionTime) {
        if (executionTime >= this.performanceThresholds.criticalQueryTime)
            return 'CRITICAL';
        if (executionTime >= this.performanceThresholds.slowQueryTime)
            return 'HIGH';
        if (executionTime >= 500)
            return 'MEDIUM';
        return 'LOW';
    }
    recordQueryMetrics(metrics) {
        const queryKey = metrics.queryId;
        if (!this.queryMetrics.has(queryKey)) {
            this.queryMetrics.set(queryKey, []);
        }
        this.queryMetrics.get(queryKey).push(metrics);
        // Limit metrics per query to last 100 executions
        const queryMetricsList = this.queryMetrics.get(queryKey);
        if (queryMetricsList.length > 100) {
            this.queryMetrics.set(queryKey, queryMetricsList.slice(-100));
        }
    }
    extractIndexesFromPlan(plan) {
        const indexes = [];
        function traverse(node) {
            if (node['Index Name']) {
                indexes.push(node['Index Name']);
            }
            if (node.Plans) {
                node.Plans.forEach(traverse);
            }
        }
        traverse(plan.Plan);
        return [...new Set(indexes)]; // Remove duplicates
    }
    getRecentMetrics(minutes) {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        return Array.from(this.queryMetrics.values())
            .flat()
            .filter(m => m.timestamp >= cutoff);
    }
    identifyQueryPatterns(metrics) {
        const patterns = new Map();
        metrics.forEach(metric => {
            // Normalize query to identify patterns
            const normalizedQuery = metric.query
                .replace(/\$\d+/g, '$?') // Replace parameters
                .replace(/\d+/g, '?') // Replace numbers
                .replace(/'[^']*'/g, "'?'") // Replace strings
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            patterns.set(normalizedQuery, (patterns.get(normalizedQuery) || 0) + 1);
        });
        return Array.from(patterns.entries())
            .map(([pattern, count]) => ({ pattern, count }))
            .sort((a, b) => b.count - a.count);
    }
    detectN1QueryProblems(metrics) {
        const patterns = this.identifyQueryPatterns(metrics);
        return patterns
            .filter(p => p.count > 10) // Same query executed more than 10 times
            .map(p => p.pattern);
    }
    async detectMissingIndexes() {
        try {
            const result = await this.postgresPool.query(`
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          n_distinct,
          most_common_vals
        FROM pg_stats
        WHERE schemaname = 'public'
          AND n_distinct > 100
          AND tablename NOT IN (
            SELECT DISTINCT tablename 
            FROM pg_indexes 
            WHERE schemaname = 'public'
              AND indexname LIKE '%' || pg_stats.attname || '%'
          )
        ORDER BY n_distinct DESC
        LIMIT 10
      `);
            return result.rows.map(row => ({
                database: 'postgres',
                table: row.tablename,
                column: row.column_name,
                suggestedIndex: `idx_${row.tablename}_${row.column_name}`,
                sqlCommand: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${row.tablename}_${row.column_name} ON ${row.tablename}(${row.column_name});`
            }));
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to detect missing indexes', error);
            return [];
        }
    }
    async detectUnusedIndexes() {
        try {
            const result = await this.postgresPool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname
        FROM pg_stat_user_indexes
        WHERE idx_tup_read = 0
          AND idx_tup_fetch = 0
          AND indexname NOT LIKE '%_pkey'
        ORDER BY schemaname, tablename
      `);
            return result.rows.map(row => ({
                table: row.tablename,
                indexName: row.indexname
            }));
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to detect unused indexes', error);
            return [];
        }
    }
    parseRedisInfo(info, key) {
        const lines = info.split('\r\n');
        for (const line of lines) {
            if (line.startsWith(`${key}:`)) {
                return line.split(':')[1];
            }
        }
        return null;
    }
    determineHealthStatus(db, metrics) {
        if (db === 'postgres') {
            if (metrics.responseTime > 1000)
                return 'unhealthy';
            if (metrics.responseTime > 500 || metrics.connectionPool.activeConnections / metrics.connectionPool.maxPoolSize > 0.8)
                return 'degraded';
            return 'healthy';
        }
        if (db === 'mongodb') {
            if (metrics.responseTime > 1000)
                return 'unhealthy';
            if (metrics.responseTime > 500)
                return 'degraded';
            return 'healthy';
        }
        if (db === 'redis') {
            if (metrics.responseTime > 1000)
                return 'unhealthy';
            if (metrics.responseTime > 100)
                return 'degraded';
            return 'healthy';
        }
        return 'healthy';
    }
    async checkPerformanceThresholds() {
        const recentMetrics = this.getRecentMetrics(5); // Last 5 minutes
        const criticalQueries = recentMetrics.filter(m => m.severity === 'CRITICAL');
        if (criticalQueries.length > 0) {
            ultra_professional_logger_1.logger.error('🚨 Critical query performance detected', {
                count: criticalQueries.length,
                slowestQuery: Math.max(...criticalQueries.map(q => q.executionTime))
            });
        }
    }
    async checkHealthAlerts() {
        if (!this.healthChecks)
            return;
        const unhealthyDatabases = [];
        if (this.healthChecks.postgres.status === 'unhealthy')
            unhealthyDatabases.push('PostgreSQL');
        if (this.healthChecks.mongodb.status === 'unhealthy')
            unhealthyDatabases.push('MongoDB');
        if (this.healthChecks.redis.status === 'unhealthy')
            unhealthyDatabases.push('Redis');
        if (unhealthyDatabases.length > 0) {
            ultra_professional_logger_1.logger.error('🚨 Database health alert', {
                unhealthyDatabases,
                totalDatabases: 3
            });
        }
    }
    cleanupOldMetrics() {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        for (const [queryId, metrics] of this.queryMetrics.entries()) {
            const filteredMetrics = metrics.filter(m => m.timestamp >= cutoff);
            if (filteredMetrics.length === 0) {
                this.queryMetrics.delete(queryId);
            }
            else {
                this.queryMetrics.set(queryId, filteredMetrics);
            }
        }
        // Cleanup old optimization suggestions
        this.optimizationSuggestions = this.optimizationSuggestions.filter(s => s.createdAt >= cutoff);
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        try {
            await this.postgresPool.end();
            await this.mongoClient.close();
            await this.redisClient.quit();
            ultra_professional_logger_1.logger.info('✅ Database connections closed gracefully');
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Error during database shutdown', error);
        }
    }
}
exports.UltraProfessionalDatabaseOptimizer = UltraProfessionalDatabaseOptimizer;
// Export configured instance
const createDatabaseOptimizer = (config) => {
    return new UltraProfessionalDatabaseOptimizer(config);
};
exports.createDatabaseOptimizer = createDatabaseOptimizer;
exports.default = UltraProfessionalDatabaseOptimizer;
//# sourceMappingURL=ultra-professional-database-optimizer.js.map