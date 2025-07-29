export declare class EmailService {
    private transporter;
    constructor();
    sendWelcomeEmail(email: string, firstName: string): Promise<void>;
    sendVerificationEmail(email: string, token: string): Promise<void>;
    sendPasswordResetEmail(email: string, token: string): Promise<void>;
    sendPasswordResetConfirmation(email: string): Promise<void>;
    sendPasswordChangeNotification(email: string): Promise<void>;
    sendOrderConfirmation(email: string, orderId: string, orderDetails: any): Promise<void>;
    sendOrderStatusUpdate(email: string, orderId: string, status: string): Promise<void>;
    sendAccountDeactivationNotification(email: string): Promise<void>;
}
//# sourceMappingURL=email.service.d.ts.map