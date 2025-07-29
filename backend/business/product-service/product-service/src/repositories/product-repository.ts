import { Product, Prisma } from '@prisma/client';
import db from '../lib/database';
import { logger } from '../shared';

export class ProductRepository {
  /**
   * Find many products with filtering and pagination
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    include?: Prisma.ProductInclude;
  }): Promise<Product[]> {
    try {
      return await db.prisma.product.findMany(params);
    } catch (error) {
      logger.error('Error finding products', { error, params });
      throw error;
    }
  }

  /**
   * Count products with filtering
   */
  async count(params: { where?: Prisma.ProductWhereInput }): Promise<number> {
    try {
      return await db.prisma.product.count(params);
    } catch (error) {
      logger.error('Error counting products', { error, params });
      throw error;
    }
  }

  /**
   * Find a single product by unique identifier
   */
  async findUnique(params: {
    where: Prisma.ProductWhereUniqueInput;
    include?: Prisma.ProductInclude;
  }): Promise<Product | null> {
    try {
      return await db.prisma.product.findUnique(params);
    } catch (error) {
      logger.error('Error finding unique product', { error, params });
      throw error;
    }
  }

  /**
   * Find first product matching criteria
   */
  async findFirst(params: {
    where?: Prisma.ProductWhereInput;
    include?: Prisma.ProductInclude;
    orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
  }): Promise<Product | null> {
    try {
      return await db.prisma.product.findFirst(params);
    } catch (error) {
      logger.error('Error finding first product', { error, params });
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async create(params: {
    data: Prisma.ProductCreateInput;
    include?: Prisma.ProductInclude;
  }): Promise<Product> {
    try {
      return await db.prisma.product.create(params);
    } catch (error) {
      logger.error('Error creating product', { error, params });
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async update(params: {
    where: Prisma.ProductWhereUniqueInput;
    data: Prisma.ProductUpdateInput;
    include?: Prisma.ProductInclude;
  }): Promise<Product> {
    try {
      return await db.prisma.product.update(params);
    } catch (error) {
      logger.error('Error updating product', { error, params });
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async delete(params: { where: Prisma.ProductWhereUniqueInput }): Promise<Product> {
    try {
      return await db.prisma.product.delete(params);
    } catch (error) {
      logger.error('Error deleting product', { error, params });
      throw error;
    }
  }
}
