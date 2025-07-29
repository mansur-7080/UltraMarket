/**
 * Brand Controller
 * Professional brand management
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared/logging/logger';

const prisma = new PrismaClient();

export class BrandController {
  /**
   * Get all brands
   * GET /api/v1/brands
   */
  static async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await prisma.brand.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.status(200).json({
        success: true,
        data: brands,
        message: 'Brands retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get brands', error);
      next(error);
    }
  }

  /**
   * Get brand by ID
   * GET /api/v1/brands/:id
   */
  static async getBrandById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const brand = await prisma.brand.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      res.status(200).json({
        success: true,
        data: brand,
        message: 'Brand retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get brand', error);
      next(error);
    }
  }

  /**
   * Get products by brand
   * GET /api/v1/brands/:id/products
   */
  static async getBrandProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: { brandId: id, status: 'PUBLISHED' },
          include: {
            category: true,
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
          where: { brandId: id, status: 'PUBLISHED' }
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
        message: 'Brand products retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get brand products', error);
      next(error);
    }
  }

  /**
   * Create new brand
   * POST /api/v1/brands
   */
  static async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await prisma.brand.create({
        data: {
          ...req.body,
          slug: generateSlug(req.body.name)
        }
      });

      res.status(201).json({
        success: true,
        data: brand,
        message: 'Brand created successfully'
      });
    } catch (error) {
      logger.error('Failed to create brand', error);
      next(error);
    }
  }

  /**
   * Update brand
   * PUT /api/v1/brands/:id
   */
  static async updateBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const brand = await prisma.brand.update({
        where: { id },
        data: req.body
      });

      res.status(200).json({
        success: true,
        data: brand,
        message: 'Brand updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update brand', error);
      next(error);
    }
  }

  /**
   * Delete brand
   * DELETE /api/v1/brands/:id
   */
  static async deleteBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.brand.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: 'Brand deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete brand', error);
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