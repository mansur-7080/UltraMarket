/**
 * 🚀 PROFESSIONAL LOGGER - Product Service
 *
 * Professional logging system with structured logs, correlation tracking,
 * performance monitoring, and security audit capabilities
 *
 * Version: 3.0.0 - Professional Integration
 * Date: 2024-12-28
 * Service: product-service
 */
import winston from 'winston';
export declare const logger: winston.Logger;
export declare const professionalLogger: {
    error: (message: string, meta?: any) => winston.Logger;
    warn: (message: string, meta?: any) => winston.Logger;
    info: (message: string, meta?: any) => winston.Logger;
    http: (message: string, meta?: any) => winston.Logger;
    verbose: (message: string, meta?: any) => winston.Logger;
    debug: (message: string, meta?: any) => winston.Logger;
    audit: (action: string, details: any, userId?: string) => void;
    security: (event: string, details: any, severity?: "low" | "medium" | "high" | "critical") => void;
    performance: (operation: string, duration: number, metadata?: any) => void;
    business: (operation: string, productId: string, details: any, userId?: string) => void;
    inventory: (operation: string, productId: string, details: any, userId?: string) => void;
    search: (query: string, results: number, userId?: string, metadata?: any) => void;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map