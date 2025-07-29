import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class UserController {
  /**
   * Create a new user
   */
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;

    const user = await userService.createUser(userData);
    const userResponse = userService.transformUserWithAddresses(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get users with pagination and filtering (admin only)
   */
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const options = req.query;

    const result = await userService.getUsers(options);

    // Transform users to exclude sensitive data
    const transformedUsers = result.users.map((user) =>
      userService.transformUserWithAddresses(user)
    );

    res.json({
      success: true,
      data: {
        ...result,
        users: transformedUsers,
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get current user profile
   */
  getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    const user = await userService.getUserById(userId);
    const userResponse = userService.transformUserWithAddresses(user);

    res.json({
      success: true,
      data: userResponse,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Update current user profile
   */
  updateCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const updateData = req.body;

    const user = await userService.updateUser(userId, updateData);
    const userResponse = userService.transformUserWithAddresses(user);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Change current user password
   */
  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    await userService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Update current user email
   */
  updateEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { email, password } = req.body;

    const user = await userService.updateEmail(userId, email, password);
    const userResponse = userService.transformUserWithAddresses(user);

    res.json({
      success: true,
      message: 'Email updated successfully. Please verify your new email.',
      data: userResponse,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Delete current user account
   */
  deleteCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    await userService.deleteUser(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get user statistics (admin only)
   */
  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await userService.getUserStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get user by ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await userService.getUserById(userId);
    const userResponse = userService.transformUserWithAddresses(user);

    res.json({
      success: true,
      data: userResponse,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Update user by ID (admin only)
   */
  updateUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const updateData = req.body;

    const user = await userService.adminUpdateUser(userId, updateData);
    const userResponse = userService.transformUserWithAddresses(user);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Delete user by ID (admin only)
   */
  deleteUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    await userService.deleteUser(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    });
  });
}

export const userController = new UserController();
