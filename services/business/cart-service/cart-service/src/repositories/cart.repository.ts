import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { Decimal } from 'decimal.js';

// Define the types for Cart and CartItem that match the prisma schema
export interface PrismaCart {
  id: string;
  userId: string;
  sessionId?: string;
  subtotal: Decimal;
  taxAmount: Decimal;
  discountAmount: Decimal;
  shippingAmount: Decimal;
  totalAmount: Decimal;
  currency: string;
  status: string;
  appliedCoupons: string[];
  notes?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items?: PrismaCartItem[];
}

export interface PrismaCartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  price: Decimal;
  comparePrice?: Decimal;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartRepository {
  findByUserId(userId: string): Promise<PrismaCart | null>;
  create(userId: string): Promise<PrismaCart>;
  addItem(cartId: string, item: Omit<PrismaCartItem, 'id' | 'cartId'>): Promise<PrismaCartItem>;
  updateItemQuantity(cartItemId: string, quantity: number): Promise<PrismaCartItem>;
  removeItem(cartItemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  getCartWithItems(userId: string): Promise<(PrismaCart & { items: PrismaCartItem[] }) | null>;
}

export class PrismaCartRepository implements CartRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<PrismaCart | null> {
    try {
      return await this.prisma.cart.findUnique({
        where: { userId },
      });
    } catch (error) {
      logger.error('Error finding cart by userId:', error);
      throw error;
    }
  }

  async create(userId: string): Promise<PrismaCart> {
    try {
      return await this.prisma.cart.create({
        data: {
          userId,
          totalAmount: 0,
        },
      });
    } catch (error) {
      logger.error('Error creating cart:', error);
      throw error;
    }
  }

  async addItem(
    cartId: string,
    item: Omit<PrismaCartItem, 'id' | 'cartId'>
  ): Promise<PrismaCartItem> {
    try {
      const { productId, quantity, price } = item;

      return await this.prisma.cartItem.create({
        data: {
          cartId,
          productId,
          quantity,
          price,
          name: item.name || 'Product', // Provide default values for required fields
          sku: item.sku || `SKU-${productId}`,
        },
      });
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  }

  async updateItemQuantity(cartItemId: string, quantity: number): Promise<PrismaCartItem> {
    try {
      return await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
    } catch (error) {
      logger.error('Error updating cart item quantity:', error);
      throw error;
    }
  }

  async removeItem(cartItemId: string): Promise<void> {
    try {
      await this.prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } catch (error) {
      logger.error('Error removing cart item:', error);
      throw error;
    }
  }

  async clearCart(cartId: string): Promise<void> {
    try {
      await this.prisma.cartItem.deleteMany({
        where: { cartId },
      });
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  async getCartWithItems(
    userId: string
  ): Promise<(PrismaCart & { items: PrismaCartItem[] }) | null> {
    try {
      return await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
    } catch (error) {
      logger.error('Error getting cart with items:', error);
      throw error;
    }
  }
}

export const createCartRepository = (prisma: PrismaClient): CartRepository => {
  return new PrismaCartRepository(prisma);
};

export default createCartRepository;
