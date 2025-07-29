/**
 * PROFESSIONAL DATABASE CONNECTION POOL MANAGER
 * UltraMarket - Production Ready Solution
 *
 * SOLVES: Database connection limit issue (120+ connections → 20 shared connections)
 *
 * Before: Each service creates own PrismaClient = 30+ services × 4+ connections = 120+ connections
 * After: All services share connection pool = 20 total connections maximum
 */
import EventEmitter from 'events';
type PrismaClient = any;
type RedisClientType = any;
type Connection = any;
type Pool = any;
export interface ConnectionPoolConfig {
    postgres: {
        connectionString: string;
        maxConnections: number;
        minConnections: number;
        acquireTimeoutMillis: number;
        idleTimeoutMillis: number;
    };
    mongodb: {
        uri: string;
        maxPoolSize: number;
        minPoolSize: number;
        maxIdleTime: number;
    };
    redis: {
        url: string;
        maxRetries: number;
        retryDelay: number;
    };
}
/**
 * Centralized Connection Pool Manager - SINGLETON PATTERN
 * All microservices will use this single instance
 */
export declare class ConnectionPoolManager extends EventEmitter {
    private static instance;
    private prismaClient;
    private postgresPool;
    private redisClient;
    private mongooseConnection;
    private config;
    private isInitialized;
    private activeServices;
    private constructor();
    /**
     * Get singleton instance - CRITICAL: Only one instance across entire platform
     */
    static getInstance(config?: ConnectionPoolConfig): ConnectionPoolManager;
    /**
     * Register service with connection pool
     */
    registerService(serviceName: string): Promise<void>;
    /**
     * Initialize all database connections - ONLY ONCE
     */
    private initialize;
    /**
     * Initialize Prisma with optimized connection settings
     */
    private initializePrisma;
    /**
     * Initialize PostgreSQL connection pool
     */
    private initializePostgres;
    /**
     * Initialize MongoDB connection
     */
    private initializeMongoDB;
    /**
     * Initialize Redis connection
     */
    private initializeRedis;
    /**
     * Get shared Prisma client
     */
    getPrismaClient(): PrismaClient;
    /**
     * Get shared PostgreSQL pool
     */
    getPostgresPool(): Pool;
    /**
     * Get shared Redis client
     */
    getRedisClient(): RedisClientType;
    /**
     * Get shared MongoDB connection
     */
    getMongoConnection(): Connection;
    /**
     * Unregister service from connection pool
     */
    unregisterService(serviceName: string): void;
    /**
     * Get connection pool statistics
     */
    getPoolStats(): any;
    /**
     * Graceful shutdown - Close all connections properly
     */
    shutdown(): Promise<void>;
    /**
     * Setup graceful shutdown handlers
     */
    private setupGracefulShutdown;
}
export declare const connectionPoolManager: ConnectionPoolManager;
/**
 * Utility function for services to easily get database clients
 */
export declare const getDatabaseClients: (serviceName: string) => Promise<{
    prisma: any;
    postgres: any;
    redis: any;
    mongodb: any;
}>;
export default connectionPoolManager;
//# sourceMappingURL=connection-pool-manager.d.ts.map