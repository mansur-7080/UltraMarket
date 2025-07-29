/**
 * 🛡️ ULTRA PROFESSIONAL ADMIN ROLE GUARD
 * UltraMarket Admin Panel Security
 * 
 * Professional role-based access control with:
 * - Multi-level permission system
 * - Resource-based access control
 * - Session validation and monitoring
 * - Audit logging for security
 * - Real-time permission updates
 * 
 * @author UltraMarket Security Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ExclamationCircleOutlined, ShieldOutlined } from '@ant-design/icons';

// Professional TypeScript interfaces
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: Permission[];
  department: string;
  lastLoginAt: Date;
  sessionId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  securityLevel: 'standard' | 'elevated' | 'restricted';
}

export interface AdminRole {
  id: string;
  name: string;
  level: number; // 1-10, higher is more privileged
  permissions: Permission[];
  resourceAccess: ResourceAccess[];
  description: string;
  isSystemRole: boolean;
  maxSessionDuration: number; // in minutes
  requireMFA: boolean;
  allowedIPRanges?: string[];
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve';
  conditions?: PermissionCondition[];
  expiresAt?: Date;
}

export interface ResourceAccess {
  resource: string;
  level: 'none' | 'read' | 'write' | 'admin' | 'owner';
  conditions?: string[];
  restrictions?: {
    timeWindow?: { start: string; end: string };
    maxRecords?: number;
    allowedFields?: string[];
    requireApproval?: boolean;
  };
}

export interface PermissionCondition {
  type: 'user_owns' | 'department_match' | 'time_window' | 'ip_range' | 'approval_required';
  value: any;
}

export interface SecurityContext {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  sessionValid: boolean;
  loginWithCredentials: (email: string, password: string, mfaToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkPermission: (resource: string, action: string, context?: any) => boolean;
  hasRole: (roleName: string) => boolean;
  hasMinimumRole: (level: number) => boolean;
  auditAction: (action: string, resource: string, details?: any) => void;
}

// Built-in admin roles
export const ADMIN_ROLES = {
  SUPER_ADMIN: { name: 'super_admin', level: 10 },
  ADMIN: { name: 'admin', level: 8 },
  MANAGER: { name: 'manager', level: 6 },
  MODERATOR: { name: 'moderator', level: 4 },
  ANALYST: { name: 'analyst', level: 2 },
  VIEWER: { name: 'viewer', level: 1 }
} as const;

// Resource definitions
export const ADMIN_RESOURCES = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  SECURITY: 'security',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM: 'system',
  REPORTS: 'reports'
} as const;

// Security context
const AdminSecurityContext = createContext<SecurityContext | null>(null);

/**
 * Ultra Professional Admin Security Provider
 */
