"use strict";
/**
 * Professional Database Connection Management System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl database connection leaks va transaction issues ni hal qilish uchun
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionHealthMiddleware = exports.createDatabaseManager = exports.DatabaseConnectionManager = void 0;
const tslib_1 = require("tslib");
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const pg_1 = require("pg");
const events_1 = tslib_1.__importDefault(require("events"));
const logger_replacement_1 = require("../utils/logger-replacement");
// Professional database logger
const dbLogger = (0, logger_replacement_1.createLogger)('database-connection-manager');
class DatabaseConnectionManager extends events_1.default {
    static instance;
    prismaClient = null;
    postgresPool = null;
    redisClient = null;
    mongooseConnection = null;
    connectionConfig;
    isShuttingDown = false;
    activeConnections = new Set();
    constructor(config) {
        super();
        this.connectionConfig = config;
        this.setupGracefulShutdown();
    }
    static getInstance(config) {
        if (!DatabaseConnectionManager.instance && config) {
            DatabaseConnectionManager.instance = new DatabaseConnectionManager(config);
        }
        return DatabaseConnectionManager.instance;
    }
    // Prisma connection with proper configuration
    async getPrismaClient() {
        if (!this.prismaClient) {
            this.prismaClient = new client_1.PrismaClient({
                log: process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
                datasources: {
                    db: {
                        url: this.buildPostgresUrl()
                    }
                },
                // Connection pooling configuration
                __internal: {
                    engine: {
                        binaryTarget: 'native',
                    }
                }
            });
            // Connection event handlers
            this.prismaClient.$on('beforeExit', async () => {
                dbLogger.info('Prisma client disconnecting', {
                    event: 'beforeExit',
                    service: 'database-connection-manager'
                });
                await this.prismaClient?.$disconnect();
            });
            // Test connection
            try {
                await this.prismaClient.$connect();
                dbLogger.info('Prisma client connected successfully', {
                    status: 'connected',
                    database: 'prisma',
                    service: 'database-connection-manager'
                });
                this.activeConnections.add('prisma');
            }
            catch (error) {
                dbLogger.error('Failed to connect Prisma client', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    database: 'prisma',
                    service: 'database-connection-manager'
                });
                throw error;
            }
        }
        return this.prismaClient;
    }
    // PostgreSQL connection pool
    async getPostgresPool() {
        if (!this.postgresPool) {
            const config = this.connectionConfig.postgres;
            this.postgresPool = new pg_1.Pool({
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.username,
                password: config.password,
                max: config.maxConnections || 20,
                idleTimeoutMillis: config.idleTimeout || 30000,
                connectionTimeoutMillis: config.connectionTimeout || 2000,
                // Connection lifecycle events
                application_name: 'UltraMarket',
                statement_timeout: 30000,
                query_timeout: 30000,
                keepAlive: true,
                keepAliveInitialDelayMillis: 0,
            });
            // Pool event handlers
            this.postgresPool.on('connect', (client) => {
                console.log('🔌 New PostgreSQL client connected');
                this.activeConnections.add(`pg-${client.processID}`);
            });
            this.postgresPool.on('remove', (client) => {
                console.log('🔌 PostgreSQL client removed');
                this.activeConnections.delete(`pg-${client.processID}`);
            });
            this.postgresPool.on('error', (error) => {
                console.error('❌ PostgreSQL pool error:', error);
                this.emit('connectionError', { type: 'postgres', error });
            });
            // Test connection
            try {
                const client = await this.postgresPool.connect();
                await client.query('SELECT 1');
                client.release();
                console.log('✅ PostgreSQL pool connected successfully');
            }
            catch (error) {
                console.error('❌ Failed to connect PostgreSQL pool:', error);
                throw error;
            }
        }
        return this.postgresPool;
    }
    // Redis connection with retry logic
    async getRedisClient() {
        if (!this.redisClient) {
            const config = this.connectionConfig.redis;
            this.redisClient = (0, redis_1.createClient)({
                url: config.url,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > (config.maxRetries || 10)) {
                            console.error('❌ Redis max retries exceeded');
                            return new Error('Redis connection aborted');
                        }
                        const delay = Math.min(retries * (config.retryDelay || 100), 3000);
                        console.log(`🔄 Redis reconnecting in ${delay}ms, attempt ${retries}`);
                        return delay;
                    },
                    connectTimeout: 10000,
                    lazyConnect: true,
                },
                pingInterval: 30000,
                maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
            });
            // Redis event handlers
            this.redisClient.on('connect', () => {
                console.log('✅ Redis client connected');
                this.activeConnections.add('redis');
            });
            this.redisClient.on('disconnect', () => {
                console.log('🔌 Redis client disconnected');
                this.activeConnections.delete('redis');
            });
            this.redisClient.on('error', (error) => {
                console.error('❌ Redis client error:', error);
                this.emit('connectionError', { type: 'redis', error });
            });
            this.redisClient.on('reconnecting', () => {
                console.log('🔄 Redis client reconnecting...');
            });
            // Connect with error handling
            try {
                await this.redisClient.connect();
                console.log('✅ Redis client connected successfully');
            }
            catch (error) {
                console.error('❌ Failed to connect Redis client:', error);
                throw error;
            }
        }
        return this.redisClient;
    }
    // MongoDB connection with proper configuration
    async getMongooseConnection() {
        if (!this.mongooseConnection) {
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
                    console.log('✅ MongoDB connected successfully');
                    this.activeConnections.add('mongodb');
                });
                this.mongooseConnection.connection.on('error', (error) => {
                    console.error('❌ MongoDB connection error:', error);
                    this.emit('connectionError', { type: 'mongodb', error });
                });
                this.mongooseConnection.connection.on('disconnected', () => {
                    console.log('🔌 MongoDB disconnected');
                    this.activeConnections.delete('mongodb');
                });
            }
            catch (error) {
                console.error('❌ Failed to connect MongoDB:', error);
                throw error;
            }
        }
        return this.mongooseConnection;
    }
    // Safe transaction execution for Prisma
    async executeTransaction(operation, options) {
        const prisma = await this.getPrismaClient();
        return await prisma.$transaction(async (tx) => {
            try {
                return await operation(tx);
            }
            catch (error) {
                console.error('❌ Transaction failed:', error);
                throw error;
            }
        }, {
            maxWait: options?.maxWait || 5000,
            timeout: options?.timeout || 10000,
            isolationLevel: options?.isolationLevel || 'ReadCommitted',
        });
    }
    // PostgreSQL transaction with proper cleanup
    async executePostgresTransaction(operation) {
        const pool = await this.getPostgresPool();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await operation(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ PostgreSQL transaction failed:', error);
            throw error;
        }
        finally {
            client.release(); // Always release connection
        }
    }
    // Health check for all connections
    async checkConnectionHealth() {
        const health = {
            prisma: false,
            postgres: false,
            redis: false,
            mongodb: false,
            overall: false,
        };
        // Check Prisma
        try {
            if (this.prismaClient) {
                await this.prismaClient.$queryRaw `SELECT 1`;
                health.prisma = true;
            }
        }
        catch (error) {
            console.error('❌ Prisma health check failed:', error);
        }
        // Check PostgreSQL
        try {
            if (this.postgresPool) {
                const client = await this.postgresPool.connect();
                await client.query('SELECT 1');
                client.release();
                health.postgres = true;
            }
        }
        catch (error) {
            console.error('❌ PostgreSQL health check failed:', error);
        }
        // Check Redis
        try {
            if (this.redisClient) {
                await this.redisClient.ping();
                health.redis = true;
            }
        }
        catch (error) {
            console.error('❌ Redis health check failed:', error);
        }
        // Check MongoDB
        try {
            if (this.mongooseConnection) {
                const state = this.mongooseConnection.connection.readyState;
                health.mongodb = state === 1; // 1 = connected
            }
        }
        catch (error) {
            console.error('❌ MongoDB health check failed:', error);
        }
        health.overall = health.prisma && health.postgres && health.redis && health.mongodb;
        return health;
    }
    // Get connection statistics
    getConnectionStats() {
        return {
            activeConnections: Array.from(this.activeConnections),
            totalConnections: this.activeConnections.size,
            isShuttingDown: this.isShuttingDown,
            postgresPoolStats: this.postgresPool ? {
                totalCount: this.postgresPool.totalCount,
                idleCount: this.postgresPool.idleCount,
                waitingCount: this.postgresPool.waitingCount,
            } : null,
            mongooseConnectionState: this.mongooseConnection ? {
                readyState: this.mongooseConnection.connection.readyState,
                name: this.mongooseConnection.connection.name,
                host: this.mongooseConnection.connection.host,
                port: this.mongooseConnection.connection.port,
            } : null,
        };
    }
    // Graceful shutdown of all connections
    async shutdown(force = false) {
        if (this.isShuttingDown && !force) {
            console.log('⏳ Shutdown already in progress...');
            return;
        }
        this.isShuttingDown = true;
        console.log('🛑 Starting graceful shutdown of database connections...');
        const shutdownPromises = [];
        // Shutdown Prisma
        if (this.prismaClient) {
            shutdownPromises.push(this.prismaClient.$disconnect().then(() => {
                console.log('✅ Prisma client disconnected');
                this.activeConnections.delete('prisma');
            }).catch(error => {
                console.error('❌ Error disconnecting Prisma:', error);
            }));
        }
        // Shutdown PostgreSQL pool
        if (this.postgresPool) {
            shutdownPromises.push(this.postgresPool.end().then(() => {
                console.log('✅ PostgreSQL pool closed');
                this.activeConnections.clear();
            }).catch(error => {
                console.error('❌ Error closing PostgreSQL pool:', error);
            }));
        }
        // Shutdown Redis
        if (this.redisClient) {
            shutdownPromises.push(this.redisClient.disconnect().then(() => {
                console.log('✅ Redis client disconnected');
                this.activeConnections.delete('redis');
            }).catch(error => {
                console.error('❌ Error disconnecting Redis:', error);
            }));
        }
        // Shutdown MongoDB
        if (this.mongooseConnection) {
            shutdownPromises.push(this.mongooseConnection.disconnect().then(() => {
                console.log('✅ MongoDB disconnected');
                this.activeConnections.delete('mongodb');
            }).catch(error => {
                console.error('❌ Error disconnecting MongoDB:', error);
            }));
        }
        // Wait for all shutdowns with timeout
        try {
            await Promise.race([
                Promise.all(shutdownPromises),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), force ? 1000 : 10000))
            ]);
            console.log('✅ All database connections closed gracefully');
        }
        catch (error) {
            console.error('❌ Shutdown timeout or error:', error);
            if (!force) {
                console.log('🔄 Forcing shutdown...');
                return this.shutdown(true);
            }
        }
        this.emit('shutdown');
    }
    // Private helper methods
    buildPostgresUrl() {
        const config = this.connectionConfig.postgres;
        return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    }
    setupGracefulShutdown() {
        // Handle process termination
        const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                console.log(`📡 Received ${signal}, starting graceful shutdown...`);
                await this.shutdown();
                process.exit(0);
            });
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', async (error) => {
            console.error('❌ Uncaught exception:', error);
            await this.shutdown(true);
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', async (reason) => {
            console.error('❌ Unhandled rejection:', reason);
            await this.shutdown(true);
            process.exit(1);
        });
    }
}
exports.DatabaseConnectionManager = DatabaseConnectionManager;
// Singleton factory function
const createDatabaseManager = (config) => {
    return DatabaseConnectionManager.getInstance(config);
};
exports.createDatabaseManager = createDatabaseManager;
// Express middleware for connection health
const connectionHealthMiddleware = (dbManager) => {
    return async (req, res, next) => {
        try {
            const health = await dbManager.checkConnectionHealth();
            if (!health.overall) {
                return res.status(503).json({
                    success: false,
                    error: {
                        code: 'DATABASE_UNAVAILABLE',
                        message: 'Database connections unhealthy',
                        details: health
                    }
                });
            }
            next();
        }
        catch (error) {
            return res.status(503).json({
                success: false,
                error: {
                    code: 'HEALTH_CHECK_FAILED',
                    message: 'Failed to check database health'
                }
            });
        }
    };
};
exports.connectionHealthMiddleware = connectionHealthMiddleware;
// Example usage:
/*
// Initialize connection manager
const dbManager = createDatabaseManager({
  postgres: {
    host: process.env.POSTGRES_HOST!,
    port: parseInt(process.env.POSTGRES_PORT!),
    database: process.env.POSTGRES_DB!,
    username: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    maxConnections: 20,
    idleTimeout: 30000,
  },
  mongodb: {
    uri: process.env.MONGODB_URI!,
    maxPoolSize: 10,
    minPoolSize: 2,
  },
  redis: {
    url: process.env.REDIS_URL!,
    maxRetries: 3,
    retryDelay: 100,
  }
});

// Use in application
const prisma = await dbManager.getPrismaClient();
const redis = await dbManager.getRedisClient();

// Execute safe transactions
const result = await dbManager.executeTransaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.audit.create({ data: { action: 'user_created', userId: user.id } });
  return user;
});
*/ 
//# sourceMappingURL=professional-connection-manager.js.map