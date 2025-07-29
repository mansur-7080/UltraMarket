/**
 * UltraMarket Cache Service
 * Professional Redis-based caching with comprehensive error handling
 */
export interface CacheConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
    lazyConnect?: boolean;
    keepAlive?: number;
    connectTimeout?: number;
    commandTimeout?: number;
}
export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    tags?: string[];
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    hitRate: number;
    totalOperations: number;
    uptime: number;
}
export interface CacheEntry<T = unknown> {
    value: T;
    timestamp: number;
    ttl: number;
    tags?: string[];
    compressed?: boolean;
}
export declare class CacheService {
    private redis;
    private config;
    private stats;
    private isConnected;
    private connectionPromise;
    constructor(config?: Partial<CacheConfig>);
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get<T = unknown>(key: string): Promise<T | null>;
    set<T = unknown>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    clear(): Promise<boolean>;
    mget<T = unknown>(keys: string[]): Promise<Array<T | null>>;
    mset<T = unknown>(entries: Array<{
        key: string;
        value: T;
        options?: CacheOptions;
    }>): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    deleteByPattern(pattern: string): Promise<number>;
    increment(key: string, amount?: number): Promise<number>;
    decrement(key: string, amount?: number): Promise<number>;
    getStats(): CacheStats;
    private updateStats;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: Record<string, unknown>;
    }>;
}
export declare const cacheService: CacheService;
declare const _default: {
    CacheService: typeof CacheService;
    cacheService: CacheService;
};
export default _default;
//# sourceMappingURL=cache.d.ts.map