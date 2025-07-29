/**
 * Comprehensive Input Validation System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha input validation va security issues ni hal qilish uchun
 */
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const CommonValidationSchemas: {
    uzbekPhoneNumber: z.ZodString;
    email: z.ZodString;
    strongPassword: z.ZodString;
    uuid: z.ZodString;
    positiveInteger: z.ZodNumber;
    price: z.ZodNumber;
    slug: z.ZodString;
    htmlContent: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    fileUpload: z.ZodObject<{
        mimetype: z.ZodEnum<{
            "image/jpeg": "image/jpeg";
            "image/png": "image/png";
            "image/webp": "image/webp";
            "application/pdf": "application/pdf";
        }>;
        size: z.ZodNumber;
    }, z.core.$strip>;
};
export declare const ProductValidationSchema: z.ZodObject<{
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    slug: z.ZodString;
    description: z.ZodPipe<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>, z.ZodTransform<string | undefined, string | undefined>>;
    price: z.ZodNumber;
    comparePrice: z.ZodOptional<z.ZodNumber>;
    sku: z.ZodString;
    categoryId: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UserValidationSchema: z.ZodObject<{
    firstName: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    lastName: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<{
        male: "male";
        female: "female";
        other: "other";
    }>>;
    role: z.ZodDefault<z.ZodEnum<{
        CUSTOMER: "CUSTOMER";
        ADMIN: "ADMIN";
        MANAGER: "MANAGER";
    }>>;
}, z.core.$strip>;
export declare const OrderValidationSchema: z.ZodObject<{
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
        cash: "cash";
        payme: "payme";
        uzcard: "uzcard";
    }>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare class XSSProtection {
    static sanitizeInput(input: string, allowedTags?: string[]): string;
    static sanitizeObject<T extends Record<string, any>>(obj: T): T;
}
export declare class SQLInjectionProtection {
    static validateParameterizedQuery(query: string): boolean;
    static sanitizeOrderBy(orderBy: string): string;
}
export declare const createRateLimit: (windowMs: number, max: number, message?: string) => import("express-rate-limit").RateLimitRequestHandler;
export declare const validateRequest: <T>(schema: z.ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateFileUpload: (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const setupValidationMiddleware: (app: any) => void;
//# sourceMappingURL=comprehensive-input-validation.d.ts.map