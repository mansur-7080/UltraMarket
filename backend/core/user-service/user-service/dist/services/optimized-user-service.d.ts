interface DatabaseClient {
    user: {
        findMany: (args: any) => Promise<any[]>;
        findUnique: (args: any) => Promise<any>;
        count: (args: any) => Promise<number>;
    };
    address: {
        findMany: (args: any) => Promise<any[]>;
    };
    order: {
        findMany: (args: any) => Promise<any[]>;
        count: (args: any) => Promise<number>;
    };
    session: {
        findMany: (args: any) => Promise<any[]>;
    };
    $queryRaw: (query: any, ...params: any[]) => Promise<any[]>;
    $disconnect: () => Promise<void>;
}
interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    addresses?: any[];
    orders?: any[];
    orderStats?: {
        totalOrders: number;
        totalSpent: number;
        lastOrderDate?: Date;
    };
    sessions?: any[];
    recentActivity?: any[];
}
interface OptimizedUserQueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
        role?: string;
        isActive?: boolean;
        isEmailVerified?: boolean;
        search?: string;
        createdAfter?: Date;
        createdBefore?: Date;
    };
    includes?: string[];
    optimizations?: {
        enableN1Elimination?: boolean;
        enableBatchLoading?: boolean;
        enableParallelExecution?: boolean;
        enableStatisticsOptimization?: boolean;
    };
}
interface UserPerformanceMetrics {
    totalQueries: number;
    executionTime: number;
    cacheHitRatio: number;
    optimizationsApplied: string[];
    queryComplexity: number;
    usersProcessed: number;
}
export declare class OptimizedUserService {
    private db;
    private addressLoader;
    private orderLoader;
    private orderStatsLoader;
    private sessionLoader;
    private performanceMetrics;
    private cacheStats;
    constructor(databaseClient: DatabaseClient);
    private initializeDataLoaders;
    getUsers(options?: OptimizedUserQueryOptions): Promise<{
        users: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        performance: UserPerformanceMetrics;
    }>;
    getUserById(userId: string, options?: {
        includes?: string[];
        enableOptimizations?: boolean;
    }): Promise<User | null>;
    private loadUsersWithN1Elimination;
    private loadUsersTraditional;
    private loadSingleUserTraditional;
    private enhanceUsersWithRecentActivity;
    private buildOptimizedWhereClause;
    private calculateQueryCount;
    private calculateQueryComplexity;
    private recordPerformanceMetrics;
    getPerformanceReport(): {
        averageExecutionTime: number;
        totalQueries: number;
        averageQueryComplexity: number;
        averageCacheHitRatio: number;
        totalUsersProcessed: number;
        mostUsedOptimizations: string[];
        recommendations: string[];
    };
    clearCaches(): void;
    clearUserCache(userId: string): void;
    warmUpCache(userIds: string[]): Promise<void>;
    shutdown(): Promise<void>;
}
export default OptimizedUserService;
//# sourceMappingURL=optimized-user-service.d.ts.map