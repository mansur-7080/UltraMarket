/**
 * UltraMarket E-Commerce Platform
 * Professional TypeScript Database Client
 * Enterprise-Grade Database Management
 */
interface QueryMetrics {
    totalQueries: number;
    slowQueries: number;
    failedQueries: number;
    averageResponseTime: number;
    connectionPoolSize: number;
    activeConnections: number;
    peakConnections: number;
    cacheHitRate: number;
}
interface DatabaseHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    connections: {
        active: number;
        idle: number;
        total: number;
        max: number;
    };
    queries: {
        running: number;
        queued: number;
        completed: number;
    };
    lastCheck: Date;
    uptime: number;
}
interface AuditLog {
    id: string;
    operation: string;
    table: string;
    recordId?: string;
    userId?: string;
    before?: any;
    after?: any;
    timestamp: Date;
    duration: number;
    success: boolean;
    error?: string;
}
interface TransactionOptions {
    timeout?: number;
    isolationLevel?: any;
    maxWait?: number;
}
export declare class DatabaseClient {
    private static instance;
    private prisma;
    private metrics;
    private health;
    private auditLogs;
    private queryCache;
    private isConnected;
    private constructor();
    static getInstance(): DatabaseClient;
    private setupEventListeners;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    findUnique<T>(model: string, args: any, options?: {
        cache?: boolean;
        ttl?: number;
    }): Promise<T | null>;
    findMany<T>(model: string, args: any, options?: {
        cache?: boolean;
        ttl?: number;
    }): Promise<T[]>;
    create<T>(model: string, args: any, userId?: string): Promise<T>;
    update<T>(model: string, args: any, userId?: string): Promise<T>;
    delete<T>(model: string, args: any, userId?: string): Promise<T>;
    transaction<T>(operations: (prisma: any) => Promise<T>, options?: TransactionOptions): Promise<T>;
    query<T = any>(sql: string, values?: any[]): Promise<T[]>;
    execute(sql: string, values?: any[]): Promise<number>;
    healthCheck(): Promise<DatabaseHealth>;
    getMetrics(): QueryMetrics;
    getAuditLogs(limit?: number): AuditLog[];
    private recordQueryMetrics;
    private handleDatabaseError;
    private logAudit;
    private generateQueryId;
    private getFromCache;
    private setCache;
    private invalidateCache;
    private cleanCache;
    private maskDatabaseUrl;
    private startHealthMonitoring;
    get client(): any;
    get isHealthy(): boolean;
    get status(): DatabaseHealth;
}
export declare const database: DatabaseClient;
export declare const db: any;
export declare const dbHealth: () => Promise<DatabaseHealth>;
export declare const dbMetrics: () => QueryMetrics;
export declare const dbAuditLogs: (limit?: number) => AuditLog[];
export default database;
//# sourceMappingURL=index.d.ts.map