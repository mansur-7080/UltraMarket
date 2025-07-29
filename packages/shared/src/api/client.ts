/**
 * 🚀 ULTRAMARKET PROFESSIONAL API CLIENT
 * Enterprise-grade TypeScript API client with advanced features
 * @version 3.0.0
 * @author UltraMarket Backend Team
 */

import axios, { 
  AxiosInstance, 
  AxiosResponse, 
  AxiosError, 
  InternalAxiosRequestConfig 
} from 'axios';

// Extend Axios types for metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
      endpoint: string;
    };
    _retry?: boolean;
  }
}

import {
  BaseApiResponse,
  PaginatedResponse,
  ApiClientError,
  NetworkError,
  AuthTokens,
  RequestConfig,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  GetProductsRequest,
  GetProductsResponse,
  GetProductResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  User,
  Product,
  Order,
  Cart,
  FileUpload,
  UploadResponse,
} from './types';

// API Configuration
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

const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: process.env['VITE_API_URL'] || 'http://localhost:8000/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  enableRetries: true,
  enableRefreshToken: true,
  enableLogging: true,
  enableMetrics: true,
};

// Token Management Class
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'ultramarket_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'ultramarket_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'ultramarket_token_expiry';

  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static setTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      
      const expiryTime = Date.now() + (tokens.expiresIn * 1000);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  static isTokenExpired(): boolean {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;
      
      return Date.now() >= parseInt(expiryTime) - 300000; // 5 minutes buffer
    } catch {
      return true;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }
}

// Request Metrics Class
class RequestMetrics {
  private static metrics: Map<string, {
    count: number;
    totalTime: number;
    errors: number;
    lastRequest: number;
  }> = new Map();

  static recordRequest(endpoint: string, duration: number, success: boolean): void {
    const key = endpoint;
    const existing = this.metrics.get(key) || {
      count: 0,
      totalTime: 0,
      errors: 0,
      lastRequest: 0,
    };

    existing.count++;
    existing.totalTime += duration;
    existing.lastRequest = Date.now();
    
    if (!success) {
      existing.errors++;
    }

    this.metrics.set(key, existing);
  }

  static getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((value, key) => {
      result[key] = {
        ...value,
        averageTime: value.count > 0 ? value.totalTime / value.count : 0,
        errorRate: value.count > 0 ? value.errors / value.count : 0,
      };
    });

    return result;
  }
}

