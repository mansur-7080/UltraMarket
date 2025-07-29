import { logger } from '@ultramarket/shared';
import mongoose from 'mongoose';
import { Product, Category, Review } from '../models';
import { IProduct } from '../models/Product';
import { ICategory } from '../models/Category';
import { IReview } from '../models/Review';

// Re-export interfaces for convenience
export type { IProduct as Product, ICategory as Category, IReview as Review };

class ProductDatabase {
  constructor() {
    this.ensureIndexes();
    this.seedInitialData();
    logger.info(`MongoDB-based Product database initialized`);
  }

  private async ensureIndexes(): Promise<void> {
    try {
      // Ensure all necessary indexes are created for performance
      // Most indexes are already defined in the schema files
    } catch (error) {
      logger.error('Error ensuring indexes:', error);
    }
  }

  private async seedInitialData(): Promise<void> {
    try {
      // Check if we have categories
      const categoryCount = await Category.countDocuments();

      if (categoryCount === 0) {
        logger.info('Seeding initial categories...');

        const categories = [
          {
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic devices and accessories',
            sortOrder: 0,
          },
          {
            name: 'Computers',
            slug: 'computers',
            description: 'Computers and components',
            sortOrder: 1,
          },
          {
            name: 'Audio',
            slug: 'audio',
            description: 'Audio equipment and accessories',
            sortOrder: 2,
          },
          {
            name: 'Gaming',
            slug: 'gaming',
            description: 'Gaming hardware and accessories',
            sortOrder: 3,
          },
          {
            name: 'Mobile',
            slug: 'mobile',
            description: 'Mobile phones and accessories',
            sortOrder: 4,
          },
        ];

        await Category.insertMany(categories);
        logger.info(`Seeded ${categories.length} initial categories`);
      }

      // Check if we have products
      const productCount = await Product.countDocuments();

      if (productCount === 0) {
        logger.info('Seeding initial products...');

        // Get the Electronics category
        const electronicsCategory = await Category.findOne({ slug: 'electronics' });
        const audioCategory = await Category.findOne({ slug: 'audio' });

        if (!electronicsCategory || !audioCategory) {
          logger.warn('Categories not found for seeding products');
          return;
        }

        const products = [
          {
            name: 'Gaming Laptop RTX 4060',
            description:
              'High-performance gaming laptop with NVIDIA RTX 4060 graphics card, Intel Core i7 processor, and 16GB RAM.',
            price: 1299.99,
            category: electronicsCategory._id,
            brand: 'ASUS',
            sku: 'ASUS-GL-4060-001',
            images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302'],
            specifications: {
              processor: 'Intel Core i7',
              graphics: 'NVIDIA RTX 4060',
              ram: '16GB',
            },
            quantity: 15,
            tags: ['gaming', 'laptop', 'rtx'],
            rating: {
              average: 4.5,
              count: 24,
            },
            isFeatured: true,
          },
          {
            name: 'Wireless Headphones',
            description: 'Premium wireless headphones with active noise cancellation.',
            price: 249.99,
            category: audioCategory._id,
            brand: 'Sony',
            sku: 'SONY-WH-1000XM5',
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
            specifications: {
              type: 'Over-ear',
              connectivity: 'Bluetooth',
              battery: '30 hours',
            },
            quantity: 32,
            tags: ['headphones', 'wireless', 'noise-cancelling'],
            rating: {
              average: 4.7,
              count: 89,
            },
            isFeatured: false,
          },
        ];

        await Product.insertMany(products);
        logger.info(`Seeded ${products.length} initial products`);
      }
    } catch (error) {
      logger.error('Error seeding initial data:', error);
    }
  }

