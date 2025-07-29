export declare const connectDB: () => Promise<void>;
export declare const disconnectDB: () => Promise<void>;
export declare const getConnectionStatus: () => {
    isConnected: boolean;
    readyState: number;
    host?: string;
    port?: number;
    database?: string;
};
export declare const healthCheck: () => Promise<{
    status: "healthy" | "unhealthy";
    details: any;
}>;
export declare const getDatabaseStats: () => Promise<any>;
export declare const createIndexes: () => Promise<void>;
export declare const dropIndexes: (collectionName?: string) => Promise<void>;
export declare const gracefulShutdown: () => Promise<void>;
declare const _default: {
    connectDB: () => Promise<void>;
    disconnectDB: () => Promise<void>;
    getConnectionStatus: () => {
        isConnected: boolean;
        readyState: number;
        host?: string;
        port?: number;
        database?: string;
    };
    healthCheck: () => Promise<{
        status: "healthy" | "unhealthy";
        details: any;
    }>;
    getDatabaseStats: () => Promise<any>;
    createIndexes: () => Promise<void>;
    dropIndexes: (collectionName?: string) => Promise<void>;
    gracefulShutdown: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=database.d.ts.map