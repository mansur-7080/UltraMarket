/**
 * UltraMarket E-Commerce Platform
 * TypeScript API Types & Interfaces
 * Professional Type Definitions
 */

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
  timestamp: string;
}

// User & Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileImage?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  preferences: UserPreferences;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  VENDOR = 'vendor',
  MODERATOR = 'moderator'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
  orderUpdates: boolean;
  priceAlerts: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showOnlineStatus: boolean;
  allowPersonalization: boolean;
}

export interface Address {
  id: string;
  type: AddressType;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  isDefault: boolean;
  instructions?: string;
}

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other'
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
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
  phoneNumber?: string;
  agreeToTerms: boolean;
  agreeToMarketing?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  images: ProductImage[];
  category: Category;
  brand: Brand;
  tags: string[];
  attributes: ProductAttribute[];
  variants?: ProductVariant[];
  inventory: ProductInventory;
  seo: ProductSEO;
  rating: ProductRating;
  status: ProductStatus;
  isFeatured: boolean;
  isDigital: boolean;
  shippingRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText?: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductAttribute {
  id: string;
  name: string;
  value: string;
  displayName?: string;
  group?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  sku: string;
  inventory: ProductInventory;
  attributes: Record<string, string>;
  image?: ProductImage;
}

export interface ProductInventory {
  quantity: number;
  lowStockThreshold: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
  reservedQuantity: number;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
}

export interface ProductRating {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

export enum ProductStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  position: number;
  isActive: boolean;
  productCount: number;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  productCount: number;
}

export interface ProductFilters {
  category?: string[];
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  tags?: string[];
  attributes?: Record<string, string[]>;
  sortBy?: ProductSortOption;
  sortOrder?: 'asc' | 'desc';
}

export enum ProductSortOption {
  RELEVANCE = 'relevance',
  NAME = 'name',
  PRICE = 'price',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
  POPULARITY = 'popularity'
}

// Cart & Order Types
export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totals: CartTotals;
  coupon?: Coupon;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
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
  currency: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: User;
  items: OrderItem[];
  totals: OrderTotals;
  billing: Address;
  shipping: Address;
  payment: PaymentDetails;
  fulfillment: FulfillmentDetails;
  status: OrderStatus;
  notes?: string;
  refunds?: Refund[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  total: number;
  status: OrderItemStatus;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  taxBreakdown?: TaxBreakdown[];
}

export interface TaxBreakdown {
  name: string;
  rate: number;
  amount: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum OrderItemStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Payment Types
export interface PaymentDetails {
  id: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  transactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  processedAt?: string;
  failureReason?: string;
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  UZCARD = 'uzcard',
  HUMO = 'humo',
  CASH_ON_DELIVERY = 'cash_on_delivery'
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  UZCARD = 'uzcard',
  HUMO = 'humo',
  BANK = 'bank',
  CASH = 'cash'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Fulfillment Types
export interface FulfillmentDetails {
  method: FulfillmentMethod;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  notes?: string;
}

export enum FulfillmentMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  PICKUP = 'pickup'
}

// Coupon & Discount Types
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping'
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImage'>;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

// Wishlist Types
export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  isPublic: boolean;
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  addedAt: string;
  notes?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  PRICE_DROP = 'price_drop',
  BACK_IN_STOCK = 'back_in_stock',
  MARKETING = 'marketing',
  SYSTEM = 'system'
}

// Search Types
export interface SearchResult<T> {
  query: string;
  results: T[];
  total: number;
  took: number;
  facets?: SearchFacet[];
  suggestions?: string[];
}

export interface SearchFacet {
  field: string;
  values: SearchFacetValue[];
}

export interface SearchFacetValue {
  value: string;
  count: number;
  selected: boolean;
}

// Refund Types
export interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason: RefundReason;
  status: RefundStatus;
  processedAt?: string;
  notes?: string;
}

export enum RefundReason {
  DEFECTIVE = 'defective',
  NOT_AS_DESCRIBED = 'not_as_described',
  DAMAGED_IN_SHIPPING = 'damaged_in_shipping',
  WRONG_ITEM = 'wrong_item',
  CHANGED_MIND = 'changed_mind',
  OTHER = 'other'
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed'
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
}

// Error Types
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
} 