"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.createSession = exports.generateOTP = exports.generateRandomToken = exports.isSeller = exports.isAdmin = exports.hasRole = exports.extractTokenFromHeader = exports.verifyToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateToken = exports.generateTokens = exports.comparePassword = exports.hashPassword = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
const types_1 = require("./types");
const errors_1 = require("./errors");
const constants_1 = require("./constants");
const uuid_1 = require("uuid");
// Password hashing
const hashPassword = async (password) => {
    const saltRounds = 10;
    return bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    return bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
// JWT token generation
const generateTokens = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env['JWT_SECRET'], {
        expiresIn: constants_1.JWT_EXPIRY.ACCESS_TOKEN,
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, process.env['JWT_REFRESH_SECRET'], {
        expiresIn: constants_1.JWT_EXPIRY.REFRESH_TOKEN,
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const generateToken = (payload, secret, expiresIn) => {
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
exports.generateToken = generateToken;
// JWT token verification
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
    }
    catch (error) {
        throw new errors_1.UnauthorizedError('Invalid or expired access token');
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, process.env['JWT_REFRESH_SECRET']);
    }
    catch (error) {
        throw new errors_1.UnauthorizedError('Invalid or expired refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const verifyToken = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        throw new errors_1.UnauthorizedError('Invalid or expired token');
    }
};
exports.verifyToken = verifyToken;
// Token extraction from headers
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errors_1.UnauthorizedError('No token provided');
    }
    return authHeader.substring(7);
};
exports.extractTokenFromHeader = extractTokenFromHeader;
// Permission checking
const hasRole = (userRole, requiredRoles) => {
    return requiredRoles.includes(userRole);
};
exports.hasRole = hasRole;
const isAdmin = (userRole) => {
    return userRole === types_1.UserRole.ADMIN || userRole === types_1.UserRole.SUPER_ADMIN;
};
exports.isAdmin = isAdmin;
const isSeller = (userRole) => {
    return userRole === types_1.UserRole.SELLER || (0, exports.isAdmin)(userRole);
};
exports.isSeller = isSeller;
// Generate random tokens
const generateRandomToken = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
};
exports.generateRandomToken = generateRandomToken;
const generateOTP = (length = 6) => {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
};
exports.generateOTP = generateOTP;
const createSession = async (userId, deviceInfo, ipAddress) => {
    const sessionId = (0, uuid_1.v4)();
    const now = new Date();
    const session = {
        sessionId,
        userId,
        deviceInfo,
        ipAddress,
        createdAt: now,
        lastActivity: now,
        isActive: true,
    };
    // In a real implementation, you would store this in Redis or database
    // For now, we'll return the session data
    return session;
};
exports.createSession = createSession;
// Cache utility (Redis-like interface)
exports.cache = {
    async setex(key, ttl, value) {
        // In a real implementation, this would use Redis
        // For now, we'll use a simple in-memory store
        const expiry = Date.now() + ttl * 1000;
        exports.cache._store = exports.cache._store || new Map();
        exports.cache._store.set(key, { value, expiry });
    },
    async get(key) {
        const store = exports.cache._store;
        if (!store)
            return null;
        const item = store.get(key);
        if (!item || Date.now() > item.expiry) {
            store.delete(key);
            return null;
        }
        return item.value;
    },
    async del(key) {
        const store = exports.cache._store;
        if (store) {
            store.delete(key);
        }
    },
    async srem(key, value) {
        // Simple set removal - in real implementation would use Redis SET
        const store = exports.cache._store;
        if (store) {
            const item = store.get(key);
            if (item && Array.isArray(item.value)) {
                item.value = item.value.filter((v) => v !== value);
                store.set(key, item);
            }
        }
    },
    async getJson(key) {
        const value = await this.get(key);
        return value ? JSON.parse(value) : null;
    },
    async setJson(key, value, ttl = 3600) {
        await this.setex(key, ttl, JSON.stringify(value));
    },
};
//# sourceMappingURL=auth.js.map