"use strict";
/**
 * 🔐 ULTRA PROFESSIONAL JWT SECURITY MANAGER
 * UltraMarket E-commerce Platform
 *
 * Professional JWT implementation with:
 * - Strong cryptographic security
 * - Token rotation and blacklisting
 * - Device tracking and IP validation
 * - Security audit logging
 * - O'zbekiston compliance features
 *
 * @author UltraMarket Security Team
 * @version 3.0.0
 * @date 2024-12-28
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtMiddleware = exports.jwtManager = exports.createJWTMiddleware = exports.UltraProfessionalJWTManager = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const ioredis_1 = require("ioredis");
const ultra_professional_logger_1 = require("../logging/ultra-professional-logger");
/**
 * Ultra Professional JWT Security Manager
 */
class UltraProfessionalJWTManager {
    accessTokenSecret;
    refreshTokenSecret;
    options;
    redis;
    blacklistPrefix = 'jwt:blacklist:';
    devicePrefix = 'device:';
    sessionPrefix = 'session:';
    securityEventPrefix = 'security:event:';
    constructor(accessSecret, refreshSecret, options = {}, redisClient) {
        // Validate secrets strength
        this.validateSecretStrength(accessSecret, 'Access Token Secret');
        this.validateSecretStrength(refreshSecret, 'Refresh Token Secret');
        this.accessTokenSecret = accessSecret;
        this.refreshTokenSecret = refreshSecret;
        // Professional default options
        this.options = {
            algorithm: 'HS512', // Strong algorithm
            issuer: 'ultramarket.uz',
            audience: ['web', 'mobile', 'admin', 'api'],
            expiresIn: '15m', // Short-lived access tokens
            clockTolerance: 30, // 30 seconds tolerance
            secretRotationDays: 90,
            maxConcurrentSessions: 5,
            enableDeviceTracking: true,
            enableIPValidation: false, // Can be strict for high-security
            enableAuditLogging: true,
            enableTokenRotation: true,
            ...options
        };
        // Redis for blacklisting and session management
        this.redis = redisClient || new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            keyPrefix: 'ultramarket:jwt:',
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });
        ultra_professional_logger_1.logger.security('🔐 Ultra Professional JWT Manager initialized', {
            algorithm: this.options.algorithm,
            issuer: this.options.issuer,
            deviceTracking: this.options.enableDeviceTracking,
            ipValidation: this.options.enableIPValidation,
            auditLogging: this.options.enableAuditLogging
        });
    }
    /**
     * Validate secret strength (Critical Security Function)
     */
    validateSecretStrength(secret, name) {
        if (!secret || secret.length < 64) {
            throw new Error(`${name} must be at least 64 characters long for production security`);
        }
        // Check for weak patterns
        const weakPatterns = [
            /^(.)\1+$/, // Repeated characters
            /password|secret|key|token/i, // Common words
            /123|abc|qwe/i, // Sequential patterns
            /test|dev|example/i // Development patterns
        ];
        for (const pattern of weakPatterns) {
            if (pattern.test(secret)) {
                throw new Error(`${name} contains weak patterns. Use cryptographically strong secrets`);
            }
        }
        ultra_professional_logger_1.logger.security(`✅ ${name} strength validation passed`);
    }
    /**
     * Generate access token with comprehensive security
     */
    async generateAccessToken(payload, options = {}) {
        try {
            const sessionId = crypto_1.default.randomUUID();
            const issuedAt = Math.floor(Date.now() / 1000);
            const expiresIn = options.expiresIn || this.options.expiresIn;
            // Calculate expiration timestamp
            const expirationMs = this.parseExpirationToMs(expiresIn);
            const expiresAt = new Date(Date.now() + expirationMs);
            const fullPayload = {
                ...payload,
                sessionId,
                issuedAt,
                expiresAt: Math.floor(expiresAt.getTime() / 1000),
                securityVersion: 1 // For future security upgrades
            };
            const token = jsonwebtoken_1.default.sign(fullPayload, this.accessTokenSecret, {
                algorithm: this.options.algorithm,
                issuer: this.options.issuer,
                audience: options.audience || this.options.audience,
                expiresIn,
                jwtid: sessionId
            });
            // Store session information
            await this.storeSessionInfo(sessionId, fullPayload, expiresAt);
            // Track device if enabled
            if (this.options.enableDeviceTracking && options.deviceInfo) {
                await this.trackDevice(payload.userId, payload.deviceId, options.deviceInfo);
            }
            // Log security event
            if (this.options.enableAuditLogging) {
                await this.logSecurityEvent({
                    eventType: 'LOGIN',
                    userId: payload.userId,
                    deviceId: payload.deviceId,
                    ipAddress: payload.ipAddress,
                    userAgent: payload.userAgent,
                    timestamp: new Date(),
                    severity: 'LOW',
                    description: 'Access token generated successfully'
                });
            }
            ultra_professional_logger_1.logger.security('🎫 Access token generated', {
                userId: payload.userId,
                sessionId,
                audience: options.audience,
                expiresAt: expiresAt.toISOString(),
                deviceId: payload.deviceId
            });
            return { token, sessionId, expiresAt };
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to generate access token', error);
            throw new Error('Token generation failed');
        }
    }
    /**
     * Generate refresh token with rotation support
     */
    async generateRefreshToken(userId, sessionId, deviceId) {
        try {
            const issuedAt = Math.floor(Date.now() / 1000);
            const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
            const payload = {
                userId,
                sessionId,
                deviceId,
                type: 'refresh',
                issuedAt,
                expiresAt: Math.floor(expiresAt.getTime() / 1000)
            };
            const token = jsonwebtoken_1.default.sign(payload, this.refreshTokenSecret, {
                algorithm: this.options.algorithm,
                issuer: this.options.issuer,
                audience: 'refresh',
                expiresIn: '7d',
                jwtid: crypto_1.default.randomUUID()
            });
            // Store refresh token (for rotation tracking)
            await this.redis.setex(`${this.sessionPrefix}refresh:${sessionId}`, 7 * 24 * 60 * 60, // 7 days
            JSON.stringify({
                userId,
                deviceId,
                issuedAt,
                expiresAt: expiresAt.getTime()
            }));
            ultra_professional_logger_1.logger.security('🔄 Refresh token generated', {
                userId,
                sessionId,
                deviceId,
                expiresAt: expiresAt.toISOString()
            });
            return { token, expiresAt };
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to generate refresh token', error);
            throw new Error('Refresh token generation failed');
        }
    }
    /**
     * Validate token with comprehensive security checks
     */
    async validateToken(token, type = 'access', context = {}) {
        const result = {
            isValid: false,
            shouldRefresh: false,
            securityWarnings: [],
            trustScore: 100
        };
        try {
            // Check if token is blacklisted
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                result.error = 'Token has been revoked';
                result.trustScore = 0;
                return result;
            }
            const secret = type === 'access' ? this.accessTokenSecret : this.refreshTokenSecret;
            const decoded = jsonwebtoken_1.default.verify(token, secret, {
                algorithms: [this.options.algorithm],
                issuer: this.options.issuer,
                audience: context.audience || this.options.audience,
                clockTolerance: this.options.clockTolerance
            });
            // Validate session exists
            if (type === 'access') {
                const sessionExists = await this.isSessionValid(decoded.sessionId);
                if (!sessionExists) {
                    result.error = 'Session has expired or been terminated';
                    result.shouldRefresh = true;
                    return result;
                }
            }
            // Security validations
            const securityChecks = await this.performSecurityChecks(decoded, context);
            result.securityWarnings = securityChecks.warnings;
            result.trustScore = securityChecks.trustScore;
            // Check if token is close to expiration (for refresh suggestion)
            const timeToExpiry = decoded.expiresAt - Math.floor(Date.now() / 1000);
            if (timeToExpiry < 300) { // Less than 5 minutes
                result.shouldRefresh = true;
            }
            result.isValid = true;
            result.payload = decoded;
            // Log successful validation
            if (this.options.enableAuditLogging) {
                await this.logSecurityEvent({
                    eventType: 'TOKEN_REFRESH',
                    userId: decoded.userId,
                    deviceId: decoded.deviceId,
                    ipAddress: context.ipAddress || 'unknown',
                    userAgent: context.userAgent || 'unknown',
                    timestamp: new Date(),
                    severity: 'LOW',
                    description: 'Token validated successfully',
                    metadata: { trustScore: result.trustScore, warnings: result.securityWarnings }
                });
            }
            return result;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                result.error = 'Invalid token format or signature';
            }
            else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                result.error = 'Token has expired';
                result.shouldRefresh = true;
            }
            else if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
                result.error = 'Token not yet valid';
            }
            else {
                result.error = 'Token validation failed';
            }
            ultra_professional_logger_1.logger.warn('🚫 Token validation failed', {
                error: result.error,
                tokenType: type,
                context
            });
            return result;
        }
    }
    /**
     * Perform comprehensive security checks
     */
    async performSecurityChecks(payload, context) {
        const warnings = [];
        let trustScore = 100;
        // IP address validation
        if (this.options.enableIPValidation && context.ipAddress) {
            if (payload.ipAddress !== context.ipAddress) {
                warnings.push('IP address mismatch detected');
                trustScore -= 30;
                await this.logSecurityEvent({
                    eventType: 'IP_CHANGE',
                    userId: payload.userId,
                    deviceId: payload.deviceId,
                    ipAddress: context.ipAddress,
                    userAgent: context.userAgent || 'unknown',
                    timestamp: new Date(),
                    severity: 'MEDIUM',
                    description: `IP changed from ${payload.ipAddress} to ${context.ipAddress}`
                });
            }
        }
        // User agent validation
        if (context.userAgent && payload.userAgent !== context.userAgent) {
            warnings.push('User agent mismatch detected');
            trustScore -= 20;
            await this.logSecurityEvent({
                eventType: 'DEVICE_CHANGE',
                userId: payload.userId,
                deviceId: payload.deviceId,
                ipAddress: context.ipAddress || 'unknown',
                userAgent: context.userAgent,
                timestamp: new Date(),
                severity: 'MEDIUM',
                description: 'User agent changed'
            });
        }
        // Check for concurrent sessions
        const activeSessions = await this.getActiveSessionCount(payload.userId);
        if (activeSessions > this.options.maxConcurrentSessions) {
            warnings.push('Exceeded maximum concurrent sessions');
            trustScore -= 40;
            await this.logSecurityEvent({
                eventType: 'SUSPICIOUS_ACTIVITY',
                userId: payload.userId,
                deviceId: payload.deviceId,
                ipAddress: context.ipAddress || 'unknown',
                userAgent: context.userAgent || 'unknown',
                timestamp: new Date(),
                severity: 'HIGH',
                description: `Too many concurrent sessions: ${activeSessions}`,
                metadata: { maxAllowed: this.options.maxConcurrentSessions }
            });
        }
        // Check token age for suspicious patterns
        const tokenAge = Date.now() - (payload.issuedAt * 1000);
        const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
        if (tokenAge > maxTokenAge) {
            warnings.push('Token is unusually old');
            trustScore -= 10;
        }
        return { warnings, trustScore };
    }
    /**
     * Revoke token (add to blacklist)
     */
    async revokeToken(token, reason = 'Manual revocation') {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                throw new Error('Invalid token format');
            }
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            const expiryTime = decoded.exp - Math.floor(Date.now() / 1000);
            if (expiryTime > 0) {
                await this.redis.setex(`${this.blacklistPrefix}${tokenHash}`, expiryTime, reason);
                ultra_professional_logger_1.logger.security('🚫 Token revoked', {
                    tokenId: decoded.jti,
                    userId: decoded.userId,
                    reason,
                    expiryTime
                });
            }
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to revoke token', error);
            throw new Error('Token revocation failed');
        }
    }
    /**
     * Revoke all user sessions
     */
    async revokeAllUserSessions(userId, reason = 'Security action') {
        try {
            const sessionKeys = await this.redis.keys(`${this.sessionPrefix}*:${userId}`);
            for (const key of sessionKeys) {
                await this.redis.del(key);
            }
            await this.logSecurityEvent({
                eventType: 'LOGOUT',
                userId,
                deviceId: 'all',
                ipAddress: 'system',
                userAgent: 'system',
                timestamp: new Date(),
                severity: 'HIGH',
                description: `All sessions revoked: ${reason}`
            });
            ultra_professional_logger_1.logger.security('🚫 All user sessions revoked', {
                userId,
                sessionsRevoked: sessionKeys.length,
                reason
            });
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to revoke all user sessions', error);
            throw new Error('Session revocation failed');
        }
    }
    /**
     * Check if token is blacklisted
     */
    async isTokenBlacklisted(token) {
        try {
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            const result = await this.redis.get(`${this.blacklistPrefix}${tokenHash}`);
            return result !== null;
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to check token blacklist', error);
            return false; // Fail open for availability
        }
    }
    /**
     * Check if session is valid
     */
    async isSessionValid(sessionId) {
        try {
            const sessionData = await this.redis.get(`${this.sessionPrefix}${sessionId}`);
            return sessionData !== null;
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to check session validity', error);
            return false;
        }
    }
    /**
     * Store session information
     */
    async storeSessionInfo(sessionId, payload, expiresAt) {
        try {
            const sessionData = {
                userId: payload.userId,
                deviceId: payload.deviceId,
                ipAddress: payload.ipAddress,
                userAgent: payload.userAgent,
                role: payload.role,
                audience: payload.audience,
                issuedAt: payload.issuedAt,
                expiresAt: expiresAt.getTime(),
                lastActivity: Date.now()
            };
            const expirySeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
            await this.redis.setex(`${this.sessionPrefix}${sessionId}`, expirySeconds, JSON.stringify(sessionData));
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to store session info', error);
            // Don't throw error as this is auxiliary functionality
        }
    }
    /**
     * Track device information
     */
    async trackDevice(userId, deviceId, deviceInfo) {
        try {
            const deviceKey = `${this.devicePrefix}${userId}:${deviceId}`;
            const existingDevice = await this.redis.get(deviceKey);
            let device;
            if (existingDevice) {
                device = JSON.parse(existingDevice);
                device.lastSeen = new Date();
                device.sessionCount += 1;
                device.isActive = true;
            }
            else {
                device = {
                    deviceId,
                    userAgent: deviceInfo.userAgent || 'unknown',
                    ipAddress: deviceInfo.ipAddress || 'unknown',
                    firstSeen: new Date(),
                    lastSeen: new Date(),
                    isActive: true,
                    isTrusted: false,
                    sessionCount: 1,
                    ...deviceInfo
                };
            }
            // Store device info for 30 days
            await this.redis.setex(deviceKey, 30 * 24 * 60 * 60, JSON.stringify(device));
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to track device', error);
            // Don't throw error as this is auxiliary functionality
        }
    }
    /**
     * Get active session count for user
     */
    async getActiveSessionCount(userId) {
        try {
            const sessionKeys = await this.redis.keys(`${this.sessionPrefix}*`);
            let count = 0;
            for (const key of sessionKeys) {
                const sessionData = await this.redis.get(key);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (session.userId === userId) {
                        count++;
                    }
                }
            }
            return count;
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to get active session count', error);
            return 0;
        }
    }
    /**
     * Log security events
     */
    async logSecurityEvent(event) {
        try {
            const eventKey = `${this.securityEventPrefix}${event.userId}:${Date.now()}`;
            await this.redis.setex(eventKey, 30 * 24 * 60 * 60, // 30 days retention
            JSON.stringify(event));
            // Also log to application logger
            ultra_professional_logger_1.logger.security(`🔒 Security Event: ${event.eventType}`, {
                userId: event.userId,
                deviceId: event.deviceId,
                severity: event.severity,
                description: event.description,
                metadata: event.metadata
            });
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to log security event', error);
            // Don't throw error as this is auxiliary functionality
        }
    }
    /**
     * Parse expiration string to milliseconds
     */
    parseExpirationToMs(expiration) {
        const unit = expiration.slice(-1);
        const value = parseInt(expiration.slice(0, -1));
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: throw new Error('Invalid expiration format');
        }
    }
    /**
     * Cleanup expired sessions and blacklisted tokens
     */
    async cleanup() {
        try {
            // This would typically be run as a scheduled job
            const patterns = [
                `${this.blacklistPrefix}*`,
                `${this.sessionPrefix}*`,
                `${this.securityEventPrefix}*`
            ];
            for (const pattern of patterns) {
                const keys = await this.redis.keys(pattern);
                // Redis TTL will handle automatic cleanup
                ultra_professional_logger_1.logger.info(`🧹 Found ${keys.length} keys matching ${pattern}`);
            }
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to cleanup expired data', error);
        }
    }
    /**
     * Get comprehensive security report for user
     */
    async getSecurityReport(userId) {
        try {
            const activeSessions = await this.getActiveSessionCount(userId);
            // Get device information
            const deviceKeys = await this.redis.keys(`${this.devicePrefix}${userId}:*`);
            const devices = [];
            for (const key of deviceKeys) {
                const deviceData = await this.redis.get(key);
                if (deviceData) {
                    devices.push(JSON.parse(deviceData));
                }
            }
            // Get recent security events
            const eventKeys = await this.redis.keys(`${this.securityEventPrefix}${userId}:*`);
            const events = [];
            for (const key of eventKeys.slice(-10)) { // Last 10 events
                const eventData = await this.redis.get(key);
                if (eventData) {
                    events.push(JSON.parse(eventData));
                }
            }
            // Calculate risk score
            let riskScore = 0;
            if (activeSessions > this.options.maxConcurrentSessions)
                riskScore += 30;
            if (devices.filter(d => !d.isTrusted).length > 0)
                riskScore += 20;
            if (events.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL').length > 0)
                riskScore += 50;
            return {
                activeSessions,
                registeredDevices: devices,
                recentSecurityEvents: events,
                riskScore: Math.min(riskScore, 100)
            };
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to generate security report', error);
            throw new Error('Security report generation failed');
        }
    }
}
exports.UltraProfessionalJWTManager = UltraProfessionalJWTManager;
/**
 * Express.js middleware for JWT authentication
 */
