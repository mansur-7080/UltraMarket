/**
 * 🚀 PROFESSIONAL LOGGING SYSTEM - UltraMarket
 *
 * Barcha console.log statements larini almashtiruvchi professional TypeScript logger
 * Production-ready Winston logger with structured logging
 *
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */
import winston from 'winston';
export declare class ProfessionalLogger {
    logger: winston.Logger;
    private serviceName;
    private requestId?;
    constructor(serviceName?: string, requestId?: string);
    info(message: string, metadata?: Record<string, any>): void;
    error(message: string, error?: Error | any, metadata?: Record<string, any>): void;
    warn(message: string, metadata?: Record<string, any>): void;
    debug(message: string, metadata?: Record<string, any>): void;
    http(message: string, metadata?: Record<string, any>): void;
    time(label: string): void;
    timeEnd(label: string, metadata?: Record<string, any>): void;
    database(operation: string, table: string, duration?: number, metadata?: Record<string, any>): void;
    auth(action: string, userId?: string, metadata?: Record<string, any>): void;
    apiRequest(method: string, path: string, statusCode: number, duration: number, metadata?: Record<string, any>): void;
    business(event: string, metadata?: Record<string, any>): void;
    security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>): void;
}
export declare const logger: ProfessionalLogger;
export declare const createLogger: (serviceName: string, requestId?: string) => ProfessionalLogger;
export declare const createRequestLogger: (serviceName: string) => (req: any, res: any, next: any) => void;
export declare const replaceConsole: () => void;
export declare const eslintRules: {
    'no-console': string;
    'no-debugger': string;
};
export declare const validateNoConsoleInProduction: (filePath: string) => boolean;
export declare const gracefulShutdown: () => void;
export default logger;
//# sourceMappingURL=professional-logger.d.ts.map