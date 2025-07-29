import { logger } from '@ultramarket/shared';
import { UserService } from './userService';
import { TokenService } from './tokenService';

export class AuthService {
  private userService: UserService;
  private tokenService: TokenService;

  constructor() {
    this.userService = new UserService();
    this.tokenService = new TokenService();
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  } | null> {
    try {
      // Find user by email
      const user = await this.userService.findByEmail(email);
      if (!user) {
        logger.warn('Authentication failed: User not found', { email });
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn('Authentication failed: User account deactivated', { userId: user.id });
        return null;
      }

      // Verify password
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn('Authentication failed: Invalid password', { userId: user.id });
        return null;
      }

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(user);
      const refreshToken = this.tokenService.generateRefreshToken(user);

      // Save refresh token
      await this.tokenService.saveRefreshToken(user.id, refreshToken);

      // Update last login
      await this.userService.updateLastLogin(user.id);

      logger.info('User authenticated successfully', { userId: user.id, email });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Authentication failed', { error, email });
      throw error;
    }
  }

  /**
   * Register new user
   */
  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Check if user already exists
      const existingUser = await this.userService.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await this.userService.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(user);
      const refreshToken = this.tokenService.generateRefreshToken(user);

      // Save refresh token
      await this.tokenService.saveRefreshToken(user.id, refreshToken);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('User registration failed', { error, email: userData.email });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    try {
      // Verify refresh token
      const decoded = this.tokenService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        logger.warn('Token refresh failed: Invalid refresh token');
        return null;
      }

      // Check if refresh token exists in database
      const storedToken = await this.tokenService.findRefreshToken(refreshToken);
      if (!storedToken) {
        logger.warn('Token refresh failed: Refresh token not found in database');
        return null;
      }

      // Get user
      const user = await this.userService.findById(decoded.userId);
      if (!user || !user.isActive) {
        logger.warn('Token refresh failed: User not found or inactive', { userId: decoded.userId });
        return null;
      }

      // Generate new tokens
      const newAccessToken = this.tokenService.generateAccessToken(user);
      const newRefreshToken = this.tokenService.generateRefreshToken(user);

      // Update refresh token
      await this.tokenService.updateRefreshToken(refreshToken, newRefreshToken);

      logger.info('Token refreshed successfully', { userId: user.id });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logoutUser(refreshToken: string): Promise<void> {
    try {
      if (refreshToken) {
        await this.tokenService.invalidateRefreshToken(refreshToken);
      }

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', { error });
      throw error;
    }
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: string): any {
    try {
      return this.tokenService.verifyAccessToken(token);
    } catch (error) {
      logger.error('Access token validation failed', { error });
      return null;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get user profile failed', { error, userId });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    }
  ): Promise<any> {
    try {
      const updatedUser = await this.userService.updateUser(userId, updateData);
      logger.info('User profile updated successfully', { userId });
      return updatedUser;
    } catch (error) {
      logger.error('Update user profile failed', { error, userId });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const bcrypt = require('bcryptjs');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await this.userService.updatePassword(userId, hashedNewPassword);

      // Invalidate all refresh tokens
      await this.tokenService.invalidateAllUserTokens(userId);

      logger.info('Password changed successfully', { userId });
    } catch (error) {
      logger.error('Change password failed', { error, userId });
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<any> {
    try {
      const user = await this.userService.deactivateUser(userId);

      // Invalidate all refresh tokens
      await this.tokenService.invalidateAllUserTokens(userId);

      logger.info('User account deactivated', { userId });
      return user;
    } catch (error) {
      logger.error('Deactivate user failed', { error, userId });
      throw error;
    }
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<any> {
    try {
      const user = await this.userService.activateUser(userId);
      logger.info('User account activated', { userId });
      return user;
    } catch (error) {
      logger.error('Activate user failed', { error, userId });
      throw error;
    }
  }

  /**
   * Get authentication statistics
   */
  async getAuthStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    tokenStats: any;
  }> {
    try {
      const [userStats, tokenStats] = await Promise.all([
        this.userService.getUserStats(),
        this.tokenService.getTokenStats(),
      ]);

      return {
        ...userStats,
        tokenStats,
      };
    } catch (error) {
      logger.error('Get auth statistics failed', { error });
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const count = await this.tokenService.cleanupExpiredTokens();
      logger.info('Expired tokens cleaned up', { count });
      return count;
    } catch (error) {
      logger.error('Cleanup expired tokens failed', { error });
      throw error;
    }
  }
}
