/**
 * PROFESSIONAL JWT SECURITY MANAGER
 * UltraMarket - Production Ready Solution
 *
 * SOLVES: Insecure JWT secrets leading to admin access vulnerabilities
 *
 * Before: Default "your-secret-key" used → Anyone can become admin
 * After: Strong secret validation + Automatic secret generation
 */
export interface JWTSecurityConfig {
    secretMinLength: number;
    secretComplexityPattern: RegExp;
    rotationIntervalMs: number;
    forbiddenSecrets: string[];
    enableSecretRotation: boolean;
    enableSecurityAuditing: boolean;
}
export interface SecretValidationResult {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    issues: string[];
    recommendations: string[];
}
/**
 * JWT Security Manager - Prevents weak JWT implementations
 */
export declare class JWTSecurityManager {
    private static instance;
    private config;
    private currentSecret;
    private secretHistory;
    private lastRotation;
    private readonly FORBIDDEN_SECRETS;
    private constructor();
    static getInstance(config?: Partial<JWTSecurityConfig>): JWTSecurityManager;
    /**
     * CRITICAL: Get secure JWT secret with validation
     */
    getSecureSecret(): string;
    /**
     * Validate JWT secret security
     */
    validateSecret(secret: string): SecretValidationResult;
    /**
     * Generate cryptographically secure JWT secret
     */
    generateSecureSecret(length?: number): string;
    /**
     * Calculate secret entropy
     */
    private calculateEntropy;
    /**
     * Audit secret usage for security monitoring
     */
    private auditSecretUsage;
    /**
     * Check if secret rotation is needed
     */
    isRotationNeeded(): boolean;
    /**
     * Rotate JWT secret (for production environments)
     */
    rotateSecret(): {
        oldSecret: string;
        newSecret: string;
    };
    /**
     * Get previous secrets for gradual rotation
     */
    getPreviousSecrets(): string[];
    /**
     * Security status check
     */
    getSecurityStatus(): any;
    /**
     * Emergency security check - blocks application if critical issues found
     */
    performSecurityCheck(): void;
}
export declare const jwtSecurityManager: JWTSecurityManager;
/**
 * Utility functions for easy JWT security
 */
export declare const getSecureJWTSecret: () => string;
export declare const validateJWTSecret: (secret: string) => SecretValidationResult;
export declare const generateSecureJWTSecret: (length?: number) => string;
export declare const performJWTSecurityCheck: () => void;
export default jwtSecurityManager;
//# sourceMappingURL=jwt-security-manager.d.ts.map