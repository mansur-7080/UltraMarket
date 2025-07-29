/**
 * UltraMarket E-Commerce Platform
 * Authentication Service - TypeScript
 * Professional Auth Management
 */

import { api } from './apiClient';
import {
  ApiResponse,
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './types';

export class AuthService {
  /**
   * User Login
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login', credentials);
    return response;
  }

  /**
   * User Registration
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/auth/register', userData);
    return response;
  }

  /**
   * User Logout
   */
  async logout(): Promise<ApiResponse> {
    const response = await api.post('/auth/logout');
    return response;
  }

  /**
   * Refresh Access Token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ tokens: AuthTokens }>> {
    const response = await api.post<{ tokens: AuthTokens }>('/auth/refresh', { refreshToken });
    return response;
  }

  /**
   * Forgot Password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    const response = await api.post('/auth/forgot-password', data);
    return response;
  }

  /**
   * Reset Password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    const response = await api.post('/auth/reset-password', data);
    return response;
  }

  /**
   * Verify Email
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    const response = await api.post('/auth/verify-email', { token });
    return response;
  }

  /**
   * Resend Email Verification
   */
  async resendEmailVerification(): Promise<ApiResponse> {
    const response = await api.post('/auth/resend-verification');
    return response;
  }

  /**
   * Change Password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response;
  }

  /**
   * Enable Two-Factor Authentication
   */
  async enableTwoFactor(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    const response = await api.post<{ qrCode: string; secret: string }>('/auth/2fa/enable');
    return response;
  }

  /**
   * Verify Two-Factor Authentication
   */
  async verifyTwoFactor(token: string): Promise<ApiResponse> {
    const response = await api.post('/auth/2fa/verify', { token });
    return response;
  }

  /**
   * Disable Two-Factor Authentication
   */
  async disableTwoFactor(token: string): Promise<ApiResponse> {
    const response = await api.post('/auth/2fa/disable', { token });
    return response;
  }

  /**
   * Get Current User
   */
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response;
  }

  /**
   * Social Login (Google, Facebook, etc.)
   */
  async socialLogin(provider: string, token: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await api.post<{ user: User; tokens: AuthTokens }>(`/auth/social/${provider}`, { token });
    return response;
  }

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(): Promise<ApiResponse<{ permissions: string[] }>> {
    const response = await api.get<{ permissions: string[] }>('/auth/permissions');
    return response;
  }
} 