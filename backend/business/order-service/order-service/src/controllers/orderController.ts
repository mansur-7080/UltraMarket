import { Request, Response } from 'express';
import { logger } from '@ultramarket/shared';
import { prisma } from '../config/database';
import { OrderService } from '../services/orderService';
import { PaymentService } from '../services/paymentService';
import { NotificationService } from '../services/notificationService';
import { OrderStatus, PaymentStatus } from '../types/order.types';

const orderService = new OrderService();
const paymentService = new PaymentService();
const notificationService = new NotificationService();

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as { userId: string };
    const orderData = req.body;

    const order = await orderService.createOrder({
      ...orderData,
      userId,
    });

    // Send notification
    await notificationService.sendOrderConfirmation(order);

    logger.info(`Order created successfully: ${order.id}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
    });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user as { userId: string; role: string };

    if (!id || !userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const order = await orderService.getOrderById(id as string, userId as string, role as string);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
    });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const { role } = req.user as { role: string };

    const orders = await orderService.getAllOrders({
      page: Number(page),
      limit: Number(limit),
      status: status as OrderStatus,
      userId: userId as string,
      role,
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const { userId } = req.user as { userId: string };

    if (!id || !status || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const order = await orderService.updateOrderStatus(
      id as string,
      status,
      notes || '',
      userId as string
    );

    // Send notification
    await notificationService.sendOrderStatusUpdate(order);

    logger.info(`Order status updated: ${id} -> ${status}`);

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

export const cancelOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { userId } = req.user as { userId: string };

    if (!id || !reason || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const order = await orderService.cancelOrder(id as string, reason as string, userId as string);

    // Send notification
    await notificationService.sendOrderCancellation(order);

    logger.info(`Order cancelled: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
    });
  }
};

export const getOrdersByUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const orders = await orderService.getOrdersByUser(userId as string, {
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error('Error fetching user orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders',
    });
  }
};

export const getOrderHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const history = await orderService.getOrderHistory(userId as string, {
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Error fetching order history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order history',
    });
  }
};

export const processOrderPayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentDetails } = req.body;
    const { userId } = req.user as { userId: string };

    if (!id || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const payment = await paymentService.processPayment(
      id as string,
      paymentMethod,
      paymentDetails
    );

    // Update order status
    await orderService.updateOrderStatus(
      id as string,
      OrderStatus.PAID,
      'Payment processed successfully',
      userId as string
    );

    logger.info(`Payment processed for order: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment,
    });
  } catch (error) {
    logger.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment',
    });
  }
};

export const refundOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body;
    const { userId } = req.user as { userId: string };

    if (!id || !amount || !reason || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      });
    }

    const refund = await paymentService.processRefund(
      id as string,
      amount,
      reason as string,
      userId as string
    );

    // Update order status
    await orderService.updateOrderStatus(
      id as string,
      OrderStatus.REFUNDED,
      `Refund processed: ${reason}`,
      userId as string
    );

    logger.info(`Refund processed for order: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: refund,
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process refund',
    });
  }
};

export const exportOrders = async (req: Request, res: Response) => {
  try {
    const { format = 'csv', dateFrom, dateTo } = req.query;

    const exportData = await orderService.exportOrders({
      format: format as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    res.status(200).send(exportData);
  } catch (error) {
    logger.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export orders',
    });
  }
};
