/**
 * 📧 PROFESSIONAL EMAIL SERVICE - UltraMarket Auth
 * 
 * O'zbekiston email service providers bilan professional integration
 * Secure, scalable, va monitored email system
 * 
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import { 
  professionalLogger as logger, 
  createProfessionalLogger as createLogger 
} from '@ultramarket/shared';
import { secureEnvManager } from '@ultramarket/shared';
import { 
  ApplicationError, 
  ErrorCodes,
  createBusinessError,
  asyncHandler 
} from '@ultramarket/shared';
import { professionalPerformanceOptimizer as performanceOptimizer } from '@ultramarket/shared';
import { JWTService } from './jwt.service';
import { prisma } from '../index';
import nodemailer, { Transporter } from 'nodemailer';
import * as crypto from 'crypto';

// Email service logger
const emailLogger = createLogger('auth-email-service');

// Email templates for Uzbekistan
const EMAIL_TEMPLATES = {
  verification: {
    subject: {
      uz: '📧 UltraMarket - Email manzilni tasdiqlang',
      en: '📧 UltraMarket - Verify your email address'
    },
    template: 'email-verification-uz.html'
  },
  passwordReset: {
    subject: {
      uz: '🔐 UltraMarket - Parolni tiklash',
      en: '🔐 UltraMarket - Password Reset'
    },
    template: 'password-reset-uz.html'
  },
  welcome: {
    subject: {
      uz: '🎉 UltraMarket ga xush kelibsiz!',
      en: '🎉 Welcome to UltraMarket!'
    },
    template: 'welcome-uz.html'
  },
  orderConfirmation: {
    subject: {
      uz: '📦 Buyurtma tasdiqlangi - UltraMarket',
      en: '📦 Order Confirmation - UltraMarket'
    },
    template: 'order-confirmation-uz.html'
  }
};

// Email configuration interface
interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  from: {
    name: string;
    email: string;
  };
  rateLimits: {
    verification: number; // per hour
    passwordReset: number; // per hour
    marketing: number; // per day
  };
}

export interface EmailTemplate {
  to: string;
  firstName: string;
  template: keyof typeof EMAIL_TEMPLATES;
  data?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  correlationId?: string;
}

/**
 * Professional Email Service
 */
export class EmailService {
  private jwtService: JWTService;
  private transporter: Transporter | null = null;
  private emailConfig: EmailConfig;
  private rateLimitTracker = new Map<string, { count: number; resetTime: number }>();
  
  constructor() {
    this.jwtService = new JWTService();
    this.emailConfig = this.loadEmailConfig();
    this.initializeTransporter();
    
    emailLogger.info('📧 Professional Email Service initialized', {
      provider: this.emailConfig.sendgrid ? 'SendGrid' : 'SMTP',
      fromEmail: this.emailConfig.from.email
    });
  }

