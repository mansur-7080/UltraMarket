/**
 * UltraMarket Shared - Request Validator
 * Professional request validation utilities
 */
import Joi from 'joi';
export interface ValidationResult<T> {
    error?: Joi.ValidationError;
    value: T;
}
/**
 * Validate request body against a Joi schema
 */
export declare function validateRequest<T>(data: any, schema: Joi.ObjectSchema<T>): ValidationResult<T>;
/**
 * Validate request body and throw error if invalid
 */
export declare function validateRequestOrThrow<T>(data: any, schema: Joi.ObjectSchema<T>): T;
/**
 * Validate query parameters
 */
export declare function validateQuery<T>(query: any, schema: Joi.ObjectSchema<T>): ValidationResult<T>;
/**
 * Validate query parameters and throw error if invalid
 */
export declare function validateQueryOrThrow<T>(query: any, schema: Joi.ObjectSchema<T>): T;
/**
 * Validate path parameters
 */
export declare function validateParams<T>(params: any, schema: Joi.ObjectSchema<T>): ValidationResult<T>;
/**
 * Validate path parameters and throw error if invalid
 */
export declare function validateParamsOrThrow<T>(params: any, schema: Joi.ObjectSchema<T>): T;
/**
 * Sanitize and validate pagination parameters
 */
export declare function validatePagination(query: any): {
    page: number;
    limit: number;
    offset: number;
};
/**
 * Validate and sanitize search parameters
 */
export declare function validateSearchParams(query: any): {
    search: string;
    filters: Record<string, any>;
    sort: Record<string, 'asc' | 'desc'>;
};
/**
 * Validate file upload
 */
export declare function validateFileUpload(file: any, options?: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
}): void;
/**
 * Validate email format
 */
export declare function validateEmail(email: string): boolean;
/**
 * Validate phone number format
 */
export declare function validatePhone(phone: string): boolean;
/**
 * Validate password strength
 */
export declare function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
};
/**
 * Sanitize string input
 */
export declare function sanitizeString(input: string): string;
/**
 * Sanitize email input
 */
export declare function sanitizeEmail(email: string): string;
/**
 * Create a validation middleware for Express
 */
export declare function createValidationMiddleware<T>(schema: Joi.ObjectSchema<T>, validateType?: 'body' | 'query' | 'params'): (req: any, res: any, next: any) => void;
//# sourceMappingURL=request-validator.d.ts.map