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
import { PrismaClient } from '@prisma/client';
import EventEmitter from 'events';
export interface DatabaseConnectionConfig {
    postgres: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl?: boolean;
        maxConnections?: number;
        idleTimeout?: number;
        connectionTimeout?: number;
    };
    mongodb: {
        uri: string;
        maxPoolSize?: number;
        minPoolSize?: number;
        maxIdleTime?: number;
        serverSelectionTimeout?: number;
    };
    redis: {
        url: string;
        maxRetries?: number;
        retryDelay?: number;
        maxRetriesPerRequest?: number;
    };
}
export interface DatabaseMetrics {
    connections: {
        postgres: {
            active: number;
            idle: number;
            total: number;
        };
        mongodb: {
            active: number;
            idle: number;
            total: number;
        };
        redis: {
            active: boolean;
            status: string;
        };
    };
    queries: {
        slow: number;
        failed: number;
        total: number;
        averageTime: number;
    };
    cache: {
        hits: number;
        misses: number;
        hitRate: number;
    };
}
export interface QueryOptimizationOptions {
    enableJoinOptimization?: boolean;
    enableQueryCaching?: boolean;
    batchSize?: number;
    maxIncludes?: number;
    cacheTTL?: number;
}
export interface TransactionOptions {
    timeout?: number;
    isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
    retryAttempts?: number;
    retryDelay?: number;
}
/**
 * Professional Database Manager
 */
export declare class ProfessionalDatabaseManager extends EventEmitter {
    private static instance;
    private prismaClient;
    private postgresPool;
    private redisClient;
    private mongooseConnection;
    private connectionConfig;
    private queryCache;
    private activeConnections;
    private queryMetrics;
    private optimizationOptions;
    private isShuttingDown;
    private constructor();
    /**
     * Singleton pattern implementation
     */
    static getInstance(config?: DatabaseConnectionConfig): ProfessionalDatabaseManager;
    /**
     * Initialize all database connections
     */
    initializeConnections(): Promise<void>;
    /**
     * Initialize Prisma client with optimization
     */
    private initializePrisma;
    /**
     * Initialize PostgreSQL connection pool
     */
    private initializePostgresPool;
    /**
     * Initialize Redis client
     */
    private initializeRedis;
    /**
     * Initialize MongoDB connection
     */
    private initializeMongoDB;
    /**
     * Optimized query execution with batching and caching
     */
    executeOptimizedQuery<T>(queryFn: (tx: PrismaClient) => Promise<T>, options?: QueryOptimizationOptions): Promise<T>;
    /**
     * Batch query execution to prevent N+1 problems
     */
    executeBatchQuery<T, K>(ids: K[], queryFn: (batchIds: K[]) => Promise<T[]>, batchSize?: number): Promise<T[]>;
    /**
     * Professional transaction management
     */
    executeTransaction<T>(transactionFn: (tx: PrismaClient) => Promise<T>, options?: TransactionOptions): Promise<T>;
    /**
     * Get database metrics and health status
     */
    getMetrics(): Promise<DatabaseMetrics>;
    /**
     * Clear query cache
     */
    clearQueryCache(): void;
    /**
     * Health check for all database connections
     */
    healthCheck(): Promise<{
        healthy: boolean;
        services: Record<string, boolean>;
        metrics: DatabaseMetrics;
    }>;
    /**
     * Graceful shutdown of all connections
     */
    shutdown(): Promise<void>;
    private buildPostgresUrl;
    private generateCacheKey;
    private setupGracefulShutdown;
}
export declare const createDatabaseManager: (config: DatabaseConnectionConfig) => ProfessionalDatabaseManager;
export declare const databaseManager: ProfessionalDatabaseManager;
export default databaseManager;
//# sourceMappingURL=professional-database-manager.d.ts.map