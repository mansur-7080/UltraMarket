/**
 * Common TypeScript interfaces and types
 * Professional type definitions for the UltraMarket platform
 */
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: Date;
    requestId?: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    statusCode: number;
    timestamp: Date;
}
export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatar?: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    CUSTOMER = "customer",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin",
    MODERATOR = "moderator"
}
export interface Address {
    id: string;
    userId: string;
    type: AddressType;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum AddressType {
    HOME = "home",
    WORK = "work",
    BILLING = "billing",
    SHIPPING = "shipping"
}
export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    sku: string;
    barcode?: string;
    brand?: string;
    model?: string;
    price: number;
    comparePrice?: number;
    costPrice?: number;
    currency: string;
    status: ProductStatus;
    type: ProductType;
    isActive: boolean;
    isFeatured: boolean;
    images: ProductImage[];
    categories: ProductCategory[];
    variants: ProductVariant[];
    attributes: ProductAttribute[];
    inventory: ProductInventory;
    seo: ProductSEO;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ProductStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    INACTIVE = "inactive",
    ARCHIVED = "archived"
}
export declare enum ProductType {
    PHYSICAL = "physical",
    DIGITAL = "digital",
    SERVICE = "service"
}
export interface ProductImage {
    id: string;
    url: string;
    alt?: string;
    position: number;
    isMain: boolean;
}
export interface ProductCategory {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
    level: number;
    path: string;
}
export interface ProductVariant {
    id: string;
    name: string;
    sku: string;
    price: number;
    comparePrice?: number;
    inventory: number;
    options: VariantOption[];
    isActive: boolean;
}
export interface VariantOption {
    name: string;
    value: string;
}
export interface ProductAttribute {
    name: string;
    value: string;
    type: AttributeType;
}
export declare enum AttributeType {
    TEXT = "text",
    NUMBER = "number",
    BOOLEAN = "boolean",
    DATE = "date",
    SELECT = "select",
    MULTI_SELECT = "multi_select"
}
export interface ProductInventory {
    quantity: number;
    reserved: number;
    available: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
}
export interface ProductSEO {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
}
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;
    shippingAddress: Address;
    billingAddress: Address;
    paymentMethod: PaymentMethod;
    notes?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum OrderStatus {
    DRAFT = "draft",
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    PARTIALLY_PAID = "partially_paid",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
export declare enum FulfillmentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export interface OrderItem {
    id: string;
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
    metadata: Record<string, any>;
}
export interface PaymentMethod {
    id: string;
    type: PaymentType;
    provider: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
}
export declare enum PaymentType {
    CARD = "card",
    BANK_TRANSFER = "bank_transfer",
    CLICK = "click",
    PAYME = "payme",
    UZCARD = "uzcard",
    HUMO = "humo",
    CASH_ON_DELIVERY = "cash_on_delivery"
}
export interface Cart {
    id: string;
    userId?: string;
    sessionId?: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CartItem {
    id: string;
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    image?: string;
    metadata: Record<string, any>;
}
export interface SearchParams {
    query?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: SearchSortBy;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    filters?: SearchFilter[];
}
export declare enum SearchSortBy {
    RELEVANCE = "relevance",
    PRICE = "price",
    NAME = "name",
    CREATED_AT = "created_at",
    POPULARITY = "popularity",
    RATING = "rating"
}
export interface SearchFilter {
    field: string;
    operator: FilterOperator;
    value: any;
}
export declare enum FilterOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    CONTAINS = "contains",
    NOT_CONTAINS = "not_contains",
    STARTS_WITH = "starts_with",
    ENDS_WITH = "ends_with",
    GREATER_THAN = "greater_than",
    GREATER_THAN_OR_EQUAL = "greater_than_or_equal",
    LESS_THAN = "less_than",
    LESS_THAN_OR_EQUAL = "less_than_or_equal",
    IN = "in",
    NOT_IN = "not_in"
}
export interface SearchResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    aggregations?: SearchAggregation[];
    suggestions?: string[];
    facets?: SearchFacet[];
}
export interface SearchAggregation {
    field: string;
    buckets: AggregationBucket[];
}
export interface AggregationBucket {
    key: string;
    count: number;
}
export interface SearchFacet {
    field: string;
    name: string;
    type: FacetType;
    values: FacetValue[];
}
export declare enum FacetType {
    CHECKBOX = "checkbox",
    RADIO = "radio",
    RANGE = "range",
    SELECT = "select"
}
export interface FacetValue {
    value: string;
    label: string;
    count: number;
    selected?: boolean;
}
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
}
export declare enum NotificationType {
    ORDER_CONFIRMATION = "order_confirmation",
    ORDER_SHIPPED = "order_shipped",
    ORDER_DELIVERED = "order_delivered",
    PAYMENT_RECEIVED = "payment_received",
    PAYMENT_FAILED = "payment_failed",
    PRODUCT_BACK_IN_STOCK = "product_back_in_stock",
    PRICE_DROP = "price_drop",
    SECURITY_ALERT = "security_alert",
    SYSTEM_MAINTENANCE = "system_maintenance"
}
export declare enum NotificationChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    IN_APP = "in_app"
}
export interface FileUpload {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
export interface FileUploadConfig {
    maxSize: number;
    allowedTypes: string[];
    generateThumbnail: boolean;
    compressionQuality?: number;
}
export interface AnalyticsEvent {
    id: string;
    userId?: string;
    sessionId: string;
    eventType: string;
    eventName: string;
    properties: Record<string, any>;
    timestamp: Date;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    url?: string;
}
export interface AnalyticsMetric {
    name: string;
    value: number;
    unit?: string;
    timestamp: Date;
    dimensions?: Record<string, string>;
}
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: ServiceHealth[];
    timestamp: Date;
}
export interface ServiceHealth {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    errorRate: number;
    uptime: number;
    version: string;
    dependencies: ServiceDependency[];
}
export interface ServiceDependency {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
}
export type Partial<T> = {
    [P in keyof T]?: T[P];
};
export type Required<T> = {
    [P in keyof T]-?: T[P];
};
export type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type KeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];
export type NonNullable<T> = T extends null | undefined ? never : T;
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
//# sourceMappingURL=common.d.ts.map