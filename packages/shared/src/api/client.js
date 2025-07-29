"use strict";
/**
 * 🚀 ULTRAMARKET PROFESSIONAL API CLIENT
 * Enterprise-grade TypeScript API client with advanced features
 * @version 3.0.0
 * @author UltraMarket Backend Team
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = exports.apiClient = exports.UltraMarketApiClient = void 0;
var axios_1 = __importDefault(require("axios"));
var types_1 = require("./types");
var DEFAULT_CONFIG = {
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
var TokenManager = /** @class */ (function () {
    function TokenManager() {
    }
    TokenManager.getAccessToken = function () {
        try {
            return localStorage.getItem(this.ACCESS_TOKEN_KEY);
        }
        catch (_a) {
            return null;
        }
    };
    TokenManager.getRefreshToken = function () {
        try {
            return localStorage.getItem(this.REFRESH_TOKEN_KEY);
        }
        catch (_a) {
            return null;
        }
    };
    TokenManager.setTokens = function (tokens) {
        try {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
            var expiryTime = Date.now() + (tokens.expiresIn * 1000);
            localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
        }
        catch (error) {
            console.error('Failed to store tokens:', error);
        }
    };
    TokenManager.clearTokens = function () {
        try {
            localStorage.removeItem(this.ACCESS_TOKEN_KEY);
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
            localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        }
        catch (error) {
            console.error('Failed to clear tokens:', error);
        }
    };
    TokenManager.isTokenExpired = function () {
        try {
            var expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
            if (!expiryTime)
                return true;
            return Date.now() >= parseInt(expiryTime) - 300000; // 5 minutes buffer
        }
        catch (_a) {
            return true;
        }
    };
    TokenManager.isAuthenticated = function () {
        return !!this.getAccessToken() && !this.isTokenExpired();
    };
    TokenManager.ACCESS_TOKEN_KEY = 'ultramarket_access_token';
    TokenManager.REFRESH_TOKEN_KEY = 'ultramarket_refresh_token';
    TokenManager.TOKEN_EXPIRY_KEY = 'ultramarket_token_expiry';
    return TokenManager;
}());
exports.TokenManager = TokenManager;
// Request Metrics Class
var RequestMetrics = /** @class */ (function () {
    function RequestMetrics() {
    }
    RequestMetrics.recordRequest = function (endpoint, duration, success) {
        var key = endpoint;
        var existing = this.metrics.get(key) || {
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
    };
    RequestMetrics.getMetrics = function () {
        var result = {};
        this.metrics.forEach(function (value, key) {
            result[key] = __assign(__assign({}, value), { averageTime: value.count > 0 ? value.totalTime / value.count : 0, errorRate: value.count > 0 ? value.errors / value.count : 0 });
        });
        return result;
    };
    RequestMetrics.metrics = new Map();
    return RequestMetrics;
}());
// Professional API Client Class
var UltraMarketApiClient = /** @class */ (function () {
    function UltraMarketApiClient(config) {
        if (config === void 0) { config = {}; }
        this.refreshTokenPromise = null;
        this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
        this.client = this.createAxiosInstance();
        this.setupInterceptors();
    }
    UltraMarketApiClient.prototype.createAxiosInstance = function () {
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
    };
    UltraMarketApiClient.prototype.setupInterceptors = function () {
        var _this = this;
        // Request Interceptor
        this.client.interceptors.request.use(function (config) { return __awaiter(_this, void 0, void 0, function () {
            var token;
            var _a;
            return __generator(this, function (_b) {
                token = TokenManager.getAccessToken();
                if (token && !TokenManager.isTokenExpired()) {
                    config.headers.Authorization = "Bearer ".concat(token);
                }
                // Add request metadata
                config.metadata = {
                    startTime: Date.now(),
                    endpoint: "".concat((_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase(), " ").concat(config.url),
                };
                // Add correlation ID for request tracking
                config.headers['X-Correlation-ID'] = this.generateCorrelationId();
                // Add user agent information
                if (typeof window !== 'undefined') {
                    config.headers['User-Agent'] = window.navigator.userAgent;
                }
                if (this.config.enableLogging) {
                    console.debug("\uD83D\uDE80 API Request: ".concat(config.metadata.endpoint), {
                        params: config.params,
                        data: config.data,
                    });
                }
                return [2 /*return*/, config];
            });
        }); }, function (error) {
            return Promise.reject(_this.createApiError('REQUEST_SETUP_ERROR', 'Failed to setup request', error));
        });
        // Response Interceptor
        this.client.interceptors.response.use(function (response) {
            var _a, _b;
            var startTime = (_a = response.config.metadata) === null || _a === void 0 ? void 0 : _a.startTime;
            var endpoint = (_b = response.config.metadata) === null || _b === void 0 ? void 0 : _b.endpoint;
            if (startTime && endpoint) {
                var duration = Date.now() - startTime;
                if (_this.config.enableMetrics) {
                    RequestMetrics.recordRequest(endpoint, duration, true);
                }
                if (_this.config.enableLogging) {
                    console.debug("\u2705 API Success: ".concat(endpoint, " - ").concat(duration, "ms"), {
                        status: response.status,
                        data: response.data,
                    });
                }
            }
            return response;
        }, function (error) { return __awaiter(_this, void 0, void 0, function () {
            var config, startTime, endpoint, duration, newToken, refreshError_1, _a, status, data, errorResponse, errorMessages, message;
            var _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        config = error.config;
                        startTime = (_b = config === null || config === void 0 ? void 0 : config.metadata) === null || _b === void 0 ? void 0 : _b.startTime;
                        endpoint = (_c = config === null || config === void 0 ? void 0 : config.metadata) === null || _c === void 0 ? void 0 : _c.endpoint;
                        if (startTime && endpoint && this.config.enableMetrics) {
                            duration = Date.now() - startTime;
                            RequestMetrics.recordRequest(endpoint, duration, false);
                        }
                        if (!(((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) === 401 &&
                            config &&
                            !config._retry &&
                            this.config.enableRefreshToken)) return [3 /*break*/, 4];
                        config._retry = true;
                        _j.label = 1;
                    case 1:
                        _j.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.refreshAccessToken()];
                    case 2:
                        newToken = _j.sent();
                        config.headers.Authorization = "Bearer ".concat(newToken);
                        if (this.config.enableLogging) {
                            console.debug('🔄 Token refreshed, retrying request');
                        }
                        return [2 /*return*/, this.client(config)];
                    case 3:
                        refreshError_1 = _j.sent();
                        TokenManager.clearTokens();
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('auth:logout'));
                        }
                        throw this.createApiError('TOKEN_REFRESH_FAILED', 'Authentication failed. Please login again.', refreshError_1, 401);
                    case 4:
                        // Handle network errors
                        if (!error.response) {
                            throw new types_1.NetworkError('Network error occurred. Please check your connection.', error);
                        }
                        _a = error.response, status = _a.status, data = _a.data;
                        errorResponse = data;
                        if (this.config.enableLogging) {
                            console.error("\u274C API Error: ".concat(endpoint), {
                                status: status,
                                error: errorResponse,
                            });
                        }
                        errorMessages = {
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
                        message = ((_e = errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.error) === null || _e === void 0 ? void 0 : _e.message) ||
                            errorMessages[status] ||
                            "HTTP Error ".concat(status);
                        throw this.createApiError(((_f = errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.error) === null || _f === void 0 ? void 0 : _f.code) || "HTTP_".concat(status), message, ((_g = errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.error) === null || _g === void 0 ? void 0 : _g.details) || ((_h = error.response) === null || _h === void 0 ? void 0 : _h.data), status);
                }
            });
        }); });
    };
    UltraMarketApiClient.prototype.refreshAccessToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.refreshTokenPromise) {
                    return [2 /*return*/, this.refreshTokenPromise];
                }
                this.refreshTokenPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                    var refreshToken, response, tokens;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                refreshToken = TokenManager.getRefreshToken();
                                if (!refreshToken) {
                                    throw new Error('No refresh token available');
                                }
                                return [4 /*yield*/, axios_1.default.post("".concat(this.config.baseURL, "/auth/refresh"), {
                                        refreshToken: refreshToken,
                                    })];
                            case 1:
                                response = _a.sent();
                                tokens = response.data.data.tokens;
                                TokenManager.setTokens(tokens);
                                this.refreshTokenPromise = null;
                                return [2 /*return*/, tokens.accessToken];
                        }
                    });
                }); })();
                return [2 /*return*/, this.refreshTokenPromise];
            });
        });
    };
    UltraMarketApiClient.prototype.generateCorrelationId = function () {
        return "".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
    };
    UltraMarketApiClient.prototype.createApiError = function (code, message, details, statusCode) {
        return new types_1.ApiClientError(code, message, statusCode, details);
    };
    UltraMarketApiClient.prototype.retryRequest = function (operation, config) {
        return __awaiter(this, void 0, void 0, function () {
            var maxAttempts, delayMs, lastError, attempt, error_1, status_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        maxAttempts = (_a = config === null || config === void 0 ? void 0 : config.retries) !== null && _a !== void 0 ? _a : this.config.retryAttempts;
                        delayMs = (_b = config === null || config === void 0 ? void 0 : config.retryDelay) !== null && _b !== void 0 ? _b : this.config.retryDelay;
                        if (!this.config.enableRetries) {
                            return [2 /*return*/, operation()];
                        }
                        attempt = 1;
                        _c.label = 1;
                    case 1:
                        if (!(attempt <= maxAttempts)) return [3 /*break*/, 7];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, operation()];
                    case 3: return [2 /*return*/, _c.sent()];
                    case 4:
                        error_1 = _c.sent();
                        lastError = error_1;
                        // Don't retry on client errors (4xx) except 401 and 429
                        if (error_1 instanceof types_1.ApiClientError) {
                            status_1 = error_1.statusCode;
                            if (status_1 && status_1 >= 400 && status_1 < 500 && status_1 !== 401 && status_1 !== 429) {
                                throw error_1;
                            }
                        }
                        if (attempt === maxAttempts) {
                            return [3 /*break*/, 7];
                        }
                        return [4 /*yield*/, this.delay(delayMs * attempt)];
                    case 5:
                        _c.sent(); // Exponential backoff
                        return [3 /*break*/, 6];
                    case 6:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 7: throw lastError;
                }
            });
        });
    };
    UltraMarketApiClient.prototype.delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    // Generic API Methods
    UltraMarketApiClient.prototype.get = function (url, config) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.retryRequest(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.client.get(url, {
                                        timeout: config === null || config === void 0 ? void 0 : config.timeout,
                                        headers: config === null || config === void 0 ? void 0 : config.headers,
                                        params: config === null || config === void 0 ? void 0 : config.params,
                                        signal: config === null || config === void 0 ? void 0 : config.signal,
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, response.data];
                            }
                        });
                    }); }, config)];
            });
        });
    };
    UltraMarketApiClient.prototype.post = function (url, data, config) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.retryRequest(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.client.post(url, data, {
                                        timeout: config === null || config === void 0 ? void 0 : config.timeout,
                                        headers: config === null || config === void 0 ? void 0 : config.headers,
                                        params: config === null || config === void 0 ? void 0 : config.params,
                                        signal: config === null || config === void 0 ? void 0 : config.signal,
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, response.data];
                            }
                        });
                    }); }, config)];
            });
        });
    };
    UltraMarketApiClient.prototype.put = function (url, data, config) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.retryRequest(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.client.put(url, data, {
                                        timeout: config === null || config === void 0 ? void 0 : config.timeout,
                                        headers: config === null || config === void 0 ? void 0 : config.headers,
                                        params: config === null || config === void 0 ? void 0 : config.params,
                                        signal: config === null || config === void 0 ? void 0 : config.signal,
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, response.data];
                            }
                        });
                    }); }, config)];
            });
        });
    };
    UltraMarketApiClient.prototype.patch = function (url, data, config) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.retryRequest(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.client.patch(url, data, {
                                        timeout: config === null || config === void 0 ? void 0 : config.timeout,
                                        headers: config === null || config === void 0 ? void 0 : config.headers,
                                        params: config === null || config === void 0 ? void 0 : config.params,
                                        signal: config === null || config === void 0 ? void 0 : config.signal,
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, response.data];
                            }
                        });
                    }); }, config)];
            });
        });
    };
    UltraMarketApiClient.prototype.delete = function (url, config) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.retryRequest(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.client.delete(url, {
                                        timeout: config === null || config === void 0 ? void 0 : config.timeout,
                                        headers: config === null || config === void 0 ? void 0 : config.headers,
                                        params: config === null || config === void 0 ? void 0 : config.params,
                                        signal: config === null || config === void 0 ? void 0 : config.signal,
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, response.data];
                            }
                        });
                    }); }, config)];
            });
        });
    };
    // Authentication Methods
    UltraMarketApiClient.prototype.login = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.post('/auth/login', credentials)];
                    case 1:
                        response = _a.sent();
                        if (response.success && response.data) {
                            TokenManager.setTokens(response.data.tokens);
                        }
                        return [2 /*return*/, response];
                }
            });
        });
    };
    UltraMarketApiClient.prototype.register = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.post('/auth/register', userData)];
                    case 1:
                        response = _a.sent();
                        if (response.success && response.data) {
                            TokenManager.setTokens(response.data.tokens);
                        }
                        return [2 /*return*/, response];
                }
            });
        });
    };
    UltraMarketApiClient.prototype.logout = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, , 2, 3]);
                        return [4 /*yield*/, this.post('/auth/logout')];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 2:
                        TokenManager.clearTokens();
                        return [7 /*endfinally*/];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UltraMarketApiClient.prototype.getCurrentUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get('/auth/me')];
            });
        });
    };
    // Product Methods
    UltraMarketApiClient.prototype.getProducts = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get('/products', { params: filters })];
            });
        });
    };
    UltraMarketApiClient.prototype.getProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get("/products/".concat(id))];
            });
        });
    };
    UltraMarketApiClient.prototype.searchProducts = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get('/products/search', {
                        params: __assign({ query: query }, filters)
                    })];
            });
        });
    };
    // Order Methods
    UltraMarketApiClient.prototype.createOrder = function (orderData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post('/orders', orderData)];
            });
        });
    };
    UltraMarketApiClient.prototype.getOrders = function () {
        return __awaiter(this, arguments, void 0, function (page, limit) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get('/orders', { params: { page: page, limit: limit } })];
            });
        });
    };
    UltraMarketApiClient.prototype.getOrder = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get("/orders/".concat(id))];
            });
        });
    };
    // Cart Methods
    UltraMarketApiClient.prototype.getCart = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get('/cart')];
            });
        });
    };
    UltraMarketApiClient.prototype.addToCart = function (productId_1) {
        return __awaiter(this, arguments, void 0, function (productId, quantity, variantId) {
            if (quantity === void 0) { quantity = 1; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.post('/cart/items', { productId: productId, quantity: quantity, variantId: variantId })];
            });
        });
    };
    UltraMarketApiClient.prototype.updateCartItem = function (itemId, quantity) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.put("/cart/items/".concat(itemId), { quantity: quantity })];
            });
        });
    };
    UltraMarketApiClient.prototype.removeFromCart = function (itemId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.delete("/cart/items/".concat(itemId))];
            });
        });
    };
    UltraMarketApiClient.prototype.clearCart = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.delete('/cart')];
            });
        });
    };
    // File Upload Methods
    UltraMarketApiClient.prototype.uploadFile = function (upload, config) {
        return __awaiter(this, void 0, void 0, function () {
            var formData;
            var _this = this;
            return __generator(this, function (_a) {
                formData = new FormData();
                formData.append(upload.field || 'file', upload.file, upload.fileName);
                return [2 /*return*/, this.retryRequest(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.client.post('/upload', formData, {
                                        headers: __assign({ 'Content-Type': 'multipart/form-data' }, config === null || config === void 0 ? void 0 : config.headers),
                                        timeout: (config === null || config === void 0 ? void 0 : config.timeout) || 60000, // 1 minute for uploads
                                        signal: config === null || config === void 0 ? void 0 : config.signal,
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, response.data];
                            }
                        });
                    }); }, config)];
            });
        });
    };
    // Utility Methods
    UltraMarketApiClient.prototype.getMetrics = function () {
        return RequestMetrics.getMetrics();
    };
    UltraMarketApiClient.prototype.isAuthenticated = function () {
        return TokenManager.isAuthenticated();
    };
    UltraMarketApiClient.prototype.getAccessToken = function () {
        return TokenManager.getAccessToken();
    };
    UltraMarketApiClient.prototype.clearTokens = function () {
        TokenManager.clearTokens();
    };
    UltraMarketApiClient.prototype.updateConfig = function (newConfig) {
        Object.assign(this.config, newConfig);
    };
    return UltraMarketApiClient;
}());
exports.UltraMarketApiClient = UltraMarketApiClient;
// Create default instance
exports.apiClient = new UltraMarketApiClient();
