"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const auth_service_1 = require("../services/auth.service");
const jwt_service_1 = require("../services/jwt.service");
const email_service_1 = require("../services/email.service");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class AuthController {
    authService;
    jwtService;
    emailService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
        this.jwtService = new jwt_service_1.JWTService();
        this.emailService = email_service_1.emailService;
    }
    register = async (req, res, next) => {
        try {
            const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;
            if (!email || !password || !firstName || !lastName) {
                throw new errorHandler_1.ValidationError('Email, password, first name, and last name are required');
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new errorHandler_1.ValidationError('Invalid email format');
            }
            if (password.length < 8) {
                throw new errorHandler_1.ValidationError('Password must be at least 8 characters long');
            }
            const existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (existingUser) {
                throw new errorHandler_1.ConflictError('User with this email already exists');
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            const user = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phone,
                    role,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    isEmailVerified: true,
                    createdAt: true,
                },
            });
            const tokens = await this.jwtService.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            await prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: tokens.refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            try {
                await this.emailService.sendEmailVerification(user.email, user.firstName);
            }
            catch (emailError) {
                logger_1.logger.warn('Failed to send verification email', {
                    error: emailError instanceof Error ? emailError.message : 'Unknown error',
                    email: user.email
                });
            }
            logger_1.logger.info('User registered successfully', {
                userId: user.id,
                email: user.email,
                role: user.role,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please check your email for verification.',
                data: {
                    user,
                    tokens,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Registration failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email: req.body.email,
                ip: req.ip,
            });
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const { email, password, rememberMe = false } = req.body;
            if (!email || !password) {
                throw new errorHandler_1.ValidationError('Email and password are required');
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new errorHandler_1.ValidationError('Invalid email format');
            }
            const user = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (!user) {
                logger_1.logger.warn('Login attempt with non-existent email', {
                    email: email.toLowerCase(),
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                });
                throw new errorHandler_1.AuthError('Invalid email or password');
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                logger_1.logger.warn('Login attempt with wrong password', {
                    email: user.email,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                });
                throw new errorHandler_1.AuthError('Invalid email or password');
            }
            if (user.status !== 'ACTIVE') {
                logger_1.logger.warn('Login attempt for inactive account', {
                    email: user.email,
                    status: user.status,
                    ip: req.ip,
                });
                throw new errorHandler_1.AuthError('Account is not active');
            }
            const tokens = await this.jwtService.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            const expiresAt = rememberMe
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: tokens.refreshToken,
                    expiresAt,
                },
            });
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            try {
                await prisma.auditLog.create({
                    data: {
                        event: 'USER_LOGIN',
                        userId: user.id,
                        email: user.email,
                        ipAddress: req.ip || null,
                        userAgent: req.get('User-Agent') || null,
                        action: 'LOGIN',
                        resource: 'AUTH',
                        details: {
                            rememberMe,
                            loginTime: new Date().toISOString(),
                        },
                    },
                });
            }
            catch (auditError) {
                logger_1.logger.warn('Failed to create audit log', {
                    error: auditError instanceof Error ? auditError.message : 'Unknown error',
                    userId: user.id,
                });
            }
            const { password: _, ...userWithoutPassword } = user;
            logger_1.logger.info('User logged in successfully', {
                userId: user.id,
                email: user.email,
                role: user.role,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userWithoutPassword,
                    tokens,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Login failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email: req.body.email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            const refreshToken = req.body.refreshToken;
            if (refreshToken) {
                await prisma.refreshToken.deleteMany({
                    where: { token: refreshToken },
                });
            }
            logger_1.logger.info('User logged out successfully', {
                userId: req.user?.id,
                email: req.user?.email,
                ip: req.ip,
            });
            res.json({
                success: true,
                message: 'Logout successful',
            });
        }
        catch (error) {
            next(error);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });
            if (!storedToken) {
                throw new errorHandler_1.AuthError('Invalid refresh token');
            }
            if (storedToken.expiresAt < new Date()) {
                await prisma.refreshToken.delete({
                    where: { id: storedToken.id },
                });
                throw new errorHandler_1.AuthError('Refresh token expired');
            }
            const tokens = await this.jwtService.generateTokens({
                userId: storedToken.user.id,
                email: storedToken.user.email,
                role: storedToken.user.role,
            });
            await prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: {
                    token: tokens.refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: { tokens },
            });
        }
        catch (error) {
            next(error);
        }
    };
    forgotPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            const user = await prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                res.json({
                    success: true,
                    message: 'If an account with that email exists, we have sent a password reset link.',
                });
                return;
            }
            const resetToken = await this.jwtService.generateResetToken(user.id);
            await prisma.passwordReset.create({
                data: {
                    userId: user.id,
                    token: resetToken,
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
                },
            });
            await this.emailService.sendPasswordReset(user.email, resetToken, user.firstName);
            logger_1.logger.info('Password reset requested', {
                userId: user.id,
                email: user.email,
                ip: req.ip,
            });
            res.json({
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.',
            });
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const { token, password } = req.body;
            const resetToken = await prisma.passwordReset.findUnique({
                where: { token },
                include: { user: true },
            });
            if (!resetToken) {
                throw new errorHandler_1.AuthError('Invalid or expired reset token');
            }
            if (resetToken.expiresAt < new Date()) {
                await prisma.passwordReset.delete({
                    where: { id: resetToken.id },
                });
                throw new errorHandler_1.AuthError('Reset token expired');
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            await prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            });
            await prisma.passwordReset.delete({
                where: { id: resetToken.id },
            });
            await prisma.refreshToken.deleteMany({
                where: { userId: resetToken.userId },
            });
            logger_1.logger.info('Password reset successfully', {
                userId: resetToken.userId,
                email: resetToken.user.email,
                ip: req.ip,
            });
            res.json({
                success: true,
                message: 'Password reset successfully. Please login with your new password.',
            });
        }
        catch (error) {
            next(error);
        }
    };
    changePassword = async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            const { currentPassword, newPassword } = req.body;
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    password: true,
                    email: true,
                },
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new errorHandler_1.ValidationError('Current password is incorrect');
            }
            const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
            await prisma.user.update({
                where: { id: req.user.id },
                data: { password: hashedNewPassword },
            });
            if (req.user.userId) {
                await prisma.refreshToken.deleteMany({
                    where: { userId: req.user.userId },
                });
            }
            logger_1.logger.info('Password changed successfully', { userId: user.id });
            return res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            return next(error);
        }
    };
    verifyEmail = async (req, res, next) => {
        try {
            const { token } = req.body;
            const verification = await prisma.emailVerification.findUnique({
                where: { token },
            });
            if (!verification) {
                throw new errorHandler_1.AuthError('Invalid verification token');
            }
            if (verification.expiresAt < new Date()) {
                await prisma.emailVerification.delete({
                    where: { id: verification.id },
                });
                throw new errorHandler_1.AuthError('Verification token expired');
            }
            await prisma.user.update({
                where: { id: verification.userId },
                data: { isEmailVerified: true },
            });
            await prisma.emailVerification.delete({
                where: { id: verification.id },
            });
            logger_1.logger.info('Email verified successfully', {
                userId: verification.userId,
                ip: req.ip,
            });
            return res.json({
                success: true,
                message: 'Email verified successfully',
            });
        }
        catch (error) {
            return next(error);
        }
    };
    resendVerification = async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    isEmailVerified: true,
                },
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            if (user.isEmailVerified) {
                throw new errorHandler_1.ValidationError('Email is already verified');
            }
            if (req.user.userId) {
                await prisma.emailVerification.deleteMany({
                    where: { userId: req.user.userId },
                });
            }
            await this.emailService.sendVerificationEmail(user.email, user.id);
            logger_1.logger.info('Verification email resent', { userId: user.id });
            return res.status(200).json({
                success: true,
                message: 'Verification email sent successfully',
            });
        }
        catch (error) {
            return next(error);
        }
    };
    getProfile = async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            return res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            return next(error);
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map