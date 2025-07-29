"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.REGEX = exports.SEARCH_CONFIG = exports.ORDER_CONSTRAINTS = exports.CURRENCY = exports.FILE_UPLOAD = exports.REDIS_KEYS = exports.KAFKA_TOPICS = exports.EMAIL_TEMPLATES = exports.JWT_EXPIRY = exports.RATE_LIMIT = exports.CACHE_TTL = exports.MAX_LIMIT = exports.DEFAULT_LIMIT = exports.DEFAULT_PAGE = exports.API_PREFIX = exports.API_VERSION = void 0;
// API Constants
exports.API_VERSION = 'v1';
exports.API_PREFIX = `/api/${exports.API_VERSION}`;
// Pagination defaults
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_LIMIT = 20;
exports.MAX_LIMIT = 100;
// Cache TTL (in seconds)
exports.CACHE_TTL = {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
    WEEK: 604800, // 7 days
};
// Rate limiting
exports.RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    SKIP_SUCCESSFUL_REQUESTS: false,
};
// JWT expiration times
exports.JWT_EXPIRY = {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d',
    EMAIL_VERIFICATION: '24h',
    PASSWORD_RESET: '1h',
};
// Email templates
exports.EMAIL_TEMPLATES = {
    WELCOME: 'welcome',
    EMAIL_VERIFICATION: 'email-verification',
    PASSWORD_RESET: 'password-reset',
    ORDER_CONFIRMATION: 'order-confirmation',
    ORDER_SHIPPED: 'order-shipped',
    ORDER_DELIVERED: 'order-delivered',
    ORDER_CANCELLED: 'order-cancelled',
};
// Kafka topics
exports.KAFKA_TOPICS = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    PRODUCT_DELETED: 'product.deleted',
    PRODUCT_STOCK_UPDATED: 'product.stock.updated',
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_COMPLETED: 'order.completed',
    PAYMENT_INITIATED: 'payment.initiated',
    PAYMENT_COMPLETED: 'payment.completed',
    PAYMENT_FAILED: 'payment.failed',
    PAYMENT_REFUNDED: 'payment.refunded',
    CART_UPDATED: 'cart.updated',
    CART_CLEARED: 'cart.cleared',
    EMAIL_SEND: 'email.send',
    SMS_SEND: 'sms.send',
    NOTIFICATION_PUSH: 'notification.push',
};
// Redis keys
exports.REDIS_KEYS = {
    USER_SESSION: (userId) => `session:${userId}`,
    USER_PROFILE: (userId) => `user:${userId}`,
    USER_CART: (userId) => `cart:${userId}`,
    PRODUCT: (productId) => `product:${productId}`,
    PRODUCT_STOCK: (productId) => `stock:${productId}`,
    PRODUCT_VIEWS: (productId) => `views:${productId}`,
    ORDER: (orderId) => `order:${orderId}`,
    RATE_LIMIT: (ip) => `rate_limit:${ip}`,
    OTP: (phone) => `otp:${phone}`,
    EMAIL_VERIFICATION: (token) => `email_verify:${token}`,
    PASSWORD_RESET: (token) => `password_reset:${token}`,
};
// File upload limits
exports.FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
    MAX_IMAGES_PER_PRODUCT: 10,
    MAX_IMAGES_PER_REVIEW: 5,
};
// Price and currency
exports.CURRENCY = {
    DEFAULT: 'UZS',
    SUPPORTED: ['UZS', 'USD', 'RUB', 'EUR'],
};
// Order constraints
exports.ORDER_CONSTRAINTS = {
    MIN_ORDER_AMOUNT: 10.0,
    MAX_ORDER_AMOUNT: 50000.0,
    MAX_ITEMS_PER_ORDER: 100,
};
// Search configuration
exports.SEARCH_CONFIG = {
    MIN_QUERY_LENGTH: 2,
    MAX_QUERY_LENGTH: 100,
    FUZZY_THRESHOLD: 0.8,
};
// Regular expressions
exports.REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
    POSTAL_CODE: /^[A-Z0-9]{3,10}$/i,
};
// HTTP Status codes
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
};
//# sourceMappingURL=constants.js.map