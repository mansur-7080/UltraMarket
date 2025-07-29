import axios from 'axios';

// Types matching the useAIRecommendations hook
export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: string;
  brand: string;
}

export interface RecommendationRequestParams {
  productId: string;
  limit?: number;
  algorithm?: 'collaborative' | 'content-based' | 'hybrid';
  userId?: string;
}

export interface RecommendationResponse {
  recommendations: Product[];
  recentlyViewed: Product[];
  insights?: {
    baseFeatures: string[];
    matchType: string;
    confidence: number;
  };
}

/**
 * Machine Learning service for product recommendations
 * Similar to Newegg's recommendation engine
 */
class MLRecommendationService {
  private baseUrl = process.env.REACT_APP_ML_SERVICE_URL || '/api/ml';

  /**
   * Get AI recommendations based on a product
   * @param params Request parameters
   * @returns Promise with recommendation data
   */
  async getRecommendations(params: RecommendationRequestParams): Promise<RecommendationResponse> {
    try {
      // In production, this would call your actual ML service
      // const response = await axios.get(`${this.baseUrl}/recommendations`, { params });
      // return response.data;

      // For now, return mock data
      return this.getMockRecommendations(params);
    } catch (error) {
      // In production, log to monitoring service
      throw new Error('Failed to load recommendations');
    }
  }

  /**
   * Get recommendations for a shopping cart
   * @param productIds Array of product IDs in cart
   * @param limit Number of recommendations to return
   */
  async getCartRecommendations(productIds: string[], limit = 4): Promise<Product[]> {
    try {
      // In production, this would call your actual ML service
      // const response = await axios.post(`${this.baseUrl}/cart-recommendations`, { productIds, limit });
      // return response.data.recommendations;

      // For now, return mock data
      return this.getMockCartRecommendations(productIds, limit);
    } catch (error) {
      // In production, log to monitoring service
      throw new Error('Failed to load cart recommendations');
    }
  }

  /**
   * Track user interaction with a product for improved recommendations
   * @param productId Product ID
   * @param action User action (view, add-to-cart, purchase)
   * @param userId Anonymous or logged-in user ID
   */
  async trackProductInteraction(
    productId: string,
    action: 'view' | 'add-to-cart' | 'purchase',
    userId?: string
  ): Promise<void> {
    try {
      // In production, this would call your actual ML service
      // await axios.post(`${this.baseUrl}/track`, { productId, action, userId });

      // Track interaction silently
      // In production, this would call your analytics service
    } catch (error) {
      // Don't throw errors for tracking - fail silently for better UX
      // In production, log to monitoring service
    }
  }

  // Mock implementation for development
  private getMockRecommendations(params: RecommendationRequestParams): RecommendationResponse {
    // In a real implementation, the recommendations would be based on the productId
    const mockRecommendations: Product[] = [
      {
        id: 'ai1',
        name: 'Samsung Galaxy Watch 6',
        imageUrl: 'https://via.placeholder.com/150?text=GalaxyWatch6',
        price: 349.99,
        rating: 4.6,
        reviewCount: 867,
        category: 'wearables',
        brand: 'Samsung',
      },
      {
        id: 'ai2',
        name: 'Samsung Galaxy Buds 2 Pro',
        imageUrl: 'https://via.placeholder.com/150?text=GalaxyBuds2Pro',
        price: 229.99,
        rating: 4.5,
        reviewCount: 1245,
        category: 'audio',
        brand: 'Samsung',
      },
      {
        id: 'ai3',
        name: 'Samsung 45W Travel Adapter',
        imageUrl: 'https://via.placeholder.com/150?text=SamsungAdapter',
        price: 49.99,
        rating: 4.3,
        reviewCount: 389,
        category: 'accessories',
        brand: 'Samsung',
      },
      {
        id: 'ai4',
        name: 'Samsung Galaxy Tab S9',
        imageUrl: 'https://via.placeholder.com/150?text=GalaxyTabS9',
        price: 899.99,
        rating: 4.7,
        reviewCount: 523,
        category: 'tablets',
        brand: 'Samsung',
      },
      {
        id: 'ai5',
        name: 'Samsung Galaxy S23 Ultra Case',
        imageUrl: 'https://via.placeholder.com/150?text=S23Case',
        price: 29.99,
        rating: 4.2,
        reviewCount: 782,
        category: 'accessories',
        brand: 'Samsung',
      },
    ];

    // Mock recently viewed products
    const mockRecentlyViewed: Product[] = [
      {
        id: 'rv1',
        name: 'Apple iPhone 14 Pro',
        imageUrl: 'https://via.placeholder.com/150?text=iPhone14Pro',
        price: 999.99,
        rating: 4.8,
        reviewCount: 1876,
        category: 'smartphones',
        brand: 'Apple',
      },
      {
        id: 'rv2',
        name: 'Google Pixel 7 Pro',
        imageUrl: 'https://via.placeholder.com/150?text=Pixel7Pro',
        price: 899.99,
        rating: 4.6,
        reviewCount: 1042,
        category: 'smartphones',
        brand: 'Google',
      },
      {
        id: 'rv3',
        name: 'OnePlus 10 Pro',
        imageUrl: 'https://via.placeholder.com/150?text=OnePlus10Pro',
        price: 799.99,
        rating: 4.5,
        reviewCount: 782,
        category: 'smartphones',
        brand: 'OnePlus',
      },
    ];

    return {
      recommendations: mockRecommendations.slice(0, params.limit || 4),
      recentlyViewed: mockRecentlyViewed,
      insights: {
        baseFeatures: ['category', 'brand', 'price_range'],
        matchType: 'complementary',
        confidence: 0.87,
      },
    };
  }

  private getMockCartRecommendations(productIds: string[], limit: number): Product[] {
    // Mock "frequently bought together" recommendations
    const mockCartRecommendations: Product[] = [
      {
        id: 'cart1',
        name: 'AirPods Pro 2',
        imageUrl: 'https://via.placeholder.com/150?text=AirPodsPro2',
        price: 249.99,
        rating: 4.8,
        reviewCount: 2345,
        category: 'audio',
        brand: 'Apple',
      },
      {
        id: 'cart2',
        name: 'Apple MagSafe Charger',
        imageUrl: 'https://via.placeholder.com/150?text=MagSafeCharger',
        price: 39.99,
        rating: 4.5,
        reviewCount: 1853,
        category: 'accessories',
        brand: 'Apple',
      },
      {
        id: 'cart3',
        name: 'Belkin Screen Protector',
        imageUrl: 'https://via.placeholder.com/150?text=ScreenProtector',
        price: 19.99,
        rating: 4.3,
        reviewCount: 987,
        category: 'accessories',
        brand: 'Belkin',
      },
      {
        id: 'cart4',
        name: 'Anker USB-C Cable 6ft',
        imageUrl: 'https://via.placeholder.com/150?text=AnkerCable',
        price: 14.99,
        rating: 4.7,
        reviewCount: 3245,
        category: 'accessories',
        brand: 'Anker',
      },
      {
        id: 'cart5',
        name: 'AppleCare+ for iPhone',
        imageUrl: 'https://via.placeholder.com/150?text=AppleCare',
        price: 199.99,
        rating: 4.2,
        reviewCount: 652,
        category: 'services',
        brand: 'Apple',
      },
    ];

    return mockCartRecommendations.slice(0, limit);
  }
}

// Export as a singleton
export const mlService = new MLRecommendationService();

export default mlService;
