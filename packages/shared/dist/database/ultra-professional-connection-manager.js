"use strict";
/**
 * 🗄️ Ultra Professional Database Connection Manager
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha database connections ni professional tarzda manage qiladi
 * va optimal performance, security va reliability ni ta'minlaydi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ultraDatabaseManager = exports.UltraProfessionalDatabaseManager = exports.TransactionError = exports.QueryError = exports.ConnectionError = exports.UltraDatabaseError = void 0;
const tslib_1 = require("tslib");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const mongodb_1 = require("mongodb");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const events_1 = require("events");
/**
 * 🚨 Database Errors
 */
class UltraDatabaseError extends Error {
    database;
    operation;
    originalError;
    constructor(message, database, operation, originalError) {
        super(message);
        this.database = database;
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'UltraDatabaseError';
    }
}
exports.UltraDatabaseError = UltraDatabaseError;
class ConnectionError extends UltraDatabaseError {
    constructor(database, originalError) {
        super(`Failed to connect to ${database}`, database, 'connect', originalError);
    }
}
exports.ConnectionError = ConnectionError;
class QueryError extends UltraDatabaseError {
    constructor(database, query, originalError) {
        super(`Query failed on ${database}: ${query}`, database, 'query', originalError);
    }
}
exports.QueryError = QueryError;
class TransactionError extends UltraDatabaseError {
    constructor(database, originalError) {
        super(`Transaction failed on ${database}`, database, 'transaction', originalError);
    }
}
exports.TransactionError = TransactionError;
/**
 * 🏭 Ultra Professional Database Connection Manager
 */
