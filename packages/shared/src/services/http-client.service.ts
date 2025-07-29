import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger } from '../logging/logger';

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

export class HttpClientService {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  private circuitBreaker: CircuitBreakerState;
  private readonly config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
    this.retryConfig = {
      attempts: config.retryAttempts || 3,
      delay: config.retryDelay || 1000,
      backoffFactor: 2,
      maxDelay: 10000,
    };

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
    };

    this.client = this.createClient();
  }

  private createClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'UltraMarket-Service/1.0',
        ...this.config.headers,
      },
    });

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        // Add correlation ID for request tracing
        if (!config.headers['X-Correlation-ID']) {
          config.headers['X-Correlation-ID'] = this.generateCorrelationId();
        }

        // Add authentication token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        logger.info('HTTP Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          correlationId: config.headers['X-Correlation-ID'],
        });

        return config;
      },
      (error) => {
        logger.error('HTTP Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        logger.info('HTTP Response', {
          status: response.status,
          url: response.config.url,
          correlationId: response.config.headers['X-Correlation-ID'],
          responseTime: this.calculateResponseTime(response.config),
        });

        // Reset circuit breaker on successful response
        this.resetCircuitBreaker();

        return response;
      },
      (error) => {
        logger.error('HTTP Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          correlationId: error.config?.headers['X-Correlation-ID'],
          error: error.message,
        });

        // Update circuit breaker on error
        this.updateCircuitBreaker();

        return Promise.reject(error);
      }
    );

    return client;
  }

  // GET request with retry and circuit breaker
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.get<T>(url, config));
  }

  // POST request with retry and circuit breaker
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.post<T>(url, data, config));
  }

  // PUT request with retry and circuit breaker
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.put<T>(url, data, config));
  }

  // DELETE request with retry and circuit breaker
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.delete<T>(url, config));
  }

  // PATCH request with retry and circuit breaker
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => this.client.patch<T>(url, data, config));
  }

  // Execute request with retry logic and circuit breaker
  private async executeWithRetry<T>(requestFn: () => Promise<AxiosResponse<T>>): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      const circuitBreakerTimeout = this.config.circuitBreakerTimeout || 60000;

      if (timeSinceLastFailure < circuitBreakerTimeout) {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      } else {
        // Transition to half-open
        this.circuitBreaker.state = 'HALF_OPEN';
      }
    }

    let lastError: Error;
    let delay = this.retryConfig.delay;

    for (let attempt = 1; attempt <= this.retryConfig.attempts; attempt++) {
      try {
        const response = await requestFn();
        return response.data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain HTTP status codes
        if (this.shouldNotRetry(error as AxiosError)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.retryConfig.attempts) {
          break;
        }

        logger.warn(`HTTP Request failed, retrying in ${delay}ms`, {
          attempt,
          maxAttempts: this.retryConfig.attempts,
          error: (error as Error).message,
        });

        // Wait before retry
        await this.sleep(delay);

        // Exponential backoff
        delay = Math.min(delay * this.retryConfig.backoffFactor, this.retryConfig.maxDelay);
      }
    }

    throw lastError!;
  }

  // Check if request should not be retried
  private shouldNotRetry(error: AxiosError): boolean {
    if (!error.response) {
      return false; // Network errors should be retried
    }

    const status = error.response.status;

    // Don't retry client errors (4xx) except for specific cases
    if (status >= 400 && status < 500) {
      // Retry on rate limiting and authentication errors
      return ![401, 408, 429].includes(status);
    }

    // Retry server errors (5xx)
    return false;
  }

  // Circuit breaker methods
  private updateCircuitBreaker(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    const threshold = this.config.circuitBreakerThreshold || 5;
    if (this.circuitBreaker.failures >= threshold) {
      this.circuitBreaker.state = 'OPEN';
      logger.warn('Circuit breaker opened', {
        failures: this.circuitBreaker.failures,
        threshold,
      });
    }
  }

  private resetCircuitBreaker(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      logger.info('Circuit breaker closed');
    }
    this.circuitBreaker.failures = 0;
  }

  // Utility methods
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAuthToken(): string | null {
    // This would typically get the token from a token store or context
    return process.env.SERVICE_AUTH_TOKEN || null;
  }

  private calculateResponseTime(config: any): number {
    // This would calculate actual response time
    return Date.now() - (config.metadata?.startTime || Date.now());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      logger.error('Health check failed', {
        baseURL: this.config.baseURL,
        error: (error as Error).message,
      });
      return false;
    }
  }

  // Get circuit breaker status
  getCircuitBreakerStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  // Get client configuration
  getConfig(): HttpClientConfig {
    return { ...this.config };
  }
}

// Service-specific HTTP clients
export class AuthServiceClient extends HttpClientService {
  constructor() {
    super({
      baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
    });
  }

  async validateToken(token: string): Promise<any> {
    return this.post('/api/v1/auth/validate', { token });
  }

  async refreshToken(refreshToken: string): Promise<any> {
    return this.post('/api/v1/auth/refresh', { refreshToken });
  }

  async getUserById(userId: string): Promise<any> {
    return this.get(`/api/v1/users/${userId}`);
  }
}

export class UserServiceClient extends HttpClientService {
  constructor() {
    super({
      baseURL: process.env.USER_SERVICE_URL || 'http://localhost:3001',
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
    });
  }

  async getUserProfile(userId: string): Promise<any> {
    return this.get(`/api/v1/users/${userId}`);
  }

  async updateUserProfile(userId: string, data: any): Promise<any> {
    return this.put(`/api/v1/users/${userId}`, data);
  }

  async getUserAddresses(userId: string): Promise<any> {
    return this.get(`/api/v1/users/${userId}/addresses`);
  }
}

export class ProductServiceClient extends HttpClientService {
  constructor() {
    super({
      baseURL: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
      timeout: 15000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
    });
  }

  async getProduct(productId: string): Promise<any> {
    return this.get(`/api/v1/products/${productId}`);
  }

  async updateProductInventory(productId: string, quantity: number): Promise<any> {
    return this.patch(`/api/v1/products/${productId}/inventory`, { quantity });
  }

  async searchProducts(query: string, filters: any = {}): Promise<any> {
    return this.get('/api/v1/search/products', { params: { q: query, ...filters } });
  }
}

export class PaymentServiceClient extends HttpClientService {
  constructor() {
    super({
      baseURL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
      timeout: 30000,
      retryAttempts: 2,
      circuitBreakerThreshold: 3,
    });
  }

  async createPayment(paymentData: any): Promise<any> {
    return this.post('/api/v1/payments', paymentData);
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    return this.get(`/api/v1/payments/${paymentId}`);
  }

  async refundPayment(paymentId: string, refundData: any): Promise<any> {
    return this.post(`/api/v1/payments/${paymentId}/refund`, refundData);
  }
}

export class NotificationServiceClient extends HttpClientService {
  constructor() {
    super({
      baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
    });
  }

  async sendNotification(notificationData: any): Promise<any> {
    return this.post('/api/v1/notifications/send', notificationData);
  }

  async sendBulkNotification(bulkData: any): Promise<any> {
    return this.post('/api/v1/notifications/bulk-send', bulkData);
  }

  async getUserNotifications(userId: string, options: any = {}): Promise<any> {
    return this.get(`/api/v1/notifications/${userId}`, { params: options });
  }
}
