/**
 * 🛍️ UltraMarket Product Service
 * Professional TypeScript Product Management Microservice
 * Enterprise-Grade E-Commerce Product Platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import Redis from 'redis';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { z } from 'zod';
import multer from 'multer';
import sharp from 'sharp';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ===== TYPESCRIPT INTERFACES & TYPES =====

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  weight?: number;
  dimensions?: ProductDimensions;
  categoryId: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
  status: ProductStatus;
  visibility: ProductVisibility;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  taxable: boolean;
  metaTitle?: string;
  metaDescription?: string;
  images: ProductImage[];
  variants?: ProductVariant[];
  attributes: ProductAttribute[];
  tags: string[];
  inventory: ProductInventory;
  seo: ProductSEO;
  rating: ProductRating;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  altText?: string;
  position: number;
  isPrimary: boolean;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  weight?: number;
  inventory: ProductInventory;
  attributes: Record<string, string>;
  image?: ProductImage;
  isDefault: boolean;
}

interface ProductAttribute {
  id: string;
  name: string;
  value: string;
  displayName?: string;
  group?: string;
  type: AttributeType;
  position: number;
  isRequired: boolean;
  isFilterable: boolean;
}

interface ProductInventory {
  quantity: number;
  lowStockThreshold: number;
  trackQuantity: boolean;
  allowBackorder: boolean;
  reservedQuantity: number;
  availableQuantity: number;
  incomingQuantity: number;
}

interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  robots?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
}

interface ProductRating {
  average: number;
  count: number;
  distribution: Record<number, number>;
  lastUpdated: Date;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  level: number;
  position: number;
  isActive: boolean;
  productCount: number;
  seo: CategorySEO;
  children?: Category[];
}

interface CategorySEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  productCount: number;
  seo: BrandSEO;
}

interface BrandSEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

interface SearchFilters {
  query?: string;
  categoryId?: string;
  brandId?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  rating?: number;
  tags?: string[];
  attributes?: Record<string, string[]>;
  sortBy?: ProductSortOption;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  facets?: SearchFacet[];
  suggestions?: string[];
  took: number;
}

interface SearchFacet {
  field: string;
  values: SearchFacetValue[];
}

interface SearchFacetValue {
  value: string;
  count: number;
  selected: boolean;
}

interface ProductMetrics {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  averagePrice: number;
  totalValue: number;
  topCategories: Array<{ categoryId: string; count: number }>;
  topBrands: Array<{ brandId: string; count: number }>;
  recentActivity: Array<{ action: string; count: number; date: Date }>;
}

enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

enum ProductVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  HIDDEN = 'hidden'
}

enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  DATE = 'date',
  COLOR = 'color',
  URL = 'url'
}

enum ProductSortOption {
  RELEVANCE = 'relevance',
  NAME = 'name',
  PRICE = 'price',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  POPULARITY = 'popularity',
  FEATURED = 'featured'
}

// ===== VALIDATION SCHEMAS =====

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(10000),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(1).max(100),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['cm', 'in'])
  }).optional(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  visibility: z.nativeEnum(ProductVisibility).default(ProductVisibility.PUBLIC),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  inventory: z.object({
    quantity: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0),
    trackQuantity: z.boolean().default(true),
    allowBackorder: z.boolean().default(false)
  }),
  seo: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

const updateProductSchema = createProductSchema.partial();

const searchProductsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  inStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.nativeEnum(ProductSortOption).default(ProductSortOption.RELEVANCE),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

// ===== CONFIGURATION =====

const CONFIG = {
  SERVICE: {
    PORT: parseInt(process.env.PORT || '3003'),
    NAME: 'ultramarket-product-service',
    VERSION: '2.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development'
  },
  DATABASE: {
    URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ultramarket',
    MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT || '30000')
  },
  REDIS: {
    URL: process.env.REDIS_URL || 'redis://localhost:6379',
    KEY_PREFIX: 'ultramarket:products:',
    DEFAULT_TTL: parseInt(process.env.CACHE_TTL || '300') // 5 minutes
  },
  ELASTICSEARCH: {
    NODE: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    INDEX: 'ultramarket_products',
    API_KEY: process.env.ELASTICSEARCH_API_KEY
  },
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads/products',
    CDN_URL: process.env.CDN_URL || ''
  },
  RATE_LIMITING: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 1000
  }
};

// ===== INITIALIZE SERVICES =====

// Express App
const app = express();

// Database
const prisma = new PrismaClient({
  log: CONFIG.SERVICE.ENVIRONMENT === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: {
      url: CONFIG.DATABASE.URL
    }
  }
});

// Redis Client
const redis = Redis.createClient({
  url: CONFIG.REDIS.URL,
  retry_strategy: (times) => Math.min(times * 50, 2000)
});

// Elasticsearch Client
const elasticsearch = new ElasticsearchClient({
  node: CONFIG.ELASTICSEARCH.NODE,
  auth: CONFIG.ELASTICSEARCH.API_KEY ? {
    apiKey: CONFIG.ELASTICSEARCH.API_KEY
  } : undefined
});

// Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'product-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: 'logs/product-service-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CONFIG.UPLOAD.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Service Metrics
const serviceMetrics: ProductMetrics = {
  totalProducts: 0,
  publishedProducts: 0,
  draftProducts: 0,
  outOfStockProducts: 0,
  lowStockProducts: 0,
  averagePrice: 0,
  totalValue: 0,
  topCategories: [],
  topBrands: [],
  recentActivity: []
};

// ===== UTILITY FUNCTIONS =====

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const generateSKU = (name: string, category: string): string => {
  const nameCode = name.substring(0, 3).toUpperCase();
  const categoryCode = category.substring(0, 2).toUpperCase();
  const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${categoryCode}-${nameCode}-${randomCode}`;
};

const calculateAverageRating = (distribution: Record<number, number>): number => {
  let totalRating = 0;
  let totalCount = 0;

  for (const [rating, count] of Object.entries(distribution)) {
    totalRating += parseInt(rating) * count;
    totalCount += count;
  }

  return totalCount > 0 ? totalRating / totalCount : 0;
};

// ===== MIDDLEWARE =====

// Request logging and correlation
app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string || 
    crypto.randomBytes(8).toString('hex');
  
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Service-Version', CONFIG.SERVICE.VERSION);

  const startTime = performance.now();
  
  logger.info('Product service request', {
    correlationId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.on('finish', () => {
    const responseTime = performance.now() - startTime;
    logger.info('Product service response', {
      correlationId,
      statusCode: res.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`
    });
  });

  next();
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMITING.WINDOW_MS,
  max: CONFIG.RATE_LIMITING.MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
});

app.use('/api', limiter);

// ===== VALIDATION MIDDLEWARE =====

const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
};

// ===== CACHING MIDDLEWARE =====

const cacheMiddleware = (ttl: number = CONFIG.REDIS.DEFAULT_TTL) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${CONFIG.REDIS.KEY_PREFIX}${req.url}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        return res.json(JSON.parse(cached));
      }

      res.setHeader('X-Cache-Status', 'MISS');

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(body: any) {
        if (res.statusCode === 200) {
          redis.setEx(cacheKey, ttl, JSON.stringify(body));
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.warn('Cache error', { error: error.message });
      next();
    }
  };
};

// ===== STARTUP MESSAGE =====

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║            🛍️ ULTRAMARKET PRODUCT SERVICE 🛍️              ║
║                                                               ║
║              Professional TypeScript Implementation           ║
║                Enterprise E-Commerce Product Platform         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// ===== PRODUCT SERVICE CLASS =====

class ProductService {
  private static instance: ProductService;

  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // ===== PRODUCT CRUD OPERATIONS =====

  async createProduct(data: any, userId: string): Promise<Product> {
    const slug = generateSlug(data.name);
    
    // Check if slug exists
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.isSlugExists(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Generate SKU if not provided
    if (!data.sku) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { name: true }
      });
      data.sku = generateSKU(data.name, category?.name || 'PRODUCT');
    }

    const productData = {
      ...data,
      slug: uniqueSlug,
      createdBy: userId,
      updatedBy: userId
    };

    const product = await prisma.product.create({
      data: productData,
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        attributes: true
      }
    });

    // Index in Elasticsearch
    await this.indexProduct(product);

    // Invalidate cache
    await this.invalidateProductCache();

    logger.info('Product created', {
      productId: product.id,
      name: product.name,
      userId
    });

    return product as Product;
  }

  async getProduct(id: string): Promise<Product | null> {
    const cacheKey = `${CONFIG.REDIS.KEY_PREFIX}product:${id}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { position: 'asc' }
          },
          variants: {
            include: {
              image: true
            }
          },
          attributes: {
            orderBy: { position: 'asc' }
          }
        }
      });

      if (product) {
        await redis.setEx(cacheKey, CONFIG.REDIS.DEFAULT_TTL, JSON.stringify(product));
      }

      return product as Product;
    } catch (error) {
      logger.error('Error getting product', { productId: id, error: error.message });
      throw error;
    }
  }

  async updateProduct(id: string, data: any, userId: string): Promise<Product> {
    const existingProduct = await this.getProduct(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Update slug if name changed
    if (data.name && data.name !== existingProduct.name) {
      const slug = generateSlug(data.name);
      let uniqueSlug = slug;
      let counter = 1;
      while (await this.isSlugExists(uniqueSlug, id)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      data.slug = uniqueSlug;
    }

    const productData = {
      ...data,
      updatedBy: userId,
      updatedAt: new Date()
    };

    const product = await prisma.product.update({
      where: { id },
      data: productData,
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        attributes: true
      }
    });

    // Update in Elasticsearch
    await this.indexProduct(product);

    // Invalidate cache
    await this.invalidateProductCache(id);

    logger.info('Product updated', {
      productId: product.id,
      name: product.name,
      userId
    });

    return product as Product;
  }

  async deleteProduct(id: string, userId: string): Promise<void> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.product.delete({
      where: { id }
    });

    // Remove from Elasticsearch
    await this.removeFromIndex(id);

    // Invalidate cache
    await this.invalidateProductCache(id);

    logger.info('Product deleted', {
      productId: id,
      name: product.name,
      userId
    });
  }

  // ===== SEARCH AND FILTERING =====

  async searchProducts(filters: SearchFilters): Promise<SearchResult<Product>> {
    const startTime = performance.now();
    
    try {
      // Build Elasticsearch query
      const searchQuery = this.buildSearchQuery(filters);
      
      const response = await elasticsearch.search({
        index: CONFIG.ELASTICSEARCH.INDEX,
        body: searchQuery,
        size: filters.limit || 20,
        from: ((filters.page || 1) - 1) * (filters.limit || 20)
      });

      const products = response.body.hits.hits.map((hit: any) => hit._source);
      const total = response.body.hits.total.value;
      const took = response.body.took;

      // Build facets from aggregations
      const facets = this.buildFacets(response.body.aggregations);

      const result: SearchResult<Product> = {
        items: products,
        total,
        page: filters.page || 1,
        limit: filters.limit || 20,
        totalPages: Math.ceil(total / (filters.limit || 20)),
        hasNext: ((filters.page || 1) * (filters.limit || 20)) < total,
        hasPrev: (filters.page || 1) > 1,
        facets,
        took
      };

      const responseTime = performance.now() - startTime;
      logger.info('Product search completed', {
        query: filters.query,
        total,
        took,
        responseTime: `${responseTime.toFixed(2)}ms`
      });

      return result;
    } catch (error) {
      logger.error('Product search error', { filters, error: error.message });
      
      // Fallback to database search
      return await this.searchProductsDB(filters);
    }
  }

  private buildSearchQuery(filters: SearchFilters): any {
    const must: any[] = [];
    const filter: any[] = [];

    // Text search
    if (filters.query) {
      must.push({
        multi_match: {
          query: filters.query,
          fields: ['name^3', 'description^2', 'shortDescription', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    // Category filter
    if (filters.categoryId) {
      filter.push({ term: { categoryId: filters.categoryId } });
    }

    // Brand filter
    if (filters.brandId) {
      filter.push({ term: { brandId: filters.brandId } });
    }

    // Price range
    if (filters.priceMin || filters.priceMax) {
      const priceRange: any = {};
      if (filters.priceMin) priceRange.gte = filters.priceMin;
      if (filters.priceMax) priceRange.lte = filters.priceMax;
      filter.push({ range: { price: priceRange } });
    }

    // Stock filter
    if (filters.inStock) {
      filter.push({ range: { 'inventory.availableQuantity': { gt: 0 } } });
    }

    // Featured filter
    if (filters.isFeatured) {
      filter.push({ term: { isFeatured: true } });
    }

    // Digital filter
    if (filters.isDigital !== undefined) {
      filter.push({ term: { isDigital: filters.isDigital } });
    }

    // Rating filter
    if (filters.rating) {
      filter.push({ range: { 'rating.average': { gte: filters.rating } } });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filter.push({ terms: { tags: filters.tags } });
    }

    // Status filter (only published products for public API)
    filter.push({ term: { status: ProductStatus.PUBLISHED } });
    filter.push({ term: { visibility: ProductVisibility.PUBLIC } });

    // Sort
    const sort = this.buildSort(filters.sortBy, filters.sortOrder);

    return {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter
        }
      },
      sort,
      aggs: {
        categories: {
          terms: { field: 'categoryId', size: 20 }
        },
        brands: {
          terms: { field: 'brandId', size: 20 }
        },
        price_ranges: {
          range: {
            field: 'price',
            ranges: [
              { to: 50 },
              { from: 50, to: 100 },
              { from: 100, to: 200 },
              { from: 200, to: 500 },
              { from: 500 }
            ]
          }
        },
        avg_rating: {
          avg: { field: 'rating.average' }
        }
      }
    };
  }

  private buildSort(sortBy?: ProductSortOption, sortOrder: 'asc' | 'desc' = 'desc'): any[] {
    switch (sortBy) {
      case ProductSortOption.NAME:
        return [{ 'name.keyword': { order: sortOrder } }];
      case ProductSortOption.PRICE:
        return [{ price: { order: sortOrder } }];
      case ProductSortOption.RATING:
        return [{ 'rating.average': { order: sortOrder } }];
      case ProductSortOption.CREATED_AT:
        return [{ createdAt: { order: sortOrder } }];
      case ProductSortOption.UPDATED_AT:
        return [{ updatedAt: { order: sortOrder } }];
      case ProductSortOption.FEATURED:
        return [{ isFeatured: { order: 'desc' } }, { _score: { order: 'desc' } }];
      case ProductSortOption.POPULARITY:
        return [{ 'rating.count': { order: 'desc' } }, { _score: { order: 'desc' } }];
      default: // RELEVANCE
        return [{ _score: { order: 'desc' } }];
    }
  }

  private buildFacets(aggregations: any): SearchFacet[] {
    const facets: SearchFacet[] = [];

    if (aggregations?.categories?.buckets) {
      facets.push({
        field: 'category',
        values: aggregations.categories.buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count,
          selected: false
        }))
      });
    }

    if (aggregations?.brands?.buckets) {
      facets.push({
        field: 'brand',
        values: aggregations.brands.buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count,
          selected: false
        }))
      });
    }

    return facets;
  }

  // ===== DATABASE FALLBACK SEARCH =====

  private async searchProductsDB(filters: SearchFilters): Promise<SearchResult<Product>> {
    const where: any = {
      status: ProductStatus.PUBLISHED,
      visibility: ProductVisibility.PUBLIC
    };

    // Build where conditions
    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { shortDescription: { contains: filters.query, mode: 'insensitive' } }
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters.priceMin || filters.priceMax) {
      where.price = {};
      if (filters.priceMin) where.price.gte = filters.priceMin;
      if (filters.priceMax) where.price.lte = filters.priceMax;
    }

    if (filters.inStock) {
      where.inventory = {
        availableQuantity: { gt: 0 }
      };
    }

    if (filters.isFeatured) {
      where.isFeatured = true;
    }

    if (filters.isDigital !== undefined) {
      where.isDigital = filters.isDigital;
    }

    if (filters.rating) {
      where.rating = {
        average: { gte: filters.rating }
      };
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build order by
    const orderBy = this.buildDatabaseSort(filters.sortBy, filters.sortOrder);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: {
            where: { isPrimary: true },
            take: 1
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return {
      items: products as Product[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
      took: 0
    };
  }

  private buildDatabaseSort(sortBy?: ProductSortOption, sortOrder: 'asc' | 'desc' = 'desc'): any {
    switch (sortBy) {
      case ProductSortOption.NAME:
        return { name: sortOrder };
      case ProductSortOption.PRICE:
        return { price: sortOrder };
      case ProductSortOption.RATING:
        return { rating: { average: sortOrder } };
      case ProductSortOption.CREATED_AT:
        return { createdAt: sortOrder };
      case ProductSortOption.UPDATED_AT:
        return { updatedAt: sortOrder };
      case ProductSortOption.FEATURED:
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
      default:
        return { createdAt: sortOrder };
    }
  }

  // ===== ELASTICSEARCH OPERATIONS =====

  private async indexProduct(product: any): Promise<void> {
    try {
      await elasticsearch.index({
        index: CONFIG.ELASTICSEARCH.INDEX,
        id: product.id,
        body: {
          ...product,
          suggest: {
            input: [product.name, product.description].filter(Boolean),
            weight: product.isFeatured ? 100 : 50
          }
        }
      });
    } catch (error) {
      logger.error('Failed to index product in Elasticsearch', {
        productId: product.id,
        error: error.message
      });
    }
  }

  private async removeFromIndex(productId: string): Promise<void> {
    try {
      await elasticsearch.delete({
        index: CONFIG.ELASTICSEARCH.INDEX,
        id: productId
      });
    } catch (error) {
      logger.error('Failed to remove product from Elasticsearch', {
        productId,
        error: error.message
      });
    }
  }

  // ===== CACHE OPERATIONS =====

  private async invalidateProductCache(productId?: string): Promise<void> {
    try {
      if (productId) {
        await redis.del(`${CONFIG.REDIS.KEY_PREFIX}product:${productId}`);
      }
      
      // Clear search cache
      const keys = await redis.keys(`${CONFIG.REDIS.KEY_PREFIX}search:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      // Clear category cache
      const categoryKeys = await redis.keys(`${CONFIG.REDIS.KEY_PREFIX}categories:*`);
      if (categoryKeys.length > 0) {
        await redis.del(...categoryKeys);
      }
    } catch (error) {
      logger.error('Cache invalidation error', { error: error.message });
    }
  }

  // ===== HELPER METHODS =====

  private async isSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: any = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const product = await prisma.product.findFirst({ where });
    return !!product;
  }

  // ===== IMAGE PROCESSING =====

  async processProductImages(files: Express.Multer.File[], productId: string): Promise<ProductImage[]> {
    const processedImages: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageId = crypto.randomBytes(16).toString('hex');
      
      try {
        // Generate different sizes
        const thumbnail = await sharp(file.buffer)
          .resize(150, 150, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();

        const medium = await sharp(file.buffer)
          .resize(400, 400, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toBuffer();

        const large = await sharp(file.buffer)
          .resize(800, 800, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toBuffer();

        // Get image metadata
        const metadata = await sharp(file.buffer).metadata();

        // Save images (in real implementation, save to S3/CDN)
        const baseUrl = CONFIG.UPLOAD.CDN_URL || `/uploads/products/${productId}`;
        
        const productImage: ProductImage = {
          id: imageId,
          url: `${baseUrl}/${imageId}-original.jpg`,
          thumbnailUrl: `${baseUrl}/${imageId}-thumbnail.jpg`,
          mediumUrl: `${baseUrl}/${imageId}-medium.jpg`,
          largeUrl: `${baseUrl}/${imageId}-large.jpg`,
          altText: `Product image ${i + 1}`,
          position: i,
          isPrimary: i === 0,
          fileSize: file.size,
          mimeType: file.mimetype,
          width: metadata.width || 0,
          height: metadata.height || 0
        };

        processedImages.push(productImage);
      } catch (error) {
        logger.error('Image processing error', {
          productId,
          imageIndex: i,
          error: error.message
        });
      }
    }

    return processedImages;
  }

  // ===== METRICS =====

  async updateMetrics(): Promise<void> {
    try {
      const [
        totalProducts,
        publishedProducts,
        draftProducts,
        outOfStockProducts,
        lowStockProducts,
        averagePrice,
        totalValue
      ] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: ProductStatus.PUBLISHED } }),
        prisma.product.count({ where: { status: ProductStatus.DRAFT } }),
        prisma.product.count({ where: { inventory: { availableQuantity: 0 } } }),
        prisma.product.count({ 
          where: { 
            inventory: { 
              availableQuantity: { 
                lte: prisma.$queryRaw`inventory.low_stock_threshold` 
              }
            }
          }
        }),
        prisma.product.aggregate({ _avg: { price: true } }),
        prisma.product.aggregate({ _sum: { price: true } })
      ]);

      serviceMetrics.totalProducts = totalProducts;
      serviceMetrics.publishedProducts = publishedProducts;
      serviceMetrics.draftProducts = draftProducts;
      serviceMetrics.outOfStockProducts = outOfStockProducts;
      serviceMetrics.lowStockProducts = lowStockProducts;
      serviceMetrics.averagePrice = averagePrice._avg.price || 0;
      serviceMetrics.totalValue = totalValue._sum.price || 0;
    } catch (error) {
      logger.error('Metrics update error', { error: error.message });
    }
  }
}

// ===== INITIALIZE PRODUCT SERVICE =====

const productService = ProductService.getInstance();

// ===== HEALTH CHECK =====

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'ultramarket-product-service',
    status: 'healthy',
    version: CONFIG.SERVICE.VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: [
      '🛍️ Professional Product Management',
      '🔍 Advanced Elasticsearch Search',
      '⚡ Redis Caching Layer',
      '📊 Prisma Database ORM',
      '🖼️ Image Processing with Sharp',
      '📝 Comprehensive Audit Logging',
      '🎯 TypeScript Type Safety',
      '⚖️ Advanced Rate Limiting',
      '📈 Real-time Metrics Collection',
      '🔄 Automatic Cache Invalidation'
    ],
    metrics: serviceMetrics,
    environment: {
      nodeVersion: process.version,
      nodeEnv: CONFIG.SERVICE.ENVIRONMENT,
      port: CONFIG.SERVICE.PORT,
      processId: process.pid
    }
  });
});

// ===== API ROUTES =====

// Get all products with search and filtering
app.get('/products', 
  validateQuery(searchProductsSchema),
  cacheMiddleware(CONFIG.REDIS.DEFAULT_TTL),
  async (req: Request, res: Response) => {
    try {
      const filters = req.query as SearchFilters;
      const result = await productService.searchProducts(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get products error', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to get products'
      });
    }
  }
);

// Get single product
app.get('/products/:id', 
  cacheMiddleware(CONFIG.REDIS.DEFAULT_TTL * 2), // Cache longer for individual products
  async (req: Request, res: Response) => {
    try {
      const product = await productService.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: { product }
      });
    } catch (error) {
      logger.error('Get product error', { 
        productId: req.params.id, 
        error: error.message 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to get product'
      });
    }
  }
);

// Create new product
app.post('/products',
  validateRequest(createProductSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const product = await productService.createProduct(req.body, userId);
      
      res.status(201).json({
        success: true,
        data: { product },
        message: 'Product created successfully'
      });
    } catch (error) {
      logger.error('Create product error', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to create product'
      });
    }
  }
);

// Update product
app.put('/products/:id',
  validateRequest(updateProductSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'system';
      const product = await productService.updateProduct(req.params.id, req.body, userId);
      
      res.json({
        success: true,
        data: { product },
        message: 'Product updated successfully'
      });
    } catch (error) {
      logger.error('Update product error', { 
        productId: req.params.id, 
        error: error.message 
      });
      
      if (error.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update product'
      });
    }
  }
);

// Delete product
app.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'system';
    await productService.deleteProduct(req.params.id, userId);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Delete product error', { 
      productId: req.params.id, 
      error: error.message 
    });
    
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

// Upload product images
app.post('/products/:id/images',
  upload.array('images', 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No images provided'
        });
      }

      const images = await productService.processProductImages(files, req.params.id);
      
      res.json({
        success: true,
        data: { images },
        message: `${images.length} images processed successfully`
      });
    } catch (error) {
      logger.error('Upload images error', { 
        productId: req.params.id, 
        error: error.message 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to upload images'
      });
    }
  }
);

// Get service metrics
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    await productService.updateMetrics();
    
    res.json({
      success: true,
      data: serviceMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get metrics error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

// ===== ERROR HANDLERS =====

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /products',
      'GET /products/:id',
      'POST /products',
      'PUT /products/:id',
      'DELETE /products/:id',
      'POST /products/:id/images',
      'GET /metrics'
    ]
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'];
  
  logger.error('Product service error', {
    correlationId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    correlationId
  });
});

// ===== INITIALIZE CONNECTIONS =====

const initializeServices = async () => {
  try {
    // Connect to Redis
    await redis.connect();
    logger.info('Redis connected for caching');

    // Connect to Database
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize Elasticsearch index
    try {
      const exists = await elasticsearch.indices.exists({
        index: CONFIG.ELASTICSEARCH.INDEX
      });

      if (!exists.body) {
        await elasticsearch.indices.create({
          index: CONFIG.ELASTICSEARCH.INDEX,
          body: {
            mappings: {
              properties: {
                name: { type: 'text', analyzer: 'standard' },
                description: { type: 'text', analyzer: 'standard' },
                price: { type: 'float' },
                categoryId: { type: 'keyword' },
                brandId: { type: 'keyword' },
                tags: { type: 'keyword' },
                status: { type: 'keyword' },
                visibility: { type: 'keyword' },
                isFeatured: { type: 'boolean' },
                isDigital: { type: 'boolean' },
                rating: {
                  properties: {
                    average: { type: 'float' },
                    count: { type: 'integer' }
                  }
                },
                inventory: {
                  properties: {
                    availableQuantity: { type: 'integer' }
                  }
                },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' }
              }
            }
          }
        });
        logger.info('Elasticsearch index created');
      } else {
        logger.info('Elasticsearch index already exists');
      }
    } catch (esError) {
      logger.warn('Elasticsearch initialization warning', { error: esError.message });
    }

    // Update initial metrics
    await productService.updateMetrics();

    logger.info('All product service dependencies initialized');
  } catch (error) {
    logger.error('Failed to initialize product service', error);
    process.exit(1);
  }
};

// ===== START THE SERVICE =====

initializeServices().then(() => {
  const server = createServer(app);

  server.listen(CONFIG.SERVICE.PORT, () => {
    logger.info(`🚀 UltraMarket Product Service started on port ${CONFIG.SERVICE.PORT}`);
    logger.info(`🔗 Service URL: http://localhost:${CONFIG.SERVICE.PORT}`);
    logger.info(`📊 Health Check: http://localhost:${CONFIG.SERVICE.PORT}/health`);
    logger.info(`🛍️ Products API: http://localhost:${CONFIG.SERVICE.PORT}/products`);
    logger.info(`📈 Metrics: http://localhost:${CONFIG.SERVICE.PORT}/metrics`);
    logger.info(`🎯 Process ID: ${process.pid}`);
    logger.info(`🔍 Search: Elasticsearch + Database fallback`);
    logger.info(`⚡ Cache: Redis with smart invalidation`);
    logger.info(`🖼️ Images: Sharp processing with multiple sizes`);
    logger.info(`📝 Logging: Winston with daily rotation`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
      try {
        await prisma.$disconnect();
        await redis.quit();
        logger.info('All connections closed. Exiting...');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
});

export default app;
