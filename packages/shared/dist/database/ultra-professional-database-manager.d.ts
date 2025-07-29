/**
 * 🗄️ ULTRA PROFESSIONAL DATABASE MANAGER
 * UltraMarket E-commerce Platform
 *
 * Solves critical database issues:
 * - Connection pool leaks (120+ connection limit problem)
 * - N+1 query optimization
 * - Professional connection management
 * - Health monitoring and auto-recovery
 * - Performance optimization
 * - Transaction management
 *
 * @author UltraMarket Database Team
 * @version 3.0.0
 * @date 2024-12-28
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { Connection } from 'mongoose';
import { Redis } from 'ioredis';
import EventEmitter from 'events';
export interface DatabaseConfig {
    postgres: {
        connectionString: string;
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl: boolean;
        poolMin: number;
        poolMax: number;
        acquireTimeoutMillis: number;
        idleTimeoutMillis: number;
        evictionRunIntervalMillis: number;
        connectionTimeoutMillis: number;
        statementTimeoutMs: number;
        queryTimeoutMs: number;
    };
    mongodb: {
        uri: string;
        database: string;
        maxPoolSize: number;
        minPoolSize: number;
        maxIdleTimeMS: number;
        serverSelectionTimeoutMS: number;
        socketTimeoutMS: number;
        connectTimeoutMS: number;
        heartbeatFrequencyMS: number;
        retryWrites: boolean;
        retryReads: boolean;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
        keyPrefix: string;
        maxRetriesPerRequest: number;
        retryDelayOnFailover: number;
        enableOfflineQueue: boolean;
        lazyConnect: boolean;
        keepAlive: number;
        family: 4 | 6;
        connectTimeout: number;
        commandTimeout: number;
        maxMemoryPolicy: string;
    };
    general: {
        enableHealthChecks: boolean;
        healthCheckInterval: number;
        enableMetrics: boolean;
        enableQueryLogging: boolean;
        enableSlowQueryLogging: boolean;
        slowQueryThreshold: number;
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
        errors: number;
        slowQueries: number;
        averageQueryTime: number;
    };
    mongodb: {
        totalConnections: number;
        availableConnections: number;
        checkedOutConnections: number;
        errors: number;
        slowQueries: number;
        averageQueryTime: number;
    };
    redis: {
        totalConnections: number;
        usedMemory: number;
        connectedClients: number;
        commandsProcessed: number;
        errors: number;
        averageResponseTime: number;
    };
}
export interface HealthStatus {
    postgres: 'healthy' | 'degraded' | 'unhealthy';
    mongodb: 'healthy' | 'degraded' | 'unhealthy';
    redis: 'healthy' | 'degraded' | 'unhealthy';
    overall: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    uptime: number;
}
export interface QueryResult<T = any> {
    data: T;
    executionTime: number;
    fromCache: boolean;
    queryHash: string;
    affectedRows?: number;
}
export interface TransactionOptions {
    isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
    timeout?: number;
    retries?: number;
    readOnly?: boolean;
}
/**
 * Ultra Professional Database Manager
 */
export declare class UltraProfessionalDatabaseManager extends EventEmitter {
    private static instance;
    private config;
    private prismaClient?;
    private postgresPool?;
    private mongooseConnection?;
    private redisClient?;
    private redisCluster?;
    private connectionStatus;
    private metrics;
    private healthCheckInterval?;
    private isShuttingDown;
    private activeConnections;
    constructor(config?: Partial<DatabaseConfig>);
    /**
     * Singleton instance with professional configuration
     */
    static getInstance(config?: Partial<DatabaseConfig>): UltraProfessionalDatabaseManager;
    /**
     * Merge configuration with professional defaults
     */
    private mergeWithDefaults;
    /**
     * Initialize all database connections
     */
    initialize(): Promise<void>;
    /**
     * 🐘 Initialize PostgreSQL connection pool with optimized settings
     */
    private initializePostgres;
    /**
     * 🔧 Initialize Prisma with optimized connection settings
     */
    private initializePrisma;
    /**
     * 🍃 Initialize MongoDB with optimized settings
     */
    private initializeMongoDB;
    /**
     * 🔴 Initialize Redis with cluster support
     */
    private initializeRedis;
    /**
     * Get optimized Prisma client instance
     */
    getPrisma(): PrismaClient;
    /**
     * Get optimized PostgreSQL pool
     */
    getPostgresPool(): Pool;
    /**
     * Get MongoDB connection
     */
    getMongoDB(): Connection;
    /**
     * Get Redis client
     */
    getRedis(): Redis;
    /**
     * Execute PostgreSQL query with connection management
     */
    executePostgresQuery<T = any>(query: string, params?: any[], options?: {
        timeout?: number;
        retries?: number;
    }): Promise<QueryResult<T>>;
    /**
     * Execute transaction with optimized settings
     */
    executeTransaction<T>(callback: (prisma: PrismaClient) => Promise<T>, options?: TransactionOptions): Promise<T>;
    /**
     * Get comprehensive health status
     */
    getHealthStatus(): Promise<HealthStatus>;
    /**
     * Get current connection metrics
     */
    getMetrics(): ConnectionMetrics;
    /**
     * Graceful shutdown of all connections
     */
    shutdown(): Promise<void>;
    private checkPostgresHealth;
    private checkMongoDBHealth;
    private checkRedisHealth;
    private startHealthChecks;
    private startMetricsCollection;
    private setupGracefulShutdown;
    private updateAverageQueryTime;
    private generateQueryHash;
    private isRetryableError;
    private delay;
}
export declare const databaseManager: UltraProfessionalDatabaseManager;
//# sourceMappingURL=ultra-professional-database-manager.d.ts.map