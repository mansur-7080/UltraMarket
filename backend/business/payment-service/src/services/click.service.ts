import crypto from 'crypto';
import axios from 'axios';
import { logger } from '@ultramarket/shared';

export interface ClickPaymentRequest {
  amount: number;
  orderId: string;
  userId: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  merchantTransId: string;
}

export interface ClickPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface ClickWebhookPayload {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id: string;
  merchant_trans_id: string;
  merchant_prepare_id: string;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

export class ClickService {
  private readonly merchantId: string;
  private readonly serviceId: string;
  private readonly secretKey: string;
  private readonly userId: string;
  private readonly baseUrl: string;

  constructor() {
    this.merchantId = process.env.CLICK_MERCHANT_ID || '';
    this.serviceId = process.env.CLICK_SERVICE_ID || '';
    this.secretKey = process.env.CLICK_SECRET_KEY || '';
    this.userId = process.env.CLICK_USER_ID || '';
    this.baseUrl = process.env.CLICK_ENDPOINT || 'https://api.click.uz/v2';

    if (!this.merchantId || !this.serviceId || !this.secretKey || !this.userId) {
      throw new Error('Click payment gateway configuration is missing');
    }
  }

  /**
   * Create payment URL for Click
   */
  async createPayment(request: ClickPaymentRequest): Promise<ClickPaymentResponse> {
    try {
      logger.info('Creating Click payment', {
        orderId: request.orderId,
        amount: request.amount,
        userId: request.userId,
      });

      // Create payment URL
      const paymentUrl = this.generatePaymentUrl(request);

      return {
        success: true,
        paymentUrl,
        transactionId: request.merchantTransId,
      };
    } catch (error) {
      logger.error('Click payment creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: request.orderId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed',
      };
    }
  }

  /**
   * Generate Click payment URL
   */
  private generatePaymentUrl(request: ClickPaymentRequest): string {
    const params = new URLSearchParams({
      service_id: this.serviceId,
      merchant_id: this.merchantId,
      amount: request.amount.toString(),
      transaction_param: request.merchantTransId,
      return_url: request.returnUrl,
      cancel_url: request.cancelUrl,
    });

    return `${this.baseUrl}/services/pay?${params.toString()}`;
  }

  /**
   * Handle Click webhook (PREPARE action)
   */
  async handlePrepare(payload: ClickWebhookPayload): Promise<{
    click_trans_id: string;
    merchant_trans_id: string;
    merchant_prepare_id: string;
    error: number;
    error_note: string;
  }> {
    try {
      logger.info('Handling Click PREPARE webhook', {
        clickTransId: payload.click_trans_id,
        merchantTransId: payload.merchant_trans_id,
        amount: payload.amount,
      });

      // Verify signature
      if (!this.verifySignature(payload)) {
        logger.error('Click webhook signature verification failed', {
          clickTransId: payload.click_trans_id,
        });
        return {
          click_trans_id: payload.click_trans_id,
          merchant_trans_id: payload.merchant_trans_id,
          merchant_prepare_id: '',
          error: -1,
          error_note: 'Invalid signature',
        };
      }

      // Verify order exists and amount matches
      const orderValid = await this.verifyOrder(payload.merchant_trans_id, payload.amount);
      if (!orderValid) {
        logger.error('Click order verification failed', {
          merchantTransId: payload.merchant_trans_id,
          amount: payload.amount,
        });
        return {
          click_trans_id: payload.click_trans_id,
          merchant_trans_id: payload.merchant_trans_id,
          merchant_prepare_id: '',
          error: -5,
          error_note: 'Order not found or amount mismatch',
        };
      }

      // Generate merchant prepare ID
      const merchantPrepareId = this.generateMerchantPrepareId(payload.merchant_trans_id);

      // Store prepare transaction
      await this.storePrepareTransaction(payload, merchantPrepareId);

      logger.info('Click PREPARE successful', {
        clickTransId: payload.click_trans_id,
        merchantPrepareId,
      });

      return {
        click_trans_id: payload.click_trans_id,
        merchant_trans_id: payload.merchant_trans_id,
        merchant_prepare_id: merchantPrepareId,
        error: 0,
        error_note: 'Success',
      };
    } catch (error) {
      logger.error('Click PREPARE handler error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clickTransId: payload.click_trans_id,
      });

      return {
        click_trans_id: payload.click_trans_id,
        merchant_trans_id: payload.merchant_trans_id,
        merchant_prepare_id: '',
        error: -1,
        error_note: 'Internal error',
      };
    }
  }

