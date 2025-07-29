import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { ClickService } from '../services/click.service';
import { PaymeService } from '../services/payme.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class PaymentController {
  private paymentService: PaymentService;
  private clickService: ClickService;
  private paymeService: PaymeService;

  constructor() {
    this.paymentService = new PaymentService();
    this.clickService = new ClickService();
    this.paymeService = new PaymeService();
  }

  // Create payment intent
  createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, amount, currency, paymentMethod, returnUrl } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User authentication required', 401);
      }

      logger.info('Creating payment', {
        orderId,
        amount,
        currency,
        paymentMethod,
        userId,
      });

      let paymentResult;

      switch (paymentMethod) {
        case 'CLICK':
          paymentResult = await this.clickService.createPayment({
            orderId,
            amount,
            currency,
            userId,
            returnUrl,
          });
          break;
        case 'PAYME':
          paymentResult = await this.paymeService.createPayment({
            orderId,
            amount,
            currency,
            userId,
            returnUrl,
          });
          break;
        case 'CASH':
          paymentResult = await this.paymentService.createCashPayment({
            orderId,
            amount,
            currency,
            userId,
          });
          break;
        default:
          throw new AppError('Unsupported payment method', 400);
      }

      res.status(201).json({
        success: true,
        data: paymentResult,
      });
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  };

  // Get payment by ID
  getPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const payment = await this.paymentService.getPaymentById(id, userId);

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error getting payment:', error);
      throw error;
    }
  };

  // Get payments by order ID
  getPaymentsByOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const payments = await this.paymentService.getPaymentsByOrderId(orderId, userId);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      logger.error('Error getting payments by order:', error);
      throw error;
    }
  };

  // Get user payments
  getUserPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status, method } = req.query;

      if (!userId) {
        throw new AppError('User authentication required', 401);
      }

      const payments = await this.paymentService.getUserPayments(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        method: method as string,
      });

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      logger.error('Error getting user payments:', error);
      throw error;
    }
  };

  // Cancel payment
  cancelPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      if (!userId) {
        throw new AppError('User authentication required', 401);
      }

      const payment = await this.paymentService.cancelPayment(id, userId, reason);

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error canceling payment:', error);
      throw error;
    }
  };

  // Refund payment
  refundPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User authentication required', 401);
      }

      const refund = await this.paymentService.refundPayment(id, {
        amount,
        reason,
        refundedBy: userId,
      });

      res.json({
        success: true,
        data: refund,
      });
    } catch (error) {
      logger.error('Error refunding payment:', error);
      throw error;
    }
  };

  // Get payment methods
  getPaymentMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const methods = await this.paymentService.getAvailablePaymentMethods();

      res.json({
        success: true,
        data: methods,
      });
    } catch (error) {
      logger.error('Error getting payment methods:', error);
      throw error;
    }
  };

  // Verify payment status
  verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const payment = await this.paymentService.verifyPaymentStatus(id, userId);

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error verifying payment:', error);
      throw error;
    }
  };

  // Get payment statistics (Admin only)
  getPaymentStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, groupBy } = req.query;

      const stats = await this.paymentService.getPaymentStatistics({
        startDate: startDate as string,
        endDate: endDate as string,
        groupBy: groupBy as string,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting payment statistics:', error);
      throw error;
    }
  };
}
