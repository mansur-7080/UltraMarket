"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalJwtMiddleware = exports.jwtMiddleware = exports.jwtService = exports.JWTService = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const logger_1 = require("../logging/logger");
const AppError_1 = require("../errors/AppError");
// JWT Service class
class JWTService {
    config;
    blacklistedTokens = new Set();
    constructor(config) {
        this.config = {
            accessSecret: config?.accessSecret || this.generateSecureSecret(),
            refreshSecret: config?.refreshSecret || this.generateSecureSecret(),
            accessExpiresIn: config?.accessExpiresIn || '15m',
            refreshExpiresIn: config?.refreshExpiresIn || '7d',
            issuer: config?.issuer || 'ultramarket.uz',
            audience: config?.audience || 'ultramarket-api',
        };
        this.validateSecrets();
    }
    /**
     * Generate cryptographically secure secret
     */
    generateSecureSecret(length = 64) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    /**
     * Validate JWT secrets strength
     */
    validateSecrets() {
        const minLength = 32;
        const weakPatterns = [
            'secret',
            'password',
            'key',
            'jwt',
            'token',
            'ultramarket',
            'admin',
            'user',
            '123456',
        ];
        [this.config.accessSecret, this.config.refreshSecret].forEach((secret, index) => {
            const secretName = index === 0 ? 'Access Secret' : 'Refresh Secret';
            if (secret.length < minLength) {
                throw new AppError_1.AppError(`${secretName} must be at least ${minLength} characters long`, 500, true, 'WEAK_JWT_SECRET');
            }
            const lowerSecret = secret.toLowerCase();
            const hasWeakPattern = weakPatterns.some((pattern) => lowerSecret.includes(pattern));
            if (hasWeakPattern) {
                logger_1.logger.warn(`${secretName} contains weak patterns`, {
                    secretName,
                    event: 'jwt_weak_secret',
                });
            }
        });
        logger_1.logger.info('JWT secrets validated successfully');
    }
    /**
     * Generate access token
     */
    generateAccessToken(payload) {
        try {
            const tokenPayload = {
                ...payload,
                iss: this.config.issuer,
                aud: this.config.audience,
            };
            const token = jsonwebtoken_1.default.sign(tokenPayload, this.config.accessSecret, {
                expiresIn: this.config.accessExpiresIn,
            });
            logger_1.logger.info('Access token generated', {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                sessionId: payload.sessionId,
            });
            return token;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate access token', error);
            throw new AppError_1.AppError('Token generation failed', 500, true, 'TOKEN_GENERATION_ERROR');
        }
    }
    /**
     * Generate refresh token
     */
    generateRefreshToken(payload) {
        try {
            const token = jsonwebtoken_1.default.sign(payload, this.config.refreshSecret, {
                expiresIn: this.config.refreshExpiresIn,
            });
            logger_1.logger.info('Refresh token generated', {
                userId: payload.userId,
                sessionId: payload.sessionId,
                tokenVersion: payload.tokenVersion,
            });
            return token;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate refresh token', error);
            throw new AppError_1.AppError('Refresh token generation failed', 500, true, 'REFRESH_TOKEN_GENERATION_ERROR');
        }
    }
    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            if (this.blacklistedTokens.has(token)) {
                throw new AppError_1.AppError('Token has been blacklisted', 401, true, 'TOKEN_BLACKLISTED');
            }
            const decoded = jsonwebtoken_1.default.verify(token, this.config.accessSecret, {
                algorithms: ['HS256'],
                issuer: this.config.issuer,
                audience: this.config.audience,
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new AppError_1.AppError('Token has expired', 401, true, 'TOKEN_EXPIRED');
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new AppError_1.AppError('Invalid token', 401, true, 'INVALID_TOKEN');
            }
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Token verification failed', error);
            throw new AppError_1.AppError('Token verification failed', 401, true, 'TOKEN_VERIFICATION_ERROR');
        }
    }
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            if (this.blacklistedTokens.has(token)) {
                throw new AppError_1.AppError('Refresh token has been blacklisted', 401, true, 'REFRESH_TOKEN_BLACKLISTED');
            }
            const decoded = jsonwebtoken_1.default.verify(token, this.config.refreshSecret, {
                algorithms: ['HS256'],
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new AppError_1.AppError('Refresh token has expired', 401, true, 'REFRESH_TOKEN_EXPIRED');
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new AppError_1.AppError('Invalid refresh token', 401, true, 'INVALID_REFRESH_TOKEN');
            }
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            logger_1.logger.error('Refresh token verification failed', error);
            throw new AppError_1.AppError('Refresh token verification failed', 401, true, 'REFRESH_TOKEN_VERIFICATION_ERROR');
        }
    }
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            logger_1.logger.error('Token decode failed', error);
            return null;
        }
    }
    /**
     * Blacklist token
     */
    blacklistToken(token) {
        this.blacklistedTokens.add(token);
        logger_1.logger.info('Token blacklisted', { tokenHash: this.hashToken(token) });
    }
    /**
     * Check if token is blacklisted
     */
    isTokenBlacklisted(token) {
        return this.blacklistedTokens.has(token);
    }
    /**
     * Generate token pair
     */
    generateTokenPair(userPayload) {
        const accessToken = this.generateAccessToken(userPayload);
        const refreshToken = this.generateRefreshToken({
            userId: userPayload.userId,
            sessionId: userPayload.sessionId,
            tokenVersion: 1,
        });
        // Calculate expiration time in seconds
        const expiresIn = this.parseExpirationTime(this.config.accessExpiresIn);
        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }
    /**
     * Refresh access token
     */
    refreshAccessToken(refreshToken) {
        const refreshPayload = this.verifyRefreshToken(refreshToken);
        // Here you would typically fetch user data from database
        // For now, we'll create a minimal payload
        const userPayload = {
            userId: refreshPayload.userId,
            email: '', // Should be fetched from database
            role: '', // Should be fetched from database
            permissions: [], // Should be fetched from database
            sessionId: refreshPayload.sessionId,
        };
        const accessToken = this.generateAccessToken(userPayload);
        const expiresIn = this.parseExpirationTime(this.config.accessExpiresIn);
        return {
            accessToken,
            expiresIn,
        };
    }
    /**
     * Parse expiration time string to seconds
     */
    parseExpirationTime(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new AppError_1.AppError('Invalid expiration time format', 500, true, 'INVALID_EXPIRATION_FORMAT');
        }
        const [, value, unit] = match;
        const numValue = parseInt(value, 10);
        switch (unit) {
            case 's':
                return numValue;
            case 'm':
                return numValue * 60;
            case 'h':
                return numValue * 3600;
            case 'd':
                return numValue * 86400;
            default:
                throw new AppError_1.AppError('Invalid expiration time unit', 500, true, 'INVALID_EXPIRATION_UNIT');
        }
    }
    /**
     * Hash token for logging (security)
     */
    hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex').substring(0, 16);
    }
    /**
     * Get token expiration date
     */
    getTokenExpiration(token) {
        try {
            const decoded = this.decodeToken(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        const expiration = this.getTokenExpiration(token);
        if (!expiration)
            return true;
        return expiration < new Date();
    }
    /**
     * Generate secure session ID
     */
    generateSessionId() {
        return crypto_1.default.randomUUID();
    }
    /**
     * Clean up expired blacklisted tokens (should be called periodically)
     */
    cleanupBlacklistedTokens() {
        const expiredTokens = [];
        for (const token of this.blacklistedTokens) {
            if (this.isTokenExpired(token)) {
                expiredTokens.push(token);
            }
        }
        expiredTokens.forEach((token) => this.blacklistedTokens.delete(token));
        logger_1.logger.info('Cleaned up expired blacklisted tokens', {
            cleanedCount: expiredTokens.length,
            remainingCount: this.blacklistedTokens.size,
        });
    }
}
exports.JWTService = JWTService;
// Default JWT service instance
exports.jwtService = new JWTService({
    accessSecret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
});
// JWT Middleware for Express
const jwtMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError_1.AppError('Authorization header missing or invalid', 401, true, 'MISSING_AUTH_HEADER');
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const payload = exports.jwtService.verifyAccessToken(token);
        req.user = payload;
        req.token = token;
        next();
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
            });
        }
        logger_1.logger.error('JWT middleware error', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
        });
    }
};
exports.jwtMiddleware = jwtMiddleware;
// Optional JWT Middleware (doesn't fail if token is missing)
const optionalJwtMiddleware = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const payload = exports.jwtService.verifyAccessToken(token);
        req.user = payload;
        req.token = token;
        next();
    }
    catch (error) {
        // Log error but don't fail the request
        logger_1.logger.warn('Optional JWT middleware error', error);
        next();
    }
};
exports.optionalJwtMiddleware = optionalJwtMiddleware;
exports.default = exports.jwtService;
//# sourceMappingURL=jwt.js.map