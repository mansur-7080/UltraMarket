import * as winston from 'winston';
export declare const logger: winston.Logger;
export declare const logRequest: (req: any, res: any, responseTime?: number) => void;
export declare const logSearch: (query: string, results: number, duration: number, filters?: any) => void;
export declare const logIndexing: (operation: string, document: any, success: boolean, error?: Error) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map