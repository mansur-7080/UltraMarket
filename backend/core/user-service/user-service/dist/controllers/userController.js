"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const userService = __importStar(require("../services/userService"));
const shared_1 = require("@ultramarket/shared");
class UserController {
    async register(req, res, next) {
        try {
            const { email, password, firstName, lastName, phoneNumber } = req.body;
            const result = await userService.registerUser({
                email,
                password,
                firstName,
                lastName,
                phoneNumber,
            });
            res.status(shared_1.HTTP_STATUS.CREATED).json({
                success: true,
                message: 'User registered successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await userService.loginUser(email, password);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const user = await userService.getUserById(userId);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const updateData = req.body;
            const updatedUser = await userService.updateUser(userId, updateData);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteAccount(req, res, next) {
        try {
            const userId = req.user.userId;
            await userService.deleteUser(userId);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Account deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await userService.refreshToken(refreshToken);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Token refreshed successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const userId = req.user.userId;
            await userService.logoutUser(userId);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Logout successful',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const { token } = req.params;
            await userService.verifyEmail(token);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Email verified successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            await userService.forgotPassword(email);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Password reset instructions sent to email',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            await userService.resetPassword(token, password);
            res.status(shared_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Password reset successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=userController.js.map