"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prometheusMetrics = void 0;
const prom_client_1 = require("prom-client");
const logger_1 = require("../utils/logger");
class PrometheusMetrics {
    httpRequestsTotal;
    httpRequestDuration;
    httpRequestSize;
    httpResponseSize;
    authAttemptsTotal;
    authSuccessTotal;
    authFailureTotal;
    authDuration;
    usersRegisteredTotal;
    usersActiveGauge;
    usersOnlineGauge;
    emailsSentTotal;
    emailsFailedTotal;
    emailQueueSize;
    twoFactorEnabledTotal;
    twoFactorVerificationTotal;
    twoFactorFailureTotal;
    dbConnectionsGauge;
    dbQueryDuration;
    dbErrorsTotal;
    redisConnectionsGauge;
    redisOperationsTotal;
    redisErrorsTotal;
    securityEventsTotal;
    rateLimitHitsTotal;
    suspiciousActivityTotal;
    memoryUsageGauge;
    cpuUsageGauge;
    diskUsageGauge;
    constructor() {
        this.initializeMetrics();
        this.startDefaultMetrics();
    }
    initializeMetrics() {
        this.httpRequestsTotal = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'endpoint', 'status_code', 'service']
        });
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'endpoint', 'status_code'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
        });
        this.httpRequestSize = new prom_client_1.Histogram({
            name: 'http_request_size_bytes',
            help: 'HTTP request size in bytes',
            labelNames: ['method', 'endpoint'],
            buckets: [100, 1000, 5000, 10000, 50000, 100000]
        });
        this.httpResponseSize = new prom_client_1.Histogram({
            name: 'http_response_size_bytes',
            help: 'HTTP response size in bytes',
            labelNames: ['method', 'endpoint', 'status_code'],
            buckets: [100, 1000, 5000, 10000, 50000, 100000]
        });
        this.authAttemptsTotal = new prom_client_1.Counter({
            name: 'auth_attempts_total',
            help: 'Total number of authentication attempts',
            labelNames: ['method', 'result', 'user_type']
        });
        this.authSuccessTotal = new prom_client_1.Counter({
            name: 'auth_success_total',
            help: 'Total number of successful authentications',
            labelNames: ['method', 'user_type']
        });
        this.authFailureTotal = new prom_client_1.Counter({
            name: 'auth_failure_total',
            help: 'Total number of failed authentications',
            labelNames: ['method', 'reason', 'user_type']
        });
        this.authDuration = new prom_client_1.Histogram({
            name: 'auth_duration_seconds',
            help: 'Authentication duration in seconds',
            labelNames: ['method', 'result'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5]
        });
        this.usersRegisteredTotal = new prom_client_1.Counter({
            name: 'users_registered_total',
            help: 'Total number of user registrations',
            labelNames: ['source', 'verification_method']
        });
        this.usersActiveGauge = new prom_client_1.Gauge({
            name: 'users_active_total',
            help: 'Total number of active users',
            labelNames: ['status']
        });
        this.usersOnlineGauge = new prom_client_1.Gauge({
            name: 'users_online_total',
            help: 'Total number of online users',
            labelNames: ['session_type']
        });
        this.emailsSentTotal = new prom_client_1.Counter({
            name: 'emails_sent_total',
            help: 'Total number of emails sent',
            labelNames: ['type', 'provider', 'status']
        });
        this.emailsFailedTotal = new prom_client_1.Counter({
            name: 'emails_failed_total',
            help: 'Total number of failed emails',
            labelNames: ['type', 'provider', 'reason']
        });
        this.emailQueueSize = new prom_client_1.Gauge({
            name: 'email_queue_size',
            help: 'Current email queue size',
            labelNames: ['priority']
        });
        this.twoFactorEnabledTotal = new prom_client_1.Counter({
            name: 'two_factor_enabled_total',
            help: 'Total number of 2FA enablements',
            labelNames: ['method', 'user_type']
        });
        this.twoFactorVerificationTotal = new prom_client_1.Counter({
            name: 'two_factor_verification_total',
            help: 'Total number of 2FA verifications',
            labelNames: ['method', 'result']
        });
        this.twoFactorFailureTotal = new prom_client_1.Counter({
            name: 'two_factor_failure_total',
            help: 'Total number of 2FA failures',
            labelNames: ['method', 'reason']
        });
        this.dbConnectionsGauge = new prom_client_1.Gauge({
            name: 'database_connections_total',
            help: 'Current database connections',
            labelNames: ['status']
        });
        this.dbQueryDuration = new prom_client_1.Histogram({
            name: 'database_query_duration_seconds',
            help: 'Database query duration in seconds',
            labelNames: ['operation', 'table'],
            buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5]
        });
        this.dbErrorsTotal = new prom_client_1.Counter({
            name: 'database_errors_total',
            help: 'Total number of database errors',
            labelNames: ['operation', 'error_type']
        });
        this.redisConnectionsGauge = new prom_client_1.Gauge({
            name: 'redis_connections_total',
            help: 'Current Redis connections',
            labelNames: ['status']
        });
        this.redisOperationsTotal = new prom_client_1.Counter({
            name: 'redis_operations_total',
            help: 'Total number of Redis operations',
            labelNames: ['operation', 'result']
        });
        this.redisErrorsTotal = new prom_client_1.Counter({
            name: 'redis_errors_total',
            help: 'Total number of Redis errors',
            labelNames: ['operation', 'error_type']
        });
        this.securityEventsTotal = new prom_client_1.Counter({
            name: 'security_events_total',
            help: 'Total number of security events',
            labelNames: ['event_type', 'severity', 'source']
        });
        this.rateLimitHitsTotal = new prom_client_1.Counter({
            name: 'rate_limit_hits_total',
            help: 'Total number of rate limit hits',
            labelNames: ['endpoint', 'ip_address', 'user_agent']
        });
        this.suspiciousActivityTotal = new prom_client_1.Counter({
            name: 'suspicious_activity_total',
            help: 'Total number of suspicious activities',
            labelNames: ['activity_type', 'severity', 'source']
        });
        this.memoryUsageGauge = new prom_client_1.Gauge({
            name: 'memory_usage_bytes',
            help: 'Memory usage in bytes',
            labelNames: ['type']
        });
        this.cpuUsageGauge = new prom_client_1.Gauge({
            name: 'cpu_usage_percent',
            help: 'CPU usage percentage',
            labelNames: ['type']
        });
        this.diskUsageGauge = new prom_client_1.Gauge({
            name: 'disk_usage_bytes',
            help: 'Disk usage in bytes',
            labelNames: ['mount_point']
        });
        logger_1.logger.info('📊 Prometheus metrics initialized');
    }
    startDefaultMetrics() {
        (0, prom_client_1.collectDefaultMetrics)({
            prefix: 'ultramarket_auth_',
            labels: {
                service: 'auth-service',
                version: process.env['SERVICE_VERSION'] || '1.0.0'
            }
        });
        logger_1.logger.info('📊 Default metrics collection started');
    }
    recordHttpRequest(method, endpoint, statusCode, duration, requestSize, responseSize) {
        const labels = {
            method,
            endpoint,
            status_code: statusCode.toString(),
            service: 'auth-service'
        };
        this.httpRequestsTotal.inc(labels);
        this.httpRequestDuration.observe(labels, duration);
        if (requestSize) {
            this.httpRequestSize.observe({ method, endpoint }, requestSize);
        }
        if (responseSize) {
            this.httpResponseSize.observe(labels, responseSize);
        }
    }
    recordAuthAttempt(method, result, userType, duration, reason) {
        const labels = { method, result, user_type: userType };
        this.authAttemptsTotal.inc(labels);
        this.authDuration.observe(labels, duration);
        if (result === 'success') {
            this.authSuccessTotal.inc({ method, user_type: userType });
        }
        else {
            this.authFailureTotal.inc({ method, reason: reason || 'unknown', user_type: userType });
        }
    }
    recordUserRegistration(source, verificationMethod) {
        this.usersRegisteredTotal.inc({ source, verification_method: verificationMethod });
    }
    updateActiveUsers(count, status) {
        this.usersActiveGauge.set({ status }, count);
    }
    updateOnlineUsers(count, sessionType) {
        this.usersOnlineGauge.set({ session_type: sessionType }, count);
    }
    recordEmailSent(type, provider, status) {
        this.emailsSentTotal.inc({ type, provider, status });
    }
    recordEmailFailure(type, provider, reason) {
        this.emailsFailedTotal.inc({ type, provider, reason });
    }
    updateEmailQueueSize(size, priority) {
        this.emailQueueSize.set({ priority }, size);
    }
    record2FAEnabled(method, userType) {
        this.twoFactorEnabledTotal.inc({ method, user_type: userType });
    }
    record2FAVerification(method, result, reason) {
        this.twoFactorVerificationTotal.inc({ method, result });
        if (result === 'failure') {
            this.twoFactorFailureTotal.inc({ method, reason: reason || 'unknown' });
        }
    }
    recordDatabaseOperation(operation, table, duration, success, errorType) {
        this.dbQueryDuration.observe({ operation, table }, duration);
        if (!success) {
            this.dbErrorsTotal.inc({ operation, error_type: errorType || 'unknown' });
        }
    }
    updateDatabaseConnections(count, status) {
        this.dbConnectionsGauge.set({ status }, count);
    }
    recordRedisOperation(operation, result, errorType) {
        this.redisOperationsTotal.inc({ operation, result });
        if (result === 'failure') {
            this.redisErrorsTotal.inc({ operation, error_type: errorType || 'unknown' });
        }
    }
    updateRedisConnections(count, status) {
        this.redisConnectionsGauge.set({ status }, count);
    }
    recordSecurityEvent(eventType, severity, source) {
        this.securityEventsTotal.inc({ event_type: eventType, severity, source });
    }
    recordRateLimitHit(endpoint, ipAddress, userAgent) {
        this.rateLimitHitsTotal.inc({ endpoint, ip_address: ipAddress, user_agent: userAgent });
    }
    recordSuspiciousActivity(activityType, severity, source) {
        this.suspiciousActivityTotal.inc({ activity_type: activityType, severity, source });
    }
    updateSystemMetrics(memoryUsage, cpuUsage, diskUsage) {
        this.memoryUsageGauge.set({ type: 'heap' }, memoryUsage);
        this.cpuUsageGauge.set({ type: 'process' }, cpuUsage);
        this.diskUsageGauge.set({ mount_point: '/' }, diskUsage);
    }
    async getMetrics() {
        try {
            return await prom_client_1.register.metrics();
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to get metrics:', error);
            return '';
        }
    }
    async getMetricsJSON() {
        try {
            return await prom_client_1.register.getMetricsAsJSON();
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to get metrics JSON:', error);
            return {};
        }
    }
    clearMetrics() {
        prom_client_1.register.clear();
        logger_1.logger.info('📊 Metrics cleared');
    }
}
exports.prometheusMetrics = new PrometheusMetrics();
//# sourceMappingURL=prometheus.metrics.js.map