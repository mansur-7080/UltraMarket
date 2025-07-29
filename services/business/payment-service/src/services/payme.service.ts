import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';
import { logger } from '../utils/logger';

export interface PaymePaymentRequest {
  amount: number;
  orderId: string;
  userId: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  merchantTransId: string;
}

export interface PaymePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface PaymeWebhookPayload {
  method: string;
  params: {
    id?: string;
    time?: number;
    amount?: number;
    account?: {
      order_id: string;
    };
    reason?: number;
  };
  id: string;
}

// Fix interface to make time required but provide proper defaults
export interface PaymeTransaction {
  id: string;
  time: number; // Keep required
  amount: number;
  account: {
    order_id: string;
  };
  create_time?: number;
  perform_time?: number;
  cancel_time?: number;
  state: number;
  reason?: number;
}

const prisma = new PrismaClient();

export class PaymeService {
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly endpoint: string;
  private readonly testMode: boolean;

  constructor() {
    this.merchantId = process.env.PAYME_MERCHANT_ID || '';
    this.secretKey = process.env.PAYME_SECRET_KEY || '';
    this.endpoint = process.env.PAYME_ENDPOINT || 'https://checkout.paycom.uz/api';
    this.testMode = process.env.NODE_ENV !== 'production';

    if (!this.merchantId || !this.secretKey) {
      throw new Error('Payme payment gateway configuration is missing');
    }
  }

