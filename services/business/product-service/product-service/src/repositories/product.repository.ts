import { logger } from '../utils/logger';
import prisma from '../lib/prisma';

// Import ProductFilters type from local file to avoid circular dependency
export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  search?: string;
  vendorId?: string;
}

// Define the Product model interface based on Prisma schema
export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  slug: string;
  category: string;
  brand: string | null;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  stock: number;
  images: any;
  specifications: any;
  tags: any;
  vendorId: string | null;
  isFeatured: boolean;
  isActive: boolean;
  isDeleted: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Product repository for database operations
export const productRepository = {
  /**
   * Find a product by ID
   */
  async findById(id: string, includeDeleted = false): Promise<Product | null> {
    try {
      const where: any = { id };

      if (!includeDeleted) {
        where.isDeleted = false;
      }

      const product = await prisma.product.findFirst({ where });
      return product as unknown as Product;
    } catch (error) {
      logger.error('Error finding product by ID', { id, error: error.message });
      throw new Error(`Database error when finding product: ${error.message}`);
    }
  },

  /**
   * Find a product by SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    try {
      const product = await prisma.product.findFirst({
        where: {
          sku,
          isDeleted: false,
        },
      });
      return product as unknown as Product;
    } catch (error) {
      logger.error('Error finding product by SKU', { sku, error: error.message });
      throw new Error(`Database error when finding product by SKU: ${error.message}`);
    }
  },

  /**
   * Find a product by a custom field
   */
  async findByField(field: string, value: string): Promise<Product | null> {
    try {
      const product = await prisma.product.findFirst({
        where: {
          [field]: value,
          isDeleted: false,
        },
      });
      return product as unknown as Product;
    } catch (error) {
      logger.error(`Error finding product by ${field}`, { field, value, error: error.message });
      throw new Error(`Database error when finding product by ${field}: ${error.message}`);
    }
  },

  /**
   * Find many products with filtering and pagination
   */
  async findMany(options: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    includeDeleted?: boolean;
  }): Promise<Product[]> {
    try {
      const {
        skip = 0,
        take = 20,
        where = {},
        orderBy = { createdAt: 'desc' },
        includeDeleted = false,
      } = options;

      // Add deleted filter unless specifically included
      if (!includeDeleted) {
        where.isDeleted = false;
      }

      const products = await prisma.product.findMany({
        skip,
        take,
        where,
        orderBy,
      });

      return products as unknown as Product[];
    } catch (error) {
      logger.error('Error finding products', { options, error: error.message });
      throw new Error(`Database error when finding products: ${error.message}`);
    }
  },

  /**
   * Count products matching criteria
   */
  async count(where = {}, includeDeleted = false): Promise<number> {
    try {
      if (!includeDeleted) {
        where = { ...where, isDeleted: false };
      }

      return await prisma.product.count({ where });
    } catch (error) {
      logger.error('Error counting products', { where, error: error.message });
      throw new Error(`Database error when counting products: ${error.message}`);
    }
  },

  /**
   * Create a new product
   */
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      // Ensure default values for required fields
      const productData = {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isDeleted: false,
        isFeatured: data.isFeatured !== undefined ? data.isFeatured : false,
      };

      const product = await prisma.product.create({
        data: productData,
      });

      return product as unknown as Product;
    } catch (error) {
      logger.error('Error creating product', { error: error.message });
      throw new Error(`Database error when creating product: ${error.message}`);
    }
  },

  /**
   * Update a product by ID
   */
  async update(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return product as unknown as Product;
    } catch (error) {
      logger.error('Error updating product', { id, error: error.message });
      throw new Error(`Database error when updating product: ${error.message}`);
    }
  },

  /**
   * Soft delete a product
   */
  async softDelete(id: string): Promise<void> {
    try {
      await prisma.product.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
        },
      });
    } catch (error) {
      logger.error('Error soft-deleting product', { id, error: error.message });
      throw new Error(`Database error when soft-deleting product: ${error.message}`);
    }
  },

  /**
   * Hard delete a product (permanent)
   */
  async hardDelete(id: string): Promise<void> {
    try {
      await prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error hard-deleting product', { id, error: error.message });
      throw new Error(`Database error when hard-deleting product: ${error.message}`);
    }
  },

  /**
   * Bulk update product stock levels
   */
  async bulkUpdateStock(updates: { productId: string; newStock: number }[]): Promise<void> {
    const transaction = updates.map((update) => {
      return prisma.product.update({
        where: { id: update.productId },
        data: {
          stock: update.newStock,
          updatedAt: new Date(),
        },
      });
    });

    try {
      await prisma.$transaction(transaction);
    } catch (error) {
      logger.error('Error bulk updating product stock', { error: error.message });
      throw new Error(`Database error when bulk updating stock: ${error.message}`);
    }
  },

  /**
   * Full-text search for products
   */
  async search(
    query: string,
    options: {
      skip?: number;
      take?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ products: Product[]; total: number }> {
    try {
      const { skip = 0, take = 20, sortBy = 'relevance', sortOrder = 'desc' } = options;

      // Define search parameters
      const searchParams = {
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { tags: { array_contains: query.toLowerCase() } },
              ],
            },
            { isDeleted: false },
          ],
        },
        skip,
        take,
      };

      // Determine sort order based on parameter
      let orderBy = {};
      switch (sortBy) {
        case 'price':
          orderBy = { price: sortOrder };
          break;
        case 'name':
          orderBy = { name: sortOrder };
          break;
        case 'newest':
          orderBy = { createdAt: sortOrder };
          break;
        case 'relevance':
        default:
          // For relevance, we can't easily do this in the database
          // Instead, we'll sort by multiple fields
          orderBy = [
            { isFeatured: 'desc' },
            { name: { contains: query, mode: 'insensitive' } ? 'asc' : 'desc' },
          ];
      }

      // Execute search queries
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          ...searchParams,
          orderBy,
        }),
        prisma.product.count({
          where: searchParams.where,
        }),
      ]);

      return {
        products: products as unknown as Product[],
        total,
      };
    } catch (error) {
      logger.error('Error searching products', { query, error: error.message });
      throw new Error(`Database error when searching products: ${error.message}`);
    }
  },

  /**
   * Get featured products
   */
  async getFeatured(categoryId?: string, limit = 10): Promise<Product[]> {
    try {
      const where: any = {
        isFeatured: true,
        isDeleted: false,
        isActive: true,
        stock: { gt: 0 },
      };

      if (categoryId) {
        where.category = categoryId;
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: [{ discount: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      });

      return products as unknown as Product[];
    } catch (error) {
      logger.error('Error fetching featured products', { categoryId, error: error.message });
      throw new Error(`Database error when fetching featured products: ${error.message}`);
    }
  },

  /**
   * Get related products based on a product
   */
  async getRelated(
    productId: string,
    category: string,
    tags: string[],
    limit = 8
  ): Promise<Product[]> {
    try {
      // Find products in the same category that match some tags
      const products = await prisma.product.findMany({
        where: {
          id: { not: productId },
          category,
          isDeleted: false,
          isActive: true,
          tags: { hasSome: tags },
        },
        orderBy: {
          tags: { _count: 'desc' }, // Sort by most tag matches
        },
        take: limit,
      });

      // If we don't have enough, add more from the same category
      if (products.length < limit) {
        const additionalProducts = await prisma.product.findMany({
          where: {
            id: { not: productId },
            category,
            isDeleted: false,
            isActive: true,
            id: { notIn: products.map((p) => p.id) },
          },
          take: limit - products.length,
        });

        products.push(...additionalProducts);
      }

      return products as unknown as Product[];
    } catch (error) {
      logger.error('Error fetching related products', {
        productId,
        category,
        error: error.message,
      });
      throw new Error(`Database error when fetching related products: ${error.message}`);
    }
  },

  /**
   * Find low stock products
   */
  async findLowStock(threshold = 10): Promise<Product[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          stock: { lte: threshold, gt: 0 },
          isDeleted: false,
          isActive: true,
        },
        orderBy: { stock: 'asc' },
      });

      return products as unknown as Product[];
    } catch (error) {
      logger.error('Error finding low stock products', { threshold, error: error.message });
      throw new Error(`Database error when finding low stock products: ${error.message}`);
    }
  },
};

export default productRepository;
