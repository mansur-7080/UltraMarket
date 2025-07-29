export interface LogLevel {
    ERROR: 'error';
    WARN: 'warn';
    INFO: 'info';
    DEBUG: 'debug';
}
export interface LogContext {
    service?: string;
    userId?: string;
    action?: string;
    metadata?: Record<string, any>;
}
export interface Logger {
    error(message: string, error?: Error, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}
declare class ConsoleLogger implements Logger {
    private service;
    constructor(service?: string);
    private formatMessage;
    error(message: string, error?: Error, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}
export declare const logger: ConsoleLogger;
export declare function createLogger(service: string): Logger;
export {};
//# sourceMappingURL=logger.d.ts.map