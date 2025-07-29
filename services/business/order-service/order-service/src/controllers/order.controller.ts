import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../config/prisma-shim';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class OrderController {
  /**
   * Get all orders with pagination and filtering
   */
  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
      }

      const userId = (req as any).user?.id;
      const { page = 1, limit = 20, status, startDate, endDate, orderNumber } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};

      // Filter by user if not admin
      if (!['admin', 'super_admin'].includes((req as any).user?.role)) {
        where.user_id = userId;
      }

      if (status) {
        where.status = status as string;
      }

      if (orderNumber) {
        where.order_number = { contains: orderNumber as string, mode: 'insensitive' };
      }

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = new Date(startDate as string);
        if (endDate) where.created_at.lte = new Date(endDate as string);
      }

      // Get orders with items and user info
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                first_name: true,
                last_name: true,
              },
            },
            order_items: {
              include: {
                products: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    price: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.order.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      logger.info('Orders retrieved successfully', {
        count: orders.length,
        total,
        page: pageNum,
        limit: limitNum,
      });

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              first_name: true,
              last_name: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new AppError(404, 'Order not found');
      }

      // Check if user has permission to view this order
      if (order.user_id !== userId && !['admin', 'super_admin'].includes((req as any).user?.role)) {
        throw new AppError(403, 'You can only view your own orders');
      }

      logger.info('Order retrieved successfully', { orderId: id });

      res.json({
        success: true,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new order
   */
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
      }

      const userId = (req as any).user?.id;
      const {
        items,
        shipping_address,
        billing_address,
        payment_method,
        currency = 'USD',
        notes,
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'Order must contain at least one item');
      }

      // Calculate totals and validate items
      let subtotal = 0;
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await prisma.product.findFirst({
          where: {
            id: item.product_id,
            is_active: true,
            status: 'active',
          },
        });

        if (!product) {
          throw new AppError(404, `Product ${item.product_id} not found`);
        }

        if (product.stock_quantity < item.quantity && product.track_inventory) {
          throw new AppError(400, `Insufficient stock for product ${product.name}`);
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.price,
          total_price: itemTotal,
        });
      }

      // Calculate tax and shipping (simplified)
      const tax = subtotal * 0.1; // 10% tax
      const shipping = 10; // Fixed shipping cost
      total = subtotal + tax + shipping;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create order
      const order = await prisma.order.create({
        data: {
          order_number: orderNumber,
          user_id: userId,
          status: 'pending',
          currency,
          subtotal,
          tax,
          shipping_cost: shipping,
          total,
          payment_status: 'pending',
          shipping_address: JSON.stringify(shipping_address),
          billing_address: JSON.stringify(billing_address),
          payment_method,
          notes,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Create order items
      await Promise.all(
        orderItems.map((item) =>
          prisma.orderItem.create({
            data: {
              order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
            },
          })
        )
      );

      // Update product stock
      await Promise.all(
        orderItems.map((item) =>
          prisma.product.update({
            where: { id: item.product_id },
            data: {
              stock_quantity: {
                decrement: item.quantity,
              },
            },
          })
        )
      );

      logger.info('Order created successfully', {
        orderId: order.id,
        orderNumber: order.order_number,
        userId,
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { status, payment_status } = req.body;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new AppError(404, 'Order not found');
      }

      // Only admins can update order status
      if (!['admin', 'super_admin'].includes((req as any).user?.role)) {
        throw new AppError(403, 'Only administrators can update order status');
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (payment_status) updateData.payment_status = payment_status;
      updateData.updatedAt = new Date();

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData,
      });

      logger.info('Order status updated successfully', {
        orderId: id,
        status: status || updatedOrder.status,
        paymentStatus: payment_status || updatedOrder.payment_status,
      });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cart items
   */
  static async getCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | undefined> {
    try {
      const userId = (req as any).user?.id;
      const sessionId = req.session?.id;

      const where: any = {};
      if (userId) {
        where.user_id = userId;
      } else if (sessionId) {
        where.session_id = sessionId;
      } else {
        return res.json({
          success: true,
          data: { items: [], total: 0 },
        });
      }

      const cartItems = await prisma.cartItem.findMany({
        where: {
          ...where,
          expires_at: { gt: new Date() },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      const total = cartItems.reduce(
        (sum: number, item: any) => sum + Number(item.price) * item.quantity,
        0
      );

      logger.info('Cart retrieved successfully', {
        userId,
        sessionId,
        itemCount: cartItems.length,
        total,
      });

      return res.json({
        success: true,
        data: {
          items: cartItems,
          total,
        },
      });
    } catch (error) {
      next(error);
      return undefined;
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
      }

      const userId = (req as any).user?.id;
      const sessionId = req.session?.id;
      const { product_id, quantity = 1 } = req.body;

      if (!userId && !sessionId) {
        throw new AppError(400, 'User session required');
      }

      // Check if product exists and is available
      const product = await prisma.product.findFirst({
        where: {
          id: product_id,
          is_active: true,
          status: 'active',
        },
      });

      if (!product) {
        throw new AppError(404, 'Product not found');
      }

      if (product.stock_quantity < quantity && product.track_inventory) {
        throw new AppError(400, 'Insufficient stock');
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          product_id,
          ...(userId ? { user_id: userId } : { session_id: sessionId }),
        },
      });

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new cart item
        await prisma.cartItem.create({
          data: {
            product_id,
            quantity,
            unit_price: product.price,
            user_id: userId,
            session_id: sessionId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }

      logger.info('Item added to cart successfully', {
        productId: product_id,
        quantity,
        userId,
        sessionId,
      });

      res.json({
        success: true,
        message: 'Item added to cart successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
      }

      const { id } = req.params;
      const { quantity } = req.body;

      const cartItem = await prisma.cartItem.findUnique({
        where: { id },
        include: {
          products: {
            select: {
              stock_quantity: true,
              track_inventory: true,
            },
          },
        },
      });

      if (!cartItem) {
        throw new AppError(404, 'Cart item not found');
      }

      if (
        cartItem.product &&
        cartItem.product.stock_quantity &&
        cartItem.product.stock_quantity < quantity
      ) {
        throw new AppError(400, 'Insufficient stock');
      }

      await prisma.cartItem.update({
        where: { id },
        data: {
          quantity,
          updated_at: new Date(),
        },
      });

      logger.info('Cart item updated successfully', { itemId: id, quantity });

      res.json({
        success: true,
        message: 'Cart item updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const cartItem = await prisma.cartItem.findUnique({
        where: { id },
      });

      if (!cartItem) {
        throw new AppError(404, 'Cart item not found');
      }

      await prisma.cartItem.delete({
        where: { id },
      });

      logger.info('Cart item removed successfully', { itemId: id });

      res.json({
        success: true,
        message: 'Cart item removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear cart
   */
  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const sessionId = req.session?.id;

      const where: any = {};
      if (userId) {
        where.user_id = userId;
      } else if (sessionId) {
        where.session_id = sessionId;
      } else {
        throw new AppError(400, 'User session required');
      }

      await prisma.cartItem.deleteMany({
        where,
      });

      logger.info('Cart cleared successfully', { userId, sessionId });

      res.json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation middleware
export const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product_id').isUUID().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shipping_address').isObject().withMessage('Shipping address is required'),
  body('billing_address').isObject().withMessage('Billing address is required'),
  body('payment_method').notEmpty().withMessage('Payment method is required'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'UZS'])
    .withMessage('Valid currency is required'),
];

export const orderStatusValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Valid status is required'),
  body('payment_status')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Valid payment status is required'),
];

export const cartItemValidation = [
  body('product_id').isUUID().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const cartUpdateValidation = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const orderQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Valid status is required'),
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
];
