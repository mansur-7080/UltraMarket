export interface ProductService {
    getProductById(productId: string): Promise<any>;
    checkProductAvailability(productId: string, quantity: number): Promise<{
        available: boolean;
        currentStock: number;
    }>;
    getPrice(productId: string): Promise<number>;
}
export declare class ProductServiceClient implements ProductService {
    private baseUrl;
    constructor(baseUrl?: string);
    getProductById(productId: string): Promise<any>;
    checkProductAvailability(productId: string, quantity: number): Promise<{
        available: boolean;
        currentStock: number;
    }>;
    getPrice(productId: string): Promise<number>;
}
export declare const productService: ProductServiceClient;
export default productService;
//# sourceMappingURL=product.service.d.ts.map