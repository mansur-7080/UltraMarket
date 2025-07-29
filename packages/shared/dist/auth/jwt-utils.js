"use strict";
/**
 * JWT Utility Functions
 * Simple token generation and verification utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokens = generateTokens;
exports.verifyToken = verifyToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.generateEmailVerificationToken = generateEmailVerificationToken;
exports.generatePasswordResetToken = generatePasswordResetToken;
exports.decodeToken = decodeToken;
exports.isTokenExpired = isTokenExpired;
exports.getTokenExpiration = getTokenExpiration;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const logger_1 = require("../logging/logger");
/**
 * Generate access and refresh tokens
 */
async function generateTokens(userId) {
    try {
        const jti = generateTokenId();
        // Generate access token (15 minutes)
        const accessToken = jsonwebtoken_1.default.sign({
            userId,
            jti,
            type: 'access',
            iat: Math.floor(Date.now() / 1000),
        }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: '15m',
            issuer: 'ultramarket',
            audience: 'ultramarket-users',
        });
        // Generate refresh token (7 days)
        const refreshToken = jsonwebtoken_1.default.sign({
            userId,
            jti,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
        }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '7d',
            issuer: 'ultramarket',
            audience: 'ultramarket-users',
        });
        logger_1.logger.info('Tokens generated successfully', { userId, jti });
        return {
            accessToken,
            refreshToken,
        };
    }
    catch (error) {
        logger_1.logger.error('Token generation failed', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw new Error('Token generation failed');
    }
}
/**
 * Verify and decode JWT token
 */
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET, {
            issuer: 'ultramarket',
            audience: 'ultramarket-users',
        });
        return decoded;
    }
    catch (error) {
        logger_1.logger.error('Token verification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw new Error('Invalid token');
    }
}
/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET, {
            issuer: 'ultramarket',
            audience: 'ultramarket-users',
        });
        return decoded;
    }
    catch (error) {
        logger_1.logger.error('Refresh token verification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw new Error('Invalid refresh token');
    }
}
/**
 * Generate email verification token
 */
function generateEmailVerificationToken(userId) {
    return jsonwebtoken_1.default.sign({
        userId,
        type: 'email_verification',
        iat: Math.floor(Date.now() / 1000),
    }, process.env.JWT_EMAIL_VERIFICATION_SECRET, {
        expiresIn: '24h',
        issuer: 'ultramarket',
        audience: 'ultramarket-users',
    });
}
/**
 * Generate password reset token
 */
function generatePasswordResetToken(userId) {
    return jsonwebtoken_1.default.sign({
        userId,
        type: 'password_reset',
        iat: Math.floor(Date.now() / 1000),
    }, process.env.JWT_PASSWORD_RESET_SECRET, {
        expiresIn: '1h',
        issuer: 'ultramarket',
        audience: 'ultramarket-users',
    });
}
/**
 * Generate unique token ID
 */
function generateTokenId() {
    return require('crypto').randomBytes(32).toString('hex');
}
/**
 * Decode token without verification (for logging purposes)
 */
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        logger_1.logger.error('Token decode failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return null;
    }
}
/**
 * Check if token is expired
 */
function isTokenExpired(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        return Date.now() >= decoded.exp * 1000;
    }
    catch (error) {
        return true;
    }
}
/**
 * Get token expiration time
 */
function getTokenExpiration(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp) {
            return null;
        }
        return new Date(decoded.exp * 1000);
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=jwt-utils.js.map