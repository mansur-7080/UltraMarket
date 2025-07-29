import axios from 'axios';
import { logger } from '@ultramarket/shared';

export interface PushData {
  to: string; // FCM token or device token
  title: string;
  message: string;
  data?: Record<string, any>;
  imageUrl?: string;
  clickAction?: string;
  badge?: number;
  sound?: string;
  priority?: 'normal' | 'high';
  timeToLive?: number;
  metadata?: Record<string, any>;
}

export interface PushResult {
  messageId: string;
  status: string;
  provider: string;
  deviceToken: string;
  sentAt: Date;
}

export interface PushProvider {
  name: string;
  type: 'FCM' | 'APNS';
  serverKey?: string;
  keyId?: string;
  teamId?: string;
  bundleId?: string;
  isActive: boolean;
  priority: number;
}

export class PushService {
  private providers: PushProvider[] = [];
  private fcmServerKey: string = '';
  private apnsConfig: any = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers = [
      {
        name: 'FCM',
        type: 'FCM' as const,
        serverKey: process.env.FCM_SERVER_KEY || '',
        isActive: !!process.env.FCM_SERVER_KEY,
        priority: 1,
      },
      {
        name: 'APNS',
        type: 'APNS' as const,
        keyId: process.env.APNS_KEY_ID || '',
        teamId: process.env.APNS_TEAM_ID || '',
        bundleId: process.env.APNS_BUNDLE_ID || '',
        isActive: !!(
          process.env.APNS_KEY_ID &&
          process.env.APNS_TEAM_ID &&
          process.env.APNS_BUNDLE_ID
        ),
        priority: 2,
      },
    ].filter((provider) => provider.isActive);

    this.fcmServerKey = process.env.FCM_SERVER_KEY || '';

