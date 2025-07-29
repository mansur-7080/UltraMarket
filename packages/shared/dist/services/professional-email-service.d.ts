/**
 * Professional Email Service Implementation
 * UltraMarket E-commerce Platform
 *
 * Bu fayl auth servicedagi email TODO comments ni implement qilish uchun
 */
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
export declare class ProfessionalEmailService {
    private transporter;
    private config;
    private templateCache;
    constructor(config: EmailConfig);
    private initializeTransporter;
    private verifyConnection;
    private loadTemplate;
    private renderTemplate;
    sendEmail(options: EmailOptions): Promise<void>;
    sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<void>;
    sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void>;
    sendWelcomeEmail(email: string, firstName: string): Promise<void>;
    sendNotificationEmail(email: string, subject: string, message: string, firstName?: string): Promise<void>;
    sendOrderConfirmationEmail(email: string, orderData: {
        orderId: string;
        firstName: string;
        items: any[];
        total: number;
        shippingAddress: any;
    }): Promise<void>;
    sendPaymentConfirmationEmail(email: string, paymentData: {
        orderId: string;
        firstName: string;
        amount: number;
        paymentMethod: string;
        transactionId: string;
    }): Promise<void>;
    sendBulkEmail(recipients: string[], subject: string, template: string, data: Record<string, any>): Promise<void>;
    createDefaultTemplates(): Promise<void>;
}
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
//# sourceMappingURL=professional-email-service.d.ts.map