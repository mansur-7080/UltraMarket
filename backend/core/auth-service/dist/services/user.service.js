"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class UserService {
    constructor() {
        logger_1.logger.debug('User Service initialized');
    }
    async createUser(data) {
        try {
            const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: data.role || 'CUSTOMER',
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    password: true,
                    role: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            logger_1.logger.info('User created successfully', {
                userId: user.id,
                email: user.email,
                operation: 'create_user',
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to create user', {
                error: error.message,
                email: data.email,
                operation: 'create_user',
            });
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (target?.includes('email')) {
                    throw new Error('User with this email already exists');
                }
            }
            throw error;
        }
    }
    async getUserById(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    password: true,
                    role: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by ID', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'get_user_by_id',
            });
            return null;
        }
    }
    async getUserByEmail(email) {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    password: true,
                    role: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email,
                operation: 'get_user_by_email',
            });
            return null;
        }
    }
    async updateUser(userId, data) {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    password: true,
                    role: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            logger_1.logger.info('User updated successfully', {
                userId,
                operation: 'update_user',
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to update user', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'update_user',
            });
            throw error;
        }
    }
    async updateUserStatus(userId, status) {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    status,
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    password: true,
                    role: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            logger_1.logger.info('User status updated', {
                userId,
                status,
                operation: 'update_user_status',
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to update user status', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                status,
                operation: 'update_user_status',
            });
            throw error;
        }
    }
    async updateLastLogin(userId) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    lastLoginAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            logger_1.logger.debug('Last login time updated', {
                userId,
                operation: 'update_last_login',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update last login time', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'update_last_login',
            });
        }
    }
    async verifyEmail(userId) {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    isEmailVerified: true,
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    password: true,
                    role: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            logger_1.logger.info('User email verified', {
                userId,
                operation: 'verify_email',
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to verify user email', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'verify_email',
            });
            throw error;
        }
    }
    async verifyPhone(userId) {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    isPhoneVerified: true,
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    password: true,
                    role: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            logger_1.logger.info('User phone verified', {
                userId,
                operation: 'verify_phone',
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to verify user phone', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'verify_phone',
            });
            throw error;
        }
    }
    async changePassword(userId, newPassword) {
        try {
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    password: hashedPassword,
                    updatedAt: new Date(),
                },
            });
            logger_1.logger.info('User password changed', {
                userId,
                operation: 'change_password',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to change user password', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'change_password',
            });
            throw error;
        }
    }
    async deleteUser(userId) {
        try {
            await prisma.user.delete({
                where: { id: userId },
            });
            logger_1.logger.info('User deleted', {
                userId,
                operation: 'delete_user',
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete user', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                operation: 'delete_user',
            });
            throw error;
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map