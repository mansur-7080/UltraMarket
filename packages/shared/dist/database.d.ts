export const __esModule: boolean;
export const prisma: any;
export const databaseService: DatabaseService;
export const transactionService: TransactionService;
export const queryService: QueryService;
export const databaseMonitor: DatabaseMonitor;
declare namespace _default {
    import prisma = prisma;
    export { prisma };
    export { DatabaseService };
    export { TransactionService };
    export { QueryService };
    export { DatabaseMonitor };
    import databaseService = databaseService;
    export { databaseService };
    import transactionService = transactionService;
    export { transactionService };
    import queryService = queryService;
    export { queryService };
    import databaseMonitor = databaseMonitor;
    export { databaseMonitor };
}
export default _default;
export class DatabaseService {
    constructor(client?: any);
    client: any;
    testConnection(): Promise<boolean>;
    getStats(): Promise<{
        stats: any;
    } | {
        stats?: undefined;
    }>;
    runMigration(): Promise<void>;
    backup(): Promise<string>;
    healthCheck(): Promise<{
        status: string;
        details: {
            responseTime: string;
            timestamp: string;
            version: any;
            error?: undefined;
        };
    } | {
        status: string;
        details: {
            error: string;
            timestamp: string;
            responseTime?: undefined;
            version?: undefined;
        };
    }>;
    getVersion(): Promise<any>;
    disconnect(): Promise<void>;
}
export class TransactionService {
    constructor(client?: any);
    client: any;
    executeTransaction(callback: any): Promise<any>;
    executeTransactionWithTimeout(callback: any, timeoutMs?: number): Promise<any>;
    executeTransactionWithIsolation(callback: any, isolationLevel?: string): Promise<any>;
}
export class QueryService {
    constructor(client?: any);
    client: any;
    paginatedQuery(model: any, options: any): Promise<{
        data: any;
        pagination: {
            page: any;
            limit: any;
            total: any;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    searchQuery(model: any, searchTerm: any, searchFields: any, options: any): Promise<{
        data: any;
        pagination: {
            page: any;
            limit: any;
            total: any;
            totalPages: number;
        };
    }>;
    bulkCreate(model: any, data: any): Promise<any>;
    bulkUpdate(model: any, data: any): Promise<any[]>;
    bulkDelete(model: any, ids: any): Promise<any[]>;
}
export class DatabaseMonitor {
    constructor(client?: any);
    client: any;
    getSlowQueries(thresholdMs?: number): Promise<any>;
    getTableStats(): Promise<any>;
    getIndexStats(): Promise<any>;
}
declare namespace ___mnt_d_UltraMarket_packages_shared_src_database_ { }
//# sourceMappingURL=database.d.ts.map