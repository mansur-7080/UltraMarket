"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationServiceClient = exports.PaymentServiceClient = exports.ProductServiceClient = exports.UserServiceClient = exports.AuthServiceClient = exports.HttpClientService = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const logger_1 = require("../logging/logger");
class HttpClientService {
    client;
    retryConfig;
    circuitBreaker;
    config;
    constructor(config) {
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
    createClient() {
        const client = axios_1.default.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'UltraMarket-Service/1.0',
                ...this.config.headers,
            },
        });
        // Request interceptor
        client.interceptors.request.use((config) => {
            // Add correlation ID for request tracing
            if (!config.headers['X-Correlation-ID']) {
                config.headers['X-Correlation-ID'] = this.generateCorrelationId();
            }
            // Add authentication token if available
            const token = this.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            logger_1.logger.info('HTTP Request', {
                method: config.method?.toUpperCase(),
                url: config.url,
                baseURL: config.baseURL,
                correlationId: config.headers['X-Correlation-ID'],
            });
            return config;
        }, (error) => {
            logger_1.logger.error('HTTP Request Error', { error: error.message });
            return Promise.reject(error);
        });
        // Response interceptor
        client.interceptors.response.use((response) => {
            logger_1.logger.info('HTTP Response', {
                status: response.status,
                url: response.config.url,
                correlationId: response.config.headers['X-Correlation-ID'],
                responseTime: this.calculateResponseTime(response.config),
            });
            // Reset circuit breaker on successful response
            this.resetCircuitBreaker();
            return response;
        }, (error) => {
            logger_1.logger.error('HTTP Response Error', {
                status: error.response?.status,
                url: error.config?.url,
                correlationId: error.config?.headers['X-Correlation-ID'],
                error: error.message,
            });
            // Update circuit breaker on error
            this.updateCircuitBreaker();
            return Promise.reject(error);
        });
        return client;
    }
    // GET request with retry and circuit breaker
    async get(url, config) {
        return this.executeWithRetry(() => this.client.get(url, config));
    }
    // POST request with retry and circuit breaker
    async post(url, data, config) {
        return this.executeWithRetry(() => this.client.post(url, data, config));
    }
    // PUT request with retry and circuit breaker
    async put(url, data, config) {
        return this.executeWithRetry(() => this.client.put(url, data, config));
    }
    // DELETE request with retry and circuit breaker
    async delete(url, config) {
        return this.executeWithRetry(() => this.client.delete(url, config));
    }
    // PATCH request with retry and circuit breaker
    async patch(url, data, config) {
        return this.executeWithRetry(() => this.client.patch(url, data, config));
    }
    // Execute request with retry logic and circuit breaker
    async executeWithRetry(requestFn) {
        // Check circuit breaker
        if (this.circuitBreaker.state === 'OPEN') {
            const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
            const circuitBreakerTimeout = this.config.circuitBreakerTimeout || 60000;
            if (timeSinceLastFailure < circuitBreakerTimeout) {
                throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
            }
            else {
                // Transition to half-open
                this.circuitBreaker.state = 'HALF_OPEN';
            }
        }
        let lastError;
        let delay = this.retryConfig.delay;
        for (let attempt = 1; attempt <= this.retryConfig.attempts; attempt++) {
            try {
                const response = await requestFn();
                return response.data;
            }
            catch (error) {
                lastError = error;
                // Don't retry on certain HTTP status codes
                if (this.shouldNotRetry(error)) {
                    throw error;
                }
                // Don't retry on last attempt
                if (attempt === this.retryConfig.attempts) {
                    break;
                }
                logger_1.logger.warn(`HTTP Request failed, retrying in ${delay}ms`, {
                    attempt,
                    maxAttempts: this.retryConfig.attempts,
                    error: error.message,
                });
                // Wait before retry
                await this.sleep(delay);
                // Exponential backoff
                delay = Math.min(delay * this.retryConfig.backoffFactor, this.retryConfig.maxDelay);
            }
        }
        throw lastError;
    }
    // Check if request should not be retried
    shouldNotRetry(error) {
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
    updateCircuitBreaker() {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailureTime = Date.now();
        const threshold = this.config.circuitBreakerThreshold || 5;
        if (this.circuitBreaker.failures >= threshold) {
            this.circuitBreaker.state = 'OPEN';
            logger_1.logger.warn('Circuit breaker opened', {
                failures: this.circuitBreaker.failures,
                threshold,
            });
        }
    }
    resetCircuitBreaker() {
        if (this.circuitBreaker.state === 'HALF_OPEN') {
            this.circuitBreaker.state = 'CLOSED';
            logger_1.logger.info('Circuit breaker closed');
        }
        this.circuitBreaker.failures = 0;
    }
    // Utility methods
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getAuthToken() {
        // This would typically get the token from a token store or context
        return process.env.SERVICE_AUTH_TOKEN || null;
    }
    calculateResponseTime(config) {
        // This would calculate actual response time
        return Date.now() - (config.metadata?.startTime || Date.now());
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    // Health check method
    async healthCheck() {
        try {
            await this.client.get('/health', { timeout: 5000 });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Health check failed', {
                baseURL: this.config.baseURL,
                error: error.message,
            });
            return false;
        }
    }
    // Get circuit breaker status
    getCircuitBreakerStatus() {
        return { ...this.circuitBreaker };
    }
    // Get client configuration
    getConfig() {
        return { ...this.config };
    }
}
exports.HttpClientService = HttpClientService;
// Service-specific HTTP clients
class AuthServiceClient extends HttpClientService {
    constructor() {
        super({
            baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
            timeout: 10000,
            retryAttempts: 3,
            circuitBreakerThreshold: 5,
        });
    }
    async validateToken(token) {
        return this.post('/api/v1/auth/validate', { token });
    }
    async refreshToken(refreshToken) {
        return this.post('/api/v1/auth/refresh', { refreshToken });
    }
    async getUserById(userId) {
        return this.get(`/api/v1/users/${userId}`);
    }
}
exports.AuthServiceClient = AuthServiceClient;
class UserServiceClient extends HttpClientService {
    constructor() {
        super({
            baseURL: process.env.USER_SERVICE_URL || 'http://localhost:3001',
            timeout: 10000,
            retryAttempts: 3,
            circuitBreakerThreshold: 5,
        });
    }
    async getUserProfile(userId) {
        return this.get(`/api/v1/users/${userId}`);
    }
    async updateUserProfile(userId, data) {
        return this.put(`/api/v1/users/${userId}`, data);
    }
    async getUserAddresses(userId) {
        return this.get(`/api/v1/users/${userId}/addresses`);
    }
}
exports.UserServiceClient = UserServiceClient;
class ProductServiceClient extends HttpClientService {
    constructor() {
        super({
            baseURL: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
            timeout: 15000,
            retryAttempts: 3,
            circuitBreakerThreshold: 5,
        });
    }
    async getProduct(productId) {
        return this.get(`/api/v1/products/${productId}`);
    }
    async updateProductInventory(productId, quantity) {
        return this.patch(`/api/v1/products/${productId}/inventory`, { quantity });
    }
    async searchProducts(query, filters = {}) {
        return this.get('/api/v1/search/products', { params: { q: query, ...filters } });
    }
}
exports.ProductServiceClient = ProductServiceClient;
class PaymentServiceClient extends HttpClientService {
    constructor() {
        super({
            baseURL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
            timeout: 30000,
            retryAttempts: 2,
            circuitBreakerThreshold: 3,
        });
    }
    async createPayment(paymentData) {
        return this.post('/api/v1/payments', paymentData);
    }
    async getPaymentStatus(paymentId) {
        return this.get(`/api/v1/payments/${paymentId}`);
    }
    async refundPayment(paymentId, refundData) {
        return this.post(`/api/v1/payments/${paymentId}/refund`, refundData);
    }
}
exports.PaymentServiceClient = PaymentServiceClient;
class NotificationServiceClient extends HttpClientService {
    constructor() {
        super({
            baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
            timeout: 10000,
            retryAttempts: 3,
            circuitBreakerThreshold: 5,
        });
    }
    async sendNotification(notificationData) {
        return this.post('/api/v1/notifications/send', notificationData);
    }
    async sendBulkNotification(bulkData) {
        return this.post('/api/v1/notifications/bulk-send', bulkData);
    }
    async getUserNotifications(userId, options = {}) {
        return this.get(`/api/v1/notifications/${userId}`, { params: options });
    }
}
exports.NotificationServiceClient = NotificationServiceClient;
//# sourceMappingURL=http-client.service.js.map