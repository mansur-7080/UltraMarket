import { Category, Prisma } from '@prisma/client';
import db from '../lib/database';
import { logger } from '../shared';

export class CategoryRepository {
  /**
   * Find many categories with filtering and pagination
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
    include?: Prisma.CategoryInclude;
  }): Promise<Category[]> {
    try {
      return await db.prisma.category.findMany(params);
    } catch (error) {
      logger.error('Error finding categories', { error, params });
      throw error;
    }
  }

  /**
   * Count categories with filtering
   */
  async count(params: { where?: Prisma.CategoryWhereInput }): Promise<number> {
    try {
      return await db.prisma.category.count(params);
    } catch (error) {
      logger.error('Error counting categories', { error, params });
      throw error;
    }
  }

  /**
   * Find a single category by unique identifier
   */
  async findUnique(params: {
    where: Prisma.CategoryWhereUniqueInput;
    include?: Prisma.CategoryInclude;
  }): Promise<Category | null> {
    try {
      return await db.prisma.category.findUnique(params);
    } catch (error) {
      logger.error('Error finding unique category', { error, params });
      throw error;
    }
  }

  /**
   * Find first category matching criteria
   */
  async findFirst(params: {
    where?: Prisma.CategoryWhereInput;
    include?: Prisma.CategoryInclude;
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
  }): Promise<Category | null> {
    try {
      return await db.prisma.category.findFirst(params);
    } catch (error) {
      logger.error('Error finding first category', { error, params });
      throw error;
    }
  }

  /**
   * Create a new category
   */
  async create(params: {
    data: Prisma.CategoryCreateInput;
    include?: Prisma.CategoryInclude;
  }): Promise<Category> {
    try {
      return await db.prisma.category.create(params);
    } catch (error) {
      logger.error('Error creating category', { error, params });
      throw error;
    }
  }

  /**
   * Update an existing category
   */
  async update(params: {
    where: Prisma.CategoryWhereUniqueInput;
    data: Prisma.CategoryUpdateInput;
    include?: Prisma.CategoryInclude;
  }): Promise<Category> {
    try {
      return await db.prisma.category.update(params);
    } catch (error) {
      logger.error('Error updating category', { error, params });
      throw error;
    }
  }

  /**
   * Delete a category
   */
  async delete(params: { where: Prisma.CategoryWhereUniqueInput }): Promise<Category> {
    try {
      return await db.prisma.category.delete(params);
    } catch (error) {
      logger.error('Error deleting category', { error, params });
      throw error;
    }
  }

  /**
   * Get hierarchical category tree
   */
  async getCategoryTree(): Promise<Category[]> {
    try {
      // Get all parent categories (those with no parentId)
      const parentCategories = await db.prisma.category.findMany({
        where: {
          parentId: null,
          isActive: true,
        },
        include: {
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      return parentCategories;
    } catch (error) {
      logger.error('Error getting category tree', { error });
      throw error;
    }
  }
}
