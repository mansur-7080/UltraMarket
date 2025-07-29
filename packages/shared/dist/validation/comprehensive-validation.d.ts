/**
 * 🛡️ COMPREHENSIVE INPUT VALIDATION - UltraMarket
 *
 * Barcha input validation, XSS, SQL injection himoyasi
 * Professional security validation system
 *
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const ValidationSchemas: {
    userRegistration: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
        password: z.ZodString;
        dateOfBirth: z.ZodOptional<z.ZodString>;
        gender: z.ZodOptional<z.ZodEnum<{
            male: "male";
            female: "female";
            other: "other";
        }>>;
    }, z.core.$strip>;
    productCreate: z.ZodObject<{
        name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        description: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        price: z.ZodNumber;
        categoryId: z.ZodString;
        sku: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        images: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    orderCreate: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            quantity: z.ZodNumber;
            price: z.ZodNumber;
        }, z.core.$strip>>;
        shippingAddress: z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            region: z.ZodString;
            postalCode: z.ZodString;
            country: z.ZodLiteral<"UZ">;
        }, z.core.$strip>;
        paymentMethod: z.ZodEnum<{
            click: "click";
            card: "card";
            payme: "payme";
            uzcard: "uzcard";
        }>;
    }, z.core.$strip>;
    reviewCreate: z.ZodObject<{
        productId: z.ZodString;
        rating: z.ZodNumber;
        comment: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
    }, z.core.$strip>;
};
/**
 * Advanced security validation class
 */
export declare class SecurityValidator {
    /**
     * Check for SQL injection patterns
     */
    static checkSQLInjection(input: string): {
        isValid: boolean;
        threats: string[];
    };
    /**
     * Check for XSS patterns
     */
    static checkXSS(input: string): {
        isValid: boolean;
        threats: string[];
    };
    /**
     * Check for path traversal
     */
    static checkPathTraversal(input: string): {
        isValid: boolean;
        threats: string[];
    };
    /**
     * Check for command injection
     */
    static checkCommandInjection(input: string): {
        isValid: boolean;
        threats: string[];
    };
    /**
     * Check for NoSQL injection
     */
    static checkNoSQLInjection(input: string): {
        isValid: boolean;
        threats: string[];
    };
    /**
     * Sanitize HTML input
     */
    static sanitizeHTML(input: string, options?: {
        allowedTags?: string[];
        allowedAttributes?: string[];
    }): string;
    /**
     * Comprehensive security validation
     */
    static validateSecurity(input: string): {
        isValid: boolean;
        threats: string[];
        sanitized: string;
    };
    /**
     * Recursively sanitize object
     */
    static sanitizeObject(obj: any): any;
    /**
     * Validate file upload security
     */
    static validateFileUpload(file: {
        filename: string;
        mimetype: string;
        size: number;
    }): {
        isValid: boolean;
        errors: string[];
    };
}
/**
 * Professional validation middleware factory
 */
export declare function validateRequest<T>(schema: z.ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Rate limiting middleware
 */
export declare const createRateLimit: (options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: Request) => string;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const RateLimiters: {
    general: import("express-rate-limit").RateLimitRequestHandler;
    auth: import("express-rate-limit").RateLimitRequestHandler;
    registration: import("express-rate-limit").RateLimitRequestHandler;
    passwordReset: import("express-rate-limit").RateLimitRequestHandler;
    fileUpload: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const SecurityMiddleware: {
    basic: ((req: Request, res: Response, next: NextFunction) => void)[];
    auth: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
    registration: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
    productCreate: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
    orderCreate: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
};
declare const _default: {
    ValidationSchemas: {
        userRegistration: z.ZodObject<{
            firstName: z.ZodString;
            lastName: z.ZodString;
            email: z.ZodString;
            phone: z.ZodString;
            password: z.ZodString;
            dateOfBirth: z.ZodOptional<z.ZodString>;
            gender: z.ZodOptional<z.ZodEnum<{
                male: "male";
                female: "female";
                other: "other";
            }>>;
        }, z.core.$strip>;
        productCreate: z.ZodObject<{
            name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
            description: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
            price: z.ZodNumber;
            categoryId: z.ZodString;
            sku: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            images: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
        orderCreate: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                productId: z.ZodString;
                quantity: z.ZodNumber;
                price: z.ZodNumber;
            }, z.core.$strip>>;
            shippingAddress: z.ZodObject<{
                street: z.ZodString;
                city: z.ZodString;
                region: z.ZodString;
                postalCode: z.ZodString;
                country: z.ZodLiteral<"UZ">;
            }, z.core.$strip>;
            paymentMethod: z.ZodEnum<{
                click: "click";
                card: "card";
                payme: "payme";
                uzcard: "uzcard";
            }>;
        }, z.core.$strip>;
        reviewCreate: z.ZodObject<{
            productId: z.ZodString;
            rating: z.ZodNumber;
            comment: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
        }, z.core.$strip>;
    };
    SecurityValidator: typeof SecurityValidator;
    validateRequest: typeof validateRequest;
    createRateLimit: (options: {
        windowMs: number;
        max: number;
        message?: string;
        skipSuccessfulRequests?: boolean;
        keyGenerator?: (req: Request) => string;
    }) => import("express-rate-limit").RateLimitRequestHandler;
    RateLimiters: {
        general: import("express-rate-limit").RateLimitRequestHandler;
        auth: import("express-rate-limit").RateLimitRequestHandler;
        registration: import("express-rate-limit").RateLimitRequestHandler;
        passwordReset: import("express-rate-limit").RateLimitRequestHandler;
        fileUpload: import("express-rate-limit").RateLimitRequestHandler;
    };
    SecurityMiddleware: {
        basic: ((req: Request, res: Response, next: NextFunction) => void)[];
        auth: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
        registration: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
        productCreate: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
        orderCreate: (import("express-rate-limit").RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
    };
};
export default _default;
//# sourceMappingURL=comprehensive-validation.d.ts.map