  /**
   * Load email configuration from secure environment
   */
  private loadEmailConfig(): EmailConfig {
    try {
      const config: EmailConfig = {
        smtp: {
          host: secureEnvManager.getConfig('SMTP_HOST', 'smtp.gmail.com'),
          port: parseInt(secureEnvManager.getConfig('SMTP_PORT', '587')),
          secure: secureEnvManager.getConfig('SMTP_SECURE') === 'true',
          auth: {
            user: secureEnvManager.getConfig('SMTP_USER', 'notifications@ultramarket.uz'),
            pass: secureEnvManager.getConfig('SMTP_PASSWORD', '')
          }
        },
        sendgrid: secureEnvManager.getConfig('SENDGRID_API_KEY') ? {
          apiKey: secureEnvManager.getConfig('SENDGRID_API_KEY', '')
        } : undefined,
        from: {
          name: 'UltraMarket O\'zbekiston',
          email: secureEnvManager.getConfig('EMAIL_FROM', 'noreply@ultramarket.uz')
        },
        rateLimits: {
          verification: parseInt(secureEnvManager.getConfig('EMAIL_RATE_LIMIT_VERIFICATION', '10')),
          passwordReset: parseInt(secureEnvManager.getConfig('EMAIL_RATE_LIMIT_PASSWORD', '5')),
          marketing: parseInt(secureEnvManager.getConfig('EMAIL_RATE_LIMIT_MARKETING', '50'))
        }
      };

      return config;
    } catch (error) {
      emailLogger.error('❌ Failed to load email configuration', error);
      throw new ApplicationError(
        ErrorCodes.EMAIL_SERVICE_ERROR,
        'Email service konfiguratsiyasi yuklanmadi',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Initialize email transporter
   */
  private async initializeTransporter(): Promise<void> {
    try {
      if (this.emailConfig.sendgrid?.apiKey) {
        // Use SendGrid if available
        emailLogger.info('🚀 Initializing SendGrid transporter');
        // SendGrid implementation would go here
      } else if (this.emailConfig.smtp.auth.pass) {
        // Use SMTP
        this.transporter = nodemailer.createTransporter({
          host: this.emailConfig.smtp.host,
          port: this.emailConfig.smtp.port,
          secure: this.emailConfig.smtp.secure,
          auth: {
            user: this.emailConfig.smtp.auth.user,
            pass: this.emailConfig.smtp.auth.pass
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateLimit: 10 // 10 emails per second max
        });

        // Verify connection
        await this.transporter.verify();
        emailLogger.info('✅ SMTP transporter initialized and verified');
      } else {
        emailLogger.warn('⚠️ No email configuration found, running in test mode');
      }
    } catch (error) {
      emailLogger.error('❌ Failed to initialize email transporter', error);
      throw new ApplicationError(
        ErrorCodes.EMAIL_SERVICE_ERROR,
        'Email transport sozlanmadi',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Check rate limits for email sending
   */
  private checkRateLimit(email: string, type: keyof EmailConfig['rateLimits']): void {
    const key = `${email}:${type}`;
    const now = Date.now();
    const limit = this.emailConfig.rateLimits[type];
    const windowMs = type === 'marketing' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    
    const existing = this.rateLimitTracker.get(key);
    
    if (!existing || now > existing.resetTime) {
      // Reset or create new tracking
      this.rateLimitTracker.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return;
    }
    
    if (existing.count >= limit) {
      emailLogger.warn('📧 Email rate limit exceeded', {
        email: this.sanitizeEmail(email),
        type,
        count: existing.count,
        limit
      });
      
      throw new ApplicationError(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        `Juda ko'p ${type} email yuborildi. Keyinroq qayta urinib ko'ring.`,
        { 
          type, 
          limit, 
          resetTime: new Date(existing.resetTime).toISOString() 
        }
      );
    }
    
    existing.count++;
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    email: string, 
    firstName: string,
    correlationId?: string
  ): Promise<{ success: boolean; verificationLink?: string }> {
    const startTime = Date.now();
    
    try {
      emailLogger.info('📧 Starting email verification process', {
        email: this.sanitizeEmail(email),
        firstName,
        correlationId
      });

      // Rate limit check
      this.checkRateLimit(email, 'verification');

      // Find user by email with optimized query
      const user = await performanceOptimizer.executeOptimizedQuery(async (tx) => {
        return await tx.user.findUnique({
          where: { email },
          select: { id: true, email: true, firstName: true, isEmailVerified: true }
        });
      });

      if (!user) {
        throw new ApplicationError(
          ErrorCodes.USER_NOT_FOUND,
          'Foydalanuvchi topilmadi',
          { email: this.sanitizeEmail(email) },
          correlationId
        );
      }

      if (user.isEmailVerified) {
        emailLogger.warn('⚠️ User already verified', {
          email: this.sanitizeEmail(email),
          userId: user.id
        });
        return { success: true };
      }

      // Generate secure verification token
      const token = await this.jwtService.generateVerificationToken(user.id);

      // Save verification token to database
      await performanceOptimizer.executeTransaction(async (tx) => {
        // Delete any existing verification tokens
        await tx.emailVerification.deleteMany({
          where: { userId: user.id }
        });

        // Create new verification token
        await tx.emailVerification.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            createdAt: new Date()
          }
        });
      });

      const verificationLink = `${secureEnvManager.getConfig('FRONTEND_URL', 'https://ultramarket.uz')}/verify-email?token=${token}`;

      // Send email
      if (this.transporter || this.emailConfig.sendgrid) {
        await this.sendTemplatedEmail({
          to: email,
          firstName,
          template: 'verification',
          data: {
            verificationLink,
            firstName,
            companyName: 'UltraMarket O\'zbekiston',
            supportEmail: this.emailConfig.from.email
          },
          priority: 'high',
          correlationId
        });
      }

      const duration = Date.now() - startTime;
      emailLogger.info('✅ Email verification sent successfully', {
        email: this.sanitizeEmail(email),
        firstName,
        duration: `${duration}ms`,
        correlationId
      });

      return {
        success: true,
        verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      emailLogger.error('❌ Failed to send verification email', error, {
        email: this.sanitizeEmail(email),
        firstName,
        duration: `${duration}ms`,
        correlationId
      });

      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError(
        ErrorCodes.EMAIL_SERVICE_ERROR,
        'Tasdiqlash emaili yuborilmadi',
        { 
          originalError: error instanceof Error ? error.message : 'Unknown error',
          email: this.sanitizeEmail(email)
        },
        correlationId
      );
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
    correlationId?: string
  ): Promise<{ success: boolean; resetLink?: string }> {
    const startTime = Date.now();
    
    try {
      emailLogger.info('🔐 Starting password reset email process', {
        email: this.sanitizeEmail(email),
        firstName,
        correlationId
      });

      // Rate limit check
      this.checkRateLimit(email, 'passwordReset');

      const resetLink = `${secureEnvManager.getConfig('FRONTEND_URL', 'https://ultramarket.uz')}/reset-password?token=${resetToken}`;

      // Send email
      if (this.transporter || this.emailConfig.sendgrid) {
        await this.sendTemplatedEmail({
          to: email,
          firstName,
          template: 'passwordReset',
          data: {
            resetLink,
            firstName,
            companyName: 'UltraMarket O\'zbekiston',
            supportEmail: this.emailConfig.from.email,
            expirationHours: '24'
          },
          priority: 'high',
          correlationId
        });
      }

      const duration = Date.now() - startTime;
      emailLogger.info('✅ Password reset email sent successfully', {
        email: this.sanitizeEmail(email),
        firstName,
        duration: `${duration}ms`,
        correlationId
      });

      return {
        success: true,
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      emailLogger.error('❌ Failed to send password reset email', error, {
        email: this.sanitizeEmail(email),
        firstName,
        duration: `${duration}ms`,
        correlationId
      });

      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError(
        ErrorCodes.EMAIL_SERVICE_ERROR,
        'Parol tiklash emaili yuborilmadi',
        { 
          originalError: error instanceof Error ? error.message : 'Unknown error',
          email: this.sanitizeEmail(email)
        },
        correlationId
      );
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string, 
    firstName: string,
    correlationId?: string
  ): Promise<{ success: boolean }> {
    const startTime = Date.now();
    
    try {
      emailLogger.info('🎉 Starting welcome email process', {
        email: this.sanitizeEmail(email),
        firstName,
        correlationId
      });

      // Send email
      if (this.transporter || this.emailConfig.sendgrid) {
        await this.sendTemplatedEmail({
          to: email,
          firstName,
          template: 'welcome',
          data: {
            firstName,
            companyName: 'UltraMarket O\'zbekiston',
            websiteUrl: secureEnvManager.getConfig('FRONTEND_URL', 'https://ultramarket.uz'),
            supportEmail: this.emailConfig.from.email
          },
          priority: 'normal',
          correlationId
        });
      }

      const duration = Date.now() - startTime;
      emailLogger.info('✅ Welcome email sent successfully', {
        email: this.sanitizeEmail(email),
        firstName,
        duration: `${duration}ms`,
        correlationId
      });

      return { success: true };

    } catch (error) {
      const duration = Date.now() - startTime;
      emailLogger.error('❌ Failed to send welcome email', error, {
        email: this.sanitizeEmail(email),
        firstName,
        duration: `${duration}ms`,
        correlationId
      });

      // Welcome emails are not critical, so we log but don't throw
      return { success: false };
    }
  }

  /**
   * Send templated email
   */
  private async sendTemplatedEmail(template: EmailTemplate): Promise<void> {
    if (!this.transporter && !this.emailConfig.sendgrid) {
      emailLogger.warn('📧 Email transporter not configured, skipping send', {
        to: this.sanitizeEmail(template.to),
        template: template.template
      });
      return;
    }

    const emailTemplate = EMAIL_TEMPLATES[template.template];
    const subject = emailTemplate.subject.uz; // Use Uzbek by default

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `${this.emailConfig.from.name} <${this.emailConfig.from.email}>`,
          to: template.to,
          subject,
          html: this.generateEmailHTML(template),
          priority: template.priority || 'normal',
          headers: {
            'X-Correlation-ID': template.correlationId || '',
            'X-Service': 'auth-service',
            'X-Template': template.template
          }
        });

        emailLogger.info('📧 Email sent via SMTP', {
          to: this.sanitizeEmail(template.to),
          template: template.template,
          subject,
          correlationId: template.correlationId
        });
      }
    } catch (error) {
      emailLogger.error('❌ Failed to send templated email', error, {
        to: this.sanitizeEmail(template.to),
        template: template.template
      });
      throw error;
    }
  }

  /**
   * Generate email HTML content
   */
  private generateEmailHTML(template: EmailTemplate): string {
    const emailTemplate = EMAIL_TEMPLATES[template.template];
    
    // Basic HTML template - in production, use proper template engine
    return `
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailTemplate.subject.uz}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛍️ UltraMarket O'zbekiston</h1>
        </div>
        <div class="content">
          ${this.getTemplateContent(template)}
        </div>
        <div class="footer">
          <p>© 2024 UltraMarket O'zbekiston. Barcha huquqlar himoyalangan.</p>
          <p>Savollar bo'lsa, bizga murojaat qiling: ${template.data?.supportEmail}</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Get template-specific content
   */
  private getTemplateContent(template: EmailTemplate): string {
    const { firstName, ...data } = template.data || {};
    
    switch (template.template) {
      case 'verification':
        return `
          <h2>Assalomu alaykum, ${firstName}!</h2>
          <p>UltraMarket O'zbekiston ga xush kelibsiz! Email manzilingizni tasdiqlash uchun quyidagi tugmani bosing:</p>
          <a href="${data.verificationLink}" class="button">📧 Email ni tasdiqlash</a>
          <p>Ushbu havola 24 soat davomida amal qiladi.</p>
          <p>Agar siz ro'yxatdan o'tmagan bo'lsangiz, ushbu emailga e'tibor bermang.</p>
        `;
        
      case 'passwordReset':
        return `
          <h2>Assalomu alaykum, ${firstName}!</h2>
          <p>Parolingizni tiklash so'rovi keldi. Yangi parol o'rnatish uchun quyidagi tugmani bosing:</p>
          <a href="${data.resetLink}" class="button">🔐 Parolni tiklash</a>
          <p>Ushbu havola ${data.expirationHours} soat davomida amal qiladi.</p>
          <p>Agar siz parolni tiklamagan bo'lsangiz, ushbu emailga e'tibor bermang.</p>
        `;
        
      case 'welcome':
        return `
          <h2>Assalomu alaykum, ${firstName}!</h2>
          <p>🎉 UltraMarket O'zbekiston oilasiga xush kelibsiz!</p>
          <p>Sizga eng yaxshi mahsulotlar va xizmatlarni taklif qilishdan mamnunmiz.</p>
          <a href="${data.websiteUrl}" class="button">🛍️ Xarid qilishni boshlash</a>
          <p>Savollaringiz bo'lsa, bizning qo'llab-quvvatlash jamoasi bilan bog'laning.</p>
        `;
        
      default:
        return `<p>Assalomu alaykum, ${firstName}!</p>`;
    }
  }

  /**
   * Sanitize email for logging
   */
  private sanitizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local && domain) {
      return `${local.substring(0, 2)}***@${domain}`;
    }
    return 'invalid@email.com';
  }

  /**
   * Get email service statistics
   */
  getStats(): {
    rateLimits: Map<string, { count: number; resetTime: number }>;
    config: { provider: string; fromEmail: string };
  } {
    return {
      rateLimits: this.rateLimitTracker,
      config: {
        provider: this.emailConfig.sendgrid ? 'SendGrid' : 'SMTP',
        fromEmail: this.emailConfig.from.email
      }
    };
  }

  /**
   * Health check for email service
   */
  async healthCheck(): Promise<{ healthy: boolean; provider: string; issues: string[] }> {
    const issues: string[] = [];
    let healthy = true;

    try {
      if (this.transporter) {
        await this.transporter.verify();
      } else if (!this.emailConfig.sendgrid?.apiKey) {
        issues.push('No email transporter configured');
        healthy = false;
      }
    } catch (error) {
      issues.push('Email transporter verification failed');
      healthy = false;
    }

    return {
      healthy,
      provider: this.emailConfig.sendgrid ? 'SendGrid' : 'SMTP',
      issues
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    emailLogger.info('🛑 Shutting down email service...');
    
    if (this.transporter) {
      this.transporter.close();
    }
    
    this.rateLimitTracker.clear();
    emailLogger.info('✅ Email service shutdown complete');
  }
}

// Export wrapped functions for easy usage
export const emailService = new EmailService();

export const sendVerificationEmail = asyncHandler(
  async (email: string, firstName: string, correlationId?: string) => 
    emailService.sendVerificationEmail(email, firstName, correlationId)
);

export const sendPasswordResetEmail = asyncHandler(
  async (email: string, firstName: string, resetToken: string, correlationId?: string) => 
    emailService.sendPasswordResetEmail(email, firstName, resetToken, correlationId)
);

export const sendWelcomeEmail = asyncHandler(
  async (email: string, firstName: string, correlationId?: string) => 
    emailService.sendWelcomeEmail(email, firstName, correlationId)
);

export default emailService;
