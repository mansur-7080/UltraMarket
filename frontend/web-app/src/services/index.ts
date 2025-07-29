/**
 * UltraMarket E-Commerce Platform
 * TypeScript API Services Index
 * Professional Service Layer Organization
 */

// Export types
export * from './types';

// Export base API client
export { api, apiClient, TokenManager } from './apiClient';

// Import services
import { AuthService } from './authService';

// Create service instances
export const authService = new AuthService();

// Create placeholder services for missing ones
class UserService {
  async getProfile(...args: any[]) { return { data: { user: null } }; }
  async updateProfile(...args: any[]) { return { data: { user: null } }; }
  async getAddresses(...args: any[]) { return { data: { addresses: [] } }; }
  async addAddress(...args: any[]) { return { data: { address: null } }; }
  async updateAddress(...args: any[]) { return { data: { address: null } }; }
  async deleteAddress(...args: any[]) { return { data: null }; }
  async updatePreferences(...args: any[]) { return { data: { preferences: null } }; }
}

class ProductService {
  async getProducts(...args: any[]) { return { data: { products: [] } }; }
  async getProduct(...args: any[]) { return { data: { product: null } }; }
  async searchProducts(...args: any[]) { return { data: { products: [] } }; }
}

class CartService {
  async getCart(...args: any[]) { return { data: { cart: null } }; }
  async addToCart(...args: any[]) { return { data: { cart: null } }; }
  async updateCartItem(...args: any[]) { return { data: { cart: null } }; }
  async removeFromCart(...args: any[]) { return { data: { cart: null } }; }
}

class OrderService {
  async getOrders(...args: any[]) { return { data: { orders: [] } }; }
  async getOrder(...args: any[]) { return { data: { order: null } }; }
  async createOrder(...args: any[]) { return { data: { order: null } }; }
}

class WishlistService {
  async getWishlist(...args: any[]) { return { data: { wishlist: [] } }; }
  async addToWishlist(...args: any[]) { return { data: { wishlist: [] } }; }
  async removeFromWishlist(...args: any[]) { return { data: { wishlist: [] } }; }
}

class ReviewService {
  async getReviews(...args: any[]) { return { data: { reviews: [] } }; }
  async createReview(...args: any[]) { return { data: { review: null } }; }
}

class NotificationService {
  async getNotifications(...args: any[]) { return { data: { notifications: [] } }; }
  async markAsRead(...args: any[]) { return { data: null }; }
}

class SearchService {
  async search(...args: any[]) { return { data: { results: [] } }; }
}

class AnalyticsService {
  async trackEvent(...args: any[]) { return { data: null }; }
}

// Service instances
export const userService = new UserService();
export const productService = new ProductService();
export const cartService = new CartService();
export const orderService = new OrderService();
export const wishlistService = new WishlistService();
export const reviewService = new ReviewService();
export const notificationService = new NotificationService();
export const searchService = new SearchService();
export const analyticsService = new AnalyticsService();

// Combined API services object
export const apiServices = {
  auth: authService,
  user: userService,
  product: productService,
  cart: cartService,
  order: orderService,
  wishlist: wishlistService,
  review: reviewService,
  notification: notificationService,
  search: searchService,
  analytics: analyticsService,
} as const;

// Default export
export default apiServices;

// Service class exports for direct use
export {
  AuthService,
  UserService,
  ProductService,
  CartService,
  OrderService,
  WishlistService,
  ReviewService,
  NotificationService,
  SearchService,
  AnalyticsService,
}; 