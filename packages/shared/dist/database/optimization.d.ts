export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    poolMin?: number;
    poolMax?: number;
    poolIdle?: number;
    acquireTimeout?: number;
    timeout?: number;
}
export interface QueryMetrics {
    query: string;
    duration: number;
    timestamp: Date;
    rows?: number;
    cached?: boolean;
}
export declare class DatabaseOptimizer {
    private queryMetrics;
    private slowQueryThreshold;
    constructor(slowQueryThreshold?: number);
    /**
     * Monitor query performance
     */
    monitorQuery<T>(queryName: string, queryFn: () => Promise<T>, expectedRows?: number): Promise<T>;
    /**
     * Get query performance statistics
     */
    getQueryStats(): {
        totalQueries: number;
        averageDuration: number;
        slowQueries: number;
        slowestQueries: QueryMetrics[];
    };
    /**
     * Clear query metrics
     */
    clearMetrics(): void;
}
export declare class PostgreSQLOptimizer {
    /**
     * Generate index creation SQL for common patterns
     */
    static generateIndexes(): string[];
    /**
     * Generate database optimization queries
     */
    static generateOptimizationQueries(): string[];
    /**
     * Get slow query analysis
     */
    static getSlowQueryAnalysis(): string[];
}
export declare class MongoDBOptimizer {
    /**
     * Generate MongoDB indexes
     */
    static generateIndexes(): Array<{
        collection: string;
        index: object;
        options?: object;
    }>;
    /**
     * Generate aggregation pipeline optimizations
     */
    static getOptimizedAggregations(): Record<string, object[]>;
}
export declare class CacheOptimizer {
    private hitCount;
    private missCount;
    private totalRequests;
    /**
     * Track cache hit
     */
    trackHit(): void;
    /**
     * Track cache miss
     */
    trackMiss(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        hitRate: number;
        missRate: number;
        totalRequests: number;
        hitCount: number;
        missCount: number;
    };
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Generate cache keys
     */
    static generateCacheKey(prefix: string, params: Record<string, any>): string;
    /**
     * Cache TTL strategies
     */
    static getTTLStrategies(): Record<string, number>;
}
export declare class ConnectionPoolOptimizer {
    /**
     * Calculate optimal pool size based on system resources
     */
    static calculateOptimalPoolSize(): {
        min: number;
        max: number;
        idle: number;
        acquire: number;
    };
    /**
     * Monitor connection pool health
     */
    static monitorPoolHealth(poolStats: any): void;
}
declare const _default: {
    DatabaseOptimizer: typeof DatabaseOptimizer;
    PostgreSQLOptimizer: typeof PostgreSQLOptimizer;
    MongoDBOptimizer: typeof MongoDBOptimizer;
    CacheOptimizer: typeof CacheOptimizer;
    ConnectionPoolOptimizer: typeof ConnectionPoolOptimizer;
};
export default _default;
//# sourceMappingURL=optimization.d.ts.map