export interface BaseApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
    timestamp: string;
    requestId: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
    statusCode?: number;
}
export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
    pagination: PaginationMeta;
}
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    acceptTerms: boolean;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    role: UserRole;
    preferences: UserPreferences;
    addresses: Address[];
    createdAt: string;
    updatedAt: string;
}
export declare enum UserRole {
    CUSTOMER = "customer",
    ADMIN = "admin",
    MODERATOR = "moderator",
    VENDOR = "vendor"
}
export interface UserPreferences {
    language: 'uz' | 'ru' | 'en';
    currency: 'UZS' | 'USD';
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
}
export interface Product {
    id: string;
    name: string;
    description: string;
    shortDescription?: string;
    sku: string;
    slug: string;
    price: ProductPrice;
    images: ProductImage[];
    category: ProductCategory;
    brand: Brand;
    specifications: ProductSpecification[];
    variants: ProductVariant[];
    inventory: ProductInventory;
    seo: ProductSEO;
    reviews: ReviewSummary;
    tags: string[];
    status: ProductStatus;
    visibility: ProductVisibility;
    weight?: number;
    dimensions?: ProductDimensions;
    createdAt: string;
    updatedAt: string;
}
export interface ProductPrice {
    regular: number;
    sale?: number;
    currency: string;
    compareAtPrice?: number;
    costPrice?: number;
    markup?: number;
}
export interface ProductImage {
    id: string;
    url: string;
    alt: string;
    order: number;
    isPrimary: boolean;
    variants?: {
        thumbnail: string;
        medium: string;
        large: string;
    };
}
export interface ProductCategory {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
    level: number;
    path: string[];
    icon?: string;
}
export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    website?: string;
}
export interface ProductSpecification {
    id: string;
    name: string;
    value: string;
    unit?: string;
    group: string;
    order: number;
    searchable: boolean;
    filterable: boolean;
}
export interface ProductVariant {
    id: string;
    name: string;
    sku: string;
    price: ProductPrice;
    inventory: ProductInventory;
    attributes: VariantAttribute[];
    image?: string;
}
export interface VariantAttribute {
    name: string;
    value: string;
    displayName: string;
}
export interface ProductInventory {
    quantity: number;
    reserved: number;
    available: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
    allowBackorders: boolean;
    stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock' | 'backorder';
}
export interface ProductDimensions {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
}
export interface ProductSEO {
    title?: string;
    description?: string;
    keywords?: string[];
    canonical?: string;
    robots?: string;
}
export interface ReviewSummary {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        [rating: number]: number;
    };
}
export declare enum ProductStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    INACTIVE = "inactive",
    ARCHIVED = "archived"
}
export declare enum ProductVisibility {
    PUBLIC = "public",
    PRIVATE = "private",
    HIDDEN = "hidden"
}
export interface Order {
    id: string;
    orderNumber: string;
    customer: Customer;
    items: OrderItem[];
    billing: Address;
    shipping: Address;
    payment: PaymentInfo;
    shipping_method: ShippingMethod;
    status: OrderStatus;
    totals: OrderTotals;
    notes?: string;
    timeline: OrderTimeline[];
    createdAt: string;
    updatedAt: string;
}
export interface OrderItem {
    id: string;
    product: Product;
    variant?: ProductVariant;
    quantity: number;
    price: number;
    total: number;
    discounts?: OrderDiscount[];
}
export interface OrderTotals {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;
}
export interface OrderDiscount {
    type: 'percentage' | 'fixed' | 'shipping';
    value: number;
    code?: string;
    description: string;
}
export interface PaymentInfo {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    gateway?: string;
    paidAt?: string;
    amount: number;
    currency: string;
}
export declare enum PaymentMethod {
    CASH = "cash",
    CARD = "card",
    CLICK = "click",
    PAYME = "payme",
    UZCARD = "uzcard",
    BANK_TRANSFER = "bank_transfer"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
export interface ShippingMethod {
    id: string;
    name: string;
    description?: string;
    price: number;
    estimatedDays: number;
    trackingAvailable: boolean;
}
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export interface OrderTimeline {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    user?: string;
}
export interface Address {
    id?: string;
    type: 'billing' | 'shipping';
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    region: string;
    district?: string;
    postalCode?: string;
    country: string;
    phone?: string;
    isDefault?: boolean;
}
export interface Customer extends User {
    orders?: Order[];
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderAt?: string;
}
export interface Cart {
    id: string;
    items: CartItem[];
    totals: CartTotals;
    currency: string;
    expiresAt?: string;
    appliedCoupons?: AppliedCoupon[];
}
export interface CartItem {
    id: string;
    product: Product;
    variant?: ProductVariant;
    quantity: number;
    price: number;
    total: number;
    addedAt: string;
}
export interface CartTotals {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    itemCount: number;
}
export interface AppliedCoupon {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
}
export interface SearchFilters {
    query?: string;
    category?: string;
    brand?: string[];
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    inStock?: boolean;
    tags?: string[];
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
    page?: number;
    limit?: number;
}
export interface SearchResult<T> {
    items: T[];
    total: number;
    facets: SearchFacets;
    suggestions?: string[];
    pagination: PaginationMeta;
}
export interface SearchFacets {
    categories: FacetItem[];
    brands: FacetItem[];
    priceRanges: PriceRangeFacet[];
    ratings: FacetItem[];
    attributes: AttributeFacet[];
}
export interface FacetItem {
    value: string;
    label: string;
    count: number;
    selected?: boolean;
}
export interface PriceRangeFacet {
    min: number;
    max: number;
    count: number;
    selected?: boolean;
}
export interface AttributeFacet {
    name: string;
    values: FacetItem[];
}
export interface AnalyticsEvent {
    event: string;
    properties: Record<string, any>;
    userId?: string;
    sessionId: string;
    timestamp: string;
}
export interface UzbekistanRegion {
    id: string;
    name: string;
    nameUz: string;
    nameRu: string;
    districts: UzbekistanDistrict[];
}
export interface UzbekistanDistrict {
    id: string;
    name: string;
    nameUz: string;
    nameRu: string;
    regionId: string;
}
export type GetProductsRequest = SearchFilters;
export type GetProductsResponse = PaginatedResponse<Product>;
export type GetProductRequest = {
    id: string;
};
export type GetProductResponse = BaseApiResponse<Product>;
export type CreateOrderRequest = Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>;
export type CreateOrderResponse = BaseApiResponse<Order>;
export type LoginResponse = BaseApiResponse<{
    user: User;
    tokens: AuthTokens;
}>;
export type RegisterResponse = BaseApiResponse<{
    user: User;
    tokens: AuthTokens;
}>;
export interface WebSocketMessage<T = any> {
    type: string;
    payload: T;
    timestamp: string;
    id: string;
}
export interface OrderUpdateMessage {
    orderId: string;
    status: OrderStatus;
    message?: string;
}
export interface NotificationMessage {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    actions?: NotificationAction[];
}
export interface NotificationAction {
    label: string;
    action: string;
    variant?: 'primary' | 'secondary';
}
export declare class ApiClientError extends Error {
    code: string;
    message: string;
    statusCode?: number | undefined;
    details?: any | undefined;
    constructor(code: string, message: string, statusCode?: number | undefined, details?: any | undefined);
}
export declare class NetworkError extends Error {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare class ValidationError extends Error {
    field: string;
    value?: any;
    constructor(message: string, field: string, value?: any);
}
export interface RequestConfig {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    signal?: AbortSignal;
}
export interface FileUpload {
    file: File | Blob;
    fileName?: string;
    field?: string;
}
export interface UploadResponse {
    url: string;
    fileName: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
}
export * from './types';
//# sourceMappingURL=types.d.ts.map