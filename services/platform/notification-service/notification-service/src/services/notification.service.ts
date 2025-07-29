import nodemailer from 'nodemailer';
import { logger } from '@ultramarket/shared';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationPayload {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  template: string;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels?: string[];
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface EmailNotification {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SMSNotification {
  to: string;
  message: string;
  template?: string;
  data?: Record<string, any>;
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  icon?: string;
  clickAction?: string;
}

export interface InAppNotification {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private templates: Map<string, any> = new Map();

  constructor() {
    this.initializeEmailService();
    this.loadTemplates();
  }

  /**
   * Initialize email service
   */
  private initializeEmailService(): void {
    if (process.env.NODE_ENV === 'production') {
      this.emailTransporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'sendgrid',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || '',
        },
      });
    } else {
      this.emailTransporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER || 'test@example.com',
          pass: process.env.ETHEREAL_PASS || 'test123',
        },
      });
    }
  }

  /**
   * Send notification
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      logger.info('Sending notification', {
        userId: payload.userId,
        type: payload.type,
        template: payload.template,
        priority: payload.priority,
      });

      // Store notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          template: payload.template,
          data: payload.data,
          priority: payload.priority,
          status: 'pending',
          scheduledAt: payload.scheduledAt,
          metadata: payload.metadata,
        },
      });

      // Send by specified channels or default
      const channels = payload.channels || [payload.type];

      for (const channel of channels) {
        await this.sendByChannel(channel, payload);
      }

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      logger.info('Notification sent successfully', {
        notificationId: notification.id,
        userId: payload.userId,
        channels,
      });
    } catch (error) {
      logger.error('Failed to send notification', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      const template = this.templates.get(notification.template);
      if (!template) {
        throw new Error(`Email template '${notification.template}' not found`);
      }

      const subject = this.renderTemplate(template.subject, notification.data);
      const html = this.renderTemplate(template.html, notification.data);
      const text = this.renderTemplate(template.text, notification.data);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ultramarket.com',
        to: notification.to,
        subject,
        html,
        text,
        attachments: notification.attachments,
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: notification.to,
        subject,
        template: notification.template,
      });
    } catch (error) {
      logger.error('Failed to send email', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(notification: SMSNotification): Promise<void> {
    try {
      // SMS service integration (e.g., Twilio, Nexmo)
      // For now, we'll log the SMS
      logger.info('SMS notification', {
        to: notification.to,
        message: notification.message,
        template: notification.template,
      });

      // TODO: Integrate with SMS provider
      // const smsProvider = new SMSProvider();
      // await smsProvider.send(notification.to, notification.message);
    } catch (error) {
      logger.error('Failed to send SMS', error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPush(notification: PushNotification): Promise<void> {
    try {
      // Push notification service integration (e.g., Firebase, OneSignal)
      logger.info('Push notification', {
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
      });

      // TODO: Integrate with push notification provider
      // const pushProvider = new PushNotificationProvider();
      // await pushProvider.send(notification);
    } catch (error) {
      logger.error('Failed to send push notification', error);
      throw error;
    }
  }

  /**
   * Send in-app notification
   */
  async sendInApp(notification: InAppNotification): Promise<void> {
    try {
      // Store in-app notification in database
      await prisma.inAppNotification.create({
        data: {
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          metadata: notification.metadata,
          isRead: false,
        },
      });

      logger.info('In-app notification created', {
        userId: notification.userId,
        title: notification.title,
        type: notification.type,
      });
    } catch (error) {
      logger.error('Failed to send in-app notification', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: NotificationPayload[]): Promise<void> {
    try {
      logger.info('Sending bulk notifications', {
        count: notifications.length,
      });

      const promises = notifications.map((notification) => this.sendNotification(notification));
      await Promise.all(promises);

      logger.info('Bulk notifications sent successfully', {
        count: notifications.length,
      });
    } catch (error) {
      logger.error('Failed to send bulk notifications', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    try {
      const preferences = await prisma.userNotificationPreferences.findUnique({
        where: { userId },
      });

      if (!preferences) {
        // Create default preferences
        return await prisma.userNotificationPreferences.create({
          data: {
            userId,
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            inAppEnabled: true,
            marketingEnabled: true,
            orderUpdates: true,
            promotions: true,
            securityAlerts: true,
          },
        });
      }

      return preferences;
    } catch (error) {
      logger.error('Failed to get user preferences', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await prisma.userNotificationPreferences.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          ...preferences,
        },
      });

      logger.info('User notification preferences updated', { userId });
    } catch (error) {
      logger.error('Failed to update user preferences', error);
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(
    userId: string,
    options: { limit?: number; offset?: number; type?: string }
  ): Promise<any[]> {
    try {
      const where: any = { userId };
      if (options.type) {
        where.type = options.type;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to get notification history:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info('Notification marked as read', { userId, notificationId });
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async sendByChannel(channel: string, payload: NotificationPayload): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmail({
          to: await this.getUserEmail(payload.userId),
          subject: '',
          template: payload.template,
          data: payload.data,
        });
        break;

      case 'sms':
        await this.sendSMS({
          to: await this.getUserPhone(payload.userId),
          message: '',
          template: payload.template,
          data: payload.data,
        });
        break;

      case 'push':
        await this.sendPush({
          userId: payload.userId,
          title: payload.data.title || 'Notification',
          body: payload.data.message || '',
          data: payload.data,
        });
        break;

      case 'in-app':
        await this.sendInApp({
          userId: payload.userId,
          title: payload.data.title || 'Notification',
          message: payload.data.message || '',
          type: payload.data.type || 'info',
          metadata: payload.metadata,
        });
        break;

      default:
        logger.warn('Unknown notification channel:', channel);
    }
  }

  private createEmailTransporter(): nodemailer.Transporter {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'sendgrid',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || '',
        },
      });
    } else {
      return nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER || 'test@example.com',
          pass: process.env.ETHEREAL_PASS || 'test123',
        },
      });
    }
  }

  private loadTemplates(): void {
    // Load notification templates
    this.templates.set('order-confirmation', {
      subject: 'Buyurtma tasdiqlandi - {{orderNumber}}',
      html: `
        <h2>Buyurtmangiz uchun rahmat!</h2>
        <p>Buyurtma {{orderNumber}} tasdiqlandi.</p>
        <p>Jami: {{total}}</p>
      `,
      text: 'Buyurtmangiz uchun rahmat! Buyurtma {{orderNumber}} tasdiqlandi. Jami: {{total}}',
      sms: 'Buyurtma {{orderNumber}} tasdiqlandi. Jami: {{total}}',
    });

    this.templates.set('order-shipped', {
      subject: 'Buyurtmangiz yuborildi - {{orderNumber}}',
      html: `
        <h2>Buyurtmangiz yo\'lda!</h2>
        <p>Buyurtma {{orderNumber}} yuborildi.</p>
        <p>Kuzatish: {{trackingNumber}}</p>
      `,
      text: 'Buyurtma {{orderNumber}} yuborildi. Kuzatish: {{trackingNumber}}',
      sms: 'Buyurtma {{orderNumber}} yuborildi. Kuzatish: {{trackingNumber}}',
    });

    this.templates.set('password-reset', {
      subject: 'Parolni tiklash',
      html: `
        <h2>Parolni tiklash so\'rovi</h2>
        <p>Parolni tiklash uchun quyidagi havolani bosing:</p>
        <a href="{{resetLink}}">Parolni tiklash</a>
      `,
      text: "Parolni tiklash so'rovi. Havola: {{resetLink}}",
      sms: 'Parolni tiklash kodi: {{resetCode}}',
    });
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, data[key]?.toString() || '');
    });
    return result;
  }

  private async getUserEmail(userId: string): Promise<string> {
    // Implementation would fetch from user service
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || 'user@example.com';
  }

  private async getUserPhone(userId: string): Promise<string> {
    // Implementation would fetch from user service
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true },
    });
    return user?.phoneNumber || '+998901234567';
  }

  private async scheduleNotification(payload: NotificationPayload): Promise<void> {
    // Implementation would store in database or queue for later processing
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        template: payload.template,
        data: payload.data,
        priority: payload.priority,
        status: 'scheduled',
        scheduledAt: payload.scheduledAt,
        metadata: payload.metadata,
      },
    });

    logger.info('Notification scheduled', {
      userId: payload.userId,
      scheduledAt: payload.scheduledAt,
    });
  }

  private async storeNotificationHistory(payload: NotificationPayload): Promise<void> {
    // Implementation would store in database
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        template: payload.template,
        data: payload.data,
        priority: payload.priority,
        status: 'sent',
        metadata: payload.metadata,
      },
    });

    logger.debug('Notification history stored', { userId: payload.userId });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.emailTransporter.verify();
      return true;
    } catch (error) {
      logger.error('Notification service health check failed:', error);
      return false;
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      // Get scheduled notifications that are due
      const scheduledNotifications = await prisma.notification.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: {
            lte: new Date(),
          },
        },
      });

      for (const notification of scheduledNotifications) {
        await this.sendNotification({
          userId: notification.userId,
          type: notification.type as any,
          template: notification.template,
          data: notification.data as Record<string, any>,
          priority: notification.priority as any,
          metadata: notification.metadata as Record<string, any>,
        });
      }

      logger.info('Processing scheduled notifications', {
        count: scheduledNotifications.length,
      });
    } catch (error) {
      logger.error('Failed to process scheduled notifications', error);
    }
  }
}

export const notificationService = new NotificationService();
