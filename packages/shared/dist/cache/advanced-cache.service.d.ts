import { Redis } from 'ioredis';
interface CacheConfig {
    ttl: number;
    maxSize?: number;
    compression?: boolean;
    encryption?: boolean;
    tags?: string[];
    dependencies?: string[];
    priority?: 'low' | 'medium' | 'high';
    refreshStrategy?: 'lazy' | 'proactive' | 'background';
}
interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    totalSize: number;
    memoryUsage: number;
    operations: {
        get: number;
        set: number;
        delete: number;
        invalidate: number;
    };
}
export declare class AdvancedCacheService {
    private readonly logger;
    private redis;
    private memoryCache;
    private readonly layers;
    private stats;
    private readonly invalidationPatterns;
    private readonly tagDependencies;
    /**
     * Enhanced monitoring system for cache performance and health
     * This collects detailed metrics about cache usage patterns
     */
    private monitoringSystem;
    constructor(redis?: Redis);
    /**
     * Get value from cache with multi-layer support
     */
    /**
     * Get value from cache with multi-layer support, optimized error handling and telemetry
     * @param key - The cache key
     * @param config - Optional cache configuration
     * @returns The cached value or null if not found
     */
    get<T>(key: string, config?: Partial<CacheConfig>): Promise<T | null>;
    /**
     * Set value in cache with multi-layer support
     */
    set<T>(key: string, value: T, config?: CacheConfig): Promise<void>;
    /**
     * Delete specific key from cache
     */
    delete(key: string): Promise<void>;
    /**
     * Get or set pattern (cache-aside)
     */
    getOrSet<T>(key: string, factory: () => Promise<T>, config?: CacheConfig): Promise<T>;
    /**
     * Invalidate cache by tags
     */
    invalidateByTags(tags: string[]): Promise<void>;
    /**
     * Delete a specific cache entry
     * @param key Cache key to delete
     * @returns Success status
     */
    del(key: string): Promise<boolean>;
    /**
     * Invalidate cache by pattern (legacy method)
     */
    invalidateByPattern(pattern: string): Promise<void>;
    /**
     * Warm up cache with data
     */
    warmUp(data: Array<{
        key: string;
        value: any;
        config?: CacheConfig;
    }>): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Get cache health status
     */
    getCacheHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        layers: Array<{
            name: string;
            status: string;
            latency: number;
        }>;
        recommendations: string[];
    }>;
    /**
     * Optimize cache performance
     */
    optimizeCache(): Promise<{
        optimized: boolean;
        actions: string[];
        improvements: Record<string, number>;
    }>;
    /**
     * Clear all cache
     */
    clear(): Promise<void>;
    private initializeMemoryCache;
    private initializeCacheLayers;
    private setupInvalidationPatterns;
    private startBackgroundTasks;
    private buildCacheKey;
    private getFromMemoryCache;
    private setToMemoryCache;
    private deleteFromMemoryCache;
    private getFromRedisCache;
    private setToRedisCache;
    private deleteFromRedisCache;
    private processValueForStorage;
    private processValueFromStorage;
    /**
     * Calculate the approximate size of a value in bytes
     * Used for memory usage estimation and monitoring
     * @param value The value to measure
     * @returns Approximate size in bytes
     */
    private calculateSize;
    /**
     * Advanced compression with adaptive algorithm selection
     * Uses different compression methods based on data characteristics
     * @param value Value to compress
     * @returns Compressed value as string
     */
    private compressValue;
    /**
     * Advanced decompression with algorithm detection
     * Automatically detects and applies the appropriate decompression method
     * @param value Compressed value string
     * @returns Original value
     */
    private decompressValue;
    /**
     * Advanced encryption for sensitive cache data
     * Uses AES-256-GCM with authentication and integrity verification
     * @param value Value to encrypt
     * @returns Encrypted value as string
     */
    private encryptValue;
    /**
     * Advanced decryption for cached data
     * Handles authentication and integrity verification
     * @param value Encrypted value string
     * @returns Original decrypted value
     */
    private decryptValue;
    private updateTagDependencies;
    private updateKeyDependencies;
    private cleanupDependencies;
    private updateHitRate;
    private getMemoryUsage;
    private getTotalCacheSize;
    private checkMemoryCacheHealth;
    private checkRedisCacheHealth;
    private generateRecommendations;
    private cleanExpiredEntries;
    private compressLargeValues;
    private optimizeMemoryCache;
    private updateCacheStrategies;
    private updateStatistics;
    /**
     * Advanced cache invalidation strategy implementation
     * Supports pattern-based invalidation, tag-based invalidation, and dependency chains
     */
    private implementAdvancedInvalidationStrategy;
    /**
     * Setup pattern-based cache invalidation
     * This allows invalidating multiple cache entries using wildcard patterns
     */
    private setupPatternBasedInvalidation;
    /**
     * Setup tag-based cache invalidation
     * This allows grouping cache entries by tags and invalidating them together
     */
    private setupTagBasedInvalidation;
    /**
     * Setup dependency tracking between cache entries
     * When a parent entry is invalidated, all dependent entries are also invalidated
     */
    private setupDependencyTracking;
    /**
     * Subscribe to Redis invalidation channel for distributed cache invalidation
     * This allows cache invalidation across multiple instances of the application
     */
    private subscribeToInvalidationChannel;
    /**
     * Publish invalidation command to Redis for distributed invalidation
     */
    private publishInvalidationCommand;
    /**
     * Convert glob pattern to regular expression
     * For example: user:* becomes ^user:.*$
     */
    private globToRegExp;
    /**
     * Invalidate cache entries by tag
     * @param tag The tag to invalidate
     */
    invalidateByTag(tag: string): Promise<number>;
    /**
     * Circuit breaker implementation to prevent cascading failures
     * when Redis or other external cache services are experiencing issues
     */
    private readonly circuitBreaker;
    /**
     * Enhanced error handling for cache operations
     * Provides consistent error logging and circuit breaker integration
     * @param operation Cache operation name
     * @param key Cache key
     * @param action Function to execute
     * @param fallback Optional fallback function if the operation fails
     */
    private executeWithErrorHandling;
    /**
     * Graceful cache degradation strategy
     * Implements fallback mechanisms when primary cache layer fails
     * @param key Cache key
     * @param config Optional cache configuration
     */
    private getWithGracefulDegradation;
}
export {};
//# sourceMappingURL=advanced-cache.service.d.ts.map