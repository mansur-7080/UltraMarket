/**
 * 🚀 ULTRA PROFESSIONAL QUERY OPTIMIZER
 * UltraMarket E-commerce Platform
 *
 * Solves N+1 query problems with:
 * - Intelligent query batching and caching
 * - DataLoader pattern implementation
 * - Database query optimization
 * - Performance monitoring and metrics
 * - Smart prefetching strategies
 * - Connection pool optimization
 * - Query result caching
 *
 * @author UltraMarket Performance Team
 * @version 3.0.0
 * @date 2024-12-28
 */
export interface QueryBatch<K, V> {
    keys: K[];
    batchFunction: (keys: K[]) => Promise<V[]>;
    keyExtractor: (result: V) => K;
    maxBatchSize?: number;
    cacheKeyPrefix?: string;
    cacheTTL?: number;
}
export interface DataLoaderOptions<K, V> {
    batch?: boolean;
    cache?: boolean;
    cacheKeyFn?: (key: K) => string;
    cacheMap?: Map<string, Promise<V>>;
    maxBatchSize?: number;
    batchScheduleFn?: (callback: () => void) => void;
    name?: string;
}
export interface QueryMetrics {
    queryCount: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    cacheHits: number;
    cacheMisses: number;
    batchedQueries: number;
    n1Problems: number;
    lastReset: Date;
}
export interface OptimizationStrategy {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    apply: (query: string, params?: any[]) => Promise<any>;
    metrics: {
        applied: number;
        successful: number;
        timeSaved: number;
    };
}
export interface RelationshipMapping {
    entity: string;
    field: string;
    relationType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    targetEntity: string;
    foreignKey: string;
    loadStrategy: 'eager' | 'lazy' | 'batch';
    cacheable: boolean;
}
/**
 * Ultra Professional DataLoader Implementation
 */
export declare class UltraProfessionalDataLoader<K, V> {
    private batchFn;
    private options;
    private promiseCache;
    private batchQueue;
    private batchPromise;
    private batchCallbacks;
    constructor(batchFn: (keys: K[]) => Promise<V[]>, options?: DataLoaderOptions<K, V>);
    /**
     * Load single value with batching
     */
    load(key: K): Promise<V>;
    /**
     * Load multiple values with batching
     */
    loadMany(keys: K[]): Promise<V[]>;
    /**
     * Load with intelligent batching
     */
    private loadWithBatching;
    /**
     * Execute batch query
     */
    private executeBatch;
    /**
     * Get cache key for value
     */
    private getCacheKey;
    /**
     * Split array into chunks
     */
    private chunkArray;
    /**
     * Clear cache
     */
    clearAll(): void;
    /**
     * Clear specific cache entry
     */
    clear(key: K): void;
}
/**
 * Ultra Professional Query Optimizer
 */
export declare class UltraProfessionalQueryOptimizer {
    private dataLoaders;
    private queryMetrics;
    private optimizationStrategies;
    private relationshipMappings;
    private queryCache;
    constructor();
    /**
     * Initialize optimization strategies
     */
    private initializeOptimizationStrategies;
    /**
     * Initialize default relationship mappings
     */
    private initializeDefaultRelationships;
    /**
     * Create DataLoader for specific entity
     */
    createDataLoader<K, V>(name: string, batchFunction: (keys: K[]) => Promise<V[]>, options?: Partial<DataLoaderOptions<K, V>>): UltraProfessionalDataLoader<K, V>;
    /**
     * Get existing DataLoader
     */
    getDataLoader<K, V>(name: string): UltraProfessionalDataLoader<K, V> | null;
    /**
     * Batch user data loading
     */
    private batchUserData;
    /**
     * Batch product data loading
     */
    private batchProductData;
    /**
     * Batch order data loading
     */
    private batchOrderData;
    /**
     * Intelligent query caching
     */
    private cacheQuery;
    /**
     * Generate cache key for query
     */
    private generateCacheKey;
    /**
     * Calculate cache TTL based on query type
     */
    private calculateCacheTTL;
    /**
     * Update strategy metrics
     */
    private updateStrategyMetrics;
    /**
     * Detect N+1 query problems
     */
    detectN1Problems(queryPattern: string, executionCount: number): boolean;
    /**
     * Optimize query with available strategies
     */
    optimizeQuery(entityType: string, query: string, params?: any[]): Promise<any>;
    /**
     * Clear all caches
     */
    clearAllCaches(): void;
    /**
     * Get performance metrics
     */
    getMetrics(): QueryMetrics & {
        strategies: Array<{
            id: string;
            name: string;
            enabled: boolean;
            metrics: {
                applied: number;
                successful: number;
                timeSaved: number;
            };
        }>;
    };
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
    /**
     * Reset metrics
     */
    private resetMetrics;
}
export declare const createUserLoader: (optimizer: UltraProfessionalQueryOptimizer) => UltraProfessionalDataLoader<string, any>;
export declare const createProductLoader: (optimizer: UltraProfessionalQueryOptimizer) => UltraProfessionalDataLoader<string, any>;
export declare const createOrderLoader: (optimizer: UltraProfessionalQueryOptimizer) => UltraProfessionalDataLoader<string, any>;
export declare const queryOptimizer: UltraProfessionalQueryOptimizer;
export default UltraProfessionalQueryOptimizer;
//# sourceMappingURL=ultra-professional-query-optimizer.d.ts.map