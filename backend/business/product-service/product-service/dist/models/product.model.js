"use strict";
/**
 * Core model types for the Product Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductType = exports.ProductStatus = void 0;
/**
 * Enum representing product statuses
 */
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
    ProductStatus["OUTOFSTOCK"] = "OUTOFSTOCK";
    ProductStatus["COMINGSOON"] = "COMINGSOON";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
/**
 * Enum representing product types
 */
var ProductType;
(function (ProductType) {
    ProductType["PHYSICAL"] = "PHYSICAL";
    ProductType["DIGITAL"] = "DIGITAL";
    ProductType["SERVICE"] = "SERVICE";
    ProductType["SUBSCRIPTION"] = "SUBSCRIPTION";
})(ProductType || (exports.ProductType = ProductType = {}));
//# sourceMappingURL=product.model.js.map