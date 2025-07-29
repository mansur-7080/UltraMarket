import { PrismaClient } from '@prisma/client';
declare class DatabaseManager {
    private static instance;
    private prisma;
    private config;
    private isConnected;
    private healthCheckInterval;
    constructor();
    static getInstance(): DatabaseManager;
    getClient(): PrismaClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        responseTime: number;
        details?: any;
    }>;
    getStats(): Promise<any>;
    private registerMemoryCleanup;
    private startHealthCheck;
    private getLogLevels;
    private maskDatabaseUrl;
}
export declare const databaseManager: DatabaseManager;
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export {};
//# sourceMappingURL=database-setup.d.ts.map