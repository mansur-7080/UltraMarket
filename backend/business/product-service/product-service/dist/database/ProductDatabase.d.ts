import { IProduct } from '../models/Product';
import { ICategory } from '../models/Category';
import { IReview } from '../models/Review';
export type { IProduct as Product, ICategory as Category, IReview as Review };
declare class ProductDatabase {
    constructor();
    private ensureIndexes;
    private seedInitialData;
    createProduct(data: Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>): Promise<IProduct>;
    getProductById(id: string): Promise<IProduct | null>;
    getProductBySku(sku: string): Promise<IProduct | null>;
    updateProduct(id: string, updates: Partial<IProduct>): Promise<IProduct | null>;
    deleteProduct(id: string): Promise<boolean>;
    getAllProducts(filters?: Record<string, any>, page?: number, limit?: number): Promise<{
        products: IProduct[];
        total: number;
    }>;
    getAllCategories(): Promise<ICategory[]>;
    getCategoryBySlug(slug: string): Promise<ICategory | null>;
    getProductsByCategory(categoryId: string, page?: number, limit?: number): Promise<{
        products: IProduct[];
        total: number;
    }>;
    createReview(reviewData: Partial<IReview>): Promise<any | null>;
    getProductReviews(productId: string, page?: number, limit?: number): Promise<{
        reviews: any[];
        total: number;
    }>;
    private updateProductRating;
    isHealthy(): Promise<boolean>;
}
export default ProductDatabase;
//# sourceMappingURL=ProductDatabase.d.ts.map