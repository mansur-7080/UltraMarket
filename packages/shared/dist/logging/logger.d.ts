/**
 * UltraMarket Logger
 * Professional logging utility with structured logging and multiple transports
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    DEBUG = "debug"
}
export declare class Logger {
    private serviceName;
    constructor(serviceName?: string);
    private log;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error | any, meta?: any): void;
    debug(message: string, meta?: any): void;
    http(message: string, meta?: any): void;
    performance(operation: string, startTime: number, meta?: any): void;
    business(event: string, data: any): void;
    security(event: string, data: any): void;
    apiRequest(method: string, url: string, statusCode: number, responseTime: number, meta?: any): void;
}
export declare const logger: Logger;
export declare const requestLoggerMiddleware: (req: any, res: any, next: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map