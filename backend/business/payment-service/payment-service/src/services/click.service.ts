import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { PaymentGatewayError, PaymentError } from '../utils/errors';
import { CreatePaymentData } from './payment.service';

const prisma = new PrismaClient();

export interface ClickPaymentData {
  orderId: string;
  amount: number;
  currency: string;
  userId: string;
  returnUrl?: string;
}

export interface ClickPrepareRequest {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id: string;
  merchant_trans_id: string;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

export interface ClickCompleteRequest {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id: string;
  merchant_trans_id: string;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

export class ClickService {
  private readonly serviceId: string;
  private readonly secretKey: string;
  private readonly userId: string;
  private readonly baseUrl: string;

  constructor() {
    this.serviceId = process.env.CLICK_SERVICE_ID || '';
    this.secretKey = process.env.CLICK_SECRET_KEY || '';
    this.userId = process.env.CLICK_USER_ID || '';
    this.baseUrl = process.env.CLICK_BASE_URL || 'https://api.click.uz/v2';
  }

  // Create payment
  async createPayment(data: ClickPaymentData) {
    try {
      logger.info('Creating Click payment', { orderId: data.orderId, amount: data.amount });

      // Create payment record in database
      const payment = await prisma.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          method: 'CLICK',
          status: 'PENDING',
          userId: data.userId,
          gatewayTransactionId: null,
          metadata: {
            paymentType: 'CLICK_PAYMENT',
            returnUrl: data.returnUrl,
            createdAt: new Date().toISOString(),
          },
        },
      });

      // Generate payment URL
      const paymentUrl = this.generatePaymentUrl(payment.id, data.amount);

      logger.info('Click payment created successfully', {
        paymentId: payment.id,
        paymentUrl,
      });

      return {
        id: payment.id,
        paymentUrl,
        amount: data.amount,
        currency: data.currency,
        status: 'PENDING',
        method: 'CLICK',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };
    } catch (error) {
      logger.error('Error creating Click payment:', error);
      throw new PaymentGatewayError('Failed to create Click payment');
    }
  }

  // Generate payment URL
  private generatePaymentUrl(paymentId: string, amount: number): string {
    const params = new URLSearchParams({
      service_id: this.serviceId,
      merchant_id: this.userId,
      amount: amount.toString(),
      transaction_param: paymentId,
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    return `https://my.click.uz/services/pay?${params.toString()}`;
  }

  // Handle prepare request from Click
  async handlePrepare(data: ClickPrepareRequest) {
    try {
      logger.info('Handling Click prepare request', {
        clickTransId: data.click_trans_id,
        merchantTransId: data.merchant_trans_id,
      });

      // Verify signature
      if (!this.verifySignature(data)) {
        logger.error('Invalid signature in Click prepare request');
        return this.createErrorResponse(-1, 'Invalid signature');
      }

      // Find payment
      const payment = await prisma.payment.findUnique({
        where: { id: data.merchant_trans_id },
      });

      if (!payment) {
        logger.error('Payment not found for Click prepare', {
          merchantTransId: data.merchant_trans_id,
        });
        return this.createErrorResponse(-5, 'Payment not found');
      }

      // Check amount
      if (payment.amount !== data.amount) {
        logger.error('Amount mismatch in Click prepare', {
          expectedAmount: payment.amount,
          receivedAmount: data.amount,
        });
        return this.createErrorResponse(-2, 'Amount mismatch');
      }

      // Check if payment is already processed
      if (payment.status !== 'PENDING') {
        logger.error('Payment already processed in Click prepare', {
          paymentId: payment.id,
          status: payment.status,
        });
        return this.createErrorResponse(-4, 'Payment already processed');
      }

      // Update payment with Click transaction ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayTransactionId: data.click_trans_id,
          status: 'PROCESSING',
          metadata: {
            ...payment.metadata,
            clickTransId: data.click_trans_id,
            prepareTime: new Date().toISOString(),
          },
        },
      });

      logger.info('Click prepare request handled successfully', {
        paymentId: payment.id,
        clickTransId: data.click_trans_id,
      });

      return this.createSuccessResponse(data.click_trans_id, data.merchant_trans_id);
    } catch (error) {
      logger.error('Error handling Click prepare request:', error);
      return this.createErrorResponse(-9, 'Internal server error');
    }
  }

  // Handle complete request from Click
  async handleComplete(data: ClickCompleteRequest) {
    try {
      logger.info('Handling Click complete request', {
        clickTransId: data.click_trans_id,
        merchantTransId: data.merchant_trans_id,
      });

      // Verify signature
      if (!this.verifySignature(data)) {
        logger.error('Invalid signature in Click complete request');
        return this.createErrorResponse(-1, 'Invalid signature');
      }

      // Find payment
      const payment = await prisma.payment.findUnique({
        where: { id: data.merchant_trans_id },
      });

      if (!payment) {
        logger.error('Payment not found for Click complete', {
          merchantTransId: data.merchant_trans_id,
        });
        return this.createErrorResponse(-5, 'Payment not found');
      }

      // Check if payment is in correct state
      if (payment.status !== 'PROCESSING') {
        logger.error('Payment not in processing state for Click complete', {
          paymentId: payment.id,
          status: payment.status,
        });
        return this.createErrorResponse(-4, 'Payment not in processing state');
      }

      // Check if this is the same transaction
      if (payment.gatewayTransactionId !== data.click_trans_id) {
        logger.error('Transaction ID mismatch in Click complete', {
          expectedTransId: payment.gatewayTransactionId,
          receivedTransId: data.click_trans_id,
        });
        return this.createErrorResponse(-6, 'Transaction ID mismatch');
      }

      // Complete the payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          metadata: {
            ...payment.metadata,
            completeTime: new Date().toISOString(),
            clickPaydocId: data.click_paydoc_id,
          },
        },
      });

      // Log webhook for audit
      await prisma.webhook.create({
        data: {
          paymentId: payment.id,
          provider: 'CLICK',
          event: 'PAYMENT_COMPLETED',
          data: data,
          processedAt: new Date(),
        },
      });

      logger.info('Click complete request handled successfully', {
        paymentId: payment.id,
        clickTransId: data.click_trans_id,
      });

      return this.createSuccessResponse(data.click_trans_id, data.merchant_trans_id);
    } catch (error) {
      logger.error('Error handling Click complete request:', error);
      return this.createErrorResponse(-9, 'Internal server error');
    }
  }

  // Verify signature
  private verifySignature(data: any): boolean {
    try {
      const signString = `${data.click_trans_id}${this.serviceId}${this.secretKey}${data.merchant_trans_id}${data.amount}${data.action}${data.sign_time}`;
      const expectedSignature = crypto.createHash('md5').update(signString).digest('hex');

      return expectedSignature === data.sign_string;
    } catch (error) {
      logger.error('Error verifying Click signature:', error);
      return false;
    }
  }

  // Create success response
  private createSuccessResponse(clickTransId: string, merchantTransId: string) {
    return {
      click_trans_id: clickTransId,
      merchant_trans_id: merchantTransId,
      merchant_prepare_id: merchantTransId,
      error: 0,
      error_note: 'Success',
    };
  }

  // Create error response
  private createErrorResponse(errorCode: number, errorNote: string) {
    return {
      error: errorCode,
      error_note: errorNote,
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
      logger.error('Error checking Click payment status:', error);
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

      logger.info('Click payment cancelled successfully', { paymentId });
      return { success: true };
    } catch (error) {
      logger.error('Error cancelling Click payment:', error);
      throw error;
    }
  }
}
