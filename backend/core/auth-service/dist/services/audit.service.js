"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
class AuditService {
    redis;
    auditQueue = [];
    processingQueue = false;
    queueName = 'audit_queue';
    retentionDays = {
        AUTHENTICATION: 90,
        AUTHORIZATION: 90,
        USER_MANAGEMENT: 365,
        SECURITY: 2555,
        SYSTEM: 90,
        COMPLIANCE: 2555
    };
    constructor() {
        this.initializeRedis();
        this.startQueueProcessor();
    }
    async initializeRedis() {
        try {
            this.redis = (0, redis_1.createClient)({
                url: process.env['REDIS_URL'] || 'redis://localhost:6379'
            });
            await this.redis.connect();
            logger_1.logger.info('📋 Audit service Redis connected');
        }
        catch (error) {
            logger_1.logger.error('❌ Audit service Redis connection failed:', error);
        }
    }
    startQueueProcessor() {
        setInterval(async () => {
            if (this.processingQueue)
                return;
            await this.processAuditQueue();
        }, 1000);
    }
    async processAuditQueue() {
        if (!this.redis || this.processingQueue || this.auditQueue.length === 0)
            return;
        this.processingQueue = true;
        try {
            const events = [...this.auditQueue];
            this.auditQueue = [];
            for (const event of events) {
                await this.storeAuditEvent(event);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Audit queue processing error:', error);
        }
        finally {
            this.processingQueue = false;
        }
    }
    async storeAuditEvent(event) {
        try {
            const key = `audit:${event.id}`;
            const ttl = event.retentionDays * 24 * 60 * 60;
            await this.redis.setEx(key, ttl, JSON.stringify(event));
            await this.redis.zAdd(`audit:index:event_type:${event.eventType}`, {
                score: event.timestamp.getTime(),
                value: event.id
            });
            if (event.userId) {
                await this.redis.zAdd(`audit:index:user:${event.userId}`, {
                    score: event.timestamp.getTime(),
                    value: event.id
                });
            }
            await this.redis.zAdd(`audit:index:severity:${event.severity}`, {
                score: event.timestamp.getTime(),
                value: event.id
            });
            logger_1.logger.debug('📋 Audit event stored', { eventId: event.id, eventType: event.eventType });
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to store audit event:', error);
        }
    }
    logAuthenticationEvent(userId, sessionId, ipAddress, userAgent, eventType, outcome, details = {}) {
        const event = {
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
    logAuthorizationEvent(userId, sessionId, ipAddress, userAgent, eventType, outcome, details = {}) {
        const event = {
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
    logUserManagementEvent(userId, sessionId, ipAddress, userAgent, eventType, outcome, details = {}) {
        const event = {
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
    logSecurityEvent(userId, sessionId, ipAddress, userAgent, eventType, outcome, details = {}) {
        const event = {
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
            riskScore: 100,
            complianceTags: ['GDPR', 'SOX', 'PCI_DSS'],
            retentionDays: this.retentionDays.SECURITY
        };
        this.auditQueue.push(event);
    }
    logSystemEvent(ipAddress, userAgent, eventType, outcome, details = {}) {
        const event = {
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
    logComplianceEvent(userId, sessionId, ipAddress, userAgent, eventType, outcome, details = {}) {
        const event = {
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
    calculateRiskScore(eventType, outcome, details) {
        let score = 0;
        if (outcome === 'FAILURE')
            score += 30;
        if (outcome === 'SUCCESS')
            score += 10;
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
        if (details['failedAttempts'] > 5)
            score += 20;
        if (details['suspiciousIP'])
            score += 30;
        if (details['unusualTime'])
            score += 15;
        return Math.min(score, 100);
    }
    generateEventId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async queryAuditEvents(query) {
        try {
            const events = [];
            let keys = [];
            if (query.userId) {
                const userKeys = await this.redis.zRange(`audit:index:user:${query.userId}`, 0, -1);
                keys = userKeys;
            }
            else if (query.eventType) {
                const eventKeys = await this.redis.zRange(`audit:index:event_type:${query.eventType}`, 0, -1);
                keys = eventKeys;
            }
            else if (query.severity) {
                const severityKeys = await this.redis.zRange(`audit:index:severity:${query.severity}`, 0, -1);
                keys = severityKeys;
            }
            else {
                keys = await this.redis.keys('audit:*');
                keys = keys.filter(key => !key.includes(':index:'));
            }
            if (query.startDate || query.endDate) {
                keys = keys.filter(async (key) => {
                    const eventData = await this.redis.get(key);
                    if (!eventData)
                        return false;
                    const event = JSON.parse(eventData);
                    const eventTime = event.timestamp.getTime();
                    if (query.startDate && eventTime < query.startDate.getTime())
                        return false;
                    if (query.endDate && eventTime > query.endDate.getTime())
                        return false;
                    return true;
                });
            }
            const start = query.offset || 0;
            const end = start + (query.limit || 100) - 1;
            const limitedKeys = keys.slice(start, end + 1);
            for (const key of limitedKeys) {
                const eventData = await this.redis.get(key);
                if (eventData) {
                    const event = JSON.parse(eventData);
                    if (query.outcome && event.outcome !== query.outcome)
                        continue;
                    events.push(event);
                }
            }
            return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to query audit events:', error);
            return [];
        }
    }
    async getAuditStats(startDate, endDate) {
        try {
            const events = await this.queryAuditEvents({ startDate, endDate });
            const stats = {
                totalEvents: events.length,
                byCategory: {},
                bySeverity: {},
                byOutcome: {},
                byEventType: {},
                averageRiskScore: 0,
                highRiskEvents: 0,
                complianceEvents: 0
            };
            let totalRiskScore = 0;
            for (const event of events) {
                stats.byCategory[event.eventCategory] = (stats.byCategory[event.eventCategory] || 0) + 1;
                stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
                stats.byOutcome[event.outcome] = (stats.byOutcome[event.outcome] || 0) + 1;
                stats.byEventType[event.eventType] = (stats.byEventType[event.eventType] || 0) + 1;
                if (event.riskScore) {
                    totalRiskScore += event.riskScore;
                    if (event.riskScore >= 70) {
                        stats.highRiskEvents++;
                    }
                }
                if (event.complianceTags && event.complianceTags.length > 0) {
                    stats.complianceEvents++;
                }
            }
            stats.averageRiskScore = events.length > 0 ? totalRiskScore / events.length : 0;
            return stats;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to get audit stats:', error);
            return {};
        }
    }
    async exportAuditData(startDate, endDate, format = 'JSON') {
        try {
            const events = await this.queryAuditEvents({ startDate, endDate });
            if (format === 'CSV') {
                return this.convertToCSV(events);
            }
            else {
                return JSON.stringify(events, null, 2);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to export audit data:', error);
            return '';
        }
    }
    convertToCSV(events) {
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
    async cleanupExpiredEvents() {
        try {
            const keys = await this.redis.keys('audit:*');
            let deletedCount = 0;
            for (const key of keys) {
                if (key.includes(':index:'))
                    continue;
                const eventData = await this.redis.get(key);
                if (!eventData)
                    continue;
                const event = JSON.parse(eventData);
                const expirationDate = new Date(event.timestamp.getTime() + (event.retentionDays * 24 * 60 * 60 * 1000));
                if (new Date() > expirationDate) {
                    await this.redis.del(key);
                    deletedCount++;
                }
            }
            logger_1.logger.info('📋 Cleaned up expired audit events', { deletedCount });
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to cleanup expired audit events:', error);
            return 0;
        }
    }
    async close() {
        try {
            if (this.redis) {
                await this.redis.quit();
                logger_1.logger.info('📋 Audit service Redis closed');
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Error closing audit service connections', { error });
        }
    }
}
exports.auditService = new AuditService();
//# sourceMappingURL=audit.service.js.map