"use strict";
/**
 * Defines types for the enhanced product service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductError = exports.ProductType = exports.ProductStatus = void 0;
// Redefine ProductStatus and ProductType to match our schema
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["INACTIVE"] = "INACTIVE";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ProductType;
(function (ProductType) {
    ProductType["PHYSICAL"] = "PHYSICAL";
    ProductType["DIGITAL"] = "DIGITAL";
    ProductType["SERVICE"] = "SERVICE";
})(ProductType || (exports.ProductType = ProductType = {}));
// Custom error class for product service
class ProductError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ProductError';
    }
}
exports.ProductError = ProductError;
//# sourceMappingURL=product.types.js.map