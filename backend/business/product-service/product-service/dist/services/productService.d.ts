export interface ProductFilters {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    inStock?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    vendorId?: string;
}
export interface ProductQueryOptions {
    page: number;
    limit: number;
    filters: ProductFilters;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
export interface ProductData {
    name: string;
    description: string;
    sku: string;
    category: string;
    brand: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    stock: number;
    images: string[];
    specifications?: Record<string, string>;
    tags?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    vendorId: string;
}
export declare class ProductService {
    /**
     * Get all products with pagination and filtering
     */
    getProducts(options: ProductQueryOptions): Promise<{
        products: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Get product by ID
     */
    getProductById(id: string): Promise<any>;
    /**
     * Create new product
     */
    createProduct(productData: ProductData): Promise<any>;
    /**
     * Update product
     */
    updateProduct(id: string, updateData: Partial<ProductData>): Promise<any>;
    /**
     * Delete product
     */
    deleteProduct(id: string): Promise<boolean>;
    /**
     * Get products by category
     */
    getProductsByCategory(category: string, page?: number, limit?: number): Promise<{
        products: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Search products
     */
    searchProducts(query: string, page?: number, limit?: number): Promise<{
        products: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Get product categories
     */
    getCategories(): Promise<any>;
    /**
     * Get product brands
     */
    getBrands(): Promise<any>;
    /**
     * Update product stock
     */
    updateStock(id: string, quantity: number, operation?: 'add' | 'subtract'): Promise<any>;
    /**
     * Get product statistics
     */
    getProductStats(): Promise<{
        totalProducts: any;
        activeProducts: any;
        outOfStockProducts: any;
        featuredProducts: any;
        totalCategories: any;
        totalBrands: any;
        averagePrice: number;
    }>;
    /**
     * Get featured products
     */
    getFeaturedProducts(limit?: number): Promise<any>;
    /**
     * Get related products
     */
    getRelatedProducts(productId: string, limit?: number): Promise<any>;
    /**
     * Check product availability
     */
    checkAvailability(productIds: string[]): Promise<any>;
    /**
     * Bulk update products
     */
    bulkUpdateProducts(updates: Array<{
        id: string;
        data: Partial<ProductData>;
    }>): Promise<any>;
}
//# sourceMappingURL=productService.d.ts.map