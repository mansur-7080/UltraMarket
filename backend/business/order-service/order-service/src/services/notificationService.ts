import { logger } from '@ultramarket/shared';
import { Order } from '../types/order.types';

export class NotificationService {
  async sendOrderConfirmation(order: Order): Promise<void> {
    try {
      // Send email notification
      await this.sendEmail({
        to: order.user?.email || '',
        subject: 'Order Confirmation',
        template: 'order-confirmation',
        data: {
          orderId: order.id,
          total: order.total,
          status: order.status,
          user: order.user,
        },
      });

      // Send SMS notification
      await this.sendSMS({
        to: order.user?.phone || '',
        message: `Your order #${order.id} has been confirmed. Total: $${order.total}`,
      });

      logger.info(`Order confirmation sent for order: ${order.id}`);
    } catch (error) {
      logger.error('Failed to send order confirmation:', error);
    }
  }

  async sendOrderStatusUpdate(order: Order): Promise<void> {
    try {
      // Send email notification
      await this.sendEmail({
        to: order.user?.email || '',
        subject: 'Order Status Update',
        template: 'order-status-update',
        data: {
          orderId: order.id,
          status: order.status,
          user: order.user,
        },
      });

      // Send SMS notification
      await this.sendSMS({
        to: order.user?.phone || '',
        message: `Your order #${order.id} status has been updated to: ${order.status}`,
      });

      logger.info(`Order status update sent for order: ${order.id}`);
    } catch (error) {
      logger.error('Failed to send order status update:', error);
    }
  }

  async sendOrderCancellation(order: Order): Promise<void> {
    try {
      // Send email notification
      await this.sendEmail({
        to: order.user?.email || '',
        subject: 'Order Cancellation',
        template: 'order-cancellation',
        data: {
          orderId: order.id,
          user: order.user,
        },
      });

      // Send SMS notification
      await this.sendSMS({
        to: order.user?.phone || '',
        message: `Your order #${order.id} has been cancelled.`,
      });

      logger.info(`Order cancellation sent for order: ${order.id}`);
    } catch (error) {
      logger.error('Failed to send order cancellation:', error);
    }
  }

  async sendPaymentConfirmation(order: Order): Promise<void> {
    try {
      // Send email notification
      await this.sendEmail({
        to: order.user?.email || '',
        subject: 'Payment Confirmation',
        template: 'payment-confirmation',
        data: {
          orderId: order.id,
          total: order.total,
          user: order.user,
        },
      });

      logger.info(`Payment confirmation sent for order: ${order.id}`);
    } catch (error) {
      logger.error('Failed to send payment confirmation:', error);
    }
  }

  async sendRefundNotification(order: Order, amount: number): Promise<void> {
    try {
      // Send email notification
      await this.sendEmail({
        to: order.user?.email || '',
        subject: 'Refund Processed',
        template: 'refund-notification',
        data: {
          orderId: order.id,
          amount,
          user: order.user,
        },
      });

      // Send SMS notification
      await this.sendSMS({
        to: order.user?.phone || '',
        message: `Refund of $${amount} has been processed for order #${order.id}`,
      });

      logger.info(`Refund notification sent for order: ${order.id}`);
    } catch (error) {
      logger.error('Failed to send refund notification:', error);
    }
  }

  private async sendEmail(data: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
  }): Promise<void> {
    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 500));
    logger.info(`Email sent to ${data.to}: ${data.subject}`);
  }

  private async sendSMS(data: { to: string; message: string }): Promise<void> {
    // Simulate SMS sending
    await new Promise((resolve) => setTimeout(resolve, 300));
    logger.info(`SMS sent to ${data.to}: ${data.message}`);
  }
}
