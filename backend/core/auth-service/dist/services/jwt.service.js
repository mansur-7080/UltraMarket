"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const logger_1 = require("../utils/logger");
class JWTService {
    accessTokenSecret;
    refreshTokenSecret;
    accessTokenExpiry;
    refreshTokenExpiry;
    constructor() {
        this.accessTokenSecret = process.env['JWT_SECRET'] || 'fallback-secret';
        this.refreshTokenSecret = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret';
        this.accessTokenExpiry = process.env['JWT_EXPIRES_IN'] || '15m';
        this.refreshTokenExpiry = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';
    }
    async generateTokens(payload) {
        try {
            const accessToken = jsonwebtoken_1.default.sign({
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                type: 'access',
            }, this.accessTokenSecret, {
                expiresIn: '15m',
            });
            const refreshToken = jsonwebtoken_1.default.sign({
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                type: 'refresh',
                jti: (0, crypto_1.randomBytes)(16).toString('hex'),
            }, this.refreshTokenSecret, {
                expiresIn: '7d',
            });
            logger_1.logger.debug('Tokens generated successfully', {
                userId: payload.userId,
                email: payload.email,
            });
            return {
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            logger_1.logger.error('Token generation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: payload.userId,
            });
            throw new Error('Failed to generate tokens');
        }
    }
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret);
            if (decoded.type !== 'access') {
                return null;
            }
            return {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };
        }
        catch (error) {
            logger_1.logger.debug('Access token verification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.refreshTokenSecret);
            if (decoded.type !== 'refresh') {
                return null;
            }
            return {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };
        }
        catch (error) {
            logger_1.logger.debug('Refresh token verification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async generateResetToken(userId) {
        try {
            const resetToken = jsonwebtoken_1.default.sign({
                userId,
                type: 'reset',
                jti: (0, crypto_1.randomBytes)(16).toString('hex'),
            }, this.accessTokenSecret, {
                expiresIn: '1h',
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-api',
            });
            logger_1.logger.debug('Reset token generated', { userId });
            return resetToken;
        }
        catch (error) {
            logger_1.logger.error('Reset token generation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
            });
            throw new Error('Failed to generate reset token');
        }
    }
    async generateVerificationToken(userId) {
        try {
            const verificationToken = jsonwebtoken_1.default.sign({
                userId,
                type: 'verification',
                jti: (0, crypto_1.randomBytes)(16).toString('hex'),
            }, this.accessTokenSecret, {
                expiresIn: '24h',
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-api',
            });
            logger_1.logger.debug('Verification token generated', { userId });
            return verificationToken;
        }
        catch (error) {
            logger_1.logger.error('Verification token generation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
            });
            throw new Error('Failed to generate verification token');
        }
    }
    decodeToken(token) {
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
    getTokenExpiration(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get token expiration', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    isTokenExpired(token) {
        try {
            const expiration = this.getTokenExpiration(token);
            if (!expiration) {
                return true;
            }
            return expiration < new Date();
        }
        catch (error) {
            logger_1.logger.error('Failed to check token expiration', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return true;
        }
    }
}
exports.JWTService = JWTService;
//# sourceMappingURL=jwt.service.js.map