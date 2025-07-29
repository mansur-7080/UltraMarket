import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Define interfaces for our service
export interface ICartItem {
  id?: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  addedAt?: string;
  updatedAt?: string;
  subtotal?: number;
  image?: string;
  sku?: string;
}

export interface ICart {
  id?: string;
  userId: string;
  items: ICartItem[];
  summary?: {
    itemCount: number;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  updatedAt?: string;
  expiresAt?: string;
  coupon?: {
    code: string;
    discount: number;
  };
  appliedCoupons?: Array<{ code: string; discount: number }>;
  save?: () => Promise<ICart>;
}

export class CartService {
  private redisClient = getRedisClient();
  private readonly CACHE_TTL = 3600; // 1 hour

  private getCacheKey(userId: string): string {
    return `cart:${userId}`;
  }

  async getCart(userId: string): Promise<ICart> {
    try {
      // Try cache first
      const cached = await this.redisClient.get(this.getCacheKey(userId));
      if (cached) {
        return JSON.parse(cached);
      }

      // Create new cart
      const cart: ICart = {
        userId,
        items: [],
        summary: {
          itemCount: 0,
          subtotal: 0,
          tax: 0,
          shipping: 0,
          discount: 0,
          total: 0,
        },
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Cache the result
      await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));

      return cart;
    } catch (error) {
      logger.error('Error getting cart:', error);
      throw error;
    }
  }

  async addItem(userId: string, item: ICartItem): Promise<ICart> {
    try {
      const cart = await this.getCart(userId);

      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(
        (cartItem) => cartItem.productId === item.productId
      );

      if (existingItemIndex >= 0 && cart.items[existingItemIndex]) {
        // Update quantity
        cart.items[existingItemIndex].quantity += item.quantity;
        // Update subtotal if present
        if (typeof cart.items[existingItemIndex].subtotal !== 'undefined') {
          cart.items[existingItemIndex].subtotal =
            cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
        }
      } else {
        // Add new item with calculated subtotal
        const newItem = {
          ...item,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtotal: item.price * item.quantity,
        };
        cart.items.push(newItem);
      }

      // Update summary
      this.updateCartSummary(cart);

      // Update cache
      await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));

      logger.info(`Item added to cart for user ${userId}: ${item.productId}`);
      return cart;
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Helper method to update cart summary
  private updateCartSummary(cart: ICart): void {
    if (!cart.summary) {
      cart.summary = {
        itemCount: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
      };
    }

    // Calculate new values
    cart.summary.itemCount = cart.items.length;
    cart.summary.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.summary.tax = cart.summary.subtotal * 0.08; // 8% tax
    cart.summary.total =
      cart.summary.subtotal + cart.summary.tax + cart.summary.shipping - cart.summary.discount;
    cart.updatedAt = new Date().toISOString();
  }

  // Alias for updateItem method used in tests
  async updateItem(
    userId: string,
    productId: string,
    options: { quantity: number }
  ): Promise<ICart> {
    return this.updateItemQuantity(userId, productId, options.quantity);
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number): Promise<ICart> {
    try {
      const cart = await this.getCart(userId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      const itemIndex = cart.items.findIndex((item) => item.productId === productId);
      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        cart.items.splice(itemIndex, 1);
      } else {
        const cartItem = cart.items[itemIndex];
        if (cartItem) {
          cartItem.quantity = quantity;
          // Update subtotal if present
          if (typeof cartItem.subtotal !== 'undefined') {
            cartItem.subtotal = cartItem.price * quantity;
          }
        }
      }

      // Update summary
      this.updateCartSummary(cart);

      // Update cache
      await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));

      logger.info(`Cart item quantity updated for user ${userId}: ${productId} -> ${quantity}`);
      return cart;
    } catch (error) {
      logger.error('Error updating item quantity:', error);
      throw error;
    }
  }

  async removeItem(userId: string, productId: string): Promise<ICart> {
    try {
      const cart = await this.getCart(userId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      const itemIndex = cart.items.findIndex((item) => item.productId === productId);
      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      cart.items.splice(itemIndex, 1);
      // Update summary
      this.updateCartSummary(cart);

      // Update cache
      await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));

      logger.info(`Item removed from cart for user ${userId}: ${productId}`);
      return cart;
    } catch (error) {
      logger.error('Error removing item from cart:', error);
      throw error;
    }
  }

  async clearCart(userId: string): Promise<ICart> {
    try {
      const cart = await this.getCart(userId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      cart.items = [];
      // Update summary
      this.updateCartSummary(cart);

      // Update cache
      await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));

      logger.info(`Cart cleared for user ${userId}`);
      return cart;
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  async invalidateCache(userId: string): Promise<void> {
    try {
      await this.redisClient.del(this.getCacheKey(userId));
      logger.info(`Cache invalidated for user ${userId}`);
    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Method for tests
  async applyCoupon(
    userId: string,
    couponCode: string,
    couponData: {
      type?: 'percentage' | 'fixed';
      value?: number;
      minimumPurchase?: number;
      maxDiscount?: number;
    }
  ): Promise<ICart> {
    try {
      const cart = await this.getCart(userId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      if (!couponData) {
        throw new Error('Invalid coupon code');
      }

      if (
        couponData.minimumPurchase &&
        cart.summary &&
        cart.summary.subtotal < couponData.minimumPurchase
      ) {
        throw new Error(
          `Minimum purchase amount of ${couponData.minimumPurchase} required for this coupon`
        );
      }

      // Apply discount logic based on coupon type
      let discount = 0;
      if (couponData.type === 'percentage' && couponData.value) {
        discount = (cart.summary?.subtotal ?? 0) * (couponData.value / 100);
      } else if (couponData.type === 'fixed' && couponData.value) {
        discount = couponData.value;
      }

      if (couponData.maxDiscount && discount > couponData.maxDiscount) {
        discount = couponData.maxDiscount;
      }

      // Update cart with discount
      if (cart.summary) {
        cart.summary.discount = discount;
        cart.summary.total =
          (cart.summary.subtotal || 0) +
          (cart.summary.tax || 0) +
          (cart.summary.shipping || 0) -
          discount;
      }

      // Save applied coupon info
      cart.coupon = {
        code: couponCode,
        discount,
      };

      // Add to applied coupons array if it exists
      if (!cart.appliedCoupons) {
        cart.appliedCoupons = [];
      }
      cart.appliedCoupons.push({
        code: couponCode,
        discount,
      });

      // Update cache
      await this.redisClient.setex(this.getCacheKey(userId), this.CACHE_TTL, JSON.stringify(cart));

      logger.info(`Coupon ${couponCode} applied to cart for user ${userId}`);
      return cart;
    } catch (error) {
      logger.error('Error applying coupon:', error);
      throw error;
    }
  }
}
