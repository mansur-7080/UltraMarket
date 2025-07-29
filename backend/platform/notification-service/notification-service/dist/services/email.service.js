"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const logger_1 = require("../utils/logger");
class EmailService {
    constructor() {
        this.smtpTransporter = null;
        this.sendGridEnabled = false;
        this.initializeProviders();
    }
    /**
     * Initialize email providers
     */
    async initializeProviders() {
        try {
            // Initialize SMTP
            if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
                this.smtpTransporter = nodemailer_1.default.createTransporter({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD,
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                });
                // Verify SMTP connection
                await this.smtpTransporter.verify();
                logger_1.logger.info('SMTP transporter initialized successfully');
            }
            // Initialize SendGrid
            if (process.env.SENDGRID_API_KEY) {
                mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
                this.sendGridEnabled = true;
                logger_1.logger.info('SendGrid initialized successfully');
            }
            logger_1.logger.info('Email providers initialized', {
                smtp: !!this.smtpTransporter,
                sendgrid: this.sendGridEnabled,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize email providers:', error);
        }
    }
    /**
     * Send email using the best available provider
     */
    async sendEmail(emailData) {
        try {
            // Try SendGrid first if available
            if (this.sendGridEnabled) {
                try {
                    const result = await this.sendViaSendGrid(emailData);
                    if (result.success) {
                        logger_1.logger.info('Email sent successfully via SendGrid', {
                            to: emailData.to,
                            subject: emailData.subject,
                            messageId: result.messageId,
                        });
                        return result;
                    }
                }
                catch (sendGridError) {
                    logger_1.logger.warn('SendGrid email failed, trying SMTP:', sendGridError);
                }
            }
            // Fallback to SMTP
            if (this.smtpTransporter) {
                try {
                    const result = await this.sendViaSMTP(emailData);
                    if (result.success) {
                        logger_1.logger.info('Email sent successfully via SMTP', {
                            to: emailData.to,
                            subject: emailData.subject,
                            messageId: result.messageId,
                        });
                        return result;
                    }
                }
                catch (smtpError) {
                    logger_1.logger.error('SMTP email also failed:', smtpError);
                }
            }
            // Both providers failed
            throw new Error('All email providers failed');
        }
        catch (error) {
            logger_1.logger.error('Email sending failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                provider: 'none',
            };
        }
    }
    /**
     * Send email via SendGrid
     */
    async sendViaSendGrid(emailData) {
        try {
            const message = {
                to: emailData.to,
                from: emailData.from || process.env.FROM_EMAIL || 'noreply@ultramarket.uz',
                subject: emailData.subject,
                html: emailData.isHtml ? emailData.content : undefined,
                text: !emailData.isHtml ? emailData.content : undefined,
                cc: emailData.cc,
                bcc: emailData.bcc,
                attachments: emailData.attachments?.map((att) => ({
                    filename: att.filename,
                    content: att.content.toString('base64'),
                    type: att.contentType || 'application/octet-stream',
                    disposition: 'attachment',
                })),
            };
            // Use template if specified
            if (emailData.templateId) {
                message.templateId = emailData.templateId;
                message.dynamicTemplateData = emailData.variables || {};
            }
            const response = await mail_1.default.send(message);
            return {
                success: true,
                messageId: response[0].headers['x-message-id'],
                provider: 'SendGrid',
                accepted: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
                rejected: [],
            };
        }
        catch (error) {
            logger_1.logger.error('SendGrid email error:', error);
            return {
                success: false,
                error: error.message || 'SendGrid error',
                provider: 'SendGrid',
            };
        }
    }
    /**
     * Send email via SMTP
     */
    async sendViaSMTP(emailData) {
        try {
            if (!this.smtpTransporter) {
                throw new Error('SMTP transporter not initialized');
            }
            const mailOptions = {
                from: emailData.from || process.env.FROM_EMAIL || 'noreply@ultramarket.uz',
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.isHtml ? emailData.content : undefined,
                text: !emailData.isHtml ? emailData.content : undefined,
                cc: emailData.cc,
                bcc: emailData.bcc,
                attachments: emailData.attachments?.map((att) => ({
                    filename: att.filename,
                    content: att.content,
                    contentType: att.contentType,
                })),
            };
            const result = await this.smtpTransporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: result.messageId,
                provider: 'SMTP',
                accepted: result.accepted,
                rejected: result.rejected,
            };
        }
        catch (error) {
            logger_1.logger.error('SMTP email error:', error);
            return {
                success: false,
                error: error.message || 'SMTP error',
                provider: 'SMTP',
            };
        }
    }
    /**
     * Send bulk emails
     */
    async sendBulkEmails(emails) {
        const results = [];
        // Process in batches to avoid overwhelming the providers
        const batchSize = 10;
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            const batchPromises = batch.map(async (emailData) => {
                try {
                    return await this.sendEmail(emailData);
                }
                catch (error) {
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
            if (i + batchSize < emails.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
        logger_1.logger.info('Bulk emails completed', {
            total: emails.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
        });
        return results;
    }
    /**
     * Validate email address
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Test email providers connectivity
     */
    async testProviders() {
        const results = {
            smtp: false,
            sendgrid: false,
        };
        // Test SMTP
        if (this.smtpTransporter) {
            try {
                await this.smtpTransporter.verify();
                results.smtp = true;
            }
            catch (error) {
                logger_1.logger.error('SMTP test failed:', error);
            }
        }
        // Test SendGrid (send a test email to verify)
        if (this.sendGridEnabled) {
            try {
                // Just check if API key is set and valid format
                results.sendgrid = true;
            }
            catch (error) {
                logger_1.logger.error('SendGrid test failed:', error);
            }
        }
        return results;
    }
    /**
     * Get email templates (if using SendGrid)
     */
    async getTemplates() {
        if (!this.sendGridEnabled) {
            return [];
        }
        try {
            // This would require additional SendGrid API calls
            // For now, return empty array
            return [];
        }
        catch (error) {
            logger_1.logger.error('Failed to get email templates:', error);
            return [];
        }
    }
    /**
     * Create HTML email template
     */
    createHTMLTemplate(title, content, variables = {}) {
        // Basic HTML template
        let html = `
    <!DOCTYPE html>
    <html lang="uz">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                padding: 20px;
                background: #333;
                color: white;
                border-radius: 10px;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px 0;
            }
            .button:hover {
                background: #764ba2;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>UltraMarket</h1>
            <p>${title}</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; 2024 UltraMarket. Barcha huquqlar himoyalangan.</p>
            <p>Savollar bo'lsa: support@ultramarket.uz</p>
        </div>
    </body>
    </html>
    `;
        // Replace variables in template
        Object.keys(variables).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, variables[key]);
        });
        return html;
    }
    /**
     * Send welcome email
     */
    async sendWelcomeEmail(to, userName, activationLink) {
        const content = `
      <h2>Xush kelibsiz, ${userName}!</h2>
      <p>UltraMarket'ga muvaffaqiyatli ro'yxatdan o'tganingiz bilan tabriklaymiz!</p>
      ${activationLink
            ? `
        <p>Hisobingizni faollashtirish uchun quyidagi tugmani bosing:</p>
        <a href="${activationLink}" class="button">Hisobni faollashtirish</a>
      `
            : ''}
      <p>Bizning platformamizda:</p>
      <ul>
        <li>Minglab mahsulotlar</li>
        <li>Tez yetkazib berish</li>
        <li>Xavfsiz to'lov</li>
        <li>24/7 qo'llab-quvvatlash</li>
      </ul>
      <p>Xarid qilishni boshlash uchun tayyor bo'lsangiz, bizning veb-saytimizga tashrif buyuring!</p>
    `;
        const htmlContent = this.createHTMLTemplate('Xush kelibsiz!', content, {
            userName,
            activationLink,
        });
        return await this.sendEmail({
            to,
            subject: "UltraMarket'ga xush kelibsiz!",
            content: htmlContent,
            isHtml: true,
        });
    }
    /**
     * Send order confirmation email
     */
    async sendOrderConfirmationEmail(to, orderData) {
        const itemsHtml = orderData.items
            .map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toLocaleString()} so'm</td>
      </tr>
    `)
            .join('');
        const content = `
      <h2>Buyurtma tasdiqlandi!</h2>
      <p>Hurmatli ${orderData.customerName}, buyurtmangiz qabul qilindi.</p>
      
      <h3>Buyurtma ma'lumotlari:</h3>
      <p><strong>Buyurtma raqami:</strong> ${orderData.orderNumber}</p>
      <p><strong>Yetkazib berish manzili:</strong> ${orderData.deliveryAddress}</p>
      <p><strong>Taxminiy yetkazib berish:</strong> ${orderData.estimatedDelivery}</p>
      
      <h3>Buyurtma tarkibi:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 10px; border: 1px solid #ddd;">Mahsulot</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Miqdor</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Narx</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <h3 style="text-align: right; margin-top: 20px;">
        Jami: ${orderData.total.toLocaleString()} so'm
      </h3>
      
      <p>Buyurtmangizni kuzatish uchun bizning veb-saytimizga tashrif buyuring.</p>
    `;
        const htmlContent = this.createHTMLTemplate('Buyurtma tasdiqlandi', content, orderData);
        return await this.sendEmail({
            to,
            subject: `Buyurtma tasdiqlandi - ${orderData.orderNumber}`,
            content: htmlContent,
            isHtml: true,
        });
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=email.service.js.map