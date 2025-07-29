import axios from 'axios';
import { logger } from '../logging/logger';
import { AppError, ErrorCode } from '../errors/AppError';
import { emailService } from './professional-email-service';

// Notification types
export type NotificationType = 'email' | 'sms' | 'push' | 'in_app';

// Notification priority levels
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

// Notification status
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

// Base notification interface
export interface BaseNotification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  category: string;
  sendAt?: Date;
  expiresAt?: Date;
  status?: NotificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Email notification specific
export interface EmailNotification extends BaseNotification {
  type: 'email';
  recipient: string;
  template?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// SMS notification specific
export interface SMSNotification extends BaseNotification {
  type: 'sms';
  phoneNumber: string;
  from?: string;
}

// Push notification specific
export interface PushNotification extends BaseNotification {
  type: 'push';
  deviceTokens: string[];
  icon?: string;
  badge?: number;
  sound?: string;
  clickAction?: string;
}

// In-app notification specific
export interface InAppNotification extends BaseNotification {
  type: 'in_app';
  actionUrl?: string;
  buttons?: Array<{
    text: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

// Notification template interface
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  language: 'uz' | 'ru' | 'en';
  title: string;
  message: string;
  emailTemplate?: string;
  variables: string[];
}

// Notification configuration
export interface NotificationConfig {
  sms: {
    provider: 'eskiz' | 'playmobile';
    apiUrl: string;
    login: string;
    password: string;
    from: string;
    retryAttempts: number;
  };
  push: {
    fcm: {
      serverKey: string;
      senderId: string;
    };
    apn: {
      keyId: string;
      teamId: string;
      bundleId: string;
      production: boolean;
    };
  };
  rateLimit: {
    smsPerMinute: number;
    emailPerMinute: number;
    pushPerMinute: number;
  };
}

// Notification statistics
export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byCategory: Record<string, number>;
}

// Professional Notification Service
export class ProfessionalNotificationService {
  private config: NotificationConfig;
  private templates: Map<string, NotificationTemplate> = new Map();
  private notificationQueue: BaseNotification[] = [];
  private processing: boolean = false;
  private stats: NotificationStats = {
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    byType: { email: 0, sms: 0, push: 0, in_app: 0 },
    byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
    byCategory: {},
  };

  // Rate limiting
  private rateLimitCounters = {
    sms: { count: 0, resetTime: Date.now() + 60000 },
    email: { count: 0, resetTime: Date.now() + 60000 },
    push: { count: 0, resetTime: Date.now() + 60000 },
  };

  constructor(config: NotificationConfig) {
    this.config = config;
    this.loadNotificationTemplates();
    this.startQueueProcessor();
  }

