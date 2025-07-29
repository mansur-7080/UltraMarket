/**
 * 🔐 ULTRA ADMIN RBAC MANAGER
 * UltraMarket Admin Panel Security
 * 
 * SOLVES: Admin panel security vulnerabilities and permission management
 * 
 * Key Security Features:
 * - Granular role-based access control (RBAC)
 * - Session management with MFA for admins
 * - Activity monitoring and audit logging
 * - IP whitelist and geolocation restrictions
 * - Professional security compliance
 * - Real-time permission validation
 * - TypeScript strict mode compatibility
 * 
 * @author UltraMarket Admin Security Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import { EventEmitter } from 'events';

// Admin RBAC interfaces
export interface AdminRole {
  id: string;
  name: string;
  description: string;
  level: number; // 1=Viewer, 2=Editor, 3=Admin, 4=SuperAdmin, 5=Owner
  permissions: AdminPermission[];
  restrictions: AdminRestriction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminPermission {
  resource: AdminResource;
  actions: AdminAction[];
  conditions?: PermissionCondition[];
}

export interface AdminRestriction {
  type: 'ip_whitelist' | 'time_based' | 'location_based' | 'device_limit';
  config: Record<string, any>;
  isActive: boolean;
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export type AdminResource = 
  | 'users' | 'products' | 'orders' | 'analytics' | 'settings' 
  | 'reports' | 'audit_logs' | 'admin_users' | 'system' | 'billing'
  | 'inventory' | 'marketing' | 'content' | 'support' | 'api_keys';

export type AdminAction = 
  | 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'reject'
  | 'export' | 'import' | 'bulk_edit' | 'advanced_search'
  | 'system_config' | 'user_impersonate' | 'data_export';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  isActive: boolean;
  isMFAEnabled: boolean;
  lastLogin?: Date;
  lastActivity?: Date;
  loginAttempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
  ipWhitelist: string[];
  allowedLocations: string[];
  maxDevices: number;
  currentDevices: AdminDevice[];
  securityLevel: 'standard' | 'elevated' | 'maximum';
  auditSettings: AuditSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminDevice {
  deviceId: string;
  deviceName: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
  isTrusted: boolean;
}

export interface AuditSettings {
  logLevel: 'minimal' | 'standard' | 'detailed' | 'comprehensive';
  enableRealTimeAlerts: boolean;
  sensitiveDataAccess: boolean;
  exportActivities: boolean;
  sessionRecording: boolean;
}

export interface AdminSession {
  sessionId: string;
  adminId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  startTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  mfaVerified: boolean;
  securityLevel: 'standard' | 'elevated' | 'maximum';
  activities: AdminActivity[];
  isActive: boolean;
  warnings: SecurityWarning[];
}

export interface AdminActivity {
  id: string;
  adminId: string;
  sessionId: string;
  action: string;
  resource: AdminResource;
  resourceId?: string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
}

export interface SecurityWarning {
  type: 'unusual_location' | 'multiple_devices' | 'suspicious_activity' | 'permission_escalation' | 'data_export';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface RBACConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  mfaRequired: boolean;
  ipWhitelistRequired: boolean;
  locationRestrictionEnabled: boolean;
  maxDevicesPerAdmin: number;
  auditRetentionDays: number;
  realTimeMonitoring: boolean;
  securityNotifications: boolean;
}

/**
 * Ultra Admin RBAC Manager
 * Centralized role-based access control for admin panel
 */
export class UltraAdminRBACManager extends EventEmitter {
  private static instance: UltraAdminRBACManager | null = null;
  private config: RBACConfig;
  private activeSessions = new Map<string, AdminSession>();
  private adminUsers = new Map<string, AdminUser>();
  private roles = new Map<string, AdminRole>();
  private activities: AdminActivity[] = [];
  private securityWarnings: SecurityWarning[] = [];
  
  // Monitoring intervals
  private sessionMonitorInterval: NodeJS.Timeout | null = null;
  private securityScanInterval: NodeJS.Timeout | null = null;
  
