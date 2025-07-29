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
declare class AuditService {
    private redis;
    private auditQueue;
    private processingQueue;
    private readonly queueName;
    private readonly retentionDays;
    constructor();
    private initializeRedis;
    private startQueueProcessor;
    private processAuditQueue;
    private storeAuditEvent;
    logAuthenticationEvent(userId: string, sessionId: string, ipAddress: string, userAgent: string, eventType: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION', outcome: 'SUCCESS' | 'FAILURE', details?: Record<string, any>): void;
    logAuthorizationEvent(userId: string, sessionId: string, ipAddress: string, userAgent: string, eventType: 'PERMISSION_CHECK' | 'ROLE_ASSIGNMENT' | 'ROLE_REMOVAL' | 'ACCESS_DENIED', outcome: 'SUCCESS' | 'FAILURE', details?: Record<string, any>): void;
    logUserManagementEvent(userId: string, sessionId: string, ipAddress: string, userAgent: string, eventType: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'PROFILE_UPDATED' | 'PASSWORD_CHANGED', outcome: 'SUCCESS' | 'FAILURE', details?: Record<string, any>): void;
    logSecurityEvent(userId: string, sessionId: string, ipAddress: string, userAgent: string, eventType: 'SUSPICIOUS_ACTIVITY' | 'BRUTE_FORCE_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'IP_BLOCKED' | 'SESSION_HIJACKING', outcome: 'SUCCESS' | 'FAILURE', details?: Record<string, any>): void;
    logSystemEvent(ipAddress: string, userAgent: string, eventType: 'SERVICE_START' | 'SERVICE_STOP' | 'CONFIGURATION_CHANGE' | 'BACKUP_CREATED' | 'MAINTENANCE_MODE', outcome: 'SUCCESS' | 'FAILURE', details?: Record<string, any>): void;
    logComplianceEvent(userId: string, sessionId: string, ipAddress: string, userAgent: string, eventType: 'DATA_EXPORT' | 'DATA_DELETION' | 'CONSENT_GIVEN' | 'CONSENT_WITHDRAWN' | 'PRIVACY_POLICY_UPDATE', outcome: 'SUCCESS' | 'FAILURE', details?: Record<string, any>): void;
    private calculateRiskScore;
    private generateEventId;
    queryAuditEvents(query: AuditQuery): Promise<AuditEvent[]>;
    getAuditStats(startDate: Date, endDate: Date): Promise<any>;
    exportAuditData(startDate: Date, endDate: Date, format?: 'JSON' | 'CSV'): Promise<string>;
    private convertToCSV;
    cleanupExpiredEvents(): Promise<number>;
    close(): Promise<void>;
}
export declare const auditService: AuditService;
export {};
//# sourceMappingURL=audit.service.d.ts.map