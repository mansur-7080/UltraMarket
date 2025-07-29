/**
 * 📋 ADVANCED AUDIT LOGGING SERVICE - UltraMarket Auth
 * 
 * Professional audit logging for security and compliance
 * GDPR, SOX, PCI DSS compliance ready
 * 
 * @author UltraMarket Development Team
 * @version 1.0.0
 * @date 2024-12-28
 */

import { createClient } from 'redis';
import { logger } from '../utils/logger';

/**
 * Advanced Audit Logging Service
 * Professional audit trail for security and compliance
 */

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  eventType: string;
  eventCategory: 'AUTHENTICATION' | 'AUTHORIZATION' | 'USER_MANAGEMENT' | 'SECURITY' | 'SYSTEM' | 'COMPLIANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details: Record<string, any>;
  outcome: 'SUCCESS' | 'FAILURE' | 'PENDING';
  riskScore?: number;
  complianceTags?: string[];
  retentionDays: number;
}

interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: string;
  severity?: string;
  outcome?: string;
  limit?: number;
  offset?: number;
}

class AuditService {
  private redis: any;
  private auditQueue: AuditEvent[] = [];
  private processingQueue = false;
  private readonly queueName = 'audit_queue';
  private readonly retentionDays = {
    AUTHENTICATION: 90,
    AUTHORIZATION: 90,
    USER_MANAGEMENT: 365,
    SECURITY: 2555, // 7 years
    SYSTEM: 90,
    COMPLIANCE: 2555 // 7 years
  };

