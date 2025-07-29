import { IProduct, ICategory } from '../models';
export interface ProductFilters {
    category?: string;
    subcategory?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
    sku?: string;
    rating?: number;
    tags?: string[];
    onSale?: boolean;
    newArrival?: boolean;
    bestSeller?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    specifications?: Record<string, any>;
}
export interface ProductSearchOptions {
    filters: ProductFilters;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface ProductResult {
    products: any[];
    total: number;
    pages: number;
    currentPage: number;
}
export declare class ProductService {
    private database;
    constructor();
    createProduct(productData: Partial<IProduct>): Promise<any>;
    getProductById(id: string): Promise<any>;
    getProductBySku(sku: string): Promise<any>;
    updateProduct(id: string, updates: Partial<IProduct>): Promise<any>;
    deleteProduct(id: string): Promise<void>;
    searchProducts(options: ProductSearchOptions): Promise<ProductResult>;
    getFeaturedProducts(limit?: number): Promise<any[]>;
    getRelatedProducts(productId: string, limit?: number): Promise<any[]>;
    updateInventory(id: string, quantity: number): Promise<any>;
    createCategory(categoryData: Partial<ICategory>): Promise<any>;
    getCategories(parentId?: string): Promise<any[]>;
    getCategoryById(id: string): Promise<any>;
    updateCategory(id: string, updates: Partial<ICategory>): Promise<any>;
    deleteCategory(id: string): Promise<void>;
    getProductByCategoryId(categoryId: string, page?: number, limit?: number): Promise<ProductResult>;
    checkAvailability(id: string, quantity?: number): Promise<{
        available: boolean;
        remainingStock: number;
    }>;
    getProductStats(): Promise<any>;
    private generateSKU;
    private transformProduct;
}
//# sourceMappingURL=productService.new.d.ts.map