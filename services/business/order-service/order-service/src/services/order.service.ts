import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/prisma-shim';
import { logger } from '../utils/logger';

// Response interfaces
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Order item interface
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

// Shipping address interface
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Order interface
export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELED'
  | 'REFUNDED'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'FAILED';

export type OrderType = 'STANDARD' | 'EXPRESS' | 'INTERNATIONAL' | 'PICKUP';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress?: ShippingAddress | undefined;
  paymentId?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

import { OrderCreateData, OrderUpdateData } from '../types/order';

export class OrderService {
  async createOrder(orderData: OrderCreateData): Promise<ServiceResponse<Order>> {
    try {
      // Validate required fields
      if (!orderData.userId || !orderData.items || orderData.items.length === 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid order data',
            details: { fields: ['userId', 'items'] },
          },
        };
      }

      // Calculate totals
      const subtotal = orderData.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );
      const taxRate = 0.08; // 8% tax
      const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
      const shippingAmount = 9.99;
      const discountAmount = 0; // No discount by default
      const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

      try {
        const result = await prisma.$transaction(async (tx: any) => {
          // Create order
          const order = await tx.order.create({
            data: {
              userId: orderData.userId,
              orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
              status: 'PENDING',
              subtotal,
              taxAmount,
              shippingAmount,
              discountAmount,
              totalAmount,
              // Add shipping and payment info
              // ...more fields as needed
            },
          });

          // Create order items
          await tx.orderItem.createMany({
            data: orderData.items.map((item: any) => ({
              orderId: order.id,
              productId: item.productId,
              name: item.name,
              sku: item.sku || '',
              price: item.price,
              quantity: item.quantity,
              subtotal: item.price * item.quantity,
            })),
          });

          return order;
        });

        logger.info('Order created successfully', {
          orderId: result.id,
          userId: orderData.userId,
        });

        // Add default empty array for items to match Order interface
        const order: Order = {
          ...result,
          id: result.id,
          userId: result.userId,
          items: [], // Required by the Order interface
          totalAmount:
            Number(result.subtotal) +
            Number(result.taxAmount) +
            Number(result.shippingAmount) -
            Number(result.discountAmount),
          status: result.status as unknown as OrderStatus, // Convert Prisma enum to our enum
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        };

        return {
          success: true,
          data: order,
          message: 'Order created successfully',
        };
      } catch (error) {
        throw error; // Rethrow for the outer catch
      }
    } catch (error) {
      logger.error('Failed to create order', { error });
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create order',
          details: { error },
        },
      };
    }
  }

  async getOrderById(orderId: string): Promise<ServiceResponse<any>> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          shipping: true,
          billing: true,
          payments: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Order not found',
            details: {
              resource: 'Order',
              identifier: orderId,
            },
          },
        };
      }

      return {
        success: true,
        data: order,
        message: 'Order retrieved successfully',
      };
    } catch (error) {
      logger.error('Failed to get order', { error, orderId });
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to get order',
          details: { error },
        },
      };
    }
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: string,
    userId?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Order not found',
            details: {
              resource: 'Order',
              identifier: orderId,
            },
          },
        };
      }

      // Check if user is authorized to update this order (if userId provided)
      if (userId && order.userId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authorized to update this order',
          },
        };
      }

      // Business rules for status transitions
      const invalidTransitions: Record<string, string[]> = {
        DELIVERED: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
        COMPLETED: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
        CANCELLED: ['DELIVERED', 'COMPLETED'],
        REFUNDED: ['PENDING'],
      };

      if (
        invalidTransitions[order.status as keyof typeof invalidTransitions] &&
        invalidTransitions[order.status as keyof typeof invalidTransitions]?.includes(newStatus)
      ) {
        return {
          success: false,
          error: {
            code: 'BUSINESS_ERROR',
            message: 'Invalid order status transition',
            details: {
              businessRule: 'INVALID_STATUS_TRANSITION',
              currentStatus: order.status,
              requestedStatus: newStatus,
            },
          },
        };
      }

      // Update the order status
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus as any,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedOrder,
        message: 'Order status updated successfully',
      };
    } catch (error) {
      logger.error('Failed to update order status', { error, orderId });
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update order status',
          details: { error },
        },
      };
    }
  }

  async getUserOrders(
    userId: string,
    page = 1,
    limit = 10,
    status?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const where: any = { userId };
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { items: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        message: 'User orders retrieved successfully',
      };
    } catch (error) {
      logger.error('Failed to get user orders', { error, userId });
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to get user orders',
          details: { error },
        },
      };
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<ServiceResponse<any>> {
    return this.updateOrderStatus(orderId, 'CANCELLED' as OrderStatus, userId);
  }
}
