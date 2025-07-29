/**
 * Advanced Performance Optimization System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl N+1 queries, caching, va database optimization issues ni hal qilish uchun
 */
import Redis from 'redis';
export interface CacheConfig {
    redis: {
        url: string;
        prefix: string;
        defaultTTL: number;
    };
    queryOptimization: {
        batchSize: number;
        maxIncludes: number;
        enableEagerLoading: boolean;
    };
}
export declare class AdvancedPerformanceOptimizer {
    private prisma;
    private redis;
    private config;
    private queryTracker;
    constructor(prisma: any, redisClient: Redis.RedisClientType, config: CacheConfig);
    getProductsWithRelations(filters?: ProductFilters): Promise<EnrichedProduct[]>;
    getCachedData<T>(key: string, fetchFunction: () => Promise<T>, ttl?: number): Promise<T>;
    batchCreateProducts(productsData: CreateProductData[]): Promise<BatchResult<Product>>;
    optimizeQuery<T>(queryName: string, queryFunction: () => Promise<T>, options?: QueryOptimizationOptions): Promise<T>;
    monitorDatabasePerformance(): Promise<PerformanceMetrics>;
    invalidateProductCache(productId?: string): Promise<void>;
    private enrichProduct;
    private buildProductFilters;
    private buildProductOrderBy;
    private trackQuery;
    private getConnectionMetrics;
    private getQueryMetrics;
    private getCacheMetrics;
    private formatPrice;
    private sleep;
}
interface ProductFilters {
    category?: string;
    vendorId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'price' | 'rating' | 'popularity' | 'newest';
    sortOrder?: 'asc' | 'desc';
}
interface EnrichedProduct {
    id: string;
    name: string;
    nameRu?: string;
    price: number;
    originalPrice?: number;
    avgRating: number;
    totalReviews: number;
    favoriteCount: number;
    inCartCount: number;
    isPopular: boolean;
    priceFormatted: string;
    discountPercentage: number;
    vendor: any;
    reviews: any[];
    categories: any[];
    specifications: any[];
}
interface CreateProductData {
    name: string;
    nameRu?: string;
    description: string;
    price: number;
    vendorId: string;
    categoryIds: string[];
    specifications: any[];
}
interface Product {
    id: string;
    name: string;
    price: number;
    vendorId: string;
}
interface BatchResult<T> {
    successful: T[];
    failed: Array<{
        data: any;
        error: string;
    }>;
    totalCount: number;
    processedCount: number;
}
interface QueryOptimizationOptions {
    enableCache?: boolean;
    cacheTTL?: number;
    timeout?: number;
    retries?: number;
}
interface QueryMetrics {
    name: string;
    count: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    totalResults: number;
}
interface DatabaseMetrics {
    activeConnections: number;
    idleConnections: number;
    waitingConnections: number;
    maxConnections: number;
    connectionErrors: number;
}
interface CacheMetrics {
    hitCount: number;
    missCount: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: number;
    evictedKeys: number;
}
interface PerformanceMetrics {
    timestamp: string;
    database: DatabaseMetrics;
    queries: QueryMetrics[];
    cache: CacheMetrics;
    system: {
        uptime: number;
        memory: NodeJS.MemoryUsage;
        cpu: NodeJS.CpuUsage;
    };
}
export default AdvancedPerformanceOptimizer;
/**
 * USAGE EXAMPLES:
 *
 * // Initialize the optimizer
 * const optimizer = new AdvancedPerformanceOptimizer(prisma, redisClient, config);
 *
 * // Use optimized queries
 * const products = await optimizer.getProductsWithRelations({
 *   category: 'electronics',
 *   inStock: true,
 *   limit: 20
 * });
 *
 * // Use intelligent caching
 * const popularProducts = await optimizer.getCachedData(
 *   'popular-products',
 *   () => getPopularProducts(),
 *   3600 // 1 hour TTL
 * );
 *
 * // Batch operations
 * const results = await optimizer.batchCreateProducts(productDataArray);
 *
 * // Monitor performance
 * const metrics = await optimizer.monitorDatabasePerformance();
 */ 
//# sourceMappingURL=advanced-performance-optimizer.d.ts.map