/**
 * 📧 PROFESSIONAL EMAIL SERVICE - UltraMarket Auth
 * 
 * Production-ready email service with multiple providers
 * Queue system, retry logic, templates, monitoring
 * 
 * @author UltraMarket Development Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { createClient } from 'redis';

/**
 * Professional Email Service with Queue System
 * Supports multiple email providers with failover
 */

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
  rateLimit?: number;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  priority?: 'high' | 'normal' | 'low';
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

interface EmailQueueItem {
  id: string;
  data: EmailData;
  provider: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledFor?: Date;
}

class ProfessionalEmailService {
  private transporters: Map<string, nodemailer.Transporter> = new Map();
  private redis: any;
  private isConfigured = false;
  private defaultFrom: string;
  private primaryProvider: string;
  private fallbackProviders: string[];
  private queueName = 'email_queue';
  private processingQueue = false;

  constructor() {
    this.defaultFrom = process.env['EMAIL_FROM'] || 'noreply@ultramarket.com';
    this.primaryProvider = process.env['EMAIL_PRIMARY_PROVIDER'] || 'GMAIL';
    this.fallbackProviders = (process.env['EMAIL_FALLBACK_PROVIDERS'] || 'SENDGRID,MAILGUN').split(',');
    this.initializeRedis();
    this.initializeTransporters();
    this.startQueueProcessor();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = createClient({
        url: process.env['REDIS_URL'] || 'redis://localhost:6379'
      });
      await this.redis.connect();
      logger.info('📧 Email service Redis connected');
    } catch (error) {
      logger.error('❌ Email service Redis connection failed:', error);
    }
  }

  private initializeTransporters(): void {
    const providers = [this.primaryProvider, ...this.fallbackProviders];
    
    providers.forEach(provider => {
      try {
        const config = this.getProviderConfig(provider);
        if (config) {
          const transporter = nodemailer.createTransport(config);
          this.transporters.set(provider, transporter);
          logger.info(`📧 Email provider ${provider} initialized`);
        }
      } catch (error) {
        logger.error(`❌ Email provider ${provider} initialization failed:`, error);
      }
    });

    this.isConfigured = this.transporters.size > 0;
  }

  private getProviderConfig(provider: string): EmailConfig | null {
    switch (provider.toUpperCase()) {
      case 'GMAIL':
        return {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env['GMAIL_USER'] || '',
            pass: process.env['GMAIL_PASSWORD'] || '',
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateLimit: 100
        };

      case 'SENDGRID':
        return {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env['SENDGRID_API_KEY'] || '',
          },
          pool: true,
          maxConnections: 10,
          maxMessages: 200,
          rateLimit: 100
        };

      case 'MAILGUN':
        return {
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: process.env['MAILGUN_USER'] || '',
            pass: process.env['MAILGUN_PASS'] || '',
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateLimit: 100
        };

      case 'AWS_SES':
        return {
          host: process.env['AWS_SES_HOST'] || 'email-smtp.us-east-1.amazonaws.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env['AWS_SES_USER'] || '',
            pass: process.env['AWS_SES_PASS'] || '',
          },
          pool: true,
          maxConnections: 10,
          maxMessages: 200,
          rateLimit: 100
        };

      default:
        return null;
    }
  }

  /**
   * Send email with queue system and retry logic
   */
  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('⚠️ Email service not configured, skipping email send');
      return false;
    }

    try {
      // Add to queue for processing
      const queueItem: EmailQueueItem = {
        id: this.generateEmailId(),
        data,
        provider: this.primaryProvider,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };

      await this.addToQueue(queueItem);
      logger.info('📧 Email queued for sending', { 
        to: data.to, 
        subject: data.subject,
        queueId: queueItem.id 
      });

      return true;
    } catch (error) {
      logger.error('❌ Failed to queue email:', error);
      return false;
    }
  }

  /**
   * Add email to Redis queue
   */
  private async addToQueue(item: EmailQueueItem): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.lPush(this.queueName, JSON.stringify(item));
      await this.redis.expire(this.queueName, 86400); // 24 hours TTL
    } catch (error) {
      logger.error('❌ Failed to add email to queue:', error);
    }
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.processingQueue) return;
      await this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  /**
   * Process email queue
   */
  private async processQueue(): Promise<void> {
    if (!this.redis || this.processingQueue) return;

    this.processingQueue = true;

    try {
      while (true) {
        const item = await this.redis.rPop(this.queueName);
        if (!item) break;

        const queueItem: EmailQueueItem = JSON.parse(item);
        await this.processEmailItem(queueItem);
      }
    } catch (error) {
      logger.error('❌ Queue processing error:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Process individual email item
   */
  private async processEmailItem(item: EmailQueueItem): Promise<void> {
    try {
      const transporter = this.transporters.get(item.provider);
      if (!transporter) {
        await this.retryWithFallback(item);
        return;
      }

      const result = await transporter.sendMail({
        from: item.data.from || this.defaultFrom,
        to: item.data.to,
        subject: item.data.subject,
        html: item.data.html,
        text: item.data.text,
        attachments: item.data.attachments,
        priority: item.data.priority || 'normal'
      });

      logger.info('📧 Email sent successfully', {
        messageId: result.messageId,
        to: item.data.to,
        provider: item.provider,
        queueId: item.id
      });

    } catch (error) {
      logger.error('❌ Email send failed:', error);
      await this.handleEmailError(item, error);
    }
  }

  /**
   * Handle email sending errors with retry logic
   */
  private async handleEmailError(item: EmailQueueItem, error: any): Promise<void> {
    if (item.retryCount < item.maxRetries) {
      item.retryCount++;
      item.scheduledFor = new Date(Date.now() + Math.pow(2, item.retryCount) * 60000); // Exponential backoff
      
      await this.addToQueue(item);
      logger.warn('🔄 Email queued for retry', {
        queueId: item.id,
        retryCount: item.retryCount,
        provider: item.provider
      });
    } else {
      logger.error('❌ Email failed permanently', {
        queueId: item.id,
        to: item.data.to,
        provider: item.provider,
        error: error.message
      });
    }
  }

  /**
   * Retry with fallback provider
   */
  private async retryWithFallback(item: EmailQueueItem): Promise<void> {
    const currentIndex = this.fallbackProviders.indexOf(item.provider);
    const nextProvider = this.fallbackProviders[currentIndex + 1] || this.primaryProvider;

    if (nextProvider !== item.provider) {
      item.provider = nextProvider;
      item.retryCount = 0;
      await this.addToQueue(item);
      logger.info('🔄 Email retried with fallback provider', {
        queueId: item.id,
        newProvider: nextProvider
      });
    }
  }

  /**
   * Generate unique email ID
   */
  private generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send email verification with professional template
   */
  async sendEmailVerification(email: string, token: string, name: string): Promise<boolean> {
    const verificationUrl = `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/verify-email?token=${token}`;
    const template = this.getEmailVerificationTemplate(name, verificationUrl);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'high'
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, token: string, name: string): Promise<boolean> {
    const resetUrl = `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/reset-password?token=${token}`;
    const template = this.getPasswordResetTemplate(name, resetUrl);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'high'
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(name);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'normal'
    });
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(email: string, name: string, activity: string, location: string): Promise<boolean> {
    const template = this.getSecurityAlertTemplate(name, activity, location);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'high'
    });
  }

  /**
   * Send 2FA code
   */
  async send2FACode(email: string, name: string, code: string): Promise<boolean> {
    const template = this.get2FATemplate(name, code);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'high'
    });
  }

  /**
   * Send phone verification code
   */
  async sendPhoneVerification(phone: string, name: string, code: string): Promise<boolean> {
    // For SMS, you would integrate with Twilio, AWS SNS, etc.
    // For now, we'll log it
    logger.info('📱 SMS verification code', {
      phone,
      name,
      code,
      message: `Your UltraMarket verification code is: ${code}`
    });
    
    return true; // Mock SMS sending
  }

  /**
   * Get email verification template
   */
  private getEmailVerificationTemplate(name: string, verificationUrl: string): EmailTemplate {
    return {
      subject: '🔐 Verify Your UltraMarket Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .security { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 UltraMarket</h1>
              <p>Verify Your Account</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Welcome to UltraMarket! Please verify your email address to complete your registration.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              
              <div class="security">
                <h3>🔒 Security Notice</h3>
                <p>This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        Welcome to UltraMarket! Please verify your email address to complete your registration.
        
        Verify your email: ${verificationUrl}
        
        This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
        
        Best regards,
        The UltraMarket Team
      `
    };
  }

  /**
   * Get password reset template
   */
  private getPasswordResetTemplate(name: string, resetUrl: string): EmailTemplate {
    return {
      subject: '🔑 Reset Your UltraMarket Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 UltraMarket</h1>
              <p>Reset Your Password</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              
              <div class="warning">
                <h3>⚠️ Security Warning</h3>
                <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        We received a request to reset your password. Click the link below to create a new password:
        
        Reset password: ${resetUrl}
        
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        
        Best regards,
        The UltraMarket Team
      `
    };
  }

  /**
   * Get welcome template
   */
  private getWelcomeTemplate(name: string): EmailTemplate {
    return {
      subject: '🎉 Welcome to UltraMarket!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to UltraMarket</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9fafb; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #667eea; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 UltraMarket</h1>
              <p>Welcome to the Future of Shopping!</p>
            </div>
            <div class="content">
              <h2>Welcome, ${name}!</h2>
              <p>Thank you for joining UltraMarket! We're excited to have you as part of our community.</p>
              
              <div class="feature">
                <h3>🚀 What's Next?</h3>
                <ul>
                  <li>Complete your profile</li>
                  <li>Browse our products</li>
                  <li>Set up payment methods</li>
                  <li>Enable two-factor authentication</li>
                </ul>
              </div>
              
              <div class="feature">
                <h3>🔒 Security First</h3>
                <p>Your account is protected with industry-standard security measures. We recommend enabling two-factor authentication for extra protection.</p>
              </div>
              
              <div class="feature">
                <h3>📱 Stay Connected</h3>
                <p>Download our mobile app for the best shopping experience on the go!</p>
              </div>
            </div>
            <div class="footer">
              <p>Welcome to the UltraMarket family!</p>
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome, ${name}!
        
        Thank you for joining UltraMarket! We're excited to have you as part of our community.
        
        What's Next?
        - Complete your profile
        - Browse our products
        - Set up payment methods
        - Enable two-factor authentication
        
        Security First:
        Your account is protected with industry-standard security measures. We recommend enabling two-factor authentication for extra protection.
        
        Stay Connected:
        Download our mobile app for the best shopping experience on the go!
        
        Welcome to the UltraMarket family!
        
        Best regards,
        The UltraMarket Team
      `
    };
  }

  /**
   * Get security alert template
   */
  private getSecurityAlertTemplate(name: string, activity: string, location: string): EmailTemplate {
    return {
      subject: '⚠️ Security Alert - UltraMarket Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9fafb; }
            .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .action { background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ UltraMarket Security Alert</h1>
              <p>Account Security Notification</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              
              <div class="alert">
                <h3>🚨 Security Alert</h3>
                <p>We detected ${activity} on your account from ${location}.</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Activity:</strong> ${activity}</p>
              </div>
              
              <div class="action">
                <h3>🔒 If This Was You</h3>
                <p>No action is needed. Your account is secure.</p>
              </div>
              
              <div class="action">
                <h3>🚨 If This Wasn't You</h3>
                <p>Please take immediate action:</p>
                <ol>
                  <li>Change your password immediately</li>
                  <li>Enable two-factor authentication</li>
                  <li>Review your account activity</li>
                  <li>Contact our support team</li>
                </ol>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated security alert. Please do not reply to this email.</p>
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        ⚠️ SECURITY ALERT
        
        We detected ${activity} on your account from ${location}.
        
        Time: ${new Date().toLocaleString()}
        Location: ${location}
        Activity: ${activity}
        
        If this was you, no action is needed.
        
        If this wasn't you, please:
        1. Change your password immediately
        2. Enable two-factor authentication
        3. Review your account activity
        4. Contact our support team
        
        Best regards,
        The UltraMarket Security Team
      `
    };
  }

  /**
   * Get 2FA template
   */
  private get2FATemplate(name: string, code: string): EmailTemplate {
    return {
      subject: '🔐 Your UltraMarket 2FA Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>2FA Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9fafb; }
            .code { background: #f3f4f6; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 UltraMarket</h1>
              <p>Two-Factor Authentication</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Here's your two-factor authentication code:</p>
              
              <div class="code">
                ${code}
              </div>
              
              <p>This code will expire in 5 minutes.</p>
              
              <div class="warning">
                <h3>🔒 Security Notice</h3>
                <p>Never share this code with anyone. UltraMarket will never ask for your 2FA code via email, phone, or text.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        Here's your two-factor authentication code:
        
        ${code}
        
        This code will expire in 5 minutes.
        
        Security Notice:
        Never share this code with anyone. UltraMarket will never ask for your 2FA code via email, phone, or text.
        
        Best regards,
        The UltraMarket Team
      `
    };
  }

  /**
   * Test email service connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // Test primary provider
      const primaryTransporter = this.transporters.get(this.primaryProvider);
      if (primaryTransporter) {
        await primaryTransporter.verify();
        return true;
      }

      // Test fallback providers
      for (const provider of this.fallbackProviders) {
        const transporter = this.transporters.get(provider);
        if (transporter) {
          await transporter.verify();
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('❌ Email service connection test failed:', error);
      return false;
    }
  }

  /**
   * Get email service statistics
   */
  async getStats(): Promise<any> {
    if (!this.redis) return null;

    try {
      const queueLength = await this.redis.lLen(this.queueName);
      const providers = Array.from(this.transporters.keys());
      
      return {
        queueLength,
        providers,
        isConfigured: this.isConfigured,
        primaryProvider: this.primaryProvider,
        fallbackProviders: this.fallbackProviders
      };
    } catch (error) {
      logger.error('❌ Failed to get email stats:', error);
      return null;
    }
  }

  /**
   * Close email service connections
   */
  async close(): Promise<void> {
    try {
      // Close all transporters
      for (const [provider, transporter] of this.transporters) {
        transporter.close();
        logger.info(`📧 ${provider} transporter closed`);
      }

      // Close Redis connection
      if (this.redis) {
        await this.redis.quit();
        logger.info('📧 Email service Redis closed');
      }

      logger.info('📧 Email service connections closed');
    } catch (error) {
      logger.error('❌ Error closing email service connections', { error });
    }
  }
}

export const emailService = new ProfessionalEmailService();
