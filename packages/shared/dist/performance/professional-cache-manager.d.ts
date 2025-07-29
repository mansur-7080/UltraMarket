/**
 * ⚡ PROFESSIONAL CACHE MANAGER - ULTRAMARKET
 *
 * High-performance caching system with multiple layers
 * Solves performance bottlenecks across all microservices
 *
 * @author UltraMarket Development Team
 * @version 3.0.0
 * @date 2024-12-28
 */
import EventEmitter from 'events';
/**
 * Professional Cache Configuration Interface
 */
export interface CacheConfig {
    redis: {
        enabled: boolean;
        host: string;
        port: number;
        password?: string;
        database: number;
        keyPrefix: string;
        maxRetries: number;
        retryDelayOnFailover: number;
    };
    memory: {
        enabled: boolean;
        maxSize: number;
        maxItems: number;
        ttlMs: number;
        checkPeriodMs: number;
    };
    strategies: {
        defaultTTL: number;
        staleWhileRevalidate: boolean;
        compressionEnabled: boolean;
        serializationFormat: 'json' | 'msgpack' | 'binary';
    };
    monitoring: {
        metricsEnabled: boolean;
        slowQueryThreshold: number;
        alertOnHighMissRate: boolean;
        missRateThreshold: number;
    };
}
/**
 * Cache Statistics Interface
 */
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    hitRate: number;
    memoryUsage: number;
    itemCount: number;
    averageResponseTime: number;
    slowQueries: number;
}
/**
 * Cache Layer Types
 */
type CacheLayer = 'memory' | 'redis' | 'cdn' | 'database';
/**
 * Professional Multi-Layer Cache Manager
 */
export declare class ProfessionalCacheManager extends EventEmitter {
    private static instance;
    private config;
    private memoryCache;
    private redisClient;
    private stats;
    private compressionThreshold;
    private lastCleanup;
    private constructor();
    static getInstance(config?: CacheConfig): ProfessionalCacheManager;
    /**
     * Professional cache GET with fallback layers
     */
    get<T>(key: string, options?: {
        layer?: CacheLayer;
        fallbackToOtherLayers?: boolean;
        deserialize?: boolean;
    }): Promise<T | null>;
    /**
     * Professional cache SET with automatic layer distribution
     */
    set<T>(key: string, value: T, options?: {
        ttl?: number;
        tags?: string[];
        layer?: CacheLayer | CacheLayer[];
        compress?: boolean;
    }): Promise<boolean>;
    /**
     * Professional cache invalidation with tag-based clearing
     */
    invalidate(pattern: string | string[], options?: {
        byTags?: boolean;
        layer?: CacheLayer | CacheLayer[];
    }): Promise<number>;
    /**
     * Professional cache warming with batch operations
     */
    warm(entries: Array<{
        key: string;
        value: any;
        ttl?: number;
        tags?: string[];
    }>, options?: {
        concurrency?: number;
        layer?: CacheLayer | CacheLayer[];
        skipExisting?: boolean;
    }): Promise<{
        success: number;
        failed: number;
        skipped: number;
    }>;
    /**
     * Professional cache-aside pattern with automatic refresh
     */
    getOrSet<T>(key: string, factory: () => Promise<T>, options?: {
        ttl?: number;
        tags?: string[];
        staleWhileRevalidate?: boolean;
        layer?: CacheLayer | CacheLayer[];
    }): Promise<T>;
    /**
     * Get comprehensive cache statistics
     */
    getStats(): CacheStats & {
        memorySize: number;
        redisConnected: boolean;
        uptime: number;
    };
    /**
     * Professional cache health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        details: {
            memory: {
                healthy: boolean;
                usage: number;
                itemCount: number;
            };
            redis: {
                healthy: boolean;
                connected: boolean;
                responseTime?: number;
            };
        };
    }>;
    private setupMemoryCache;
    private setupRedisCache;
    private setupMonitoring;
    private getFromMemory;
    private setInMemory;
    private getFromRedis;
    private setInRedis;
    private invalidateFromMemory;
    private invalidateFromRedis;
    private getEntryFromMemory;
    private isStale;
    private refreshInBackground;
    private normalizeKey;
    private serializeValue;
    private deserializeValue;
    private getValueSize;
    private calculateMemoryUsage;
    private evictLRU;
    private cleanupExpiredEntries;
    private createBatches;
    private initializeStats;
    private updateStats;
}
/**
 * Create default cache configuration
 */
export declare const createDefaultCacheConfig: () => CacheConfig;
export declare const professionalCache: ProfessionalCacheManager;
export declare const cacheGet: <T>(key: string, options?: any) => Promise<T | null>;
export declare const cacheSet: <T>(key: string, value: T, options?: any) => Promise<boolean>;
export declare const cacheInvalidate: (pattern: string | string[], options?: any) => Promise<number>;
export declare const cacheGetOrSet: <T>(key: string, factory: () => Promise<T>, options?: any) => Promise<T>;
export {};
//# sourceMappingURL=professional-cache-manager.d.ts.map