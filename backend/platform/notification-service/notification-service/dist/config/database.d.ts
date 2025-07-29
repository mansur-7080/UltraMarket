export declare const connectDatabase: () => Promise<PrismaClient>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const getDatabaseClient: () => any;
export declare const checkDatabaseHealth: () => Promise<{
    status: string;
    responseTime: number;
    timestamp: string;
    error?: undefined;
} | {
    status: string;
    error: string;
    timestamp: string;
    responseTime?: undefined;
}>;
//# sourceMappingURL=database.d.ts.map