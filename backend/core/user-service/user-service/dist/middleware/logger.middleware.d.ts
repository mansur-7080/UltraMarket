import { Request, Response, NextFunction } from 'express';
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const stream: {
    write: (message: string) => void;
};
//# sourceMappingURL=logger.middleware.d.ts.map