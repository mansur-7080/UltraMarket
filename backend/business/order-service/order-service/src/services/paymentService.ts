import { prisma } from '../config/prisma-shim';
import { logger } from '@ultramarket/shared';
import { PaymentStatus, PaymentMethod, Payment } from '../types/order.types';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  currency?: string;
  gateway?: string;
  metadata?: Record<string, any>;
}

export interface RefundDetails {
  amount: number;
  reason: string;
  processedBy: string;
}

export class PaymentService {
  async processPayment(
    orderId: string,
    method: PaymentMethod,
    details: Record<string, any>
  ): Promise<Payment> {
    try {
      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus === 'COMPLETED') {
        throw new Error('Payment already completed');
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          orderId,
          amount: order.total,
          currency: 'USD',
          method,
          status: PaymentStatus.PROCESSING,
          gateway: details.gateway || 'stripe',
          metadata: details,
        },
      });

      // Simulate payment processing
      await this.simulatePaymentProcessing(payment.id);

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      });

      // Update order payment status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });

      logger.info(`Payment processed successfully: ${payment.id} for order: ${orderId}`);
      return updatedPayment;
    } catch (error) {
      logger.error('Payment processing failed:', error);
      throw error;
    }
  }

  async processRefund(
    orderId: string,
    amount: number,
    reason: string,
    processedBy: string
  ): Promise<Payment> {
    try {
      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus !== 'COMPLETED') {
        throw new Error('Order payment not completed');
      }

      // Create refund payment record
      const refund = await prisma.payment.create({
        data: {
          orderId,
          amount: -amount, // Negative amount for refund
          currency: 'USD',
          method: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.PROCESSING,
          gateway: 'stripe',
          metadata: {
            type: 'refund',
            reason,
            processedBy,
          },
        },
      });

      // Simulate refund processing
      await this.simulateRefundProcessing(refund.id);

      // Update refund status
      const updatedRefund = await prisma.payment.update({
        where: { id: refund.id },
        data: {
          status: PaymentStatus.COMPLETED,
          transactionId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      });

      // Update order payment status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });

      logger.info(`Refund processed successfully: ${refund.id} for order: ${orderId}`);
      return updatedRefund;
    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw error;
    }
  }

  async getPaymentHistory(orderId: string): Promise<Payment[]> {
    return await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    return await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  private async simulatePaymentProcessing(paymentId: string): Promise<void> {
    // Simulate payment gateway processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('Payment gateway error');
    }
  }

  private async simulateRefundProcessing(refundId: string): Promise<void> {
    // Simulate refund processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate 98% success rate for refunds
    if (Math.random() < 0.02) {
      throw new Error('Refund processing error');
    }
  }
}
