"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const logger = console;
const prisma = new client_1.PrismaClient();
class TokenService {
    accessTokenSecret;
    refreshTokenSecret;
    accessTokenExpiry;
    refreshTokenExpiry;
    constructor() {
        this.accessTokenSecret = process.env['JWT_ACCESS_SECRET'] || 'access-secret';
        this.refreshTokenSecret = process.env['JWT_REFRESH_SECRET'] || 'refresh-secret';
        this.accessTokenExpiry = process.env['JWT_ACCESS_EXPIRY'] || '15m';
        this.refreshTokenExpiry = process.env['JWT_REFRESH_EXPIRY'] || '7d';
    }
    generateAccessToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
            expiresIn: parseInt(process.env['JWT_ACCESS_EXPIRES_IN'] || '900', 10),
        });
    }
    generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, this.refreshTokenSecret, {
            expiresIn: parseInt(process.env['JWT_REFRESH_EXPIRES_IN'] || '604800', 10),
        });
    }
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.accessTokenSecret);
        }
        catch (error) {
            logger.error('Access token verification failed', { error });
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.refreshTokenSecret);
        }
        catch (error) {
            logger.error('Refresh token verification failed', { error });
            return null;
        }
    }
    async saveRefreshToken(userId, refreshToken) {
        try {
            await prisma.refreshToken.create({
                data: {
                    userId,
                    token: refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            logger.info('Refresh token saved successfully', { userId });
        }
        catch (error) {
            logger.error('Failed to save refresh token', { error, userId });
            throw error;
        }
    }
    async findRefreshToken(token) {
        try {
            return await prisma.refreshToken.findFirst({
                where: {
                    token,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
        }
        catch (error) {
            logger.error('Failed to find refresh token', { error });
            throw error;
        }
    }
    async updateRefreshToken(oldToken, newToken) {
        try {
            await prisma.refreshToken.updateMany({
                where: {
                    token: oldToken,
                },
                data: {
                    token: newToken,
                },
            });
            logger.info('Refresh token updated successfully');
        }
        catch (error) {
            logger.error('Failed to update refresh token', { error });
            throw error;
        }
    }
    async invalidateRefreshToken(token) {
        try {
            await prisma.refreshToken.updateMany({
                where: {
                    token,
                },
                data: {},
            });
            logger.info('Refresh token invalidated successfully');
        }
        catch (error) {
            logger.error('Failed to invalidate refresh token', { error });
            throw error;
        }
    }
    async invalidateAllUserTokens(userId) {
        try {
            await prisma.refreshToken.updateMany({
                where: {
                    userId,
                },
                data: {},
            });
            logger.info('All user tokens invalidated successfully', { userId });
        }
        catch (error) {
            logger.error('Failed to invalidate all user tokens', { error, userId });
            throw error;
        }
    }
    async cleanupExpiredTokens() {
        try {
            const result = await prisma.refreshToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });
            logger.info('Expired tokens cleaned up', { count: result.count });
            return result.count;
        }
        catch (error) {
            logger.error('Failed to cleanup expired tokens', { error });
            throw error;
        }
    }
    async getTokenStats() {
        try {
            const [totalTokens, activeTokens, expiredTokens, revokedTokens] = await Promise.all([
                prisma.refreshToken.count(),
                prisma.refreshToken.count({
                    where: {
                        expiresAt: { gt: new Date() },
                    },
                }),
                prisma.refreshToken.count({
                    where: {
                        expiresAt: { lt: new Date() },
                    },
                }),
                prisma.refreshToken.count({
                    where: {},
                }),
            ]);
            return {
                totalTokens,
                activeTokens,
                expiredTokens,
                revokedTokens,
            };
        }
        catch (error) {
            logger.error('Failed to get token statistics', { error });
            throw error;
        }
    }
    decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            logger.error('Failed to decode token', { error });
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
            logger.error('Failed to get token expiration', { error });
            return null;
        }
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=tokenService.js.map