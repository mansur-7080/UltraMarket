/**
 * Email Service for UltraMarket
 * Handles all email operations including SMTP, templates, and various email types
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { createLogger } from '../utils/logger-replacement';

// Optional Prisma import
let PrismaClient: any = null;
try {
  const prisma = require('@prisma/client');
  PrismaClient = prisma.PrismaClient;
} catch (error) {
  console.warn('Prisma not available, using fallback implementation');
  PrismaClient = class MockPrismaClient {
    constructor() {}
    async $connect() {}
    async $disconnect() {}
  };
}

// Create logger instance
const logger = createLogger('email-service');

// Email configuration interface
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string;
}

// Email template interface
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email data interface
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private prisma: typeof PrismaClient;
  private logger = logger;

  constructor(config: EmailConfig) {
    this.config = config;
    this.prisma = new PrismaClient();
    this.initializeTransporter();
  }

  /**
   * Initialize transporter
   */
  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    });

    // Verify connection
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.info('SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('SMTP connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: this.config.host,
        port: this.config.port,
      });
    }
  }

  /**
   * Send email
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
        replyTo: this.config.replyTo,
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: emailData.to,
        subject: emailData.subject,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: emailData.to,
        subject: emailData.subject,
      });
      return false;
    }
  }

  /**
   * Generate verification token
   */
  async generateVerificationToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerification.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordReset.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

    const template = this.getVerificationEmailTemplate(firstName, verificationUrl);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

    const template = this.getPasswordResetEmailTemplate(firstName, resetUrl);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(firstName);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    email: string,
    firstName: string,
    orderNumber: string,
    orderDetails: any
  ): Promise<boolean> {
    const template = this.getOrderConfirmationEmailTemplate(firstName, orderNumber, orderDetails);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdateEmail(
    email: string,
    firstName: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string
  ): Promise<boolean> {
    const template = this.getOrderStatusUpdateEmailTemplate(
      firstName,
      orderNumber,
      status,
      trackingNumber
    );

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(
    email: string,
    firstName: string,
    orderNumber: string,
    amount: number,
    paymentMethod: string
  ): Promise<boolean> {
    const template = this.getPaymentConfirmationEmailTemplate(
      firstName,
      orderNumber,
      amount,
      paymentMethod
    );

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlertEmail(
    email: string,
    firstName: string,
    alertType: string,
    deviceInfo: any
  ): Promise<boolean> {
    const template = this.getSecurityAlertEmailTemplate(firstName, alertType, deviceInfo);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Email Templates

  /**
   * Get verification email template
   */
  private getVerificationEmailTemplate(firstName: string, verificationUrl: string): EmailTemplate {
    return {
      subject: 'Verify Your Email - UltraMarket',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>UltraMarket</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Thank you for registering with UltraMarket. To complete your registration, please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p>${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account with UltraMarket, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName}!
        
        Thank you for registering with UltraMarket. To complete your registration, please verify your email address by visiting this link:
        
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with UltraMarket, you can safely ignore this email.
        
        Best regards,
        The UltraMarket Team
      `,
    };
  }

  /**
   * Get password reset email template
   */
  private getPasswordResetEmailTemplate(firstName: string, resetUrl: string): EmailTemplate {
    return {
      subject: 'Reset Your Password - UltraMarket',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p>${resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName}!
        
        We received a request to reset your password. Please visit this link to create a new password:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email.
        
        Best regards,
        The UltraMarket Team
      `,
    };
  }

  /**
   * Get welcome email template
   */
  private getWelcomeEmailTemplate(firstName: string): EmailTemplate {
    return {
      subject: 'Welcome to UltraMarket!',
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
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to UltraMarket!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Welcome to UltraMarket! We're excited to have you as part of our community.</p>
              <p>Here's what you can do with your new account:</p>
              <ul>
                <li>Browse our extensive product catalog</li>
                <li>Create wishlists and save your favorite items</li>
                <li>Track your orders in real-time</li>
                <li>Get personalized recommendations</li>
                <li>Earn rewards and discounts</li>
              </ul>
              <p>If you have any questions, our support team is here to help!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName}!
        
        Welcome to UltraMarket! We're excited to have you as part of our community.
        
        Here's what you can do with your new account:
        - Browse our extensive product catalog
        - Create wishlists and save your favorite items
        - Track your orders in real-time
        - Get personalized recommendations
        - Earn rewards and discounts
        
        If you have any questions, our support team is here to help!
        
        Best regards,
        The UltraMarket Team
      `,
    };
  }

  /**
   * Get order confirmation email template
   */
  private getOrderConfirmationEmailTemplate(
    firstName: string,
    orderNumber: string,
    orderDetails: any
  ): EmailTemplate {
    return {
      subject: `Order Confirmation #${orderNumber} - UltraMarket`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Thank you for your order! We've received your order and it's being processed.</p>
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> $${orderDetails.total}</p>
              </div>
              <p>We'll send you updates as your order progresses.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName}!
        
        Thank you for your order! We've received your order and it's being processed.
        
        Order Details:
        - Order Number: ${orderNumber}
        - Order Date: ${new Date().toLocaleDateString()}
        - Total Amount: $${orderDetails.total}
        
        We'll send you updates as your order progresses.
        
        Best regards,
        The UltraMarket Team
      `,
    };
  }

  /**
   * Get order status update email template
   */
  private getOrderStatusUpdateEmailTemplate(
    firstName: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string
  ): EmailTemplate {
    return {
      subject: `Order Status Update #${orderNumber} - UltraMarket`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .status-update { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Status Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Your order status has been updated.</p>
              <div class="status-update">
                <h3>Order #${orderNumber}</h3>
                <p><strong>New Status:</strong> ${status}</p>
                ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
              </div>
              <p>You can track your order in your account dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName}!
        
        Your order status has been updated.
        
        Order #${orderNumber}
        New Status: ${status}
        ${trackingNumber ? `Tracking Number: ${trackingNumber}` : ''}
        
        You can track your order in your account dashboard.
        
        Best regards,
        The UltraMarket Team
      `,
    };
  }

  /**
   * Get payment confirmation email template
   */
  private getPaymentConfirmationEmailTemplate(
    firstName: string,
    orderNumber: string,
    amount: number,
    paymentMethod: string
  ): EmailTemplate {
    return {
      subject: `Payment Confirmation #${orderNumber} - UltraMarket`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .payment-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Your payment has been successfully processed.</p>
              <div class="payment-details">
                <h3>Payment Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Amount:</strong> $${amount}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <p>Thank you for your purchase!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName}!
        
        Your payment has been successfully processed.
        
        Payment Details:
        - Order Number: ${orderNumber}
        - Amount: $${amount}
        - Payment Method: ${paymentMethod}
        - Date: ${new Date().toLocaleDateString()}
        
        Thank you for your purchase!
        
        Best regards,
        The UltraMarket Team
      `,
    };
  }

  /**
   * Get security alert email template
   */
  private getSecurityAlertEmailTemplate(
    firstName: string,
    alertType: string,
    deviceInfo: any
  ): EmailTemplate {
    return {
      subject: `Security Alert - UltraMarket`,
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
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .alert-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Security Alert</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>We detected unusual activity on your account.</p>
              <div class="alert-details">
                <h3>Alert Details</h3>
                <p><strong>Alert Type:</strong> ${alertType}</p>
                <p><strong>Device:</strong> ${deviceInfo.userAgent || 'Unknown'}</p>
                <p><strong>IP Address:</strong> ${deviceInfo.ipAddress || 'Unknown'}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>If this wasn't you, please change your password immediately.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 UltraMarket. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName}!
        
        We detected unusual activity on your account.
        
        Alert Details:
        - Alert Type: ${alertType}
        - Device: ${deviceInfo.userAgent || 'Unknown'}
        - IP Address: ${deviceInfo.ipAddress || 'Unknown'}
        - Time: ${new Date().toLocaleString()}
        
        If this wasn't you, please change your password immediately.
        
        Best regards,
        The UltraMarket Team
      `,
    };
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();

      // Clean up expired email verifications
      await this.prisma.emailVerification.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      // Clean up expired password resets
      await this.prisma.passwordReset.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      this.logger.info('Expired tokens cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
