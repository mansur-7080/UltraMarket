import { Request, Response, NextFunction } from 'express';
export declare const validateRequest: (schema: any) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateEmailField: (fieldName?: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validatePasswordField: (fieldName?: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const requireFields: (fields: string[]) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateStringLength: (fieldName: string, minLength?: number, maxLength?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateNumberField: (fieldName: string, min?: number, max?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateArrayField: (fieldName: string, minLength?: number, maxLength?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateUuidField: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateDateField: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const validateBooleanField: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=validation.d.ts.map