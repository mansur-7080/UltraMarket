/**
 * 📧 EMAIL SERVICE - UltraMarket
 * 
 * Professional email service implementation
 * Supports SMTP, templates, and multiple providers
 * 
 * @author UltraMarket Email Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import nodemailer, { Transporter, SendMailOptions, SentMessageInfo } from 'nodemailer';
import { getValidatedEnv } from '../config/environment-validator';

export interface EmailRequest {
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
  recipient: string;
  subject: string;
  provider: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
}

export interface EmailProvider {
  name: string;
  isEnabled: boolean;
  sendEmail(request: EmailRequest): Promise<EmailResponse>;
  verifyConnection(): Promise<boolean>;
}

export class SMTPEmailProvider implements EmailProvider {
  public name = 'SMTP';
  public isEnabled: boolean;
  
  private transporter: Transporter;
  private host: string;
  private port: number;
  private secure: boolean;
  private user: string;
  private pass: string;
  private from: string;

  constructor() {
    const env = getValidatedEnv();
    this.host = env.EMAIL_HOST;
    this.port = env.EMAIL_PORT;
    this.secure = env.EMAIL_SECURE;
    this.user = env.EMAIL_USER;
    this.pass = env.EMAIL_PASS;
    this.from = env.EMAIL_FROM;
    this.isEnabled = !!this.host && !!this.user && !!this.pass;

    if (this.isEnabled) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.user,
          pass: this.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
  }

  async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    try {
      if (!this.isEnabled) {
        throw new Error('SMTP email provider is not configured');
      }

      // Prepare email options
      const mailOptions: SendMailOptions = {
        from: this.from,
        to: Array.isArray(request.to) ? request.to.join(', ') : request.to,
        subject: request.subject || 'UltraMarket Notification',
        text: request.text,
        html: request.html,
        cc: request.cc,
        bcc: request.bcc,
        replyTo: request.replyTo,
        priority: request.priority,
        attachments: request.attachments
      };

      // Send email
      const info: SentMessageInfo = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date(),
        recipient: Array.isArray(request.to) ? request.to[0] : request.to,
        subject: request.subject || 'UltraMarket Notification',
        provider: this.name
      };
    } catch (error) {
      console.error('SMTP email sending error:', error);
      return {
        success: false,
        timestamp: new Date(),
        recipient: Array.isArray(request.to) ? request.to[0] : request.to,
        subject: request.subject || 'UltraMarket Notification',
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.isEnabled) {
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}

export class EmailService {
  private providers: Map<string, EmailProvider> = new Map();
  private templates: Map<string, EmailTemplate> = new Map();
  private emails: Map<string, EmailResponse> = new Map();

  constructor() {
    // Initialize email providers
    const smtpProvider = new SMTPEmailProvider();
    
    if (smtpProvider.isEnabled) {
      this.providers.set('smtp', smtpProvider);
    }

    // Initialize email templates
    this.initializeTemplates();
  }

  /**
   * Send email
   */
  async sendEmail(request: EmailRequest): Promise<EmailResponse> {
    try {
      // Use template if specified
      if (request.template) {
        const template = this.templates.get(request.template);
        if (template) {
          request.subject = this.renderTemplate(template.subject, request.templateData || {});
          request.html = this.renderTemplate(template.html, request.templateData || {});
          request.text = this.renderTemplate(template.text, request.templateData || {});
        }
      }

      // Validate request
      this.validateEmailRequest(request);

      // Send email using first available provider
      const provider = this.providers.values().next().value;
      if (!provider) {
        throw new Error('No email providers available');
      }

      const response = await provider.sendEmail(request);
      
      if (response.success) {
        this.emails.set(response.messageId || Date.now().toString(), response);
      }

      return response;
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        timestamp: new Date(),
        recipient: Array.isArray(request.to) ? request.to[0] : request.to,
        subject: request.subject || 'UltraMarket Notification',
        provider: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, data: { name: string; verificationUrl?: string }): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      template: 'welcome',
      templateData: data,
      priority: 'high'
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, data: { name: string; resetUrl: string; expiresIn: string }): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      template: 'password-reset',
      templateData: data,
      priority: 'high'
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(to: string, data: { 
    name: string; 
    orderId: string; 
    orderTotal: number; 
    currency: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    shippingAddress: string;
    estimatedDelivery: string;
  }): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      template: 'order-confirmation',
      templateData: data,
      priority: 'normal'
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(to: string, data: { 
    name: string; 
    orderId: string; 
    amount: number; 
    currency: string;
    paymentMethod: string;
    transactionId: string;
  }): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      template: 'payment-confirmation',
      templateData: data,
      priority: 'normal'
    });
  }

  /**
   * Send newsletter email
   */
  async sendNewsletterEmail(to: string, data: { 
    name: string; 
    subject: string;
    content: string;
    unsubscribeUrl: string;
  }): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      template: 'newsletter',
      templateData: data,
      priority: 'low'
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlertEmail(to: string, data: { 
    name: string; 
    alertType: string;
    timestamp: string;
    deviceInfo: string;
    location: string;
    actionUrl: string;
  }): Promise<EmailResponse> {
    return this.sendEmail({
      to,
      template: 'security-alert',
      templateData: data,
      priority: 'high'
    });
  }

  /**
   * Initialize email templates
   */
  private initializeTemplates(): void {
    // Welcome email template
    this.templates.set('welcome', {
      name: 'welcome',
      subject: 'Xush kelibsiz, {{name}}! UltraMarket\'ga ro\'yxatdan o\'tganingiz uchun rahmat',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Xush kelibsiz!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Xush kelibsiz, {{name}}!</h1>
            <p>UltraMarket\'ga ro\'yxatdan o\'tganingiz uchun rahmat. Endi siz:</p>
            <ul>
              <li>Eng yaxshi mahsulotlarni topishingiz mumkin</li>
              <li>Xavfsiz to\'lov qilishingiz mumkin</li>
              <li>Tez yetkazib berish xizmatidan foydalanishingiz mumkin</li>
            </ul>
            {{#if verificationUrl}}
            <p>Email manzilingizni tasdiqlash uchun quyidagi havolani bosing:</p>
            <a href="{{verificationUrl}}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Email tasdiqlash</a>
            {{/if}}
            <p>Savollaringiz bo\'lsa, biz bilan bog\'laning.</p>
            <p>Rahmat,<br>UltraMarket jamoasi</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Xush kelibsiz, {{name}}!
        
        UltraMarket'ga ro'yxatdan o'tganingiz uchun rahmat. Endi siz:
        - Eng yaxshi mahsulotlarni topishingiz mumkin
        - Xavfsiz to'lov qilishingiz mumkin
        - Tez yetkazib berish xizmatidan foydalanishingiz mumkin
        
        {{#if verificationUrl}}
        Email manzilingizni tasdiqlash uchun: {{verificationUrl}}
        {{/if}}
        
        Savollaringiz bo'lsa, biz bilan bog'laning.
        
        Rahmat,
        UltraMarket jamoasi
      `,
      variables: ['name', 'verificationUrl']
    });

    // Password reset template
    this.templates.set('password-reset', {
      name: 'password-reset',
      subject: 'Parolni tiklash - UltraMarket',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Parolni tiklash</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e74c3c;">Parolni tiklash</h1>
            <p>Salom, {{name}}!</p>
            <p>Parolingizni tiklash so\'rovini qabul qildik. Yangi parol o\'rnatish uchun quyidagi havolani bosing:</p>
            <a href="{{resetUrl}}" style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Parolni tiklash</a>
            <p><strong>Eslatma:</strong> Bu havola {{expiresIn}} daqiqadan keyin amal qilmaydi.</p>
            <p>Agar siz parolni tiklash so\'rovini yubormagan bo\'lsangiz, bu xabarni e\'tiborsiz qoldiring.</p>
            <p>Xavfsizlik uchun, parolingizni hech kim bilan ulashmang.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Parolni tiklash
        
        Salom, {{name}}!
        
        Parolingizni tiklash so'rovini qabul qildik. Yangi parol o'rnatish uchun:
        {{resetUrl}}
        
        Eslatma: Bu havola {{expiresIn}} daqiqadan keyin amal qilmaydi.
        
        Agar siz parolni tiklash so'rovini yubormagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
        
        Xavfsizlik uchun, parolingizni hech kim bilan ulashmang.
      `,
      variables: ['name', 'resetUrl', 'expiresIn']
    });

    // Order confirmation template
    this.templates.set('order-confirmation', {
      name: 'order-confirmation',
      subject: 'Buyurtma tasdiqlandi - #{{orderId}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Buyurtma tasdiqlandi</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #27ae60;">Buyurtma tasdiqlandi!</h1>
            <p>Salom, {{name}}!</p>
            <p>Buyurtmangiz muvaffaqiyatli qabul qilindi. Buyurtma raqami: <strong>#{{orderId}}</strong></p>
            
            <h3>Buyurtma ma'lumotlari:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Mahsulot</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Soni</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Narxi</th>
              </tr>
              {{#each items}}
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${item.price} {{../currency}}</td>
              </tr>
              {{/each}}
            </table>
            
            <p><strong>Jami summa: {{orderTotal}} {{currency}}</strong></p>
            
            <h3>Yetkazib berish manzili:</h3>
            <p>{{shippingAddress}}</p>
            
            <p><strong>Taxminiy yetkazib berish vaqti: {{estimatedDelivery}}</strong></p>
            
            <p>Buyurtma holatini kuzatish uchun bizning saytimizga tashrif buyuring.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Buyurtma tasdiqlandi!
        
        Salom, {{name}}!
        
        Buyurtmangiz muvaffaqiyatli qabul qilindi. Buyurtma raqami: #{{orderId}}
        
        Buyurtma ma'lumotlari:
        {{#each items}}
        - {{name}} ({{quantity}} dona) - {{price}} {{../currency}}
        {{/each}}
        
        Jami summa: {{orderTotal}} {{currency}}
        
        Yetkazib berish manzili:
        {{shippingAddress}}
        
        Taxminiy yetkazib berish vaqti: {{estimatedDelivery}}
        
        Buyurtma holatini kuzatish uchun bizning saytimizga tashrif buyuring.
      `,
      variables: ['name', 'orderId', 'orderTotal', 'currency', 'items', 'shippingAddress', 'estimatedDelivery']
    });

    // Payment confirmation template
    this.templates.set('payment-confirmation', {
      name: 'payment-confirmation',
      subject: 'To\'lov tasdiqlandi - #{{orderId}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>To'lov tasdiqlandi</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #27ae60;">To\'lov tasdiqlandi!</h1>
            <p>Salom, {{name}}!</p>
            <p>Buyurtmangiz uchun to\'lov muvaffaqiyatli amalga oshirildi.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Buyurtma raqami:</strong> #{{orderId}}</p>
              <p><strong>To\'lov summası:</strong> {{amount}} {{currency}}</p>
              <p><strong>To\'lov usuli:</strong> {{paymentMethod}}</p>
              <p><strong>Tranzaksiya raqami:</strong> {{transactionId}}</p>
            </div>
            
            <p>Buyurtmangiz tez orada tayyorlanadi va yetkazib beriladi.</p>
            <p>Rahmat, UltraMarket\'ni tanlaganingiz uchun!</p>
          </div>
        </body>
        </html>
      `,
      text: `
        To'lov tasdiqlandi!
        
        Salom, {{name}}!
        
        Buyurtmangiz uchun to'lov muvaffaqiyatli amalga oshirildi.
        
        Buyurtma raqami: #{{orderId}}
        To'lov summası: {{amount}} {{currency}}
        To'lov usuli: {{paymentMethod}}
        Tranzaksiya raqami: {{transactionId}}
        
        Buyurtmangiz tez orada tayyorlanadi va yetkazib beriladi.
        
        Rahmat, UltraMarket'ni tanlaganingiz uchun!
      `,
      variables: ['name', 'orderId', 'amount', 'currency', 'paymentMethod', 'transactionId']
    });

    // Newsletter template
    this.templates.set('newsletter', {
      name: 'newsletter',
      subject: '{{subject}} - UltraMarket',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>{{subject}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">{{subject}}</h1>
            <p>Salom, {{name}}!</p>
            <div style="margin: 20px 0;">
              {{{content}}}
            </div>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              Bu xabarni olmoqchi emasmisiz? 
              <a href="{{unsubscribeUrl}}" style="color: #3498db;">Obunani bekor qilish</a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        {{subject}}
        
        Salom, {{name}}!
        
        {{content}}
        
        ---
        Bu xabarni olmoqchi emasmisiz? Obunani bekor qilish: {{unsubscribeUrl}}
      `,
      variables: ['name', 'subject', 'content', 'unsubscribeUrl']
    });

    // Security alert template
    this.templates.set('security-alert', {
      name: 'security-alert',
      subject: 'Xavfsizlik ogohlantirishi - {{alertType}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Xavfsizlik ogohlantirishi</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e74c3c;">Xavfsizlik ogohlantirishi</h1>
            <p>Salom, {{name}}!</p>
            <p>Hisobingizda xavfsizlik hodisasi aniqlangan: <strong>{{alertType}}</strong></p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Vaqt:</strong> {{timestamp}}</p>
              <p><strong>Qurilma:</strong> {{deviceInfo}}</p>
              <p><strong>Manzil:</strong> {{location}}</p>
            </div>
            
            <p>Agar bu siz emas bo\'lsangiz, darhol parolingizni o\'zgartiring:</p>
            <a href="{{actionUrl}}" style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Parolni o\'zgartirish</a>
            
            <p>Xavfsizlik uchun, parolingizni hech kim bilan ulashmang.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Xavfsizlik ogohlantirishi
        
        Salom, {{name}}!
        
        Hisobingizda xavfsizlik hodisasi aniqlangan: {{alertType}}
        
        Vaqt: {{timestamp}}
        Qurilma: {{deviceInfo}}
        Manzil: {{location}}
        
        Agar bu siz emas bo'lsangiz, darhol parolingizni o'zgartiring: {{actionUrl}}
        
        Xavfsizlik uchun, parolingizni hech kim bilan ulashmang.
      `,
      variables: ['name', 'alertType', 'timestamp', 'deviceInfo', 'location', 'actionUrl']
    });
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    
    // Replace simple variables
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });

    // Handle arrays (for items in order confirmation)
    if (data.items && Array.isArray(data.items)) {
      const itemsHtml = data.items.map((item: any) => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${item.price} ${data.currency}</td>
        </tr>
      `).join('');
      
      result = result.replace('{{#each items}}', '').replace('{{/each}}', itemsHtml);
    }

    return result;
  }

  /**
   * Validate email request
   */
  private validateEmailRequest(request: EmailRequest): void {
    if (!request.to || (Array.isArray(request.to) && request.to.length === 0)) {
      throw new Error('Email recipient is required');
    }

    if (!request.subject) {
      throw new Error('Email subject is required');
    }

    if (!request.text && !request.html && !request.template) {
      throw new Error('Email content is required');
    }

    // Validate email format
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const recipients = Array.isArray(request.to) ? request.to : [request.to];
    for (const recipient of recipients) {
      if (!validateEmail(recipient)) {
        throw new Error(`Invalid email format: ${recipient}`);
      }
    }
  }

  /**
   * Get email by ID
   */
  getEmail(emailId: string): EmailResponse | undefined {
    return this.emails.get(emailId);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is enabled
   */
  isProviderEnabled(provider: string): boolean {
    return this.providers.has(provider);
  }

  /**
   * Get provider status
   */
  async getProviderStatus(): Promise<Record<string, { enabled: boolean; connected: boolean }>> {
    const status: Record<string, { enabled: boolean; connected: boolean }> = {};
    
    for (const [name, provider] of this.providers) {
      status[name] = {
        enabled: provider.isEnabled,
        connected: await provider.verifyConnection()
      };
    }

    return status;
  }

  /**
   * Get email statistics
   */
  getEmailStats(): {
    totalEmails: number;
    successfulEmails: number;
    failedEmails: number;
    emailsByProvider: Record<string, number>;
    recentEmails: EmailResponse[];
  } {
    const emails = Array.from(this.emails.values());
    const recentEmails = emails.filter(
      email => email.timestamp.getTime() > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    );

    const emailsByProvider: Record<string, number> = {};
    let successfulEmails = 0;
    let failedEmails = 0;

    emails.forEach(email => {
      emailsByProvider[email.provider] = (emailsByProvider[email.provider] || 0) + 1;
      if (email.success) {
        successfulEmails++;
      } else {
        failedEmails++;
      }
    });

    return {
      totalEmails: emails.length,
      successfulEmails,
      failedEmails,
      emailsByProvider,
      recentEmails
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export for testing
export { EmailService as EmailServiceClass }; 