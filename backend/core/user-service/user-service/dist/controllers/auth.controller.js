"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
const email_service_1 = require("../services/email.service");
const redis_service_1 = require("../services/redis.service");
class AuthController {
    emailService;
    redisService;
    constructor() {
        this.emailService = new email_service_1.EmailService();
        this.redisService = new redis_service_1.RedisService();
    }
    async register(userData) {
        try {
            const existingUser = await database_1.prisma.user.findUnique({
                where: { email: userData.email },
            });
            if (existingUser) {
                throw new errorHandler_1.AppError('User with this email already exists', 400);
            }
            const saltRounds = 12;
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, saltRounds);
            const user = await database_1.prisma.user.create({
                data: {
                    email: userData.email,
                    password: hashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone,
                    emailVerified: false,
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    emailVerified: true,
                    status: true,
                    createdAt: true,
                },
            });
            const verificationToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'email_verification' }, database_1.config.jwt.secret, { expiresIn: '24h' });
            await this.emailService.sendVerificationEmail(user.email, verificationToken);
            const { accessToken, refreshToken } = this.generateTokens(user.id);
            logger_1.logger.info('User registered successfully', { userId: user.id, email: user.email });
            return {
                success: true,
                message: 'User registered successfully. Please check your email for verification.',
                data: {
                    user,
                    accessToken,
                    refreshToken,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Registration failed', {
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async login(credentials) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email: credentials.email },
                include: {
                    addresses: true,
                    preferences: true,
                },
            });
            if (!user) {
                throw new errorHandler_1.AppError('Invalid email or password', 401);
            }
            if (user.status !== 'ACTIVE') {
                throw new errorHandler_1.AppError('Account is deactivated', 401);
            }
            const isPasswordValid = await bcryptjs_1.default.compare(credentials.password, user.password);
            if (!isPasswordValid) {
                throw new errorHandler_1.AppError('Invalid email or password', 401);
            }
            const { accessToken, refreshToken } = this.generateTokens(user.id);
            await this.redisService.setRefreshToken(user.id, refreshToken);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            logger_1.logger.info('User logged in successfully', { userId: user.id, email: user.email });
            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        emailVerified: user.emailVerified,
                        status: user.status,
                        addresses: user.addresses,
                        preferences: user.preferences,
                    },
                    accessToken,
                    refreshToken,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Login failed', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, database_1.config.jwt.secret);
            const storedToken = await this.redisService.getRefreshToken(decoded.userId);
            if (!storedToken || storedToken !== refreshToken) {
                throw new errorHandler_1.AppError('Invalid refresh token', 401);
            }
            const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(decoded.userId);
            await this.redisService.setRefreshToken(decoded.userId, newRefreshToken);
            return {
                success: true,
                data: {
                    accessToken,
                    refreshToken: newRefreshToken,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed', {
                error: error instanceof Error ? error.message : error,
            });
            throw new errorHandler_1.AppError('Invalid refresh token', 401);
        }
    }
    async logout(userId) {
        try {
            await this.redisService.removeRefreshToken(userId);
            logger_1.logger.info('User logged out successfully', { userId });
            return {
                success: true,
                message: 'Logged out successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Logout failed', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }
    async forgotPassword(email) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                return;
            }
            const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'password_reset' }, database_1.config.jwt.secret, {
                expiresIn: '1h',
            });
            await this.redisService.setPasswordResetToken(user.id, resetToken);
            await this.emailService.sendPasswordResetEmail(email, resetToken);
            logger_1.logger.info('Password reset email sent', { userId: user.id, email });
            return {
                success: true,
                message: 'Password reset email sent',
            };
        }
        catch (error) {
            logger_1.logger.error('Forgot password failed', {
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async resetPassword(token, newPassword) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, database_1.config.jwt.secret);
            const storedToken = await this.redisService.getPasswordResetToken(decoded.userId);
            if (!storedToken || storedToken !== token) {
                throw new errorHandler_1.AppError('Invalid or expired reset token', 400);
            }
            const saltRounds = 12;
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
            await database_1.prisma.user.update({
                where: { id: decoded.userId },
                data: { password: hashedPassword },
            });
            await this.redisService.removePasswordResetToken(decoded.userId);
            logger_1.logger.info('Password reset successfully', { userId: decoded.userId });
            return {
                success: true,
                message: 'Password reset successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Password reset failed', {
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async verifyEmail(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, database_1.config.jwt.secret);
            await database_1.prisma.user.update({
                where: { id: decoded.userId },
                data: { emailVerified: true },
            });
            logger_1.logger.info('Email verified successfully', { userId: decoded.userId });
            return {
                success: true,
                message: 'Email verified successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Email verification failed', {
                error: error instanceof Error ? error.message : error,
            });
            throw new errorHandler_1.AppError('Invalid or expired verification token', 400);
        }
    }
    async resendVerificationEmail(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            if (user.emailVerified) {
                throw new errorHandler_1.AppError('Email already verified', 400);
            }
            const verificationToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'email_verification' }, database_1.config.jwt.secret, { expiresIn: '24h' });
            await this.emailService.sendVerificationEmail(user.email, verificationToken);
            logger_1.logger.info('Verification email resent', { userId: user.id, email: user.email });
            return {
                success: true,
                message: 'Verification email sent',
            };
        }
        catch (error) {
            logger_1.logger.error('Resend verification failed', {
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async getCurrentUser(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    addresses: true,
                    preferences: true,
                },
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            return {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                emailVerified: user.emailVerified,
                status: user.status,
                addresses: user.addresses,
                preferences: user.preferences,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        }
        catch (error) {
            logger_1.logger.error('Get current user failed', {
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new errorHandler_1.AppError('Current password is incorrect', 400);
            }
            const saltRounds = 12;
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
            await database_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });
            await this.redisService.removeRefreshToken(userId);
            logger_1.logger.info('Password changed successfully', { userId });
            return {
                success: true,
                message: 'Password changed successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Change password failed', {
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    generateTokens(userId) {
        const accessToken = jsonwebtoken_1.default.sign({ userId, type: 'access' }, database_1.config.jwt.secret, {
            expiresIn: database_1.config.jwt.expiresIn,
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, database_1.config.jwt.secret, {
            expiresIn: database_1.config.jwt.refreshExpiresIn,
        });
        return { accessToken, refreshToken };
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map