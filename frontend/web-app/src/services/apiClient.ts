/**
 * UltraMarket E-Commerce Platform
 * Professional TypeScript API Client
 * Enhanced Axios Instance with Error Handling
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse, ErrorResponse, ApiError, AuthTokens } from './types';

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// Token management utilities
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'ultramarket_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'ultramarket_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'ultramarket_token_expiry';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    
    // Calculate expiry time
    const expiryTime = Date.now() + (tokens.expiresIn * 1000);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    return Date.now() >= parseInt(expiryTime);
  }

  static shouldRefreshToken(): boolean {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return false;
    
    // Refresh if token expires within 5 minutes
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return parseInt(expiryTime) <= fiveMinutesFromNow;
  }
}

// Request retry utility
class RequestRetry {
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async execute<T>(
    operation: () => Promise<T>,
    maxAttempts: number = API_CONFIG.retryAttempts,
    delayMs: number = API_CONFIG.retryDelay
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx) except 401
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 401) {
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
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    async (config) => {
      // Add authentication token
      const token = TokenManager.getAccessToken();
      if (token && !TokenManager.isTokenExpired()) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request timestamp
      config.metadata = { startTime: Date.now() };

      // Add correlation ID for request tracking
      config.headers['X-Correlation-ID'] = generateCorrelationId();

      return config;
    },
    (error) => {
      return Promise.reject(new ApiError(
        'REQUEST_SETUP_ERROR',
        'Failed to setup request',
        error
      ));
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log response time for monitoring
      const startTime = response.config.metadata?.startTime;
      if (startTime) {
        const responseTime = Date.now() - startTime;
        console.debug(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${responseTime}ms`);
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle network errors
      if (!error.response) {
        throw new ApiError(
          'NETWORK_ERROR',
          'Network error occurred. Please check your connection.',
          error,
          0
        );
      }

      const { status, data } = error.response;

      // Handle 401 Unauthorized - try to refresh token
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = TokenManager.getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh`, {
              refreshToken,
            });

            const tokens: AuthTokens = response.data.data.tokens;
            TokenManager.setTokens(tokens);

            // Retry original request with new token
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          TokenManager.clearTokens();
          
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          throw new ApiError(
            'TOKEN_REFRESH_FAILED',
            'Authentication failed. Please login again.',
            refreshError,
            401
          );
        }
      }

      // Handle API errors
      const errorResponse = data as ErrorResponse;
      if (errorResponse?.error) {
        throw new ApiError(
          errorResponse.error.code,
          errorResponse.error.message,
          errorResponse.error.details,
          status
        );
      }

      // Handle generic HTTP errors
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

      const message = errorMessages[status] || `HTTP Error ${status}`;
      
      throw new ApiError(
        `HTTP_${status}`,
        message,
        error.response?.data,
        status
      );
    }
  );

  return client;
};

// Generate correlation ID for request tracking
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create the API client instance
export const apiClient = createApiClient();

// Enhanced API client class
export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  // Generic GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return RequestRetry.execute(async () => {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return response.data;
    });
  }

  // Generic POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return RequestRetry.execute(async () => {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      return response.data;
    });
  }

  // Generic PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return RequestRetry.execute(async () => {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return response.data;
    });
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return RequestRetry.execute(async () => {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    });
  }

  // Generic DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return RequestRetry.execute(async () => {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return response.data;
    });
  }

  // Upload file with progress tracking
  async upload<T>(
    url: string,
    file: File | FormData,
    onProgress?: (progressEvent: any) => void,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    const uploadConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    };

    return RequestRetry.execute(async () => {
      const response = await this.client.post<ApiResponse<T>>(url, formData, uploadConfig);
      return response.data;
    });
  }

  // Download file
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const downloadConfig: AxiosRequestConfig = {
      ...config,
      responseType: 'blob',
    };

    return RequestRetry.execute(async () => {
      const response = await this.client.get(url, downloadConfig);
      return response.data;
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Get client instance for direct access
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Export default instance
export const api = new ApiClient();
export { TokenManager };

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
    _retry?: boolean;
  }
} 