  // Product CRUD operations
  async createProduct(data: Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>): Promise<IProduct> {
    try {
      // Create a new product document
      const product = new Product({
        ...data,
        // Make sure rating is properly structured
        rating: {
          average: data.rating?.average || 0,
          count: data.rating?.count || 0,
        },
      });

      // Save to database
      await product.save();

      logger.info(`Created product ${product._id}`);
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<IProduct | null> {
    try {
      return await Product.findById(id);
    } catch (error) {
      logger.error(`Error getting product with ID ${id}:`, error);
      return null;
    }
  }

  async getProductBySku(sku: string): Promise<IProduct | null> {
    try {
      return await Product.findOne({ sku });
    } catch (error) {
      logger.error(`Error getting product with SKU ${sku}:`, error);
      return null;
    }
  }

  async updateProduct(id: string, updates: Partial<IProduct>): Promise<IProduct | null> {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        { ...updates },
        { new: true, runValidators: true }
      );

      return product;
    } catch (error) {
      logger.error(`Error updating product ${id}:`, error);
      return null;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await Product.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error(`Error deleting product ${id}:`, error);
      return false;
    }
  }

  async getAllProducts(
    filters: Record<string, any> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: IProduct[]; total: number }> {
    try {
      // Build query
      const query: any = {};

      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined) {
          switch (key) {
            case 'search':
              query.$text = { $search: filters[key] };
              break;
            case 'minPrice':
              query.price = { ...query.price, $gte: filters[key] };
              break;
            case 'maxPrice':
              query.price = { ...query.price, $lte: filters[key] };
              break;
            case 'category':
              query.category = filters[key];
              break;
            case 'brand':
              query.brand = filters[key];
              break;
            case 'inStock':
            case 'isActive':
            case 'isFeatured':
              query[key] = filters[key];
              break;
            case 'sku':
              query.sku = filters[key];
              break;
          }
        }
      });

      // Count total
      const total = await Product.countDocuments(query);

      // Get paginated products
      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return { products, total };
    } catch (error) {
      logger.error('Error getting products:', error);
      return { products: [], total: 0 };
    }
  }

  async getAllCategories(): Promise<ICategory[]> {
    try {
      return await Category.find().sort({ sortOrder: 1, name: 1 });
    } catch (error) {
      logger.error('Error getting categories:', error);
      return [];
    }
  }

  async getCategoryBySlug(slug: string): Promise<ICategory | null> {
    try {
      return await Category.findOne({ slug });
    } catch (error) {
      logger.error(`Error getting category with slug ${slug}:`, error);
      return null;
    }
  }

  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: IProduct[]; total: number }> {
    try {
      const query = { category: categoryId };
      const total = await Product.countDocuments(query);

      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return { products, total };
    } catch (error) {
      logger.error(`Error getting products for category ${categoryId}:`, error);
      return { products: [], total: 0 };
    }
  }

  // Review methods
  async createReview(reviewData: Partial<IReview>): Promise<any | null> {
    try {
      // Make sure all required fields are present
      if (!reviewData.userName) {
        reviewData.userName = 'Anonymous';
      }

      if (reviewData.isVerifiedPurchase === undefined) {
        reviewData.isVerifiedPurchase = false;
      }

      if (reviewData.isApproved === undefined) {
        reviewData.isApproved = true;
      }

      if (reviewData.helpfulVotes === undefined) {
        reviewData.helpfulVotes = 0;
      }

      const review = new Review(reviewData);
      await review.save();

      // Update product rating
      if (review.productId) {
        const productId = review.productId.toString();
        await this.updateProductRating(productId);
      }

      // Return as any type to avoid type issues
      return review;
    } catch (error) {
      logger.error('Error creating review:', error);
      return null;
    }
  }

  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: any[]; total: number }> {
    try {
      const query = { productId };
      const total = await Review.countDocuments(query);

      const reviews = await Review.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return { reviews, total };
    } catch (error) {
      logger.error(`Error getting reviews for product ${productId}:`, error);
      return { reviews: [], total: 0 };
    }
  }

  private async updateProductRating(productId: string): Promise<void> {
    try {
      const reviews = await Review.find({ productId });

      if (reviews.length === 0) return;

      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Update the product
      await Product.findByIdAndUpdate(productId, {
        'rating.average': parseFloat(averageRating.toFixed(1)),
        'rating.count': reviews.length,
      });
    } catch (error) {
      logger.error(`Error updating product rating for ${productId}:`, error);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        return false;
      }

      // Simple query test
      await Product.findOne().limit(1);
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export default ProductDatabase;
