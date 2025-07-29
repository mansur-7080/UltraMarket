export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
        [key: string]: ServiceHealth;
    };
    system: SystemHealth;
}
export interface ServiceHealth {
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime: number;
    details?: any;
    error?: string;
}
export interface SystemHealth {
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    cpu: {
        usage: number;
    };
    disk: {
        used: number;
        total: number;
        percentage: number;
    };
    network: {
        connections: number;
    };
}
export declare class HealthCheckService {
    private configService;
    private readonly logger;
    private readonly startTime;
    private pgPool;
    private redisClient;
    private mongoClient;
    private elasticsearchClient;
    private minioClient;
    constructor(configService: ConfigService);
    private initializeClients;
    getHealthStatus(): Promise<HealthCheckResult>;
    private getResultValue;
    private checkPostgreSQL;
    private checkRedis;
    private checkMongoDB;
    private checkElasticsearch;
    private checkMinIO;
    private getSystemHealth;
    private parseRedisInfo;
    checkExternalServices(): Promise<{
        [key: string]: ServiceHealth;
    }>;
    private checkClickPayment;
    private checkPaymePayment;
    private checkEskizSMS;
    private checkPlayMobileSMS;
    onApplicationShutdown(): Promise<void>;
}
//# sourceMappingURL=health-check.service.d.ts.map