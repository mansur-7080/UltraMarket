/**
 * Professional Cache Management System
 * High-performance caching with Redis, in-memory, and distributed caching
 */
import { EventEmitter } from 'events';
export interface CacheConfig {
    defaultTTL: number;
    maxSize: number;
    enableMetrics: boolean;
    compression: boolean;
    serialization: 'json' | 'msgpack' | 'none';
    namespace: string;
}
export interface CacheItem<T = unknown> {
    key: string;
    value: T;
    ttl: number;
    createdAt: Date;
    expiresAt: Date;
    hits: number;
    size: number;
    tags: string[];
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    totalSize: number;
    hitRate: number;
    averageResponseTime: number;
}
export interface CacheStrategy {
    name: string;
    shouldCache: (key: string, value: unknown) => boolean;
    getTTL: (key: string, value: unknown) => number;
    getKey: (originalKey: string, context?: unknown) => string;
}
export declare class CacheManager extends EventEmitter {
    private config;
    private cache;
    private redisClient;
    private metrics;
    private responseTimes;
    private cleanupInterval;
    constructor(config: CacheConfig, redisClient?: unknown);
    /**
     * Get value from cache
     */
    get<T = unknown>(key: string): Promise<T | null>;
    /**
     * Set value in cache
     */
    set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>;
    /**
     * Delete value from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clear all cache
     */
    clear(): Promise<void>;
    /**
     * Get or set with function
     */
    getOrSet<T = unknown>(key: string, fn: () => Promise<T> | T, ttl?: number): Promise<T>;
    /**
     * Get multiple keys
     */
    getMany<T = unknown>(keys: string[]): Promise<(T | null)[]>;
    /**
     * Set multiple key-value pairs
     */
    setMany<T = unknown>(items: Array<{
        key: string;
        value: T;
        ttl?: number;
    }>): Promise<void>;
    /**
     * Delete multiple keys
     */
    deleteMany(keys: string[]): Promise<number>;
    /**
     * Get keys by pattern
     */
    getKeys(pattern: string): Promise<string[]>;
    /**
     * Delete keys by pattern
     */
    deleteByPattern(pattern: string): Promise<number>;
    /**
     * Get cache statistics
     */
    getMetrics(): CacheMetrics;
    /**
     * Warm up cache with data
     */
    warmUp(data: Array<{
        key: string;
        value: unknown;
        ttl?: number;
    }>): Promise<void>;
    /**
     * Invalidate cache by tags
     */
    invalidateByTags(tags: string[]): Promise<number>;
    private setMemory;
    private evictLRU;
    private isExpired;
    private getFullKey;
    private serialize;
    private deserialize;
    private getSize;
    private getTotalSize;
    private recordHit;
    private recordMiss;
    private recordResponseTime;
    private resetMetrics;
    private matchPattern;
    private chunkArray;
    private startCleanupInterval;
    private cleanupExpired;
    /**
     * Shutdown cache manager
     */
    shutdown(): void;
}
export declare const cacheStrategies: {
    /**
     * Cache everything strategy
     */
    cacheAll: {
        name: string;
        shouldCache: () => boolean;
        getTTL: (_key: string, _value: unknown) => number;
        getKey: (originalKey: string) => string;
    };
    /**
     * Cache only successful results
     */
    cacheSuccess: {
        name: string;
        shouldCache: (_key: string, value: unknown) => boolean;
        getTTL: (_key: string, _value: unknown) => number;
        getKey: (originalKey: string) => string;
    };
    /**
     * Cache with user context
     */
    cacheByUser: {
        name: string;
        shouldCache: () => boolean;
        getTTL: (_key: string, _value: unknown) => number;
        getKey: (originalKey: string, context?: unknown) => string;
    };
    /**
     * Cache expensive operations longer
     */
    cacheExpensive: {
        name: string;
        shouldCache: (_key: string, value: unknown) => boolean;
        getTTL: (_key: string, _value: unknown) => number;
        getKey: (originalKey: string) => string;
    };
};
/**
 * Cache method decorator
 */
export declare function Cacheable(options: {
    key?: string;
    ttl?: number;
    strategy?: CacheStrategy;
    tags?: string[];
}): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Create cache manager instance
 */
export declare function createCacheManager(config: Partial<CacheConfig>, redisClient?: unknown): CacheManager;
/**
 * Cache key generator
 */
export declare function generateCacheKey(parts: (string | number)[]): string;
/**
 * Cache warming utility
 */
export declare function warmCache(cacheManager: CacheManager, dataLoader: () => Promise<Array<{
    key: string;
    value: unknown;
    ttl?: number;
}>>): Promise<void>;
declare const _default: {
    CacheManager: typeof CacheManager;
    createCacheManager: typeof createCacheManager;
    cacheStrategies: {
        /**
         * Cache everything strategy
         */
        cacheAll: {
            name: string;
            shouldCache: () => boolean;
            getTTL: (_key: string, _value: unknown) => number;
            getKey: (originalKey: string) => string;
        };
        /**
         * Cache only successful results
         */
        cacheSuccess: {
            name: string;
            shouldCache: (_key: string, value: unknown) => boolean;
            getTTL: (_key: string, _value: unknown) => number;
            getKey: (originalKey: string) => string;
        };
        /**
         * Cache with user context
         */
        cacheByUser: {
            name: string;
            shouldCache: () => boolean;
            getTTL: (_key: string, _value: unknown) => number;
            getKey: (originalKey: string, context?: unknown) => string;
        };
        /**
         * Cache expensive operations longer
         */
        cacheExpensive: {
            name: string;
            shouldCache: (_key: string, value: unknown) => boolean;
            getTTL: (_key: string, _value: unknown) => number;
            getKey: (originalKey: string) => string;
        };
    };
    Cacheable: typeof Cacheable;
    generateCacheKey: typeof generateCacheKey;
    warmCache: typeof warmCache;
};
export default _default;
//# sourceMappingURL=cache-manager.d.ts.map