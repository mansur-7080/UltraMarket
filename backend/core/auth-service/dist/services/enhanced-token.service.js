"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const crypto_2 = require("crypto");
const prisma = new client_1.PrismaClient();
class TokenService {
    async generateTokens(userId, req) {
        try {
            const deviceId = req?.headers['x-device-id'];
            const userAgent = req?.headers['user-agent'];
            const ip = req?.ip || req?.connection?.remoteAddress;
            const accessToken = jsonwebtoken_1.default.sign({
                userId,
                type: 'access',
                jti: (0, crypto_2.randomBytes)(16).toString('hex'),
            }, process.env['JWT_SECRET'] || 'fallback-secret', {
                expiresIn: '15m',
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-api',
            });
            const refreshToken = jsonwebtoken_1.default.sign({
                userId,
                type: 'refresh',
                jti: (0, crypto_2.randomBytes)(16).toString('hex'),
            }, process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret', {
                expiresIn: '7d',
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-api',
            });
            const refreshTokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
            await prisma.refreshToken.create({
                data: {
                    userId,
                    token: refreshTokenHash,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            logger_1.logger.info('Tokens generated successfully', {
                userId,
                operation: 'generate_tokens',
                deviceId,
            });
            return { accessToken, refreshToken };
        }
        catch (error) {
            logger_1.logger.error('Token generation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'generate_tokens',
            });
            throw error;
        }
    }
    async storeDeviceInfo(userId, deviceInfo) {
        try {
            const existingDevice = await prisma.refreshToken.findFirst({
                where: {
                    userId,
                },
            });
            if (existingDevice) {
                await prisma.refreshToken.update({
                    where: { id: existingDevice.id },
                    data: {
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            }
            else {
                await prisma.refreshToken.create({
                    data: {
                        userId,
                        token: crypto_1.default.randomBytes(32).toString('hex'),
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
                logger_1.logger.info('User logged in from a new device', {
                    userId,
                    deviceId: deviceInfo.deviceId,
                    browser: deviceInfo.browser?.name,
                    os: deviceInfo.os?.name,
                    ip: deviceInfo.ip,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to store device information', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
            });
        }
    }
    validateAccessToken(token) {
        try {
            const secret = process.env['JWT_SECRET'];
            if (!secret) {
                throw new error_handler_1.AuthError('JWT secret is not configured');
            }
            const payload = jsonwebtoken_1.default.verify(token, secret);
            return payload;
        }
        catch (error) {
            logger_1.logger.debug('Access token validation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    validateRefreshToken(token) {
        try {
            const refreshSecret = process.env['JWT_REFRESH_SECRET'];
            if (!refreshSecret) {
                throw new error_handler_1.AuthError('JWT refresh secret is not configured');
            }
            const payload = jsonwebtoken_1.default.verify(token, refreshSecret);
            return payload;
        }
        catch (error) {
            logger_1.logger.debug('Refresh token validation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async refreshTokens(refreshToken, req) {
        try {
            const payload = this.validateRefreshToken(refreshToken);
            if (!payload) {
                throw new error_handler_1.UnauthorizedError('Invalid refresh token');
            }
            const tokenFromDb = await this.findRefreshToken(refreshToken);
            if (!tokenFromDb || tokenFromDb.isRevoked) {
                throw new error_handler_1.UnauthorizedError('Refresh token is invalid or has been revoked');
            }
            if (tokenFromDb.expiresAt < new Date()) {
                throw new error_handler_1.UnauthorizedError('Refresh token has expired');
            }
            await this.revokeToken(refreshToken);
            const newTokens = await this.generateTokens(payload.userId, req);
            return newTokens;
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async revokeAllUserTokens(userId) {
        try {
            await prisma.refreshToken.deleteMany({
                where: { userId },
            });
            logger_1.logger.info('All user tokens revoked', {
                userId,
                operation: 'revoke_all_tokens',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke all user tokens', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'revoke_all_tokens',
            });
            throw error;
        }
    }
    async revokeToken(refreshToken) {
        try {
            const refreshTokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
            await prisma.refreshToken.deleteMany({
                where: { token: refreshTokenHash },
            });
            logger_1.logger.info('Token revoked successfully', {
                operation: 'revoke_token',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke token', {
                error: error instanceof Error ? error.message : 'Unknown error',
                operation: 'revoke_token',
            });
            throw error;
        }
    }
    async findRefreshToken(refreshToken) {
        try {
            const refreshTokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
            return await prisma.refreshToken.findFirst({
                where: { token: refreshTokenHash },
                include: { user: true },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find refresh token', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async getUserDevices(userId) {
        try {
            const tokens = await prisma.refreshToken.findMany({
                where: {
                    userId,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });
            return tokens.map((token) => ({
                id: token.id,
                createdAt: token.createdAt,
                expiresAt: token.expiresAt,
                user: token.user,
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get user devices', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
            });
            return [];
        }
    }
    async revokeDeviceTokens(userId, deviceId) {
        try {
            await prisma.refreshToken.deleteMany({
                where: { userId },
            });
            logger_1.logger.info('Device tokens revoked', {
                userId,
                deviceId,
                operation: 'revoke_device_tokens',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke device tokens', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                deviceId,
                operation: 'revoke_device_tokens',
            });
            throw error;
        }
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=enhanced-token.service.js.map