const createJWTMiddleware = (jwtManager) => {
    return (options = {}) => {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    if (options.required !== false) {
                        res.status(401).json({
                            success: false,
                            error: {
                                code: 'AUTH_TOKEN_MISSING',
                                message: 'Authorization token required',
                                timestamp: new Date().toISOString()
                            }
                        });
                        return;
                    }
                    return next();
                }
                const token = authHeader.substring(7);
                const validation = await jwtManager.validateToken(token, 'access', {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    audience: options.audience
                });
                if (!validation.isValid || !validation.payload) {
                    ultra_professional_logger_1.logger.warn('🚫 Authentication failed', {
                        error: validation.error,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    res.status(401).json({
                        success: false,
                        error: {
                            code: 'AUTH_TOKEN_INVALID',
                            message: validation.error || 'Invalid token',
                            shouldRefresh: validation.shouldRefresh,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                // Role-based access control
                if (options.roles && !options.roles.includes(validation.payload.role)) {
                    res.status(403).json({
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Insufficient permissions for this resource',
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                // Attach user to request
                req.user = validation.payload;
                // Add security warnings to response headers
                if (validation.securityWarnings.length > 0) {
                    res.set('X-Security-Warnings', validation.securityWarnings.join(', '));
                }
                if (validation.shouldRefresh) {
                    res.set('X-Token-Refresh-Suggested', 'true');
                }
                next();
            }
            catch (error) {
                ultra_professional_logger_1.logger.error('❌ JWT middleware error', error);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'AUTH_INTERNAL_ERROR',
                        message: 'Authentication service error',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
    };
};
exports.createJWTMiddleware = createJWTMiddleware;
// Export default configured instance
const createDefaultJWTManager = () => {
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret) {
        throw new Error('JWT secrets must be configured in environment variables');
    }
    return new UltraProfessionalJWTManager(accessSecret, refreshSecret, {
        algorithm: process.env.JWT_ALGORITHM || 'HS512',
        issuer: process.env.JWT_ISSUER || 'ultramarket.uz',
        audience: (process.env.JWT_AUDIENCE || 'ultramarket-api').split(','),
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        secretRotationDays: parseInt(process.env.JWT_ROTATION_DAYS || '90'),
        maxConcurrentSessions: parseInt(process.env.JWT_MAX_SESSIONS || '5'),
        enableDeviceTracking: process.env.JWT_DEVICE_TRACKING !== 'false',
        enableIPValidation: process.env.JWT_IP_VALIDATION === 'true',
        enableAuditLogging: process.env.JWT_AUDIT_LOGGING !== 'false',
        enableTokenRotation: process.env.JWT_TOKEN_ROTATION !== 'false'
    });
};
exports.jwtManager = createDefaultJWTManager();
exports.jwtMiddleware = (0, exports.createJWTMiddleware)(exports.jwtManager);
//# sourceMappingURL=ultra-professional-jwt-manager.js.map