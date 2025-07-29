export declare const API_VERSION = "v1";
export declare const API_PREFIX = "/api/v1";
export declare const DEFAULT_PAGE = 1;
export declare const DEFAULT_LIMIT = 20;
export declare const MAX_LIMIT = 100;
export declare const CACHE_TTL: {
    readonly SHORT: 60;
    readonly MEDIUM: 300;
    readonly LONG: 3600;
    readonly DAY: 86400;
    readonly WEEK: 604800;
};
export declare const RATE_LIMIT: {
    readonly WINDOW_MS: number;
    readonly MAX_REQUESTS: 100;
    readonly SKIP_SUCCESSFUL_REQUESTS: false;
};
export declare const JWT_EXPIRY: {
    readonly ACCESS_TOKEN: "15m";
    readonly REFRESH_TOKEN: "7d";
    readonly EMAIL_VERIFICATION: "24h";
    readonly PASSWORD_RESET: "1h";
};
export declare const EMAIL_TEMPLATES: {
    readonly WELCOME: "welcome";
    readonly EMAIL_VERIFICATION: "email-verification";
    readonly PASSWORD_RESET: "password-reset";
    readonly ORDER_CONFIRMATION: "order-confirmation";
    readonly ORDER_SHIPPED: "order-shipped";
    readonly ORDER_DELIVERED: "order-delivered";
    readonly ORDER_CANCELLED: "order-cancelled";
};
export declare const KAFKA_TOPICS: {
    readonly USER_CREATED: "user.created";
    readonly USER_UPDATED: "user.updated";
    readonly USER_DELETED: "user.deleted";
    readonly PRODUCT_CREATED: "product.created";
    readonly PRODUCT_UPDATED: "product.updated";
    readonly PRODUCT_DELETED: "product.deleted";
    readonly PRODUCT_STOCK_UPDATED: "product.stock.updated";
    readonly ORDER_CREATED: "order.created";
    readonly ORDER_UPDATED: "order.updated";
    readonly ORDER_CANCELLED: "order.cancelled";
    readonly ORDER_COMPLETED: "order.completed";
    readonly PAYMENT_INITIATED: "payment.initiated";
    readonly PAYMENT_COMPLETED: "payment.completed";
    readonly PAYMENT_FAILED: "payment.failed";
    readonly PAYMENT_REFUNDED: "payment.refunded";
    readonly CART_UPDATED: "cart.updated";
    readonly CART_CLEARED: "cart.cleared";
    readonly EMAIL_SEND: "email.send";
    readonly SMS_SEND: "sms.send";
    readonly NOTIFICATION_PUSH: "notification.push";
};
export declare const REDIS_KEYS: {
    readonly USER_SESSION: (userId: string) => string;
    readonly USER_PROFILE: (userId: string) => string;
    readonly USER_CART: (userId: string) => string;
    readonly PRODUCT: (productId: string) => string;
    readonly PRODUCT_STOCK: (productId: string) => string;
    readonly PRODUCT_VIEWS: (productId: string) => string;
    readonly ORDER: (orderId: string) => string;
    readonly RATE_LIMIT: (ip: string) => string;
    readonly OTP: (phone: string) => string;
    readonly EMAIL_VERIFICATION: (token: string) => string;
    readonly PASSWORD_RESET: (token: string) => string;
};
export declare const FILE_UPLOAD: {
    readonly MAX_SIZE: number;
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "image/webp"];
    readonly ALLOWED_DOCUMENT_TYPES: readonly ["application/pdf"];
    readonly MAX_IMAGES_PER_PRODUCT: 10;
    readonly MAX_IMAGES_PER_REVIEW: 5;
};
export declare const CURRENCY: {
    readonly DEFAULT: "UZS";
    readonly SUPPORTED: readonly ["UZS", "USD", "RUB", "EUR"];
};
export declare const ORDER_CONSTRAINTS: {
    readonly MIN_ORDER_AMOUNT: 10;
    readonly MAX_ORDER_AMOUNT: 50000;
    readonly MAX_ITEMS_PER_ORDER: 100;
};
export declare const SEARCH_CONFIG: {
    readonly MIN_QUERY_LENGTH: 2;
    readonly MAX_QUERY_LENGTH: 100;
    readonly FUZZY_THRESHOLD: 0.8;
};
export declare const REGEX: {
    readonly EMAIL: RegExp;
    readonly PHONE: RegExp;
    readonly PASSWORD: RegExp;
    readonly USERNAME: RegExp;
    readonly POSTAL_CODE: RegExp;
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
};
//# sourceMappingURL=constants.d.ts.map