/**
 * Enhanced Product Service - Final implementation
 * Provides an advanced product management service with proper error handling, caching,
 * performance optimization, and SQL query execution.
 */
import { AdvancedCacheService } from '../utils/advanced-cache.service';
import { ProductStatus, ProductType, Prisma } from '@prisma/client';
/**
 * Custom error class for product-related errors
 */
export declare class ProductError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code?: string, statusCode?: number);
}
/**
 * Pagination options interface
 */
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
}
/**
 * Interface for product filters
 */
export interface ProductFilters {
    categoryId?: string;
    vendorId?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: ProductStatus;
    type?: ProductType;
    isActive?: boolean;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isOnSale?: boolean;
    search?: string;
    tags?: string[];
}
/**
 * Interface for product query options
 */
export interface ProductQueryOptions extends PaginationOptions {
    filters?: ProductFilters;
    includeInactive?: boolean;
}
/**
 * Enhanced Product Service
 * Provides comprehensive product management functionality with advanced features
 */
export declare class EnhancedProductService {
    private cacheService?;
    constructor(cacheService?: AdvancedCacheService | undefined);
    /**
     * Get products with pagination and filtering
     * @param options Query options for filtering and pagination
     */
    getProducts(options?: ProductQueryOptions): Promise<{}>;
    /**
     * Get a single product by ID
     * @param id Product ID
     */
    getProductById(id: string): Promise<any>;
    /**
     * Get a product by slug
     * @param slug Product slug
     */
    getProductBySlug(slug: string): Promise<any>;
    /**
     * Create a new product
     * @param data Product data
     */
    createProduct(data: Prisma.ProductCreateInput): Promise<any>;
    /**
     * Update an existing product
     * @param id Product ID
     * @param data Update data
     */
    updateProduct(id: string, data: Prisma.ProductUpdateInput): Promise<any>;
    /**
     * Delete a product
     * @param id Product ID
     */
    deleteProduct(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Search products with full text search capability
     * @param query Search query
     * @param options Additional search options
     */
    searchProducts(query: string, options?: ProductQueryOptions): Promise<{}>;
    /**
     * Log search query for analytics
     * @param query Search query
     * @param filters Search filters
     * @param resultsCount Number of results
     */
    private logSearch;
    /**
     * Generate a cache key based on parameters
     * @param prefix Cache key prefix
     * @param params Parameters to include in cache key
     */
    private generateCacheKey;
    /**
     * Generate a slug from a product name
     * @param name Product name
     */
    private generateSlug;
}
//# sourceMappingURL=enhanced-product-service-final.d.ts.map