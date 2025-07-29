/**
 * Email Service for UltraMarket
 * Handles all email operations including SMTP, templates, and various email types
 */
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
export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
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
export declare class EmailService {
    private transporter;
    private config;
    private prisma;
    private logger;
    constructor(config: EmailConfig);
    /**
     * Initialize transporter
     */
    private initializeTransporter;
    /**
     * Verify SMTP connection
     */
    private verifyConnection;
    /**
     * Send email
     */
    sendEmail(emailData: EmailData): Promise<boolean>;
    /**
     * Generate verification token
     */
    generateVerificationToken(email: string): Promise<string>;
    /**
     * Generate password reset token
     */
    generatePasswordResetToken(email: string): Promise<string>;
    /**
     * Send verification email
     */
    sendVerificationEmail(email: string, token: string, firstName: string): Promise<boolean>;
    /**
     * Send password reset email
     */
    sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<boolean>;
    /**
     * Send welcome email
     */
    sendWelcomeEmail(email: string, firstName: string): Promise<boolean>;
    /**
     * Send order confirmation email
     */
    sendOrderConfirmationEmail(email: string, firstName: string, orderNumber: string, orderDetails: any): Promise<boolean>;
    /**
     * Send order status update email
     */
    sendOrderStatusUpdateEmail(email: string, firstName: string, orderNumber: string, status: string, trackingNumber?: string): Promise<boolean>;
    /**
     * Send payment confirmation email
     */
    sendPaymentConfirmationEmail(email: string, firstName: string, orderNumber: string, amount: number, paymentMethod: string): Promise<boolean>;
    /**
     * Send security alert email
     */
    sendSecurityAlertEmail(email: string, firstName: string, alertType: string, deviceInfo: any): Promise<boolean>;
    /**
     * Get verification email template
     */
    private getVerificationEmailTemplate;
    /**
     * Get password reset email template
     */
    private getPasswordResetEmailTemplate;
    /**
     * Get welcome email template
     */
    private getWelcomeEmailTemplate;
    /**
     * Get order confirmation email template
     */
    private getOrderConfirmationEmailTemplate;
    /**
     * Get order status update email template
     */
    private getOrderStatusUpdateEmailTemplate;
    /**
     * Get payment confirmation email template
     */
    private getPaymentConfirmationEmailTemplate;
    /**
     * Get security alert email template
     */
    private getSecurityAlertEmailTemplate;
    /**
     * Clean up expired tokens
     */
    cleanupExpiredTokens(): Promise<void>;
}
//# sourceMappingURL=email.d.ts.map