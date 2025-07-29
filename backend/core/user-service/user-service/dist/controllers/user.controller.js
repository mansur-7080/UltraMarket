"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const error_middleware_1 = require("../middleware/error.middleware");
class UserController {
    createUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userData = req.body;
        const user = await user_service_1.userService.createUser(userData);
        const userResponse = user_service_1.userService.transformUserWithAddresses(user);
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse,
            timestamp: new Date().toISOString(),
        });
    });
    getUsers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const options = req.query;
        const result = await user_service_1.userService.getUsers(options);
        const transformedUsers = result.users.map((user) => user_service_1.userService.transformUserWithAddresses(user));
        res.json({
            success: true,
            data: {
                ...result,
                users: transformedUsers,
            },
            timestamp: new Date().toISOString(),
        });
    });
    getCurrentUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user.userId;
        const user = await user_service_1.userService.getUserById(userId);
        const userResponse = user_service_1.userService.transformUserWithAddresses(user);
        res.json({
            success: true,
            data: userResponse,
            timestamp: new Date().toISOString(),
        });
    });
    updateCurrentUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user.userId;
        const updateData = req.body;
        const user = await user_service_1.userService.updateUser(userId, updateData);
        const userResponse = user_service_1.userService.transformUserWithAddresses(user);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: userResponse,
            timestamp: new Date().toISOString(),
        });
    });
    changePassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        await user_service_1.userService.changePassword(userId, currentPassword, newPassword);
        res.json({
            success: true,
            message: 'Password changed successfully',
            timestamp: new Date().toISOString(),
        });
    });
    updateEmail = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user.userId;
        const { email, password } = req.body;
        const user = await user_service_1.userService.updateEmail(userId, email, password);
        const userResponse = user_service_1.userService.transformUserWithAddresses(user);
        res.json({
            success: true,
            message: 'Email updated successfully. Please verify your new email.',
            data: userResponse,
            timestamp: new Date().toISOString(),
        });
    });
    deleteCurrentUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user.userId;
        await user_service_1.userService.deleteUser(userId);
        res.json({
            success: true,
            message: 'Account deleted successfully',
            timestamp: new Date().toISOString(),
        });
    });
    getUserStats = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const stats = await user_service_1.userService.getUserStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });
    });
    getUserById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId } = req.params;
        const user = await user_service_1.userService.getUserById(userId);
        const userResponse = user_service_1.userService.transformUserWithAddresses(user);
        res.json({
            success: true,
            data: userResponse,
            timestamp: new Date().toISOString(),
        });
    });
    updateUserById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId } = req.params;
        const updateData = req.body;
        const user = await user_service_1.userService.adminUpdateUser(userId, updateData);
        const userResponse = user_service_1.userService.transformUserWithAddresses(user);
        res.json({
            success: true,
            message: 'User updated successfully',
            data: userResponse,
            timestamp: new Date().toISOString(),
        });
    });
    deleteUserById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId } = req.params;
        await user_service_1.userService.deleteUser(userId);
        res.json({
            success: true,
            message: 'User deleted successfully',
            timestamp: new Date().toISOString(),
        });
    });
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=user.controller.js.map