export declare class RedisService {
    private client;
    constructor();
    setRefreshToken(userId: string, token: string): Promise<void>;
    getRefreshToken(userId: string): Promise<string | null>;
    removeRefreshToken(userId: string): Promise<void>;
    invalidateUserTokens(userId: string): Promise<void>;
    setUserSession(sessionId: string, userData: Record<string, unknown>): Promise<void>;
    getUserSession(sessionId: string): Promise<Record<string, unknown> | null>;
    removeUserSession(sessionId: string): Promise<void>;
    setRateLimit(key: string, limit: number, window: number): Promise<void>;
    getRateLimit(key: string): Promise<number>;
    decrementRateLimit(key: string): Promise<number>;
    setCache(key: string, data: unknown, ttl?: number): Promise<void>;
    getCache<T>(key: string): Promise<T | null>;
    removeCache(key: string): Promise<void>;
    clearCacheByPattern(pattern: string): Promise<void>;
    setUserPreferences(userId: string, preferences: Record<string, unknown>): Promise<void>;
    getUserPreferences(userId: string): Promise<Record<string, unknown> | null>;
    setTempData(key: string, data: unknown, ttl?: number): Promise<void>;
    getTempData<T>(key: string): Promise<T | null>;
    getStats(): Promise<Record<string, unknown>>;
    healthCheck(): Promise<boolean>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=redis.service.d.ts.map