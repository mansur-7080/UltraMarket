// Optional NestJS imports with fallbacks
let Injectable: any = null;
let WebSocketGateway: any = null;
let OnGatewayInit: any = null;
let OnGatewayConnection: any = null;
let OnGatewayDisconnect: any = null;
let WebSocketServer: any = null;
let SubscribeMessage: any = null;
let InjectRedis: any = null;
let JwtService: any = null;
let Logger: any = null;

try {
  const nestCommon = require('@nestjs/common');
  const nestWebsockets = require('@nestjs/websockets');
  const nestJwt = require('@nestjs/jwt');
  const nestRedis = require('@nestjs-modules/ioredis');
  
  Injectable = nestCommon.Injectable;
  Logger = nestCommon.Logger;
  WebSocketGateway = nestWebsockets.WebSocketGateway;
  OnGatewayInit = nestWebsockets.OnGatewayInit;
  OnGatewayConnection = nestWebsockets.OnGatewayConnection;
  OnGatewayDisconnect = nestWebsockets.OnGatewayDisconnect;
  WebSocketServer = nestWebsockets.WebSocketServer;
  SubscribeMessage = nestWebsockets.SubscribeMessage;
  InjectRedis = nestRedis.InjectRedis;
  JwtService = nestJwt.JwtService;
} catch (error) {
  console.warn('NestJS not available, using fallback implementation');
  // Fallback decorators and classes
  Injectable = () => (target: any) => target;
  WebSocketGateway = () => (target: any) => target;
  OnGatewayInit = class {};
  OnGatewayConnection = class {};
  OnGatewayDisconnect = class {};
  WebSocketServer = () => (target: any, propertyKey: string) => {};
  SubscribeMessage = () => (target: any, propertyKey: string) => {};
  InjectRedis = () => (target: any, propertyKey: string) => {};
  JwtService = class {};
  Logger = class MockLogger {
    constructor(name: string) {}
    log(message: string) {}
    error(message: string) {}
    warn(message: string) {}
    debug(message: string) {}
  };
}

