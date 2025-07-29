/**
 * Defines types for the enhanced product service
 */

// Redefine ProductStatus and ProductType to match our schema
export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  SERVICE = 'SERVICE',
}

// Product database entity definition
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string;
  barcode: string | null;
  brand: string | null;
  model: string | null;
  weight: number | null;
  dimensions: Record<string, any> | null;
  price: number;
  comparePrice: number | null;
  costPrice: number | null;
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
  attributes: Record<string, any> | null;
  specifications: Record<string, any> | null;
  warranty: string | null;
  returnPolicy: string | null;
  shippingInfo: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  vendorId: string | null;
  category?: Category;
  images?: any[];
  inventory?: any;
  ratings?: any;
  reviews?: any[];
}

// Category database entity definition
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  parentId: string | null;
  parent?: Category;
  children?: Category[];
  createdAt: Date;
  updatedAt: Date;
  products?: Product[];
}

// Interface for product response
export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  sku: string;
  barcode: string | null;
  brand: string | null;
  model: string | null;
  weight: number | null;
  dimensions: Record<string, any> | null;
  price: number;
  comparePrice: number | null;
  costPrice: number | null;
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
  attributes: Record<string, any> | null;
  specifications: Record<string, any> | null;
  warranty: string | null;
  returnPolicy: string | null;
  shippingInfo: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  categoryId: string;
  vendorId: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

// Interface for product query options
export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
  filters?: ProductFilters;
  includeInactive?: boolean;
}

// Interface for product filters
export interface ProductFilters {
  categoryId?: string;
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  type?: ProductType;
  isActive?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  tags?: string[];
  search?: string;
  brand?: string;
}

// Interface for search options
export interface ProductSearchOptions extends ProductQueryOptions {}

// Interface for product list results
export interface ProductListResult {
  products: ProductResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Interface for product create data
export interface ProductCreateInput {
  name: string;
  slug: string;
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
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  salePercentage?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: string;
  publishedAt?: Date;
  categoryId: string;
  vendorId?: string;
}

// Interface for product update data
export interface ProductUpdateInput {
  name?: string;
  slug?: string;
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
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  salePercentage?: number;
  saleStartDate?: Date | null;
  saleEndDate?: Date | null;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: string;
  publishedAt?: Date | null;
  categoryId?: string;
  vendorId?: string | null;
}

// Custom error class for product service
export class ProductError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string, statusCode: number, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ProductError';
  }
}
