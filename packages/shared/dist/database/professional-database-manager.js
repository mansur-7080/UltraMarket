"use strict";
/**
 * ⚡ PROFESSIONAL DATABASE MANAGER - UltraMarket
 *
 * N+1 queries, connection leaks, transaction management va performance optimization
 * Professional database connection va query management
 *
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseManager = exports.createDatabaseManager = exports.ProfessionalDatabaseManager = void 0;
const tslib_1 = require("tslib");
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const pg_1 = require("pg");
const events_1 = tslib_1.__importDefault(require("events"));
const professional_logger_1 = require("../logging/professional-logger");
/**
 * Professional Database Manager
 */
class ProfessionalDatabaseManager extends events_1.default {
    static instance;
    // Database clients
    prismaClient = null;
    postgresPool = null;
    redisClient = null;
    mongooseConnection = null;
    // Configuration
    connectionConfig;
    queryCache = new Map();
    activeConnections = new Set();
    queryMetrics = {
        slow: 0,
        failed: 0,
        total: 0,
        totalTime: 0
    };
    // Optimization settings
    optimizationOptions = {
        enableJoinOptimization: true,
        enableQueryCaching: true,
        batchSize: 100,
        maxIncludes: 5,
        cacheTTL: 300000 // 5 minutes
    };
    isShuttingDown = false;
    constructor(config) {
        super();
        this.connectionConfig = config;
        this.setupGracefulShutdown();
    }
    /**
     * Singleton pattern implementation
     */
    static getInstance(config) {
        if (!ProfessionalDatabaseManager.instance) {
            if (!config) {
                throw new Error('Database configuration is required for first initialization');
            }
            ProfessionalDatabaseManager.instance = new ProfessionalDatabaseManager(config);
        }
        return ProfessionalDatabaseManager.instance;
    }
    /**
     * Initialize all database connections
     */
    async initializeConnections() {
        professional_logger_1.logger.info('🗄️ Initializing database connections...');
        try {
            await Promise.all([
                this.initializePrisma(),
                this.initializePostgresPool(),
                this.initializeRedis(),
                this.initializeMongoDB()
            ]);
            professional_logger_1.logger.info('✅ All database connections initialized successfully');
            this.emit('connectionsReady');
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Failed to initialize database connections', error);
            throw error;
        }
    }
    /**
     * Initialize Prisma client with optimization
     */
    async initializePrisma() {
        if (this.prismaClient)
            return;
        this.prismaClient = new client_1.PrismaClient({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'info' },
                { emit: 'event', level: 'warn' }
            ],
            datasources: {
                db: {
                    url: this.buildPostgresUrl()
                }
            }
        });
        // Query logging and metrics
        this.prismaClient.$on('query', (e) => {
            const queryTime = Date.now() - e.timestamp.getTime();
            this.queryMetrics.total++;
            this.queryMetrics.totalTime += queryTime;
            if (queryTime > 1000) { // Slow query (>1s)
                this.queryMetrics.slow++;
                professional_logger_1.logger.warn('🐌 Slow query detected', {
                    query: e.query,
                    params: e.params,
                    duration: `${queryTime}ms`,
                    target: e.target
                });
            }
            professional_logger_1.logger.database('query', 'prisma', queryTime, {
                query: e.query.substring(0, 100) + '...',
                params: e.params,
                target: e.target
            });
        });
        this.prismaClient.$on('error', (e) => {
            this.queryMetrics.failed++;
            professional_logger_1.logger.error('❌ Prisma error', e);
        });
        // Test connection
        await this.prismaClient.$connect();
        this.activeConnections.add('prisma');
        professional_logger_1.logger.info('✅ Prisma client initialized');
    }
    /**
     * Initialize PostgreSQL connection pool
     */
    async initializePostgresPool() {
        if (this.postgresPool)
            return;
        const config = this.connectionConfig.postgres;
        this.postgresPool = new pg_1.Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            max: config.maxConnections || 20,
            idleTimeoutMillis: config.idleTimeout || 30000,
            connectionTimeoutMillis: config.connectionTimeout || 2000,
            statement_timeout: 30000,
            query_timeout: 30000,
            keepAlive: true,
            keepAliveInitialDelayMillis: 0,
        });
        // Pool event handlers
        this.postgresPool.on('connect', (client) => {
            professional_logger_1.logger.debug('🔌 New PostgreSQL client connected', {
                processId: client.processID,
                database: config.database
            });
        });
        this.postgresPool.on('remove', (client) => {
            professional_logger_1.logger.debug('🔌 PostgreSQL client removed', {
                processId: client.processID
            });
        });
        this.postgresPool.on('error', (error) => {
            professional_logger_1.logger.error('❌ PostgreSQL pool error', error);
            this.emit('connectionError', { type: 'postgres', error });
        });
        // Test connection
        const client = await this.postgresPool.connect();
        await client.query('SELECT 1');
        client.release();
        this.activeConnections.add('postgres-pool');
        professional_logger_1.logger.info('✅ PostgreSQL pool initialized');
    }
    /**
     * Initialize Redis client
     */
    async initializeRedis() {
        if (this.redisClient)
            return;
        const config = this.connectionConfig.redis;
        this.redisClient = (0, redis_1.createClient)({
            url: config.url,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > (config.maxRetries || 3)) {
                        professional_logger_1.logger.error('❌ Redis max retries exceeded');
                        return new Error('Redis connection failed');
                    }
                    const delay = Math.min(retries * 50, 3000);
                    professional_logger_1.logger.warn(`🔄 Redis reconnecting in ${delay}ms, attempt ${retries}`);
                    return delay;
                }
            }
        });
        // Redis event handlers
        this.redisClient.on('connect', () => {
            professional_logger_1.logger.info('✅ Redis client connected');
            this.activeConnections.add('redis');
        });
        this.redisClient.on('disconnect', () => {
            professional_logger_1.logger.warn('🔌 Redis client disconnected');
            this.activeConnections.delete('redis');
        });
        this.redisClient.on('error', (error) => {
            professional_logger_1.logger.error('❌ Redis client error', error);
            this.emit('connectionError', { type: 'redis', error });
        });
        this.redisClient.on('reconnecting', () => {
            professional_logger_1.logger.warn('🔄 Redis client reconnecting...');
        });
        await this.redisClient.connect();
        professional_logger_1.logger.info('✅ Redis client initialized');
    }
    /**
     * Initialize MongoDB connection
     */
    async initializeMongoDB() {
        if (this.mongooseConnection)
            return;
        const config = this.connectionConfig.mongodb;
        try {
            this.mongooseConnection = await mongoose_1.default.connect(config.uri, {
                maxPoolSize: config.maxPoolSize || 10,
                minPoolSize: config.minPoolSize || 2,
                maxIdleTimeMS: config.maxIdleTime || 30000,
                serverSelectionTimeoutMS: config.serverSelectionTimeout || 5000,
                socketTimeoutMS: 45000,
                family: 4, // Use IPv4
                bufferCommands: false,
                bufferMaxEntries: 0,
            });
            // MongoDB event handlers
            this.mongooseConnection.connection.on('connected', () => {
                professional_logger_1.logger.info('✅ MongoDB connected successfully');
                this.activeConnections.add('mongodb');
            });
            this.mongooseConnection.connection.on('error', (error) => {
                professional_logger_1.logger.error('❌ MongoDB connection error', error);
                this.emit('connectionError', { type: 'mongodb', error });
            });
            this.mongooseConnection.connection.on('disconnected', () => {
                professional_logger_1.logger.warn('🔌 MongoDB disconnected');
                this.activeConnections.delete('mongodb');
            });
            professional_logger_1.logger.info('✅ MongoDB initialized');
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Failed to initialize MongoDB', error);
            throw error;
        }
    }
    /**
     * Optimized query execution with batching and caching
     */
    async executeOptimizedQuery(queryFn, options = {}) {
        const opts = { ...this.optimizationOptions, ...options };
        const startTime = Date.now();
        try {
            // Check cache first if enabled
            if (opts.enableQueryCaching) {
                const cacheKey = this.generateCacheKey(queryFn.toString());
                const cached = this.queryCache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < cached.ttl) {
                    professional_logger_1.logger.debug('🎯 Query cache hit', { cacheKey });
                    return cached.data;
                }
            }
            // Execute query with optimization
            const result = await this.prismaClient.$transaction(async (tx) => {
                return await queryFn(tx);
            }, {
                timeout: 30000,
                isolationLevel: 'ReadCommitted'
            });
            // Cache result if enabled
            if (opts.enableQueryCaching && opts.cacheTTL) {
                const cacheKey = this.generateCacheKey(queryFn.toString());
                this.queryCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now(),
                    ttl: opts.cacheTTL
                });
            }
            const duration = Date.now() - startTime;
            professional_logger_1.logger.database('optimized-query', 'prisma', duration);
            return result;
        }
        catch (error) {
            this.queryMetrics.failed++;
            professional_logger_1.logger.error('❌ Optimized query failed', error);
            throw error;
        }
    }
    /**
     * Batch query execution to prevent N+1 problems
     */
    async executeBatchQuery(ids, queryFn, batchSize = 50) {
        const results = [];
        // Process in batches to avoid overwhelming database
        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            const batchResults = await queryFn(batch);
            results.push(...batchResults);
            professional_logger_1.logger.debug('📦 Batch query executed', {
                batchNumber: Math.floor(i / batchSize) + 1,
                batchSize: batch.length,
                totalBatches: Math.ceil(ids.length / batchSize)
            });
        }
        return results;
    }
    /**
     * Professional transaction management
     */
    async executeTransaction(transactionFn, options = {}) {
        const { timeout = 30000, isolationLevel = 'READ_COMMITTED', retryAttempts = 3, retryDelay = 1000 } = options;
        let attempt = 0;
        while (attempt < retryAttempts) {
            try {
                const result = await this.prismaClient.$transaction(transactionFn, {
                    timeout,
                    isolationLevel: isolationLevel
                });
                professional_logger_1.logger.database('transaction', 'prisma', Date.now(), {
                    attempt: attempt + 1,
                    isolationLevel
                });
                return result;
            }
            catch (error) {
                attempt++;
                if (attempt >= retryAttempts) {
                    professional_logger_1.logger.error('❌ Transaction failed after all retries', error, {
                        attempts: attempt,
                        isolationLevel
                    });
                    throw error;
                }
                professional_logger_1.logger.warn(`⚠️ Transaction failed, retrying (${attempt}/${retryAttempts})`, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    retryDelay
                });
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
        throw new Error('Transaction failed after maximum retries');
    }
    /**
     * Get database metrics and health status
     */
    async getMetrics() {
        const metrics = {
            connections: {
                postgres: { active: 0, idle: 0, total: 0 },
                mongodb: { active: 0, idle: 0, total: 0 },
                redis: { active: false, status: 'unknown' }
            },
            queries: {
                slow: this.queryMetrics.slow,
                failed: this.queryMetrics.failed,
                total: this.queryMetrics.total,
                averageTime: this.queryMetrics.total > 0
                    ? this.queryMetrics.totalTime / this.queryMetrics.total
                    : 0
            },
            cache: {
                hits: 0,
                misses: 0,
                hitRate: 0
            }
        };
        // Get PostgreSQL pool stats
        if (this.postgresPool) {
            metrics.connections.postgres = {
                active: this.postgresPool.totalCount - this.postgresPool.idleCount,
                idle: this.postgresPool.idleCount,
                total: this.postgresPool.totalCount
            };
        }
        // Get MongoDB connection stats
        if (this.mongooseConnection) {
            const mongoStats = this.mongooseConnection.connection.readyState;
            metrics.connections.mongodb = {
                active: mongoStats === 1 ? 1 : 0,
                idle: 0,
                total: 1
            };
        }
        // Get Redis connection status
        if (this.redisClient) {
            metrics.connections.redis = {
                active: this.redisClient.isReady,
                status: this.redisClient.status || 'unknown'
            };
        }
        return metrics;
    }
    /**
     * Clear query cache
     */
    clearQueryCache() {
        this.queryCache.clear();
        professional_logger_1.logger.info('🗑️ Query cache cleared');
    }
    /**
     * Health check for all database connections
     */
    async healthCheck() {
        const services = {};
        try {
            // Check Prisma/PostgreSQL
            if (this.prismaClient) {
                await this.prismaClient.$queryRaw `SELECT 1`;
                services.postgres = true;
            }
            // Check Redis
            if (this.redisClient) {
                await this.redisClient.ping();
                services.redis = true;
            }
            // Check MongoDB
            if (this.mongooseConnection) {
                services.mongodb = this.mongooseConnection.connection.readyState === 1;
            }
            const healthy = Object.values(services).every(status => status === true);
            const metrics = await this.getMetrics();
            professional_logger_1.logger.info('🏥 Database health check completed', { healthy, services });
            return { healthy, services, metrics };
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Database health check failed', error);
            return {
                healthy: false,
                services,
                metrics: await this.getMetrics()
            };
        }
    }
    /**
     * Graceful shutdown of all connections
     */
    async shutdown() {
        if (this.isShuttingDown) {
            professional_logger_1.logger.warn('⏳ Shutdown already in progress...');
            return;
        }
        this.isShuttingDown = true;
        professional_logger_1.logger.info('🛑 Starting graceful shutdown of database connections...');
        const shutdownPromises = [];
        // Disconnect Prisma
        if (this.prismaClient) {
            shutdownPromises.push(this.prismaClient.$disconnect()
                .then(() => professional_logger_1.logger.info('✅ Prisma client disconnected'))
                .catch(error => professional_logger_1.logger.error('❌ Error disconnecting Prisma', error)));
        }
        // Close PostgreSQL pool
        if (this.postgresPool) {
            shutdownPromises.push(this.postgresPool.end()
                .then(() => professional_logger_1.logger.info('✅ PostgreSQL pool closed'))
                .catch(error => professional_logger_1.logger.error('❌ Error closing PostgreSQL pool', error)));
        }
        // Disconnect Redis
        if (this.redisClient) {
            shutdownPromises.push(this.redisClient.disconnect()
                .then(() => professional_logger_1.logger.info('✅ Redis client disconnected'))
                .catch(error => professional_logger_1.logger.error('❌ Error disconnecting Redis', error)));
        }
        // Disconnect MongoDB
        if (this.mongooseConnection) {
            shutdownPromises.push(this.mongooseConnection.connection.close()
                .then(() => professional_logger_1.logger.info('✅ MongoDB disconnected'))
                .catch(error => professional_logger_1.logger.error('❌ Error disconnecting MongoDB', error)));
        }
        try {
            await Promise.allSettled(shutdownPromises);
            this.activeConnections.clear();
            this.queryCache.clear();
            professional_logger_1.logger.info('✅ All database connections closed gracefully');
        }
        catch (error) {
            professional_logger_1.logger.error('❌ Error during database shutdown', error);
        }
        finally {
            this.emit('shutdown');
        }
    }
    // Private helper methods
    buildPostgresUrl() {
        const { host, port, database, username, password, ssl } = this.connectionConfig.postgres;
        return `postgresql://${username}:${password}@${host}:${port}/${database}${ssl ? '?ssl=true' : ''}`;
    }
    generateCacheKey(queryString) {
        return Buffer.from(queryString).toString('base64').substring(0, 32);
    }
    setupGracefulShutdown() {
        const handleShutdown = (signal) => {
            professional_logger_1.logger.info(`📡 Received ${signal}, starting graceful database shutdown...`);
            this.shutdown().finally(() => process.exit(0));
        };
        process.on('SIGINT', () => handleShutdown('SIGINT'));
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            professional_logger_1.logger.error('❌ Uncaught exception', error);
            this.shutdown().finally(() => process.exit(1));
        });
        process.on('unhandledRejection', (reason) => {
            professional_logger_1.logger.error('❌ Unhandled rejection', reason);
            this.shutdown().finally(() => process.exit(1));
        });
    }
}
exports.ProfessionalDatabaseManager = ProfessionalDatabaseManager;
// Export factory function
const createDatabaseManager = (config) => {
    return ProfessionalDatabaseManager.getInstance(config);
};
exports.createDatabaseManager = createDatabaseManager;
// Export default configured instance
exports.databaseManager = ProfessionalDatabaseManager.getInstance({
    postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'ultramarket',
        username: process.env.POSTGRES_USER || 'ultramarket_user',
        password: process.env.POSTGRES_PASSWORD || 'secure_password_2024',
        ssl: process.env.POSTGRES_SSL === 'true',
        maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
        idleTimeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
        connectionTimeout: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '2000')
    },
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ultramarket',
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
        maxIdleTime: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '30000'),
        serverSelectionTimeout: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000')
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000')
    }
});
exports.default = exports.databaseManager;
//# sourceMappingURL=professional-database-manager.js.map