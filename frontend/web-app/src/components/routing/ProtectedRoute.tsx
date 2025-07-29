/**
 * Protected Route Component
 * Handles authentication and authorization for protected routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
  requireEmailVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/login',
  requireEmailVerification = false
}) => {
  const { isAuthenticated, isLoading, user, hasAnyRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // Check email verification requirement
  if (requireEmailVerification && !user?.isEmailVerified) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // Render protected content
  return <>{children}</>;
};

/**
 * Admin Route - Requires admin role
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Vendor Route - Requires vendor role
 */
export const VendorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requiredRoles={['vendor', 'admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * Public Route - Redirects authenticated users away from auth pages
 */
export const PublicRoute: React.FC<{ 
  children: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo = '/' }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}; 