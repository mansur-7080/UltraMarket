/**
 * Core model types for the Product Service
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Enum representing product statuses
 */
export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  OUTOFSTOCK = 'OUTOFSTOCK',
  COMINGSOON = 'COMINGSOON',
}

/**
 * Enum representing product types
 */
export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  SERVICE = 'SERVICE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

/**
 * Product model interface
 */
export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string;
  barcode: string | null;
  brand: string | null;
  model: string | null;
  weight: Decimal | null;
  dimensions: any | null; // JSON type
  price: Decimal;
  comparePrice: Decimal | null;
  costPrice: Decimal | null;
  currency: string;
  status: ProductStatus;
  type: ProductType;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  salePercentage: number | null;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  tags: string[];
  attributes: any | null; // JSON type
  specifications: any | null; // JSON type
  warranty: string | null;
  returnPolicy: string | null;
  shippingInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  categoryId: string;
  vendorId: string | null;
}

/**
 * Category model interface
 */
export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  parentId: string | null;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product variant model interface
 */
export interface IProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: Decimal;
  comparePrice: Decimal | null;
  costPrice: Decimal | null;
  inventory: number | null;
  weight: Decimal | null;
  options: any; // JSON type for variant options
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product view tracking model interface
 */
export interface IProductView {
  id: string;
  productId: string;
  userId: string | null;
  sessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  viewedAt: Date;
}

/**
 * Product review model interface
 */
export interface IProductReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO types for API requests and responses
 */

export interface CreateProductDto {
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  brand?: string;
  model?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  currency?: string;
  status?: ProductStatus;
  type?: ProductType;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: string;
  categoryId: string;
  vendorId?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  model?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  price?: number;
  comparePrice?: number;
  costPrice?: number;
  currency?: string;
  status?: ProductStatus;
  type?: ProductType;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: string;
  categoryId?: string;
}

/**
 * Query parameter interfaces
 */
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  type?: ProductType;
  isActive?: boolean;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
}

/**
 * Pagination response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API response interfaces
 */
export interface ProductResponse
  extends Omit<IProduct, 'price' | 'comparePrice' | 'costPrice' | 'weight'> {
  price: number;
  comparePrice: number | null;
  costPrice: number | null;
  weight: number | null;
  category?: Pick<ICategory, 'id' | 'name' | 'slug'>;
}
