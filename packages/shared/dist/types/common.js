"use strict";
/**
 * Common TypeScript interfaces and types
 * Professional type definitions for the UltraMarket platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationChannel = exports.NotificationType = exports.FacetType = exports.FilterOperator = exports.SearchSortBy = exports.PaymentType = exports.FulfillmentStatus = exports.PaymentStatus = exports.OrderStatus = exports.AttributeType = exports.ProductType = exports.ProductStatus = exports.AddressType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "customer";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["MODERATOR"] = "moderator";
})(UserRole || (exports.UserRole = UserRole = {}));
var AddressType;
(function (AddressType) {
    AddressType["HOME"] = "home";
    AddressType["WORK"] = "work";
    AddressType["BILLING"] = "billing";
    AddressType["SHIPPING"] = "shipping";
})(AddressType || (exports.AddressType = AddressType = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "draft";
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["INACTIVE"] = "inactive";
    ProductStatus["ARCHIVED"] = "archived";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ProductType;
(function (ProductType) {
    ProductType["PHYSICAL"] = "physical";
    ProductType["DIGITAL"] = "digital";
    ProductType["SERVICE"] = "service";
})(ProductType || (exports.ProductType = ProductType = {}));
var AttributeType;
(function (AttributeType) {
    AttributeType["TEXT"] = "text";
    AttributeType["NUMBER"] = "number";
    AttributeType["BOOLEAN"] = "boolean";
    AttributeType["DATE"] = "date";
    AttributeType["SELECT"] = "select";
    AttributeType["MULTI_SELECT"] = "multi_select";
})(AttributeType || (exports.AttributeType = AttributeType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["DRAFT"] = "draft";
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["PARTIALLY_PAID"] = "partially_paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["PARTIALLY_REFUNDED"] = "partially_refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var FulfillmentStatus;
(function (FulfillmentStatus) {
    FulfillmentStatus["PENDING"] = "pending";
    FulfillmentStatus["PROCESSING"] = "processing";
    FulfillmentStatus["SHIPPED"] = "shipped";
    FulfillmentStatus["DELIVERED"] = "delivered";
    FulfillmentStatus["CANCELLED"] = "cancelled";
})(FulfillmentStatus || (exports.FulfillmentStatus = FulfillmentStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["CARD"] = "card";
    PaymentType["BANK_TRANSFER"] = "bank_transfer";
    PaymentType["CLICK"] = "click";
    PaymentType["PAYME"] = "payme";
    PaymentType["UZCARD"] = "uzcard";
    PaymentType["HUMO"] = "humo";
    PaymentType["CASH_ON_DELIVERY"] = "cash_on_delivery";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var SearchSortBy;
(function (SearchSortBy) {
    SearchSortBy["RELEVANCE"] = "relevance";
    SearchSortBy["PRICE"] = "price";
    SearchSortBy["NAME"] = "name";
    SearchSortBy["CREATED_AT"] = "created_at";
    SearchSortBy["POPULARITY"] = "popularity";
    SearchSortBy["RATING"] = "rating";
})(SearchSortBy || (exports.SearchSortBy = SearchSortBy = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "equals";
    FilterOperator["NOT_EQUALS"] = "not_equals";
    FilterOperator["CONTAINS"] = "contains";
    FilterOperator["NOT_CONTAINS"] = "not_contains";
    FilterOperator["STARTS_WITH"] = "starts_with";
    FilterOperator["ENDS_WITH"] = "ends_with";
    FilterOperator["GREATER_THAN"] = "greater_than";
    FilterOperator["GREATER_THAN_OR_EQUAL"] = "greater_than_or_equal";
    FilterOperator["LESS_THAN"] = "less_than";
    FilterOperator["LESS_THAN_OR_EQUAL"] = "less_than_or_equal";
    FilterOperator["IN"] = "in";
    FilterOperator["NOT_IN"] = "not_in";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
var FacetType;
(function (FacetType) {
    FacetType["CHECKBOX"] = "checkbox";
    FacetType["RADIO"] = "radio";
    FacetType["RANGE"] = "range";
    FacetType["SELECT"] = "select";
})(FacetType || (exports.FacetType = FacetType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_CONFIRMATION"] = "order_confirmation";
    NotificationType["ORDER_SHIPPED"] = "order_shipped";
    NotificationType["ORDER_DELIVERED"] = "order_delivered";
    NotificationType["PAYMENT_RECEIVED"] = "payment_received";
    NotificationType["PAYMENT_FAILED"] = "payment_failed";
    NotificationType["PRODUCT_BACK_IN_STOCK"] = "product_back_in_stock";
    NotificationType["PRICE_DROP"] = "price_drop";
    NotificationType["SECURITY_ALERT"] = "security_alert";
    NotificationType["SYSTEM_MAINTENANCE"] = "system_maintenance";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["IN_APP"] = "in_app";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
// Additional type exports can be added here when needed
//# sourceMappingURL=common.js.map