  private constructor(config: RBACConfig) {
    super();
    this.config = config;
    this.initialize();
  }
  
  /**
   * Singleton pattern - get instance
   */
  public static getInstance(config?: RBACConfig): UltraAdminRBACManager {
    if (!UltraAdminRBACManager.instance) {
      if (!config) {
        throw new Error('RBAC configuration required for first initialization');
      }
      UltraAdminRBACManager.instance = new UltraAdminRBACManager(config);
    }
    return UltraAdminRBACManager.instance;
  }
  
  /**
   * Initialize RBAC manager
   */
  private initialize(): void {
    // Initialize default roles
    this.initializeDefaultRoles();
    
    // Start monitoring
    if (this.config.realTimeMonitoring) {
      this.startSessionMonitoring();
      this.startSecurityScanning();
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('🔐 Ultra Admin RBAC Manager initialized', {
      mfaRequired: this.config.mfaRequired,
      ipWhitelistRequired: this.config.ipWhitelistRequired,
      maxDevices: this.config.maxDevicesPerAdmin
    });
  }
  
  /**
   * Initialize default admin roles
   */
  private initializeDefaultRoles(): void {
    const defaultRoles: AdminRole[] = [
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to basic admin functions',
        level: 1,
        permissions: [
          { resource: 'users', actions: ['view'] },
          { resource: 'products', actions: ['view'] },
          { resource: 'orders', actions: ['view'] },
          { resource: 'analytics', actions: ['view'] }
        ],
        restrictions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'editor',
        name: 'Editor',
        description: 'Edit access to content and products',
        level: 2,
        permissions: [
          { resource: 'users', actions: ['view', 'edit'] },
          { resource: 'products', actions: ['view', 'create', 'edit'] },
          { resource: 'orders', actions: ['view', 'edit'] },
          { resource: 'content', actions: ['view', 'create', 'edit', 'delete'] },
          { resource: 'inventory', actions: ['view', 'edit'] }
        ],
        restrictions: [
          {
            type: 'time_based',
            config: { allowedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17] },
            isActive: true
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full access to most admin functions',
        level: 3,
        permissions: [
          { resource: 'users', actions: ['view', 'create', 'edit', 'delete'] },
          { resource: 'products', actions: ['view', 'create', 'edit', 'delete', 'bulk_edit'] },
          { resource: 'orders', actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject'] },
          { resource: 'analytics', actions: ['view', 'export'] },
          { resource: 'reports', actions: ['view', 'create', 'export'] },
          { resource: 'settings', actions: ['view', 'edit'] },
          { resource: 'marketing', actions: ['view', 'create', 'edit', 'delete'] },
          { resource: 'support', actions: ['view', 'create', 'edit'] }
        ],
        restrictions: [
          {
            type: 'ip_whitelist',
            config: { required: true },
            isActive: true
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'System-level access with advanced privileges',
        level: 4,
        permissions: [
          { resource: 'users', actions: ['view', 'create', 'edit', 'delete', 'bulk_edit', 'data_export'] },
          { resource: 'products', actions: ['view', 'create', 'edit', 'delete', 'bulk_edit', 'import', 'export'] },
          { resource: 'orders', actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'bulk_edit'] },
          { resource: 'analytics', actions: ['view', 'export', 'advanced_search'] },
          { resource: 'reports', actions: ['view', 'create', 'edit', 'delete', 'export'] },
          { resource: 'settings', actions: ['view', 'edit', 'system_config'] },
          { resource: 'admin_users', actions: ['view', 'create', 'edit'] },
          { resource: 'audit_logs', actions: ['view', 'export'] },
          { resource: 'api_keys', actions: ['view', 'create', 'edit', 'delete'] },
          { resource: 'billing', actions: ['view', 'edit'] }
        ],
        restrictions: [
          {
            type: 'ip_whitelist',
            config: { required: true },
            isActive: true
          },
          {
            type: 'device_limit',
            config: { maxDevices: 2 },
            isActive: true
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'owner',
        name: 'System Owner',
        description: 'Complete system access with all privileges',
        level: 5,
        permissions: [
          { resource: 'users', actions: ['view', 'create', 'edit', 'delete', 'bulk_edit', 'data_export', 'user_impersonate'] },
          { resource: 'products', actions: ['view', 'create', 'edit', 'delete', 'bulk_edit', 'import', 'export'] },
          { resource: 'orders', actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'bulk_edit'] },
          { resource: 'analytics', actions: ['view', 'export', 'advanced_search'] },
          { resource: 'reports', actions: ['view', 'create', 'edit', 'delete', 'export'] },
          { resource: 'settings', actions: ['view', 'edit', 'system_config'] },
          { resource: 'admin_users', actions: ['view', 'create', 'edit', 'delete'] },
          { resource: 'audit_logs', actions: ['view', 'export', 'delete'] },
          { resource: 'system', actions: ['view', 'edit', 'system_config'] },
          { resource: 'api_keys', actions: ['view', 'create', 'edit', 'delete'] },
          { resource: 'billing', actions: ['view', 'create', 'edit', 'delete'] }
        ],
        restrictions: [
          {
            type: 'ip_whitelist',
            config: { required: true },
            isActive: true
          },
          {
            type: 'device_limit',
            config: { maxDevices: 1 },
            isActive: true
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
    
    console.log('🔐 Default admin roles initialized', {
      roleCount: this.roles.size,
      roles: Array.from(this.roles.keys())
    });
  }
  
  /**
   * Authenticate admin and create session
   */
  public async authenticateAdmin(credentials: {
    email: string;
    password: string;
    mfaToken?: string;
    deviceInfo: {
      userAgent: string;
      ipAddress: string;
      deviceId: string;
      location?: string;
    };
  }): Promise<{
    success: boolean;
    adminUser?: AdminUser;
    session?: AdminSession;
    mfaRequired?: boolean;
    error?: string;
    securityWarnings?: SecurityWarning[];
  }> {
    try {
      // Mock admin user lookup - replace with real database query
      const adminUser = await this.findAdminByEmail(credentials.email);
      
      if (!adminUser) {
        await this.logActivity({
          id: this.generateId(),
          adminId: 'unknown',
          sessionId: 'none',
          action: 'login_failed',
          resource: 'admin_users',
          metadata: { reason: 'user_not_found', email: credentials.email },
          ipAddress: credentials.deviceInfo.ipAddress,
          userAgent: credentials.deviceInfo.userAgent,
          timestamp: new Date(),
          riskLevel: 'medium',
          success: false,
          errorMessage: 'Admin user not found'
        });
        
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }
      
      // Check if admin is locked
      if (adminUser.isLocked && adminUser.lockedUntil && new Date() < adminUser.lockedUntil) {
        return {
          success: false,
          error: 'Account is temporarily locked'
        };
      }
      
      // Mock password verification - replace with real password verification
      const passwordValid = await this.verifyPassword(credentials.password, adminUser.id);
      
      if (!passwordValid) {
        await this.handleFailedLogin(adminUser, credentials.deviceInfo);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }
      
      // Security validations
      const securityCheck = await this.performSecurityValidations(adminUser, credentials.deviceInfo);
      
      if (!securityCheck.valid) {
        return {
          success: false,
          error: securityCheck.error,
          securityWarnings: securityCheck.warnings
        };
      }
      
      // MFA validation
      if (adminUser.isMFAEnabled || this.config.mfaRequired) {
        if (!credentials.mfaToken) {
          return {
            success: false,
            mfaRequired: true
          };
        }
        
        const mfaValid = await this.verifyMFA(adminUser.id, credentials.mfaToken);
        if (!mfaValid) {
          return {
            success: false,
            error: 'Invalid MFA token'
          };
        }
      }
      
      // Create admin session
      const session = await this.createAdminSession(adminUser, credentials.deviceInfo);
      
      // Reset login attempts
      adminUser.loginAttempts = 0;
      adminUser.isLocked = false;
      adminUser.lockedUntil = undefined;
      adminUser.lastLogin = new Date();
      
      // Log successful authentication
      await this.logActivity({
        id: this.generateId(),
        adminId: adminUser.id,
        sessionId: session.sessionId,
        action: 'login_success',
        resource: 'admin_users',
        metadata: { 
          email: adminUser.email,
          role: adminUser.role.name,
          securityLevel: session.securityLevel
        },
        ipAddress: credentials.deviceInfo.ipAddress,
        userAgent: credentials.deviceInfo.userAgent,
        timestamp: new Date(),
        riskLevel: 'low',
        success: true
      });
      
      this.emit('admin:authenticated', { adminUser, session });
      
      return {
        success: true,
        adminUser,
        session,
        securityWarnings: securityCheck.warnings
      };
      
    } catch (error) {
      console.error('❌ Admin authentication error:', error);
      return {
        success: false,
        error: 'Authentication service error'
      };
    }
  }
  
  /**
   * Check admin permission for specific resource and action
   */
  public async checkPermission(
    adminId: string,
    resource: AdminResource,
    action: AdminAction,
    context?: Record<string, any>
  ): Promise<{
    allowed: boolean;
    reason?: string;
    restrictions?: AdminRestriction[];
  }> {
    try {
      const adminUser = this.adminUsers.get(adminId);
      
      if (!adminUser || !adminUser.isActive) {
        return {
          allowed: false,
          reason: 'Admin user not found or inactive'
        };
      }
      
      const role = adminUser.role;
      
      // Find matching permission
      const permission = role.permissions.find(p => 
        p.resource === resource && p.actions.includes(action)
      );
      
      if (!permission) {
        await this.logActivity({
          id: this.generateId(),
          adminId,
          sessionId: context?.sessionId || 'unknown',
          action: 'permission_denied',
          resource,
          metadata: { 
            deniedAction: action,
            role: role.name,
            reason: 'permission_not_found'
          },
          ipAddress: context?.ipAddress || 'unknown',
          userAgent: context?.userAgent || 'unknown',
          timestamp: new Date(),
          riskLevel: 'medium',
          success: false,
          errorMessage: 'Permission not found'
        });
        
        return {
          allowed: false,
          reason: 'Insufficient permissions'
        };
      }
      
      // Check permission conditions
      if (permission.conditions && permission.conditions.length > 0) {
        const conditionsMet = permission.conditions.every(condition => 
          this.evaluateCondition(condition, context)
        );
        
        if (!conditionsMet) {
          return {
            allowed: false,
            reason: 'Permission conditions not met'
          };
        }
      }
      
      // Check role restrictions
      const activeRestrictions = role.restrictions.filter(r => r.isActive);
      const restrictionCheck = await this.validateRestrictions(adminUser, activeRestrictions, context);
      
      if (!restrictionCheck.valid) {
        return {
          allowed: false,
          reason: restrictionCheck.reason,
          restrictions: activeRestrictions
        };
      }
      
      // Log successful permission check
      await this.logActivity({
        id: this.generateId(),
        adminId,
        sessionId: context?.sessionId || 'unknown',
        action: 'permission_granted',
        resource,
        metadata: { 
          grantedAction: action,
          role: role.name
        },
        ipAddress: context?.ipAddress || 'unknown',
        userAgent: context?.userAgent || 'unknown',
        timestamp: new Date(),
        riskLevel: 'low',
        success: true
      });
      
      return {
        allowed: true
      };
      
    } catch (error) {
      console.error('❌ Permission check error:', error);
      return {
        allowed: false,
        reason: 'Permission service error'
      };
    }
  }
  
  /**
   * Get admin session by session ID
   */
  public getAdminSession(sessionId: string): AdminSession | null {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || !session.isActive || new Date() > session.expiresAt) {
      return null;
    }
    
    // Update last activity
    session.lastActivity = new Date();
    
    return session;
  }
  
  /**
   * Revoke admin session
   */
  public async revokeAdminSession(sessionId: string, reason: string = 'manual_logout'): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    
    if (session) {
      session.isActive = false;
      
      await this.logActivity({
        id: this.generateId(),
        adminId: session.adminId,
        sessionId: session.sessionId,
        action: 'session_revoked',
        resource: 'admin_users',
        metadata: { reason },
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        timestamp: new Date(),
        riskLevel: 'low',
        success: true
      });
      
      this.activeSessions.delete(sessionId);
      this.emit('admin:session_revoked', { sessionId, reason });
    }
  }
  
  /**
   * Get admin activity logs
   */
  public getAdminActivities(
    filters: {
      adminId?: string;
      resource?: AdminResource;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      riskLevel?: 'low' | 'medium' | 'high' | 'critical';
      limit?: number;
    } = {}
  ): AdminActivity[] {
    let filteredActivities = [...this.activities];
    
    if (filters.adminId) {
      filteredActivities = filteredActivities.filter(a => a.adminId === filters.adminId);
    }
    
    if (filters.resource) {
      filteredActivities = filteredActivities.filter(a => a.resource === filters.resource);
    }
    
    if (filters.action) {
      filteredActivities = filteredActivities.filter(a => a.action === filters.action);
    }
    
    if (filters.startDate) {
      filteredActivities = filteredActivities.filter(a => a.timestamp >= filters.startDate!);
    }
    
    if (filters.endDate) {
      filteredActivities = filteredActivities.filter(a => a.timestamp <= filters.endDate!);
    }
    
    if (filters.riskLevel) {
      filteredActivities = filteredActivities.filter(a => a.riskLevel === filters.riskLevel);
    }
    
    // Sort by timestamp (newest first)
    filteredActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply limit
    if (filters.limit) {
      filteredActivities = filteredActivities.slice(0, filters.limit);
    }
    
    return filteredActivities;
  }
  
  /**
   * Get security warnings
   */
  public getSecurityWarnings(
    filters: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      resolved?: boolean;
      limit?: number;
    } = {}
  ): SecurityWarning[] {
    let warnings = [...this.securityWarnings];
    
    if (filters.severity) {
      warnings = warnings.filter(w => w.severity === filters.severity);
    }
    
    if (filters.resolved !== undefined) {
      warnings = warnings.filter(w => w.resolved === filters.resolved);
    }
    
    // Sort by timestamp (newest first)
    warnings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (filters.limit) {
      warnings = warnings.slice(0, filters.limit);
    }
    
    return warnings;
  }
  
  /**
   * Get RBAC metrics and statistics
   */
  public getRBACMetrics() {
    const activeSessionsCount = this.activeSessions.size;
    const totalAdmins = this.adminUsers.size;
    const activeAdmins = Array.from(this.adminUsers.values()).filter(a => a.isActive).length;
    
    const activitiesByType = this.activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const warningsBySeverity = this.securityWarnings.reduce((acc, warning) => {
      acc[warning.severity] = (acc[warning.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      sessions: {
        active: activeSessionsCount,
        total: this.activeSessions.size
      },
      admins: {
        total: totalAdmins,
        active: activeAdmins,
        locked: Array.from(this.adminUsers.values()).filter(a => a.isLocked).length
      },
      activities: {
        total: this.activities.length,
        byType: activitiesByType,
        highRisk: this.activities.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length
      },
      securityWarnings: {
        total: this.securityWarnings.length,
        unresolved: this.securityWarnings.filter(w => !w.resolved).length,
        bySeverity: warningsBySeverity
      },
      config: this.config
    };
  }
  
  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    this.sessionMonitorInterval = setInterval(() => {
      this.performSessionCleanup();
    }, 60000); // Every minute
    
    console.log('🔐 Admin session monitoring started');
  }
  
  /**
   * Start security scanning
   */
  private startSecurityScanning(): void {
    this.securityScanInterval = setInterval(() => {
      this.performSecurityScan();
    }, 300000); // Every 5 minutes
    
    console.log('🔍 Admin security scanning started');
  }
  
  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to our own events for additional processing
    this.on('admin:authenticated', (data) => {
      console.log('✅ Admin authenticated:', data.adminUser.email);
    });
    
    this.on('admin:session_revoked', (data) => {
      console.log('🚪 Admin session revoked:', data.sessionId);
    });
    
    this.on('security:warning', (warning) => {
      console.warn('⚠️ Security warning:', warning);
    });
  }
  
  // Helper methods
  
  private async findAdminByEmail(email: string): Promise<AdminUser | null> {
    // Mock implementation - replace with real database query
    const mockAdmin: AdminUser = {
      id: 'admin_1',
      email,
      firstName: 'John',
      lastName: 'Admin',
      role: this.roles.get('admin')!,
      isActive: true,
      isMFAEnabled: true,
      loginAttempts: 0,
      isLocked: false,
      ipWhitelist: ['192.168.1.0/24'],
      allowedLocations: ['US', 'UZ'],
      maxDevices: 3,
      currentDevices: [],
      securityLevel: 'elevated',
      auditSettings: {
        logLevel: 'comprehensive',
        enableRealTimeAlerts: true,
        sensitiveDataAccess: true,
        exportActivities: true,
        sessionRecording: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store in memory for this session
    this.adminUsers.set(mockAdmin.id, mockAdmin);
    
    return mockAdmin;
  }
  
  private async verifyPassword(password: string, adminId: string): Promise<boolean> {
    try {
      // Get admin user from database
      const adminUser = this.adminUsers.get(adminId);
      if (!adminUser) {
        return false;
      }

      // Use bcrypt for password verification
      const bcrypt = require('bcrypt');
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      
      // In production, this should check against hashed password in database
      // For now, we'll use environment variable for admin password
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      
      if (adminPasswordHash) {
        return await bcrypt.compare(password, adminPasswordHash);
      }
      
      // Fallback: check against environment variable (for development only)
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminPassword) {
        return password === adminPassword;
      }
      
      // Security: if no admin password is configured, deny access
      console.error('CRITICAL: No admin password configured');
      return false;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
  
  private async verifyMFA(adminId: string, token: string): Promise<boolean> {
    try {
      // Get admin user from database
      const adminUser = this.adminUsers.get(adminId);
      if (!adminUser || !adminUser.isMFAEnabled) {
        return false;
      }

      // Use authenticator library for MFA verification
      const authenticator = require('authenticator');
      
      // In production, this should get the secret from database
      const mfaSecret = process.env.ADMIN_MFA_SECRET;
      
      if (mfaSecret) {
        const verified = authenticator.verifyToken(mfaSecret, token);
        return verified !== null;
      }
      
      // Security: if no MFA secret is configured, deny access
      console.error('CRITICAL: No MFA secret configured');
      return false;
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }
  
  private async performSecurityValidations(
    adminUser: AdminUser,
    deviceInfo: { userAgent: string; ipAddress: string; deviceId: string; location?: string }
  ): Promise<{
    valid: boolean;
    error?: string;
    warnings: SecurityWarning[];
  }> {
    const warnings: SecurityWarning[] = [];
    
    // IP whitelist check
    if (this.config.ipWhitelistRequired && adminUser.ipWhitelist.length > 0) {
      const ipAllowed = adminUser.ipWhitelist.some(allowedIp => 
        this.isIpInRange(deviceInfo.ipAddress, allowedIp)
      );
      
      if (!ipAllowed) {
        return {
          valid: false,
          error: 'IP address not in whitelist',
          warnings
        };
      }
    }
    
    // Location check
    if (this.config.locationRestrictionEnabled && deviceInfo.location) {
      if (!adminUser.allowedLocations.includes(deviceInfo.location)) {
        warnings.push({
          type: 'unusual_location',
          severity: 'medium',
          message: `Login from unusual location: ${deviceInfo.location}`,
          timestamp: new Date(),
          resolved: false
        });
      }
    }
    
    // Device limit check
    const activeDevices = adminUser.currentDevices.filter(d => d.isActive);
    if (activeDevices.length >= adminUser.maxDevices) {
      const existingDevice = activeDevices.find(d => d.deviceId === deviceInfo.deviceId);
      if (!existingDevice) {
        return {
          valid: false,
          error: 'Maximum device limit reached',
          warnings
        };
      }
    }
    
    return {
      valid: true,
      warnings
    };
  }
  
  private async createAdminSession(
    adminUser: AdminUser,
    deviceInfo: { userAgent: string; ipAddress: string; deviceId: string; location?: string }
  ): Promise<AdminSession> {
    const sessionId = this.generateId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionTimeout);
    
    const session: AdminSession = {
      sessionId,
      adminId: adminUser.id,
      deviceId: deviceInfo.deviceId,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      location: deviceInfo.location,
      startTime: now,
      lastActivity: now,
      expiresAt,
      mfaVerified: adminUser.isMFAEnabled,
      securityLevel: adminUser.securityLevel,
      activities: [],
      isActive: true,
      warnings: []
    };
    
    this.activeSessions.set(sessionId, session);
    
    // Update admin's device list
    const existingDevice = adminUser.currentDevices.find(d => d.deviceId === deviceInfo.deviceId);
    if (existingDevice) {
      existingDevice.lastSeen = now;
      existingDevice.isActive = true;
    } else {
      adminUser.currentDevices.push({
        deviceId: deviceInfo.deviceId,
        deviceName: this.extractDeviceName(deviceInfo.userAgent),
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        location: deviceInfo.location,
        firstSeen: now,
        lastSeen: now,
        isActive: true,
        isTrusted: false
      });
    }
    
    return session;
  }
  
  private async handleFailedLogin(
    adminUser: AdminUser,
    deviceInfo: { userAgent: string; ipAddress: string; deviceId: string; location?: string }
  ): Promise<void> {
    adminUser.loginAttempts++;
    
    if (adminUser.loginAttempts >= this.config.maxLoginAttempts) {
      adminUser.isLocked = true;
      adminUser.lockedUntil = new Date(Date.now() + this.config.lockoutDuration);
      
      this.securityWarnings.push({
        type: 'suspicious_activity',
        severity: 'high',
        message: `Admin account locked due to failed login attempts: ${adminUser.email}`,
        timestamp: new Date(),
        resolved: false
      });
      
      this.emit('security:warning', {
        type: 'account_locked',
        adminId: adminUser.id,
        attempts: adminUser.loginAttempts
      });
    }
    
    await this.logActivity({
      id: this.generateId(),
      adminId: adminUser.id,
      sessionId: 'none',
      action: 'login_failed',
      resource: 'admin_users',
      metadata: { 
        reason: 'invalid_password',
        attempts: adminUser.loginAttempts,
        locked: adminUser.isLocked
      },
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      timestamp: new Date(),
      riskLevel: adminUser.loginAttempts >= 3 ? 'high' : 'medium',
      success: false,
      errorMessage: 'Invalid password'
    });
  }
  
  private evaluateCondition(condition: PermissionCondition, context?: Record<string, any>): boolean {
    if (!context || !context[condition.field]) {
      return false;
    }
    
    const fieldValue = context[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      default:
        return false;
    }
  }
  
  private async validateRestrictions(
    adminUser: AdminUser,
    restrictions: AdminRestriction[],
    context?: Record<string, any>
  ): Promise<{ valid: boolean; reason?: string }> {
    for (const restriction of restrictions) {
      switch (restriction.type) {
        case 'time_based':
          const currentHour = new Date().getHours();
          const allowedHours = restriction.config.allowedHours;
          if (allowedHours && !allowedHours.includes(currentHour)) {
            return {
              valid: false,
              reason: 'Access not allowed during current time'
            };
          }
          break;
          
        case 'ip_whitelist':
          if (restriction.config.required && context?.ipAddress) {
            const ipAllowed = adminUser.ipWhitelist.some(allowedIp => 
              this.isIpInRange(context.ipAddress, allowedIp)
            );
            if (!ipAllowed) {
              return {
                valid: false,
                reason: 'IP address not in whitelist'
              };
            }
          }
          break;
          
        case 'device_limit':
          const maxDevices = restriction.config.maxDevices;
          const activeDevices = adminUser.currentDevices.filter(d => d.isActive);
          if (activeDevices.length > maxDevices) {
            return {
              valid: false,
              reason: 'Device limit exceeded'
            };
          }
          break;
      }
    }
    
    return { valid: true };
  }
  
  private async logActivity(activity: AdminActivity): Promise<void> {
    this.activities.push(activity);
    
    // Keep only recent activities (last 10000)
    if (this.activities.length > 10000) {
      this.activities = this.activities.slice(-10000);
    }
    
    // Add to session activities if session exists
    if (activity.sessionId !== 'none') {
      const session = this.activeSessions.get(activity.sessionId);
      if (session) {
        session.activities.push(activity);
      }
    }
    
    // Emit event for real-time monitoring
    this.emit('admin:activity', activity);
  }
  
  private performSessionCleanup(): void {
    const now = new Date();
    let expiredCount = 0;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt || !session.isActive) {
        this.activeSessions.delete(sessionId);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`🧹 Cleaned up ${expiredCount} expired admin sessions`);
    }
  }
  
  private performSecurityScan(): void {
    // Scan for suspicious patterns
    const recentActivities = this.activities.filter(a => 
      Date.now() - a.timestamp.getTime() < 300000 // Last 5 minutes
    );
    
    // Check for rapid-fire actions from same admin
    const activityByAdmin = recentActivities.reduce((acc, activity) => {
      acc[activity.adminId] = (acc[activity.adminId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    for (const [adminId, count] of Object.entries(activityByAdmin)) {
      if (count > 50) { // More than 50 actions in 5 minutes
        this.securityWarnings.push({
          type: 'suspicious_activity',
          severity: 'medium',
          message: `High activity rate detected for admin ${adminId}: ${count} actions in 5 minutes`,
          timestamp: new Date(),
          resolved: false
        });
      }
    }
  }
  
  private isIpInRange(ip: string, range: string): boolean {
    // Simple IP range check - in production, use a proper IP library
    if (range.includes('/')) {
      const [network, mask] = range.split('/');
      return ip.startsWith(network.split('.').slice(0, Math.floor(parseInt(mask) / 8)).join('.'));
    }
    return ip === range;
  }
  
  private extractDeviceName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    return 'Unknown Device';
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

/**
 * Production-optimized RBAC configuration
 */
export const productionRBACConfig: RBACConfig = {
  maxLoginAttempts: parseInt(process.env.ADMIN_MAX_LOGIN_ATTEMPTS || '3'),
  lockoutDuration: parseInt(process.env.ADMIN_LOCKOUT_DURATION || '1800000'), // 30 minutes
  sessionTimeout: parseInt(process.env.ADMIN_SESSION_TIMEOUT || '14400000'), // 4 hours
  mfaRequired: process.env.ADMIN_MFA_REQUIRED === 'true',
  ipWhitelistRequired: process.env.ADMIN_IP_WHITELIST_REQUIRED === 'true',
  locationRestrictionEnabled: process.env.ADMIN_LOCATION_RESTRICTION === 'true',
  maxDevicesPerAdmin: parseInt(process.env.ADMIN_MAX_DEVICES || '3'),
  auditRetentionDays: parseInt(process.env.ADMIN_AUDIT_RETENTION_DAYS || '90'),
  realTimeMonitoring: process.env.ADMIN_REALTIME_MONITORING !== 'false',
  securityNotifications: process.env.ADMIN_SECURITY_NOTIFICATIONS !== 'false'
};

/**
 * Create and export singleton instance
 */
export const adminRBAC = UltraAdminRBACManager.getInstance(productionRBACConfig);

/**
 * Helper function to get RBAC manager instance
 */
export function getAdminRBAC(): UltraAdminRBACManager {
  return adminRBAC;
}

/**
 * Export types for external use
 */
export type {
  AdminRole as UltraAdminRole,
  AdminUser as UltraAdminUser,
  AdminSession as UltraAdminSession,
  AdminActivity as UltraAdminActivity,
  SecurityWarning as AdminSecurityWarning,
  RBACConfig as AdminRBACConfig
}; 