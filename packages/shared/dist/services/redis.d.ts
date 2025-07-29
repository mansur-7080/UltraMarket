/**
 * Redis Service for UltraMarket
 * Handles caching, session management, and other Redis operations
 */
import Redis from 'ioredis';
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
}
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}
export interface SessionData {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    lastActivity: number;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class RedisService {
    private client;
    private config;
    private defaultTTL;
    constructor();
    /**
     * Setup Redis event handlers
     */
    private setupEventHandlers;
    /**
     * Get Redis client instance
     */
    getClient(): Redis;
    /**
     * Set cache value
     */
    set(key: string, value: any, options?: CacheOptions): Promise<void>;
    /**
     * Get cache value
     */
    get<T = any>(key: string, options?: CacheOptions): Promise<T | null>;
    /**
     * Delete cache value
     */
    del(key: string, options?: CacheOptions): Promise<number>;
    /**
     * Check if key exists
     */
    exists(key: string, options?: CacheOptions): Promise<boolean>;
    /**
     * Set cache value with expiration
     */
    setex(key: string, seconds: number, value: any, options?: CacheOptions): Promise<void>;
    /**
     * Get cache TTL
     */
    ttl(key: string, options?: CacheOptions): Promise<number>;
    /**
     * Increment counter
     */
    incr(key: string, options?: CacheOptions): Promise<number>;
    /**
     * Decrement counter
     */
    decr(key: string, options?: CacheOptions): Promise<number>;
    /**
     * Set hash field
     */
    hset(key: string, field: string, value: any, options?: CacheOptions): Promise<number>;
    /**
     * Get hash field
     */
    hget<T = any>(key: string, field: string, options?: CacheOptions): Promise<T | null>;
    /**
     * Get all hash fields
     */
    hgetall<T = Record<string, any>>(key: string, options?: CacheOptions): Promise<T | null>;
    /**
     * Delete hash field
     */
    hdel(key: string, field: string, options?: CacheOptions): Promise<number>;
    /**
     * Add to set
     */
    sadd(key: string, member: string, options?: CacheOptions): Promise<number>;
    /**
     * Get set members
     */
    smembers(key: string, options?: CacheOptions): Promise<string[]>;
    /**
     * Remove from set
     */
    srem(key: string, member: string, options?: CacheOptions): Promise<number>;
    /**
     * Check if member exists in set
     */
    sismember(key: string, member: string, options?: CacheOptions): Promise<boolean>;
    /**
     * Store session data
     */
    setSession(sessionId: string, sessionData: SessionData, ttl?: number): Promise<void>;
    /**
     * Get session data
     */
    getSession(sessionId: string): Promise<SessionData | null>;
    /**
     * Delete session
     */
    deleteSession(sessionId: string): Promise<void>;
    /**
     * Get user sessions
     */
    getUserSessions(userId: string): Promise<string[]>;
    /**
     * Delete all user sessions
     */
    deleteUserSessions(userId: string): Promise<void>;
    /**
     * Check rate limit
     */
    checkRateLimit(key: string, limit: number, window: number): Promise<{
        allowed: boolean;
        remaining: number;
        reset: number;
    }>;
    /**
     * Clear cache by pattern
     */
    clearCache(pattern: string): Promise<number>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<{
        totalKeys: number;
        memoryUsage: string;
        connectedClients: number;
    }>;
    /**
     * Health check
     */
    healthCheck(): Promise<boolean>;
    /**
     * Close Redis connection
     */
    close(): Promise<void>;
}
//# sourceMappingURL=redis.d.ts.map