  /**
   * Create payment URL for Payme
   */
  async createPayment(request: PaymePaymentRequest): Promise<PaymePaymentResponse> {
    try {
      logger.info('Creating Payme payment', {
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
      logger.error('Payme payment creation failed', {
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
   * Generate Payme payment URL
   */
  private generatePaymentUrl(request: PaymePaymentRequest): string {
    const params = {
      m: this.merchantId,
      ac: {
        order_id: request.orderId,
      },
      a: request.amount,
      c: request.returnUrl,
      cr: request.cancelUrl,
    };

    const encodedParams = btoa(JSON.stringify(params));
    return `${this.endpoint}?${encodedParams}`;
  }

  /**
   * Handle Payme webhook - CheckPerformTransaction
   */
  async checkPerformTransaction(payload: PaymeWebhookPayload): Promise<{
    allow: boolean;
    detail?: {
      receipt_type: number;
      items: Array<{
        title: string;
        price: number;
        count: number;
        code: string;
        units: number;
        vat_percent: number;
        package_code: string;
      }>;
    };
  }> {
    try {
      logger.info('Handling Payme CheckPerformTransaction', {
        orderId: payload.params.account?.order_id,
        amount: payload.params.amount,
      });

      // Verify order exists and amount matches
      const orderValid = await this.verifyOrder(
        payload.params.account?.order_id || '',
        payload.params.amount || 0
      );

      if (!orderValid) {
        logger.error('Payme order verification failed', {
          orderId: payload.params.account?.order_id,
          amount: payload.params.amount,
        });
        throw new Error('Order not found or amount mismatch');
      }

      // Get order details for receipt
      const orderDetails = await this.getOrderDetails(payload.params.account?.order_id || '');

      return {
        allow: true,
        detail: {
          receipt_type: 0,
          items: orderDetails.items || [],
        },
      };
    } catch (error) {
      logger.error('Payme CheckPerformTransaction error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: payload.params.account?.order_id,
      });
      throw error;
    }
  }

  /**
   * Handle Payme webhook - CreateTransaction
   */
  async createTransaction(payload: PaymeWebhookPayload): Promise<{
    create_time: number;
    transaction: string;
    state: number;
  }> {
    try {
      logger.info('Handling Payme CreateTransaction', {
        orderId: payload.params.account?.order_id,
        amount: payload.params.amount,
        id: payload.params.id,
      });

      // Check if transaction already exists
      const existingTransaction = await this.getTransaction(payload.params.id || '');
      if (existingTransaction) {
        logger.info('Payme transaction already exists', {
          transactionId: payload.params.id,
        });
        return {
          create_time: existingTransaction.create_time,
          transaction: existingTransaction.id,
          state: existingTransaction.state,
        };
      }

      // Verify order is still available
      const orderValid = await this.verifyOrder(
        payload.params.account?.order_id || '',
        payload.params.amount || 0
      );

      if (!orderValid) {
        logger.error('Payme order verification failed during create', {
          orderId: payload.params.account?.order_id,
          amount: payload.params.amount,
        });
        throw new Error('Order not found or amount mismatch');
      }

      // Create transaction
      const transaction = await this.storeTransaction({
        id: payload.params.id || '',
        time: payload.params.time || Date.now(),
        amount: payload.params.amount || 0,
        account: payload.params.account || { order_id: '' },
        create_time: Date.now(),
        state: 1, // Created
      });

      logger.info('Payme transaction created', {
        transactionId: transaction.id,
        orderId: payload.params.account?.order_id,
      });

      return {
        create_time: transaction.create_time,
        transaction: transaction.id,
        state: transaction.state,
      };
    } catch (error) {
      logger.error('Payme CreateTransaction error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: payload.params.account?.order_id,
      });
      throw error;
    }
  }

  /**
   * Handle Payme webhook - PerformTransaction
   */
  async performTransaction(payload: PaymeWebhookPayload): Promise<{
    perform_time: number;
    transaction: string;
    state: number;
  }> {
    try {
      logger.info('Handling Payme PerformTransaction', {
        transactionId: payload.params.id,
      });

      // Get transaction
      const transaction = await this.getTransaction(payload.params.id || '');
      if (!transaction) {
        logger.error('Payme transaction not found for perform', {
          transactionId: payload.params.id,
        });
        throw new Error('Transaction not found');
      }

      // Check if already performed
      if (transaction.state === 2) {
        logger.info('Payme transaction already performed', {
          transactionId: payload.params.id,
        });
        return {
          perform_time: transaction.perform_time || Date.now(),
          transaction: transaction.id,
          state: transaction.state,
        };
      }

      // Perform transaction
      const performTime = Date.now();
      await this.updateTransaction(transaction.id, {
        state: 2, // Performed
        perform_time: performTime,
      });

      // Complete order
      await this.completeOrder(transaction.account.order_id, transaction.amount);

      logger.info('Payme transaction performed', {
        transactionId: transaction.id,
        orderId: transaction.account.order_id,
      });

      return {
        perform_time: performTime,
        transaction: transaction.id,
        state: 2,
      };
    } catch (error) {
      logger.error('Payme PerformTransaction error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: payload.params.id,
      });
      throw error;
    }
  }

  /**
   * Handle Payme webhook - CancelTransaction
   */
  async cancelTransaction(payload: PaymeWebhookPayload): Promise<{
    cancel_time: number;
    transaction: string;
    state: number;
  }> {
    try {
      logger.info('Handling Payme CancelTransaction', {
        transactionId: payload.params.id,
        reason: payload.params.reason,
      });

      // Get transaction
      const transaction = await this.getTransaction(payload.params.id || '');
      if (!transaction) {
        logger.error('Payme transaction not found for cancel', {
          transactionId: payload.params.id,
        });
        throw new Error('Transaction not found');
      }

      // Check if already cancelled
      if (transaction.state === -1 || transaction.state === -2) {
        logger.info('Payme transaction already cancelled', {
          transactionId: payload.params.id,
        });
        return {
          cancel_time: transaction.cancel_time || Date.now(),
          transaction: transaction.id,
          state: transaction.state,
        };
      }

      // Cancel transaction
      const cancelTime = Date.now();
      const newState = transaction.state === 1 ? -1 : -2; // -1 if created, -2 if performed

      await this.updateTransaction(transaction.id, {
        state: newState,
        cancel_time: cancelTime,
        reason: payload.params.reason,
      });

      // If transaction was performed, handle refund
      if (transaction.state === 2) {
        await this.refundOrder(transaction.account.order_id, transaction.amount);
      }

      logger.info('Payme transaction cancelled', {
        transactionId: transaction.id,
        orderId: transaction.account.order_id,
        reason: payload.params.reason,
      });

      return {
        cancel_time: cancelTime,
        transaction: transaction.id,
        state: newState,
      };
    } catch (error) {
      logger.error('Payme CancelTransaction error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: payload.params.id,
      });
      throw error;
    }
  }

  /**
   * Handle Payme webhook - CheckTransaction
   */
  async checkTransaction(payload: PaymeWebhookPayload): Promise<{
    create_time: number;
    perform_time?: number;
    cancel_time?: number;
    transaction: string;
    state: number;
    reason?: number;
  }> {
    try {
      logger.info('Handling Payme CheckTransaction', {
        transactionId: payload.params.id,
      });

      // Get transaction
      const transaction = await this.getTransaction(payload.params.id || '');
      if (!transaction) {
        logger.error('Payme transaction not found for check', {
          transactionId: payload.params.id,
        });
        throw new Error('Transaction not found');
      }

      return {
        create_time: transaction.create_time,
        perform_time: transaction.perform_time,
        cancel_time: transaction.cancel_time,
        transaction: transaction.id,
        state: transaction.state,
        reason: transaction.reason,
      };
    } catch (error) {
      logger.error('Payme CheckTransaction error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: payload.params.id,
      });
      throw error;
    }
  }

  /**
   * Verify order exists and amount matches
   */
  private async verifyOrder(orderId: string, amount: number): Promise<boolean> {
    try {
      logger.info('Verifying order', { orderId, amount });

      // Professional order service integration
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3004';
      
      try {
        const response = await axios.get(`${orderServiceUrl}/api/orders/${orderId}`, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service': 'payment-service',
            'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
          }
        });

        const order = response.data;
        
        if (!order) {
          logger.warn('Order not found', { orderId });
          return false;
        }

        // Verify order status and amount
        const isValid = order.status === 'pending' && 
                       Math.abs(order.total_amount - amount) < 1; // Allow small rounding differences

        if (!isValid) {
          logger.warn('Order verification failed', { 
            orderId, 
            expectedAmount: amount, 
            actualAmount: order.total_amount,
            orderStatus: order.status 
          });
        }

        return isValid;
      } catch (orderServiceError) {
        // Fallback to database if service is down
        logger.warn('Order service unavailable, falling back to database', { 
          error: orderServiceError instanceof Error ? orderServiceError.message : 'Unknown error'
        });
        
        const order = await prisma.order.findFirst({
          where: { 
            id: orderId,
            status: 'pending'
          }
        });

        return order ? Math.abs(order.total_amount - amount) < 1 : false;
      }
    } catch (error) {
      logger.error('Order verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
        amount
      });
      return false;
    }
  }

  /**
   * Get order details for receipt
   */
  private async getOrderDetails(orderId: string): Promise<{
    items: Array<{
      title: string;
      price: number;
      count: number;
      code: string;
      units: number;
      vat_percent: number;
      package_code: string;
    }>;
  }> {
    try {
      logger.info('Getting order details', { orderId });

      // Professional order details retrieval
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3004';
      
      try {
        const response = await axios.get(`${orderServiceUrl}/api/orders/${orderId}/details`, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service': 'payment-service',
            'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
          }
        });

        const orderDetails = response.data;
        
        // Transform order items to Payme format
        const items = orderDetails.items.map((item: any) => ({
          title: item.product_name || `Product #${item.product_id}`,
          price: Math.round(item.unit_price * 100), // Convert to tiyin
          count: item.quantity,
          code: item.product_code || item.product_id,
          units: 796, // Piece unit code in Uzbekistan
          vat_percent: orderDetails.vat_rate || 12,
          package_code: item.package_code || '123456'
        }));

        return { items };
      } catch (serviceError) {
        // Fallback to database
        const order = await prisma.order.findFirst({
          where: { id: orderId },
          include: {
            order_items: {
              include: {
                product: true
              }
            }
          }
        });

        if (!order) {
          throw new Error('Order not found');
        }

        const items = order.order_items.map((item: any) => ({
          title: item.product?.name || `Product #${item.product_id}`,
          price: Math.round(item.unit_price * 100),
          count: item.quantity,
          code: item.product?.sku || item.product_id,
          units: 796,
          vat_percent: 12,
          package_code: '123456'
        }));

        return { items };
      }
    } catch (error) {
      logger.error('Failed to get order details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
      });
      
      // Return minimal order details as fallback
      return {
        items: [{
          title: `Order #${orderId}`,
          price: 100000, // Default amount
          count: 1,
          code: orderId,
          units: 796,
          vat_percent: 12,
          package_code: '123456'
        }]
      };
    }
  }

  /**
   * Store transaction in database
   */
  private async storeTransaction(transaction: PaymeTransaction): Promise<PaymeTransaction> {
    try {
      logger.info('Storing Payme transaction', {
        transactionId: transaction.id,
        orderId: transaction.account.order_id,
        amount: transaction.amount,
        state: transaction.state
      });

      // Professional database storage
      const storedTransaction = await prisma.paymeTransaction.upsert({
        where: { 
          transaction_id: transaction.id 
        },
        update: {
          state: transaction.state,
          amount: transaction.amount,
          create_time: transaction.create_time ? new Date(transaction.create_time) : undefined,
          perform_time: transaction.perform_time ? new Date(transaction.perform_time) : undefined,
          cancel_time: transaction.cancel_time ? new Date(transaction.cancel_time) : undefined,
          reason: transaction.reason || null,
          updated_at: new Date()
        },
        create: {
          transaction_id: transaction.id,
          order_id: transaction.account.order_id,
          state: transaction.state,
          amount: transaction.amount,
          create_time: transaction.create_time ? new Date(transaction.create_time) : new Date(),
          perform_time: transaction.perform_time ? new Date(transaction.perform_time) : null,
          cancel_time: transaction.cancel_time ? new Date(transaction.cancel_time) : null,
          reason: transaction.reason || null,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      logger.info('Transaction stored successfully', {
        transactionId: transaction.id,
        databaseId: storedTransaction.id
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to store transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: transaction.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Get transaction from database
   */
  private async getTransaction(transactionId: string): Promise<PaymeTransaction | null> {
    try {
      logger.info('Getting Payme transaction', { transactionId });

      const dbTransaction = await prisma.paymeTransaction.findFirst({
        where: { transaction_id: transactionId }
      });

      if (!dbTransaction) {
        logger.info('Transaction not found in database', { transactionId });
        return null;
      }

      // Transform database record to PaymeTransaction format with proper defaults
      const transaction: PaymeTransaction = {
        id: dbTransaction.transaction_id,
        time: dbTransaction.create_time?.getTime() ?? Date.now(),
        account: {
          order_id: dbTransaction.order_id
        },
        amount: dbTransaction.amount,
        state: dbTransaction.state,
        create_time: dbTransaction.create_time?.getTime() ?? undefined,
        perform_time: dbTransaction.perform_time?.getTime() ?? undefined,
        cancel_time: dbTransaction.cancel_time?.getTime() ?? undefined,
        reason: dbTransaction.reason ?? undefined
      };

      return transaction;
    } catch (error) {
      logger.error('Failed to get transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId,
      });
      return null;
    }
  }

  /**
   * Update transaction in database
   */
  private async updateTransaction(
    transactionId: string,
    updates: Partial<PaymeTransaction>
  ): Promise<void> {
    try {
      logger.info('Updating Payme transaction', {
        transactionId,
        updates
      });

      await prisma.paymeTransaction.update({
        where: { transaction_id: transactionId },
        data: {
          state: updates.state,
          amount: updates.amount,
          perform_time: updates.perform_time ? new Date(updates.perform_time) : undefined,
          cancel_time: updates.cancel_time ? new Date(updates.cancel_time) : undefined,
          reason: updates.reason,
          updated_at: new Date()
        }
      });

      logger.info('Transaction updated successfully', { transactionId });
    } catch (error) {
      logger.error('Failed to update transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId,
      });
      throw error;
    }
  }

  /**
   * Complete order after successful payment
   */
  private async completeOrder(orderId: string, amount: number): Promise<void> {
    try {
      logger.info('Completing order', { orderId, amount });

      // Update order status in Order Service
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3004';
      
      try {
        await axios.patch(`${orderServiceUrl}/api/orders/${orderId}/status`, {
          status: 'paid',
          payment_method: 'payme',
          payment_amount: amount,
          payment_time: new Date().toISOString(),
          payment_reference: `payme_${Date.now()}`
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service': 'payment-service',
            'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
          }
        });
      } catch (orderServiceError) {
        // Fallback to direct database update
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'paid',
            payment_method: 'payme',
            payment_time: new Date(),
            updated_at: new Date()
          }
        });
      }

      // Send completion notifications
      await this.sendOrderCompletionNotifications(orderId, amount);

      logger.info('Order completed successfully', { orderId, amount });
    } catch (error) {
      logger.error('Failed to complete order', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
        amount
      });
      throw error;
    }
  }

  /**
   * Refund order after transaction cancellation
   */
  private async refundOrder(orderId: string, amount: number): Promise<void> {
    try {
      logger.info('Processing refund for order', { orderId, amount });

      // Update order status
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3004';
      
      try {
        await axios.patch(`${orderServiceUrl}/api/orders/${orderId}/status`, {
          status: 'refunded',
          refund_amount: amount,
          refund_time: new Date().toISOString(),
          refund_reason: 'payme_cancellation'
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service': 'payment-service',
            'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
          }
        });
      } catch (orderServiceError) {
        // Fallback to database
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'refunded',
            refund_time: new Date(),
            updated_at: new Date()
          }
        });
      }

      // Send refund notifications
      await this.sendRefundNotifications(orderId, amount);

      // Log refund for accounting
      await this.logRefundForAccounting(orderId, amount);

      logger.info('Order refund processed successfully', { orderId, amount });
    } catch (error) {
      logger.error('Failed to process refund', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
        amount
      });
      throw error;
    }
  }

  /**
   * Send order completion notifications
   */
  private async sendOrderCompletionNotifications(orderId: string, amount: number): Promise<void> {
    try {
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007';
      
      // Get order details for notifications
      const order = await prisma.order.findFirst({
        where: { id: orderId },
        include: { user: true }
      });

      if (!order) return;

      const notifications = [
        {
          type: 'email',
          recipient: order.user.email,
          template: 'payment_successful',
          data: {
            orderId,
            amount: amount / 100, // Convert from tiyin to sum
            paymentMethod: 'Payme',
            orderDate: order.created_at
          }
        },
        {
          type: 'sms',
          recipient: order.user.phone,
          template: 'payment_confirmation',
          data: {
            orderId: orderId.substring(0, 8),
            amount: amount / 100
          }
        }
      ];

      // Send notifications
      for (const notification of notifications) {
        try {
          await axios.post(`${notificationServiceUrl}/api/notifications/send`, notification, {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json',
              'X-Service': 'payment-service',
              'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
            }
          });
        } catch (notificationError) {
          logger.warn('Failed to send notification', {
            type: notification.type,
            recipient: notification.recipient,
            error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send completion notifications', {
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send refund notifications
   */
  private async sendRefundNotifications(orderId: string, amount: number): Promise<void> {
    try {
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007';
      
      const order = await prisma.order.findFirst({
        where: { id: orderId },
        include: { user: true }
      });

      if (!order) return;

      await axios.post(`${notificationServiceUrl}/api/notifications/send`, {
        type: 'email',
        recipient: order.user.email,
        template: 'payment_refunded',
        data: {
          orderId,
          refundAmount: amount / 100,
          refundDate: new Date().toISOString()
        }
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Service': 'payment-service',
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
        }
      });
    } catch (error) {
      logger.error('Failed to send refund notifications', {
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Log refund for accounting purposes
   */
  private async logRefundForAccounting(orderId: string, amount: number): Promise<void> {
    try {
      await prisma.accountingLog.create({
        data: {
          type: 'refund',
          order_id: orderId,
          amount: amount,
          payment_method: 'payme',
          description: `Payme transaction cancellation refund for order ${orderId}`,
          created_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to log refund for accounting', {
        orderId,
        amount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha1', this.secretKey)
        .update(payload)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Failed to verify webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}
