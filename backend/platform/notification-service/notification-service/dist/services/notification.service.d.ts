export interface NotificationPayload {
    userId: string;
    type: 'email' | 'sms' | 'push' | 'in-app';
    template: string;
    data: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    channels?: string[];
    scheduledAt?: Date;
    metadata?: Record<string, any>;
}
export interface EmailNotification {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}
export interface SMSNotification {
    to: string;
    message: string;
    template?: string;
    data?: Record<string, any>;
}
export interface PushNotification {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: string;
    icon?: string;
    clickAction?: string;
}
export interface InAppNotification {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
}
export declare class NotificationService {
    private emailTransporter;
    private templates;
    constructor();
    /**
     * Initialize email service
     */
    private initializeEmailService;
    /**
     * Send notification
     */
    sendNotification(payload: NotificationPayload): Promise<void>;
    /**
     * Send email notification
     */
    sendEmail(notification: EmailNotification): Promise<void>;
    /**
     * Send SMS notification
     */
    sendSMS(notification: SMSNotification): Promise<void>;
    /**
     * Send push notification
     */
    sendPush(notification: PushNotification): Promise<void>;
    /**
     * Send in-app notification
     */
    sendInApp(notification: InAppNotification): Promise<void>;
    /**
     * Send bulk notifications
     */
    sendBulkNotifications(notifications: NotificationPayload[]): Promise<void>;
    /**
     * Get user notification preferences
     */
    getUserPreferences(userId: string): Promise<any>;
    /**
     * Update user notification preferences
     */
    updateUserPreferences(userId: string, preferences: any): Promise<void>;
    /**
     * Get notification history
     */
    getNotificationHistory(userId: string, options: {
        limit?: number;
        offset?: number;
        type?: string;
    }): Promise<any[]>;
    /**
     * Mark notification as read
     */
    markAsRead(userId: string, notificationId: string): Promise<void>;
    /**
     * Private helper methods
     */
    private sendByChannel;
    private createEmailTransporter;
    private loadTemplates;
    private renderTemplate;
    private getUserEmail;
    private getUserPhone;
    private scheduleNotification;
    private storeNotificationHistory;
    /**
     * Health check
     */
    healthCheck(): Promise<boolean>;
    /**
     * Process scheduled notifications
     */
    processScheduledNotifications(): Promise<void>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map