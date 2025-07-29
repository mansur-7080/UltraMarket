/**
 * 🛡️ Ultra Professional CORS & Security Configuration
 * UltraMarket E-commerce Platform
 *
 * Bu fayl comprehensive CORS policy va security headers ni
 * professional tarzda manage qiladi
 */
import cors from 'cors';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
/**
 * 🎯 Environment Types
 */
export type Environment = 'development' | 'production' | 'staging' | 'test';
/**
 * 🔧 CORS Configuration Interface
 */
export interface UltraCorsConfig {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
    optionsSuccessStatus: number;
    preflightContinue: boolean;
}
/**
 * 🛡️ Security Headers Configuration Interface
 */
export interface UltraSecurityConfig {
    contentSecurityPolicy: {
        directives: Record<string, string[]>;
        reportOnly: boolean;
        reportUri?: string;
    };
    frameOptions: 'DENY' | 'SAMEORIGIN' | string;
    xssProtection: boolean;
    contentTypeOptions: boolean;
    referrerPolicy: string;
    permissionsPolicy: Record<string, string[]>;
    strictTransportSecurity: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    expectCertificateTransparency: boolean;
    crossOriginEmbedderPolicy: boolean;
    crossOriginOpenerPolicy: boolean;
    crossOriginResourcePolicy: string;
}
/**
 * 🌟 Ultra Professional CORS & Security Manager
 */
export declare class UltraProfessionalSecurityManager {
    private environment;
    private corsConfig;
    private securityConfig;
    constructor(environment?: Environment);
    /**
     * 🔧 Get default CORS configuration
     */
    private getDefaultCorsConfig;
    /**
     * 🛡️ Get default security configuration
     */
    private getDefaultSecurityConfig;
    /**
     * 🎯 Create CORS middleware
     */
    createCorsMiddleware(): ReturnType<typeof cors>;
    /**
     * 🛡️ Create security headers middleware
     */
    createSecurityMiddleware(): ReturnType<typeof helmet>;
    /**
     * 🚨 Security monitoring middleware
     */
    createSecurityMonitoringMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * 🌐 Create API-specific CORS middleware
     */
    createApiCorsMiddleware(): (req: cors.CorsRequest, res: {
        statusCode?: number | undefined;
        setHeader(key: string, value: string): any;
        end(): any;
    }, next: (err?: any) => any) => void;
    /**
     * 📱 Create mobile app CORS middleware
     */
    createMobileCorsMiddleware(): (req: cors.CorsRequest, res: {
        statusCode?: number | undefined;
        setHeader(key: string, value: string): any;
        end(): any;
    }, next: (err?: any) => any) => void;
    /**
     * 🔧 Update CORS configuration
     */
    updateCorsConfig(config: Partial<UltraCorsConfig>): void;
    /**
     * 🛡️ Update security configuration
     */
    updateSecurityConfig(config: Partial<UltraSecurityConfig>): void;
    /**
     * 📊 Get current configuration
     */
    getConfiguration(): {
        environment: Environment;
        cors: UltraCorsConfig;
        security: UltraSecurityConfig;
    };
    /**
     * 🚨 CSP Violation Report Handler
     */
    createCSPReportHandler(): (req: Request, res: Response) => void;
}
/**
 * 🌟 Create environment-specific security manager
 */
export declare function createSecurityManager(environment?: Environment): UltraProfessionalSecurityManager;
/**
 * 🚀 Quick setup functions
 */
export declare const securitySetup: {
    development: () => UltraProfessionalSecurityManager;
    staging: () => UltraProfessionalSecurityManager;
    production: () => UltraProfessionalSecurityManager;
    test: () => UltraProfessionalSecurityManager;
};
/**
 * 📊 Security utilities
 */
export declare const securityUtils: {
    validateOrigin: (origin: string, allowedOrigins: string[]) => boolean;
    isSecureContext: (req: Request) => boolean;
    extractClientInfo: (req: Request) => {
        ip: string | undefined;
        userAgent: string | undefined;
        origin: string | undefined;
        referer: string | undefined;
        forwardedFor: string | undefined;
        realIp: string | undefined;
    };
};
/**
 * 🌟 Global security manager instance
 */
export declare const ultraSecurityManager: UltraProfessionalSecurityManager;
declare const _default: {
    UltraProfessionalSecurityManager: typeof UltraProfessionalSecurityManager;
    createSecurityManager: typeof createSecurityManager;
    securitySetup: {
        development: () => UltraProfessionalSecurityManager;
        staging: () => UltraProfessionalSecurityManager;
        production: () => UltraProfessionalSecurityManager;
        test: () => UltraProfessionalSecurityManager;
    };
    securityUtils: {
        validateOrigin: (origin: string, allowedOrigins: string[]) => boolean;
        isSecureContext: (req: Request) => boolean;
        extractClientInfo: (req: Request) => {
            ip: string | undefined;
            userAgent: string | undefined;
            origin: string | undefined;
            referer: string | undefined;
            forwardedFor: string | undefined;
            realIp: string | undefined;
        };
    };
    ultraSecurityManager: UltraProfessionalSecurityManager;
};
export default _default;
//# sourceMappingURL=ultra-professional-cors-security.d.ts.map