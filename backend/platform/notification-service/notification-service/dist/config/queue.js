"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_NAMES = exports.getQueueStats = exports.closeQueues = exports.consumeFromQueue = exports.publishToQueue = exports.initializeQueues = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const logger_1 = require("../utils/logger");
let connection;
let channel;
const QUEUE_NAMES = {
    NOTIFICATIONS: 'notifications',
    SMS_NOTIFICATIONS: 'sms_notifications',
    EMAIL_NOTIFICATIONS: 'email_notifications',
    PUSH_NOTIFICATIONS: 'push_notifications',
    FAILED_NOTIFICATIONS: 'failed_notifications',
    SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
};
exports.QUEUE_NAMES = QUEUE_NAMES;
const initializeQueues = async () => {
    try {
        const rabbitMQUrl = process.env.RABBITMQ_URL ||
            `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASSWORD || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}`;
        connection = await amqplib_1.default.connect(rabbitMQUrl);
        channel = await connection.createChannel();
        // Create queues
        for (const queueName of Object.values(QUEUE_NAMES)) {
            await channel.assertQueue(queueName, {
                durable: true,
                arguments: {
                    'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours
                    'x-max-retries': 3,
                },
            });
        }
        // Create dead letter queue
        await channel.assertQueue('notification_dead_letter', {
            durable: true,
        });
        logger_1.logger.info('Message queues initialized successfully', {
            queues: Object.values(QUEUE_NAMES),
        });
        return { connection, channel };
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize message queues', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};
exports.initializeQueues = initializeQueues;
const publishToQueue = async (queueName, message) => {
    try {
        if (!channel) {
            throw new Error('Queue not initialized. Call initializeQueues() first.');
        }
        const messageBuffer = Buffer.from(JSON.stringify(message));
        await channel.sendToQueue(queueName, messageBuffer, {
            persistent: true,
            timestamp: Date.now(),
        });
        logger_1.logger.debug('Message published to queue', {
            queue: queueName,
            messageId: message.id,
        });
        return true;
    }
    catch (error) {
        logger_1.logger.error('Failed to publish message to queue', {
            error: error instanceof Error ? error.message : 'Unknown error',
            queue: queueName,
            message: message.id,
        });
        throw error;
    }
};
exports.publishToQueue = publishToQueue;
const consumeFromQueue = async (queueName, callback) => {
    try {
        if (!channel) {
            throw new Error('Queue not initialized. Call initializeQueues() first.');
        }
        await channel.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const message = JSON.parse(msg.content.toString());
                    await callback(message);
                    channel.ack(msg);
                    logger_1.logger.debug('Message processed successfully', {
                        queue: queueName,
                        messageId: message.id,
                    });
                }
                catch (error) {
                    logger_1.logger.error('Failed to process message', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        queue: queueName,
                    });
                    // Reject and requeue the message
                    channel.nack(msg, false, true);
                }
            }
        });
        logger_1.logger.info('Started consuming from queue', {
            queue: queueName,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to consume from queue', {
            error: error instanceof Error ? error.message : 'Unknown error',
            queue: queueName,
        });
        throw error;
    }
};
exports.consumeFromQueue = consumeFromQueue;
const closeQueues = async () => {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        logger_1.logger.info('Message queues closed successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to close message queues', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};
exports.closeQueues = closeQueues;
const getQueueStats = async (queueName) => {
    try {
        if (!channel) {
            throw new Error('Queue not initialized. Call initializeQueues() first.');
        }
        const queueInfo = await channel.checkQueue(queueName);
        return {
            queue: queueName,
            messageCount: queueInfo.messageCount,
            consumerCount: queueInfo.consumerCount,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to get queue stats', {
            error: error instanceof Error ? error.message : 'Unknown error',
            queue: queueName,
        });
        throw error;
    }
};
exports.getQueueStats = getQueueStats;
//# sourceMappingURL=queue.js.map