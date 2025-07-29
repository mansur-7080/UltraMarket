/**
 * Optimized Product Service with N+1 Query Elimination
 *
 * Professional implementation that eliminates N+1 query problems using
 * advanced batching, DataLoader patterns, and query optimization techniques.
 *
 * Key Performance Optimizations:
 * - N+1 query elimination using inline DataLoader pattern
 * - Batch loading of related entities (categories, images, inventory, reviews)
 * - Smart query complexity analysis and optimization
 * - Parallel query execution for relationships
 * - Performance monitoring and metrics
 *
 * @author UltraMarket Performance Team
 * @version 1.0.0
 */
interface DatabaseClient {
    product: {
        findMany: (args: any) => Promise<any[]>;
        findUnique: (args: any) => Promise<any>;
        count: (args: any) => Promise<number>;
    };
    productImage: {
        findMany: (args: any) => Promise<any[]>;
    };
    inventory: {
        findMany: (args: any) => Promise<any[]>;
    };
    review: {
        findMany: (args: any) => Promise<any[]>;
    };
    productVariant: {
        findMany: (args: any) => Promise<any[]>;
    };
    productRelation: {
        findMany: (args: any) => Promise<any[]>;
    };
    category: {
        findMany: (args: any) => Promise<any[]>;
    };
    $queryRaw: (query: any, ...params: any[]) => Promise<any[]>;
    $disconnect: () => Promise<void>;
}
interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    sku: string;
    brand: string | null;
    price: number;
    categoryId: string;
    vendorId: string | null;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
    category?: any;
    images?: any[];
    inventory?: any;
    reviews?: any[];
    variants?: any[];
    relatedProducts?: any[];
}
interface OptimizedProductQueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
        categoryId?: string;
        vendorId?: string;
        status?: string;
        isActive?: boolean;
        isFeatured?: boolean;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        tags?: string[];
    };
    includes?: string[];
    optimizations?: {
        enableN1Elimination?: boolean;
        enableBatchLoading?: boolean;
        enableParallelExecution?: boolean;
    };
}
interface PerformanceMetrics {
    totalQueries: number;
    executionTime: number;
    cacheHitRatio: number;
    optimizationsApplied: string[];
    queryComplexity: number;
}
export declare class OptimizedProductService {
    private db;
    private categoryLoader;
    private imageLoader;
    private inventoryLoader;
    private reviewLoader;
    private performanceMetrics;
    constructor(databaseClient: DatabaseClient);
    /**
     * Initialize DataLoaders for batch operations
     */
    private initializeDataLoaders;
    /**
     * Get products with comprehensive N+1 optimization
     */
    getProducts(options?: OptimizedProductQueryOptions): Promise<{
        products: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        performance: PerformanceMetrics;
    }>;
    /**
     * Load products with N+1 elimination using DataLoaders
     */
    private loadProductsWithN1Elimination;
    /**
     * Traditional product loading (fallback)
     */
    private loadProductsTraditional;
    /**
     * Enhance products with parallel loading for additional data
     */
    private enhanceProductsWithParallelLoading;
    /**
     * Build optimized where clause
     */
    private buildOptimizedWhereClause;
    /**
     * Calculate query count for performance monitoring
     */
    private calculateQueryCount;
    /**
     * Calculate query complexity score
     */
    private calculateQueryComplexity;
    /**
     * Record performance metrics
     */
    private recordPerformanceMetrics;
    /**
     * Get performance report
     */
    getPerformanceReport(): {
        averageExecutionTime: number;
        totalQueries: number;
        averageQueryComplexity: number;
        mostUsedOptimizations: string[];
        recommendations: string[];
    };
    /**
     * Clear caches
     */
    clearCaches(): void;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export default OptimizedProductService;
//# sourceMappingURL=optimized-product-service.d.ts.map