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
declare class ProfessionalEmailService {
    private transporters;
    private redis;
    private isConfigured;
    private defaultFrom;
    private primaryProvider;
    private fallbackProviders;
    private queueName;
    private processingQueue;
    constructor();
    private initializeRedis;
    private initializeTransporters;
    private getProviderConfig;
    sendEmail(data: EmailData): Promise<boolean>;
    private addToQueue;
    private startQueueProcessor;
    private processQueue;
    private processEmailItem;
    private handleEmailError;
    private retryWithFallback;
    private generateEmailId;
    sendEmailVerification(email: string, token: string, name: string): Promise<boolean>;
    sendPasswordReset(email: string, token: string, name: string): Promise<boolean>;
    sendWelcomeEmail(email: string, name: string): Promise<boolean>;
    sendSecurityAlert(email: string, name: string, activity: string, location: string): Promise<boolean>;
    send2FACode(email: string, name: string, code: string): Promise<boolean>;
    sendPhoneVerification(phone: string, name: string, code: string): Promise<boolean>;
    private getEmailVerificationTemplate;
    private getPasswordResetTemplate;
    private getWelcomeTemplate;
    private getSecurityAlertTemplate;
    private get2FATemplate;
    testConnection(): Promise<boolean>;
    getStats(): Promise<any>;
    close(): Promise<void>;
}
export declare const emailService: ProfessionalEmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map