  /**
   * Load notification templates
   */
  private loadNotificationTemplates(): void {
    // UltraMarket specific templates
    const defaultTemplates: NotificationTemplate[] = [
      // User Registration
      {
        id: 'welcome_email_uz',
        name: 'Xush kelibsiz',
        type: 'email',
        language: 'uz',
        title: 'UltraMarket ga xush kelibsiz!',
        message: 'Salom {{firstName}}, UltraMarket platformasiga muvaffaqiyatli ro\'yxatdan o\'tdingiz.',
        emailTemplate: 'welcome',
        variables: ['firstName', 'email', 'verificationLink'],
      },
      {
        id: 'welcome_sms_uz',
        name: 'Xush kelibsiz SMS',
        type: 'sms',
        language: 'uz',
        title: '',
        message: 'Salom {{firstName}}! UltraMarket ga xush kelibsiz. Akkaunt tasdiqlash: {{verificationCode}}',
        variables: ['firstName', 'verificationCode'],
      },

      // Order Notifications
      {
        id: 'order_confirmation_email_uz',
        name: 'Buyurtma tasdiqlash',
        type: 'email',
        language: 'uz',
        title: 'Buyurtmangiz qabul qilindi #{{orderNumber}}',
        message: 'Hurmatli {{customerName}}, {{orderNumber}} raqamli buyurtmangiz muvaffaqiyatli qabul qilindi.',
        emailTemplate: 'order_confirmation',
        variables: ['customerName', 'orderNumber', 'orderTotal', 'orderItems', 'deliveryAddress'],
      },
      {
        id: 'order_shipped_push_uz',
        name: 'Buyurtma jo\'natildi',
        type: 'push',
        language: 'uz',
        title: 'Buyurtmangiz jo\'natildi!',
        message: '#{{orderNumber}} buyurtmangiz jo\'natildi va {{estimatedDelivery}} gacha yetkaziladi.',
        variables: ['orderNumber', 'estimatedDelivery', 'trackingNumber'],
      },

      // Payment Notifications
      {
        id: 'payment_success_sms_uz',
        name: 'To\'lov muvaffaqiyatli',
        type: 'sms',
        language: 'uz',
        title: '',
        message: 'To\'lovingiz muvaffaqiyatli amalga oshirildi. Buyurtma: #{{orderNumber}}, Summa: {{amount}} so\'m',
        variables: ['orderNumber', 'amount', 'paymentMethod'],
      },
      {
        id: 'payment_failed_email_uz',
        name: 'To\'lov muvaffaqiyatsiz',
        type: 'email',
        language: 'uz',
        title: 'To\'lovda xatolik yuz berdi',
        message: 'Hurmatli {{customerName}}, {{orderNumber}} buyurtma uchun to\'lovda xatolik yuz berdi.',
        emailTemplate: 'payment_failed',
        variables: ['customerName', 'orderNumber', 'amount', 'errorReason'],
      },

      // Security Notifications
      {
        id: 'security_alert_email_uz',
        name: 'Xavfsizlik ogohlantiruvi',
        type: 'email',
        language: 'uz',
        title: 'Akkauntingizga kirish urinishi',
        message: 'Hurmatli {{userName}}, akkauntingizga {{location}} dan kirish urinishi qayd etildi.',
        emailTemplate: 'security_alert',
        variables: ['userName', 'location', 'ipAddress', 'timestamp', 'device'],
      },

      // Promotional Notifications
      {
        id: 'promotion_push_uz',
        name: 'Chegirma',
        type: 'push',
        language: 'uz',
        title: '🔥 {{discount}}% chegirma!',
        message: '{{productName}} mahsulotiga katta chegirma! Faqat {{validUntil}} gacha.',
        variables: ['discount', 'productName', 'validUntil'],
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info('Notification templates loaded', {
      templatesCount: this.templates.size,
    });
  }

  /**
   * Send notification
   */
  async sendNotification(notification: BaseNotification): Promise<boolean> {
    try {
      // Generate ID if not provided
      if (!notification.id) {
        notification.id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Set default values
      notification.status = 'pending';
      notification.createdAt = new Date();
      notification.priority = notification.priority || 'normal';

      // Add to queue
      this.notificationQueue.push(notification);
      this.stats.pending++;
      this.stats.byType[notification.type]++;
      this.stats.byPriority[notification.priority]++;
      
      if (notification.category) {
        this.stats.byCategory[notification.category] = (this.stats.byCategory[notification.category] || 0) + 1;
      }

      logger.info('Notification queued', {
        id: notification.id,
        type: notification.type,
        priority: notification.priority,
        userId: notification.userId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        notification: {
          type: notification.type,
          userId: notification.userId,
          title: notification.title,
        },
      });
      return false;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: BaseNotification[]): Promise<{
    success: number;
    failed: number;
  }> {
    let success = 0;
    let failed = 0;

    const batchSize = 100;
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const promises = batch.map(async (notification) => {
        const result = await this.sendNotification(notification);
        return result ? 'success' : 'failed';
      });
      
      const results = await Promise.all(promises);
      
      success += results.filter(r => r === 'success').length;
      failed += results.filter(r => r === 'failed').length;
      
      // Small delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    logger.info('Bulk notifications processed', {
      total: notifications.length,
      success,
      failed,
    });

    return { success, failed };
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.processing || this.notificationQueue.length === 0) return;

      this.processing = true;
      
      try {
        await this.processNotificationQueue();
      } catch (error) {
        logger.error('Notification queue processing error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        this.processing = false;
      }
    }, 2000); // Process every 2 seconds

    logger.info('Notification queue processor started');
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    // Reset rate limit counters if needed
    this.resetRateLimitCounters();

    // Sort by priority (critical first)
    const sortedQueue = this.notificationQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const itemsToProcess = sortedQueue.filter(
      item => 
        item.status === 'pending' && 
        (!item.sendAt || item.sendAt <= new Date()) &&
        this.canSendNotification(item.type)
    ).slice(0, 20); // Process 20 items at a time

    for (const notification of itemsToProcess) {
      try {
        let success = false;

        switch (notification.type) {
          case 'email':
            success = await this.sendEmailNotification(notification as EmailNotification);
            break;
          case 'sms':
            success = await this.sendSMSNotification(notification as SMSNotification);
            break;
          case 'push':
            success = await this.sendPushNotification(notification as PushNotification);
            break;
          case 'in_app':
            success = await this.sendInAppNotification(notification as InAppNotification);
            break;
          default:
            logger.warn('Unknown notification type', { type: notification.type });
            continue;
        }

        if (success) {
          notification.status = 'sent';
          this.stats.sent++;
          this.incrementRateLimit(notification.type);
        } else {
          notification.status = 'failed';
          this.stats.failed++;
        }

        this.stats.pending--;

        // Remove from queue
        const index = this.notificationQueue.indexOf(notification);
        if (index > -1) {
          this.notificationQueue.splice(index, 1);
        }

      } catch (error) {
        notification.status = 'failed';
        this.stats.failed++;
        this.stats.pending--;

        logger.error('Failed to process notification', {
          id: notification.id,
          type: notification.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Remove failed notification from queue
        const index = this.notificationQueue.indexOf(notification);
        if (index > -1) {
          this.notificationQueue.splice(index, 1);
        }
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: EmailNotification): Promise<boolean> {
    try {
      const template = this.getTemplate(notification.template || 'default', notification.type, 'uz');
      
      const emailData = {
        to: notification.recipient,
        template: notification.template || 'default',
        data: {
          title: notification.title,
          message: notification.message,
          ...notification.data,
        },
        priority: notification.priority === 'critical' ? 'high' as const : 'normal' as const,
      };

      return await emailService.sendEmail(emailData);
    } catch (error) {
      logger.error('Failed to send email notification', {
        id: notification.id,
        recipient: notification.recipient,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send SMS notification (Eskiz.uz integration)
   */
  private async sendSMSNotification(notification: SMSNotification): Promise<boolean> {
    try {
      // First, get auth token
      const authResponse = await axios.post(`${this.config.sms.apiUrl}/auth/login`, {
        email: this.config.sms.login,
        password: this.config.sms.password,
      });

      const token = authResponse.data.data.token;

      // Send SMS
      const smsResponse = await axios.post(
        `${this.config.sms.apiUrl}/message/sms/send`,
        {
          mobile_phone: notification.phoneNumber,
          message: this.renderTemplate(notification.message, notification.data),
          from: notification.from || this.config.sms.from,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (smsResponse.data.status === 'success') {
        logger.info('SMS sent successfully', {
          id: notification.id,
          phoneNumber: notification.phoneNumber,
          messageId: smsResponse.data.data.id,
        });
        return true;
      } else {
        throw new Error(smsResponse.data.message || 'SMS send failed');
      }
    } catch (error) {
      logger.error('Failed to send SMS notification', {
        id: notification.id,
        phoneNumber: notification.phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send push notification (Firebase FCM)
   */
  private async sendPushNotification(notification: PushNotification): Promise<boolean> {
    try {
      const payload = {
        registration_ids: notification.deviceTokens,
        notification: {
          title: notification.title,
          body: this.renderTemplate(notification.message, notification.data),
          icon: notification.icon || 'default',
          sound: notification.sound || 'default',
          badge: notification.badge,
          click_action: notification.clickAction,
        },
        data: notification.data || {},
        priority: notification.priority === 'critical' ? 'high' : 'normal',
      };

      const response = await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        payload,
        {
          headers: {
            'Authorization': `key=${this.config.push.fcm.serverKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success > 0) {
        logger.info('Push notification sent successfully', {
          id: notification.id,
          deviceTokens: notification.deviceTokens.length,
          success: response.data.success,
          failure: response.data.failure,
        });
        return true;
      } else {
        throw new Error('No devices received the notification');
      }
    } catch (error) {
      logger.error('Failed to send push notification', {
        id: notification.id,
        deviceTokens: notification.deviceTokens?.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send in-app notification (store in database)
   */
  private async sendInAppNotification(notification: InAppNotification): Promise<boolean> {
    try {
      // In production, this would save to database
      // For now, we'll just log and consider it sent
      logger.info('In-app notification stored', {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        actionUrl: notification.actionUrl,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send in-app notification', {
        id: notification.id,
        userId: notification.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get notification template
   */
  private getTemplate(templateId: string, type: NotificationType, language: string): NotificationTemplate | null {
    const fullId = `${templateId}_${type}_${language}`;
    return this.templates.get(fullId) || this.templates.get(`${templateId}_${type}_uz`) || null;
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data?: Record<string, any>): string {
    if (!data) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Check rate limits
   */
  private canSendNotification(type: NotificationType): boolean {
    if (type === 'in_app') return true; // No rate limit for in-app

    const typeKey = type as keyof typeof this.rateLimitCounters;
    const counter = this.rateLimitCounters[typeKey];
    
    if (!counter) return true;

    const limits = {
      sms: this.config.rateLimit.smsPerMinute,
      email: this.config.rateLimit.emailPerMinute,
      push: this.config.rateLimit.pushPerMinute,
    };

    return counter.count < limits[typeKey];
  }

  /**
   * Increment rate limit counter
   */
  private incrementRateLimit(type: NotificationType): void {
    if (type === 'in_app') return;

    const typeKey = type as keyof typeof this.rateLimitCounters;
    const counter = this.rateLimitCounters[typeKey];
    
    if (counter) {
      counter.count++;
    }
  }

  /**
   * Reset rate limit counters
   */
  private resetRateLimitCounters(): void {
    const now = Date.now();
    
    Object.keys(this.rateLimitCounters).forEach(key => {
      const typedKey = key as keyof typeof this.rateLimitCounters;
      const counter = this.rateLimitCounters[typedKey];
      
      if (now > counter.resetTime) {
        counter.count = 0;
        counter.resetTime = now + 60000; // Reset every minute
      }
    });
  }

  /**
   * Get notification statistics
   */
  getStatistics(): NotificationStats {
    return { ...this.stats };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    processing: boolean;
    byType: Record<NotificationType, number>;
  } {
    const byType = this.notificationQueue.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    return {
      pending: this.notificationQueue.length,
      processing: this.processing,
      byType,
    };
  }

  /**
   * Clear failed notifications
   */
  clearFailedNotifications(): number {
    const beforeCount = this.notificationQueue.length;
    this.notificationQueue = this.notificationQueue.filter(item => item.status !== 'failed');
    const cleared = beforeCount - this.notificationQueue.length;
    
    logger.info('Cleared failed notifications from queue', { cleared });
    
    return cleared;
  }

  /**
   * Test notification configuration
   */
  async testConfiguration(): Promise<{
    sms: boolean;
    push: boolean;
    email: boolean;
  }> {
    const results = {
      sms: false,
      push: false,
      email: false,
    };

    // Test SMS
    try {
      const authResponse = await axios.post(`${this.config.sms.apiUrl}/auth/login`, {
        email: this.config.sms.login,
        password: this.config.sms.password,
      });
      results.sms = authResponse.status === 200;
    } catch (error) {
      logger.error('SMS configuration test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test Push (FCM)
    try {
      // Just test if the server key is valid by making a minimal request
      const testPayload = {
        registration_ids: ['test'],
        dry_run: true,
        notification: { title: 'test', body: 'test' },
      };
      
      const response = await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        testPayload,
        {
          headers: {
            'Authorization': `key=${this.config.push.fcm.serverKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      results.push = response.status === 200;
    } catch (error) {
      logger.error('Push configuration test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test Email
    try {
      results.email = await emailService.testConfiguration();
    } catch (error) {
      logger.error('Email configuration test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    logger.info('Notification configuration test completed', results);

    return results;
  }

  /**
   * Shutdown notification service
   */
  async shutdown(): Promise<void> {
    try {
      // Process remaining queue items
      if (this.notificationQueue.length > 0) {
        logger.info('Processing remaining notifications before shutdown', {
          remaining: this.notificationQueue.length,
        });
        
        await this.processNotificationQueue();
      }
      
      logger.info('Notification service shutdown completed');
    } catch (error) {
      logger.error('Notification service shutdown error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Create singleton instance with environment-based configuration
export const notificationService = new ProfessionalNotificationService({
  sms: {
    provider: 'eskiz',
    apiUrl: process.env.ESKIZ_API_URL || 'https://notify.eskiz.uz/api',
    login: process.env.ESKIZ_LOGIN || '',
    password: process.env.ESKIZ_PASSWORD || '',
    from: process.env.ESKIZ_FROM || '4546',
    retryAttempts: parseInt(process.env.SMS_RETRY_ATTEMPTS || '3'),
  },
  push: {
    fcm: {
      serverKey: process.env.FCM_SERVER_KEY || '',
      senderId: process.env.FCM_SENDER_ID || '',
    },
    apn: {
      keyId: process.env.APN_KEY_ID || '',
      teamId: process.env.APN_TEAM_ID || '',
      bundleId: process.env.APN_BUNDLE_ID || 'uz.ultramarket.app',
      production: process.env.NODE_ENV === 'production',
    },
  },
  rateLimit: {
    smsPerMinute: parseInt(process.env.SMS_RATE_LIMIT || '30'),
    emailPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT || '60'),
    pushPerMinute: parseInt(process.env.PUSH_RATE_LIMIT || '1000'),
  },
});

export default notificationService; 