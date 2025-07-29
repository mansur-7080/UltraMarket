import * as winston from 'winston';
export declare const logger: winston.Logger;
export declare const logRequest: (req: any, res: any, responseTime?: number) => void;
export declare const logError: (error: Error, context?: any) => void;
export declare const logSecurity: (event: string, details: any) => void;
export declare const logPerformance: (operation: string, duration: number, details?: any) => void;
export declare const logServiceCall: (service: string, endpoint: string, method: string, duration?: number, error?: Error) => void;
export declare const logStream: {
    write: (message: string) => void;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map