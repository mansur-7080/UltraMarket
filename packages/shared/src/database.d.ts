import { PrismaClient, Prisma } from '@prisma/client';
interface PrismaModel {
    findMany: (args: any) => Promise<any[]>;
    count: (args: any) => Promise<number>;
    createMany: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
}
interface QueryOptions {
    page?: number;
    limit?: number;
    where?: Record<string, any>;
    orderBy?: Record<string, any>;
    include?: Record<string, any>;
    select?: Record<string, any>;
}
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;
export declare const prisma: any;
export declare class DatabaseService {
    private client;
    constructor(client?: PrismaClient);
    testConnection(): Promise<boolean>;
    getStats(): Promise<Record<string, any>>;
    runMigration(): Promise<void>;
    backup(): Promise<string>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: Record<string, any>;
    }>;
    getVersion(): Promise<string>;
    disconnect(): Promise<void>;
}
export declare class TransactionService {
    private client;
    constructor(client?: PrismaClient);
    executeTransaction<T>(callback: (tx: TransactionClient) => Promise<T>): Promise<T>;
    executeTransactionWithTimeout<T>(callback: (tx: TransactionClient) => Promise<T>, timeoutMs?: number): Promise<T>;
    executeTransactionWithIsolation<T>(callback: (tx: TransactionClient) => Promise<T>, isolationLevel?: Prisma.TransactionIsolationLevel): Promise<T>;
}
export declare class QueryService {
    private client;
    constructor(client?: PrismaClient);
    paginatedQuery<T>(model: PrismaModel, options: QueryOptions): Promise<{
        data: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    searchQuery<T>(model: PrismaModel, searchTerm: string, searchFields: string[], options: {
        page?: number;
        limit?: number;
        where?: Record<string, any>;
        orderBy?: Record<string, any>;
        include?: Record<string, any>;
    }): Promise<{
        data: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    bulkCreate<T>(model: PrismaModel, data: Record<string, any>[]): Promise<T[]>;
    bulkUpdate<T>(model: PrismaModel, data: Array<{
        id: string;
        [key: string]: any;
    }>): Promise<T[]>;
    bulkDelete<T>(model: PrismaModel, ids: string[]): Promise<T[]>;
}
export declare class DatabaseMonitor {
    private client;
    constructor(client?: PrismaClient);
    getSlowQueries(thresholdMs?: number): Promise<any[]>;
    getTableStats(): Promise<any[]>;
    getIndexStats(): Promise<any[]>;
}
export declare const databaseService: DatabaseService;
export declare const transactionService: TransactionService;
export declare const queryService: QueryService;
export declare const databaseMonitor: DatabaseMonitor;
declare const _default: {
    prisma: any;
    DatabaseService: typeof DatabaseService;
    TransactionService: typeof TransactionService;
    QueryService: typeof QueryService;
    DatabaseMonitor: typeof DatabaseMonitor;
    databaseService: DatabaseService;
    transactionService: TransactionService;
    queryService: QueryService;
    databaseMonitor: DatabaseMonitor;
};
export default _default;
//# sourceMappingURL=database.d.ts.map