"use strict";
/**
 * 🚀 ULTRAMARKET API TYPES - PROFESSIONAL TYPESCRIPT
 * Comprehensive type definitions for all API endpoints
 * @version 2.0.0
 * @author UltraMarket TypeScript Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.NetworkError = exports.ApiClientError = exports.OrderStatus = exports.PaymentStatus = exports.PaymentMethod = exports.ProductVisibility = exports.ProductStatus = exports.UserRole = void 0;
const tslib_1 = require("tslib");
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "customer";
    UserRole["ADMIN"] = "admin";
    UserRole["MODERATOR"] = "moderator";
    UserRole["VENDOR"] = "vendor";
})(UserRole || (exports.UserRole = UserRole = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "draft";
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["INACTIVE"] = "inactive";
    ProductStatus["ARCHIVED"] = "archived";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ProductVisibility;
(function (ProductVisibility) {
    ProductVisibility["PUBLIC"] = "public";
    ProductVisibility["PRIVATE"] = "private";
    ProductVisibility["HIDDEN"] = "hidden";
})(ProductVisibility || (exports.ProductVisibility = ProductVisibility = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["CLICK"] = "click";
    PaymentMethod["PAYME"] = "payme";
    PaymentMethod["UZCARD"] = "uzcard";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["PARTIALLY_REFUNDED"] = "partially_refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// Error Types
class ApiClientError extends Error {
    code;
    message;
    statusCode;
    details;
    constructor(code, message, statusCode, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiClientError';
    }
}
exports.ApiClientError = ApiClientError;
class NetworkError extends Error {
    originalError;
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
class ValidationError extends Error {
    field;
    value;
    constructor(message, field, value) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}
exports.ValidationError = ValidationError;
// Export all types
tslib_1.__exportStar(require("./types"), exports);
//# sourceMappingURL=types.js.map