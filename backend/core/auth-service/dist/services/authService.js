"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
class AuthService {
    userService;
    constructor() {
        logger.debug('Auth Service initialized');
        this.userService = {
            getUserByEmail: async (email) => {
                return await prisma.user.findUnique({
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
            },
            getUserById: async (id) => {
                return await prisma.user.findUnique({
                    where: { id },
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
            },
            createUser: async (data) => {
                const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
                return await prisma.user.create({
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
            },
            updateLastLogin: async (userId) => {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        lastLoginAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            },
            changePassword: async (userId, newPassword) => {
                const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        password: hashedPassword,
                        updatedAt: new Date(),
                    },
                });
            },
            verifyEmail: async (userId) => {
                return await prisma.user.update({
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
            },
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map