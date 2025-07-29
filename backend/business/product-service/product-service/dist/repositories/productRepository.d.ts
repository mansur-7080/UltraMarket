import { IProduct, ICategory, IReview } from '../models/Product';
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
}
export interface ProductSort {
    field: 'name' | 'price' | 'rating' | 'createdAt';
    direction: 'asc' | 'desc';
}
export interface PaginationOptions {
    page: number;
    limit: number;
}
export interface ProductResult {
    products: IProduct[];
    total: number;
    pages: number;
    currentPage: number;
}
export declare class ProductRepository {
    createProduct(productData: Partial<IProduct>): Promise<IProduct>;
    findProductById(id: string): Promise<IProduct | null>;
    findProductBySku(sku: string): Promise<IProduct | null>;
    updateProduct(id: string, updates: Partial<IProduct>): Promise<IProduct | null>;
    deleteProduct(id: string): Promise<boolean>;
    findProducts(filters?: ProductFilters, sort?: ProductSort, pagination?: PaginationOptions): Promise<ProductResult>;
    updateProductRating(productId: string): Promise<void>;
    createCategory(categoryData: Partial<ICategory>): Promise<ICategory>;
    findCategories(parentId?: string): Promise<ICategory[]>;
    findCategoryBySlug(slug: string): Promise<ICategory | null>;
    createReview(reviewData: Partial<IReview>): Promise<IReview>;
    findReviewsByProduct(productId: string, page?: number, limit?: number): Promise<{
        reviews: IReview[];
        total: number;
        pages: number;
    }>;
    getProductStats(): Promise<{
        totalProducts: number;
        activeProducts: number;
        outOfStock: number;
        averagePrice: number;
        totalCategories: number;
    }>;
}
//# sourceMappingURL=productRepository.d.ts.map