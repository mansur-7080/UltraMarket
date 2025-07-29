/**
 * Professional Logger System - Console.log Replacement
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha console.log statements ni almashtirish uchun ishlatiladi
 */
import winston from 'winston';
export declare const createLogger: (serviceName: string) => winston.Logger;
export declare class ProductionLogger {
    private logger;
    constructor(serviceName: string);
    info(message: string, meta?: Record<string, any>): void;
    error(message: string, error?: Error, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
    private generateRequestId;
}
export declare const authLogger: ProductionLogger;
export declare const productLogger: ProductionLogger;
export declare const orderLogger: ProductionLogger;
export declare const paymentLogger: ProductionLogger;
export declare const validateNoConsoleLog: (filePath: string) => boolean;
//# sourceMappingURL=logger-replacement.d.ts.map