// Professional API Client Class
export class UltraMarketApiClient {
  private readonly client: AxiosInstance;
  private readonly config: ApiClientConfig;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': '3.0.0',
        'X-Platform': typeof window !== 'undefined' ? 'web' : 'server',
      },
    });
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add authentication token
        const token = TokenManager.getAccessToken();
        if (token && !TokenManager.isTokenExpired()) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request metadata
        config.metadata = { 
          startTime: Date.now(),
          endpoint: `${config.method?.toUpperCase()} ${config.url}`,
        };

        // Add correlation ID for request tracking
        config.headers['X-Correlation-ID'] = this.generateCorrelationId();

        // Add user agent information
        if (typeof window !== 'undefined') {
          config.headers['User-Agent'] = window.navigator.userAgent;
        }

        if (this.config.enableLogging) {
          console.debug(`🚀 API Request: ${config.metadata.endpoint}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        return Promise.reject(this.createApiError('REQUEST_SETUP_ERROR', 'Failed to setup request', error));
      }
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const startTime = response.config.metadata?.startTime;
        const endpoint = response.config.metadata?.endpoint;
        
        if (startTime && endpoint) {
          const duration = Date.now() - startTime;
          
          if (this.config.enableMetrics) {
            RequestMetrics.recordRequest(endpoint, duration, true);
          }

          if (this.config.enableLogging) {
            console.debug(`✅ API Success: ${endpoint} - ${duration}ms`, {
              status: response.status,
              data: response.data,
            });
          }
        }

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
          metadata?: { startTime: number; endpoint: string };
        };

        const startTime = config?.metadata?.startTime;
        const endpoint = config?.metadata?.endpoint;

        if (startTime && endpoint && this.config.enableMetrics) {
          const duration = Date.now() - startTime;
          RequestMetrics.recordRequest(endpoint, duration, false);
        }

        // Handle 401 Unauthorized - Token Refresh
        if (error.response?.status === 401 && 
            config && 
            !config._retry && 
            this.config.enableRefreshToken) {
          
          config._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            config.headers.Authorization = `Bearer ${newToken}`;
            
            if (this.config.enableLogging) {
              console.debug('🔄 Token refreshed, retrying request');
            }
            
            return this.client(config);
          } catch (refreshError) {
            TokenManager.clearTokens();
            
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:logout'));
            }
            
            throw this.createApiError(
              'TOKEN_REFRESH_FAILED',
              'Authentication failed. Please login again.',
              refreshError,
              401
            );
          }
        }

        // Handle network errors
        if (!error.response) {
          throw new NetworkError(
            'Network error occurred. Please check your connection.',
            error
          );
        }

        // Handle API errors
        const { status, data } = error.response;
        const errorResponse = data as any;

        if (this.config.enableLogging) {
          console.error(`❌ API Error: ${endpoint}`, {
            status,
            error: errorResponse,
          });
        }

        // Handle specific HTTP status codes
        const errorMessages: Record<number, string> = {
          400: 'Bad request. Please check your input.',
          403: 'Access forbidden. You do not have permission.',
          404: 'Resource not found.',
          408: 'Request timeout. Please try again.',
          409: 'Conflict. Resource already exists.',
          422: 'Validation error. Please check your input.',
          429: 'Too many requests. Please wait and try again.',
          500: 'Internal server error. Please try again later.',
          502: 'Bad gateway. Service temporarily unavailable.',
          503: 'Service unavailable. Please try again later.',
          504: 'Gateway timeout. Please try again later.',
        };

        const message = errorResponse?.error?.message || 
                       errorMessages[status] || 
                       `HTTP Error ${status}`;

        throw this.createApiError(
          errorResponse?.error?.code || `HTTP_${status}`,
          message,
          errorResponse?.error?.details || error.response?.data,
          status
        );
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${this.config.baseURL}/auth/refresh`, {
        refreshToken,
      });

      const tokens: AuthTokens = response.data.data.tokens;
      TokenManager.setTokens(tokens);
      
      this.refreshTokenPromise = null;
      return tokens.accessToken;
    })();

    return this.refreshTokenPromise;
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createApiError(
    code: string, 
    message: string, 
    details?: any, 
    statusCode?: number
  ): ApiClientError {
    return new ApiClientError(code, message, statusCode, details);
  }

  private async retryRequest<T>(
    operation: () => Promise<T>, 
    config?: RequestConfig
  ): Promise<T> {
    const maxAttempts = config?.retries ?? this.config.retryAttempts;
    const delayMs = config?.retryDelay ?? this.config.retryDelay;
    
    if (!this.config.enableRetries) {
      return operation();
    }

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx) except 401 and 429
        if (error instanceof ApiClientError) {
          const status = error.statusCode;
          if (status && status >= 400 && status < 500 && status !== 401 && status !== 429) {
            throw error;
          }
        }

        if (attempt === maxAttempts) {
          break;
        }

        await this.delay(delayMs * attempt); // Exponential backoff
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generic API Methods
  async get<T>(url: string, config?: RequestConfig): Promise<BaseApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.get<BaseApiResponse<T>>(url, {
        timeout: config?.timeout,
        headers: config?.headers,
        params: config?.params,
        signal: config?.signal,
      });
      return response.data;
    }, config);
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<BaseApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.post<BaseApiResponse<T>>(url, data, {
        timeout: config?.timeout,
        headers: config?.headers,
        params: config?.params,
        signal: config?.signal,
      });
      return response.data;
    }, config);
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<BaseApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.put<BaseApiResponse<T>>(url, data, {
        timeout: config?.timeout,
        headers: config?.headers,
        params: config?.params,
        signal: config?.signal,
      });
      return response.data;
    }, config);
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<BaseApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.patch<BaseApiResponse<T>>(url, data, {
        timeout: config?.timeout,
        headers: config?.headers,
        params: config?.params,
        signal: config?.signal,
      });
      return response.data;
    }, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<BaseApiResponse<T>> {
    return this.retryRequest(async () => {
      const response = await this.client.delete<BaseApiResponse<T>>(url, {
        timeout: config?.timeout,
        headers: config?.headers,
        params: config?.params,
        signal: config?.signal,
      });
      return response.data;
    }, config);
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse['data']>('/auth/login', credentials);
    
    if (response.success && response.data) {
      TokenManager.setTokens(response.data.tokens);
    }
    
    return response as LoginResponse;
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.post<RegisterResponse['data']>('/auth/register', userData);
    
    if (response.success && response.data) {
      TokenManager.setTokens(response.data.tokens);
    }
    
    return response as RegisterResponse;
  }

  async logout(): Promise<BaseApiResponse<void>> {
    try {
      const response = await this.post<void>('/auth/logout');
      return response;
    } finally {
      TokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<BaseApiResponse<User>> {
    return this.get<User>('/auth/me');
  }

  // Product Methods
  async getProducts(filters?: GetProductsRequest): Promise<GetProductsResponse> {
    return this.get<Product[]>('/products', { params: filters }) as Promise<GetProductsResponse>;
  }

  async getProduct(id: string): Promise<GetProductResponse> {
    return this.get<Product>(`/products/${id}`);
  }

  async searchProducts(query: string, filters?: GetProductsRequest): Promise<GetProductsResponse> {
    return this.get<Product[]>('/products/search', { 
      params: { query, ...filters } 
    }) as Promise<GetProductsResponse>;
  }

  // Order Methods
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.post<Order>('/orders', orderData);
  }

  async getOrders(page = 1, limit = 10): Promise<PaginatedResponse<Order>> {
    return this.get<Order[]>('/orders', { params: { page, limit } }) as Promise<PaginatedResponse<Order>>;
  }

  async getOrder(id: string): Promise<BaseApiResponse<Order>> {
    return this.get<Order>(`/orders/${id}`);
  }

  // Cart Methods
  async getCart(): Promise<BaseApiResponse<Cart>> {
    return this.get<Cart>('/cart');
  }

  async addToCart(productId: string, quantity = 1, variantId?: string): Promise<BaseApiResponse<Cart>> {
    return this.post<Cart>('/cart/items', { productId, quantity, variantId });
  }

  async updateCartItem(itemId: string, quantity: number): Promise<BaseApiResponse<Cart>> {
    return this.put<Cart>(`/cart/items/${itemId}`, { quantity });
  }

  async removeFromCart(itemId: string): Promise<BaseApiResponse<Cart>> {
    return this.delete<Cart>(`/cart/items/${itemId}`);
  }

  async clearCart(): Promise<BaseApiResponse<void>> {
    return this.delete<void>('/cart');
  }

  // File Upload Methods
  async uploadFile(upload: FileUpload, config?: RequestConfig): Promise<BaseApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append(upload.field || 'file', upload.file, upload.fileName);

    return this.retryRequest(async () => {
      const response = await this.client.post<BaseApiResponse<UploadResponse>>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
        timeout: config?.timeout || 60000, // 1 minute for uploads
        signal: config?.signal,
      });
      return response.data;
    }, config);
  }

  // Utility Methods
  getMetrics(): Record<string, any> {
    return RequestMetrics.getMetrics();
  }

  isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  getAccessToken(): string | null {
    return TokenManager.getAccessToken();
  }

  clearTokens(): void {
    TokenManager.clearTokens();
  }

  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    Object.assign(this.config, newConfig);
  }
}

// Create default instance
export const apiClient = new UltraMarketApiClient();

// Export types for convenience
export type { 
  ApiClientConfig,
  RequestConfig,
  BaseApiResponse,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Product,
  Order,
  Cart,
  FileUpload,
  UploadResponse,
};

// Export TokenManager for direct access if needed
export { TokenManager }; 