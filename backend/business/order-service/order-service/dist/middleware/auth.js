"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateToken = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var errors_1 = require("../utils/errors");
var authenticateToken = function (req, res, next) {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next(new errors_1.UnauthorizedError('Access token is required'));
    }
    try {
        var secret = process.env.JWT_SECRET || 'default_secret_key_for_development';
        var decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new errors_1.UnauthorizedError('Token has expired'));
        }
        return next(new errors_1.UnauthorizedError('Invalid token'));
    }
};
exports.authenticateToken = authenticateToken;
var authorizeRoles = function () {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return function (req, res, next) {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError('User not authenticated'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError("Role ".concat(req.user.role, " is not authorized to access this resource")));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