class UltraProfessionalDatabaseManager extends events_1.EventEmitter {
    config;
    prismaClient = null;
    postgresPool = null;
    mongoClient = null;
    mongoDb = null;
    redisClient = null;
    connectionStatus = {
        postgres: 'disconnected',
        mongodb: 'disconnected',
        redis: 'disconnected',
        prisma: 'disconnected'
    };
    metrics = {
        postgres: {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingClients: 0,
            totalQueries: 0,
            averageQueryTime: 0,
            slowQueries: 0,
            errors: 0
        },
        mongodb: {
            totalConnections: 0,
            availableConnections: 0,
            createdConnections: 0,
            destroyedConnections: 0,
            totalCommands: 0,
            commandsPerSecond: 0,
            averageCommandTime: 0,
            errors: 0
        },
        redis: {
            totalConnections: 0,
            connectedClients: 0,
            blockedClients: 0,
            totalCommands: 0,
            commandsPerSecond: 0,
            memoryUsage: 0,
            keyspaceHits: 0,
            keyspaceMisses: 0,
            errors: 0
        }
    };
    healthCheckInterval = null;
    isShuttingDown = false;
    constructor(config = {}) {
        super();
        this.config = {
            postgres: {
                host: process.env.POSTGRES_HOST || 'localhost',
                port: parseInt(process.env.POSTGRES_PORT || '5432'),
                database: process.env.POSTGRES_DB || 'ultramarket',
                username: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || '',
                ssl: process.env.NODE_ENV === 'production',
                poolMin: parseInt(process.env.POSTGRES_POOL_MIN || '2'),
                poolMax: parseInt(process.env.POSTGRES_POOL_MAX || '20'),
                connectionTimeout: 10000,
                idleTimeout: 30000,
                maxRetries: 3,
                retryDelay: 1000,
                ...config.postgres
            },
            mongodb: {
                uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
                database: process.env.MONGODB_DB || 'ultramarket',
                options: {
                    maxPoolSize: 10,
                    minPoolSize: 2,
                    maxIdleTimeMS: 30000,
                    serverSelectionTimeoutMS: 5000,
                    connectTimeoutMS: 10000,
                    socketTimeoutMS: 45000,
                },
                maxPoolSize: 10,
                minPoolSize: 2,
                maxIdleTimeMS: 30000,
                serverSelectionTimeoutMS: 5000,
                ...config.mongodb
            },
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || '0'),
                keyPrefix: process.env.REDIS_KEY_PREFIX || 'ultramarket:',
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                enableOfflineQueue: false,
                lazyConnect: true,
                keepAlive: 30000,
                family: 4,
                connectTimeout: 10000,
                commandTimeout: 5000,
                ...config.redis
            },
            prisma: {
                datasourceUrl: process.env.DATABASE_URL || '',
                log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
                errorFormat: 'pretty',
                transactionOptions: {
                    maxWait: 10000,
                    timeout: 20000,
                    isolationLevel: 'ReadCommitted'
                },
                ...config.prisma
            },
            general: {
                enableHealthChecks: true,
                healthCheckInterval: 30000,
                enableMetrics: true,
                enableConnectionPooling: true,
                enableQueryLogging: process.env.NODE_ENV === 'development',
                enablePerformanceMonitoring: true,
                gracefulShutdownTimeout: 10000,
                ...config.general
            }
        };
        this.setupEventListeners();
        this.startHealthChecks();
    }
    /**
     * 🎭 Setup event listeners
     */
    setupEventListeners() {
        // Process termination handlers
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        process.on('SIGUSR2', () => this.gracefulShutdown('SIGUSR2')); // nodemon restart
        // Uncaught exception handler
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            this.gracefulShutdown('uncaughtException');
        });
        // Unhandled rejection handler
        process.on('unhandledRejection', (reason) => {
            console.error('Unhandled rejection:', reason);
        });
    }
    /**
     * ⏰ Start health checks
     */
    startHealthChecks() {
        if (!this.config.general.enableHealthChecks)
            return;
        this.healthCheckInterval = setInterval(async () => {
            if (this.isShuttingDown)
                return;
            try {
                await this.performHealthChecks();
            }
            catch (error) {
                console.error('Health check failed:', error);
            }
        }, this.config.general.healthCheckInterval);
    }
    /**
     * 🏥 Perform health checks
     */
    async performHealthChecks() {
        const healthChecks = await Promise.allSettled([
            this.checkPrismaHealth(),
            this.checkPostgresHealth(),
            this.checkMongoHealth(),
            this.checkRedisHealth()
        ]);
        healthChecks.forEach((result, index) => {
            const dbName = ['prisma', 'postgres', 'mongodb', 'redis'][index];
            if (result.status === 'rejected') {
                console.error(`${dbName} health check failed:`, result.reason);
            }
        });
    }
    /**
     * 🚀 Initialize all database connections
     */
    async initialize() {
        console.log('🔄 Initializing Ultra Professional Database Manager...');
        try {
            await Promise.all([
                this.initializePrisma(),
                this.initializePostgres(),
                this.initializeMongoDB(),
                this.initializeRedis()
            ]);
            console.log('✅ All database connections initialized successfully');
            this.emit('ready');
        }
        catch (error) {
            console.error('❌ Failed to initialize database connections:', error);
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * 🎯 Initialize Prisma client
     */
    async initializePrisma() {
        if (this.prismaClient)
            return;
        this.connectionStatus.prisma = 'connecting';
        try {
            this.prismaClient = new client_1.PrismaClient({
                datasources: {
                    db: {
                        url: this.config.prisma.datasourceUrl
                    }
                },
                log: this.config.prisma.log,
                errorFormat: this.config.prisma.errorFormat
            });
            await this.prismaClient.$connect();
            this.connectionStatus.prisma = 'connected';
            console.log('✅ Prisma client connected successfully');
            this.emit('prismaConnected');
        }
        catch (error) {
            this.connectionStatus.prisma = 'error';
            console.error('❌ Failed to connect Prisma client:', error);
            throw new ConnectionError('prisma', error);
        }
    }
    /**
     * 🐘 Initialize PostgreSQL connection pool
     */
    async initializePostgres() {
        if (this.postgresPool)
            return;
        this.connectionStatus.postgres = 'connecting';
        try {
            const poolConfig = {
                host: this.config.postgres.host,
                port: this.config.postgres.port,
                database: this.config.postgres.database,
                user: this.config.postgres.username,
                password: this.config.postgres.password,
                ssl: this.config.postgres.ssl,
                min: this.config.postgres.poolMin,
                max: this.config.postgres.poolMax,
                connectionTimeoutMillis: this.config.postgres.connectionTimeout,
                idleTimeoutMillis: this.config.postgres.idleTimeout,
                application_name: 'UltraMarket',
                keepAlive: true,
                keepAliveInitialDelayMillis: 10000
            };
            this.postgresPool = new pg_1.Pool(poolConfig);
            // Setup pool event listeners
            this.postgresPool.on('connect', (client) => {
                this.metrics.postgres.totalConnections++;
                console.log('🔌 New PostgreSQL client connected');
            });
            this.postgresPool.on('remove', () => {
                console.log('🔌 PostgreSQL client removed');
            });
            this.postgresPool.on('error', (error) => {
                this.metrics.postgres.errors++;
                console.error('❌ PostgreSQL pool error:', error);
            });
            // Test connection
            const client = await this.postgresPool.connect();
            client.release();
            this.connectionStatus.postgres = 'connected';
            console.log('✅ PostgreSQL pool connected successfully');
            this.emit('postgresConnected');
        }
        catch (error) {
            this.connectionStatus.postgres = 'error';
            console.error('❌ Failed to connect PostgreSQL pool:', error);
            throw new ConnectionError('postgres', error);
        }
    }
    /**
     * 🍃 Initialize MongoDB connection
     */
    async initializeMongoDB() {
        if (this.mongoClient)
            return;
        this.connectionStatus.mongodb = 'connecting';
        try {
            this.mongoClient = new mongodb_1.MongoClient(this.config.mongodb.uri, this.config.mongodb.options);
            // Setup event listeners
            this.mongoClient.on('error', (error) => {
                this.metrics.mongodb.errors++;
                console.error('❌ MongoDB connection error:', error);
            });
            this.mongoClient.on('close', () => {
                console.log('🔌 MongoDB disconnected');
            });
            this.mongoClient.on('reconnect', () => {
                console.log('🔄 MongoDB reconnecting...');
            });
            await this.mongoClient.connect();
            this.mongoDb = this.mongoClient.db(this.config.mongodb.database);
            this.connectionStatus.mongodb = 'connected';
            console.log('✅ MongoDB connected successfully');
            this.emit('mongoConnected');
        }
        catch (error) {
            this.connectionStatus.mongodb = 'error';
            console.error('❌ Failed to connect MongoDB:', error);
            throw new ConnectionError('mongodb', error);
        }
    }
    /**
     * 🔴 Initialize Redis connection
     */
    async initializeRedis() {
        if (this.redisClient)
            return;
        this.connectionStatus.redis = 'connecting';
        try {
            const redisOptions = {
                host: this.config.redis.host,
                port: this.config.redis.port,
                password: this.config.redis.password,
                db: this.config.redis.db,
                keyPrefix: this.config.redis.keyPrefix,
                maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
                retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
                enableOfflineQueue: this.config.redis.enableOfflineQueue,
                lazyConnect: this.config.redis.lazyConnect,
                keepAlive: this.config.redis.keepAlive,
                family: this.config.redis.family,
                connectTimeout: this.config.redis.connectTimeout,
                commandTimeout: this.config.redis.commandTimeout,
                retryDelayOnClusterDown: 300,
                retryDelayOnTimeout: 100,
                maxRetriesPerRequest: 3,
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    return err.message.includes(targetError);
                }
            };
            this.redisClient = new ioredis_1.default(redisOptions);
            // Setup event listeners
            this.redisClient.on('connect', () => {
                console.log('✅ Redis client connected');
            });
            this.redisClient.on('ready', () => {
                this.connectionStatus.redis = 'connected';
                this.emit('redisConnected');
            });
            this.redisClient.on('error', (error) => {
                this.metrics.redis.errors++;
                console.error('❌ Redis client error:', error);
            });
            this.redisClient.on('close', () => {
                console.log('🔌 Redis client disconnected');
            });
            this.redisClient.on('reconnecting', () => {
                this.connectionStatus.redis = 'reconnecting';
                console.log('🔄 Redis client reconnecting...');
            });
            await this.redisClient.connect();
            console.log('✅ Redis client connected successfully');
        }
        catch (error) {
            this.connectionStatus.redis = 'error';
            console.error('❌ Failed to connect Redis client:', error);
            throw new ConnectionError('redis', error);
        }
    }
    /**
     * 🎯 Get Prisma client
     */
    getPrismaClient() {
        if (!this.prismaClient) {
            throw new UltraDatabaseError('Prisma client not initialized', 'prisma', 'getClient');
        }
        return this.prismaClient;
    }
    /**
     * 🐘 Get PostgreSQL pool
     */
    getPostgresPool() {
        if (!this.postgresPool) {
            throw new UltraDatabaseError('PostgreSQL pool not initialized', 'postgres', 'getPool');
        }
        return this.postgresPool;
    }
    /**
     * 🍃 Get MongoDB database
     */
    getMongoDb() {
        if (!this.mongoDb) {
            throw new UltraDatabaseError('MongoDB not initialized', 'mongodb', 'getDb');
        }
        return this.mongoDb;
    }
    /**
     * 🔴 Get Redis client
     */
    getRedisClient() {
        if (!this.redisClient) {
            throw new UltraDatabaseError('Redis client not initialized', 'redis', 'getClient');
        }
        return this.redisClient;
    }
    /**
     * 🏥 Health check methods
     */
    async checkPrismaHealth() {
        if (!this.prismaClient)
            return false;
        try {
            await this.prismaClient.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('❌ Prisma health check failed:', error);
            return false;
        }
    }
    async checkPostgresHealth() {
        if (!this.postgresPool)
            return false;
        try {
            const client = await this.postgresPool.connect();
            await client.query('SELECT 1');
            client.release();
            return true;
        }
        catch (error) {
            console.error('❌ PostgreSQL health check failed:', error);
            return false;
        }
    }
    async checkMongoHealth() {
        if (!this.mongoDb)
            return false;
        try {
            await this.mongoDb.admin().ping();
            return true;
        }
        catch (error) {
            console.error('❌ MongoDB health check failed:', error);
            return false;
        }
    }
    async checkRedisHealth() {
        if (!this.redisClient)
            return false;
        try {
            await this.redisClient.ping();
            return true;
        }
        catch (error) {
            console.error('❌ Redis health check failed:', error);
            return false;
        }
    }
    /**
     * 📊 Get connection status
     */
    getConnectionStatus() {
        return { ...this.connectionStatus };
    }
    /**
     * 📈 Get metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * 🏥 Get health status
     */
    async getHealthStatus() {
        const healthChecks = await Promise.allSettled([
            this.checkPrismaHealth(),
            this.checkPostgresHealth(),
            this.checkMongoHealth(),
            this.checkRedisHealth()
        ]);
        return {
            prisma: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : false,
            postgres: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : false,
            mongodb: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : false,
            redis: healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : false,
            overall: healthChecks.every(check => check.status === 'fulfilled' && check.value === true)
        };
    }
    /**
     * 🧹 Graceful shutdown
     */
    async gracefulShutdown(signal) {
        if (this.isShuttingDown) {
            console.log('⏳ Shutdown already in progress...');
            return;
        }
        this.isShuttingDown = true;
        console.log('🛑 Starting graceful shutdown of database connections...');
        if (signal) {
            console.log(`📡 Received ${signal}, starting graceful shutdown...`);
        }
        // Stop health checks
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        // Shutdown connections with timeout
        const shutdownPromises = [];
        if (this.prismaClient) {
            shutdownPromises.push(this.prismaClient.$disconnect().then(() => {
                console.log('✅ Prisma client disconnected');
            }).catch(error => {
                console.error('❌ Error disconnecting Prisma:', error);
            }));
        }
        if (this.postgresPool) {
            shutdownPromises.push(this.postgresPool.end().then(() => {
                console.log('✅ PostgreSQL pool closed');
            }).catch(error => {
                console.error('❌ Error closing PostgreSQL pool:', error);
            }));
        }
        if (this.redisClient) {
            shutdownPromises.push(this.redisClient.disconnect().then(() => {
                console.log('✅ Redis client disconnected');
            }).catch(error => {
                console.error('❌ Error disconnecting Redis:', error);
            }));
        }
        if (this.mongoClient) {
            shutdownPromises.push(this.mongoClient.close().then(() => {
                console.log('✅ MongoDB disconnected');
            }).catch(error => {
                console.error('❌ Error disconnecting MongoDB:', error);
            }));
        }
        try {
            await Promise.race([
                Promise.all(shutdownPromises),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), this.config.general.gracefulShutdownTimeout))
            ]);
            console.log('✅ All database connections closed gracefully');
        }
        catch (error) {
            console.error('❌ Shutdown timeout or error:', error);
        }
        finally {
            console.log('🔄 Forcing shutdown...');
            process.exit(0);
        }
    }
}
exports.UltraProfessionalDatabaseManager = UltraProfessionalDatabaseManager;
/**
 * 🌟 Global Database Manager Instance
 */
exports.ultraDatabaseManager = new UltraProfessionalDatabaseManager();
exports.default = exports.ultraDatabaseManager;
//# sourceMappingURL=ultra-professional-connection-manager.js.map