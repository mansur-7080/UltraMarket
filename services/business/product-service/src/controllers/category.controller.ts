/**
 * Category Controller
 * Professional category management
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared/logging/logger';

const prisma = new PrismaClient();

export class CategoryController {
  /**
   * Get all categories
   * GET /api/v1/categories
   */
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          children: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: [
          { level: 'asc' },
          { position: 'asc' }
        ]
      });

      res.status(200).json({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get categories', error);
      next(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/v1/categories/:id
   */
  static async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true }
          }
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.status(200).json({
        success: true,
        data: category,
        message: 'Category retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get category', error);
      next(error);
    }
  }

  /**
   * Get products in category
   * GET /api/v1/categories/:id/products
   */
  static async getCategoryProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: { categoryId: id, status: 'PUBLISHED' },
          include: {
            brand: true,
            images: {
              where: { isPrimary: true },
              take: 1
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({
          where: { categoryId: id, status: 'PUBLISHED' }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          products,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Category products retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get category products', error);
      next(error);
    }
  }

  /**
   * Create new category
   * POST /api/v1/categories
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await prisma.category.create({
        data: {
          ...req.body,
          slug: generateSlug(req.body.name)
        }
      });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      logger.error('Failed to create category', error);
      next(error);
    }
  }

  /**
   * Update category
   * PUT /api/v1/categories/:id
   */
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const category = await prisma.category.update({
        where: { id },
        data: req.body
      });

      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update category', error);
      next(error);
    }
  }

  /**
   * Delete category
   * DELETE /api/v1/categories/:id
   */
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.category.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete category', error);
      next(error);
    }
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
} 