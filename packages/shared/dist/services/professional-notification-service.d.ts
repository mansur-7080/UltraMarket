export type NotificationType = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
export interface BaseNotification {
    id?: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority: NotificationPriority;
    category: string;
    sendAt?: Date;
    expiresAt?: Date;
    status?: NotificationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface EmailNotification extends BaseNotification {
    type: 'email';
    recipient: string;
    template?: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        contentType?: string;
    }>;
}
export interface SMSNotification extends BaseNotification {
    type: 'sms';
    phoneNumber: string;
    from?: string;
}
export interface PushNotification extends BaseNotification {
    type: 'push';
    deviceTokens: string[];
    icon?: string;
    badge?: number;
    sound?: string;
    clickAction?: string;
}
export interface InAppNotification extends BaseNotification {
    type: 'in_app';
    actionUrl?: string;
    buttons?: Array<{
        text: string;
        action: string;
        style?: 'primary' | 'secondary' | 'danger';
    }>;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    type: NotificationType;
    language: 'uz' | 'ru' | 'en';
    title: string;
    message: string;
    emailTemplate?: string;
    variables: string[];
}
export interface NotificationConfig {
    sms: {
        provider: 'eskiz' | 'playmobile';
        apiUrl: string;
        login: string;
        password: string;
        from: string;
        retryAttempts: number;
    };
    push: {
        fcm: {
            serverKey: string;
            senderId: string;
        };
        apn: {
            keyId: string;
            teamId: string;
            bundleId: string;
            production: boolean;
        };
    };
    rateLimit: {
        smsPerMinute: number;
        emailPerMinute: number;
        pushPerMinute: number;
    };
}
export interface NotificationStats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
    byCategory: Record<string, number>;
}
export declare class ProfessionalNotificationService {
    private config;
    private templates;
    private notificationQueue;
    private processing;
    private stats;
    private rateLimitCounters;
    constructor(config: NotificationConfig);
    /**
     * Load notification templates
     */
    private loadNotificationTemplates;
    /**
     * Send notification
     */
    sendNotification(notification: BaseNotification): Promise<boolean>;
    /**
     * Send bulk notifications
     */
    sendBulkNotifications(notifications: BaseNotification[]): Promise<{
        success: number;
        failed: number;
    }>;
    /**
     * Start queue processor
     */
    private startQueueProcessor;
    /**
     * Process notification queue
     */
    private processNotificationQueue;
    /**
     * Send email notification
     */
    private sendEmailNotification;
    /**
     * Send SMS notification (Eskiz.uz integration)
     */
    private sendSMSNotification;
    /**
     * Send push notification (Firebase FCM)
     */
    private sendPushNotification;
    /**
     * Send in-app notification (store in database)
     */
    private sendInAppNotification;
    /**
     * Get notification template
     */
    private getTemplate;
    /**
     * Render template with data
     */
    private renderTemplate;
    /**
     * Check rate limits
     */
    private canSendNotification;
    /**
     * Increment rate limit counter
     */
    private incrementRateLimit;
    /**
     * Reset rate limit counters
     */
    private resetRateLimitCounters;
    /**
     * Get notification statistics
     */
    getStatistics(): NotificationStats;
    /**
     * Get queue status
     */
    getQueueStatus(): {
        pending: number;
        processing: boolean;
        byType: Record<NotificationType, number>;
    };
    /**
     * Clear failed notifications
     */
    clearFailedNotifications(): number;
    /**
     * Test notification configuration
     */
    testConfiguration(): Promise<{
        sms: boolean;
        push: boolean;
        email: boolean;
    }>;
    /**
     * Shutdown notification service
     */
    shutdown(): Promise<void>;
}
export declare const notificationService: ProfessionalNotificationService;
export default notificationService;
//# sourceMappingURL=professional-notification-service.d.ts.map