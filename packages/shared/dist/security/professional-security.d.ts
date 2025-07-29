/**
 * 🛡️ PROFESSIONAL SECURITY MIDDLEWARE - UltraMarket Platform
 *
 * Enterprise-grade security middleware with comprehensive protection for
 * O'zbekiston e-commerce platform including:
 * - Advanced threat detection and prevention
 * - Financial transaction security (PCI DSS compliance)
 * - O'zbekiston regulatory compliance
 * - Real-time security monitoring and alerting
 * - Professional audit logging with correlation tracking
 *
 * Version: 4.0.0 - Professional Security Suite
 * Date: 2024-12-28
 * Compliance: PCI DSS Level 1, O'zbekiston Data Protection Laws
 */
export interface ProfessionalSecurityConfig {
    serviceName: string;
    securityLevel: 'standard' | 'high' | 'critical' | 'financial';
    rateLimiting: {
        windowMs: number;
        max: number;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    cors: {
        origin: string[] | string | boolean;
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        maxAge: number;
    };
    helmet: {
        contentSecurityPolicy: any;
        crossOriginEmbedderPolicy: boolean;
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
    };
    ipBlocking: {
        enabled: boolean;
        maxSuspiciousRequests: number;
        blockDuration: number;
        whitelist: string[];
        blacklist: string[];
    };
    threatDetection: {
        enabled: boolean;
        sqlInjectionProtection: boolean;
        xssProtection: boolean;
        csrfProtection: boolean;
        pathTraversalProtection: boolean;
        dataExfiltrationProtection: boolean;
    };
    auditLogging: {
        enabled: boolean;
        logLevel: 'basic' | 'detailed' | 'comprehensive';
        sensitiveDataMasking: boolean;
        correlationTracking: boolean;
    };
}
export declare enum SecurityErrorCodes {
    RATE_LIMIT_EXCEEDED = "SEC_001",
    IP_BLOCKED = "SEC_002",
    SUSPICIOUS_ACTIVITY = "SEC_003",
    SQL_INJECTION_ATTEMPT = "SEC_004",
    XSS_ATTEMPT = "SEC_005",
    CSRF_VIOLATION = "SEC_006",
    PATH_TRAVERSAL_ATTEMPT = "SEC_007",
    DATA_EXFILTRATION_ATTEMPT = "SEC_008",
    INVALID_AUTHENTICATION = "SEC_009",
    UNAUTHORIZED_ACCESS = "SEC_010",
    MALFORMED_REQUEST = "SEC_011",
    SECURITY_HEADER_VIOLATION = "SEC_012"
}
declare const ADVANCED_THREAT_PATTERNS: {
    sqlInjection: RegExp[];
    xss: RegExp[];
    pathTraversal: RegExp[];
    dataExfiltration: RegExp[];
};
declare const UZBEKISTAN_SECURITY_PATTERNS: {
    phoneNumbers: RegExp;
    passportNumbers: RegExp;
    bankCards: RegExp;
    innNumbers: RegExp;
};
export declare class ProfessionalSecurityMiddleware {
    private config;
    private blockedIPs;
    private suspiciousIPs;
    private rateLimiters;
    private correlationTracker;
    constructor(config: Partial<ProfessionalSecurityConfig> & {
        serviceName: string;
    });
    /**
     * Apply comprehensive professional security middleware
     */
    applySecurityMiddleware(app: any): void;
    /**
     * Request correlation tracking middleware
     */
    private correlationTrackingMiddleware;
    /**
     * Performance monitoring middleware
     */
    private performanceMonitoringMiddleware;
    /**
     * Professional security headers middleware
     */
    private professionalSecurityHeaders;
    /**
     * Advanced CORS middleware
     */
    private advancedCorsMiddleware;
    /**
     * Secure compression middleware
     */
    private secureCompressionMiddleware;
    /**
     * IP reputation middleware
     */
    private ipReputationMiddleware;
    /**
     * Advanced rate limiting middleware
     */
    private advancedRateLimitingMiddleware;
    /**
     * Threat detection middleware
     */
    private threatDetectionMiddleware;
    /**
     * Input validation middleware
     */
    private inputValidationMiddleware;
    /**
     * Security audit logging middleware
     */
    private securityAuditMiddleware;
    private mergeConfig;
    private getSecurityHeadersForLevel;
    private initializeRateLimiters;
    private initializeIPManagement;
    private getRateLimiterForEndpoint;
    private isValidOrigin;
    private detectThreats;
    private maskSensitiveData;
    private addSuspiciousIP;
    private logSecurityEvent;
}
export declare const createUserServiceSecurity: (config?: Partial<ProfessionalSecurityConfig>) => ProfessionalSecurityMiddleware;
export declare const createPaymentServiceSecurity: (config?: Partial<ProfessionalSecurityConfig>) => ProfessionalSecurityMiddleware;
export declare const createProductServiceSecurity: (config?: Partial<ProfessionalSecurityConfig>) => ProfessionalSecurityMiddleware;
export declare const createOrderServiceSecurity: (config?: Partial<ProfessionalSecurityConfig>) => ProfessionalSecurityMiddleware;
export default ProfessionalSecurityMiddleware;
export type { SecurityErrorCodes };
export { ADVANCED_THREAT_PATTERNS, UZBEKISTAN_SECURITY_PATTERNS };
//# sourceMappingURL=professional-security.d.ts.map