export const AdminSecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    initializeSession();
    
    // Session validation interval
    const sessionCheckInterval = setInterval(validateSession, 60000); // Every minute
    
    // Security monitoring
    const securityMonitorInterval = setInterval(performSecurityChecks, 300000); // Every 5 minutes
    
    return () => {
      clearInterval(sessionCheckInterval);
      clearInterval(securityMonitorInterval);
    };
  }, []);

  /**
   * Initialize session from storage or API
   */
  const initializeSession = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('admin_token');
      const sessionId = sessionStorage.getItem('admin_session_id');
      
      if (!token || !sessionId) {
        setIsLoading(false);
        return;
      }

      // Validate token and get user info
      const response = await fetch('/api/admin/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Session-ID': sessionId
        }
      });

      if (!response.ok) {
        throw new Error('Session validation failed');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        setPermissions(data.permissions || []);
        setIsAuthenticated(true);
        setSessionValid(true);
        
        // Audit successful session restoration
        auditAction('session_restored', 'auth', {
          userId: data.user.id,
          sessionId: data.user.sessionId
        });
      } else {
        throw new Error('Invalid session data');
      }

    } catch (error) {
      console.error('Session initialization failed:', error);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with credentials and MFA
   */
  const loginWithCredentials = async (
    email: string, 
    password: string, 
    mfaToken?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          mfaToken,
          userAgent: navigator.userAgent,
          ipAddress: await getClientIP(),
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Audit failed login attempt
        auditAction('login_failed', 'auth', {
          email,
          reason: data.error || 'Invalid credentials',
          ipAddress: await getClientIP()
        });
        return false;
      }

      if (data.requireMFA && !mfaToken) {
        // MFA required but not provided
        return false;
      }

      // Successful login
      setUser(data.user);
      setPermissions(data.permissions || []);
      setIsAuthenticated(true);
      setSessionValid(true);

      // Store secure tokens
      localStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_session_id', data.sessionId);
      sessionStorage.setItem('admin_refresh_token', data.refreshToken);

      // Audit successful login
      auditAction('login_success', 'auth', {
        userId: data.user.id,
        sessionId: data.sessionId,
        securityLevel: data.user.securityLevel
      });

      return true;

    } catch (error) {
      console.error('Login failed:', error);
      auditAction('login_error', 'auth', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout and cleanup
   */
  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('admin_token');
      const sessionId = sessionStorage.getItem('admin_session_id');

      if (token && sessionId) {
        // Notify server of logout
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Session-ID': sessionId
          }
        }).catch(() => {
          // Ignore network errors during logout
        });

        // Audit logout
        auditAction('logout', 'auth', {
          userId: user?.id,
          sessionId
        });
      }

      clearSession();

    } catch (error) {
      console.error('Logout error:', error);
      clearSession();
    }
  };

  /**
   * Refresh session token
   */
  const refreshSession = async (): Promise<boolean> => {
    try {
      const refreshToken = sessionStorage.getItem('admin_refresh_token');
      const sessionId = sessionStorage.getItem('admin_session_id');

      if (!refreshToken || !sessionId) {
        return false;
      }

      const response = await fetch('/api/admin/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
          sessionId
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      // Update tokens
      localStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_refresh_token', data.refreshToken);

      setSessionValid(true);
      return true;

    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  };

  /**
   * Validate current session
   */
  const validateSession = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('admin_token');
      const sessionId = sessionStorage.getItem('admin_session_id');

      if (!token || !sessionId || !user) {
        return;
      }

      const response = await fetch('/api/admin/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-ID': sessionId
        }
      });

      if (!response.ok) {
        // Session invalid, try to refresh
        const refreshSuccess = await refreshSession();
        
        if (!refreshSuccess) {
          setSessionValid(false);
          auditAction('session_expired', 'auth', {
            userId: user.id,
            sessionId
          });
        }
      } else {
        setSessionValid(true);
      }

    } catch (error) {
      console.error('Session validation error:', error);
      setSessionValid(false);
    }
  };

  /**
   * Perform security checks
   */
  const performSecurityChecks = async (): Promise<void> => {
    if (!user || !isAuthenticated) return;

    try {
      // Check for security updates
      const response = await fetch('/api/admin/security/check', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'X-Session-ID': sessionStorage.getItem('admin_session_id') || ''
        }
      });

      if (response.ok) {
        const securityData = await response.json();
        
        // Handle security alerts
        if (securityData.alerts && securityData.alerts.length > 0) {
          handleSecurityAlerts(securityData.alerts);
        }

        // Update permissions if changed
        if (securityData.permissions) {
          setPermissions(securityData.permissions);
        }
      }

    } catch (error) {
      console.error('Security check failed:', error);
    }
  };

  /**
   * Handle security alerts
   */
  const handleSecurityAlerts = (alerts: any[]): void => {
    for (const alert of alerts) {
      if (alert.severity === 'critical') {
        // Force logout for critical security issues
        logout();
        break;
      }
    }
  };

  /**
   * Check specific permission
   */
  const checkPermission = (resource: string, action: string, context?: any): boolean => {
    if (!user || !isAuthenticated || !sessionValid) {
      return false;
    }

    // Super admin has all permissions
    if (user.role.name === ADMIN_ROLES.SUPER_ADMIN.name) {
      return true;
    }

    // Check user's direct permissions
    const permission = permissions.find(p => 
      p.resource === resource && p.action === action
    );

    if (!permission) {
      return false;
    }

    // Check permission conditions
    if (permission.conditions) {
      return evaluatePermissionConditions(permission.conditions, context);
    }

    // Check permission expiry
    if (permission.expiresAt && new Date() > permission.expiresAt) {
      return false;
    }

    return true;
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (roleName: string): boolean => {
    return user?.role.name === roleName;
  };

  /**
   * Check if user has minimum role level
   */
  const hasMinimumRole = (level: number): boolean => {
    return (user?.role.level || 0) >= level;
  };

  /**
   * Audit user action
   */
  const auditAction = (action: string, resource: string, details?: any): void => {
    try {
      const auditData = {
        action,
        resource,
        userId: user?.id || 'anonymous',
        sessionId: sessionStorage.getItem('admin_session_id'),
        timestamp: new Date().toISOString(),
        ipAddress: getClientIP(),
        userAgent: navigator.userAgent,
        details: details || {}
      };

      // Send to audit service
      fetch('/api/admin/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(auditData)
      }).catch(error => {
        console.error('Audit logging failed:', error);
      });

      // Log locally for development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Admin Audit:', auditData);
      }

    } catch (error) {
      console.error('Audit action failed:', error);
    }
  };

  /**
   * Clear session data
   */
  const clearSession = (): void => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_session_id');
    sessionStorage.removeItem('admin_refresh_token');
    
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
    setSessionValid(false);
  };

  /**
   * Evaluate permission conditions
   */
  const evaluatePermissionConditions = (conditions: PermissionCondition[], context?: any): boolean => {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'user_owns':
          return context?.userId === user?.id;
        
        case 'department_match':
          return user?.department === condition.value;
        
        case 'time_window':
          const now = new Date();
          const startTime = new Date(condition.value.start);
          const endTime = new Date(condition.value.end);
          return now >= startTime && now <= endTime;
        
        case 'ip_range':
          // This would need server-side validation
          return true;
        
        case 'approval_required':
          return context?.approved === true;
        
        default:
          return false;
      }
    });
  };

  /**
   * Get client IP address
   */
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('/api/admin/client-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const securityContext: SecurityContext = {
    user,
    isAuthenticated,
    isLoading,
    permissions,
    sessionValid,
    loginWithCredentials,
    logout,
    refreshSession,
    checkPermission,
    hasRole,
    hasMinimumRole,
    auditAction
  };

  return (
    <AdminSecurityContext.Provider value={securityContext}>
      {children}
    </AdminSecurityContext.Provider>
  );
};