import { createLogger } from '../utils/logger-replacement';
import { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';

// Interfaces
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

interface WebSocketChannel {
  name: string;
  type: 'public' | 'private' | 'presence';
  permissions: string[];
  subscribers: Set<string>;
  metadata: {
    createdAt: Date;
    description?: string;
    maxSubscribers?: number;
    persistent?: boolean;
  };
}

interface WebSocketEvent {
  type: string;
  channel: string;
  data: any;
  timestamp: Date;
  userId?: string;
  broadcast?: boolean;
  room?: string;
  excludeUser?: string;
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

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeCommunicationService

{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeCommunicationService.name);
  private readonly clients: Map<string, WebSocketClient> = new Map();
  private readonly channels: Map<string, WebSocketChannel> = new Map();
  private readonly messageHistory: Map<string, WebSocketMessage[]> = new Map();

  constructor(
    @InjectRedis() private redis: Redis,
    private jwtService: any
  ) {
    this.initializeChannels();
  }

  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway initialized');
    this.setupRedisSubscriptions();
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const clientInfo = await this.authenticateClient(client);

      if (!clientInfo) {
        client.disconnect(true);
        return;
      }

      this.clients.set(client.id, clientInfo);

      // Join user to their personal room
      if (clientInfo.userId) {
        await client.join(`user:${clientInfo.userId}`);
      }

      // Join session room
      await client.join(`session:${clientInfo.sessionId}`);

      // Track connection
      await this.trackConnection(clientInfo);

      this.logger.log(`Client connected: ${client.id} (User: ${clientInfo.userId})`);

      // Send welcome message
      client.emit('connected', {
        clientId: client.id,
        timestamp: new Date(),
        serverInfo: {
          version: '1.0.0',
          features: ['realtime_notifications', 'chat', 'presence'],
        },
      });

      // Send pending notifications
      if (clientInfo.userId) {
        await this.sendPendingNotifications(client, clientInfo.userId);
      }
    } catch (error) {
      this.logger.error('Error handling connection:', error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const clientInfo = this.clients.get(client.id);

    if (clientInfo) {
      // Track disconnection
      await this.trackDisconnection(clientInfo);

      // Leave all channels
      for (const channel of clientInfo.subscriptions) {
        await this.leaveChannel(client.id, channel);
      }

      this.clients.delete(client.id);

      this.logger.log(`Client disconnected: ${client.id} (User: ${clientInfo.userId})`);
    }
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    client: Socket,
    payload: { channel: string; permissions?: string[] }
  ): Promise<void> {
    try {
      const clientInfo = this.clients.get(client.id);
      if (!clientInfo) return;

      const { channel, permissions = [] } = payload;

      // Validate channel access
      if (!(await this.validateChannelAccess(clientInfo, channel, permissions))) {
        client.emit('error', {
          type: 'access_denied',
          message: 'Access denied to channel',
          channel,
        });
        return;
      }

      // Subscribe to channel
      await this.subscribeToChannel(client, channel);

      client.emit('subscribed', {
        channel,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error handling subscribe:', error);
      client.emit('error', {
        type: 'subscribe_error',
        message: 'Failed to subscribe to channel',
      });
    }
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(client: Socket, payload: { channel: string }): Promise<void> {
    try {
      const { channel } = payload;
      await this.unsubscribeFromChannel(client, channel);

      client.emit('unsubscribed', {
        channel,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error handling unsubscribe:', error);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(client: Socket, payload: WebSocketMessage): Promise<void> {
    try {
      const clientInfo = this.clients.get(client.id);
      if (!clientInfo) return;

      // Validate message
      if (!this.validateMessage(payload)) {
        client.emit('error', {
          type: 'invalid_message',
          message: 'Invalid message format',
        });
        return;
      }

      // Check permissions
      if (!(await this.validateMessagePermissions(clientInfo, payload))) {
        client.emit('error', {
          type: 'permission_denied',
          message: 'Permission denied to send message',
        });
        return;
      }

      // Process and broadcast message
      await this.processMessage(payload, clientInfo);
    } catch (error) {
      this.logger.error('Error handling send message:', error);
    }
  }

  @SubscribeMessage('get_presence')
  async handleGetPresence(client: Socket, payload: { channel: string }): Promise<void> {
    try {
      const { channel } = payload;
      const presence = await this.getChannelPresence(channel);

      client.emit('presence', {
        channel,
        users: presence,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error handling get presence:', error);
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: { channel: string; typing: boolean }): Promise<void> {
    try {
      const clientInfo = this.clients.get(client.id);
      if (!clientInfo) return;

      const { channel, typing } = payload;

      // Broadcast typing status
      client.to(channel).emit('user_typing', {
        userId: clientInfo.userId,
        channel,
        typing,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error handling typing:', error);
    }
  }

  @SubscribeMessage('ping')
  async handlePing(client: Socket): Promise<void> {
    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      clientInfo.lastActivity = new Date();
    }

    client.emit('pong', {
      timestamp: new Date(),
    });
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId: string, notification: RealtimeNotification): Promise<void> {
    try {
      const room = `user:${userId}`;

      // Send to connected clients
      this.server.to(room).emit('notification', notification);

      // Store for offline delivery
      await this.storeNotificationForUser(userId, notification);

      this.logger.log(`Notification sent to user ${userId}: ${notification.type}`);
    } catch (error) {
      this.logger.error('Error sending notification to user:', error);
    }
  }

  /**
   * Send notification to specific role
   */
  async sendNotificationToRole(role: string, notification: RealtimeNotification): Promise<void> {
    try {
      const room = `role:${role}`;

      // Send to connected clients with the role
      this.server.to(room).emit('notification', notification);

      // Store for offline delivery
      await this.storeNotificationForRole(role, notification);

      this.logger.log(`Notification sent to role ${role}: ${notification.type}`);
    } catch (error) {
      this.logger.error('Error sending notification to role:', error);
    }
  }

  /**
   * Broadcast notification to all connected clients
   */
  async broadcastNotification(notification: RealtimeNotification): Promise<void> {
    try {
      this.server.emit('notification', notification);

      // Store for offline delivery
      await this.storeBroadcastNotification(notification);

      this.logger.log(`Broadcast notification sent: ${notification.type}`);
    } catch (error) {
      this.logger.error('Error broadcasting notification:', error);
    }
  }

  /**
   * Send real-time order update
   */
  async sendOrderUpdate(userId: string, orderData: any): Promise<void> {
    const notification: RealtimeNotification = {
      id: this.generateId(),
      type: 'order_update',
      title: 'Order Update',
      message: `Your order #${orderData.orderNumber} has been ${orderData.status}`,
      data: orderData,
      priority: 'high',
      userId,
      channels: [`user:${userId}`],
      timestamp: new Date(),
      actions: [
        {
          label: 'View Order',
          action: 'view_order',
          data: { orderId: orderData.id },
        },
      ],
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send payment status update
   */
  async sendPaymentUpdate(userId: string, paymentData: any): Promise<void> {
    const notification: RealtimeNotification = {
      id: this.generateId(),
      type: 'payment_status',
      title: 'Payment Update',
      message: `Payment ${paymentData.status} for order #${paymentData.orderNumber}`,
      data: paymentData,
      priority: 'high',
      userId,
      channels: [`user:${userId}`],
      timestamp: new Date(),
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send inventory alert to admins
   */
  async sendInventoryAlert(productData: any): Promise<void> {
    const notification: RealtimeNotification = {
      id: this.generateId(),
      type: 'inventory_alert',
      title: 'Low Inventory Alert',
      message: `Product "${productData.name}" is running low (${productData.stock} remaining)`,
      data: productData,
      priority: 'medium',
      userRole: 'admin',
      channels: ['role:admin'],
      timestamp: new Date(),
      actions: [
        {
          label: 'Restock',
          action: 'restock_product',
          data: { productId: productData.id },
        },
      ],
    };

    await this.sendNotificationToRole('admin', notification);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get connected clients by user ID
   */
  getClientsByUserId(userId: string): WebSocketClient[] {
    return Array.from(this.clients.values()).filter((client) => client.userId === userId);
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(channel: string): Promise<{
    subscriberCount: number;
    messageCount: number;
    lastActivity: Date;
  }> {
    const channelInfo = this.channels.get(channel);
    const messageHistory = this.messageHistory.get(channel) || [];

    return {
      subscriberCount: channelInfo?.subscribers.size || 0,
      messageCount: messageHistory.length,
      lastActivity:
        messageHistory.length > 0
          ? messageHistory[messageHistory.length - 1].timestamp
          : new Date(),
    };
  }

  /**
   * Get real-time analytics
   */
  async getRealtimeAnalytics(): Promise<{
    connectedClients: number;
    activeChannels: number;
    messagesPerMinute: number;
    topChannels: Array<{ channel: string; subscribers: number }>;
  }> {
    const activeChannels = Array.from(this.channels.values()).filter(
      (channel) => channel.subscribers.size > 0
    );

    const topChannels = activeChannels
      .map((channel) => ({
        channel: channel.name,
        subscribers: channel.subscribers.size,
      }))
      .sort((a, b) => b.subscribers - a.subscribers)
      .slice(0, 10);

    // Calculate messages per minute (simplified)
    const messagesPerMinute = await this.calculateMessagesPerMinute();

    return {
      connectedClients: this.clients.size,
      activeChannels: activeChannels.length,
      messagesPerMinute,
      topChannels,
    };
  }

  // Private helper methods
  private async authenticateClient(client: Socket): Promise<WebSocketClient | null> {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!token) {
        return {
          id: client.id,
          sessionId: this.generateSessionId(),
          connectedAt: new Date(),
          lastActivity: new Date(),
          metadata: {
            userAgent: client.handshake.headers['user-agent'] || '',
            ipAddress: client.handshake.address || '',
          },
          subscriptions: new Set(),
          permissions: ['guest'],
        };
      }

      const decoded = this.jwtService.verify(token.replace('Bearer ', ''));

      return {
        id: client.id,
        userId: decoded.sub,
        sessionId: this.generateSessionId(),
        connectedAt: new Date(),
        lastActivity: new Date(),
        metadata: {
          userAgent: client.handshake.headers['user-agent'] || '',
          ipAddress: client.handshake.address || '',
        },
        subscriptions: new Set(),
        permissions: decoded.permissions || ['user'],
      };
    } catch (error) {
      this.logger.error('Error authenticating client:', error);
      return null;
    }
  }

  private initializeChannels(): void {
    const defaultChannels = [
      {
        name: 'global',
        type: 'public' as const,
        permissions: [],
        description: 'Global public channel',
      },
      {
        name: 'orders',
        type: 'private' as const,
        permissions: ['user'],
        description: 'Order updates channel',
      },
      {
        name: 'admin',
        type: 'private' as const,
        permissions: ['admin'],
        description: 'Admin notifications channel',
      },
      {
        name: 'support',
        type: 'presence' as const,
        permissions: ['user'],
        description: 'Customer support channel',
      },
    ];

    for (const channelConfig of defaultChannels) {
      this.channels.set(channelConfig.name, {
        name: channelConfig.name,
        type: channelConfig.type,
        permissions: channelConfig.permissions,
        subscribers: new Set(),
        metadata: {
          createdAt: new Date(),
          description: channelConfig.description,
        },
      });
    }

    this.logger.log(`Initialized ${defaultChannels.length} default channels`);
  }

  private async setupRedisSubscriptions(): Promise<void> {
    try {
      // Subscribe to Redis channels for distributed messaging
      await this.redis.subscribe('websocket:broadcast');
      await this.redis.subscribe('websocket:user');
      await this.redis.subscribe('websocket:role');

      this.redis.on('message', (channel, message) => {
        this.handleRedisMessage(channel, message);
      });

      this.logger.log('Redis subscriptions set up');
    } catch (error) {
      this.logger.error('Error setting up Redis subscriptions:', error);
    }
  }

  private handleRedisMessage(channel: string, message: string): void {
    try {
      const data = JSON.parse(message);

      switch (channel) {
        case 'websocket:broadcast':
          this.server.emit(data.event, data.payload);
          break;
        case 'websocket:user':
          this.server.to(`user:${data.userId}`).emit(data.event, data.payload);
          break;
        case 'websocket:role':
          this.server.to(`role:${data.role}`).emit(data.event, data.payload);
          break;
      }
    } catch (error) {
      this.logger.error('Error handling Redis message:', error);
    }
  }

  private async validateChannelAccess(
    client: WebSocketClient,
    channel: string,
    permissions: string[]
  ): Promise<boolean> {
    const channelInfo = this.channels.get(channel);
    if (!channelInfo) return false;

    // Check if channel is public
    if (channelInfo.type === 'public') return true;

    // Check permissions
    const hasPermission = channelInfo.permissions.every((perm) =>
      client.permissions.includes(perm)
    );

    return hasPermission;
  }

  private async subscribeToChannel(client: Socket, channel: string): Promise<void> {
    const clientInfo = this.clients.get(client.id);
    if (!clientInfo) return;

    // Join socket room
    await client.join(channel);

    // Update client subscriptions
    clientInfo.subscriptions.add(channel);

    // Update channel subscribers
    const channelInfo = this.channels.get(channel);
    if (channelInfo) {
      channelInfo.subscribers.add(client.id);
    }

    // Send channel history if available
    const history = this.messageHistory.get(channel);
    if (history && history.length > 0) {
      const recentMessages = history.slice(-50); // Last 50 messages
      client.emit('channel_history', {
        channel,
        messages: recentMessages,
      });
    }
  }

  private async unsubscribeFromChannel(client: Socket, channel: string): Promise<void> {
    const clientInfo = this.clients.get(client.id);
    if (!clientInfo) return;

    // Leave socket room
    await client.leave(channel);

    // Update client subscriptions
    clientInfo.subscriptions.delete(channel);

    // Update channel subscribers
    const channelInfo = this.channels.get(channel);
    if (channelInfo) {
      channelInfo.subscribers.delete(client.id);
    }
  }

  private async leaveChannel(clientId: string, channel: string): Promise<void> {
    const channelInfo = this.channels.get(channel);
    if (channelInfo) {
      channelInfo.subscribers.delete(clientId);
    }
  }

  private validateMessage(message: WebSocketMessage): boolean {
    return !!(message.type && message.channel && message.data);
  }

  private async validateMessagePermissions(
    client: WebSocketClient,
    message: WebSocketMessage
  ): Promise<boolean> {
    const channelInfo = this.channels.get(message.channel);
    if (!channelInfo) return false;

    // Check if client is subscribed to channel
    if (!client.subscriptions.has(message.channel)) return false;

    // Check channel permissions
    return channelInfo.permissions.every((perm) => client.permissions.includes(perm));
  }

  private async processMessage(message: WebSocketMessage, client: WebSocketClient): Promise<void> {
    // Add metadata
    message.id = this.generateId();
    message.timestamp = new Date();
    message.userId = client.userId;
    message.sessionId = client.sessionId;

    // Store message history
    if (!this.messageHistory.has(message.channel)) {
      this.messageHistory.set(message.channel, []);
    }

    const history = this.messageHistory.get(message.channel)!;
    history.push(message);

    // Keep only last 1000 messages
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    // Broadcast message
    this.server.to(message.channel).emit('message', message);

    // Store in Redis for distributed systems
    await this.redis.publish('websocket:message', JSON.stringify(message));
  }

  private async getChannelPresence(channel: string): Promise<any[]> {
    const channelInfo = this.channels.get(channel);
    if (!channelInfo) return [];

    const presence = [];
    for (const clientId of channelInfo.subscribers) {
      const client = this.clients.get(clientId);
      if (client && client.userId) {
        presence.push({
          userId: client.userId,
          connectedAt: client.connectedAt,
          lastActivity: client.lastActivity,
        });
      }
    }

    return presence;
  }

  private async trackConnection(client: WebSocketClient): Promise<void> {
    const connectionData = {
      clientId: client.id,
      userId: client.userId,
      sessionId: client.sessionId,
      connectedAt: client.connectedAt,
      metadata: client.metadata,
    };

    await this.redis.hset('websocket:connections', client.id, JSON.stringify(connectionData));
  }

  private async trackDisconnection(client: WebSocketClient): Promise<void> {
    const disconnectionData = {
      clientId: client.id,
      userId: client.userId,
      sessionId: client.sessionId,
      connectedAt: client.connectedAt,
      disconnectedAt: new Date(),
      duration: new Date().getTime() - client.connectedAt.getTime(),
    };

    await this.redis.lpush('websocket:disconnections', JSON.stringify(disconnectionData));

    await this.redis.hdel('websocket:connections', client.id);
  }

  private async sendPendingNotifications(client: Socket, userId: string): Promise<void> {
    const pendingNotifications = await this.redis.lrange(`notifications:${userId}`, 0, -1);

    for (const notificationData of pendingNotifications) {
      const notification = JSON.parse(notificationData);
      client.emit('notification', notification);
    }

    // Clear pending notifications
    if (pendingNotifications.length > 0) {
      await this.redis.del(`notifications:${userId}`);
    }
  }

  private async storeNotificationForUser(
    userId: string,
    notification: RealtimeNotification
  ): Promise<void> {
    await this.redis.lpush(`notifications:${userId}`, JSON.stringify(notification));

    // Set expiration if specified
    if (notification.expiresAt) {
      const ttl = Math.floor((notification.expiresAt.getTime() - Date.now()) / 1000);
      await this.redis.expire(`notifications:${userId}`, ttl);
    }
  }

  private async storeNotificationForRole(
    role: string,
    notification: RealtimeNotification
  ): Promise<void> {
    await this.redis.lpush(`notifications:role:${role}`, JSON.stringify(notification));
  }

  private async storeBroadcastNotification(notification: RealtimeNotification): Promise<void> {
    await this.redis.lpush('notifications:broadcast', JSON.stringify(notification));
  }

  private async calculateMessagesPerMinute(): Promise<number> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    let messageCount = 0;
    for (const history of this.messageHistory.values()) {
      messageCount += history.filter((msg) => msg.timestamp >= oneMinuteAgo).length;
    }

    return messageCount;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
