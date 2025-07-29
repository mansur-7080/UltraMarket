"use strict";
/**
 * 🚀 ULTRAMARKET PROFESSIONAL API CLIENT
 * Enterprise-grade TypeScript API client with advanced features
 * @version 3.0.0
 * @author UltraMarket Backend Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = exports.apiClient = exports.UltraMarketApiClient = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const types_1 = require("./types");
const DEFAULT_CONFIG = {
    baseURL: process.env.VITE_API_URL || 'http://localhost:8000/api',
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
    static ACCESS_TOKEN_KEY = 'ultramarket_access_token';
    static REFRESH_TOKEN_KEY = 'ultramarket_refresh_token';
    static TOKEN_EXPIRY_KEY = 'ultramarket_token_expiry';
    static getAccessToken() {
        try {
            return localStorage.getItem(this.ACCESS_TOKEN_KEY);
        }
        catch {
            return null;
        }
    }
    static getRefreshToken() {
        try {
            return localStorage.getItem(this.REFRESH_TOKEN_KEY);
        }
        catch {
            return null;
        }
    }
    static setTokens(tokens) {
        try {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
            const expiryTime = Date.now() + (tokens.expiresIn * 1000);
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        }
        catch (error) {
            console.error('Failed to store tokens:', error);
        }
    }
    static clearTokens() {
        try {
            localStorage.removeItem(this.ACCESS_TOKEN_KEY);
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
            localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        }
        catch (error) {
            console.error('Failed to clear tokens:', error);
        }
    }
    static isTokenExpired() {
        try {
            const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
            if (!expiryTime)
                return true;
            return Date.now() >= parseInt(expiryTime) - 300000; // 5 minutes buffer
        }
        catch {
            return true;
        }
    }
    static isAuthenticated() {
        return !!this.getAccessToken() && !this.isTokenExpired();
    }
}
exports.TokenManager = TokenManager;
// Request Metrics Class
class RequestMetrics {
    static metrics = new Map();
    static recordRequest(endpoint, duration, success) {
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
    static getMetrics() {
        const result = {};
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
class UltraMarketApiClient {
    client;
    config;
    refreshTokenPromise = null;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.client = this.createAxiosInstance();
        this.setupInterceptors();
    }
    createAxiosInstance() {
        return axios_1.default.create({
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
    setupInterceptors() {
        // Request Interceptor
        this.client.interceptors.request.use(async (config) => {
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
        }, (error) => {
            return Promise.reject(this.createApiError('REQUEST_SETUP_ERROR', 'Failed to setup request', error));
        });
        // Response Interceptor
        this.client.interceptors.response.use((response) => {
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
        }, async (error) => {
            const config = error.config;
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
                }
                catch (refreshError) {
                    TokenManager.clearTokens();
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('auth:logout'));
                    }
                    throw this.createApiError('TOKEN_REFRESH_FAILED', 'Authentication failed. Please login again.', refreshError, 401);
                }
            }
            // Handle network errors
            if (!error.response) {
                throw new types_1.NetworkError('Network error occurred. Please check your connection.', error);
            }
            // Handle API errors
            const { status, data } = error.response;
            const errorResponse = data;
            if (this.config.enableLogging) {
                console.error(`❌ API Error: ${endpoint}`, {
                    status,
                    error: errorResponse,
                });
            }
            // Handle specific HTTP status codes
            const errorMessages = {
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
            throw this.createApiError(errorResponse?.error?.code || `HTTP_${status}`, message, errorResponse?.error?.details || error.response?.data, status);
        });
    }
    async refreshAccessToken() {
        if (this.refreshTokenPromise) {
            return this.refreshTokenPromise;
        }
        this.refreshTokenPromise = (async () => {
            const refreshToken = TokenManager.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            const response = await axios_1.default.post(`${this.config.baseURL}/auth/refresh`, {
                refreshToken,
            });
            const tokens = response.data.data.tokens;
            TokenManager.setTokens(tokens);
            this.refreshTokenPromise = null;
            return tokens.accessToken;
        })();
        return this.refreshTokenPromise;
    }
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    createApiError(code, message, details, statusCode) {
        return new types_1.ApiClientError(code, message, statusCode, details);
    }
    async retryRequest(operation, config) {
        const maxAttempts = config?.retries ?? this.config.retryAttempts;
        const delayMs = config?.retryDelay ?? this.config.retryDelay;
        if (!this.config.enableRetries) {
            return operation();
        }
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Don't retry on client errors (4xx) except 401 and 429
                if (error instanceof types_1.ApiClientError) {
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
        throw lastError;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Generic API Methods
    async get(url, config) {
        return this.retryRequest(async () => {
            const response = await this.client.get(url, {
                timeout: config?.timeout,
                headers: config?.headers,
                params: config?.params,
                signal: config?.signal,
            });
            return response.data;
        }, config);
    }
    async post(url, data, config) {
        return this.retryRequest(async () => {
            const response = await this.client.post(url, data, {
                timeout: config?.timeout,
                headers: config?.headers,
                params: config?.params,
                signal: config?.signal,
            });
            return response.data;
        }, config);
    }
    async put(url, data, config) {
        return this.retryRequest(async () => {
            const response = await this.client.put(url, data, {
                timeout: config?.timeout,
                headers: config?.headers,
                params: config?.params,
                signal: config?.signal,
            });
            return response.data;
        }, config);
    }
    async patch(url, data, config) {
        return this.retryRequest(async () => {
            const response = await this.client.patch(url, data, {
                timeout: config?.timeout,
                headers: config?.headers,
                params: config?.params,
                signal: config?.signal,
            });
            return response.data;
        }, config);
    }
    async delete(url, config) {
        return this.retryRequest(async () => {
            const response = await this.client.delete(url, {
                timeout: config?.timeout,
                headers: config?.headers,
                params: config?.params,
                signal: config?.signal,
            });
            return response.data;
        }, config);
    }
    // Authentication Methods
    async login(credentials) {
        const response = await this.post('/auth/login', credentials);
        if (response.success && response.data) {
            TokenManager.setTokens(response.data.tokens);
        }
        return response;
    }
    async register(userData) {
        const response = await this.post('/auth/register', userData);
        if (response.success && response.data) {
            TokenManager.setTokens(response.data.tokens);
        }
        return response;
    }
    async logout() {
        try {
            const response = await this.post('/auth/logout');
            return response;
        }
        finally {
            TokenManager.clearTokens();
        }
    }
    async getCurrentUser() {
        return this.get('/auth/me');
    }
    // Product Methods
    async getProducts(filters) {
        return this.get('/products', { params: filters });
    }
    async getProduct(id) {
        return this.get(`/products/${id}`);
    }
    async searchProducts(query, filters) {
        return this.get('/products/search', {
            params: { query, ...filters }
        });
    }
    // Order Methods
    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }
    async getOrders(page = 1, limit = 10) {
        return this.get('/orders', { params: { page, limit } });
    }
    async getOrder(id) {
        return this.get(`/orders/${id}`);
    }
    // Cart Methods
    async getCart() {
        return this.get('/cart');
    }
    async addToCart(productId, quantity = 1, variantId) {
        return this.post('/cart/items', { productId, quantity, variantId });
    }
    async updateCartItem(itemId, quantity) {
        return this.put(`/cart/items/${itemId}`, { quantity });
    }
    async removeFromCart(itemId) {
        return this.delete(`/cart/items/${itemId}`);
    }
    async clearCart() {
        return this.delete('/cart');
    }
    // File Upload Methods
    async uploadFile(upload, config) {
        const formData = new FormData();
        formData.append(upload.field || 'file', upload.file, upload.fileName);
        return this.retryRequest(async () => {
            const response = await this.client.post('/upload', formData, {
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
    getMetrics() {
        return RequestMetrics.getMetrics();
    }
    isAuthenticated() {
        return TokenManager.isAuthenticated();
    }
    getAccessToken() {
        return TokenManager.getAccessToken();
    }
    clearTokens() {
        TokenManager.clearTokens();
    }
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }
}
exports.UltraMarketApiClient = UltraMarketApiClient;
// Create default instance
exports.apiClient = new UltraMarketApiClient();
//# sourceMappingURL=client.js.map