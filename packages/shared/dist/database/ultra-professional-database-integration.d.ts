/**
 * 🚀 ULTRA PROFESSIONAL DATABASE INTEGRATION
 * UltraMarket E-commerce Platform
 *
 * Integration layer for the Ultra Professional Database Optimizer
 * Provides production-ready configuration and service integration
 *
 * @author UltraMarket Database Team
 * @version 4.0.0
 * @date 2024-12-28
 */
import { UltraProfessionalDatabaseOptimizer, DatabaseConfig } from './ultra-professional-database-optimizer';
export declare const productionDatabaseConfig: DatabaseConfig;
/**
 * Initialize the database optimizer with production configuration
 */
export declare function initializeDatabaseOptimizer(config?: DatabaseConfig): Promise<UltraProfessionalDatabaseOptimizer>;
/**
 * Get the initialized database optimizer instance
 */
export declare function getDatabaseOptimizer(): UltraProfessionalDatabaseOptimizer;
/**
 * Service-specific database helpers
 */
/**
 * Product Service Database Helper
 */
export declare class ProductServiceDB {
    private optimizer;
    constructor();
    /**
     * Get products with optimized query
     */
    getProducts(filters?: {
        categoryId?: string;
        priceMin?: number;
        priceMax?: number;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    /**
     * Get product by ID with all relations
     */
    getProductById(productId: string): Promise<any>;
    /**
     * Search products with MongoDB
     */
    searchProducts(searchTerm: string, options?: {
        limit?: number;
        skip?: number;
        filters?: any;
    }): Promise<any[]>;
}
/**
 * User Service Database Helper
 */
export declare class UserServiceDB {
    private optimizer;
    constructor();
    /**
     * Get user with profile and recent activity
     */
    getUserById(userId: string): Promise<any>;
    /**
     * Get user orders with optimized pagination
     */
    getUserOrders(userId: string, options?: {
        limit?: number;
        offset?: number;
        status?: string;
    }): Promise<any[]>;
}
/**
 * Order Service Database Helper
 */
export declare class OrderServiceDB {
    private optimizer;
    constructor();
    /**
     * Create order with transaction support
     */
    createOrder(orderData: {
        userId: string;
        items: Array<{
            productId: string;
            quantity: number;
            unitPrice: number;
        }>;
        shippingAddress: any;
        paymentMethod: string;
        totalAmount: number;
    }): Promise<any>;
    /**
     * Get order analytics
     */
    getOrderAnalytics(dateRange: {
        startDate: Date;
        endDate: Date;
    }): Promise<any>;
}
/**
 * Cache Service Helper
 */
export declare class CacheServiceHelper {
    private optimizer;
    constructor();
    /**
     * Get cached data with fallback
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set cached data with TTL
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    /**
     * Clear cache pattern
     */
    clearPattern(pattern: string): Promise<number>;
}
/**
 * Express middleware for database metrics
 */
export declare function databaseMetricsMiddleware(): (req: any, res: any, next: any) => void;
export declare const productServiceDB: ProductServiceDB;
export declare const userServiceDB: UserServiceDB;
export declare const orderServiceDB: OrderServiceDB;
export declare const cacheServiceHelper: CacheServiceHelper;
export declare function getDatabasePerformanceReport(): any;
export { UltraProfessionalDatabaseOptimizer };
export type { DatabaseConfig };
//# sourceMappingURL=ultra-professional-database-integration.d.ts.map