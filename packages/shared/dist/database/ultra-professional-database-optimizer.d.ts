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
import { PoolConfig } from 'pg';
import { MongoClientOptions } from 'mongodb';
import { RedisClientType } from 'redis';
export interface DatabaseConfig {
    postgres: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl?: boolean;
        poolConfig: PoolConfig;
    };
    mongodb: {
        uri: string;
        database: string;
        options: MongoClientOptions;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
        maxRetriesPerRequest: number;
    };
}
export interface QueryMetrics {
    queryId: string;
    query: string;
    executionTime: number;
    database: 'postgres' | 'mongodb' | 'redis';
    rowsAffected?: number;
    planCost?: number;
    indexesUsed: string[];
    timestamp: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface ConnectionPoolStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingCount: number;
    poolSize: number;
    maxPoolSize: number;
    averageWaitTime: number;
    connectionLeaks: number;
}
export interface DatabaseHealth {
    postgres: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;
        connectionPool: ConnectionPoolStats;
        slowQueries: number;
        lockingQueries: number;
    };
    mongodb: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;
        connectionPool: ConnectionPoolStats;
        indexHitRatio: number;
        collectionStats: Array<{
            collection: string;
            size: number;
            indexCount: number;
        }>;
    };
    redis: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;
        memoryUsage: number;
        keyspaceHits: number;
        keyspaceMisses: number;
        connectedClients: number;
    };
}
export interface OptimizationSuggestion {
    id: string;
    type: 'index' | 'query' | 'schema' | 'configuration';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    database: string;
    table?: string;
    description: string;
    suggestion: string;
    estimatedImpact: 'low' | 'medium' | 'high';
    sqlCommand?: string;
    implemented: boolean;
    createdAt: Date;
}
/**
 * Ultra Professional Database Optimizer
 */
export declare class UltraProfessionalDatabaseOptimizer {
    private config;
    private postgresPool;
    private mongoClient;
    private mongoDb;
    private redisClient;
    private queryMetrics;
    private optimizationSuggestions;
    private healthChecks;
    private performanceThresholds;
    constructor(config: DatabaseConfig);
    /**
     * Initialize database connections with optimized pool settings
     */
    private initializeConnections;
    /**
     * Execute optimized PostgreSQL query with monitoring
     */
    executePostgresQuery<T = any>(query: string, params?: any[], options?: {
        timeout?: number;
        priority?: 'low' | 'medium' | 'high';
    }): Promise<T>;
    /**
     * Execute optimized MongoDB operation with monitoring
     */
    executeMongoOperation<T = any>(collection: string, operation: (coll: any) => Promise<T>, options?: {
        timeout?: number;
        readPreference?: string;
    }): Promise<T>;
    /**
     * Execute Redis operation with monitoring
     */
    executeRedisOperation<T = any>(operation: (client: RedisClientType) => Promise<T>, operationName?: string): Promise<T>;
    /**
     * Start real-time performance monitoring
     */
    private startPerformanceMonitoring;
    /**
     * Start health check monitoring
     */
    private startHealthChecks;
    /**
     * Initialize optimization engine
     */
    private initializeOptimizationEngine;
    /**
     * Collect comprehensive performance metrics
     */
    private collectPerformanceMetrics;
    /**
     * Analyze performance patterns for optimization opportunities
     */
    private analyzePerformancePatterns;
    /**
     * Perform comprehensive health checks
     */
    private performHealthChecks;
    /**
     * Generate optimization suggestions based on metrics
     */
    private generateOptimizationSuggestions;
    /**
     * Execute automatic optimizations for safe improvements
     */
    private executeAutoOptimizations;
    /**
     * Get database performance metrics
     */
    getPerformanceMetrics(): {
        queries: QueryMetrics[];
        suggestions: OptimizationSuggestion[];
        health: DatabaseHealth | null;
        connectionPools: {
            postgres: ConnectionPoolStats;
            mongodb: ConnectionPoolStats;
            redis: {
                connectedClients: number;
            };
        };
    };
    /**
     * Helper methods
     */
    private generateQueryId;
    private categorizeQuerySeverity;
    private recordQueryMetrics;
    private extractIndexesFromPlan;
    private getRecentMetrics;
    private identifyQueryPatterns;
    private detectN1QueryProblems;
    private detectMissingIndexes;
    private detectUnusedIndexes;
    private parseRedisInfo;
    private determineHealthStatus;
    private checkPerformanceThresholds;
    private checkHealthAlerts;
    private cleanupOldMetrics;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export declare const createDatabaseOptimizer: (config: DatabaseConfig) => UltraProfessionalDatabaseOptimizer;
export default UltraProfessionalDatabaseOptimizer;
//# sourceMappingURL=ultra-professional-database-optimizer.d.ts.map