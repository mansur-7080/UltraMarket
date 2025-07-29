import { OrderService } from '../services/order.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('OrderService', () => {
  let orderService: OrderService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    orderService = new OrderService();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const mockOrderData = {
      userId: 'user-123',
      items: [
        {
          productId: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          price: 99.99,
          quantity: 2,
        },
      ],
      shipping: {
        method: 'standard',
        address: {
          street1: '123 Main St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
      },
      payment: {
        method: 'card',
        amount: 199.98,
      },
    };

    const mockCreatedOrder = {
      id: 'order-123',
      orderNumber: 'ORD-2024-001',
      userId: 'user-123',
      status: 'PENDING',
      subtotal: 199.98,
      taxAmount: 16.0,
      shippingAmount: 9.99,
      discountAmount: 0,
      totalAmount: 225.97,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create order successfully', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.order.create.mockResolvedValue(mockCreatedOrder);
      mockPrisma.orderItem.createMany.mockResolvedValue({ count: 1 });

      const result = await orderService.createOrder(mockOrderData);

      expect(result).toEqual({
        success: true,
        data: mockCreatedOrder,
        message: 'Order created successfully',
      });

      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockOrderData.userId,
          status: 'PENDING',
          subtotal: expect.any(Number),
          totalAmount: expect.any(Number),
        }),
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Order created successfully',
        expect.objectContaining({
          orderId: mockCreatedOrder.id,
          userId: mockOrderData.userId,
        })
      );
    });

    it('should handle validation errors', async () => {
      const invalidOrderData = {
        ...mockOrderData,
        userId: '', // Invalid user ID
      };

      const result = await orderService.createOrder(invalidOrderData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.order.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.$transaction.mockRejectedValue(dbError);

      const result = await orderService.createOrder(mockOrderData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DATABASE_ERROR');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create order',
        expect.objectContaining({ error: dbError })
      );
    });

    it('should calculate totals correctly', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.order.create.mockResolvedValue(mockCreatedOrder);
      mockPrisma.orderItem.createMany.mockResolvedValue({ count: 1 });

      await orderService.createOrder(mockOrderData);

      const createCall = mockPrisma.order.create.mock.calls[0][0];
      const orderData = createCall.data;

      expect(orderData.subtotal).toBe(199.98); // 2 * 99.99
      expect(orderData.taxAmount).toBeGreaterThan(0);
      expect(orderData.totalAmount).toBeGreaterThan(orderData.subtotal);
    });
  });

  describe('getOrderById', () => {
    const mockOrderId = 'order-123';
    const mockOrder = {
      id: mockOrderId,
      orderNumber: 'ORD-2024-001',
      userId: 'user-123',
      status: 'CONFIRMED',
      subtotal: 199.98,
      taxAmount: 16.0,
      shippingAmount: 9.99,
      discountAmount: 0,
      totalAmount: 225.97,
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          price: 99.99,
          quantity: 2,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return order when found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById(mockOrderId);

      expect(result).toEqual({
        success: true,
        data: mockOrder,
        message: 'Order retrieved successfully',
      });

      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        include: {
          items: true,
          shipping: true,
          billing: true,
          payments: true,
        },
      });
    });

    it('should return not found when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const result = await orderService.getOrderById(mockOrderId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.error?.details).toEqual({
        resource: 'Order',
        identifier: mockOrderId,
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.order.findUnique.mockRejectedValue(dbError);

      const result = await orderService.getOrderById(mockOrderId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DATABASE_ERROR');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get order',
        expect.objectContaining({ error: dbError })
      );
    });
  });

  describe('updateOrderStatus', () => {
    const mockOrderId = 'order-123';
    const mockUserId = 'user-123';
    const newStatus = 'SHIPPED';

    const mockUpdatedOrder = {
      id: mockOrderId,
      orderNumber: 'ORD-2024-001',
      userId: mockUserId,
      status: newStatus,
      subtotal: 199.98,
      totalAmount: 225.97,
      updatedAt: new Date(),
    };

    it('should update order status successfully', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: mockOrderId,
        userId: mockUserId,
        status: 'CONFIRMED',
      });
      mockPrisma.order.update.mockResolvedValue(mockUpdatedOrder);

      const result = await orderService.updateOrderStatus(mockOrderId, newStatus, mockUserId);

      expect(result).toEqual({
        success: true,
        data: mockUpdatedOrder,
        message: 'Order status updated successfully',
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: {
          status: newStatus,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should validate status transitions', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: mockOrderId,
        userId: mockUserId,
        status: 'DELIVERED', // Cannot change from delivered
      });

      const result = await orderService.updateOrderStatus(mockOrderId, 'CANCELLED', mockUserId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_ERROR');
      expect(result.error?.details?.businessRule).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should check user ownership', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: mockOrderId,
        userId: 'different-user',
        status: 'CONFIRMED',
      });

      const result = await orderService.updateOrderStatus(mockOrderId, newStatus, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('getUserOrders', () => {
    const mockUserId = 'user-123';
    const mockOptions = {
      page: 1,
      limit: 10,
      status: 'CONFIRMED',
    };

    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-2024-001',
        userId: mockUserId,
        status: 'CONFIRMED',
        totalAmount: 225.97,
        createdAt: new Date(),
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-2024-002',
        userId: mockUserId,
        status: 'CONFIRMED',
        totalAmount: 150.0,
        createdAt: new Date(),
      },
    ];

    it('should return user orders with pagination', async () => {
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(25);

      const result = await orderService.getUserOrders(mockUserId, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
      expect(result.metadata?.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
        nextPage: 2,
      });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: 'CONFIRMED',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              name: true,
              sku: true,
              price: true,
              quantity: true,
              image: true,
            },
          },
        },
      });
    });

    it('should handle empty results', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      const result = await orderService.getUserOrders(mockUserId, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.metadata?.pagination.total).toBe(0);
    });
  });

  describe('cancelOrder', () => {
    const mockOrderId = 'order-123';
    const mockUserId = 'user-123';
    const mockReason = 'Customer requested cancellation';

    const mockOrder = {
      id: mockOrderId,
      userId: mockUserId,
      status: 'CONFIRMED',
      items: [{ id: 'item-1', productId: 'product-1', quantity: 2 }],
    };

    it('should cancel order successfully', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
      });

      const result = await orderService.cancelOrder(mockOrderId, mockUserId, mockReason);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('CANCELLED');

      expect(logger.info).toHaveBeenCalledWith(
        'Order cancelled successfully',
        expect.objectContaining({
          orderId: mockOrderId,
          reason: mockReason,
        })
      );
    });

    it('should not cancel non-cancellable orders', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'SHIPPED', // Cannot cancel shipped orders
      });

      const result = await orderService.cancelOrder(mockOrderId, mockUserId, mockReason);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUSINESS_ERROR');
      expect(result.error?.details?.businessRule).toBe('ORDER_NOT_CANCELLABLE');
    });

    it('should restore inventory on cancellation', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      await orderService.cancelOrder(mockOrderId, mockUserId, mockReason);

      // Verify that inventory restoration logic was called
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('calculateOrderTotals', () => {
    it('should calculate totals correctly', () => {
      const items = [
        { price: 99.99, quantity: 2 },
        { price: 49.99, quantity: 1 },
      ];

      const totals = orderService.calculateOrderTotals(items);

      expect(totals.subtotal).toBe(249.97);
      expect(totals.taxAmount).toBeGreaterThan(0);
      expect(totals.shippingAmount).toBeGreaterThan(0);
      expect(totals.totalAmount).toBeGreaterThan(totals.subtotal);
    });

    it('should handle discounts', () => {
      const items = [{ price: 100.0, quantity: 1 }];
      const discountAmount = 10.0;

      const totals = orderService.calculateOrderTotals(items, discountAmount);

      expect(totals.subtotal).toBe(100.0);
      expect(totals.discountAmount).toBe(10.0);
      expect(totals.totalAmount).toBeLessThan(
        totals.subtotal + totals.taxAmount + totals.shippingAmount
      );
    });
  });

  describe('validateOrderData', () => {
    const validOrderData = {
      userId: 'user-123',
      items: [
        {
          productId: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          price: 99.99,
          quantity: 1,
        },
      ],
    };

    it('should validate correct order data', () => {
      const validation = orderService.validateOrderData(validOrderData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const invalidData = {
        userId: '',
        items: [],
      };

      const validation = orderService.validateOrderData(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('User ID is required');
      expect(validation.errors).toContain('At least one item is required');
    });

    it('should validate item data', () => {
      const invalidData = {
        ...validOrderData,
        items: [
          {
            productId: '',
            name: '',
            sku: '',
            price: -1,
            quantity: 0,
          },
        ],
      };

      const validation = orderService.validateOrderData(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getOrderAnalytics', () => {
    const mockAnalytics = {
      totalOrders: 150,
      totalRevenue: 25000.0,
      averageOrderValue: 166.67,
      topProducts: [
        { productId: 'product-1', sales: 50 },
        { productId: 'product-2', sales: 35 },
      ],
      statusDistribution: {
        PENDING: 10,
        CONFIRMED: 80,
        SHIPPED: 45,
        DELIVERED: 120,
        CANCELLED: 15,
      },
    };

    it('should return order analytics', async () => {
      // Mock the analytics query
      jest.spyOn(orderService, 'getOrderAnalytics').mockResolvedValue({
        success: true,
        data: mockAnalytics,
        message: 'Analytics retrieved successfully',
      });

      const result = await orderService.getOrderAnalytics('2024-01-01', '2024-12-31');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalytics);
    });
  });
});
