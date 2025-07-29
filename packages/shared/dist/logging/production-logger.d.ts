export interface LogContext {
    userId?: string;
    requestId?: string;
    service?: string;
    action?: string;
    metadata?: Record<string, any>;
}
declare class ProductionLogger {
    private logger;
    constructor();
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    trackUserAction(action: string, userId?: string, metadata?: Record<string, any>): void;
    trackApiCall(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void;
    trackPayment(event: string, paymentId: string, amount?: number, currency?: string): void;
    trackVendorEvent(event: string, vendorId: string, metadata?: Record<string, any>): void;
}
export declare const productionLogger: ProductionLogger;
export declare const logInfo: (message: string, context?: LogContext) => void;
export declare const logWarn: (message: string, context?: LogContext) => void;
export declare const logError: (message: string, error?: Error, context?: LogContext) => void;
export declare const logDebug: (message: string, context?: LogContext) => void;
export declare const trackUserAction: (action: string, userId?: string, metadata?: Record<string, any>) => void;
export declare const trackApiCall: (method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext) => void;
export declare const trackPayment: (event: string, paymentId: string, amount?: number, currency?: string) => void;
export declare const trackVendorEvent: (event: string, vendorId: string, metadata?: Record<string, any>) => void;
export {};
//# sourceMappingURL=production-logger.d.ts.map