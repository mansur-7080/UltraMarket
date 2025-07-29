import ProductDatabase from '../database/ProductDatabase';
import { IProduct, ICategory, IReview } from '../models';
import { logger } from '@ultramarket/shared';

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
  sku?: string;
  // Qo'shimcha filtrlar
  rating?: number; // Minimum yulduzlar soni
  tags?: string[]; // Teglar bo'yicha qidirish
  onSale?: boolean; // Chegirmadagi mahsulotlar
  newArrival?: boolean; // Yangi kelgan mahsulotlar
  bestSeller?: boolean; // Ko'p sotilgan mahsulotlar
  sortBy?: string; // Saralash maydoni
  sortOrder?: 'asc' | 'desc'; // Saralash tartibi
  specifications?: Record<string, any>; // Mahsulot spetsifikatsiyalari bo'yicha qidirish
}

export interface ProductSearchOptions {
  filters: ProductFilters;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductResult {
  products: any[];
  total: number;
  pages: number;
  currentPage: number;
}

export class ProductService {
  private database: ProductDatabase;

  constructor() {
    this.database = new ProductDatabase();
  }

  async createProduct(productData: Partial<IProduct>): Promise<any> {
    try {
      // Generate SKU if not provided
      if (!productData.sku) {
        productData.sku = this.generateSKU(productData.name || '', productData.brand || '');
      }

      // Check if SKU already exists
      const existingProducts = await this.database.getAllProducts({ sku: productData.sku }, 1, 1);
      if (existingProducts.products.length > 0) {
        throw new Error('Product with this SKU already exists');
      }

      // Set default values
      productData.isActive = productData.isActive !== undefined ? productData.isActive : true;
      productData.isFeatured =
        productData.isFeatured !== undefined ? productData.isFeatured : false;
      productData.inStock = productData.quantity !== undefined ? productData.quantity > 0 : true;

      // Set initial rating (MongoDB uses nested objects instead of flat fields)
      productData.rating = {
        average: 0,
        count: 0,
      };

      // No need to stringify arrays/objects for MongoDB
      // MongoDB stores these types natively

      const product = await this.database.createProduct(productData as any);
      logger.info(`Product service: Created product ${product._id}`);

      return this.transformProduct(product);
    } catch (error) {
      logger.error('Product service: Error creating product:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<any> {
    try {
      const product = await this.database.getProductById(id);

      if (!product) {
        throw new Error('Product not found');
      }

      return this.transformProduct(product);
    } catch (error) {
      logger.error('Product service: Error getting product by ID:', error);
      throw error;
    }
  }

  async getProductBySku(sku: string): Promise<any> {
    try {
      const product = await this.database.getProductBySku(sku);

      if (!product) {
        throw new Error('Product not found');
      }

      return this.transformProduct(product);
    } catch (error) {
      logger.error('Product service: Error getting product by SKU:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<IProduct>): Promise<any> {
    try {
      // Check if product exists
      const existingProduct = await this.getProductById(id);

      // If SKU is being updated, check for duplicates
      if (updates.sku) {
        const existingProducts = await this.database.getAllProducts({ sku: updates.sku }, 1, 1);
        if (
          existingProducts.products.length > 0 &&
          existingProducts.products[0]._id.toString() !== id
        ) {
          throw new Error('Product with this SKU already exists');
        }
      }

      // Update stock status based on quantity
      if (updates.quantity !== undefined) {
        updates.inStock = updates.quantity > (updates.minQuantity || 0);
      }

      // No need to stringify arrays and objects for MongoDB
      // MongoDB stores them natively

      const product = await this.database.updateProduct(id, updates);

      if (!product) {
        throw new Error('Product not found');
      }

      logger.info(`Product service: Updated product ${product._id}`);
      return this.transformProduct(product);
    } catch (error) {
      logger.error('Product service: Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const success = await this.database.deleteProduct(id);

      if (!success) {
        throw new Error('Product not found');
      }

      logger.info(`Product service: Deleted product ${id}`);
    } catch (error) {
      logger.error('Product service: Error deleting product:', error);
      throw error;
    }
  }

  async searchProducts(options: ProductSearchOptions): Promise<ProductResult> {
    try {
      const results = await this.database.getAllProducts(
        options.filters,
        options.page,
        options.limit
      );

      const { products, total } = results;
      const pages = Math.ceil(total / options.limit);
      const transformedProducts = products.map((product: any) => this.transformProduct(product));

      const result = {
        products: transformedProducts,
        total,
        pages,
        currentPage: options.page,
      };

      logger.info(`Product service: Found ${total} products`);
      return result;
    } catch (error) {
      logger.error('Product service: Error searching products:', error);
      throw error;
    }
  }

  async getFeaturedProducts(limit: number = 10): Promise<any[]> {
    try {
      const results = await this.database.getAllProducts(
        { isFeatured: true, isActive: true },
        1,
        limit
      );

      return results.products.map((product: any) => this.transformProduct(product));
    } catch (error) {
      logger.error('Product service: Error getting featured products:', error);
      throw error;
    }
  }

  async getRelatedProducts(productId: string, limit: number = 6): Promise<any[]> {
    try {
      const product = await this.getProductById(productId);

      const results = await this.database.getAllProducts(
        {
          category: product.category,
          isActive: true,
        },
        1,
        limit + 1
      );

      // Remove the current product from results
      return results.products
        .filter((p: any) => p._id.toString() !== productId)
        .slice(0, limit)
        .map((p: any) => this.transformProduct(p));
    } catch (error) {
      logger.error('Product service: Error getting related products:', error);
      throw error;
    }
  }

  async updateInventory(id: string, quantity: number): Promise<any> {
    try {
      const product = await this.getProductById(id);

      const newQuantity = product.quantity + quantity;
      if (newQuantity < 0) {
        throw new Error('Insufficient inventory');
      }

      const updatedProduct = await this.updateProduct(id, {
        quantity: newQuantity,
        inStock: newQuantity > (product.minQuantity || 0),
      });

      logger.info(`Product service: Updated inventory for ${id}: ${quantity}`);
      return updatedProduct;
    } catch (error) {
      logger.error('Product service: Error updating inventory:', error);
      throw error;
    }
  }

  // Category methods
  async createCategory(categoryData: Partial<ICategory>): Promise<any> {
    try {
      // Prepare category data for MongoDB
      const categoryToCreate = {
        name: categoryData.name || '',
        slug: categoryData.slug || categoryData.name?.toLowerCase().replace(/\s+/g, '-') || '',
        description: categoryData.description,
        parentCategory: categoryData.parentCategory,
        image: categoryData.image,
        isActive: categoryData.isActive ?? true,
        sortOrder: categoryData.sortOrder ?? 0,
      };

      // Category creation is handled by the ProductDatabase class
      // For now, we'll simulate it
      logger.info('Category would be created:', categoryToCreate);

      // Return mock data with the correct structure
      return {
        ...categoryToCreate,
        _id: `cat_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  async getCategories(parentId?: string): Promise<any[]> {
    try {
      const allCategories = await this.database.getAllCategories();
      if (parentId !== undefined) {
        return allCategories.filter(
          (cat: any) => cat.parentCategory && cat.parentCategory.toString() === parentId
        );
      }
      return allCategories;
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<any> {
    try {
      // Try to find by slug first, then by id
      let category = await this.database.getCategoryBySlug(id);

      if (!category) {
        // If not found by slug, search through all categories for matching id
        const allCategories = await this.database.getAllCategories();

        // Find by MongoDB _id
        category = allCategories.find((cat: any) => cat._id.toString() === id) || null;
      }

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      logger.error(`Error getting category ${id}:`, error);
      throw error;
    }
  }

  async updateCategory(id: string, updates: Partial<ICategory>): Promise<any> {
    try {
      // Check if category exists
      const existingCategory = await this.getCategoryById(id);

      // Category update is handled by the ProductDatabase class
      // For now, we'll simulate it
      logger.info(`Category ${id} would be updated with:`, updates);

      // Return mock updated data
      return {
        ...existingCategory,
        ...updates,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      // Check if category exists
      await this.getCategoryById(id);

      // Category deletion is handled by the ProductDatabase class
      // For now, just log
      logger.info(`Category ${id} would be deleted`);
    } catch (error) {
      logger.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }

  // Helper methods
  async getProductByCategoryId(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ProductResult> {
    try {
      const category = await this.getCategoryById(categoryId);

      const results = await this.database.getProductsByCategory(categoryId, page, limit);
      const { products, total } = results;

      const totalPages = Math.ceil(total / limit);
      const transformedProducts = products.map((p: any) => this.transformProduct(p));

      return {
        products: transformedProducts,
        total,
        pages: totalPages,
        currentPage: page,
      };
    } catch (error) {
      logger.error(`Error getting products for category ${categoryId}:`, error);
      throw error;
    }
  }

  async checkAvailability(
    id: string,
    quantity: number = 1
  ): Promise<{ available: boolean; remainingStock: number }> {
    try {
      const product = await this.getProductById(id);
      const available = product.inStock && product.quantity >= quantity;

      return {
        available,
        remainingStock: product.quantity,
      };
    } catch (error) {
      logger.error(`Error checking availability for product ${id}:`, error);
      throw error;
    }
  }

  async getProductStats(): Promise<any> {
    try {
      const allProducts = await this.database.getAllProducts({}, 1, 1000);
      const categories = await this.database.getAllCategories();

      return {
        totalProducts: allProducts.total,
        totalCategories: categories.length,
        inStockProducts: allProducts.products.filter((p: any) => p.inStock).length,
        featuredProducts: allProducts.products.filter((p: any) => p.isFeatured).length,
        averagePrice:
          allProducts.products.length > 0
            ? allProducts.products.reduce((sum: number, p: any) => sum + p.price, 0) /
                allProducts.total || 0
            : 0,
        topCategories: categories.slice(0, 5).map((cat: any) => ({
          id: cat._id,
          name: cat.name,
          productCount: allProducts.products.filter((p: any) => p.category === cat._id.toString())
            .length,
        })),
      };
    } catch (error) {
      logger.error('Error getting product stats:', error);
      throw error;
    }
  }

  // Private utility functions
  private generateSKU(name: string, brand: string): string {
    const namePrefix = name
      .replace(/[^A-Za-z0-9]/g, '')
      .substr(0, 3)
      .toUpperCase();

    const brandPrefix = brand
      .replace(/[^A-Za-z0-9]/g, '')
      .substr(0, 3)
      .toUpperCase();

    const randomPart = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `${brandPrefix}-${namePrefix}-${randomPart}`;
  }

  private transformProduct(product: any): any {
    // With MongoDB, we don't need to parse JSON strings anymore
    // Instead, we'll standardize the document format for the API
    if (!product) return null;

    // Convert Mongoose document to plain object if needed
    const doc = product.toObject ? product.toObject() : product;

    // Standardize the response format (convert _id to id for API consistency)
    const transformed: any = {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      shortDescription: doc.shortDescription,
      price: doc.price,
      originalPrice: doc.originalPrice,
      discount: doc.discount,
      category: doc.category,
      subcategory: doc.subcategory,
      brand: doc.brand,
      sku: doc.sku,
      images: doc.images || [],
      specifications: doc.specifications || {},
      inStock: doc.inStock,
      quantity: doc.quantity,
      minQuantity: doc.minQuantity,
      weight: doc.weight,
      dimensions: doc.dimensions,
      tags: doc.tags || [],
      rating_average: doc.rating?.average || 0,
      rating_count: doc.rating?.count || 0,
      isActive: doc.isActive,
      isFeatured: doc.isFeatured,
      seoTitle: doc.seoTitle,
      seoDescription: doc.seoDescription,
      seoKeywords: doc.seoKeywords || [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    return transformed;
  }
}
