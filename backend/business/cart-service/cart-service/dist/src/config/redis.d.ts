import Redis from 'ioredis';
export declare const redisClient: Redis;
export declare const getRedisClient: () => Redis;
export declare const redisUtils: {
    ping(): Promise<boolean>;
    getInfo(): Promise<any>;
    getMemoryUsage(): Promise<any>;
    flushDb(): Promise<boolean>;
    getStatus(): string;
    close(): Promise<void>;
};
export default redisClient;
//# sourceMappingURL=redis.d.ts.map