import Redis from 'ioredis';
export interface CacheConfig {
    ttl: number;
    prefix?: string;
    serialize?: boolean;
    compress?: boolean;
}
export interface CacheStore {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(pattern?: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
}
export declare class RedisCacheStore implements CacheStore {
    private redis;
    private prefix;
    constructor(redisInstance?: Redis, prefix?: string);
    private getKey;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(pattern?: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
}
export declare class MemoryCacheStore implements CacheStore {
    private cache;
    private prefix;
    private cleanupInterval;
    constructor(prefix?: string, cleanupIntervalMs?: number);
    private getKey;
    private cleanup;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(pattern?: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    destroy(): void;
}
export declare class CacheManager {
    private stores;
    private defaultStore;
    private hitCount;
    private missCount;
    constructor(defaultStore?: string);
    /**
     * Add cache store
     */
    addStore(name: string, store: CacheStore): void;
    /**
     * Get cache store
     */
    getStore(name?: string): CacheStore;
    /**
     * Get value from cache with fallback
     */
    get<T>(key: string, fallbackFn?: () => Promise<T>, options?: {
        store?: string;
        ttl?: number;
    }): Promise<T | null>;
    /**
     * Set value in cache
     */
    set<T>(key: string, value: T, ttl?: number, storeName?: string): Promise<void>;
    /**
     * Delete value from cache
     */
    del(key: string, storeName?: string): Promise<void>;
    /**
     * Clear cache
     */
    clear(pattern?: string, storeName?: string): Promise<void>;
    /**
     * Check if key exists
     */
    exists(key: string, storeName?: string): Promise<boolean>;
    /**
     * Get TTL for key
     */
    ttl(key: string, storeName?: string): Promise<number>;
    /**
     * Wrap function with caching
     */
    wrap<T>(key: string, fn: () => Promise<T>, options?: {
        ttl?: number;
        store?: string;
    }): Promise<T | null>;
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
}
export declare class CacheKeyGenerator {
    /**
     * Generate user-specific cache key
     */
    static user(userId: string, suffix?: string): string;
    /**
     * Generate product cache key
     */
    static product(productId: string, suffix?: string): string;
    /**
     * Generate category cache key
     */
    static category(categoryId: string, suffix?: string): string;
    /**
     * Generate search cache key
     */
    static search(query: string, filters?: Record<string, any>): string;
    /**
     * Generate cart cache key
     */
    static cart(userId: string): string;
    /**
     * Generate session cache key
     */
    static session(sessionId: string): string;
    /**
     * Generate API response cache key
     */
    static apiResponse(endpoint: string, params?: Record<string, any>): string;
}
export declare const CacheTTL: {
    VERY_SHORT: number;
    SHORT: number;
    MEDIUM: number;
    LONG: number;
    VERY_LONG: number;
    USER_SESSION: number;
    CART_ITEMS: number;
    PRODUCT_DETAILS: number;
    CATEGORY_LIST: number;
    SEARCH_RESULTS: number;
    API_RESPONSE: number;
    STATIC_CONTENT: number;
};
export declare const createCacheManager: () => CacheManager;
export declare const cacheManager: CacheManager;
export default cacheManager;
//# sourceMappingURL=cache-manager.d.ts.map