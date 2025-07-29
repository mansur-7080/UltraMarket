import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared/logging/logger';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export class CategoryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      return categories;
    } catch (error) {
      logger.error('Failed to get all categories', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      return category;
    } catch (error) {
      logger.error('Failed to get category by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        categoryId: id,
      });
      throw error;
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug },
      });

      return category;
    } catch (error) {
      logger.error('Failed to get category by slug', {
        error: error instanceof Error ? error.message : 'Unknown error',
        slug,
      });
      throw error;
    }
  }

  /**
   * Get subcategories by parent ID
   */
  async getSubcategories(parentId: string): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          parentId,
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      return categories;
    } catch (error) {
      logger.error('Failed to get subcategories', {
        error: error instanceof Error ? error.message : 'Unknown error',
        parentId,
      });
      throw error;
    }
  }

  /**
   * Create category
   */
  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      // Check if slug already exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (existingCategory) {
        throw new Error('Category with this slug already exists');
      }

      // Check if parent category exists
      if (data.parentId) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parentCategory) {
          throw new Error('Parent category not found');
        }
      }

      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          parentId: data.parentId,
          image: data.image,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
        },
      });

      logger.info('Category created successfully', {
        categoryId: category.id,
        name: category.name,
        slug: category.slug,
      });

      return category;
    } catch (error) {
      logger.error('Failed to create category', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      // Check if category exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new Error('Category not found');
      }

      // Check if slug already exists (if being updated)
      if (data.slug && data.slug !== existingCategory.slug) {
        const slugExists = await this.prisma.category.findUnique({
          where: { slug: data.slug },
        });

        if (slugExists) {
          throw new Error('Category with this slug already exists');
        }
      }

      // Check if parent category exists (if being updated)
      if (data.parentId && data.parentId !== existingCategory.parentId) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parentCategory) {
          throw new Error('Parent category not found');
        }

        // Prevent circular references
        if (data.parentId === id) {
          throw new Error('Category cannot be its own parent');
        }
      }

      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data,
      });

      logger.info('Category updated successfully', {
        categoryId: id,
        name: updatedCategory.name,
        slug: updatedCategory.slug,
      });

      return updatedCategory;
    } catch (error) {
      logger.error('Failed to update category', {
        error: error instanceof Error ? error.message : 'Unknown error',
        categoryId: id,
        data,
      });
      throw error;
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      // Check if category exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new Error('Category not found');
      }

      // Check if category has subcategories
      const subcategories = await this.prisma.category.findMany({
        where: { parentId: id },
      });

      if (subcategories.length > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      // Check if category has products
      const products = await this.prisma.product.findMany({
        where: { categoryId: id },
        take: 1,
      });

      if (products.length > 0) {
        throw new Error('Cannot delete category with products');
      }

      await this.prisma.category.delete({
        where: { id },
      });

      logger.info('Category deleted successfully', {
        categoryId: id,
        name: existingCategory.name,
      });
    } catch (error) {
      logger.error('Failed to delete category', {
        error: error instanceof Error ? error.message : 'Unknown error',
        categoryId: id,
      });
      throw error;
    }
  }

  /**
   * Get category tree
   */
  async getCategoryTree(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          isActive: true,
          parentId: null, // Only root categories
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          children: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          },
        },
      });

      return categories;
    } catch (error) {
      logger.error('Failed to get category tree', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(id: string): Promise<Category[]> {
    try {
      const path: Category[] = [];
      let currentCategory = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!currentCategory) {
        throw new Error('Category not found');
      }

      // Build path from current category to root
      while (currentCategory) {
        path.unshift(currentCategory);

        if (currentCategory.parentId) {
          currentCategory = await this.prisma.category.findUnique({
            where: { id: currentCategory.parentId },
          });
        } else {
          break;
        }
      }

      return path;
    } catch (error) {
      logger.error('Failed to get category path', {
        error: error instanceof Error ? error.message : 'Unknown error',
        categoryId: id,
      });
      throw error;
    }
  }

  /**
   * Search categories
   */
  async searchCategories(query: string): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      return categories;
    } catch (error) {
      logger.error('Failed to search categories', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<{
    totalCategories: number;
    activeCategories: number;
    categoriesWithProducts: number;
  }> {
    try {
      const [totalCategories, activeCategories, categoriesWithProducts] = await Promise.all([
        this.prisma.category.count(),
        this.prisma.category.count({
          where: { isActive: true },
        }),
        this.prisma.category.count({
          where: {
            products: {
              some: {},
            },
          },
        }),
      ]);

      return {
        totalCategories,
        activeCategories,
        categoriesWithProducts,
      };
    } catch (error) {
      logger.error('Failed to get category stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
