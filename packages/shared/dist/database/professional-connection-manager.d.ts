/**
 * Professional Database Connection Management System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl database connection leaks va transaction issues ni hal qilish uchun
 */
import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import mongoose from 'mongoose';
import { Pool, PoolClient } from 'pg';
import EventEmitter from 'events';
export interface DatabaseConnectionConfig {
    postgres: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
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
export declare class DatabaseConnectionManager extends EventEmitter {
    private static instance;
    private prismaClient;
    private postgresPool;
    private redisClient;
    private mongooseConnection;
    private connectionConfig;
    private isShuttingDown;
    private activeConnections;
    private constructor();
    static getInstance(config?: DatabaseConnectionConfig): DatabaseConnectionManager;
    getPrismaClient(): Promise<PrismaClient>;
    getPostgresPool(): Promise<Pool>;
    getRedisClient(): Promise<RedisClientType>;
    getMongooseConnection(): Promise<typeof mongoose>;
    executeTransaction<T>(operation: (prisma: PrismaClient) => Promise<T>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    }): Promise<T>;
    executePostgresTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T>;
    checkConnectionHealth(): Promise<{
        prisma: boolean;
        postgres: boolean;
        redis: boolean;
        mongodb: boolean;
        overall: boolean;
    }>;
    getConnectionStats(): {
        activeConnections: string[];
        totalConnections: number;
        isShuttingDown: boolean;
        postgresPoolStats: {
            totalCount: number;
            idleCount: number;
            waitingCount: number;
        } | null;
        mongooseConnectionState: {
            readyState: mongoose.ConnectionStates;
            name: string;
            host: string;
            port: number;
        } | null;
    };
    shutdown(force?: boolean): Promise<void>;
    private buildPostgresUrl;
    private setupGracefulShutdown;
}
export declare const createDatabaseManager: (config: DatabaseConnectionConfig) => DatabaseConnectionManager;
export declare const connectionHealthMiddleware: (dbManager: DatabaseConnectionManager) => (req: any, res: any, next: any) => Promise<any>;
//# sourceMappingURL=professional-connection-manager.d.ts.map