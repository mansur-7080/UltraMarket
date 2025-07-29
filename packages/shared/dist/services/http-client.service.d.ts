import { AxiosRequestConfig } from 'axios';
export interface HttpClientConfig {
    baseURL: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
    circuitBreakerThreshold?: number;
    circuitBreakerTimeout?: number;
}
export interface RetryConfig {
    attempts: number;
    delay: number;
    backoffFactor: number;
    maxDelay: number;
}
export interface CircuitBreakerState {
    failures: number;
    lastFailureTime: number;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}
export declare class HttpClientService {
    private client;
    private retryConfig;
    private circuitBreaker;
    private readonly config;
    constructor(config: HttpClientConfig);
    private createClient;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    private executeWithRetry;
    private shouldNotRetry;
    private updateCircuitBreaker;
    private resetCircuitBreaker;
    private generateCorrelationId;
    private getAuthToken;
    private calculateResponseTime;
    private sleep;
    healthCheck(): Promise<boolean>;
    getCircuitBreakerStatus(): CircuitBreakerState;
    getConfig(): HttpClientConfig;
}
export declare class AuthServiceClient extends HttpClientService {
    constructor();
    validateToken(token: string): Promise<any>;
    refreshToken(refreshToken: string): Promise<any>;
    getUserById(userId: string): Promise<any>;
}
export declare class UserServiceClient extends HttpClientService {
    constructor();
    getUserProfile(userId: string): Promise<any>;
    updateUserProfile(userId: string, data: any): Promise<any>;
    getUserAddresses(userId: string): Promise<any>;
}
export declare class ProductServiceClient extends HttpClientService {
    constructor();
    getProduct(productId: string): Promise<any>;
    updateProductInventory(productId: string, quantity: number): Promise<any>;
    searchProducts(query: string, filters?: any): Promise<any>;
}
export declare class PaymentServiceClient extends HttpClientService {
    constructor();
    createPayment(paymentData: any): Promise<any>;
    getPaymentStatus(paymentId: string): Promise<any>;
    refundPayment(paymentId: string, refundData: any): Promise<any>;
}
export declare class NotificationServiceClient extends HttpClientService {
    constructor();
    sendNotification(notificationData: any): Promise<any>;
    sendBulkNotification(bulkData: any): Promise<any>;
    getUserNotifications(userId: string, options?: any): Promise<any>;
}
//# sourceMappingURL=http-client.service.d.ts.map