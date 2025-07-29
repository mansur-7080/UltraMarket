import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

export interface SMSData {
  to: string;
  message: string;
  from?: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  cost?: number;
}

export interface ESKIZTokenResponse {
  message: string;
  data: {
    token: string;
  };
}

export interface ESKIZSendResponse {
  message: string;
  data: {
    id: number;
    message: string;
    status: string;
  };
}

export interface PlayMobileResponse {
  status: string;
  message_id?: string;
  error?: string;
}

export class SMSService {
  private eskizToken: string | null = null;
  private eskizTokenExpiry: Date | null = null;
  private readonly eskizBaseUrl = 'https://notify.eskiz.uz/api';
  private readonly playMobileBaseUrl = 'https://send.smsxabar.uz/broker-api';

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize SMS providers
   */
  private async initializeProviders(): Promise<void> {
    try {
      // Initialize ESKIZ token
      await this.refreshESKIZToken();

      logger.info('SMS providers initialized successfully', {
        providers: ['ESKIZ', 'Play Mobile'],
      });
    } catch (error) {
      logger.error('Failed to initialize SMS providers:', error);
    }
  }

  /**
   * Send SMS using the best available provider
   */
  public async sendSMS(smsData: SMSData): Promise<SMSResult> {
    try {
      // Validate phone number format
      const phoneNumber = this.normalizePhoneNumber(smsData.to);
      if (!this.isValidUzbekPhoneNumber(phoneNumber)) {
        throw new Error('Invalid Uzbekistan phone number format');
      }

      // Try ESKIZ first (usually more reliable)
      try {
        const eskizResult = await this.sendViaESKIZ({
          ...smsData,
          to: phoneNumber,
        });

        if (eskizResult.success) {
          logger.info('SMS sent successfully via ESKIZ', {
            to: phoneNumber,
            messageId: eskizResult.messageId,
          });
          return eskizResult;
        }
      } catch (eskizError) {
        logger.warn('ESKIZ SMS failed, trying Play Mobile:', eskizError);
      }

      // Fallback to Play Mobile
      try {
        const playMobileResult = await this.sendViaPlayMobile({
          ...smsData,
          to: phoneNumber,
        });

        if (playMobileResult.success) {
          logger.info('SMS sent successfully via Play Mobile', {
            to: phoneNumber,
            messageId: playMobileResult.messageId,
          });
          return playMobileResult;
        }
      } catch (playMobileError) {
        logger.error('Play Mobile SMS also failed:', playMobileError);
      }

      // Both providers failed
      throw new Error('All SMS providers failed');
    } catch (error) {
      logger.error('SMS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'none',
      };
    }
  }

