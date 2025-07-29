"use strict";
/**
 * 🚀 ULTRAMARKET API TYPES - PROFESSIONAL TYPESCRIPT
 * Comprehensive type definitions for all API endpoints
 * @version 2.0.0
 * @author UltraMarket TypeScript Team
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.NetworkError = exports.ApiClientError = exports.OrderStatus = exports.PaymentStatus = exports.PaymentMethod = exports.ProductVisibility = exports.ProductStatus = exports.UserRole = void 0;
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
var ApiClientError = /** @class */ (function (_super) {
    __extends(ApiClientError, _super);
    function ApiClientError(code, message, statusCode, details) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.message = message;
        _this.statusCode = statusCode;
        _this.details = details;
        _this.name = 'ApiClientError';
        return _this;
    }
    return ApiClientError;
}(Error));
exports.ApiClientError = ApiClientError;
var NetworkError = /** @class */ (function (_super) {
    __extends(NetworkError, _super);
    function NetworkError(message, originalError) {
        var _this = _super.call(this, message) || this;
        _this.originalError = originalError;
        _this.name = 'NetworkError';
        return _this;
    }
    return NetworkError;
}(Error));
exports.NetworkError = NetworkError;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, field, value) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ValidationError';
        _this.field = field;
        _this.value = value;
        return _this;
    }
    return ValidationError;
}(Error));
exports.ValidationError = ValidationError;
// Export all types
__exportStar(require("./types"), exports);
