import { logger } from '../utils/logger';

export interface ProductService {
  getProductById(productId: string): Promise<any>;
  checkProductAvailability(
    productId: string,
    quantity: number
  ): Promise<{ available: boolean; currentStock: number }>;
  getPrice(productId: string): Promise<number>;
}

export class ProductServiceClient implements ProductService {
  private baseUrl: string;

  constructor(baseUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000') {
    this.baseUrl = baseUrl;
  }

  async getProductById(productId: string): Promise<any> {
    try {
      // In a real implementation, this would make an HTTP request to the Product Service
      logger.info(`Fetching product with ID: ${productId}`);
      return {
        id: productId,
        name: 'Test Product',
        description: 'Test product description',
        price: 100,
        stock: 50,
        isActive: true,
      };
    } catch (error) {
      logger.error(`Error fetching product with ID ${productId}:`, error);
      throw error;
    }
  }

  async checkProductAvailability(
    productId: string,
    quantity: number
  ): Promise<{ available: boolean; currentStock: number }> {
    try {
      // In a real implementation, this would make an HTTP request to check availability
      logger.info(`Checking availability for product ${productId}, quantity ${quantity}`);
      return { available: true, currentStock: 50 };
    } catch (error) {
      logger.error(`Error checking product availability for ${productId}:`, error);
      throw error;
    }
  }

  async getPrice(productId: string): Promise<number> {
    try {
      // In a real implementation, this would fetch the current price from the Product Service
      logger.info(`Getting price for product ${productId}`);
      return 100;
    } catch (error) {
      logger.error(`Error getting price for product ${productId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const productService = new ProductServiceClient();
export default productService;
