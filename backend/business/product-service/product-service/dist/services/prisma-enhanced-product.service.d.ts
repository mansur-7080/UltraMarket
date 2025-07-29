/**
 * Enhanced Product Service with Prisma
 * Professional implementation with robust error handling, validation, and caching
 */
import { AdvancedCacheService } from '../utils/advanced-cache.service';
type JsonValue = string | number | boolean | null | {
    [key: string]: JsonValue;
} | JsonValue[];
export declare class ProductServiceError extends Error {
    constructor(message: string);
}
export declare class ProductNotFoundError extends ProductServiceError {
    constructor(productId: string);
}
export declare class ProductValidationError extends ProductServiceError {
    validationErrors: Record<string, string>;
    constructor(message: string, validationErrors: Record<string, string>);
}
export declare class DuplicateProductError extends ProductServiceError {
    constructor(sku: string);
}
export declare enum ProductStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    ARCHIVED = "ARCHIVED"
}
export declare enum ProductType {
    PHYSICAL = "PHYSICAL",
    DIGITAL = "DIGITAL",
    SERVICE = "SERVICE",
    SUBSCRIPTION = "SUBSCRIPTION"
}
export interface ProductFilters {
    categoryId?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    inStock?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    vendorId?: string;
    tags?: string[];
    status?: string;
    type?: string;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isOnSale?: boolean;
}
export interface ProductQueryOptions {
    page: number;
    limit: number;
    filters: ProductFilters;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    includeInactive?: boolean;
    select?: Record<string, boolean>;
}
export interface ProductCreateData {
    name: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    sku: string;
    barcode?: string;
    brand?: string;
    model?: string;
    weight?: number;
    dimensions?: JsonValue;
    price: number | string;
    comparePrice?: number | string;
    costPrice?: number | string;
    currency?: string;
    status?: string;
    type?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isOnSale?: boolean;
    salePercentage?: number;
    saleStartDate?: Date;
    saleEndDate?: Date;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    tags?: string[];
    attributes?: JsonValue;
    specifications?: JsonValue;
    warranty?: string;
    returnPolicy?: string;
    shippingInfo?: string;
    categoryId: string;
    vendorId?: string;
}
export declare class EnhancedProductService {
    private cacheService;
    constructor(cacheService?: AdvancedCacheService);
    /**
     * Get all products with pagination, filtering, and caching
     */
    getProducts(options: ProductQueryOptions): Promise<{}>;
    /**
     * Build SQL where clause from filters
     */
    private buildWhereClause;
    /**
     * Get product by ID with caching
     */
    getProductById(id: string): Promise<any>;
    /**
     * Get product by slug with caching
     */
    getProductBySlug(slug: string): Promise<any>;
    /**
     * Create new product with enhanced validation
     */
    createProduct(productData: ProductCreateData): Promise<any>;
    /**
     * Validate product data manually for detailed error messages
     */
    private validateProductData;
    /**
     * Update product with validation and caching
     */
    updateProduct(id: string, updateData: Partial<ProductCreateData>): Promise<any>;
    /**
     * Validate product update data
     */
    private validateProductUpdateData;
    /**
     * Delete product by ID with proper cleanup
     */
    deleteProduct(id: string): Promise<{
        success: boolean;
        id: string;
        message: string;
    }>;
    /**
     * Get product statistics with caching
     */
    getProductStats(): Promise<{}>;
    /**
     * Count products based on filters
     */
    private countProducts;
    /**
     * Bulk update product stock levels
     */
    bulkUpdateStock(updates: Array<{
        id: string;
        stock: number;
    }>): Promise<{
        success: string[];
        failed: {
            id: string;
            error: string;
        }[];
    }>;
}
export {};
//# sourceMappingURL=prisma-enhanced-product.service.d.ts.map