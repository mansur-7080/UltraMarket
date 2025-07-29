import { Product, Category, Review, IProduct, ICategory, IReview } from '../models/Product';
import { logger } from '@ultramarket/shared';
import mongoose from 'mongoose';

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ProductResult {
  products: IProduct[];
  total: number;
  pages: number;
  currentPage: number;
}

export class ProductRepository {
  // Product CRUD operations
  async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
    try {
      const product = new Product(productData);
      await product.save();
      logger.info(`Product created: ${product._id}`);
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  async findProductById(id: string): Promise<IProduct | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const product = await Product.findById(id).populate('reviews').exec();

      return product;
    } catch (error) {
      logger.error('Error finding product by ID:', error);
      throw error;
    }
  }

  async findProductBySku(sku: string): Promise<IProduct | null> {
    try {
      const product = await Product.findOne({ sku }).populate('reviews').exec();

      return product;
    } catch (error) {
      logger.error('Error finding product by SKU:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<IProduct>): Promise<IProduct | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('reviews');

      if (product) {
        logger.info(`Product updated: ${product._id}`);
      }

      return product;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Product.findByIdAndDelete(id);

      if (result) {
        logger.info(`Product deleted: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async findProducts(
    filters: ProductFilters = {},
    sort: ProductSort = { field: 'createdAt', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<ProductResult> {
    try {
      const query: any = {};

      // Apply filters
      if (filters.category) query.category = filters.category;
      if (filters.subcategory) query.subcategory = filters.subcategory;
      if (filters.brand) query.brand = filters.brand;
      if (filters.minPrice !== undefined) query.price = { ...query.price, $gte: filters.minPrice };
      if (filters.maxPrice !== undefined) query.price = { ...query.price, $lte: filters.maxPrice };
      if (filters.inStock !== undefined) query.inStock = filters.inStock;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;

      // Text search
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Sort configuration
      const sortConfig: any = {};
      if (filters.search) {
        sortConfig.score = { $meta: 'textScore' };
      }
      sortConfig[sort.field] = sort.direction === 'asc' ? 1 : -1;

      // Pagination
      const skip = (pagination.page - 1) * pagination.limit;

      // Execute query
      const [products, total] = await Promise.all([
        Product.find(query)
          .sort(sortConfig)
          .skip(skip)
          .limit(pagination.limit)
          .populate('reviews')
          .exec(),
        Product.countDocuments(query),
      ]);

      const pages = Math.ceil(total / pagination.limit);

      return {
        products,
        total,
        pages,
        currentPage: pagination.page,
      };
    } catch (error) {
      logger.error('Error finding products:', error);
      throw error;
    }
  }

  async updateProductRating(productId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return;
      }

      const reviews = await Review.find({ productId });

      if (reviews.length === 0) {
        await Product.findByIdAndUpdate(productId, {
          'rating.average': 0,
          'rating.count': 0,
        });
        return;
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(averageRating * 10) / 10,
        'rating.count': reviews.length,
      });

      logger.info(`Product rating updated: ${productId}`);
    } catch (error) {
      logger.error('Error updating product rating:', error);
      throw error;
    }
  }

  // Category operations
  async createCategory(categoryData: Partial<ICategory>): Promise<ICategory> {
    try {
      const category = new Category(categoryData);
      await category.save();
      logger.info(`Category created: ${category._id}`);
      return category;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  async findCategories(parentId?: string): Promise<ICategory[]> {
    try {
      const query = parentId ? { parentCategory: parentId } : {};
      const categories = await Category.find(query)
        .sort({ sortOrder: 1, name: 1 })
        .populate('parentCategory')
        .exec();

      return categories;
    } catch (error) {
      logger.error('Error finding categories:', error);
      throw error;
    }
  }

  async findCategoryBySlug(slug: string): Promise<ICategory | null> {
    try {
      const category = await Category.findOne({ slug }).populate('parentCategory').exec();

      return category;
    } catch (error) {
      logger.error('Error finding category by slug:', error);
      throw error;
    }
  }

  // Review operations
  async createReview(reviewData: Partial<IReview>): Promise<IReview> {
    try {
      const review = new Review(reviewData);
      await review.save();

      // Update product rating
      await this.updateProductRating(review.productId.toString());

      logger.info(`Review created: ${review._id}`);
      return review;
    } catch (error) {
      logger.error('Error creating review:', error);
      throw error;
    }
  }

  async findReviewsByProduct(
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reviews: IReview[];
    total: number;
    pages: number;
  }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return { reviews: [], total: 0, pages: 0 };
      }

      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        Review.find({ productId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        Review.countDocuments({ productId }),
      ]);

      const pages = Math.ceil(total / limit);

      return { reviews, total, pages };
    } catch (error) {
      logger.error('Error finding reviews by product:', error);
      throw error;
    }
  }

  // Analytics and reporting
  async getProductStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    outOfStock: number;
    averagePrice: number;
    totalCategories: number;
  }> {
    try {
      const [totalProducts, activeProducts, outOfStock, priceStats, totalCategories] =
        await Promise.all([
          Product.countDocuments(),
          Product.countDocuments({ isActive: true }),
          Product.countDocuments({ inStock: false }),
          Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, averagePrice: { $avg: '$price' } } },
          ]),
          Category.countDocuments(),
        ]);

      return {
        totalProducts,
        activeProducts,
        outOfStock,
        averagePrice: priceStats[0]?.averagePrice || 0,
        totalCategories,
      };
    } catch (error) {
      logger.error('Error getting product stats:', error);
      throw error;
    }
  }
}
