/**
 * 🗄️ Ultra Professional Database Connection Manager
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha database connections ni professional tarzda manage qiladi
 * va optimal performance, security va reliability ni ta'minlaydi
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { Db, MongoClientOptions } from 'mongodb';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
/**
 * 📊 Database Connection Status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
/**
 * 🔧 Database Configuration
 */
export interface UltraDatabaseConfig {
    postgres: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl: boolean;
        poolMin: number;
        poolMax: number;
        connectionTimeout: number;
        idleTimeout: number;
        maxRetries: number;
        retryDelay: number;
    };
    mongodb: {
        uri: string;
        database: string;
        options: MongoClientOptions;
        maxPoolSize: number;
        minPoolSize: number;
        maxIdleTimeMS: number;
        serverSelectionTimeoutMS: number;
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
    };
    prisma: {
        datasourceUrl: string;
        log: string[];
        errorFormat: 'pretty' | 'colorless' | 'minimal';
        transactionOptions: {
            maxWait: number;
            timeout: number;
            isolationLevel: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
        };
    };
    general: {
        enableHealthChecks: boolean;
        healthCheckInterval: number;
        enableMetrics: boolean;
        enableConnectionPooling: boolean;
        enableQueryLogging: boolean;
        enablePerformanceMonitoring: boolean;
        gracefulShutdownTimeout: number;
    };
}
/**
 * 📈 Database Metrics
 */
export interface DatabaseMetrics {
    postgres: {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        waitingClients: number;
        totalQueries: number;
        averageQueryTime: number;
        slowQueries: number;
        errors: number;
    };
    mongodb: {
        totalConnections: number;
        availableConnections: number;
        createdConnections: number;
        destroyedConnections: number;
        totalCommands: number;
        commandsPerSecond: number;
        averageCommandTime: number;
        errors: number;
    };
    redis: {
        totalConnections: number;
        connectedClients: number;
        blockedClients: number;
        totalCommands: number;
        commandsPerSecond: number;
        memoryUsage: number;
        keyspaceHits: number;
        keyspaceMisses: number;
        errors: number;
    };
}
/**
 * 🚨 Database Errors
 */
export declare class UltraDatabaseError extends Error {
    readonly database: 'postgres' | 'mongodb' | 'redis' | 'prisma';
    readonly operation: string;
    readonly originalError?: Error | undefined;
    constructor(message: string, database: 'postgres' | 'mongodb' | 'redis' | 'prisma', operation: string, originalError?: Error | undefined);
}
export declare class ConnectionError extends UltraDatabaseError {
    constructor(database: 'postgres' | 'mongodb' | 'redis' | 'prisma', originalError?: Error);
}
export declare class QueryError extends UltraDatabaseError {
    constructor(database: 'postgres' | 'mongodb' | 'redis' | 'prisma', query: string, originalError?: Error);
}
export declare class TransactionError extends UltraDatabaseError {
    constructor(database: 'postgres' | 'mongodb' | 'redis' | 'prisma', originalError?: Error);
}
/**
 * 🏭 Ultra Professional Database Connection Manager
 */
export declare class UltraProfessionalDatabaseManager extends EventEmitter {
    private config;
    private prismaClient;
    private postgresPool;
    private mongoClient;
    private mongoDb;
    private redisClient;
    private connectionStatus;
    private metrics;
    private healthCheckInterval;
    private isShuttingDown;
    constructor(config?: Partial<UltraDatabaseConfig>);
    /**
     * 🎭 Setup event listeners
     */
    private setupEventListeners;
    /**
     * ⏰ Start health checks
     */
    private startHealthChecks;
    /**
     * 🏥 Perform health checks
     */
    private performHealthChecks;
    /**
     * 🚀 Initialize all database connections
     */
    initialize(): Promise<void>;
    /**
     * 🎯 Initialize Prisma client
     */
    private initializePrisma;
    /**
     * 🐘 Initialize PostgreSQL connection pool
     */
    private initializePostgres;
    /**
     * 🍃 Initialize MongoDB connection
     */
    private initializeMongoDB;
    /**
     * 🔴 Initialize Redis connection
     */
    private initializeRedis;
    /**
     * 🎯 Get Prisma client
     */
    getPrismaClient(): PrismaClient;
    /**
     * 🐘 Get PostgreSQL pool
     */
    getPostgresPool(): Pool;
    /**
     * 🍃 Get MongoDB database
     */
    getMongoDb(): Db;
    /**
     * 🔴 Get Redis client
     */
    getRedisClient(): Redis;
    /**
     * 🏥 Health check methods
     */
    private checkPrismaHealth;
    private checkPostgresHealth;
    private checkMongoHealth;
    private checkRedisHealth;
    /**
     * 📊 Get connection status
     */
    getConnectionStatus(): {
        postgres: ConnectionStatus;
        mongodb: ConnectionStatus;
        redis: ConnectionStatus;
        prisma: ConnectionStatus;
    };
    /**
     * 📈 Get metrics
     */
    getMetrics(): DatabaseMetrics;
    /**
     * 🏥 Get health status
     */
    getHealthStatus(): Promise<{
        prisma: boolean;
        postgres: boolean;
        mongodb: boolean;
        redis: boolean;
        overall: boolean;
    }>;
    /**
     * 🧹 Graceful shutdown
     */
    gracefulShutdown(signal?: string): Promise<void>;
}
/**
 * 🌟 Global Database Manager Instance
 */
export declare const ultraDatabaseManager: UltraProfessionalDatabaseManager;
export default ultraDatabaseManager;
//# sourceMappingURL=ultra-professional-connection-manager.d.ts.map