/**
 * Professional Email Service Implementation
 * UltraMarket E-commerce Platform
 * 
 * Bu fayl auth servicedagi email TODO comments ni implement qilish uchun
 */

import nodemailer from 'nodemailer';
import handlebars, { TemplateDelegate } from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '../utils/logger-replacement';

const emailLogger = createLogger('email-service');

// ❌ NOTO'G'RI - TODO comments qolgan
/*
// TODO: Implement actual email sending with nodemailer or similar
// TODO: Implement template rendering with handlebars, ejs, or similar
// TODO: Integrate with email service provider
*/

// ✅ TO'G'RI - Full professional email implementation

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    email: string;
  };
  templates: {
    path: string;
    cacheTemplates: boolean;
  };
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export class ProfessionalEmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private templateCache: Map<string, TemplateDelegate> = new Map();

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeTransporter();
  }

  // ✅ Initialize SMTP transporter
  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: {
        user: this.config.smtp.auth.user,
        pass: this.config.smtp.auth.pass,
      },
      pool: true, // Use connection pool
      maxConnections: 10,
      maxMessages: 100,
      rateDelta: 1000, // 1 second
      rateLimit: 10, // Max 10 emails per second
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    this.verifyConnection();
  }

  // ✅ Verify SMTP connection
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      emailLogger.info('SMTP connection verified successfully', {
        host: this.config.smtp.host,
        port: this.config.smtp.port
      });
    } catch (error) {
      emailLogger.error('SMTP connection verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: this.config.smtp.host,
        port: this.config.smtp.port
      });
    }
  }

  // ✅ Load and compile email template
  private async loadTemplate(templateName: string): Promise<TemplateDelegate> {
    // Check cache first
    if (this.config.templates.cacheTemplates && this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(this.config.templates.path, `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      const compiledTemplate = handlebars.compile(templateContent);
      
      // Cache compiled template
      if (this.config.templates.cacheTemplates) {
        this.templateCache.set(templateName, compiledTemplate);
      }

      emailLogger.debug('Email template loaded and compiled', {
        templateName,
        templatePath
      });

      return compiledTemplate;
    } catch (error) {
      emailLogger.error('Failed to load email template', {
        templateName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  // ✅ Render template with data
  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      const template = await this.loadTemplate(templateName);
      
      // Add common template helpers and data
      const templateData = {
        ...data,
        currentYear: new Date().getFullYear(),
        platformName: 'UltraMarket',
        supportEmail: this.config.from.email,
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        logoUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/logo.png`
      };

      const renderedHtml = template(templateData);
      
      emailLogger.debug('Email template rendered successfully', {
        templateName,
        dataKeys: Object.keys(data)
      });

      return renderedHtml;
    } catch (error) {
      emailLogger.error('Failed to render email template', {
        templateName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ✅ Send email with template or HTML
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let htmlContent = options.html;
      let textContent = options.text;

      // If template is provided, render it
      if (options.template && options.data) {
        htmlContent = await this.renderTemplate(options.template, options.data);
        
        // Generate text version from HTML if not provided
        if (!textContent) {
          textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
      }

      // Prepare email options
      const mailOptions = {
        from: `${this.config.from.name} <${this.config.from.email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: htmlContent,
        text: textContent,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        })),
        priority: options.priority || 'normal'
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      emailLogger.info('Email sent successfully', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
        template: options.template,
        response: result.response
      });

    } catch (error) {
      emailLogger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        template: options.template,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ✅ Send verification email
  async sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await this.sendEmail({
      to: email,
      subject: 'UltraMarket - Email ni tasdiqlang',
      template: 'email-verification',
      data: {
        firstName,
        verificationLink,
        expirationTime: '24 soat'
      }
    });
  }

  // ✅ Send password reset email
  async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: email,
      subject: 'UltraMarket - Parolni tiklash',
      template: 'password-reset',
      data: {
        firstName,
        resetLink,
        expirationTime: '1 soat'
      }
    });
  }

  // ✅ Send welcome email
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'UltraMarket ga xush kelibsiz!',
      template: 'welcome',
      data: {
        firstName,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        supportUrl: `${process.env.FRONTEND_URL}/support`,
        profileUrl: `${process.env.FRONTEND_URL}/profile`
      }
    });
  }

  // ✅ Send notification email
  async sendNotificationEmail(
    email: string, 
    subject: string, 
    message: string, 
    firstName?: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: subject,
      template: 'notification',
      data: {
        firstName: firstName || 'Foydalanuvchi',
        message,
        timestamp: new Date().toLocaleString('uz-UZ')
      }
    });
  }

  // ✅ Send order confirmation email
  async sendOrderConfirmationEmail(
    email: string,
    orderData: {
      orderId: string;
      firstName: string;
      items: any[];
      total: number;
      shippingAddress: any;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Buyurtma tasdiqlandi - #${orderData.orderId}`,
      template: 'order-confirmation',
      data: {
        ...orderData,
        orderUrl: `${process.env.FRONTEND_URL}/orders/${orderData.orderId}`,
        trackingUrl: `${process.env.FRONTEND_URL}/track/${orderData.orderId}`
      }
    });
  }

  // ✅ Send payment confirmation email
  async sendPaymentConfirmationEmail(
    email: string,
    paymentData: {
      orderId: string;
      firstName: string;
      amount: number;
      paymentMethod: string;
      transactionId: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `To'lov tasdiqlandi - #${paymentData.orderId}`,
      template: 'payment-confirmation',
      data: {
        ...paymentData,
        receiptUrl: `${process.env.FRONTEND_URL}/receipts/${paymentData.transactionId}`
      }
    });
  }

  // ✅ Send bulk emails (for newsletters, marketing)
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    template: string,
    data: Record<string, any>
  ): Promise<void> {
    const batchSize = 50; // Send in batches to avoid rate limiting
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      try {
        await Promise.all(
          batch.map(email => 
            this.sendEmail({
              to: email,
              subject,
              template,
              data: {
                ...data,
                email // Include recipient email in template data
              }
            })
          )
        );

        emailLogger.info('Bulk email batch sent', {
          batchNumber: Math.floor(i / batchSize) + 1,
          batchSize: batch.length,
          template,
          subject
        });

        // Add delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
      } catch (error) {
        emailLogger.error('Failed to send bulk email batch', {
          batchNumber: Math.floor(i / batchSize) + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // ✅ Create default email templates
  async createDefaultTemplates(): Promise<void> {
    const templates = {
      'email-verification': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Tasdiqlash - {{platformName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{platformName}}</h1>
    </div>
    <div class="content">
        <h2>Salom, {{firstName}}!</h2>
        <p>{{platformName}} platformasiga ro'yxatdan o'tganingizdan xursandmiz!</p>
        <p>Email manzilingizni tasdiqlash uchun quyidagi tugmani bosing:</p>
        <a href="{{verificationLink}}" class="button">Email ni tasdiqlash</a>
        <p><small>Bu havola {{expirationTime}} davomida amal qiladi.</small></p>
        <p>Agar tugma ishlamasa, quyidagi havolani brauzeringizga nusxalang:</p>
        <p><small>{{verificationLink}}</small></p>
    </div>
    <div class="footer">
        <p>© {{currentYear}} {{platformName}}. Barcha huquqlar himoyalangan.</p>
    </div>
</body>
</html>`,

      'password-reset': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Parolni Tiklash - {{platformName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{platformName}}</h1>
    </div>
    <div class="content">
        <h2>Salom, {{firstName}}!</h2>
        <p>Parolingizni tiklash so'rovi olingan.</p>
        <p>Yangi parol o'rnatish uchun quyidagi tugmani bosing:</p>
        <a href="{{resetLink}}" class="button">Parolni tiklash</a>
        <div class="warning">
            <p><strong>Xavfsizlik ogohlantirishi:</strong> Agar siz bu so'rovni yubormagan bo'lsangiz, bu emailni e'tiborsiz qoldiring.</p>
        </div>
        <p><small>Bu havola {{expirationTime}} davomida amal qiladi.</small></p>
    </div>
</body>
</html>`,

      'welcome': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Xush kelibsiz - {{platformName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .feature { background: white; padding: 20px; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{platformName}} ga xush kelibsiz!</h1>
    </div>
    <div class="content">
        <h2>Salom, {{firstName}}!</h2>
        <p>{{platformName}} oilasiga qo'shilganingizdan xursandmiz! Bizning platformamizda minglab mahsulot va xizmatlardan foydalanishingiz mumkin.</p>
        
        <div class="features">
            <div class="feature">
                <h3>🛍️ Xarid qiling</h3>
                <p>Eng yaxshi mahsulotlarni toping</p>
            </div>
            <div class="feature">
                <h3>🚚 Tez yetkazib berish</h3>
                <p>O'zbekiston bo'ylab bepul yetkazib berish</p>
            </div>
        </div>
        
        <p>Foydali havolalar:</p>
        <ul>
            <li><a href="{{profileUrl}}">Profilingizni sozlang</a></li>
            <li><a href="{{loginUrl}}">Hisobingizga kiring</a></li>
            <li><a href="{{supportUrl}}">Yordam markazi</a></li>
        </ul>
    </div>
</body>
</html>`,

      'notification': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bildirishnoma - {{platformName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{platformName}}</h1>
    </div>
    <div class="content">
        <h2>Salom, {{firstName}}!</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            {{message}}
        </div>
        <p><small>Vaqt: {{timestamp}}</small></p>
    </div>
</body>
</html>`
    };

    // Create templates directory if not exists
    const templatesDir = this.config.templates.path;
    await fs.mkdir(templatesDir, { recursive: true });

    // Write template files
    for (const [name, content] of Object.entries(templates)) {
      const templatePath = path.join(templatesDir, `${name}.hbs`);
      await fs.writeFile(templatePath, content, 'utf8');
      
      emailLogger.info('Email template created', {
        templateName: name,
        templatePath
      });
    }
  }
}

// Export the service
export default ProfessionalEmailService;

/**
 * USAGE EXAMPLE:
 * 
 * // Initialize email service
 * const emailConfig: EmailConfig = {
 *   smtp: {
 *     host: process.env.SMTP_HOST!,
 *     port: parseInt(process.env.SMTP_PORT!),
 *     secure: process.env.SMTP_SECURE === 'true',
 *     auth: {
 *       user: process.env.SMTP_USER!,
 *       pass: process.env.SMTP_PASS!
 *     }
 *   },
 *   from: {
 *     name: 'UltraMarket',
 *     email: process.env.SMTP_FROM!
 *   },
 *   templates: {
 *     path: path.join(__dirname, '../../templates/email'),
 *     cacheTemplates: true
 *   }
 * };
 * 
 * const emailService = new ProfessionalEmailService(emailConfig);
 * 
 * // Send verification email
 * await emailService.sendVerificationEmail(
 *   'user@example.com',
 *   'John Doe',
 *   'verification_token_here'
 * );
 */ 