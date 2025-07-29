import { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';
interface WebSocketClient {
    id: string;
    userId?: string;
    sessionId: string;
    connectedAt: Date;
    lastActivity: Date;
    metadata: {
        userAgent: string;
        ipAddress: string;
        location?: string;
        device?: string;
        browser?: string;
    };
    subscriptions: Set<string>;
    permissions: string[];
}
interface WebSocketMessage {
    id: string;
    type: string;
    channel: string;
    data: any;
    timestamp: Date;
    userId?: string;
    sessionId: string;
    metadata?: {
        priority: 'low' | 'medium' | 'high' | 'urgent';
        ttl?: number;
        persistent?: boolean;
        encryption?: boolean;
    };
}
interface RealtimeNotification {
    id: string;
    type: 'order_update' | 'payment_status' | 'inventory_alert' | 'chat_message' | 'system_alert';
    title: string;
    message: string;
    data?: any;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    userId?: string;
    userRole?: string;
    channels: string[];
    timestamp: Date;
    expiresAt?: Date;
    actions?: Array<{
        label: string;
        action: string;
        data?: any;
    }>;
}
export declare class RealtimeCommunicationService {
    private redis;
    private jwtService;
    server: Server;
    private readonly logger;
    private readonly clients;
    private readonly channels;
    private readonly messageHistory;
    constructor(redis: Redis, jwtService: any);
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleSubscribe(client: Socket, payload: {
        channel: string;
        permissions?: string[];
    }): Promise<void>;
    handleUnsubscribe(client: Socket, payload: {
        channel: string;
    }): Promise<void>;
    handleSendMessage(client: Socket, payload: WebSocketMessage): Promise<void>;
    handleGetPresence(client: Socket, payload: {
        channel: string;
    }): Promise<void>;
    handleTyping(client: Socket, payload: {
        channel: string;
        typing: boolean;
    }): Promise<void>;
    handlePing(client: Socket): Promise<void>;
    /**
     * Send notification to specific user
     */
    sendNotificationToUser(userId: string, notification: RealtimeNotification): Promise<void>;
    /**
     * Send notification to specific role
     */
    sendNotificationToRole(role: string, notification: RealtimeNotification): Promise<void>;
    /**
     * Broadcast notification to all connected clients
     */
    broadcastNotification(notification: RealtimeNotification): Promise<void>;
    /**
     * Send real-time order update
     */
    sendOrderUpdate(userId: string, orderData: any): Promise<void>;
    /**
     * Send payment status update
     */
    sendPaymentUpdate(userId: string, paymentData: any): Promise<void>;
    /**
     * Send inventory alert to admins
     */
    sendInventoryAlert(productData: any): Promise<void>;
    /**
     * Get connected clients count
     */
    getConnectedClientsCount(): number;
    /**
     * Get connected clients by user ID
     */
    getClientsByUserId(userId: string): WebSocketClient[];
    /**
     * Get channel statistics
     */
    getChannelStats(channel: string): Promise<{
        subscriberCount: number;
        messageCount: number;
        lastActivity: Date;
    }>;
    /**
     * Get real-time analytics
     */
    getRealtimeAnalytics(): Promise<{
        connectedClients: number;
        activeChannels: number;
        messagesPerMinute: number;
        topChannels: Array<{
            channel: string;
            subscribers: number;
        }>;
    }>;
    private authenticateClient;
    private initializeChannels;
    private setupRedisSubscriptions;
    private handleRedisMessage;
    private validateChannelAccess;
    private subscribeToChannel;
    private unsubscribeFromChannel;
    private leaveChannel;
    private validateMessage;
    private validateMessagePermissions;
    private processMessage;
    private getChannelPresence;
    private trackConnection;
    private trackDisconnection;
    private sendPendingNotifications;
    private storeNotificationForUser;
    private storeNotificationForRole;
    private storeBroadcastNotification;
    private calculateMessagesPerMinute;
    private generateId;
    private generateSessionId;
}
export {};
//# sourceMappingURL=realtime-communication.service.d.ts.map