export interface PushData {
    to: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    imageUrl?: string;
    clickAction?: string;
    badge?: number;
    sound?: string;
    priority?: 'normal' | 'high';
    timeToLive?: number;
    metadata?: Record<string, any>;
}
export interface PushResult {
    messageId: string;
    status: string;
    provider: string;
    deviceToken: string;
    sentAt: Date;
}
export interface PushProvider {
    name: string;
    type: 'FCM' | 'APNS';
    serverKey?: string;
    keyId?: string;
    teamId?: string;
    bundleId?: string;
    isActive: boolean;
    priority: number;
}
export declare class PushService {
    private providers;
    private fcmServerKey;
    private apnsConfig;
    constructor();
    private initializeProviders;
    sendPushNotification(data: PushData): Promise<PushResult>;
    private sendWithProvider;
    private sendFCMNotification;
    private sendAPNSNotification;
    private generateAPNSJWT;
    private determineProvider;
    private isValidDeviceToken;
    private maskToken;
    sendBulkNotification(notifications: PushData[]): Promise<{
        successful: number;
        failed: number;
        results: Array<{
            success: boolean;
            result?: PushResult;
            error?: string;
        }>;
    }>;
    subscribeToTopic(deviceToken: string, topic: string): Promise<void>;
    unsubscribeFromTopic(deviceToken: string, topic: string): Promise<void>;
    sendToTopic(topic: string, data: Omit<PushData, 'to'>): Promise<PushResult>;
    getProviderStats(): Promise<Array<{
        name: string;
        type: string;
        isActive: boolean;
        priority: number;
    }>>;
}
//# sourceMappingURL=push.service.d.ts.map