    logger.info('Push notification providers initialized', {
      activeProviders: this.providers.length,
      providers: this.providers.map((p) => p.name),
    });
  }

  async sendPushNotification(data: PushData): Promise<PushResult> {
    if (!this.isValidDeviceToken(data.to)) {
      throw new Error(`Invalid device token: ${data.to}`);
    }

    // Determine provider based on token format
    const provider = this.determineProvider(data.to);

    try {
      logger.info('Sending push notification', {
        provider: provider.name,
        deviceToken: this.maskToken(data.to),
        title: data.title,
      });

      const result = await this.sendWithProvider(provider, data);

      logger.info('Push notification sent successfully', {
        provider: provider.name,
        messageId: result.messageId,
        deviceToken: this.maskToken(data.to),
      });

      return result;
    } catch (error) {
      logger.error('Push notification failed', {
        provider: provider.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceToken: this.maskToken(data.to),
      });
      throw error;
    }
  }

  private async sendWithProvider(provider: PushProvider, data: PushData): Promise<PushResult> {
    switch (provider.type) {
      case 'FCM':
        return this.sendFCMNotification(provider, data);
      case 'APNS':
        return this.sendAPNSNotification(provider, data);
      default:
        throw new Error(`Unsupported push provider: ${provider.type}`);
    }
  }

  private async sendFCMNotification(provider: PushProvider, data: PushData): Promise<PushResult> {
    try {
      const payload = {
        to: data.to,
        priority: data.priority === 'high' ? 'high' : 'normal',
        time_to_live: data.timeToLive || 3600, // 1 hour default
        notification: {
          title: data.title,
          body: data.message,
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: data.sound || 'default',
          badge: data.badge || 1,
          click_action: data.clickAction,
          image: data.imageUrl,
        },
        data: {
          ...data.data,
          timestamp: new Date().toISOString(),
          click_action: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
        },
      };

      const response = await axios.post('https://fcm.googleapis.com/fcm/send', payload, {
        headers: {
          Authorization: `key=${provider.serverKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success !== 1) {
        const error = response.data.results?.[0]?.error || 'Unknown FCM error';
        throw new Error(`FCM notification failed: ${error}`);
      }

      return {
        messageId: response.data.results[0].message_id,
        status: 'sent',
        provider: provider.name,
        deviceToken: data.to,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error('FCM notification error', { error });
      throw error;
    }
  }

  private async sendAPNSNotification(provider: PushProvider, data: PushData): Promise<PushResult> {
    try {
      // For APNS, we need to use HTTP/2 and JWT authentication
      // This is a simplified implementation - in production, use a proper APNS library
      const jwt = this.generateAPNSJWT(provider);

      const payload = {
        aps: {
          alert: {
            title: data.title,
            body: data.message,
          },
          badge: data.badge || 1,
          sound: data.sound || 'default',
          'content-available': 1,
          'mutable-content': 1,
        },
        data: data.data || {},
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(`https://api.push.apple.com/3/device/${data.to}`, payload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
          'apns-topic': provider.bundleId,
          'apns-priority': data.priority === 'high' ? '10' : '5',
          'apns-expiration': data.timeToLive
            ? Math.floor(Date.now() / 1000) + data.timeToLive
            : '0',
        },
      });

      if (response.status !== 200) {
        throw new Error(`APNS notification failed: ${response.statusText}`);
      }

      return {
        messageId: response.headers['apns-id'] || `apns-${Date.now()}`,
        status: 'sent',
        provider: provider.name,
        deviceToken: data.to,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error('APNS notification error', { error });
      throw error;
    }
  }

  private generateAPNSJWT(provider: PushProvider): string {
    // In production, use a proper JWT library like jsonwebtoken
    // This is a simplified implementation
    const header = {
      alg: 'ES256',
      kid: provider.keyId,
    };

    const payload = {
      iss: provider.teamId,
      iat: Math.floor(Date.now() / 1000),
    };

    // For production, implement proper ES256 signing
    // For now, return a placeholder
    return 'placeholder-jwt-token';
  }

  private determineProvider(deviceToken: string): PushProvider {
    // FCM tokens are typically longer and contain specific characters
    // iOS tokens are 64 characters of hex
    if (deviceToken.length === 64 && /^[a-fA-F0-9]+$/.test(deviceToken)) {
      // Likely iOS token
      const apnsProvider = this.providers.find((p) => p.type === 'APNS');
      if (apnsProvider) return apnsProvider;
    }

    // Default to FCM
    const fcmProvider = this.providers.find((p) => p.type === 'FCM');
    if (fcmProvider) return fcmProvider;

    throw new Error('No suitable push notification provider found');
  }

  private isValidDeviceToken(token: string): boolean {
    // Basic validation - tokens should be non-empty and reasonable length
    return token && token.length > 10 && token.length < 500;
  }

  private maskToken(token: string): string {
    if (token.length <= 8) return token;
    return token.substring(0, 4) + '...' + token.substring(token.length - 4);
  }

  async sendBulkNotification(notifications: PushData[]): Promise<{
    successful: number;
    failed: number;
    results: Array<{ success: boolean; result?: PushResult; error?: string }>;
  }> {
    const results = await Promise.allSettled(
      notifications.map((notification) => this.sendPushNotification(notification))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      successful,
      failed,
      results: results.map((result) => ({
        success: result.status === 'fulfilled',
        result: result.status === 'fulfilled' ? result.value : undefined,
        error: result.status === 'rejected' ? result.reason?.message : undefined,
      })),
    };
  }

  async subscribeToTopic(deviceToken: string, topic: string): Promise<void> {
    try {
      const response = await axios.post(
        `https://iid.googleapis.com/iid/v1/${deviceToken}/rel/topics/${topic}`,
        {},
        {
          headers: {
            Authorization: `key=${this.fcmServerKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to subscribe to topic: ${response.statusText}`);
      }

      logger.info('Device subscribed to topic', {
        deviceToken: this.maskToken(deviceToken),
        topic,
      });
    } catch (error) {
      logger.error('Failed to subscribe to topic', { error, topic });
      throw error;
    }
  }

  async unsubscribeFromTopic(deviceToken: string, topic: string): Promise<void> {
    try {
      const response = await axios.delete(
        `https://iid.googleapis.com/iid/v1/${deviceToken}/rel/topics/${topic}`,
        {
          headers: {
            Authorization: `key=${this.fcmServerKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to unsubscribe from topic: ${response.statusText}`);
      }

      logger.info('Device unsubscribed from topic', {
        deviceToken: this.maskToken(deviceToken),
        topic,
      });
    } catch (error) {
      logger.error('Failed to unsubscribe from topic', { error, topic });
      throw error;
    }
  }

  async sendToTopic(topic: string, data: Omit<PushData, 'to'>): Promise<PushResult> {
    try {
      const payload = {
        to: `/topics/${topic}`,
        priority: data.priority === 'high' ? 'high' : 'normal',
        time_to_live: data.timeToLive || 3600,
        notification: {
          title: data.title,
          body: data.message,
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: data.sound || 'default',
          click_action: data.clickAction,
          image: data.imageUrl,
        },
        data: {
          ...data.data,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await axios.post('https://fcm.googleapis.com/fcm/send', payload, {
        headers: {
          Authorization: `key=${this.fcmServerKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success !== 1) {
        throw new Error(`Topic notification failed: ${response.data.error}`);
      }

      return {
        messageId: response.data.message_id,
        status: 'sent',
        provider: 'FCM',
        deviceToken: topic,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error('Topic notification error', { error, topic });
      throw error;
    }
  }

  async getProviderStats(): Promise<
    Array<{
      name: string;
      type: string;
      isActive: boolean;
      priority: number;
    }>
  > {
    return this.providers.map((provider) => ({
      name: provider.name,
      type: provider.type,
      isActive: provider.isActive,
      priority: provider.priority,
    }));
  }
}
