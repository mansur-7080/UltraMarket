import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';

export interface NotificationData {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  scheduledAt?: Date;
}

export interface SMSProvider {
  name: string;
  apiUrl: string;
  apiKey: string;
  sender: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransporter: nodemailer.Transporter;
  private smsProviders: SMSProvider[];

  constructor(
    private configService: ConfigService,
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>
  ) {
    this.initializeEmailTransporter();
    this.initializeSMSProviders();
  }

  private initializeEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private initializeSMSProviders() {
    // O'zbekiston SMS provayderlari
    this.smsProviders = [
      {
        name: 'ESKIZ',
        apiUrl: 'https://notify.eskiz.uz/api',
        apiKey: this.configService.get('ESKIZ_API_KEY'),
        sender: this.configService.get('ESKIZ_SENDER'),
      },
      {
        name: 'PLAY_MOBILE',
        apiUrl: 'https://send.smsxabar.uz/broker-api',
        apiKey: this.configService.get('PLAY_MOBILE_API_KEY'),
        sender: this.configService.get('PLAY_MOBILE_SENDER'),
      },
    ];
  }

  async sendNotification(notificationData: NotificationData): Promise<void> {
    try {
      const notification = this.notificationRepository.create({
        type: notificationData.type,
        recipient: notificationData.recipient,
        template: notificationData.template,
        data: notificationData.data,
        priority: notificationData.priority || 'medium',
        scheduledAt: notificationData.scheduledAt || new Date(),
        status: 'pending',
      });

      await this.notificationRepository.save(notification);

      if (notificationData.scheduledAt && notificationData.scheduledAt > new Date()) {
        // Schedule for later
        this.scheduleNotification(notification);
        return;
      }

      switch (notificationData.type) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
      }
    } catch (error) {
      this.logger.error('Notification yuborishda xatolik:', error);
      throw error;
    }
  }

  private async sendEmail(notification: NotificationEntity): Promise<void> {
    try {
      const template = await this.getTemplate(notification.template, 'email');
      const content = this.renderTemplate(template.content, notification.data);
      const subject = this.renderTemplate(template.subject, notification.data);

      await this.emailTransporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: notification.recipient,
        subject,
        html: content,
      });

      notification.status = 'sent';
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

      this.logger.log(`Email yuborildi: ${notification.recipient}`);
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
      await this.notificationRepository.save(notification);
      throw error;
    }
  }

  private async sendSMS(notification: NotificationEntity): Promise<void> {
    try {
      const template = await this.getTemplate(notification.template, 'sms');
      const content = this.renderTemplate(template.content, notification.data);

      // Try primary SMS provider first
      let sent = false;
      for (const provider of this.smsProviders) {
        try {
          await this.sendSMSWithProvider(provider, notification.recipient, content);
          sent = true;
          break;
        } catch (error) {
          this.logger.warn(`SMS yuborishda xatolik (${provider.name}):`, error);
          continue;
        }
      }

      if (!sent) {
        throw new Error('Barcha SMS provayderlar ishlamadi');
      }

      notification.status = 'sent';
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

      this.logger.log(`SMS yuborildi: ${notification.recipient}`);
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
      await this.notificationRepository.save(notification);
      throw error;
    }
  }

  private async sendSMSWithProvider(
    provider: SMSProvider,
    recipient: string,
    message: string
  ): Promise<void> {
    const phoneNumber = this.normalizePhoneNumber(recipient);

    if (provider.name === 'ESKIZ') {
      await this.sendEskizSMS(provider, phoneNumber, message);
    } else if (provider.name === 'PLAY_MOBILE') {
      await this.sendPlayMobileSMS(provider, phoneNumber, message);
    }
  }

  private async sendEskizSMS(
    provider: SMSProvider,
    phoneNumber: string,
    message: string
  ): Promise<void> {
    const response = await axios.post(
      `${provider.apiUrl}/message/sms/send`,
      {
        mobile_phone: phoneNumber,
        message,
        from: provider.sender,
      },
      {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
        },
      }
    );

    if (response.data.status !== 'success') {
      throw new Error(`ESKIZ SMS xatolik: ${response.data.message}`);
    }
  }

  private async sendPlayMobileSMS(
    provider: SMSProvider,
    phoneNumber: string,
    message: string
  ): Promise<void> {
    const response = await axios.post(
      `${provider.apiUrl}/send`,
      {
        messages: [
          {
            recipient: phoneNumber,
            'message-id': `msg_${Date.now()}`,
            sms: {
              originator: provider.sender,
              content: {
                text: message,
              },
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Play Mobile SMS xatolik: ${response.statusText}`);
    }
  }

  private async sendPushNotification(notification: NotificationEntity): Promise<void> {
    try {
      const template = await this.getTemplate(notification.template, 'push');
      const title = this.renderTemplate(template.subject, notification.data);
      const body = this.renderTemplate(template.content, notification.data);

      // Firebase Cloud Messaging orqali push notification
      const response = await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        {
          to: notification.recipient, // FCM token
          notification: {
            title,
            body,
            icon: 'icon-192x192.png',
            badge: 'badge-72x72.png',
          },
          data: notification.data,
        },
        {
          headers: {
            Authorization: `key=${this.configService.get('FCM_SERVER_KEY')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success !== 1) {
        throw new Error(`Push notification xatolik: ${JSON.stringify(response.data)}`);
      }

      notification.status = 'sent';
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

      this.logger.log(`Push notification yuborildi: ${notification.recipient}`);
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
      await this.notificationRepository.save(notification);
      throw error;
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // O'zbekiston telefon raqamlarini normalizatsiya qilish
    let normalized = phoneNumber.replace(/[^\d+]/g, '');

    if (normalized.startsWith('998')) {
      normalized = '+' + normalized;
    } else if (normalized.startsWith('8')) {
      normalized = '+998' + normalized.substring(1);
    } else if (normalized.length === 9) {
      normalized = '+998' + normalized;
    }

    return normalized;
  }

  private async getTemplate(templateName: string, type: string): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({
      where: { name: templateName, type },
    });

    if (!template) {
      throw new Error(`Template topilmadi: ${templateName} (${type})`);
    }

    return template;
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(placeholder, String(value));
    }

    return rendered;
  }

  private scheduleNotification(notification: NotificationEntity): void {
    const delay = notification.scheduledAt.getTime() - Date.now();

    setTimeout(async () => {
      try {
        await this.sendNotification({
          type: notification.type as any,
          recipient: notification.recipient,
          template: notification.template,
          data: notification.data,
          priority: notification.priority as any,
        });
      } catch (error) {
        this.logger.error('Scheduled notification xatolik:', error);
      }
    }, delay);
  }

  // Bulk notification methods
  async sendBulkNotifications(notifications: NotificationData[]): Promise<void> {
    const promises = notifications.map((notification) =>
      this.sendNotification(notification).catch((error) => {
        this.logger.error(`Bulk notification xatolik: ${notification.recipient}`, error);
        return null;
      })
    );

    await Promise.all(promises);
  }

  // Analytics methods
  async getNotificationStats(startDate: Date, endDate: Date) {
    const stats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select(['notification.type', 'notification.status', 'COUNT(*) as count'])
      .where('notification.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('notification.type, notification.status')
      .getRawMany();

    return stats;
  }

  async getFailedNotifications(limit: number = 100) {
    return await this.notificationRepository.find({
      where: { status: 'failed' },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = await this.getFailedNotifications();

    for (const notification of failedNotifications) {
      try {
        await this.sendNotification({
          type: notification.type as any,
          recipient: notification.recipient,
          template: notification.template,
          data: notification.data,
          priority: notification.priority as any,
        });
      } catch (error) {
        this.logger.error(`Retry failed notification xatolik: ${notification.id}`, error);
      }
    }
  }
}
