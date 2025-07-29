declare const QUEUE_NAMES: {
    NOTIFICATIONS: string;
    SMS_NOTIFICATIONS: string;
    EMAIL_NOTIFICATIONS: string;
    PUSH_NOTIFICATIONS: string;
    FAILED_NOTIFICATIONS: string;
    SCHEDULED_NOTIFICATIONS: string;
};
export declare const initializeQueues: () => Promise<{
    connection: amqp.Connection;
    channel: amqp.Channel;
}>;
export declare const publishToQueue: (queueName: string, message: any) => Promise<boolean>;
export declare const consumeFromQueue: (queueName: string, callback: (message: any) => Promise<void>) => Promise<void>;
export declare const closeQueues: () => Promise<void>;
export declare const getQueueStats: (queueName: string) => Promise<{
    queue: string;
    messageCount: any;
    consumerCount: any;
    timestamp: string;
}>;
export { QUEUE_NAMES };
//# sourceMappingURL=queue.d.ts.map