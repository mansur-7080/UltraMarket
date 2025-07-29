import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export interface ValidationOptions {
    abortEarly?: boolean;
    allowUnknown?: boolean;
    stripUnknown?: boolean;
    skipFunctions?: boolean;
    convert?: boolean;
}
export declare const validateRequest: (schema: Joi.ObjectSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: Joi.ObjectSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: Joi.ObjectSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateAll: (schemas: {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeHtml: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateFileUpload: (options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
    required?: boolean;
}) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const handleValidationError: (error: any, req: Request, res: Response, next: NextFunction) => void;
export default validateRequest;
//# sourceMappingURL=validation.middleware.d.ts.map