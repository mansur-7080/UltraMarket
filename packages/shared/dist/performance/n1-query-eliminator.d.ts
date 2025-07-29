/**
 * Ultra-Professional N+1 Query Eliminator
 *
 * Professional solution for eliminating N+1 query problems in Product and User services.
 * This system provides advanced query optimization patterns including DataLoader,
 * batch loading, eager loading, and query plan optimization.
 *
 * Key Features:
 * - DataLoader pattern for batch loading
 * - Query complexity analysis and optimization
 * - Automatic relationship preloading
 * - Performance monitoring and metrics
 * - SQL query optimization
 * - Cache-aware query planning
 *
 * @author UltraMarket Performance Team
 * @version 1.0.0
 */
interface DatabaseClient {
    $queryRaw: (query: any, ...params: any[]) => Promise<any[]>;
    $disconnect: () => Promise<void>;
    [key: string]: any;
}
interface OptimizationConfig {
    batchSize: number;
    cacheTimeout: number;
    maxQueryDepth: number;
    enableAutoPreload: boolean;
    enableBatchOptimization: boolean;
    enableQueryComplexityAnalysis: boolean;
    performanceThresholds: {
        slowQueryMs: number;
        complexQueryCount: number;
        memoryLimitMB: number;
    };
}
export declare class N1QueryEliminator {
    private prisma;
    private dataLoaders;
    private queryMetrics;
    private config;
    constructor(prisma: DatabaseClient, config?: Partial<OptimizationConfig>);
    /**
     * Initialize DataLoaders for common entities
     */
    private initializeDataLoaders;
    /**
     * Optimized Product loading with relationship preloading
     */
    loadProductsOptimized(productIds: string[], includes?: string[]): Promise<any[]>;
    /**
     * Optimized User loading with relationship preloading
     */
    loadUsersOptimized(userIds: string[], includes?: string[]): Promise<any[]>;
    /**
     * Smart query optimization based on query patterns
     */
    optimizeQuery<T>(entityType: 'product' | 'user', query: any, options?: {
        preload?: string[];
        batchSize?: number;
        enableCaching?: boolean;
    }): Promise<T[]>;
    /**
     * Analyze query complexity and suggest optimizations
     */
    private analyzeQueryComplexity;
    /**
     * Extract entity IDs from query for batch loading
     */
    private extractEntityIds;
    /**
     * Execute standard query without optimization
     */
    private executeStandardQuery;
    /**
     * Helper function to map results to keys
     */
    private mapResultsToKeys;
    /**
     * Helper function to group results by key
     */
    private groupResultsByKey;
    /**
     * Record query metrics for performance monitoring
     */
    private recordQueryMetrics;
    /**
     * Get cache hit statistics
     */
    private getCacheHits;
    /**
     * Get cache miss statistics
     */
    private getCacheMisses;
    /**
     * Get performance metrics and statistics
     */
    getPerformanceReport(): {
        totalQueries: number;
        averageExecutionTime: number;
        slowQueries: number;
        cacheHitRatio: number;
        optimizationCoverage: number;
        recommendations: string[];
    };
    /**
     * Clear all caches and reset metrics
     */
    clearCaches(): void;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export declare function createN1QueryEliminator(prisma: DatabaseClient, config?: Partial<OptimizationConfig>): N1QueryEliminator;
export declare const defaultN1Config: OptimizationConfig;
export default N1QueryEliminator;
//# sourceMappingURL=n1-query-eliminator.d.ts.map