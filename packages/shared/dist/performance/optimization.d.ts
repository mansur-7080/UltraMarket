/**
 * Performance Optimization Utilities
 * Advanced performance monitoring and optimization tools for UltraMarket
 */
import { Redis } from 'ioredis';
export interface PerformanceMetrics {
    timestamp: number;
    operation: string;
    duration: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
    cacheHit: boolean;
    queryCount: number;
    dbResponseTime?: number;
}
export interface CacheConfig {
    ttl: number;
    maxSize?: number;
    enableCompression?: boolean;
    namespace?: string;
}
export interface QueryOptimizationResult {
    optimizedQuery: string;
    suggestions: string[];
    estimatedPerformanceGain: number;
}
export declare class AdvancedCache {
    private redis;
    private hitCount;
    private missCount;
    private compressionEnabled;
    private namespace;
    constructor(redisInstance: Redis, namespace?: string, compressionEnabled?: boolean);
    private getKey;
    private compress;
    private decompress;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(): Promise<void>;
    getHitRate(): number;
    getStats(): {
        hits: number;
        misses: number;
        hitRate: number;
        namespace: string;
        compressionEnabled: boolean;
    };
    resetStats(): void;
}
export declare class QueryOptimizer {
    private queryPatterns;
    private slowQueries;
    analyzeQuery(query: string): QueryOptimizationResult;
    private optimizeQuery;
    recordSlowQuery(query: string, duration: number): void;
    private extractQueryPattern;
    getSlowQueries(limit?: number): {
        query: string;
        duration: number;
        timestamp: number;
    }[];
    getQueryPatterns(): [string, number][];
}
export declare class PerformanceMonitor {
    private metrics;
    private memoryPool;
    private readonly maxMetrics;
    constructor();
    startMeasurement(operation: string): () => PerformanceMetrics;
    private recordMetric;
    getMetrics(operation?: string): PerformanceMetrics[];
    getAverageMetrics(operation?: string): Partial<PerformanceMetrics>;
    getSlowestOperations(limit?: number): PerformanceMetrics[];
    clearMetrics(): void;
    getMemoryPoolStats(): {
        poolSize: number;
        activeMetrics: number;
        maxMetrics: number;
    };
}
export declare class BatchProcessor<T, R> {
    private batch;
    private readonly batchSize;
    private readonly batchTimeout;
    private timer;
    private processor;
    constructor(processor: (items: T[]) => Promise<R[]>, batchSize?: number, batchTimeout?: number);
    add(item: T): Promise<R>;
    private flush;
    finish(): Promise<void>;
    getCurrentBatchSize(): number;
}
export declare class ConnectionPoolManager {
    private pools;
    private poolConfigs;
    createPool<T>(name: string, factory: () => T, destroyer: (connection: T) => void, config: {
        min: number;
        max: number;
        acquireTimeoutMillis: number;
        idleTimeoutMillis: number;
    }): void;
    acquire<T>(poolName: string): Promise<T>;
    release<T>(poolName: string, connection: T): void;
    getPoolStats(poolName: string): {
        available: any;
        active: any;
        total: any;
        config: any;
    } | null;
    getAllPoolStats(): Record<string, any>;
    closePool(poolName: string): Promise<void>;
    closeAllPools(): Promise<void>;
}
export declare const performanceMonitor: PerformanceMonitor;
export declare const queryOptimizer: QueryOptimizer;
export declare const connectionPoolManager: ConnectionPoolManager;
export declare function withPerformanceMonitoring<T extends any[], R>(operation: string, fn: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
export declare function withCaching<T extends any[], R>(cache: AdvancedCache, keyGenerator: (...args: T) => string, ttl: number, fn: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
export declare function debounce<T extends any[]>(fn: (...args: T) => void, delay: number): (...args: T) => void;
export declare function throttle<T extends any[]>(fn: (...args: T) => void, limit: number): (...args: T) => void;
//# sourceMappingURL=optimization.d.ts.map