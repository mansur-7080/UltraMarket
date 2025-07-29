"use strict";
/**
 * 🔐 PROFESSIONAL JWT MANAGER - UltraMarket
 *
 * Secure, scalable JWT token management with O'zbekiston compliance
 * Advanced security features, monitoring, va performance optimization
 *
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePasswordResetToken = exports.generateVerificationToken = exports.refreshTokenPair = exports.validateToken = exports.generateTokenPair = exports.professionalJWTManager = exports.ProfessionalJWTManager = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const crypto = tslib_1.__importStar(require("crypto"));
const professional_logger_1 = require("../logging/professional-logger");
const secure_environment_manager_1 = require("../config/secure-environment-manager");
const unified_error_handler_1 = require("../errors/unified-error-handler");
// JWT service logger
const jwtLogger = (0, professional_logger_1.createLogger)('professional-jwt-manager');
/**
 * Professional JWT Manager with O'zbekiston compliance
 */
class ProfessionalJWTManager {
    static instance;
    config;
    blacklistedTokens = new Set();
    activeSessions = new Map();
    secretRotationTimer = null;
    constructor() {
        this.config = this.loadSecureConfiguration();
        this.initializeSecurityFeatures();
        jwtLogger.info('🔐 Professional JWT Manager initialized', {
            issuer: this.config.issuer,
            algorithm: this.config.algorithm,
            securityFeaturesEnabled: {
                rotation: this.config.security.enableRotation,
                blacklisting: this.config.security.enableBlacklisting,
                deviceTracking: this.config.security.enableDeviceTracking,
                ipValidation: this.config.security.enableIPValidation
            }
        });
    }
    /**
     * Singleton pattern implementation
     */
    static getInstance() {
        if (!ProfessionalJWTManager.instance) {
            ProfessionalJWTManager.instance = new ProfessionalJWTManager();
        }
        return ProfessionalJWTManager.instance;
    }
    /**
     * Load configuration from secure environment manager
     */
    loadSecureConfiguration() {
        try {
            const config = {
                secrets: {
                    accessToken: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ACCESS_SECRET') ||
                        secure_environment_manager_1.secureEnvManager.generateBase64Secret(64),
                    refreshToken: secure_environment_manager_1.secureEnvManager.getConfig('JWT_REFRESH_SECRET') ||
                        secure_environment_manager_1.secureEnvManager.generateBase64Secret(64),
                    verification: secure_environment_manager_1.secureEnvManager.getConfig('JWT_VERIFICATION_SECRET') ||
                        secure_environment_manager_1.secureEnvManager.generateBase64Secret(64),
                    passwordReset: secure_environment_manager_1.secureEnvManager.getConfig('JWT_PASSWORD_RESET_SECRET') ||
                        secure_environment_manager_1.secureEnvManager.generateBase64Secret(64)
                },
                expiry: {
                    accessToken: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ACCESS_EXPIRY', '15m'),
                    refreshToken: secure_environment_manager_1.secureEnvManager.getConfig('JWT_REFRESH_EXPIRY', '30d'),
                    verification: secure_environment_manager_1.secureEnvManager.getConfig('JWT_VERIFICATION_EXPIRY', '24h'),
                    passwordReset: secure_environment_manager_1.secureEnvManager.getConfig('JWT_PASSWORD_RESET_EXPIRY', '1h')
                },
                issuer: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ISSUER', 'UltraMarket-Uzbekistan'),
                audience: {
                    web: secure_environment_manager_1.secureEnvManager.getConfig('JWT_AUDIENCE_WEB', 'ultramarket.uz'),
                    mobile: secure_environment_manager_1.secureEnvManager.getConfig('JWT_AUDIENCE_MOBILE', 'ultramarket-mobile.uz'),
                    admin: secure_environment_manager_1.secureEnvManager.getConfig('JWT_AUDIENCE_ADMIN', 'admin.ultramarket.uz')
                },
                algorithm: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ALGORITHM', 'HS256'),
                security: {
                    enableRotation: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ENABLE_ROTATION', 'true') === 'true',
                    enableBlacklisting: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ENABLE_BLACKLISTING', 'true') === 'true',
                    enableDeviceTracking: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ENABLE_DEVICE_TRACKING', 'true') === 'true',
                    enableIPValidation: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ENABLE_IP_VALIDATION', 'false') === 'true',
                    maxConcurrentSessions: parseInt(secure_environment_manager_1.secureEnvManager.getConfig('JWT_MAX_CONCURRENT_SESSIONS', '5')),
                    requireSecureCookies: secure_environment_manager_1.secureEnvManager.getConfig('JWT_REQUIRE_SECURE_COOKIES', 'true') === 'true'
                },
                compliance: {
                    enableAuditLogging: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ENABLE_AUDIT_LOGGING', 'true') === 'true',
                    dataRetentionDays: parseInt(secure_environment_manager_1.secureEnvManager.getConfig('JWT_DATA_RETENTION_DAYS', '90')),
                    enableGDPRCompliance: secure_environment_manager_1.secureEnvManager.getConfig('JWT_ENABLE_GDPR', 'true') === 'true'
                }
            };
            // Validate secret strengths
            this.validateSecretSecurity(config.secrets);
            return config;
        }
        catch (error) {
            jwtLogger.error('❌ Failed to load JWT configuration', error);
            throw new unified_error_handler_1.ApplicationError(unified_error_handler_1.ErrorCodes.INTERNAL_SERVER_ERROR, 'JWT konfiguratsiyasi yuklanmadi', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    /**
     * Initialize security features
     */
    initializeSecurityFeatures() {
        // Setup secret rotation if enabled
        if (this.config.security.enableRotation) {
            this.setupSecretRotation();
        }
        // Setup session cleanup
        this.setupSessionCleanup();
        // Setup blacklist cleanup
        if (this.config.security.enableBlacklisting) {
            this.setupBlacklistCleanup();
        }
    }
    /**
     * Validate secret security
     */
    validateSecretSecurity(secrets) {
        const secretChecks = Object.entries(secrets);
        for (const [name, secret] of secretChecks) {
            if (!secret || secret.length < 64) {
                jwtLogger.warn(`⚠️ ${name} secret is weak (< 64 characters)`, {
                    secretName: name,
                    length: secret?.length || 0
                });
            }
            // Check for weak patterns
            const weakPatterns = ['test', 'dev', 'demo', '123', 'secret', 'password', 'ultramarket'];
            const hasWeakPattern = weakPatterns.some(pattern => secret?.toLowerCase().includes(pattern));
            if (hasWeakPattern) {
                jwtLogger.warn(`🚨 ${name} secret contains weak patterns`, {
                    secretName: name
                });
            }
        }
    }
    /**
     * Generate professional token pair
     */
    async generateTokenPair(payload, options = {}) {
        const startTime = Date.now();
        try {
            const sessionId = crypto.randomUUID();
            const now = Date.now();
            // Enhanced payload with security info
            const basePayload = {
                ...payload,
                sessionId,
                deviceId: options.deviceInfo?.deviceId,
                deviceType: options.deviceInfo?.deviceType || 'web',
                ipAddress: options.ipAddress,
                userAgent: options.deviceInfo?.userAgent,
                issuedAt: now,
                lastActivity: now,
                tokenType: 'access' // Will be overridden for refresh token
            };
            const audience = options.audience ? this.config.audience[options.audience] : this.config.audience.web;
            // Access token
            const accessTokenOptions = {
                expiresIn: this.config.expiry.accessToken,
                issuer: this.config.issuer,
                audience: audience,
                algorithm: this.config.algorithm,
                jwtid: crypto.randomUUID()
            };
            const accessToken = jsonwebtoken_1.default.sign(basePayload, this.config.secrets.accessToken, accessTokenOptions);
            // Refresh token (minimal payload for security)
            const refreshTokenPayload = {
                userId: payload.userId,
                sessionId,
                tokenType: 'refresh',
                issuedAt: now,
                deviceId: options.deviceInfo?.deviceId
            };
            const refreshTokenOptions = {
                expiresIn: this.config.expiry.refreshToken,
                issuer: this.config.issuer,
                audience: `${audience}-refresh`,
                algorithm: this.config.algorithm,
                jwtid: crypto.randomUUID()
            };
            const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, this.config.secrets.refreshToken, refreshTokenOptions);
            // Calculate expiry dates
            const accessTokenExpiry = new Date(now + this.parseExpiryToMs(this.config.expiry.accessToken));
            const refreshTokenExpiry = new Date(now + this.parseExpiryToMs(this.config.expiry.refreshToken));
            // Store session info
            if (this.config.security.enableDeviceTracking && options.deviceInfo) {
                this.storeSessionInfo({
                    sessionId,
                    userId: payload.userId,
                    deviceId: options.deviceInfo.deviceId,
                    ipAddress: options.ipAddress || 'unknown',
                    userAgent: options.deviceInfo.userAgent || 'unknown',
                    createdAt: new Date(now),
                    lastActivity: new Date(now),
                    isActive: true
                });
            }
            const duration = Date.now() - startTime;
            jwtLogger.info('✅ Token pair generated successfully', {
                userId: payload.userId,
                sessionId,
                deviceType: options.deviceInfo?.deviceType || 'web',
                audience,
                duration: `${duration}ms`
            });
            // Audit logging
            if (this.config.compliance.enableAuditLogging) {
                jwtLogger.auth('Token pair generated', payload.userId, {
                    sessionId,
                    deviceInfo: options.deviceInfo,
                    ipAddress: options.ipAddress
                });
            }
            return {
                accessToken,
                refreshToken,
                accessTokenExpiry,
                refreshTokenExpiry,
                sessionId
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            jwtLogger.error('❌ Failed to generate token pair', error, {
                userId: payload.userId,
                duration: `${duration}ms`
            });
            throw new unified_error_handler_1.ApplicationError(unified_error_handler_1.ErrorCodes.INTERNAL_SERVER_ERROR, 'Token yaratib bo\'lmadi', {
                originalError: error instanceof Error ? error.message : 'Unknown error',
                userId: payload.userId
            });
        }
    }
    /**
     * Validate token with comprehensive security checks
     */
    async validateToken(token, tokenType = 'access', options = {}) {
        const startTime = Date.now();
        try {
            // Check blacklist first
            if (this.config.security.enableBlacklisting && this.blacklistedTokens.has(token)) {
                jwtLogger.warn('🚫 Blacklisted token usage attempted', {
                    tokenType,
                    ipAddress: options.ipAddress
                });
                return {
                    isValid: false,
                    error: 'Token blacklisted',
                    securityWarnings: ['Token has been revoked']
                };
            }
            // Select appropriate secret
            const secret = this.getSecretForTokenType(tokenType);
            // Verify token
            const verifyOptions = {
                issuer: this.config.issuer,
                algorithms: [this.config.algorithm],
                clockTolerance: 30 // 30 seconds tolerance
            };
            const decoded = jsonwebtoken_1.default.verify(token, secret, verifyOptions);
            const securityWarnings = [];
            // Security validations
            if (this.config.security.enableIPValidation && options.ipAddress) {
                if (decoded.ipAddress && decoded.ipAddress !== options.ipAddress) {
                    securityWarnings.push('IP address changed');
                    jwtLogger.security('IP address mismatch detected', 'medium', {
                        userId: decoded.userId,
                        originalIP: decoded.ipAddress,
                        currentIP: options.ipAddress,
                        sessionId: decoded.sessionId
                    });
                }
            }
            // Device validation
            if (this.config.security.enableDeviceTracking && options.deviceId) {
                if (decoded.deviceId && decoded.deviceId !== options.deviceId) {
                    securityWarnings.push('Device changed');
                    jwtLogger.security('Device change detected', 'medium', {
                        userId: decoded.userId,
                        originalDevice: decoded.deviceId,
                        currentDevice: options.deviceId,
                        sessionId: decoded.sessionId
                    });
                }
            }
            // Session validation
            if (this.config.security.enableDeviceTracking) {
                const sessionInfo = this.activeSessions.get(decoded.sessionId);
                if (sessionInfo && !sessionInfo.isActive) {
                    return {
                        isValid: false,
                        error: 'Session terminated',
                        securityWarnings: ['Session has been terminated']
                    };
                }
            }
            // Check if token should be refreshed (within 5 minutes of expiry)
            const shouldRefresh = decoded.exp && (decoded.exp * 1000 - Date.now()) < 5 * 60 * 1000;
            const duration = Date.now() - startTime;
            jwtLogger.debug('✅ Token validated successfully', {
                userId: decoded.userId,
                tokenType,
                sessionId: decoded.sessionId,
                warningsCount: securityWarnings.length,
                duration: `${duration}ms`
            });
            return {
                isValid: true,
                payload: decoded,
                shouldRefresh,
                securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                jwtLogger.info('⏰ Token expired', {
                    tokenType,
                    expiredAt: error.expiredAt,
                    duration: `${duration}ms`
                });
                return {
                    isValid: false,
                    error: 'Token expired',
                    shouldRefresh: tokenType === 'access'
                };
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                jwtLogger.warn('⚠️ Invalid token format', {
                    tokenType,
                    error: error.message,
                    duration: `${duration}ms`
                });
                return {
                    isValid: false,
                    error: 'Invalid token'
                };
            }
            jwtLogger.error('❌ Token validation failed', error, {
                tokenType,
                duration: `${duration}ms`
            });
            return {
                isValid: false,
                error: 'Token validation failed'
            };
        }
    }
    /**
     * Refresh token pair
     */
    async refreshTokenPair(refreshToken, options = {}) {
        try {
            // Validate refresh token
            const validationResult = await this.validateToken(refreshToken, 'refresh', options);
            if (!validationResult.isValid || !validationResult.payload) {
                throw new unified_error_handler_1.ApplicationError(unified_error_handler_1.ErrorCodes.TOKEN_INVALID, 'Refresh token noto\'g\'ri', { error: validationResult.error });
            }
            const payload = validationResult.payload;
            // Get user info for new token (simplified - in real app, query database)
            const newTokenPayload = {
                userId: payload.userId,
                email: payload.email,
                firstName: payload.firstName,
                lastName: payload.lastName,
                role: payload.role,
                permissions: payload.permissions,
                region: payload.region,
                language: payload.language,
                timezone: payload.timezone
            };
            // Blacklist old refresh token
            if (this.config.security.enableBlacklisting) {
                this.blacklistedTokens.add(refreshToken);
            }
            // Generate new token pair
            const newTokenPair = await this.generateTokenPair(newTokenPayload, {
                deviceInfo: {
                    deviceId: payload.deviceId || crypto.randomUUID(),
                    deviceType: payload.deviceType || 'web',
                    userAgent: options.userAgent
                },
                ipAddress: options.ipAddress
            });
            jwtLogger.info('🔄 Token pair refreshed', {
                userId: payload.userId,
                oldSessionId: payload.sessionId,
                newSessionId: newTokenPair.sessionId
            });
            return newTokenPair;
        }
        catch (error) {
            jwtLogger.error('❌ Failed to refresh token pair', error);
            if (error instanceof unified_error_handler_1.ApplicationError) {
                throw error;
            }
            throw new unified_error_handler_1.ApplicationError(unified_error_handler_1.ErrorCodes.TOKEN_INVALID, 'Tokenni yangilab bo\'lmadi', { originalError: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    /**
     * Generate verification token
     */
    async generateVerificationToken(userId) {
        try {
            const payload = {
                userId,
                tokenType: 'verification',
                issuedAt: Date.now()
            };
            const options = {
                expiresIn: this.config.expiry.verification,
                issuer: this.config.issuer,
                audience: `${this.config.audience.web}-verification`,
                algorithm: this.config.algorithm,
                jwtid: crypto.randomUUID()
            };
            const token = jsonwebtoken_1.default.sign(payload, this.config.secrets.verification, options);
            jwtLogger.info('📧 Verification token generated', { userId });
            return token;
        }
        catch (error) {
            jwtLogger.error('❌ Failed to generate verification token', error, { userId });
            throw new unified_error_handler_1.ApplicationError(unified_error_handler_1.ErrorCodes.INTERNAL_SERVER_ERROR, 'Tasdiqlash tokeni yaratib bo\'lmadi');
        }
    }
    /**
     * Generate password reset token
     */
    async generatePasswordResetToken(userId) {
        try {
            const payload = {
                userId,
                tokenType: 'passwordReset',
                issuedAt: Date.now()
            };
            const options = {
                expiresIn: this.config.expiry.passwordReset,
                issuer: this.config.issuer,
                audience: `${this.config.audience.web}-password-reset`,
                algorithm: this.config.algorithm,
                jwtid: crypto.randomUUID()
            };
            const token = jsonwebtoken_1.default.sign(payload, this.config.secrets.passwordReset, options);
            jwtLogger.info('🔐 Password reset token generated', { userId });
            return token;
        }
        catch (error) {
            jwtLogger.error('❌ Failed to generate password reset token', error, { userId });
            throw new unified_error_handler_1.ApplicationError(unified_error_handler_1.ErrorCodes.INTERNAL_SERVER_ERROR, 'Parol tiklash tokeni yaratib bo\'lmadi');
        }
    }
    /**
     * Revoke token (add to blacklist)
     */
    async revokeToken(token, reason = 'Manual revocation', userId) {
        if (!this.config.security.enableBlacklisting) {
            jwtLogger.warn('Token blacklisting is disabled');
            return;
        }
        this.blacklistedTokens.add(token);
        jwtLogger.info('🚫 Token revoked', {
            userId,
            reason,
            tokenHash: this.hashToken(token).substring(0, 16)
        });
        // Audit logging
        if (this.config.compliance.enableAuditLogging) {
            jwtLogger.security('Token revoked', 'medium', {
                userId,
                reason,
                revokedAt: new Date().toISOString()
            });
        }
    }
    /**
     * Revoke all user sessions
     */
    async revokeAllUserSessions(userId, reason = 'Security revocation') {
        let revokedCount = 0;
        // Revoke active sessions
        for (const [sessionId, sessionInfo] of this.activeSessions.entries()) {
            if (sessionInfo.userId === userId && sessionInfo.isActive) {
                sessionInfo.isActive = false;
                revokedCount++;
            }
        }
        jwtLogger.info('🚫 All user sessions revoked', {
            userId,
            revokedCount,
            reason
        });
        // Audit logging
        if (this.config.compliance.enableAuditLogging) {
            jwtLogger.security('All user sessions revoked', 'high', {
                userId,
                revokedCount,
                reason,
                revokedAt: new Date().toISOString()
            });
        }
    }
    // Helper methods
    getSecretForTokenType(tokenType) {
        switch (tokenType) {
            case 'access': return this.config.secrets.accessToken;
            case 'refresh': return this.config.secrets.refreshToken;
            case 'verification': return this.config.secrets.verification;
            case 'passwordReset': return this.config.secrets.passwordReset;
        }
    }
    parseExpiryToMs(expiry) {
        // Simple parser - in production, use library like ms
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match)
            return 15 * 60 * 1000; // Default 15 minutes
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 15 * 60 * 1000;
        }
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    storeSessionInfo(sessionInfo) {
        // Check max concurrent sessions
        const userSessions = Array.from(this.activeSessions.values())
            .filter(session => session.userId === sessionInfo.userId && session.isActive);
        if (userSessions.length >= this.config.security.maxConcurrentSessions) {
            // Deactivate oldest session
            userSessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            const oldestSession = userSessions[0];
            oldestSession.isActive = false;
            jwtLogger.info('👥 Max concurrent sessions reached, oldest session deactivated', {
                userId: sessionInfo.userId,
                deactivatedSessionId: oldestSession.sessionId,
                newSessionId: sessionInfo.sessionId
            });
        }
        this.activeSessions.set(sessionInfo.sessionId, sessionInfo);
    }
    setupSecretRotation() {
        // Rotate secrets monthly
        const rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
        this.secretRotationTimer = setInterval(() => {
            jwtLogger.info('🔄 Secret rotation triggered (placeholder)');
            // In production, implement proper secret rotation
        }, rotationInterval);
    }
    setupSessionCleanup() {
        // Clean up expired sessions every hour
        const cleanupInterval = 60 * 60 * 1000; // 1 hour
        setInterval(() => {
            const before = this.activeSessions.size;
            const now = Date.now();
            const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours
            for (const [sessionId, session] of this.activeSessions.entries()) {
                if (now - session.lastActivity.getTime() > maxInactivity) {
                    this.activeSessions.delete(sessionId);
                }
            }
            const after = this.activeSessions.size;
            if (before !== after) {
                jwtLogger.info('🧹 Session cleanup completed', {
                    before,
                    after,
                    cleaned: before - after
                });
            }
        }, cleanupInterval);
    }
    setupBlacklistCleanup() {
        // Clean up expired blacklisted tokens every 6 hours
        const cleanupInterval = 6 * 60 * 60 * 1000; // 6 hours
        setInterval(() => {
            // In production, implement proper blacklist cleanup with token expiry tracking
            jwtLogger.debug('🧹 Blacklist cleanup (placeholder)');
        }, cleanupInterval);
    }
    /**
     * Get JWT manager statistics
     */
    getStats() {
        return {
            activeSessions: this.activeSessions.size,
            blacklistedTokens: this.blacklistedTokens.size,
            config: {
                algorithm: this.config.algorithm,
                issuer: this.config.issuer,
                securityFeatures: {
                    rotation: this.config.security.enableRotation,
                    blacklisting: this.config.security.enableBlacklisting,
                    deviceTracking: this.config.security.enableDeviceTracking,
                    ipValidation: this.config.security.enableIPValidation
                }
            }
        };
    }
    /**
     * Health check for JWT manager
     */
    async healthCheck() {
        const issues = [];
        // Check secret strengths
        Object.entries(this.config.secrets).forEach(([name, secret]) => {
            if (!secret || secret.length < 64) {
                issues.push(`${name} secret is weak`);
            }
        });
        // Check session count
        if (this.activeSessions.size > 10000) {
            issues.push('High number of active sessions');
        }
        // Check blacklist size
        if (this.blacklistedTokens.size > 50000) {
            issues.push('Large blacklist size');
        }
        return {
            healthy: issues.length === 0,
            issues,
            stats: this.getStats()
        };
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        jwtLogger.info('🛑 Shutting down JWT manager...');
        if (this.secretRotationTimer) {
            clearInterval(this.secretRotationTimer);
        }
        this.activeSessions.clear();
        this.blacklistedTokens.clear();
        jwtLogger.info('✅ JWT manager shutdown complete');
    }
}
exports.ProfessionalJWTManager = ProfessionalJWTManager;
// Export singleton instance and factory functions
exports.professionalJWTManager = ProfessionalJWTManager.getInstance();
// Wrapped async functions for easy usage
exports.generateTokenPair = (0, unified_error_handler_1.asyncHandler)(async (payload, options) => exports.professionalJWTManager.generateTokenPair(payload, options));
exports.validateToken = (0, unified_error_handler_1.asyncHandler)(async (token, tokenType, options) => exports.professionalJWTManager.validateToken(token, tokenType, options));
exports.refreshTokenPair = (0, unified_error_handler_1.asyncHandler)(async (refreshToken, options) => exports.professionalJWTManager.refreshTokenPair(refreshToken, options));
exports.generateVerificationToken = (0, unified_error_handler_1.asyncHandler)(async (userId) => exports.professionalJWTManager.generateVerificationToken(userId));
exports.generatePasswordResetToken = (0, unified_error_handler_1.asyncHandler)(async (userId) => exports.professionalJWTManager.generatePasswordResetToken(userId));
exports.default = exports.professionalJWTManager;
//# sourceMappingURL=jwt-manager.js.map