  /**
   * Send SMS via ESKIZ
   */
  private async sendViaESKIZ(smsData: SMSData): Promise<SMSResult> {
    try {
      // Ensure we have a valid token
      await this.ensureValidESKIZToken();

      const response: AxiosResponse<ESKIZSendResponse> = await axios.post(
        `${this.eskizBaseUrl}/message/sms/send`,
        {
          mobile_phone: smsData.to,
          message: smsData.message,
          from: smsData.from || process.env.ESKIZ_FROM || '4546',
        },
        {
          headers: {
            Authorization: `Bearer ${this.eskizToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.data && response.data.data.id) {
        return {
          success: true,
          messageId: response.data.data.id.toString(),
          provider: 'ESKIZ',
        };
      } else {
        throw new Error(response.data.message || 'Unknown ESKIZ error');
      }
    } catch (error) {
      logger.error('ESKIZ SMS error:', error);
      throw error;
    }
  }

  /**
   * Send SMS via Play Mobile
   */
  private async sendViaPlayMobile(smsData: SMSData): Promise<SMSResult> {
    try {
      const response: AxiosResponse<PlayMobileResponse> = await axios.post(
        `${this.playMobileBaseUrl}/send`,
        {
          messages: [
            {
              recipient: smsData.to,
              'message-id': `msg_${Date.now()}`,
              sms: {
                originator: smsData.from || process.env.PLAY_MOBILE_FROM || 'UltraMarket',
                content: {
                  text: smsData.message,
                },
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.PLAY_MOBILE_LOGIN}:${process.env.PLAY_MOBILE_PASSWORD}`
            ).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.status === 'ok' && response.data.message_id) {
        return {
          success: true,
          messageId: response.data.message_id,
          provider: 'Play Mobile',
        };
      } else {
        throw new Error(response.data.error || 'Unknown Play Mobile error');
      }
    } catch (error) {
      logger.error('Play Mobile SMS error:', error);
      throw error;
    }
  }

  /**
   * Refresh ESKIZ authentication token
   */
  private async refreshESKIZToken(): Promise<void> {
    try {
      const response: AxiosResponse<ESKIZTokenResponse> = await axios.post(
        `${this.eskizBaseUrl}/auth/login`,
        {
          email: process.env.ESKIZ_EMAIL,
          password: process.env.ESKIZ_PASSWORD,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.data && response.data.data.token) {
        this.eskizToken = response.data.data.token;
        this.eskizTokenExpiry = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000); // 29 days

        logger.info('ESKIZ token refreshed successfully');
      } else {
        throw new Error('Failed to get ESKIZ token');
      }
    } catch (error) {
      logger.error('Failed to refresh ESKIZ token:', error);
      throw error;
    }
  }

  /**
   * Ensure ESKIZ token is valid
   */
  private async ensureValidESKIZToken(): Promise<void> {
    if (!this.eskizToken || !this.eskizTokenExpiry || this.eskizTokenExpiry < new Date()) {
      await this.refreshESKIZToken();
    }
  }

  /**
   * Normalize Uzbekistan phone number
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let normalized = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (normalized.startsWith('998')) {
      return `+${normalized}`;
    } else if (normalized.startsWith('8')) {
      return `+99${normalized}`;
    } else if (normalized.length === 9) {
      return `+998${normalized}`;
    } else if (normalized.length === 12 && normalized.startsWith('998')) {
      return `+${normalized}`;
    }

    return `+998${normalized}`;
  }

  /**
   * Validate Uzbekistan phone number
   */
  private isValidUzbekPhoneNumber(phoneNumber: string): boolean {
    // Uzbekistan phone number pattern: +998XXXXXXXXX
    const uzbekPattern = /^\+998[0-9]{9}$/;
    return uzbekPattern.test(phoneNumber);
  }

  /**
   * Send bulk SMS
   */
  public async sendBulkSMS(smsDataList: SMSData[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];

    // Process in batches to avoid overwhelming the providers
    const batchSize = 10;
    for (let i = 0; i < smsDataList.length; i += batchSize) {
      const batch = smsDataList.slice(i, i + batchSize);

      const batchPromises = batch.map(async (smsData) => {
        try {
          return await this.sendSMS(smsData);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'none',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < smsDataList.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.info('Bulk SMS completed', {
      total: smsDataList.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });

    return results;
  }

  /**
   * Get SMS delivery status
   */
  public async getDeliveryStatus(messageId: string, provider: string): Promise<any> {
    try {
      if (provider === 'ESKIZ') {
        return await this.getESKIZDeliveryStatus(messageId);
      } else if (provider === 'Play Mobile') {
        return await this.getPlayMobileDeliveryStatus(messageId);
      } else {
        throw new Error('Unknown SMS provider');
      }
    } catch (error) {
      logger.error('Failed to get delivery status:', error);
      throw error;
    }
  }

  /**
   * Get ESKIZ delivery status
   */
  private async getESKIZDeliveryStatus(messageId: string): Promise<any> {
    await this.ensureValidESKIZToken();

    const response = await axios.get(`${this.eskizBaseUrl}/message/sms/status/${messageId}`, {
      headers: {
        Authorization: `Bearer ${this.eskizToken}`,
      },
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Get Play Mobile delivery status
   */
  private async getPlayMobileDeliveryStatus(messageId: string): Promise<any> {
    const response = await axios.get(`${this.playMobileBaseUrl}/dlr/${messageId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.PLAY_MOBILE_LOGIN}:${process.env.PLAY_MOBILE_PASSWORD}`
        ).toString('base64')}`,
      },
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Get SMS pricing
   */
  public async getSMSPricing(): Promise<any> {
    try {
      await this.ensureValidESKIZToken();

      const response = await axios.get(`${this.eskizBaseUrl}/user/get-limit`, {
        headers: {
          Authorization: `Bearer ${this.eskizToken}`,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get SMS pricing:', error);
      throw error;
    }
  }

  /**
   * Test SMS providers connectivity
   */
  public async testProviders(): Promise<{ eskiz: boolean; playMobile: boolean }> {
    const results = {
      eskiz: false,
      playMobile: false,
    };

    // Test ESKIZ
    try {
      await this.ensureValidESKIZToken();
      results.eskiz = true;
    } catch (error) {
      logger.error('ESKIZ test failed:', error);
    }

    // Test Play Mobile (basic connectivity test)
    try {
      await axios.get(`${this.playMobileBaseUrl}/ping`, {
        timeout: 5000,
      });
      results.playMobile = true;
    } catch (error) {
      logger.error('Play Mobile test failed:', error);
    }

    return results;
  }
}
