// Basic types
export type ID = string;
export type UUID = string;
export type Timestamp = number;
export type ISO8601Date = string;

// Common interfaces
export interface BaseEntity {
  id: ID;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  errors?: string[] | Record<string, string[]>;
}

// User related types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// Product related types
export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: ID;
  images: string[];
  isActive: boolean;
}

export interface Category extends BaseEntity {
  name: string;
  description: string;
  parentId: ID | null;
}

// Order related types
export interface Order extends BaseEntity {
  userId: ID;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentId: ID | null;
}

export interface OrderItem {
  productId: ID;
  quantity: number;
  price: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Payment related types
export interface Payment extends BaseEntity {
  orderId: ID;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CLICK = 'click',
  PAYME = 'payme',
  UZCARD = 'uzcard',
  HUMO = 'humo',
  BANK_TRANSFER = 'bank_transfer',
}

// Cart related types
export interface Cart extends BaseEntity {
  userId: ID;
  items: CartItem[];
  totalAmount: number;
}

export interface CartItem {
  productId: ID;
  quantity: number;
  price: number;
}

// API request/response types
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string>;
}

// Auth related types
export interface TokenPayload {
  userId: ID;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
