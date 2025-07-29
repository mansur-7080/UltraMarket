import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Welcome to UltraMarket!',
        html: `
          <h1>Welcome to UltraMarket, ${firstName}!</h1>
          <p>Thank you for joining our platform. We're excited to have you as part of our community.</p>
          <p>Start exploring our products and enjoy your shopping experience!</p>
          <br>
          <p>Best regards,<br>The UltraMarket Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <h1>Verify Your Email Address</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <br>
          <p>Best regards,<br>The UltraMarket Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending verification email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Reset Your Password',
        html: `
          <h1>Reset Your Password</h1>
          <p>You requested to reset your password. Click the link below to create a new password:</p>
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <br>
          <p>Best regards,<br>The UltraMarket Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send password reset confirmation
   */
  async sendPasswordResetConfirmation(email: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Password Reset Successful',
        html: `
          <h1>Password Reset Successful</h1>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <br>
          <p>Best regards,<br>The UltraMarket Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset confirmation sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending password reset confirmation:', error);
      throw error;
    }
  }

  /**
   * Send password change notification
   */
  async sendPasswordChangeNotification(email: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Password Changed',
        html: `
          <h1>Password Changed</h1>
          <p>Your password has been successfully changed.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <br>
          <p>Best regards,<br>The UltraMarket Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password change notification sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending password change notification:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(email: string, orderId: string, orderDetails: any): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: `Order Confirmation - #${orderId}`,
        html: `
          <h1>Order Confirmation</h1>
          <p>Thank you for your order! Your order has been confirmed.</p>
          <h2>Order Details:</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
          <p><strong>Status:</strong> ${orderDetails.status}</p>
          <br>
          <p>We'll send you updates on your order status.</p>
          <br>
          <p>Best regards,<br>The UltraMarket Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Order confirmation sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending order confirmation:', error);
      throw error;
    }
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(email: string, orderId: string, status: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: `Order Status Update - #${orderId}`,
        html: `
          <h1>Order Status Update</h1>
          <p>Your order status has been updated.</p>
          <h2>Order Details:</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>New Status:</strong> ${status}</p>
          <br>
          <p>Track your order in your account dashboard.</p>
          <br>
          <p>Best regards,<br>The UltraMarket Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Order status update sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending order status update:', error);
      throw error;
    }
  }

  /**
   * Send account deactivation notification
   */
  async sendAccountDeactivationNotification(email: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Account Deactivated',
        html: `
          <h1>Account Deactivated</h1>
          <p>Your account has been deactivated as requested.</p>
          <p>If you want to reactivate your account, please contact our support team.</p>
          <br>
          <p>Best regards,<br>The UltraMarket Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Account deactivation notification sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending account deactivation notification:', error);
      throw error;
    }
  }
}
