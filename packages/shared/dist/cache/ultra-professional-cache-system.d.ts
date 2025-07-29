/**
 * 🚀 ULTRA PROFESSIONAL CACHE SYSTEM
 * UltraMarket E-commerce Platform
 *
 * Advanced caching system featuring:
 * - Multi-tier caching (L1: Memory, L2: Redis, L3: Database)
 * - Intelligent cache invalidation and dependency tracking
 * - Cache warming and preloading strategies
 * - Performance monitoring and analytics
 * - Distributed cache coordination
 * - Cache compression and serialization optimization
 * - TTL management and smart expiration
 * - Cache hit/miss ratio optimization
 * - Background cache refresh
 * - Circuit breaker pattern for cache failures
 *
 * @author UltraMarket Caching Team
 * @version 6.0.0
 * @date 2024-12-28
 */
import { EventEmitter } from 'events';
export interface CacheConfig {
    enabled: boolean;
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
        keyPrefix: string;
        maxRetries: number;
        retryDelayOnFailover: number;
        enableOfflineQueue: boolean;
        connectTimeout: number;
        commandTimeout: number;
        lazyConnect: boolean;
        keepAlive: boolean;
        family: 4 | 6;
    };
    memory: {
        enabled: boolean;
        maxSize: number;
        maxItems: number;
        ttlCheckInterval: number;
        deleteOnExpire: boolean;
    };
    compression: {
        enabled: boolean;
        algorithm: 'gzip' | 'deflate' | 'brotli';
        threshold: number;
        level: number;
    };
    performance: {
        enableMetrics: boolean;
        metricsInterval: number;
        backgroundRefresh: boolean;
        prefetchThreshold: number;
        circuitBreakerThreshold: number;
        circuitBreakerTimeout: number;
    };
    defaultTTL: {
        memory: number;
        redis: number;
        longTerm: number;
        shortTerm: number;
    };
    serialization: {
        format: 'json' | 'msgpack' | 'protobuf';
        enableTypePreservation: boolean;
    };
}
export interface CacheItem<T = any> {
    key: string;
    value: T;
    ttl: number;
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    size: number;
    compressed: boolean;
    tags: string[];
    dependencies: string[];
    version: string;
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    errors: number;
    totalRequests: number;
    hitRatio: number;
    averageResponseTime: number;
    memoryUsage: number;
    redisConnections: number;
    lastReset: Date;
    memory: {
        hits: number;
        misses: number;
        size: number;
        items: number;
    };
    redis: {
        hits: number;
        misses: number;
        connections: number;
        commandsProcessed: number;
    };
}
export interface CacheStrategy {
    name: string;
    description: string;
    ttl: number;
    tier: 'memory' | 'redis' | 'both';
    compression: boolean;
    tags: string[];
    dependencies: string[];
    backgroundRefresh: boolean;
    preloadOnStartup: boolean;
}
export interface InvalidationRule {
    pattern: string;
    tags: string[];
    dependencies: string[];
    cascade: boolean;
}
/**
 * Ultra Professional Cache System
 */
export declare class UltraProfessionalCacheSystem extends EventEmitter {
    private config;
    private redisClient;
    private memoryCache;
    private circuitBreaker;
    private metrics;
    private strategies;
    private invalidationRules;
    private backgroundTasks;
    private gzipAsync;
    private gunzipAsync;
    private deflateAsync;
    private inflateAsync;
    constructor(config: CacheConfig);
    /**
     * Initialize cache components
     */
    private initializeComponents;
    /**
     * Set cache value with intelligent tiering
     */
    set<T>(key: string, value: T, options?: {
        ttl?: number;
        strategy?: string;
        tags?: string[];
        dependencies?: string[];
        tier?: 'memory' | 'redis' | 'both';
        compression?: boolean;
    }): Promise<void>;
    /**
     * Get cache value with intelligent fallback
     */
    get<T>(key: string, options?: {
        strategy?: string;
        refreshIfNearExpiry?: boolean;
    }): Promise<T | null>;
    /**
     * Delete cache entry
     */
    delete(key: string): Promise<boolean>;
    /**
     * Invalidate cache by pattern or tags
     */
    invalidate(options: {
        pattern?: string;
        tags?: string[];
        dependencies?: string[];
        cascade?: boolean;
    }): Promise<number>;
    /**
     * Get or set pattern (cache-aside)
     */
    getOrSet<T>(key: string, factory: () => Promise<T>, options?: {
        ttl?: number;
        strategy?: string;
        tags?: string[];
        dependencies?: string[];
    }): Promise<T>;
    /**
     * Warm cache with predefined data
     */
    warmCache(warmers: Array<{
        key: string;
        factory: () => Promise<any>;
        options?: any;
    }>): Promise<void>;
    /**
     * Get cache statistics
     */
    getMetrics(): CacheMetrics & {
        circuitBreaker: any;
        memoryStats: any;
    };
    /**
     * Initialize default caching strategies
     */
    private initializeDefaultStrategies;
    /**
     * Start background tasks
     */
    private startBackgroundTasks;
    /**
     * Helper methods
     */
    private shouldCompress;
    private serialize;
    private deserialize;
    private compress;
    private decompress;
    private updateAverageResponseTime;
    private reportMetrics;
    private performBackgroundRefresh;
    /**
     * Shutdown cache system
     */
    shutdown(): Promise<void>;
}
export declare const createCacheSystem: (config: CacheConfig) => UltraProfessionalCacheSystem;
export declare const CacheKeys: {
    user: (id: string) => string;
    userSession: (id: string) => string;
    userProfile: (id: string) => string;
    product: (id: string) => string;
    productList: (filters: string) => string;
    category: (id: string) => string;
    search: (query: string, filters: string) => string;
    cart: (userId: string) => string;
    order: (id: string) => string;
    userOrders: (userId: string) => string;
    analytics: (type: string, period: string) => string;
    config: (key: string) => string;
    static: (path: string) => string;
};
export default UltraProfessionalCacheSystem;
//# sourceMappingURL=ultra-professional-cache-system.d.ts.map