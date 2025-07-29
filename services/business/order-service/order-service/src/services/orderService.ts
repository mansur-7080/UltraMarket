import {
  prisma,
  Prisma,
  JsonObject,
  OrderWhereInput,
  OrderWhereUniqueInput,
} from '../config/prisma-shim';
import { logger } from '@ultramarket/shared';
import { Order, OrderItem, OrderStatus } from '../types/order.types';

export interface CreateOrderData {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  notes?: string;
}

export interface OrderFilters {
  page: number;
  limit: number;
  status?: OrderStatus;
  userId?: string;
  role: string;
}

export interface OrderHistoryFilters {
  page: number;
  limit: number;
}

export interface ExportFilters {
  format: string;
  dateFrom?: string;
  dateTo?: string;
}

export class OrderService {
  async createOrder(data: CreateOrderData): Promise<Order> {
    const { userId, items, shippingAddress, billingAddress, paymentMethod, notes } = data;

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          total,
          shippingAddress: shippingAddress as JsonObject,
          billingAddress: billingAddress as JsonObject,
          paymentMethod,
          notes,
          orderItems: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: {
          orderItems: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return order;
    });

    logger.info(`Order created: ${order.id} for user: ${userId}`);
    return order;
  }

  async getOrderById(id: string, userId: string, role: string): Promise<Order | null> {
    const where: OrderWhereUniqueInput = { id };

    // If not admin, ensure user can only access their own orders
    if (role !== 'admin' && role !== 'manager') {
      where.userId = userId;
    }

    const order = await prisma.order.findUnique({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return order;
  }

  async getAllOrders(
    filters: OrderFilters
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    const { page, limit, status, userId, role } = filters;
    const skip = (page - 1) * limit;

    const where: OrderWhereInput = {};

    // Apply filters
    if (status) where.status = status;
    if (userId) where.userId = userId;

    // If not admin, limit to user's orders
    if (role !== 'admin' && role !== 'manager') {
      where.userId = userId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    notes: string,
    updatedBy: string
  ): Promise<Order> {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        notes,
        updatedAt: new Date(),
      },
      include: {
        orderItems: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log status change
    await prisma.orderHistory.create({
      data: {
        orderId: id,
        status,
        notes,
        updatedBy,
      },
    });

    logger.info(`Order status updated: ${id} -> ${status}`);
    return order;
  }

  async cancelOrder(id: string, reason: string, cancelledBy: string): Promise<Order> {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        notes: `Cancelled: ${reason}`,
        updatedAt: new Date(),
      },
      include: {
        orderItems: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log cancellation
    await prisma.orderHistory.create({
      data: {
        orderId: id,
        status: OrderStatus.CANCELLED,
        notes: `Cancelled by ${cancelledBy}: ${reason}`,
        updatedBy: cancelledBy,
      },
    });

    logger.info(`Order cancelled: ${id} - ${reason}`);
    return order;
  }

  async getOrdersByUser(
    userId: string,
    filters: OrderHistoryFilters
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getOrderHistory(
    userId: string,
    filters: OrderHistoryFilters
  ): Promise<{ history: any[]; total: number; pages: number }> {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.orderHistory.findMany({
        where: {
          order: {
            userId,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              orderItems: true,
            },
          },
        },
      }),
      prisma.orderHistory.count({
        where: {
          order: {
            userId,
          },
        },
      }),
    ]);

    return {
      history,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async exportOrders(filters: ExportFilters): Promise<string> {
    const { format, dateFrom, dateTo } = filters;

    const where: OrderWhereInput = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV format
    const csvHeaders = ['Order ID', 'User', 'Status', 'Total', 'Created At', 'Items'];
    const csvRows = orders.map((order: any) => [
      order.id,
      `${order.user.firstName} ${order.user.lastName}`,
      order.status,
      order.total,
      order.createdAt.toISOString(),
      order.orderItems.length,
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
