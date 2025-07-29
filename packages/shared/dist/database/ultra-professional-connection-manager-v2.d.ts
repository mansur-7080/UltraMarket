/**
 * 🚀 ULTRA PROFESSIONAL DATABASE CONNECTION MANAGER V2
 * UltraMarket E-commerce Platform
 *
 * SOLVES: Critical connection pool issues (120+ connections → 20 max)
 *
 * Key Features:
 * - Centralized connection management across all microservices
 * - Intelligent connection pooling with auto-scaling
 * - Connection leak detection and prevention
 * - Performance monitoring and optimization
 * - Professional error handling and recovery
 * - TypeScript strict mode compatibility
 *
 * @author UltraMarket Database Team
 * @version 2.0.0
 * @date 2024-12-28
 */
type PrismaClient = any;
type Pool = any;
type Db = any;
type RedisClientType = any;
import { EventEmitter } from 'events';
export interface DatabaseConnectionConfig {
    postgres: {
        connectionString: string;
        poolMin: number;
        poolMax: number;
        acquireTimeoutMillis: number;
        idleTimeoutMillis: number;
        connectionTimeoutMillis: number;
        ssl?: boolean;
        host?: string;
        port?: number;
        database?: string;
        username?: string;
        password?: string;
    };
    mongodb: {
        uri: string;
        database: string;
        maxPoolSize: number;
        minPoolSize: number;
        maxIdleTimeMS: number;
        serverSelectionTimeoutMS: number;
        connectTimeoutMS: number;
        socketTimeoutMS: number;
    };
    redis: {
        url: string;
        host?: string;
        port?: number;
        password?: string;
        db?: number;
        keyPrefix?: string;
        maxRetriesPerRequest?: number;
        retryDelayOnFailover?: number;
        enableOfflineQueue?: boolean;
        lazyConnect?: boolean;
        connectTimeout?: number;
        commandTimeout?: number;
    };
    general: {
        enableHealthChecks: boolean;
        healthCheckInterval: number;
        enableMetrics: boolean;
        enableConnectionPooling: boolean;
        gracefulShutdownTimeout: number;
        maxRetries: number;
        retryDelay: number;
    };
}
export interface ConnectionMetrics {
    postgres: {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        waitingConnections: number;
        connectionErrors: number;
        queryCount: number;
        averageQueryTime: number;
        slowQueries: number;
    };
    mongodb: {
        totalConnections: number;
        activeConnections: number;
        connectionErrors: number;
        operationCount: number;
        averageOperationTime: number;
        slowOperations: number;
    };
    redis: {
        totalConnections: number;
        connectionErrors: number;
        commandCount: number;
        averageCommandTime: number;
        cacheHitRatio: number;
        memoryUsage: number;
    };
}
export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    details: Record<string, any>;
    timestamp: Date;
}
/**
 * Ultra Professional Database Connection Manager
 * Centralized connection management for all UltraMarket services
 */
export declare class UltraProfessionalConnectionManager extends EventEmitter {
    private static instance;
    private config;
    private prismaClient;
    private postgresPool;
    private mongoClient;
    private mongoDb;
    private redisClient;
    private connectionStatus;
    private metrics;
    private healthCheckInterval;
    private metricsInterval;
    private constructor();
    /**
     * Singleton pattern - get instance
     */
    static getInstance(config?: DatabaseConnectionConfig): UltraProfessionalConnectionManager;
    /**
     * Initialize all database connections
     */
    private initialize;
    /**
     * Initialize PostgreSQL with optimized pool settings
     */
    private initializePostgres;
    /**
     * Initialize MongoDB with optimized settings
     */
    private initializeMongoDB;
    /**
     * Initialize Redis with optimized settings
     */
    private initializeRedis;
    /**
     * Setup PostgreSQL event listeners for monitoring
     */
    private setupPostgresEventListeners;
    /**
     * Setup MongoDB event listeners for monitoring
     */
    private setupMongoEventListeners;
    /**
     * Setup Redis event listeners for monitoring
     */
    private setupRedisEventListeners;
    /**
     * Update average query time
     */
    private updateAverageQueryTime;
    /**
     * Start health checks
     */
    private startHealthChecks;
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
    /**
     * Perform health checks for all connections
     */
    private performHealthChecks;
    /**
     * Collect and emit metrics
     */
    private collectMetrics;
    /**
     * Setup graceful shutdown
     */
    private setupGracefulShutdown;
    /**
     * Get Prisma client instance
     */
    getPrismaClient(): PrismaClient;
    /**
     * Get PostgreSQL pool instance
     */
    getPostgresPool(): Pool;
    /**
     * Get MongoDB database instance
     */
    getMongoDb(): Db;
    /**
     * Get Redis client instance
     */
    getRedisClient(): RedisClientType;
    /**
     * Get connection status
     */
    getConnectionStatus(): {
        postgres: "connecting" | "connected" | "disconnected" | "error";
        mongodb: "connecting" | "connected" | "disconnected" | "error";
        redis: "connecting" | "connected" | "disconnected" | "error";
    };
    /**
     * Get metrics
     */
    getMetrics(): ConnectionMetrics;
    /**
     * Disconnect all connections
     */
    disconnect(): Promise<void>;
}
/**
 * Production-optimized configuration
 */
export declare const productionDatabaseConfig: DatabaseConnectionConfig;
/**
 * Create and export singleton instance
 */
export declare const ultraDatabaseManager: UltraProfessionalConnectionManager;
/**
 * Helper function to get database manager instance
 */
export declare function getDatabaseManager(): UltraProfessionalConnectionManager;
/**
 * Helper functions for getting specific database instances
 */
export declare function getPrismaClient(): PrismaClient;
export declare function getPostgresPool(): Pool;
export declare function getMongoDb(): Db;
export declare function getRedisClient(): RedisClientType;
/**
 * Export types for external use
 */
export type { DatabaseConnectionConfig as DbConnectionConfig, ConnectionMetrics as DbConnectionMetrics, HealthCheckResult as DbHealthCheckResult };
//# sourceMappingURL=ultra-professional-connection-manager-v2.d.ts.map