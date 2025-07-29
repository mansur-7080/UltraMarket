"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("../types/auth");
const prisma = new client_1.PrismaClient();
const transformUser = (user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    profileImage: user.profileImage,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
});
class UserRepository {
    async create(userData) {
        try {
            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    username: userData.username,
                    passwordHash: userData.passwordHash,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phoneNumber: userData.phoneNumber || null,
                    role: userData.role || auth_1.UserRole.CUSTOMER,
                    isActive: userData.isActive ?? true,
                    isEmailVerified: userData.isEmailVerified ?? false,
                    profileImage: userData.profileImage || null,
                    bio: userData.bio || null,
                },
                include: {
                    addresses: true,
                },
            });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findById(id) {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    addresses: true,
                },
            });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findByEmail(email) {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    addresses: true,
                },
            });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findByUsername(username) {
        try {
            const user = await prisma.user.findUnique({
                where: { username },
                include: {
                    addresses: true,
                },
            });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to find user by username: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async update(id, data) {
        try {
            const updateData = {};
            if (data.email !== undefined)
                updateData.email = data.email;
            if (data.username !== undefined)
                updateData.username = data.username;
            if (data.passwordHash !== undefined)
                updateData.passwordHash = data.passwordHash;
            if (data.firstName !== undefined)
                updateData.firstName = data.firstName;
            if (data.lastName !== undefined)
                updateData.lastName = data.lastName;
            if (data.phoneNumber !== undefined)
                updateData.phoneNumber = data.phoneNumber;
            if (data.role !== undefined)
                updateData.role = data.role;
            if (data.isActive !== undefined)
                updateData.isActive = data.isActive;
            if (data.isEmailVerified !== undefined)
                updateData.isEmailVerified = data.isEmailVerified;
            if (data.profileImage !== undefined)
                updateData.profileImage = data.profileImage;
            if (data.bio !== undefined)
                updateData.bio = data.bio;
            if (data.lastLoginAt !== undefined)
                updateData.lastLoginAt = data.lastLoginAt;
            const user = await prisma.user.update({
                where: { id },
                data: updateData,
                include: {
                    addresses: true,
                },
            });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async delete(id) {
        try {
            await prisma.user.delete({
                where: { id },
            });
        }
        catch (error) {
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findMany(options) {
        try {
            const { page = 1, limit = 10, search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc', } = options;
            const skip = (page - 1) * limit;
            const where = {};
            if (search) {
                where['OR'] = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (role)
                where['role'] = role;
            if (isActive !== undefined)
                where['isActive'] = isActive;
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                    include: {
                        addresses: true,
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
            throw new Error(`Failed to find users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async count(filters) {
        try {
            const where = {};
            if (filters?.isActive !== undefined)
                where['isActive'] = filters.isActive;
            if (filters?.role)
                where['role'] = filters.role;
            return await prisma.user.count({ where });
        }
        catch (error) {
            throw new Error(`Failed to count users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findByEmailOrUsername(emailOrUsername) {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
                },
                include: {
                    addresses: true,
                },
            });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to find user by email or username: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=userRepository.js.map