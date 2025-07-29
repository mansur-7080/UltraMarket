/**
 * 🛡️ ULTRA PROFESSIONAL INPUT VALIDATION SYSTEM
 * UltraMarket E-commerce Platform
 *
 * Comprehensive protection against:
 * - SQL Injection attacks
 * - XSS (Cross-Site Scripting)
 * - NoSQL Injection
 * - Command Injection
 * - Path Traversal
 * - LDAP Injection
 * - File Upload attacks
 * - Data validation and sanitization
 *
 * @author UltraMarket Security Team
 * @version 3.0.0
 * @date 2024-12-28
 */
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export interface ValidationResult {
    isValid: boolean;
    data?: any;
    errors: ValidationError[];
    securityThreats: SecurityThreat[];
    sanitizedData?: any;
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface SecurityThreat {
    type: 'SQL_INJECTION' | 'XSS' | 'NOSQL_INJECTION' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'LDAP_INJECTION';
    field: string;
    payload: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    blocked: boolean;
}
export interface ValidationOptions {
    sanitize: boolean;
    strictMode: boolean;
    allowHtml: boolean;
    logThreats: boolean;
    blockOnThreat: boolean;
    maxStringLength: number;
    maxArrayLength: number;
    maxObjectDepth: number;
}
export interface FileValidationOptions {
    maxSize: number;
    allowedTypes: string[];
    allowedExtensions: string[];
    scanForMalware: boolean;
    checkMagicBytes: boolean;
}
/**
 * Ultra Professional Input Validator
 */
export declare class UltraProfessionalValidator {
    private options;
    private securityPatterns;
    constructor(options?: Partial<ValidationOptions>);
    /**
     * Initialize comprehensive security threat patterns
     */
    private initializeSecurityPatterns;
    /**
     * Validate data with comprehensive security checks
     */
    validate<T>(data: any, schema: z.ZodSchema<T>, options?: Partial<ValidationOptions>): Promise<ValidationResult>;
    /**
     * Detect security threats in data
     */
    private detectSecurityThreats;
    /**
     * Calculate threat severity
     */
    private calculateThreatSeverity;
    /**
     * Sanitize data recursively
     */
    private sanitizeData;
    /**
     * Sanitize string with comprehensive cleaning
     */
    private sanitizeString;
    /**
     * Perform custom validations
     */
    private performCustomValidations;
    /**
     * Calculate object depth
     */
    private getObjectDepth;
    /**
     * Validate file uploads
     */
    validateFile(file: {
        originalname: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
    }, options: FileValidationOptions): Promise<ValidationResult>;
    /**
     * Validate file signature against MIME type
     */
    private validateFileSignature;
    /**
     * Basic malware signature check
     */
    private basicMalwareCheck;
    /**
     * Sanitize data for logging (remove sensitive information)
     */
    private sanitizeForLogging;
    /**
     * Create validation middleware for Express.js
     */
    createMiddleware<T>(schema: z.ZodSchema<T>, options?: Partial<ValidationOptions & {
        source: 'body' | 'query' | 'params';
    }>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const UltraMarketSchemas: {
    userRegistration: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodString;
        dateOfBirth: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodEnum<{
            UZ: "UZ";
            RU: "RU";
            EN: "EN";
        }>>;
    }, z.core.$strip>;
    userLogin: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        deviceId: z.ZodOptional<z.ZodString>;
        rememberMe: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    product: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        price: z.ZodNumber;
        currency: z.ZodDefault<z.ZodEnum<{
            UZS: "UZS";
            USD: "USD";
            EUR: "EUR";
        }>>;
        categoryId: z.ZodString;
        brandId: z.ZodOptional<z.ZodString>;
        sku: z.ZodString;
        images: z.ZodArray<z.ZodString>;
        specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        weight: z.ZodOptional<z.ZodNumber>;
        dimensions: z.ZodOptional<z.ZodObject<{
            length: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    order: z.ZodObject<{
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
            country: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        paymentMethod: z.ZodEnum<{
            click: "click";
            payme: "payme";
            uzcard: "uzcard";
            cash_on_delivery: "cash_on_delivery";
        }>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    fileUpload: z.ZodObject<{
        originalname: z.ZodString;
        mimetype: z.ZodString;
        size: z.ZodNumber;
    }, z.core.$strip>;
};
export declare const validator: UltraProfessionalValidator;
export declare const FileValidationOptions: {
    image: {
        maxSize: number;
        allowedTypes: string[];
        allowedExtensions: string[];
        scanForMalware: boolean;
        checkMagicBytes: boolean;
    };
    document: {
        maxSize: number;
        allowedTypes: string[];
        allowedExtensions: string[];
        scanForMalware: boolean;
        checkMagicBytes: boolean;
    };
    avatar: {
        maxSize: number;
        allowedTypes: string[];
        allowedExtensions: string[];
        scanForMalware: boolean;
        checkMagicBytes: boolean;
    };
};
//# sourceMappingURL=ultra-professional-validator.d.ts.map