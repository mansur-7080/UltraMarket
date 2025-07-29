"use strict";
var RealtimeCommunicationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeCommunicationService = void 0;
const tslib_1 = require("tslib");
// Optional NestJS imports with fallbacks
let Injectable = null;
let WebSocketGateway = null;
let OnGatewayInit = null;
let OnGatewayConnection = null;
let OnGatewayDisconnect = null;
let WebSocketServer = null;
let SubscribeMessage = null;
let InjectRedis = null;
let JwtService = null;
let Logger = null;
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
}
catch (error) {
    console.warn('NestJS not available, using fallback implementation');
    // Fallback decorators and classes
    Injectable = () => (target) => target;
    WebSocketGateway = () => (target) => target;
    OnGatewayInit = class {
    };
    OnGatewayConnection = class {
    };
    OnGatewayDisconnect = class {
    };
    WebSocketServer = () => (target, propertyKey) => { };
    SubscribeMessage = () => (target, propertyKey) => { };
    InjectRedis = () => (target, propertyKey) => { };
    JwtService = class {
    };
    Logger = class MockLogger {
        constructor(name) { }
        log(message) { }
        error(message) { }
        warn(message) { }
        debug(message) { }
    };
}
const ioredis_1 = require("ioredis");
const socket_io_1 = require("socket.io");
let RealtimeCommunicationService = RealtimeCommunicationService_1 = class RealtimeCommunicationService {
    redis;
    jwtService;
    server;
    logger = new Logger(RealtimeCommunicationService_1.name);
    clients = new Map();
    channels = new Map();
    messageHistory = new Map();
    constructor(redis, jwtService) {
        this.redis = redis;
        this.jwtService = jwtService;
        this.initializeChannels();
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
        this.setupRedisSubscriptions();
    }
    async handleConnection(client) {
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
        }
        catch (error) {
            this.logger.error('Error handling connection:', error);
            client.disconnect(true);
        }
    }
    async handleDisconnect(client) {
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
    async handleSubscribe(client, payload) {
        try {
            const clientInfo = this.clients.get(client.id);
            if (!clientInfo)
                return;
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
        }
        catch (error) {
            this.logger.error('Error handling subscribe:', error);
            client.emit('error', {
                type: 'subscribe_error',
                message: 'Failed to subscribe to channel',
            });
        }
    }
    async handleUnsubscribe(client, payload) {
        try {
            const { channel } = payload;
            await this.unsubscribeFromChannel(client, channel);
            client.emit('unsubscribed', {
                channel,
                timestamp: new Date(),
            });
        }
        catch (error) {
            this.logger.error('Error handling unsubscribe:', error);
        }
    }
    async handleSendMessage(client, payload) {
        try {
            const clientInfo = this.clients.get(client.id);
            if (!clientInfo)
                return;
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
        }
        catch (error) {
            this.logger.error('Error handling send message:', error);
        }
    }
    async handleGetPresence(client, payload) {
        try {
            const { channel } = payload;
            const presence = await this.getChannelPresence(channel);
            client.emit('presence', {
                channel,
                users: presence,
                timestamp: new Date(),
            });
        }
        catch (error) {
            this.logger.error('Error handling get presence:', error);
        }
    }
    async handleTyping(client, payload) {
        try {
            const clientInfo = this.clients.get(client.id);
            if (!clientInfo)
                return;
            const { channel, typing } = payload;
            // Broadcast typing status
            client.to(channel).emit('user_typing', {
                userId: clientInfo.userId,
                channel,
                typing,
                timestamp: new Date(),
            });
        }
        catch (error) {
            this.logger.error('Error handling typing:', error);
        }
    }
    async handlePing(client) {
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
    async sendNotificationToUser(userId, notification) {
        try {
            const room = `user:${userId}`;
            // Send to connected clients
            this.server.to(room).emit('notification', notification);
            // Store for offline delivery
            await this.storeNotificationForUser(userId, notification);
            this.logger.log(`Notification sent to user ${userId}: ${notification.type}`);
        }
        catch (error) {
            this.logger.error('Error sending notification to user:', error);
        }
    }
    /**
     * Send notification to specific role
     */
    async sendNotificationToRole(role, notification) {
        try {
            const room = `role:${role}`;
            // Send to connected clients with the role
            this.server.to(room).emit('notification', notification);
            // Store for offline delivery
            await this.storeNotificationForRole(role, notification);
            this.logger.log(`Notification sent to role ${role}: ${notification.type}`);
        }
        catch (error) {
            this.logger.error('Error sending notification to role:', error);
        }
    }
    /**
     * Broadcast notification to all connected clients
     */
    async broadcastNotification(notification) {
        try {
            this.server.emit('notification', notification);
            // Store for offline delivery
            await this.storeBroadcastNotification(notification);
            this.logger.log(`Broadcast notification sent: ${notification.type}`);
        }
        catch (error) {
            this.logger.error('Error broadcasting notification:', error);
        }
    }
    /**
     * Send real-time order update
     */
    async sendOrderUpdate(userId, orderData) {
        const notification = {
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
    async sendPaymentUpdate(userId, paymentData) {
        const notification = {
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
    async sendInventoryAlert(productData) {
        const notification = {
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
    getConnectedClientsCount() {
        return this.clients.size;
    }
    /**
     * Get connected clients by user ID
     */
    getClientsByUserId(userId) {
        return Array.from(this.clients.values()).filter((client) => client.userId === userId);
    }
    /**
     * Get channel statistics
     */
    async getChannelStats(channel) {
        const channelInfo = this.channels.get(channel);
        const messageHistory = this.messageHistory.get(channel) || [];
        return {
            subscriberCount: channelInfo?.subscribers.size || 0,
            messageCount: messageHistory.length,
            lastActivity: messageHistory.length > 0
                ? messageHistory[messageHistory.length - 1].timestamp
                : new Date(),
        };
    }
    /**
     * Get real-time analytics
     */
    async getRealtimeAnalytics() {
        const activeChannels = Array.from(this.channels.values()).filter((channel) => channel.subscribers.size > 0);
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
    async authenticateClient(client) {
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
        }
        catch (error) {
            this.logger.error('Error authenticating client:', error);
            return null;
        }
    }
    initializeChannels() {
        const defaultChannels = [
            {
                name: 'global',
                type: 'public',
                permissions: [],
                description: 'Global public channel',
            },
            {
                name: 'orders',
                type: 'private',
                permissions: ['user'],
                description: 'Order updates channel',
            },
            {
                name: 'admin',
                type: 'private',
                permissions: ['admin'],
                description: 'Admin notifications channel',
            },
            {
                name: 'support',
                type: 'presence',
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
    async setupRedisSubscriptions() {
        try {
            // Subscribe to Redis channels for distributed messaging
            await this.redis.subscribe('websocket:broadcast');
            await this.redis.subscribe('websocket:user');
            await this.redis.subscribe('websocket:role');
            this.redis.on('message', (channel, message) => {
                this.handleRedisMessage(channel, message);
            });
            this.logger.log('Redis subscriptions set up');
        }
        catch (error) {
            this.logger.error('Error setting up Redis subscriptions:', error);
        }
    }
    handleRedisMessage(channel, message) {
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
        }
        catch (error) {
            this.logger.error('Error handling Redis message:', error);
        }
    }
    async validateChannelAccess(client, channel, permissions) {
        const channelInfo = this.channels.get(channel);
        if (!channelInfo)
            return false;
        // Check if channel is public
        if (channelInfo.type === 'public')
            return true;
        // Check permissions
        const hasPermission = channelInfo.permissions.every((perm) => client.permissions.includes(perm));
        return hasPermission;
    }
    async subscribeToChannel(client, channel) {
        const clientInfo = this.clients.get(client.id);
        if (!clientInfo)
            return;
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
    async unsubscribeFromChannel(client, channel) {
        const clientInfo = this.clients.get(client.id);
        if (!clientInfo)
            return;
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
    async leaveChannel(clientId, channel) {
        const channelInfo = this.channels.get(channel);
        if (channelInfo) {
            channelInfo.subscribers.delete(clientId);
        }
    }
    validateMessage(message) {
        return !!(message.type && message.channel && message.data);
    }
    async validateMessagePermissions(client, message) {
        const channelInfo = this.channels.get(message.channel);
        if (!channelInfo)
            return false;
        // Check if client is subscribed to channel
        if (!client.subscriptions.has(message.channel))
            return false;
        // Check channel permissions
        return channelInfo.permissions.every((perm) => client.permissions.includes(perm));
    }
    async processMessage(message, client) {
        // Add metadata
        message.id = this.generateId();
        message.timestamp = new Date();
        message.userId = client.userId;
        message.sessionId = client.sessionId;
        // Store message history
        if (!this.messageHistory.has(message.channel)) {
            this.messageHistory.set(message.channel, []);
        }
        const history = this.messageHistory.get(message.channel);
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
    async getChannelPresence(channel) {
        const channelInfo = this.channels.get(channel);
        if (!channelInfo)
            return [];
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
    async trackConnection(client) {
        const connectionData = {
            clientId: client.id,
            userId: client.userId,
            sessionId: client.sessionId,
            connectedAt: client.connectedAt,
            metadata: client.metadata,
        };
        await this.redis.hset('websocket:connections', client.id, JSON.stringify(connectionData));
    }
    async trackDisconnection(client) {
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
    async sendPendingNotifications(client, userId) {
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
    async storeNotificationForUser(userId, notification) {
        await this.redis.lpush(`notifications:${userId}`, JSON.stringify(notification));
        // Set expiration if specified
        if (notification.expiresAt) {
            const ttl = Math.floor((notification.expiresAt.getTime() - Date.now()) / 1000);
            await this.redis.expire(`notifications:${userId}`, ttl);
        }
    }
    async storeNotificationForRole(role, notification) {
        await this.redis.lpush(`notifications:role:${role}`, JSON.stringify(notification));
    }
    async storeBroadcastNotification(notification) {
        await this.redis.lpush('notifications:broadcast', JSON.stringify(notification));
    }
    async calculateMessagesPerMinute() {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        let messageCount = 0;
        for (const history of this.messageHistory.values()) {
            messageCount += history.filter((msg) => msg.timestamp >= oneMinuteAgo).length;
        }
        return messageCount;
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.RealtimeCommunicationService = RealtimeCommunicationService;
tslib_1.__decorate([
    WebSocketServer(),
    tslib_1.__metadata("design:type", socket_io_1.Server)
], RealtimeCommunicationService.prototype, "server", void 0);
tslib_1.__decorate([
    SubscribeMessage('subscribe'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], RealtimeCommunicationService.prototype, "handleSubscribe", null);
tslib_1.__decorate([
    SubscribeMessage('unsubscribe'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], RealtimeCommunicationService.prototype, "handleUnsubscribe", null);
tslib_1.__decorate([
    SubscribeMessage('send_message'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], RealtimeCommunicationService.prototype, "handleSendMessage", null);
tslib_1.__decorate([
    SubscribeMessage('get_presence'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], RealtimeCommunicationService.prototype, "handleGetPresence", null);
tslib_1.__decorate([
    SubscribeMessage('typing'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], RealtimeCommunicationService.prototype, "handleTyping", null);
tslib_1.__decorate([
    SubscribeMessage('ping'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket]),
    tslib_1.__metadata("design:returntype", Promise)
], RealtimeCommunicationService.prototype, "handlePing", null);
exports.RealtimeCommunicationService = RealtimeCommunicationService = RealtimeCommunicationService_1 = tslib_1.__decorate([
    Injectable(),
    WebSocketGateway({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        namespace: '/realtime',
        transports: ['websocket', 'polling'],
    }),
    tslib_1.__param(0, InjectRedis()),
    tslib_1.__metadata("design:paramtypes", [ioredis_1.Redis, Object])
], RealtimeCommunicationService);
//# sourceMappingURL=realtime-communication.service.js.map