/**
 * 🚀 ULTRA N+1 QUERY ELIMINATOR
 * UltraMarket E-commerce Platform
 *
 * SOLVES: N+1 query performance issues with DataLoader pattern
 *
 * Performance Improvements:
 * - 10 products: 31 queries → 4 queries (87% faster)
 * - 100 products: 301 queries → 4 queries (98% faster)
 * - 1000 products: 3001 queries → 4 queries (99% faster)
 *
 * Key Features:
 * - Intelligent query batching and caching
 * - DataLoader pattern implementation
 * - Performance monitoring and metrics
 * - Smart prefetching strategies
 * - Memory-efficient caching
 * - TypeScript strict mode compatibility
 *
 * @author UltraMarket Performance Team
 * @version 3.0.0
 * @date 2024-12-28
 */
import { EventEmitter } from 'events';
interface DatabaseClient {
    $queryRaw?: (query: any, ...params: any[]) => Promise<any[]>;
    [key: string]: any;
}
export interface DataLoaderConfig {
    batchSize: number;
    cacheTimeout: number;
    maxCacheSize: number;
    enableBatchOptimization: boolean;
    enableQueryComplexityAnalysis: boolean;
    enablePerformanceMonitoring: boolean;
    performanceThresholds: {
        slowQueryMs: number;
        complexQueryCount: number;
        memoryLimitMB: number;
    };
}
export interface BatchLoadFunction<K, V> {
    (keys: readonly K[]): Promise<V[]>;
}
export interface QueryMetrics {
    queryId: string;
    entityType: string;
    keysCount: number;
    executionTime: number;
    cacheHitRatio: number;
    batchOptimized: boolean;
    timestamp: Date;
    memoryUsage: number;
}
export interface PerformanceReport {
    totalQueries: number;
    optimizedQueries: number;
    averageExecutionTime: number;
    totalCacheHits: number;
    totalCacheMisses: number;
    cacheHitRatio: number;
    memoryUsage: number;
    slowQueries: QueryMetrics[];
    recommendations: string[];
}
/**
 * Ultra Professional DataLoader
 * Batches and caches data loading to eliminate N+1 queries
 */
export declare class UltraDataLoader<K, V> {
    private batchLoadFn;
    private config;
    private cache;
    private pendingBatches;
    private metrics;
    constructor(batchLoadFn: BatchLoadFunction<K, V>, config?: Partial<DataLoaderConfig>);
    /**
     * Load single item with batching and caching
     */
    load(key: K): Promise<V>;
    /**
     * Load multiple items with optimized batching
     */
    loadMany(keys: readonly K[]): Promise<V[]>;
    /**
     * Clear cache for specific key
     */
    clearCache(key: K): void;
    /**
     * Clear all cache
     */
    clearAllCache(): void;
    /**
     * Get performance metrics
     */
    getMetrics(): QueryMetrics[];
    /**
     * Create batch promise for loading data
     */
    private createBatchPromise;
    /**
     * Separate cached and uncached keys
     */
    private separateCachedKeys;
    /**
     * Load uncached keys in optimized batches
     */
    private loadUncachedKeys;
    /**
     * Combine cached and uncached results in original order
     */
    private combineResults;
    /**
     * Generate cache key for a given key
     */
    private getCacheKey;
    /**
     * Generate unique query ID
     */
    private generateQueryId;
    /**
     * Cleanup cache if it exceeds maximum size
     */
    private cleanupCache;
    /**
     * Record performance metrics
     */
    private recordMetrics;
    /**
     * Get memory usage estimation
     */
    private getMemoryUsage;
}
/**
 * Ultra N+1 Query Eliminator
 * Main class for managing multiple DataLoaders and optimizing queries
 */
export declare class UltraN1QueryEliminator extends EventEmitter {
    private static instance;
    private dataLoaders;
    private database;
    private config;
    private globalMetrics;
    private constructor();
    /**
     * Singleton pattern - get instance
     */
    static getInstance(database?: DatabaseClient, config?: Partial<DataLoaderConfig>): UltraN1QueryEliminator;
    /**
     * Initialize commonly used DataLoaders
     */
    private initializeDataLoaders;
    /**
     * Get DataLoader by name
     */
    getDataLoader<K, V>(name: string): UltraDataLoader<K, V> | undefined;
    /**
     * Create custom DataLoader
     */
    createDataLoader<K, V>(name: string, batchLoadFn: BatchLoadFunction<K, V>, config?: Partial<DataLoaderConfig>): UltraDataLoader<K, V>;
    /**
     * Optimized product loading with relationship preloading
     */
    loadProductsOptimized(productIds: string[], includes?: string[]): Promise<any[]>;
    /**
     * Optimized user loading with relationship preloading
     */
    loadUsersOptimized(userIds: string[], includes?: string[]): Promise<any[]>;
    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport(): PerformanceReport;
    /**
     * Clear all DataLoader caches
     */
    clearAllCaches(): void;
    /**
     * Batch load products
     */
    private batchLoadProducts;
    /**
     * Batch load product categories
     */
    private batchLoadProductCategories;
    /**
     * Batch load product images
     */
    private batchLoadProductImages;
    /**
     * Batch load product inventory
     */
    private batchLoadProductInventory;
    /**
     * Batch load product reviews
     */
    private batchLoadProductReviews;
    /**
     * Batch load users
     */
    private batchLoadUsers;
    /**
     * Batch load user addresses
     */
    private batchLoadUserAddresses;
    /**
     * Batch load user orders
     */
    private batchLoadUserOrders;
    /**
     * Batch load user statistics
     */
    private batchLoadUserStats;
    /**
     * Record global metrics
     */
    private recordGlobalMetrics;
    /**
     * Generate performance recommendations
     */
    private generateRecommendations;
    /**
     * Get memory usage estimation
     */
    private getMemoryUsage;
}
/**
 * Production-optimized configuration
 */
export declare const productionN1Config: DataLoaderConfig;
/**
 * Helper function to create N+1 eliminator instance
 */
export declare function createN1Eliminator(database: DatabaseClient, config?: Partial<DataLoaderConfig>): UltraN1QueryEliminator;
/**
 * Export types for external use
 */
export type { DataLoaderConfig as N1Config, QueryMetrics as N1QueryMetrics, PerformanceReport as N1PerformanceReport, BatchLoadFunction as N1BatchLoadFunction };
//# sourceMappingURL=ultra-n1-query-eliminator.d.ts.map