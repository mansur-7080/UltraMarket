import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '@ultramarket/shared/logging/logger';
import { prisma } from '@ultramarket/shared/database';
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '@ultramarket/shared/errors';
import { PaymentStatus, OrderStatus } from '@ultramarket/shared/types';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class PaymentController {
  // Create payment intent
  static async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid input data', errors.array());
      }

      const { orderId, paymentMethod } = req.body;

      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      // Get order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Check if user owns this order
      if (order.userId !== req.user.id) {
        throw new ForbiddenError('You can only pay for your own orders');
      }

      if (order.paymentStatus === PaymentStatus.PAID) {
        throw new BadRequestError('Order is already paid');
      }

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: order.currency.toLowerCase(),
        metadata: {
          orderId: order.id,
          userId: req.user.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          method: paymentMethod,
          status: PaymentStatus.PENDING,
          transactionId: paymentIntent.id,
          gateway: 'stripe',
          gatewayResponse: paymentIntent,
        },
      });

      logger.info('Payment intent created successfully', {
        orderId: order.id,
        paymentId: payment.id,
        amount: order.total,
        operation: 'create_payment_intent',
      });

      res.status(200).json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentId: payment.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Process payment
  static async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid input data', errors.array());
      }

      const { paymentId, paymentMethodId } = req.body;

      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      // Get payment
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Check if user owns this payment
      if (payment.order.userId !== req.user.id) {
        throw new ForbiddenError('You can only process your own payments');
      }

      if (payment.status === PaymentStatus.PAID) {
        throw new BadRequestError('Payment is already processed');
      }

      try {
        // Confirm payment with Stripe
        const paymentIntent = await stripe.paymentIntents.confirm(payment.transactionId!, {
          payment_method: paymentMethodId,
        });

        if (paymentIntent.status === 'succeeded') {
          // Update payment status
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: paymentId },
              data: {
                status: PaymentStatus.PAID,
                gatewayResponse: paymentIntent,
              },
            });

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: PaymentStatus.PAID,
                status: OrderStatus.CONFIRMED,
              },
            });
          });

          logger.info('Payment processed successfully', {
            paymentId: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
            operation: 'process_payment',
          });

          res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            data: { payment: paymentIntent },
          });
        } else {
          throw new BadRequestError('Payment failed');
        }
      } catch (stripeError) {
        // Update payment status to failed
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: stripeError,
          },
        });

        throw new BadRequestError('Payment processing failed');
      }
    } catch (error) {
      next(error);
    }
  }

  // Get payment by ID
  static async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Check if user can access this payment
      if (
        req.user.role !== 'ADMIN' &&
        req.user.role !== 'SUPER_ADMIN' &&
        payment.order.userId !== req.user.id
      ) {
        throw new ForbiddenError('You can only view your own payments');
      }

      logger.info('Payment retrieved successfully', {
        paymentId: id,
        userId: req.user.id,
        operation: 'get_payment',
      });

      res.status(200).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user payments
  static async getUserPayments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const { page = 1, limit = 20, status } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        order: {
          userId: req.user.id,
        },
      };

      if (status) {
        where.status = status;
      }

      // Get payments with count
      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.payment.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      logger.info('User payments retrieved successfully', {
        userId: req.user.id,
        count: payments.length,
        total,
        operation: 'get_user_payments',
      });

      res.status(200).json({
        success: true,
        data: {
          payments,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Refund payment
  static async refundPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError('Invalid input data', errors.array());
      }

      const { id } = req.params;
      const { amount, reason } = req.body;

      // Check if user has permission
      if (
        !req.user ||
        ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role as UserRole)
      ) {
        throw new ForbiddenError('Insufficient permissions to refund payment');
      }

      // Get payment
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          order: true,
        },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      if (payment.status !== PaymentStatus.PAID) {
        throw new BadRequestError('Payment is not paid');
      }

      if (payment.refundedAt) {
        throw new BadRequestError('Payment is already refunded');
      }

      const refundAmount = amount || payment.amount;

      try {
        // Process refund with Stripe
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId!,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: reason || 'requested_by_customer',
        });

        // Update payment record
        await prisma.payment.update({
          where: { id },
          data: {
            refundedAt: new Date(),
            refundAmount: refundAmount,
            refundReason: reason,
            gatewayResponse: {
              ...payment.gatewayResponse,
              refund,
            },
          },
        });

        // Update order status if full refund
        if (refundAmount >= payment.amount) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: {
              status: OrderStatus.REFUNDED,
              paymentStatus: PaymentStatus.REFUNDED,
            },
          });
        } else {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: PaymentStatus.PARTIALLY_REFUNDED,
            },
          });
        }

        logger.info('Payment refunded successfully', {
          paymentId: id,
          refundedBy: req.user.id,
          refundAmount,
          reason,
          operation: 'refund_payment',
        });

        res.status(200).json({
          success: true,
          message: 'Payment refunded successfully',
          data: { refund },
        });
      } catch (stripeError) {
        throw new BadRequestError('Refund processing failed');
      }
    } catch (error) {
      next(error);
    }
  }

  // Webhook handler for Stripe events
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        logger.error('Webhook signature verification failed', {
          error: err,
          operation: 'webhook_verification',
        });
        return res.status(400).send(`Webhook Error: ${err}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await PaymentController.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await PaymentController.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.refunded':
          await PaymentController.handleRefundSucceeded(event.data.object as Stripe.Charge);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  }

  // Handle successful payment
  private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { transactionId: paymentIntent.id },
        include: { order: true },
      });

      if (payment) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PAID,
              gatewayResponse: paymentIntent,
            },
          });

          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.CONFIRMED,
            },
          });
        });

        logger.info('Payment succeeded via webhook', {
          paymentId: payment.id,
          orderId: payment.orderId,
          operation: 'payment_succeeded_webhook',
        });
      }
    } catch (error) {
      logger.error('Error handling payment succeeded webhook', {
        error,
        paymentIntentId: paymentIntent.id,
        operation: 'payment_succeeded_webhook',
      });
    }
  }

  // Handle failed payment
  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { transactionId: paymentIntent.id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: paymentIntent,
          },
        });

        logger.info('Payment failed via webhook', {
          paymentId: payment.id,
          operation: 'payment_failed_webhook',
        });
      }
    } catch (error) {
      logger.error('Error handling payment failed webhook', {
        error,
        paymentIntentId: paymentIntent.id,
        operation: 'payment_failed_webhook',
      });
    }
  }

  // Handle successful refund
  private static async handleRefundSucceeded(charge: Stripe.Charge) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { transactionId: charge.payment_intent as string },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            refundedAt: new Date(),
            refundAmount: charge.amount_refunded / 100, // Convert from cents
            gatewayResponse: {
              ...payment.gatewayResponse,
              refund: charge,
            },
          },
        });

        logger.info('Refund succeeded via webhook', {
          paymentId: payment.id,
          operation: 'refund_succeeded_webhook',
        });
      }
    } catch (error) {
      logger.error('Error handling refund succeeded webhook', {
        error,
        chargeId: charge.id,
        operation: 'refund_succeeded_webhook',
      });
    }
  }
}

// Validation middleware
export const createPaymentIntentValidation = [
  body('orderId').isUUID(),
  body('paymentMethod').isString(),
];

export const processPaymentValidation = [
  body('paymentId').isUUID(),
  body('paymentMethodId').isString(),
];

export const refundPaymentValidation = [
  body('amount').optional().isFloat({ min: 0 }),
  body('reason').optional().isString(),
];
