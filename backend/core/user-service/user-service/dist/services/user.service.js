"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redis.connect().catch((err) => {
    logger_1.logger.error('Redis connection failed:', err);
});
class UserService {
    async createUser(userData) {
        try {
            const existingEmail = await prisma.user.findUnique({
                where: { email: userData.email },
            });
            if (existingEmail) {
                throw new error_middleware_1.ConflictError('Email already exists');
            }
            const existingUsername = await prisma.user.findUnique({
                where: { username: userData.username },
            });
            if (existingUsername) {
                throw new error_middleware_1.ConflictError('Username already exists');
            }
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            const passwordHash = await bcryptjs_1.default.hash(userData.password, saltRounds);
            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    username: userData.username,
                    passwordHash,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phoneNumber: userData.phoneNumber,
                    role: userData.role || client_1.UserRole.CUSTOMER,
                    isActive: userData.isActive ?? true,
                    isEmailVerified: userData.isEmailVerified ?? false,
                    bio: userData.bio,
                    profileImage: userData.profileImage,
                },
                include: {
                    addresses: true,
                },
            });
            logger_1.logger.info('User created successfully', {
                userId: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to create user:', error);
            throw error;
        }
    }
    async getUserById(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    addresses: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            if (!user) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by ID:', error);
            throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    addresses: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            if (!user) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by email:', error);
            throw error;
        }
    }
    async getUserByUsername(username) {
        try {
            const user = await prisma.user.findUnique({
                where: { username },
                include: {
                    addresses: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            if (!user) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by username:', error);
            throw error;
        }
    }
    async updateUser(userId, updateData) {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!existingUser) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            if (updateData.username && updateData.username !== existingUser.username) {
                const existingUsername = await prisma.user.findUnique({
                    where: { username: updateData.username },
                });
                if (existingUsername) {
                    throw new error_middleware_1.ConflictError('Username already exists');
                }
            }
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                include: {
                    addresses: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            logger_1.logger.info('User updated successfully', {
                userId: updatedUser.id,
                email: updatedUser.email,
                changes: Object.keys(updateData),
            });
            return updatedUser;
        }
        catch (error) {
            logger_1.logger.error('Failed to update user:', error);
            throw error;
        }
    }
    async adminUpdateUser(userId, updateData) {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!existingUser) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            if (updateData.email && updateData.email !== existingUser.email) {
                const existingEmail = await prisma.user.findUnique({
                    where: { email: updateData.email },
                });
                if (existingEmail) {
                    throw new error_middleware_1.ConflictError('Email already exists');
                }
            }
            if (updateData.username && updateData.username !== existingUser.username) {
                const existingUsername = await prisma.user.findUnique({
                    where: { username: updateData.username },
                });
                if (existingUsername) {
                    throw new error_middleware_1.ConflictError('Username already exists');
                }
            }
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                include: {
                    addresses: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            logger_1.logger.info('User updated by admin successfully', {
                userId: updatedUser.id,
                email: updatedUser.email,
                changes: Object.keys(updateData),
            });
            return updatedUser;
        }
        catch (error) {
            logger_1.logger.error('Failed to admin update user:', error);
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, passwordHash: true },
            });
            if (!user) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new error_middleware_1.UnauthorizedError('Current password is incorrect');
            }
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            const newPasswordHash = await bcryptjs_1.default.hash(newPassword, saltRounds);
            await prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newPasswordHash },
            });
            logger_1.logger.info('Password changed successfully', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to change password:', error);
            throw error;
        }
    }
    async updateEmail(userId, newEmail, password) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, passwordHash: true },
            });
            if (!user) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new error_middleware_1.UnauthorizedError('Password is incorrect');
            }
            const existingEmail = await prisma.user.findUnique({
                where: { email: newEmail },
            });
            if (existingEmail) {
                throw new error_middleware_1.ConflictError('Email already exists');
            }
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    email: newEmail,
                    isEmailVerified: false,
                },
                include: {
                    addresses: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            logger_1.logger.info('Email updated successfully', {
                userId,
                oldEmail: user.email,
                newEmail,
            });
            return updatedUser;
        }
        catch (error) {
            logger_1.logger.error('Failed to update email:', error);
            throw error;
        }
    }
    async deleteUser(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new error_middleware_1.NotFoundError('User not found');
            }
            await prisma.user.update({
                where: { id: userId },
                data: { isActive: false },
            });
            logger_1.logger.info('User deleted successfully', { userId, email: user.email });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete user:', error);
            throw error;
        }
    }
    async getUsers(options) {
        try {
            const { page = 1, limit = 10, search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc', } = options;
            const skip = (page - 1) * limit;
            const where = {};
            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (role)
                where.role = role;
            if (isActive !== undefined)
                where.isActive = isActive;
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                    include: {
                        addresses: {
                            where: { isActive: true },
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                }),
                prisma.user.count({ where }),
            ]);
            return {
                users,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get users:', error);
            throw error;
        }
    }
    async getUserStats() {
        try {
            const [total, active, inactive, verified, unverified, customers, sellers, admins, superAdmins,] = await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { isActive: true } }),
                prisma.user.count({ where: { isActive: false } }),
                prisma.user.count({ where: { isEmailVerified: true } }),
                prisma.user.count({ where: { isEmailVerified: false } }),
                prisma.user.count({ where: { role: client_1.UserRole.CUSTOMER } }),
                prisma.user.count({ where: { role: client_1.UserRole.SELLER } }),
                prisma.user.count({ where: { role: client_1.UserRole.ADMIN } }),
                prisma.user.count({ where: { role: client_1.UserRole.SUPER_ADMIN } }),
            ]);
            return {
                total,
                active,
                inactive,
                verified,
                unverified,
                byRole: {
                    CUSTOMER: customers,
                    SELLER: sellers,
                    ADMIN: admins,
                    SUPER_ADMIN: superAdmins,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user stats:', error);
            throw error;
        }
    }
    async updateLastLogin(userId) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { lastLoginAt: new Date() },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update last login:', error);
            throw error;
        }
    }
    async userExists(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true },
            });
            return !!user;
        }
        catch (error) {
            logger_1.logger.error('Failed to check if user exists:', error);
            throw error;
        }
    }
    transformUser(user) {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    transformUserWithAddresses(user) {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map