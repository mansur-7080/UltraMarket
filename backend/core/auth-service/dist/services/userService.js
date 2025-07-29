"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const logger = console;
const prisma = new client_1.PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
    datasources: {
        db: {
            url: process.env['DATABASE_URL'] || '',
        },
    },
    __internal: {
        engine: {
            retry: {
                maxRetries: 3,
                minDelay: 500,
                maxDelay: 5000,
            },
        },
    },
});
class UserService {
    async createUser(data) {
        return await prisma.$transaction(async (tx) => {
            try {
                if (!data.email || !data.password || !data.firstName || !data.lastName) {
                    throw new Error('Missing required user data');
                }
                const user = await tx.user.create({
                    data: {
                        email: data.email,
                        password: data.password,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        phone: data.phone || null,
                        role: (data.role || 'user'),
                        isActive: true,
                        emailVerified: false,
                        metadata: {},
                    },
                });
                logger.info('User created successfully', {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                });
                return user;
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        const target = error.meta?.target || [];
                        logger.warn('User creation failed - duplicate value', {
                            constraint: target.join(', '),
                            email: data.email,
                        });
                        throw new Error(`User with this ${target.join(', ')} already exists`);
                    }
                    if (error.code === 'P2003') {
                        logger.error('User creation failed - foreign key constraint', {
                            constraint: error.meta?.field_name,
                            email: data.email,
                        });
                        throw new Error('Invalid reference to related resource');
                    }
                }
                logger.error('Failed to create user', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                    email: data.email,
                });
                throw new Error('Failed to create user account');
            }
        }, {
            maxWait: 5000,
            timeout: 10000,
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.ReadCommitted,
        });
    }
    async findByEmail(email) {
        try {
            return await prisma.user.findUnique({
                where: { email },
            });
        }
        catch (error) {
            logger.error('Failed to find user by email', { error, email });
            throw error;
        }
    }
    async findById(id) {
        try {
            return await prisma.user.findUnique({
                where: { id },
            });
        }
        catch (error) {
            logger.error('Failed to find user by ID', { error, userId: id });
            throw error;
        }
    }
    async updateUser(id, data) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
            logger.info('User updated successfully', { userId: id });
            return user;
        }
        catch (error) {
            logger.error('Failed to update user', { error, userId: id });
            throw error;
        }
    }
    async updatePassword(id, hashedPassword) {
        try {
            await prisma.user.update({
                where: { id },
                data: {
                    password: hashedPassword,
                    updatedAt: new Date(),
                },
            });
            logger.info('User password updated successfully', { userId: id });
        }
        catch (error) {
            logger.error('Failed to update user password', { error, userId: id });
            throw error;
        }
    }
    async updateLastLogin(id) {
        try {
            await prisma.user.update({
                where: { id },
                data: {
                    lastLoginAt: new Date(),
                },
            });
        }
        catch (error) {
            logger.error('Failed to update last login', { error, userId: id });
            throw error;
        }
    }
    async deactivateUser(id) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    isActive: false,
                    updatedAt: new Date(),
                },
            });
            logger.info('User deactivated successfully', { userId: id });
            return user;
        }
        catch (error) {
            logger.error('Failed to deactivate user', { error, userId: id });
            throw error;
        }
    }
    async activateUser(id) {
        try {
            const user = await prisma.user.update({
                where: { id },
                data: {
                    isActive: true,
                    updatedAt: new Date(),
                },
            });
            logger.info('User activated successfully', { userId: id });
            return user;
        }
        catch (error) {
            logger.error('Failed to activate user', { error, userId: id });
            throw error;
        }
    }
    async getAllUsers(page = 1, limit = 10, role) {
        try {
            const skip = (page - 1) * limit;
            const where = {};
            if (role) {
                where.role = role;
            }
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                        lastLoginAt: true,
                    },
                }),
                prisma.user.count({ where }),
            ]);
            return {
                users,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            logger.error('Failed to get all users', { error });
            throw error;
        }
    }
    async deleteUser(id) {
        try {
            await prisma.user.delete({
                where: { id },
            });
            logger.info('User deleted successfully', { userId: id });
        }
        catch (error) {
            logger.error('Failed to delete user', { error, userId: id });
            throw error;
        }
    }
    async getUserStats() {
        try {
            const [totalUsers, activeUsers, inactiveUsers, usersByRole] = await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { status: 'ACTIVE' } }),
                prisma.user.count({ where: { status: 'INACTIVE' } }),
                prisma.user.groupBy({
                    by: ['role'],
                    _count: { role: true },
                }),
            ]);
            const roleStats = {};
            usersByRole.forEach((stat) => {
                roleStats[stat.role] = stat._count.role;
            });
            return {
                totalUsers,
                activeUsers,
                inactiveUsers,
                usersByRole: roleStats,
            };
        }
        catch (error) {
            logger.error('Failed to get user statistics', { error });
            throw error;
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map