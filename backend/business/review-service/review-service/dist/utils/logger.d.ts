import winston from 'winston';
declare const logger: winston.Logger;
declare const stream: {
    write: (message: string) => void;
};
declare const logWithContext: (level: string, message: string, context?: any) => void;
declare const logError: (message: string, error?: Error, context?: any) => void;
declare const logInfo: (message: string, context?: any) => void;
declare const logWarn: (message: string, context?: any) => void;
declare const logDebug: (message: string, context?: any) => void;
declare const logHttp: (message: string, context?: any) => void;
declare const logPerformance: (operation: string, startTime: number, context?: any) => void;
declare const logBusinessEvent: (event: string, data?: any) => void;
declare const logSecurityEvent: (event: string, userId?: string, ip?: string, details?: any) => void;
export { logger, stream, logWithContext, logError, logInfo, logWarn, logDebug, logHttp, logPerformance, logBusinessEvent, logSecurityEvent, };
export default logger;
//# sourceMappingURL=logger.d.ts.map