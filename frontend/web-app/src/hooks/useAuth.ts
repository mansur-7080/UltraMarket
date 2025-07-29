/**
 * Authentication Hook
 * Manages user authentication state and token handling
 */

import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { RootState } from '../store';
import { login, register, logout, getCurrentUser, clearError } from '../store/slices/authSlice';
import { AuthService } from '../services/authService';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  avatar?: string;
  isEmailVerified?: boolean;
  preferences?: Record<string, any>;
}

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error, token } = useSelector((state: RootState) => state.auth);

  /**
   * Check if user is authenticated and token is valid
   */
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      // Verify token with backend
      const result = await dispatch(getCurrentUser()).unwrap();
      if (result) {
        return true;
      } else {
        // Invalid token
        localStorage.removeItem('token');
        dispatch(logout());
        return false;
      }
    } catch (error) {
      console.error('Auth check failed', error);
      localStorage.removeItem('token');
      dispatch(logout());
      return false;
    }
  }, [dispatch]);

  /**
   * Login user with email and password
   */
  const loginUser = useCallback(async (email: string, password: string) => {
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      console.log('User logged in successfully', { userId: result.user.id });
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Login failed', error);
      return { 
        success: false, 
        error: error || 'Login failed' 
      };
    }
  }, [dispatch]);

  /**
   * Register new user
   */
  const registerUser = useCallback(async (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      const result = await dispatch(register(userData)).unwrap();
      console.log('User registered successfully', { userId: result.user.id });
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Registration failed', error);
      return { 
        success: false, 
        error: error || 'Registration failed' 
      };
    }
  }, [dispatch]);

  /**
   * Logout user
   */
  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap();
      console.log('User logged out');
    } catch (error) {
      console.warn('Logout failed', error);
    }
  }, [dispatch]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      await dispatch(getCurrentUser()).unwrap();
    } catch (error) {
      console.error('Failed to refresh user data', error);
    }
  }, [dispatch]);

  /**
   * Clear authentication errors
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles: string[]) => {
    return user?.role ? roles.includes(user.role) : false;
  }, [user]);

  /**
   * Initialize auth on app start
   */
  useEffect(() => {
    if (token && !user) {
      checkAuth();
    }
  }, [checkAuth, token, user]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    token,

    // Actions
    login: loginUser,
    register: registerUser,
    logout: handleLogout,
    checkAuth,
    refreshUser,
    clearError: clearAuthError,

    // Utilities
    hasRole,
    hasAnyRole
  };
};
