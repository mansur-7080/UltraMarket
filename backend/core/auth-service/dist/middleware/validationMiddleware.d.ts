import { Request, Response, NextFunction } from 'express';
export interface ValidationRule {
    type: 'string' | 'number' | 'boolean' | 'email';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    enum?: string[];
    email?: boolean;
    pattern?: RegExp;
}
export interface ValidationSchema {
    [key: string]: ValidationRule;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare const validateRequest: (req: Request, schema: ValidationSchema) => ValidationResult;
export declare const validateBody: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateQuery: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateParams: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const commonSchemas: {
    pagination: {
        page: {
            type: string;
            required: boolean;
            min: number;
        };
        limit: {
            type: string;
            required: boolean;
            min: number;
            max: number;
        };
    };
    email: {
        email: {
            type: string;
            required: boolean;
            email: boolean;
        };
    };
    password: {
        password: {
            type: string;
            required: boolean;
            minLength: number;
        };
    };
    id: {
        id: {
            type: string;
            required: boolean;
            minLength: number;
        };
    };
};
export declare const sanitizeBody: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateContentType: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=validationMiddleware.d.ts.map