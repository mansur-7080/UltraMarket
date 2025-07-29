/**
 * Audit Service
 * Professional audit logging for security events and user actions
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared/logging/logger';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  details?: any;
  metadata?: any;
}

export interface SecurityEvent {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  data: AuditLogData;
}

/**
 * Log audit event
 */
export async function auditLog(event: string, data: AuditLogData): Promise<void> {
  try {
    const auditEntry = await prisma.auditLog.create({
      data: {
        event,
        userId: data.userId,
        email: data.email,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        action: data.action,
        resource: data.resource,
        details: data.details,
        metadata: data.metadata,
        timestamp: new Date(),
      },
    });

    logger.info('Audit log created', {
      auditId: auditEntry.id,
      event,
      userId: data.userId,
      operation: 'audit_log_creation',
    });
  } catch (error) {
    logger.error('Failed to create audit log', {
      event,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw error to avoid blocking main operations
  }
}

/**
 * Log security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const securityLog = await prisma.securityLog.create({
      data: {
        eventType: event.type,
        severity: event.severity,
        description: event.description,
        userId: event.data.userId,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        details: event.data.details,
        metadata: event.data.metadata,
        timestamp: new Date(),
      },
    });

    logger.warn('Security event logged', {
      securityLogId: securityLog.id,
      eventType: event.type,
      severity: event.severity,
      userId: event.data.userId,
      operation: 'security_event_logging',
    });
  } catch (error) {
    logger.error('Failed to log security event', {
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(
  email: string,
  ipAddress: string,
  userAgent: string,
  reason: string
): Promise<void> {
  const securityEvent: SecurityEvent = {
    type: 'FAILED_LOGIN',
    severity: 'MEDIUM',
    description: `Failed login attempt for email: ${email}`,
    data: {
      email,
      ipAddress,
      userAgent,
      action: 'LOGIN_ATTEMPT',
      resource: 'AUTH_SERVICE',
      details: { reason },
      metadata: { timestamp: new Date().toISOString() },
    },
  };

  await logSecurityEvent(securityEvent);
  await auditLog('FAILED_LOGIN', securityEvent.data);
}

/**
 * Log successful login
 */
export async function logSuccessfulLogin(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await auditLog('SUCCESSFUL_LOGIN', {
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'LOGIN',
    resource: 'AUTH_SERVICE',
    details: { loginMethod: 'EMAIL_PASSWORD' },
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log password change
 */
export async function logPasswordChange(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await auditLog('PASSWORD_CHANGE', {
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'PASSWORD_UPDATE',
    resource: 'AUTH_SERVICE',
    details: { changeMethod: 'USER_INITIATED' },
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log password reset request
 */
export async function logPasswordResetRequest(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await auditLog('PASSWORD_RESET_REQUEST', {
    email,
    ipAddress,
    userAgent,
    action: 'PASSWORD_RESET_REQUEST',
    resource: 'AUTH_SERVICE',
    details: { requestMethod: 'EMAIL' },
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log password reset completion
 */
export async function logPasswordResetCompletion(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await auditLog('PASSWORD_RESET_COMPLETION', {
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'PASSWORD_RESET',
    resource: 'AUTH_SERVICE',
    details: { resetMethod: 'EMAIL_TOKEN' },
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log account creation
 */
export async function logAccountCreation(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await auditLog('ACCOUNT_CREATION', {
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'USER_REGISTRATION',
    resource: 'AUTH_SERVICE',
    details: { registrationMethod: 'EMAIL_PASSWORD' },
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log account deactivation
 */
export async function logAccountDeactivation(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  reason: string
): Promise<void> {
  await auditLog('ACCOUNT_DEACTIVATION', {
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'ACCOUNT_DEACTIVATION',
    resource: 'AUTH_SERVICE',
    details: { reason },
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  activity: string,
  details: any
): Promise<void> {
  const securityEvent: SecurityEvent = {
    type: 'SUSPICIOUS_ACTIVITY',
    severity: 'HIGH',
    description: `Suspicious activity detected: ${activity}`,
    data: {
      userId,
      email,
      ipAddress,
      userAgent,
      action: 'SUSPICIOUS_ACTIVITY',
      resource: 'AUTH_SERVICE',
      details,
      metadata: { timestamp: new Date().toISOString() },
    },
  };

  await logSecurityEvent(securityEvent);
  await auditLog('SUSPICIOUS_ACTIVITY', securityEvent.data);
}

/**
 * Log token refresh
 */
export async function logTokenRefresh(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await auditLog('TOKEN_REFRESH', {
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'TOKEN_REFRESH',
    resource: 'AUTH_SERVICE',
    details: { refreshMethod: 'REFRESH_TOKEN' },
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log logout
 */
export async function logLogout(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await auditLog('USER_LOGOUT', {
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'LOGOUT',
    resource: 'AUTH_SERVICE',
    details: { logoutMethod: 'USER_INITIATED' },
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    return logs;
  } catch (error) {
    logger.error('Failed to get user audit logs', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get security events for a user
 */
export async function getUserSecurityEvents(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const events = await prisma.securityLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    return events;
  } catch (error) {
    logger.error('Failed to get user security events', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get failed login attempts for an IP
 */
export async function getFailedLoginAttempts(
  ipAddress: string,
  timeWindow: number = 15 * 60 * 1000
): Promise<number> {
  try {
    const count = await prisma.securityLog.count({
      where: {
        eventType: 'FAILED_LOGIN',
        ipAddress,
        timestamp: {
          gte: new Date(Date.now() - timeWindow),
        },
      },
    });

    return count;
  } catch (error) {
    logger.error('Failed to get failed login attempts', {
      ipAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * Clean up old audit logs
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info('Old audit logs cleaned up', {
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      operation: 'audit_log_cleanup',
    });

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup old audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Clean up old security logs
 */
export async function cleanupOldSecurityLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.securityLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info('Old security logs cleaned up', {
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      operation: 'security_log_cleanup',
    });

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup old security logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
