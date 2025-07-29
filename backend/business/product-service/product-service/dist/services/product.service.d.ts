import { CreateProductDto, UpdateProductDto, ProductQueryParams, PaginatedResponse, ProductResponse } from '../models/product.model';
export declare class ProductService {
    private productRepository;
    private categoryRepository;
    constructor();
    /**
     * Get products with pagination and filtering
     */
    getProducts(queryParams: ProductQueryParams): Promise<PaginatedResponse<ProductResponse>>;
    /**
     * Get a single product by ID
     */
    getProductById(id: string): Promise<ProductResponse>;
    /**
     * Get a single product by slug
     */
    getProductBySlug(slug: string): Promise<ProductResponse>;
    /**
     * Create a new product
     */
    createProduct(data: CreateProductDto, userId: string): Promise<ProductResponse>;
    /**
     * Update an existing product
     */
    updateProduct(id: string, data: UpdateProductDto, userId: string): Promise<ProductResponse>;
    /**
     * Delete (soft-delete) a product
     */
    deleteProduct(id: string, userId: string): Promise<void>;
    /**
     * Map database product to API response
     */
    private mapProductToResponse;
}
//# sourceMappingURL=product.service.d.ts.map