  constructor() {
    this.initializeRedis();
    this.startQueueProcessor();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redis = createClient({
        url: process.env['REDIS_URL'] || 'redis://localhost:6379'
      });
      await this.redis.connect();
      logger.info('📋 Audit service Redis connected');
    } catch (error) {
      logger.error('❌ Audit service Redis connection failed:', error);
    }
  }

  /**
   * Start audit queue processor
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.processingQueue) return;
      await this.processAuditQueue();
    }, 1000); // Process every second
  }

  /**
   * Process audit queue
   */
  private async processAuditQueue(): Promise<void> {
    if (!this.redis || this.processingQueue || this.auditQueue.length === 0) return;

    this.processingQueue = true;

    try {
      const events = [...this.auditQueue];
      this.auditQueue = [];

      for (const event of events) {
        await this.storeAuditEvent(event);
      }
    } catch (error) {
      logger.error('❌ Audit queue processing error:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Store audit event
   */
  private async storeAuditEvent(event: AuditEvent): Promise<void> {
    try {
      const key = `audit:${event.id}`;
      const ttl = event.retentionDays * 24 * 60 * 60; // Convert days to seconds

      await this.redis.setEx(key, ttl, JSON.stringify(event));
      
      // Add to event type index
      await this.redis.zAdd(`audit:index:event_type:${event.eventType}`, {
        score: event.timestamp.getTime(),
        value: event.id
      });

      // Add to user index
      if (event.userId) {
        await this.redis.zAdd(`audit:index:user:${event.userId}`, {
          score: event.timestamp.getTime(),
          value: event.id
        });
      }

      // Add to severity index
      await this.redis.zAdd(`audit:index:severity:${event.severity}`, {
        score: event.timestamp.getTime(),
        value: event.id
      });

      logger.debug('📋 Audit event stored', { eventId: event.id, eventType: event.eventType });
    } catch (error) {
      logger.error('❌ Failed to store audit event:', error);
    }
  }

  /**
   * Log authentication event
   */
  logAuthenticationEvent(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    eventType: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION',
    outcome: 'SUCCESS' | 'FAILURE',
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId,
      sessionId,
      ipAddress,
      userAgent,
      eventType,
      eventCategory: 'AUTHENTICATION',
      severity: outcome === 'FAILURE' ? 'HIGH' : 'LOW',
      description: `${eventType.toLowerCase().replace('_', ' ')} ${outcome.toLowerCase()}`,
      details,
      outcome,
      riskScore: this.calculateRiskScore(eventType, outcome, details),
      complianceTags: ['GDPR', 'SOX'],
      retentionDays: this.retentionDays.AUTHENTICATION
    };

    this.auditQueue.push(event);
  }

  /**
   * Log authorization event
   */
  logAuthorizationEvent(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    eventType: 'PERMISSION_CHECK' | 'ROLE_ASSIGNMENT' | 'ROLE_REMOVAL' | 'ACCESS_DENIED',
    outcome: 'SUCCESS' | 'FAILURE',
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId,
      sessionId,
      ipAddress,
      userAgent,
      eventType,
      eventCategory: 'AUTHORIZATION',
      severity: outcome === 'FAILURE' ? 'HIGH' : 'LOW',
      description: `${eventType.toLowerCase().replace('_', ' ')} ${outcome.toLowerCase()}`,
      details,
      outcome,
      riskScore: this.calculateRiskScore(eventType, outcome, details),
      complianceTags: ['GDPR', 'SOX'],
      retentionDays: this.retentionDays.AUTHORIZATION
    };

    this.auditQueue.push(event);
  }

  /**
   * Log user management event
   */
  logUserManagementEvent(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    eventType: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'PROFILE_UPDATED' | 'PASSWORD_CHANGED',
    outcome: 'SUCCESS' | 'FAILURE',
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId,
      sessionId,
      ipAddress,
      userAgent,
      eventType,
      eventCategory: 'USER_MANAGEMENT',
      severity: eventType === 'USER_DELETED' ? 'HIGH' : 'MEDIUM',
      description: `${eventType.toLowerCase().replace('_', ' ')} ${outcome.toLowerCase()}`,
      details,
      outcome,
      riskScore: this.calculateRiskScore(eventType, outcome, details),
      complianceTags: ['GDPR', 'SOX'],
      retentionDays: this.retentionDays.USER_MANAGEMENT
    };

    this.auditQueue.push(event);
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    eventType: 'SUSPICIOUS_ACTIVITY' | 'BRUTE_FORCE_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'IP_BLOCKED' | 'SESSION_HIJACKING',
    outcome: 'SUCCESS' | 'FAILURE',
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId,
      sessionId,
      ipAddress,
      userAgent,
      eventType,
      eventCategory: 'SECURITY',
      severity: 'CRITICAL',
      description: `${eventType.toLowerCase().replace('_', ' ')} detected`,
      details,
      outcome,
      riskScore: 100, // Maximum risk score for security events
      complianceTags: ['GDPR', 'SOX', 'PCI_DSS'],
      retentionDays: this.retentionDays.SECURITY
    };

    this.auditQueue.push(event);
  }

  /**
   * Log system event
   */
  logSystemEvent(
    ipAddress: string,
    userAgent: string,
    eventType: 'SERVICE_START' | 'SERVICE_STOP' | 'CONFIGURATION_CHANGE' | 'BACKUP_CREATED' | 'MAINTENANCE_MODE',
    outcome: 'SUCCESS' | 'FAILURE',
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ipAddress,
      userAgent,
      eventType,
      eventCategory: 'SYSTEM',
      severity: 'LOW',
      description: `${eventType.toLowerCase().replace('_', ' ')} ${outcome.toLowerCase()}`,
      details,
      outcome,
      riskScore: this.calculateRiskScore(eventType, outcome, details),
      complianceTags: ['SOX'],
      retentionDays: this.retentionDays.SYSTEM
    };

    this.auditQueue.push(event);
  }

  /**
   * Log compliance event
   */
  logComplianceEvent(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    eventType: 'DATA_EXPORT' | 'DATA_DELETION' | 'CONSENT_GIVEN' | 'CONSENT_WITHDRAWN' | 'PRIVACY_POLICY_UPDATE',
    outcome: 'SUCCESS' | 'FAILURE',
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId,
      sessionId,
      ipAddress,
      userAgent,
      eventType,
      eventCategory: 'COMPLIANCE',
      severity: 'HIGH',
      description: `${eventType.toLowerCase().replace('_', ' ')} ${outcome.toLowerCase()}`,
      details,
      outcome,
      riskScore: this.calculateRiskScore(eventType, outcome, details),
      complianceTags: ['GDPR', 'CCPA', 'SOX'],
      retentionDays: this.retentionDays.COMPLIANCE
    };

    this.auditQueue.push(event);
  }

  /**
   * Calculate risk score for event
   */
  private calculateRiskScore(eventType: string, outcome: string, details: Record<string, any>): number {
    let score = 0;

    // Base score by outcome
    if (outcome === 'FAILURE') score += 30;
    if (outcome === 'SUCCESS') score += 10;

    // Event type specific scoring
    switch (eventType) {
      case 'LOGIN_FAILED':
        score += 40;
        break;
      case 'USER_DELETED':
        score += 50;
        break;
      case 'SUSPICIOUS_ACTIVITY':
        score += 80;
        break;
      case 'BRUTE_FORCE_ATTEMPT':
        score += 90;
        break;
      case 'DATA_EXPORT':
        score += 60;
        break;
      case 'DATA_DELETION':
        score += 70;
        break;
    }

    // Additional factors
    if (details['failedAttempts'] > 5) score += 20;
    if (details['suspiciousIP']) score += 30;
    if (details['unusualTime']) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Query audit events
   */
  async queryAuditEvents(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      const events: AuditEvent[] = [];
      let keys: string[] = [];

      // Build query based on filters
      if (query.userId) {
        const userKeys = await this.redis.zRange(`audit:index:user:${query.userId}`, 0, -1);
        keys = userKeys;
      } else if (query.eventType) {
        const eventKeys = await this.redis.zRange(`audit:index:event_type:${query.eventType}`, 0, -1);
        keys = eventKeys;
      } else if (query.severity) {
        const severityKeys = await this.redis.zRange(`audit:index:severity:${query.severity}`, 0, -1);
        keys = severityKeys;
      } else {
        // Get all audit keys
        keys = await this.redis.keys('audit:*');
        keys = keys.filter(key => !key.includes(':index:'));
      }

      // Apply date filters
      if (query.startDate || query.endDate) {
        keys = keys.filter(async (key) => {
          const eventData = await this.redis.get(key);
          if (!eventData) return false;

          const event: AuditEvent = JSON.parse(eventData);
          const eventTime = event.timestamp.getTime();

          if (query.startDate && eventTime < query.startDate.getTime()) return false;
          if (query.endDate && eventTime > query.endDate.getTime()) return false;

          return true;
        });
      }

      // Apply limit and offset
      const start = query.offset || 0;
      const end = start + (query.limit || 100) - 1;
      const limitedKeys = keys.slice(start, end + 1);

      // Fetch events
      for (const key of limitedKeys) {
        const eventData = await this.redis.get(key);
        if (eventData) {
          const event: AuditEvent = JSON.parse(eventData);
          
          // Apply outcome filter
          if (query.outcome && event.outcome !== query.outcome) continue;
          
          events.push(event);
        }
      }

      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('❌ Failed to query audit events:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(startDate: Date, endDate: Date): Promise<any> {
    try {
      const events = await this.queryAuditEvents({ startDate, endDate });

      const stats = {
        totalEvents: events.length,
        byCategory: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        byOutcome: {} as Record<string, number>,
        byEventType: {} as Record<string, number>,
        averageRiskScore: 0,
        highRiskEvents: 0,
        complianceEvents: 0
      };

      let totalRiskScore = 0;

      for (const event of events) {
        // Category stats
        stats.byCategory[event.eventCategory] = (stats.byCategory[event.eventCategory] || 0) + 1;

        // Severity stats
        stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;

        // Outcome stats
        stats.byOutcome[event.outcome] = (stats.byOutcome[event.outcome] || 0) + 1;

        // Event type stats
        stats.byEventType[event.eventType] = (stats.byEventType[event.eventType] || 0) + 1;

        // Risk score stats
        if (event.riskScore) {
          totalRiskScore += event.riskScore;
          if (event.riskScore >= 70) {
            stats.highRiskEvents++;
          }
        }

        // Compliance stats
        if (event.complianceTags && event.complianceTags.length > 0) {
          stats.complianceEvents++;
        }
      }

      stats.averageRiskScore = events.length > 0 ? totalRiskScore / events.length : 0;

      return stats;
    } catch (error) {
      logger.error('❌ Failed to get audit stats:', error);
      return {};
    }
  }

  /**
   * Export audit data for compliance
   */
  async exportAuditData(startDate: Date, endDate: Date, format: 'JSON' | 'CSV' = 'JSON'): Promise<string> {
    try {
      const events = await this.queryAuditEvents({ startDate, endDate });

      if (format === 'CSV') {
        return this.convertToCSV(events);
      } else {
        return JSON.stringify(events, null, 2);
      }
    } catch (error) {
      logger.error('❌ Failed to export audit data:', error);
      return '';
    }
  }

  /**
   * Convert events to CSV format
   */
  private convertToCSV(events: AuditEvent[]): string {
    const headers = [
      'ID', 'Timestamp', 'User ID', 'Session ID', 'IP Address', 'User Agent',
      'Event Type', 'Event Category', 'Severity', 'Description', 'Outcome',
      'Risk Score', 'Compliance Tags', 'Details'
    ];

    const rows = events.map(event => [
      event.id,
      event.timestamp.toISOString(),
      event.userId || '',
      event.sessionId || '',
      event.ipAddress,
      event.userAgent,
      event.eventType,
      event.eventCategory,
      event.severity,
      event.description,
      event.outcome,
      event.riskScore || '',
      event.complianceTags?.join(',') || '',
      JSON.stringify(event.details)
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Clean up expired audit events
   */
  async cleanupExpiredEvents(): Promise<number> {
    try {
      const keys = await this.redis.keys('audit:*');
      let deletedCount = 0;

      for (const key of keys) {
        if (key.includes(':index:')) continue;

        const eventData = await this.redis.get(key);
        if (!eventData) continue;

        const event: AuditEvent = JSON.parse(eventData);
        const expirationDate = new Date(event.timestamp.getTime() + (event.retentionDays * 24 * 60 * 60 * 1000));

        if (new Date() > expirationDate) {
          await this.redis.del(key);
          deletedCount++;
        }
      }

      logger.info('📋 Cleaned up expired audit events', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('❌ Failed to cleanup expired audit events:', error);
      return 0;
    }
  }

  /**
   * Close audit service connections
   */
  async close(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('📋 Audit service Redis closed');
      }
    } catch (error) {
      logger.error('❌ Error closing audit service connections', { error });
    }
  }
}

export const auditService = new AuditService();