/**
 * Hook to use admin security context
 */
export const useAdminSecurity = (): SecurityContext => {
  const context = useContext(AdminSecurityContext);
  if (!context) {
    throw new Error('useAdminSecurity must be used within AdminSecurityProvider');
  }
  return context;
};

/**
 * Role-based route guard component
 */
interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: string;
  requiredLevel?: number;
  resource?: string;
  action?: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const AdminRoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredLevel,
  resource,
  action,
  fallback,
  redirectTo = '/admin/unauthorized'
}) => {
  const { user, isAuthenticated, isLoading, checkPermission, hasRole, hasMinimumRole, auditAction } = useAdminSecurity();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    auditAction('access_denied', 'role_guard', {
      requiredRole,
      userRole: user.role.name,
      resource: location.pathname
    });
    
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Check level requirement
  if (requiredLevel && !hasMinimumRole(requiredLevel)) {
    auditAction('access_denied', 'level_guard', {
      requiredLevel,
      userLevel: user.role.level,
      resource: location.pathname
    });
    
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Check permission requirement
  if (resource && action && !checkPermission(resource, action)) {
    auditAction('access_denied', 'permission_guard', {
      requiredPermission: `${resource}:${action}`,
      resource: location.pathname
    });
    
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Audit successful access
  auditAction('access_granted', 'role_guard', {
    resource: location.pathname,
    userRole: user.role.name,
    userLevel: user.role.level
  });

  return <>{children}</>;
};

/**
 * Permission-based component guard
 */
interface PermissionGuardProps {
  children: ReactNode;
  resource: string;
  action: string;
  context?: any;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const AdminPermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  context,
  fallback,
  showFallback = true
}) => {
  const { checkPermission, auditAction } = useAdminSecurity();

  const hasPermission = checkPermission(resource, action, context);

  if (!hasPermission) {
    auditAction('permission_denied', resource, {
      action,
      context
    });

    if (!showFallback) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ShieldOutlined className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Ruxsat yo'q
            </h3>
            <p className="mt-1 text-sm text-red-700">
              Sizda bu amalni bajarish uchun ruxsat mavjud emas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Unauthorized access component
 */
export const AdminUnauthorized: React.FC = () => {
  const { user, logout } = useAdminSecurity();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ExclamationCircleOutlined className="h-12 w-12 text-red-500 mr-4" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ruxsat rad etildi</h1>
            <p className="text-gray-600">Sizda bu sahifaga kirish huquqi yo'q</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <p className="text-sm text-gray-700">
            <strong>Foydalanuvchi:</strong> {user?.email}<br />
            <strong>Rol:</strong> {user?.role.name}<br />
            <strong>Darajasi:</strong> {user?.role.level}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Orqaga qaytish
          </button>
          
          <button
            onClick={() => window.location.href = '/admin/dashboard'}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Dashboard
          </button>
          
          <button
            onClick={logout}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRoleGuard; 