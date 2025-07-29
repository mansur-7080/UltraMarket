/**
 * ⚡ COMPREHENSIVE PERFORMANCE OPTIMIZER - UltraMarket
 *
 * Advanced caching, query optimization, resource management
 * Complete performance monitoring va optimization system
 *
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */
import { Request, Response, NextFunction } from 'express';
export interface CacheOptions {
    ttl?: number;
    checkPeriod?: number;
    useClones?: boolean;
    deleteOnExpire?: boolean;
    enableLegacyCallbacks?: boolean;
    maxKeys?: number;
    maxMemoryPolicy?: 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu';
}
export interface PerformanceMetrics {
    responseTime: {
        avg: number;
        min: number;
        max: number;
        p95: number;
        p99: number;
    };
    cache: {
        hitRate: number;
        missRate: number;
        totalRequests: number;
        hits: number;
        misses: number;
    };
    memory: {
        used: number;
        free: number;
        total: number;
        percentage: number;
    };
    database: {
        activeConnections: number;
        slowQueries: number;
        averageQueryTime: number;
    };
    requests: {
        total: number;
        perSecond: number;
        errors: number;
        errorRate: number;
    };
}
export interface CompressionOptions {
    threshold: number;
    level: number;
    filter: (req: Request, res: Response) => boolean;
}
export interface QueryOptimizationOptions {
    enablePagination?: boolean;
    defaultLimit?: number;
    maxLimit?: number;
    enableSelect?: boolean;
    enableInclude?: boolean;
    maxIncludes?: number;
    enableBatching?: boolean;
    batchSize?: number;
}
/**
 * Multi-layer caching system
 */
export declare class MultiLayerCache {
    private memoryCache;
    private redisCache;
    private cacheStats;
    constructor(options?: CacheOptions, redisUrl?: string);
    private initializeRedisCache;
    /**
     * Get value from cache (L1 first, then L2)
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set value in both cache layers
     */
    set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
    /**
     * Delete from both cache layers
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clear all cache layers
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): typeof this.cacheStats & {
        hitRate: number;
        keys: number;
    };
    private sanitizeKey;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
/**
 * Performance monitoring system
 */
export declare class PerformanceMonitor {
    private metrics;
    private readonly maxResponseTimes;
    /**
     * Record request start time
     */
    recordRequestStart(req: Request): void;
    /**
     * Record request completion
     */
    recordRequestEnd(req: Request, res: Response): void;
    /**
     * Get performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
}
/**
 * Professional Performance Optimizer
 */
export declare class ProfessionalPerformanceOptimizer {
    private cache;
    private monitor;
    private isOptimizationEnabled;
    constructor(cacheOptions?: CacheOptions, redisUrl?: string);
    /**
     * Caching middleware for Express
     */
    cacheMiddleware(options?: {
        ttl?: number;
        keyGenerator?: (req: Request) => string;
        condition?: (req: Request) => boolean;
    }): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Performance monitoring middleware
     */
    monitoringMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Response compression middleware with optimization
     */
    compressionMiddleware(options?: Partial<CompressionOptions>): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Query optimization helper
     */
    optimizeQuery<T>(baseQuery: any, options?: QueryOptimizationOptions & {
        req?: Request;
        defaultFields?: string[];
    }): any;
    /**
     * Get comprehensive performance metrics
     */
    getMetrics(): Promise<PerformanceMetrics>;
    /**
     * Enable/disable optimization
     */
    toggleOptimization(enabled: boolean): void;
    /**
     * Clear all caches
     */
    clearCaches(): Promise<void>;
    /**
     * Reset performance metrics
     */
    resetMetrics(): void;
    /**
     * Get cache instance for manual operations
     */
    getCache(): MultiLayerCache;
    /**
     * Health check for performance system
     */
    healthCheck(): Promise<{
        healthy: boolean;
        metrics: PerformanceMetrics;
        issues: string[];
    }>;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export declare const createPerformanceOptimizer: (cacheOptions?: CacheOptions, redisUrl?: string) => ProfessionalPerformanceOptimizer;
export declare const performanceOptimizer: ProfessionalPerformanceOptimizer;
export declare const cacheMiddleware: (options?: Parameters<ProfessionalPerformanceOptimizer["cacheMiddleware"]>[0]) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const monitoringMiddleware: () => (req: Request, res: Response, next: NextFunction) => void;
export declare const compressionMiddleware: (options?: Partial<CompressionOptions>) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const setupPerformanceMiddleware: (app: any) => void;
export default ProfessionalPerformanceOptimizer;
//# sourceMappingURL=comprehensive-performance-optimizer.d.ts.map