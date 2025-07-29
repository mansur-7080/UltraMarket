import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { PaymentGatewayError, PaymentError } from '../utils/errors';
import { CreatePaymentData } from './payment.service';

const prisma = new PrismaClient();

export interface PaymePaymentData {
  orderId: string;
  amount: number;
  currency: string;
  userId: string;
  returnUrl?: string;
}

export interface PaymeRequest {
  method: string;
  params: any;
  id: number;
}

export interface PaymeResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number;
}

export class PaymeService {
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.merchantId = process.env.PAYME_MERCHANT_ID || '';
    this.secretKey = process.env.PAYME_SECRET_KEY || '';
    this.baseUrl = process.env.PAYME_BASE_URL || 'https://checkout.paycom.uz/api';
  }

  // Create payment
  async createPayment(data: PaymePaymentData) {
    try {
      logger.info('Creating Payme payment', { orderId: data.orderId, amount: data.amount });

      // Create payment record in database
      const payment = await prisma.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: 'PAYME',
          status: 'PENDING',
          userId: data.userId,
          gatewayTransactionId: null,
          metadata: {
            paymentType: 'PAYME_PAYMENT',
            returnUrl: data.returnUrl,
            createdAt: new Date().toISOString(),
          },
        },
      });

      // Generate payment URL
      const paymentUrl = this.generatePaymentUrl(payment.id, data.amount);

      logger.info('Payme payment created successfully', {
        paymentId: payment.id,
        paymentUrl,
      });

      return {
        id: payment.id,
        paymentUrl,
        amount: data.amount,
        currency: data.currency,
        status: 'PENDING',
        method: 'PAYME',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };
    } catch (error) {
      logger.error('Error creating Payme payment:', error);
      throw new PaymentGatewayError('Failed to create Payme payment');
    }
  }

  // Generate payment URL
  private generatePaymentUrl(paymentId: string, amount: number): string {
    const params = {
      m: this.merchantId,
      ac: { order_id: paymentId },
      a: amount * 100, // Payme uses tiyin (1 som = 100 tiyin)
      c: `${process.env.FRONTEND_URL}/payment/success`,
      cr: `${process.env.FRONTEND_URL}/payment/cancel`,
    };

    const encodedParams = btoa(JSON.stringify(params));
    return `https://checkout.paycom.uz/${encodedParams}`;
  }

  // Handle Payme webhook
  async handleWebhook(request: PaymeRequest): Promise<PaymeResponse> {
    try {
      logger.info('Handling Payme webhook', { method: request.method, id: request.id });

      switch (request.method) {
        case 'CheckPerformTransaction':
          return await this.checkPerformTransaction(request);
        case 'CreateTransaction':
          return await this.createTransaction(request);
        case 'PerformTransaction':
          return await this.performTransaction(request);
        case 'CancelTransaction':
          return await this.cancelTransaction(request);
        case 'CheckTransaction':
          return await this.checkTransaction(request);
        case 'GetStatement':
          return await this.getStatement(request);
        default:
          logger.error('Unknown Payme method', { method: request.method });
          return this.createErrorResponse(request.id, -32601, 'Method not found');
      }
    } catch (error) {
      logger.error('Error handling Payme webhook:', error);
      return this.createErrorResponse(request.id, -32400, 'Internal server error');
    }
  }

  // Check if transaction can be performed
  private async checkPerformTransaction(request: PaymeRequest): Promise<PaymeResponse> {
    try {
      const { account } = request.params;
      const orderId = account.order_id;

      const payment = await prisma.payment.findUnique({
        where: { id: orderId },
      });

      if (!payment) {
        return this.createErrorResponse(request.id, -31050, 'Order not found');
      }

      if (payment.status !== 'PENDING') {
        return this.createErrorResponse(request.id, -31051, 'Order already processed');
      }

      if (payment.amount * 100 !== request.params.amount) {
        return this.createErrorResponse(request.id, -31001, 'Amount mismatch');
      }

      return {
        result: {
          allow: true,
        },
        id: request.id,
      };
    } catch (error) {
      logger.error('Error in checkPerformTransaction:', error);
      return this.createErrorResponse(request.id, -32400, 'Internal server error');
    }
  }

  // Create transaction
  private async createTransaction(request: PaymeRequest): Promise<PaymeResponse> {
    try {
      const { id: transactionId, account, amount } = request.params;
      const orderId = account.order_id;

      // Check if transaction already exists
      const existingTransaction = await prisma.payment.findFirst({
        where: {
          id: orderId,
          gatewayTransactionId: transactionId,
        },
      });

      if (existingTransaction) {
        return {
          result: {
            create_time: existingTransaction.createdAt.getTime(),
            transaction: transactionId,
            state: this.getPaymeTransactionState(existingTransaction.status),
          },
          id: request.id,
        };
      }

      const payment = await prisma.payment.findUnique({
        where: { id: orderId },
      });

      if (!payment) {
        return this.createErrorResponse(request.id, -31050, 'Order not found');
      }

      if (payment.status !== 'PENDING') {
        return this.createErrorResponse(request.id, -31051, 'Order already processed');
      }

      if (payment.amount * 100 !== amount) {
        return this.createErrorResponse(request.id, -31001, 'Amount mismatch');
      }

      // Update payment with transaction ID
      const updatedPayment = await prisma.payment.update({
        where: { id: orderId },
        data: {
          gatewayTransactionId: transactionId,
          status: 'PROCESSING',
          metadata: {
            ...payment.metadata,
            paymeTransactionId: transactionId,
            createTime: new Date().toISOString(),
          },
        },
      });

      return {
        result: {
          create_time: updatedPayment.createdAt.getTime(),
          transaction: transactionId,
          state: 1, // Created
        },
        id: request.id,
      };
    } catch (error) {
      logger.error('Error in createTransaction:', error);
      return this.createErrorResponse(request.id, -32400, 'Internal server error');
    }
  }

  // Perform transaction
  private async performTransaction(request: PaymeRequest): Promise<PaymeResponse> {
    try {
      const { id: transactionId } = request.params;

      const payment = await prisma.payment.findFirst({
        where: { gatewayTransactionId: transactionId },
      });

      if (!payment) {
        return this.createErrorResponse(request.id, -31003, 'Transaction not found');
      }

      if (payment.status === 'COMPLETED') {
        return {
          result: {
            perform_time: payment.completedAt?.getTime() || Date.now(),
            transaction: transactionId,
            state: 2, // Completed
          },
          id: request.id,
        };
      }

      if (payment.status !== 'PROCESSING') {
        return this.createErrorResponse(request.id, -31008, 'Transaction cannot be performed');
      }

      // Complete the payment
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          metadata: {
            ...payment.metadata,
            performTime: new Date().toISOString(),
          },
        },
      });

      // Log webhook for audit
      await prisma.webhook.create({
        data: {
          paymentId: payment.id,
          provider: 'PAYME',
          event: 'PAYMENT_COMPLETED',
          data: request.params,
          processedAt: new Date(),
        },
      });

      return {
        result: {
          perform_time: updatedPayment.completedAt?.getTime() || Date.now(),
          transaction: transactionId,
          state: 2, // Completed
        },
        id: request.id,
      };
    } catch (error) {
      logger.error('Error in performTransaction:', error);
      return this.createErrorResponse(request.id, -32400, 'Internal server error');
    }
  }

  // Cancel transaction
  private async cancelTransaction(request: PaymeRequest): Promise<PaymeResponse> {
    try {
      const { id: transactionId, reason } = request.params;

      const payment = await prisma.payment.findFirst({
        where: { gatewayTransactionId: transactionId },
      });

      if (!payment) {
        return this.createErrorResponse(request.id, -31003, 'Transaction not found');
      }

      if (payment.status === 'CANCELLED') {
        return {
          result: {
            cancel_time: payment.cancelledAt?.getTime() || Date.now(),
            transaction: transactionId,
            state: -1, // Cancelled
          },
          id: request.id,
        };
      }

      if (payment.status === 'COMPLETED') {
        return this.createErrorResponse(request.id, -31007, 'Transaction already completed');
      }

      // Cancel the payment
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          metadata: {
            ...payment.metadata,
            cancellationReason: `Payme cancellation: ${reason}`,
            cancelTime: new Date().toISOString(),
          },
        },
      });

      return {
        result: {
          cancel_time: updatedPayment.cancelledAt?.getTime() || Date.now(),
          transaction: transactionId,
          state: -1, // Cancelled
        },
        id: request.id,
      };
    } catch (error) {
      logger.error('Error in cancelTransaction:', error);
      return this.createErrorResponse(request.id, -32400, 'Internal server error');
    }
  }

  // Check transaction
  private async checkTransaction(request: PaymeRequest): Promise<PaymeResponse> {
    try {
      const { id: transactionId } = request.params;

      const payment = await prisma.payment.findFirst({
        where: { gatewayTransactionId: transactionId },
      });

      if (!payment) {
        return this.createErrorResponse(request.id, -31003, 'Transaction not found');
      }

      return {
        result: {
          create_time: payment.createdAt.getTime(),
          perform_time: payment.completedAt?.getTime() || 0,
          cancel_time: payment.cancelledAt?.getTime() || 0,
          transaction: transactionId,
          state: this.getPaymeTransactionState(payment.status),
          reason: payment.metadata?.cancellationReason || null,
        },
        id: request.id,
      };
    } catch (error) {
      logger.error('Error in checkTransaction:', error);
      return this.createErrorResponse(request.id, -32400, 'Internal server error');
    }
  }

  // Get statement
  private async getStatement(request: PaymeRequest): Promise<PaymeResponse> {
    try {
      const { from, to } = request.params;

      const payments = await prisma.payment.findMany({
        where: {
          method: 'PAYME',
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
        include: {
          webhooks: true,
        },
      });

      const transactions = payments.map((payment) => ({
        id: payment.gatewayTransactionId,
        time: payment.createdAt.getTime(),
        amount: payment.amount * 100,
        account: {
          order_id: payment.id,
        },
        create_time: payment.createdAt.getTime(),
        perform_time: payment.completedAt?.getTime() || 0,
        cancel_time: payment.cancelledAt?.getTime() || 0,
        transaction: payment.gatewayTransactionId,
        state: this.getPaymeTransactionState(payment.status),
        reason: payment.metadata?.cancellationReason || null,
      }));

      return {
        result: {
          transactions,
        },
        id: request.id,
      };
    } catch (error) {
      logger.error('Error in getStatement:', error);
      return this.createErrorResponse(request.id, -32400, 'Internal server error');
    }
  }

  // Get Payme transaction state
  private getPaymeTransactionState(status: string): number {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'PROCESSING':
        return 1;
      case 'COMPLETED':
        return 2;
      case 'CANCELLED':
        return -1;
      case 'FAILED':
        return -2;
      default:
        return 0;
    }
  }

  // Create error response
  private createErrorResponse(id: number, code: number, message: string): PaymeResponse {
    return {
      error: {
        code,
        message,
      },
      id,
    };
  }

  // Check payment status
  async checkPaymentStatus(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new PaymentError('Payment not found');
      }

      return {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        gatewayTransactionId: payment.gatewayTransactionId,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
      };
    } catch (error) {
      logger.error('Error checking Payme payment status:', error);
      throw error;
    }
  }

  // Cancel payment
  async cancelPayment(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new PaymentError('Payment not found');
      }

      if (payment.status !== 'PENDING' && payment.status !== 'PROCESSING') {
        throw new PaymentError('Payment cannot be cancelled');
      }

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          metadata: {
            ...payment.metadata,
            cancellationReason: 'User cancelled',
            cancelledAt: new Date().toISOString(),
          },
        },
      });

      logger.info('Payme payment cancelled successfully', { paymentId });
      return { success: true };
    } catch (error) {
      logger.error('Error cancelling Payme payment:', error);
      throw error;
    }
  }
}
