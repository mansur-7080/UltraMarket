declare module 'axios' {
    interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number;
            endpoint: string;
        };
        _retry?: boolean;
    }
}
import { BaseApiResponse, PaginatedResponse, AuthTokens, RequestConfig, LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, GetProductsRequest, GetProductsResponse, GetProductResponse, CreateOrderRequest, CreateOrderResponse, User, Product, Order, Cart, FileUpload, UploadResponse } from './types';
interface ApiClientConfig {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    enableRetries: boolean;
    enableRefreshToken: boolean;
    enableLogging: boolean;
    enableMetrics: boolean;
}
declare class TokenManager {
    private static readonly ACCESS_TOKEN_KEY;
    private static readonly REFRESH_TOKEN_KEY;
    private static readonly TOKEN_EXPIRY_KEY;
    static getAccessToken(): string | null;
    static getRefreshToken(): string | null;
    static setTokens(tokens: AuthTokens): void;
    static clearTokens(): void;
    static isTokenExpired(): boolean;
    static isAuthenticated(): boolean;
}
export declare class UltraMarketApiClient {
    private readonly client;
    private readonly config;
    private refreshTokenPromise;
    constructor(config?: Partial<ApiClientConfig>);
    private createAxiosInstance;
    private setupInterceptors;
    private refreshAccessToken;
    private generateCorrelationId;
    private createApiError;
    private retryRequest;
    private delay;
    get<T>(url: string, config?: RequestConfig): Promise<BaseApiResponse<T>>;
    post<T>(url: string, data?: any, config?: RequestConfig): Promise<BaseApiResponse<T>>;
    put<T>(url: string, data?: any, config?: RequestConfig): Promise<BaseApiResponse<T>>;
    patch<T>(url: string, data?: any, config?: RequestConfig): Promise<BaseApiResponse<T>>;
    delete<T>(url: string, config?: RequestConfig): Promise<BaseApiResponse<T>>;
    login(credentials: LoginRequest): Promise<LoginResponse>;
    register(userData: RegisterRequest): Promise<RegisterResponse>;
    logout(): Promise<BaseApiResponse<void>>;
    getCurrentUser(): Promise<BaseApiResponse<User>>;
    getProducts(filters?: GetProductsRequest): Promise<GetProductsResponse>;
    getProduct(id: string): Promise<GetProductResponse>;
    searchProducts(query: string, filters?: GetProductsRequest): Promise<GetProductsResponse>;
    createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse>;
    getOrders(page?: number, limit?: number): Promise<PaginatedResponse<Order>>;
    getOrder(id: string): Promise<BaseApiResponse<Order>>;
    getCart(): Promise<BaseApiResponse<Cart>>;
    addToCart(productId: string, quantity?: number, variantId?: string): Promise<BaseApiResponse<Cart>>;
    updateCartItem(itemId: string, quantity: number): Promise<BaseApiResponse<Cart>>;
    removeFromCart(itemId: string): Promise<BaseApiResponse<Cart>>;
    clearCart(): Promise<BaseApiResponse<void>>;
    uploadFile(upload: FileUpload, config?: RequestConfig): Promise<BaseApiResponse<UploadResponse>>;
    getMetrics(): Record<string, any>;
    isAuthenticated(): boolean;
    getAccessToken(): string | null;
    clearTokens(): void;
    updateConfig(newConfig: Partial<ApiClientConfig>): void;
}
export declare const apiClient: UltraMarketApiClient;
export type { ApiClientConfig, RequestConfig, BaseApiResponse, PaginatedResponse, LoginRequest, RegisterRequest, User, Product, Order, Cart, FileUpload, UploadResponse, };
export { TokenManager };
//# sourceMappingURL=client.d.ts.map