"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = exports.generateRandomToken = exports.isSeller = exports.isAdmin = exports.hasRole = exports.extractTokenFromHeader = exports.verifyToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = exports.comparePassword = exports.hashPassword = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
const types_1 = require("./types");
const errors_1 = require("./errors");
const constants_1 = require("./constants");
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
//# sourceMappingURL=auth.js.map