  /**
   * Handle Click webhook (COMPLETE action)
   */
  async handleComplete(payload: ClickWebhookPayload): Promise<{
    click_trans_id: string;
    merchant_trans_id: string;
    error: number;
    error_note: string;
  }> {
    try {
      logger.info('Handling Click COMPLETE webhook', {
        clickTransId: payload.click_trans_id,
        merchantTransId: payload.merchant_trans_id,
        amount: payload.amount,
      });

      // Verify signature
      if (!this.verifySignature(payload)) {
        logger.error('Click webhook signature verification failed', {
          clickTransId: payload.click_trans_id,
        });
        return {
          click_trans_id: payload.click_trans_id,
          merchant_trans_id: payload.merchant_trans_id,
          error: -1,
          error_note: 'Invalid signature',
        };
      }

      // Verify prepare transaction exists
      const prepareExists = await this.verifyPrepareTransaction(
        payload.click_trans_id,
        payload.merchant_prepare_id
      );
      if (!prepareExists) {
        logger.error('Click prepare transaction not found', {
          clickTransId: payload.click_trans_id,
          merchantPrepareId: payload.merchant_prepare_id,
        });
        return {
          click_trans_id: payload.click_trans_id,
          merchant_trans_id: payload.merchant_trans_id,
          error: -6,
          error_note: 'Transaction not found',
        };
      }

      // Complete payment
      await this.completePayment(payload);

      logger.info('Click COMPLETE successful', {
        clickTransId: payload.click_trans_id,
        merchantTransId: payload.merchant_trans_id,
      });

      return {
        click_trans_id: payload.click_trans_id,
        merchant_trans_id: payload.merchant_trans_id,
        error: 0,
        error_note: 'Success',
      };
    } catch (error) {
      logger.error('Click COMPLETE handler error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clickTransId: payload.click_trans_id,
      });

      return {
        click_trans_id: payload.click_trans_id,
        merchant_trans_id: payload.merchant_trans_id,
        error: -1,
        error_note: 'Internal error',
      };
    }
  }

  /**
   * Verify Click webhook signature
   */
  private verifySignature(payload: ClickWebhookPayload): boolean {
    const signString = this.generateSignString(payload);
    const hash = crypto.createHash('md5').update(signString).digest('hex');
    return hash === payload.sign_string;
  }

  /**
   * Generate signature string for Click
   */
  private generateSignString(payload: ClickWebhookPayload): string {
    return [
      payload.click_trans_id,
      payload.service_id,
      this.secretKey,
      payload.merchant_trans_id,
      payload.merchant_prepare_id || '',
      payload.amount,
      payload.action,
      payload.sign_time,
    ].join('');
  }

  /**
   * Verify order exists and amount matches
   */
  private async verifyOrder(merchantTransId: string, amount: number): Promise<boolean> {
    try {
      // This would typically call the Order Service
      // For now, we'll simulate the check
      logger.info('Verifying order', { merchantTransId, amount });

      // TODO: Implement actual order verification
      // const order = await orderService.getOrderByTransactionId(merchantTransId);
      // return order && order.amount === amount && order.status === 'pending';

      return true; // Temporary for development
    } catch (error) {
      logger.error('Order verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantTransId,
      });
      return false;
    }
  }

  /**
   * Generate merchant prepare ID
   */
  private generateMerchantPrepareId(merchantTransId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${merchantTransId}_${timestamp}_${random}`;
  }

  /**
   * Store prepare transaction
   */
  private async storePrepareTransaction(
    payload: ClickWebhookPayload,
    merchantPrepareId: string
  ): Promise<void> {
    try {
      // TODO: Store in database
      logger.info('Storing prepare transaction', {
        clickTransId: payload.click_trans_id,
        merchantTransId: payload.merchant_trans_id,
        merchantPrepareId,
        amount: payload.amount,
      });
    } catch (error) {
      logger.error('Failed to store prepare transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clickTransId: payload.click_trans_id,
      });
      throw error;
    }
  }

  /**
   * Verify prepare transaction exists
   */
  private async verifyPrepareTransaction(
    clickTransId: string,
    merchantPrepareId: string
  ): Promise<boolean> {
    try {
      // TODO: Check in database
      logger.info('Verifying prepare transaction', {
        clickTransId,
        merchantPrepareId,
      });

      return true; // Temporary for development
    } catch (error) {
      logger.error('Failed to verify prepare transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clickTransId,
      });
      return false;
    }
  }

  /**
   * Complete payment
   */
  private async completePayment(payload: ClickWebhookPayload): Promise<void> {
    try {
      // TODO: Update order status, send notifications, etc.
      logger.info('Completing payment', {
        clickTransId: payload.click_trans_id,
        merchantTransId: payload.merchant_trans_id,
        amount: payload.amount,
      });
    } catch (error) {
      logger.error('Failed to complete payment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clickTransId: payload.click_trans_id,
      });
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    amount?: number;
    error?: string;
  }> {
    try {
      // TODO: Implement status check
      logger.info('Getting payment status', { transactionId });

      return {
        status: 'pending',
      };
    } catch (error) {
      logger.error('Failed to get payment status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId,
      });

      return {
        status: 'failed',
        error: 'Status check failed',
      };
    }
  }
}
