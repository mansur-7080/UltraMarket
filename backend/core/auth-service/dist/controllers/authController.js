"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../index");
const auth_service_1 = require("../services/auth.service");
const jwt_service_1 = require("../services/jwt.service");
const email_service_1 = require("../services/email.service");
const user_service_1 = require("../services/user.service");
const errorHandler_1 = require("../middleware/errorHandler");
class AuthController {
    authService;
    jwtService;
    emailService;
    userService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
        this.jwtService = new jwt_service_1.JWTService();
        this.emailService = email_service_1.emailService;
        this.userService = new user_service_1.UserService();
    }
    register = async (req, res, next) => {
        try {
            const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;
            const existingUser = await this.userService.getUserByEmail(email);
            if (existingUser) {
                throw new errorHandler_1.ConflictError('User with this email already exists');
            }
            const user = await this.userService.createUser({
                email,
                password,
                firstName,
                lastName,
                phone,
                role,
            });
            const tokens = await this.jwtService.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            await index_1.prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: tokens.refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            await this.emailService.sendWelcomeEmail(email, firstName);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isEmailVerified: user.isEmailVerified,
                    },
                    tokens,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const user = await this.userService.getUserByEmail(email);
            if (!user) {
                throw new errorHandler_1.AuthError('Invalid credentials');
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password || '');
            if (!isValidPassword) {
                throw new errorHandler_1.AuthError('Invalid credentials');
            }
            await this.userService.updateLastLogin(user.id);
            const tokens = await this.jwtService.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            await index_1.prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: tokens.refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isEmailVerified: user.isEmailVerified,
                    },
                    tokens,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const userId = req.user?.userId;
            if (refreshToken) {
                await index_1.prisma.refreshToken.deleteMany({
                    where: { token: refreshToken },
                });
            }
            else if (userId) {
                await index_1.prisma.refreshToken.deleteMany({
                    where: { userId },
                });
            }
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new errorHandler_1.ValidationError('Refresh token is required');
            }
            const payload = this.jwtService.verifyRefreshToken(refreshToken);
            if (!payload) {
                throw new errorHandler_1.AuthError('Invalid refresh token');
            }
            const user = await this.userService.getUserById(payload.userId);
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const tokens = await this.jwtService.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            await index_1.prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: tokens.refreshToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            res.status(200).json({
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
            const user = await this.userService.getUserByEmail(email);
            if (!user) {
                res.status(200).json({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent',
                });
                return;
            }
            const resetToken = await this.jwtService.generateResetToken(user.id);
            await this.emailService.sendPasswordResetEmail(email, user.firstName, resetToken);
            res.status(200).json({
                success: true,
                message: 'If the email exists, a password reset link has been sent',
            });
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                throw new errorHandler_1.ValidationError('Token and new password are required');
            }
            const payload = this.jwtService.verifyAccessToken(token);
            if (!payload) {
                throw new errorHandler_1.AuthError('Invalid or expired reset token');
            }
            const user = await this.userService.getUserById(payload.userId);
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            await this.userService.changePassword(user.id, newPassword);
            await index_1.prisma.refreshToken.deleteMany({
                where: { userId: user.id },
            });
            res.status(200).json({
                success: true,
                message: 'Password reset successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    changePassword = async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AuthError('User not authenticated');
            }
            const user = await this.userService.getUserById(userId);
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password || '');
            if (!isValidPassword) {
                throw new errorHandler_1.AuthError('Current password is incorrect');
            }
            await this.userService.changePassword(userId, newPassword);
            await index_1.prisma.refreshToken.deleteMany({
                where: { userId },
            });
            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    verifyEmail = async (req, res, next) => {
        try {
            const { token } = req.body;
            if (!token) {
                throw new errorHandler_1.ValidationError('Verification token is required');
            }
            const payload = this.jwtService.verifyAccessToken(token);
            if (!payload) {
                throw new errorHandler_1.AuthError('Invalid or expired verification token');
            }
            const user = await this.userService.getUserById(payload.userId);
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            await this.userService.verifyEmail(user.id);
            res.status(200).json({
                success: true,
                message: 'Email verified successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    resendVerification = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AuthError('User not authenticated');
            }
            const user = await this.userService.getUserById(userId);
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            if (user.isEmailVerified) {
                throw new errorHandler_1.ValidationError('Email is already verified');
            }
            await this.emailService.sendVerificationEmail(user.email, user.firstName);
            res.status(200).json({
                success: true,
                message: 'Verification email sent',
            });
        }
        catch (error) {
            next(error);
        }
    };
    getProfile = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AuthError('User not authenticated');
            }
            const user = await this.userService.getUserById(userId);
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        role: user.role,
                        isEmailVerified: user.isEmailVerified,
                        isPhoneVerified: user.isPhoneVerified,
                        status: user.status,
                        lastLoginAt: user.lastLoginAt,
                        createdAt: user.createdAt,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map