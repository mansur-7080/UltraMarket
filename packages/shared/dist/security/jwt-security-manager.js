"use strict";
/**
 * PROFESSIONAL JWT SECURITY MANAGER
 * UltraMarket - Production Ready Solution
 *
 * SOLVES: Insecure JWT secrets leading to admin access vulnerabilities
 *
 * Before: Default "your-secret-key" used → Anyone can become admin
 * After: Strong secret validation + Automatic secret generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.performJWTSecurityCheck = exports.generateSecureJWTSecret = exports.validateJWTSecret = exports.getSecureJWTSecret = exports.jwtSecurityManager = exports.JWTSecurityManager = void 0;
const crypto_1 = require("crypto");
const logger_1 = require("../logging/logger");
/**
 * JWT Security Manager - Prevents weak JWT implementations
 */
class JWTSecurityManager {
    static instance;
    config;
    currentSecret = null;
    secretHistory = [];
    lastRotation = null;
    // CRITICAL: Known insecure secrets that must be blocked
    FORBIDDEN_SECRETS = [
        'your-secret-key',
        'secret',
        'jwt-secret',
        'ultramarket-secret',
        'development-secret',
        'test-secret',
        'local-secret',
        'default-secret',
        'admin-secret',
        'password',
        '123456',
        'secret123',
        'jwt',
        'token-secret',
        'auth-secret',
        'super-secret',
        'my-secret',
        'app-secret',
        'server-secret',
        'api-secret'
    ];
    constructor(config) {
        this.config = {
            secretMinLength: 32,
            secretComplexityPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{32,}$/,
            rotationIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
            forbiddenSecrets: this.FORBIDDEN_SECRETS,
            enableSecretRotation: process.env.NODE_ENV === 'production',
            enableSecurityAuditing: true,
            ...config
        };
    }
    static getInstance(config) {
        if (!JWTSecurityManager.instance) {
            JWTSecurityManager.instance = new JWTSecurityManager(config);
        }
        return JWTSecurityManager.instance;
    }
    /**
     * CRITICAL: Get secure JWT secret with validation
     */
    getSecureSecret() {
        // Check environment variable first
        const envSecret = process.env.JWT_SECRET;
        if (envSecret) {
            const validation = this.validateSecret(envSecret);
            if (!validation.isValid) {
                logger_1.logger.error('CRITICAL SECURITY VIOLATION: JWT secret validation failed', {
                    issues: validation.issues,
                    recommendations: validation.recommendations
                });
                throw new Error(`CRITICAL SECURITY ERROR: JWT secret is insecure. Issues: ${validation.issues.join(', ')}`);
            }
            if (validation.strength === 'weak') {
                logger_1.logger.warn('WARNING: JWT secret strength is weak', {
                    strength: validation.strength,
                    recommendations: validation.recommendations
                });
            }
            this.currentSecret = envSecret;
            this.auditSecretUsage('environment_variable', validation.strength);
            return envSecret;
        }
        // Generate secure secret if none provided
        logger_1.logger.warn('JWT_SECRET not provided, generating secure secret');
        const generatedSecret = this.generateSecureSecret();
        logger_1.logger.warn('GENERATED SECURE JWT SECRET - SAVE THIS:', {
            secret: generatedSecret,
            notice: 'Add this to your environment variables as JWT_SECRET'
        });
        this.currentSecret = generatedSecret;
        this.auditSecretUsage('auto_generated', 'strong');
        return generatedSecret;
    }
    /**
     * Validate JWT secret security
     */
    validateSecret(secret) {
        const issues = [];
        const recommendations = [];
        let strength = 'strong';
        // Check if secret is forbidden
        const normalizedSecret = secret.toLowerCase().trim();
        if (this.config.forbiddenSecrets.some(forbidden => normalizedSecret.includes(forbidden.toLowerCase()) ||
            forbidden.toLowerCase().includes(normalizedSecret))) {
            issues.push('Secret contains forbidden/common patterns');
            recommendations.push('Use a unique, randomly generated secret');
            strength = 'weak';
        }
        // Check minimum length
        if (secret.length < this.config.secretMinLength) {
            issues.push(`Secret too short (${secret.length} < ${this.config.secretMinLength})`);
            recommendations.push(`Use at least ${this.config.secretMinLength} characters`);
            strength = 'weak';
        }
        // Check complexity
        if (!this.config.secretComplexityPattern.test(secret)) {
            issues.push('Secret lacks complexity (needs uppercase, lowercase, numbers, special chars)');
            recommendations.push('Include uppercase, lowercase, numbers, and special characters');
            if (strength !== 'weak')
                strength = 'medium';
        }
        // Check for common patterns
        if (/^(.)\1+$/.test(secret)) {
            issues.push('Secret contains repeated characters');
            recommendations.push('Use varied characters');
            strength = 'weak';
        }
        // Check for sequential patterns
        if (/123|abc|qwerty|password/i.test(secret)) {
            issues.push('Secret contains predictable patterns');
            recommendations.push('Avoid sequential or dictionary words');
            strength = 'weak';
        }
        // Check entropy
        const entropy = this.calculateEntropy(secret);
        if (entropy < 4.0) {
            issues.push('Secret has low entropy (not random enough)');
            recommendations.push('Use more random characters');
            if (strength === 'strong')
                strength = 'medium';
        }
        return {
            isValid: issues.length === 0,
            strength,
            issues,
            recommendations
        };
    }
    /**
     * Generate cryptographically secure JWT secret
     */
    generateSecureSecret(length = 64) {
        // Use crypto.randomBytes for cryptographically secure randomness
        const randomBuffer = (0, crypto_1.randomBytes)(length);
        // Convert to base64 and make URL-safe
        let secret = randomBuffer
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        // Ensure minimum length
        if (secret.length < this.config.secretMinLength) {
            secret = secret + this.generateSecureSecret(this.config.secretMinLength - secret.length);
        }
        // Add timestamp to ensure uniqueness
        const timestamp = Date.now().toString(36);
        const hmac = (0, crypto_1.createHmac)('sha256', secret).update(timestamp).digest('hex').substring(0, 8);
        return `${secret}${hmac}`;
    }
    /**
     * Calculate secret entropy
     */
    calculateEntropy(secret) {
        const frequency = {};
        for (const char of secret) {
            frequency[char] = (frequency[char] || 0) + 1;
        }
        let entropy = 0;
        const length = secret.length;
        for (const count of Object.values(frequency)) {
            const probability = count / length;
            entropy -= probability * Math.log2(probability);
        }
        return entropy;
    }
    /**
     * Audit secret usage for security monitoring
     */
    auditSecretUsage(source, strength) {
        if (!this.config.enableSecurityAuditing)
            return;
        const audit = {
            timestamp: new Date().toISOString(),
            source,
            strength,
            environment: process.env.NODE_ENV || 'unknown',
            service: process.env.SERVICE_NAME || 'unknown',
            secretHash: (0, crypto_1.createHash)('sha256').update(this.currentSecret || '').digest('hex').substring(0, 16)
        };
        logger_1.logger.info('JWT secret security audit', audit);
        // Alert on weak secrets
        if (strength === 'weak') {
            logger_1.logger.error('SECURITY ALERT: Weak JWT secret detected', {
                ...audit,
                severity: 'HIGH',
                action_required: 'Replace with secure secret immediately'
            });
        }
    }
    /**
     * Check if secret rotation is needed
     */
    isRotationNeeded() {
        if (!this.config.enableSecretRotation || !this.lastRotation) {
            return false;
        }
        const timeSinceRotation = Date.now() - this.lastRotation.getTime();
        return timeSinceRotation >= this.config.rotationIntervalMs;
    }
    /**
     * Rotate JWT secret (for production environments)
     */
    rotateSecret() {
        const oldSecret = this.currentSecret;
        const newSecret = this.generateSecureSecret();
        if (oldSecret) {
            this.secretHistory.push(oldSecret);
            // Keep only last 5 secrets for gradual transition
            if (this.secretHistory.length > 5) {
                this.secretHistory = this.secretHistory.slice(-5);
            }
        }
        this.currentSecret = newSecret;
        this.lastRotation = new Date();
        logger_1.logger.warn('JWT SECRET ROTATED', {
            timestamp: new Date().toISOString(),
            oldSecretHash: oldSecret ? (0, crypto_1.createHash)('sha256').update(oldSecret).digest('hex').substring(0, 16) : 'none',
            newSecretHash: (0, crypto_1.createHash)('sha256').update(newSecret).digest('hex').substring(0, 16)
        });
        return { oldSecret: oldSecret || '', newSecret };
    }
    /**
     * Get previous secrets for gradual rotation
     */
    getPreviousSecrets() {
        return [...this.secretHistory];
    }
    /**
     * Security status check
     */
    getSecurityStatus() {
        const currentSecret = this.currentSecret || process.env.JWT_SECRET;
        const validation = currentSecret ? this.validateSecret(currentSecret) : null;
        return {
            hasSecret: !!currentSecret,
            secretSource: currentSecret === process.env.JWT_SECRET ? 'environment' : 'generated',
            validation: validation ? {
                isValid: validation.isValid,
                strength: validation.strength,
                issueCount: validation.issues.length
            } : null,
            rotation: {
                enabled: this.config.enableSecretRotation,
                lastRotation: this.lastRotation,
                nextRotation: this.lastRotation ?
                    new Date(this.lastRotation.getTime() + this.config.rotationIntervalMs) :
                    null,
                isRotationNeeded: this.isRotationNeeded()
            },
            auditingEnabled: this.config.enableSecurityAuditing
        };
    }
    /**
     * Emergency security check - blocks application if critical issues found
     */
    performSecurityCheck() {
        const status = this.getSecurityStatus();
        if (!status.hasSecret) {
            throw new Error('CRITICAL: No JWT secret configured');
        }
        if (status.validation && !status.validation.isValid) {
            throw new Error('CRITICAL: JWT secret validation failed - application blocked for security');
        }
        if (status.validation && status.validation.strength === 'weak') {
            logger_1.logger.error('SECURITY WARNING: Weak JWT secret detected', status);
        }
    }
}
exports.JWTSecurityManager = JWTSecurityManager;
// Export singleton with production-ready configuration
exports.jwtSecurityManager = JWTSecurityManager.getInstance({
    enableSecretRotation: process.env.NODE_ENV === 'production',
    enableSecurityAuditing: true
});
/**
 * Utility functions for easy JWT security
 */
const getSecureJWTSecret = () => {
    return exports.jwtSecurityManager.getSecureSecret();
};
exports.getSecureJWTSecret = getSecureJWTSecret;
const validateJWTSecret = (secret) => {
    return exports.jwtSecurityManager.validateSecret(secret);
};
exports.validateJWTSecret = validateJWTSecret;
const generateSecureJWTSecret = (length) => {
    return exports.jwtSecurityManager.generateSecureSecret(length);
};
exports.generateSecureJWTSecret = generateSecureJWTSecret;
const performJWTSecurityCheck = () => {
    exports.jwtSecurityManager.performSecurityCheck();
};
exports.performJWTSecurityCheck = performJWTSecurityCheck;
exports.default = exports.jwtSecurityManager;
//# sourceMappingURL=jwt-security-manager.js.map