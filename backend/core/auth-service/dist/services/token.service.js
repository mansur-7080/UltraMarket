"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const logger = console;
class ApiError extends Error {
    statusCode;
    message;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
    }
}
const prisma = new client_1.PrismaClient();
class TokenService {
    async generateTokens(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            });
            if (!user) {
                throw new ApiError(404, 'User not found');
            }
            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role,
            };
            const secret = process.env['JWT_SECRET'];
            const refreshSecret = process.env['JWT_REFRESH_SECRET'];
            if (!secret || !refreshSecret) {
                throw new Error('JWT secrets are not configured');
            }
            const accessToken = jsonwebtoken_1.default.sign(payload, secret, {
                expiresIn: parseInt(process.env['JWT_ACCESS_EXPIRES_IN'] || '900', 10),
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-users',
            });
            const refreshToken = jsonwebtoken_1.default.sign(payload, refreshSecret, {
                expiresIn: parseInt(process.env['JWT_REFRESH_EXPIRES_IN'] || '604800', 10),
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-users',
            });
            const refreshTokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
            await prisma.refreshToken.create({
                data: {
                    userId,
                    token: refreshTokenHash,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            logger.info('Tokens generated successfully', {
                userId,
                operation: 'generate_tokens',
            });
            return { accessToken, refreshToken };
        }
        catch (error) {
            logger.error('Token generation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'generate_tokens',
            });
            throw error;
        }
    }
    async verifyAccessToken(token) {
        try {
            const secret = process.env['JWT_SECRET'];
            if (!secret) {
                throw new Error('JWT_SECRET is not configured');
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret, {
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-users',
            });
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { status: true },
            });
            if (!user || user.status !== 'ACTIVE') {
                throw new ApiError(401, 'User account is inactive or deleted');
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger.error('Invalid access token', {
                    error: error.message,
                    operation: 'verify_access_token',
                });
                throw new ApiError(401, 'Invalid access token');
            }
            throw error;
        }
    }
    async verifyRefreshToken(token) {
        try {
            const secret = process.env['JWT_REFRESH_SECRET'];
            if (!secret) {
                throw new Error('JWT_REFRESH_SECRET is not configured');
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret, {
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-users',
            });
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            const storedToken = await prisma.refreshToken.findFirst({
                where: {
                    token: tokenHash,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
            if (!storedToken) {
                throw new ApiError(401, 'Invalid or expired refresh token');
            }
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { status: true },
            });
            if (!user || user.status !== 'ACTIVE') {
                throw new ApiError(401, 'User account is inactive or deleted');
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger.error('Invalid refresh token', {
                    error: error.message,
                    operation: 'verify_refresh_token',
                });
                throw new ApiError(401, 'Invalid refresh token');
            }
            throw error;
        }
    }
    async invalidateRefreshToken(token) {
        try {
            const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
            await prisma.refreshToken.updateMany({
                where: {
                    token: tokenHash,
                },
                data: {},
            });
            logger.info('Refresh token invalidated', {
                operation: 'invalidate_refresh_token',
            });
        }
        catch (error) {
            logger.error('Failed to invalidate refresh token', {
                error: error instanceof Error ? error.message : 'Unknown error',
                operation: 'invalidate_refresh_token',
            });
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
            logger.info('All user tokens invalidated', {
                userId,
                operation: 'invalidate_all_user_tokens',
            });
        }
        catch (error) {
            logger.error('Failed to invalidate all user tokens', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'invalidate_all_user_tokens',
            });
            throw error;
        }
    }
    async getTokenInfo(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded) {
                throw new ApiError(400, 'Invalid token format');
            }
            return {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                issuedAt: new Date(decoded.iat * 1000),
                expiresAt: new Date(decoded.exp * 1000),
            };
        }
        catch (error) {
            logger.error('Failed to get token info', {
                error: error instanceof Error ? error.message : 'Unknown error',
                operation: 'get_token_info',
            });
            throw error;
        }
    }
    async cleanupExpiredTokens() {
        try {
            const now = new Date();
            const deletedTokens = await prisma.refreshToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: now,
                    },
                },
            });
            logger.info('Expired tokens cleaned up', {
                deletedCount: deletedTokens.count,
                operation: 'cleanup_expired_tokens',
            });
        }
        catch (error) {
            logger.error('Failed to cleanup expired tokens', {
                error: error instanceof Error ? error.message : 'Unknown error',
                operation: 'cleanup_expired_tokens',
            });
        }
    }
    async getUserSessions(userId) {
        try {
            const sessions = await prisma.refreshToken.findMany({
                where: {
                    userId,
                },
                select: {
                    id: true,
                    createdAt: true,
                    expiresAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            return sessions;
        }
        catch (error) {
            logger.error('Failed to get user sessions', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'get_user_sessions',
            });
            throw error;
        }
    }
    async revokeSession(sessionId, userId) {
        try {
            const session = await prisma.refreshToken.findFirst({
                where: {
                    id: sessionId,
                    userId,
                },
            });
            if (!session) {
                throw new ApiError(404, 'Session not found');
            }
            await prisma.refreshToken.update({
                where: { id: sessionId },
                data: {},
            });
            logger.info('Session revoked', {
                sessionId,
                userId,
                operation: 'revoke_session',
            });
        }
        catch (error) {
            logger.error('Failed to revoke session', {
                error: error instanceof Error ? error.message : 'Unknown error',
                sessionId,
                userId,
                operation: 'revoke_session',
            });
            throw error;
        }
    }
    async generateTemporaryToken(userId, purpose, expiresIn = '1h') {
        try {
            const payload = {
                userId,
                purpose,
                type: 'temporary',
            };
            const secret = process.env['JWT_SECRET'];
            if (!secret) {
                throw new Error('JWT_SECRET is not configured');
            }
            const token = jsonwebtoken_1.default.sign(payload, secret, {
                expiresIn: parseInt(expiresIn, 10),
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-temp',
            });
            logger.info('Temporary token generated', {
                userId,
                purpose,
                operation: 'generate_temporary_token',
            });
            return token;
        }
        catch (error) {
            logger.error('Failed to generate temporary token', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                purpose,
                operation: 'generate_temporary_token',
            });
            throw error;
        }
    }
    async verifyTemporaryToken(token, purpose) {
        try {
            const secret = process.env['JWT_SECRET'];
            if (!secret) {
                throw new Error('JWT_SECRET is not configured');
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret, {
                issuer: 'ultramarket-auth',
                audience: 'ultramarket-temp',
            });
            if (decoded.purpose !== purpose || decoded.type !== 'temporary') {
                throw new ApiError(401, 'Invalid token purpose');
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger.error('Invalid temporary token', {
                    error: error.message,
                    purpose,
                    operation: 'verify_temporary_token',
                });
                throw new ApiError(401, 'Invalid temporary token');
            }
            throw error;
        }
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=token.service.js.map