export interface EmailData {
    to: string | string[];
    subject: string;
    content: string;
    from?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
    templateId?: string;
    variables?: Record<string, any>;
    isHtml?: boolean;
}
export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: string;
    accepted?: string[];
    rejected?: string[];
}
export declare class EmailService {
    private smtpTransporter;
    private sendGridEnabled;
    constructor();
    /**
     * Initialize email providers
     */
    private initializeProviders;
    /**
     * Send email using the best available provider
     */
    sendEmail(emailData: EmailData): Promise<EmailResult>;
    /**
     * Send email via SendGrid
     */
    private sendViaSendGrid;
    /**
     * Send email via SMTP
     */
    private sendViaSMTP;
    /**
     * Send bulk emails
     */
    sendBulkEmails(emails: EmailData[]): Promise<EmailResult[]>;
    /**
     * Validate email address
     */
    isValidEmail(email: string): boolean;
    /**
     * Test email providers connectivity
     */
    testProviders(): Promise<{
        smtp: boolean;
        sendgrid: boolean;
    }>;
    /**
     * Get email templates (if using SendGrid)
     */
    getTemplates(): Promise<any[]>;
    /**
     * Create HTML email template
     */
    createHTMLTemplate(title: string, content: string, variables?: Record<string, any>): string;
    /**
     * Send welcome email
     */
    sendWelcomeEmail(to: string, userName: string, activationLink?: string): Promise<EmailResult>;
    /**
     * Send order confirmation email
     */
    sendOrderConfirmationEmail(to: string, orderData: {
        orderNumber: string;
        customerName: string;
        items: Array<{
            name: string;
            quantity: number;
            price: number;
        }>;
        total: number;
        deliveryAddress: string;
        estimatedDelivery: string;
    }): Promise<EmailResult>;
}
//# sourceMappingURL=email.service.d.ts.map