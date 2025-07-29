/**
 * 📊 PROMETHEUS METRICS - UltraMarket Auth
 * 
 * Advanced monitoring with Prometheus metrics
 * Custom metrics, histograms, counters, gauges
 * 
 * @author UltraMarket Development Team
 * @version 1.0.0
 * @date 2024-12-28
 */

import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { logger } from '../utils/logger';

/**
 * Prometheus Metrics Collection
 * Professional monitoring for Auth Service
 */

class PrometheusMetrics {
  // HTTP Request Metrics
  private httpRequestsTotal!: Counter<string>;
  private httpRequestDuration!: Histogram<string>;
  private httpRequestSize!: Histogram<string>;
  private httpResponseSize!: Histogram<string>;

  // Authentication Metrics
  private authAttemptsTotal!: Counter<string>;
  private authSuccessTotal!: Counter<string>;
  private authFailureTotal!: Counter<string>;
  private authDuration!: Histogram<string>;

  // User Metrics
  private usersRegisteredTotal!: Counter<string>;
  private usersActiveGauge!: Gauge<string>;
  private usersOnlineGauge!: Gauge<string>;

  // Email Metrics
  private emailsSentTotal!: Counter<string>;
  private emailsFailedTotal!: Counter<string>;
  private emailQueueSize!: Gauge<string>;

  // 2FA Metrics
  private twoFactorEnabledTotal!: Counter<string>;
  private twoFactorVerificationTotal!: Counter<string>;
  private twoFactorFailureTotal!: Counter<string>;

  // Database Metrics
  private dbConnectionsGauge!: Gauge<string>;
  private dbQueryDuration!: Histogram<string>;
  private dbErrorsTotal!: Counter<string>;

  // Redis Metrics
  private redisConnectionsGauge!: Gauge<string>;
  private redisOperationsTotal!: Counter<string>;
  private redisErrorsTotal!: Counter<string>;

  // Security Metrics
  private securityEventsTotal!: Counter<string>;
  private rateLimitHitsTotal!: Counter<string>;
  private suspiciousActivityTotal!: Counter<string>;

  // System Metrics
  private memoryUsageGauge!: Gauge<string>;
  private cpuUsageGauge!: Gauge<string>;
  private diskUsageGauge!: Gauge<string>;

  constructor() {
    this.initializeMetrics();
    this.startDefaultMetrics();
  }

  /**
   * Initialize all Prometheus metrics
   */
  private initializeMetrics(): void {
    // HTTP Request Metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status_code', 'service']
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    this.httpRequestSize = new Histogram({
      name: 'http_request_size_bytes',
      help: 'HTTP request size in bytes',
      labelNames: ['method', 'endpoint'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000]
    });

    this.httpResponseSize = new Histogram({
      name: 'http_response_size_bytes',
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000]
    });

    // Authentication Metrics
    this.authAttemptsTotal = new Counter({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['method', 'result', 'user_type']
    });

    this.authSuccessTotal = new Counter({
      name: 'auth_success_total',
      help: 'Total number of successful authentications',
      labelNames: ['method', 'user_type']
    });

    this.authFailureTotal = new Counter({
      name: 'auth_failure_total',
      help: 'Total number of failed authentications',
      labelNames: ['method', 'reason', 'user_type']
    });

    this.authDuration = new Histogram({
      name: 'auth_duration_seconds',
      help: 'Authentication duration in seconds',
      labelNames: ['method', 'result'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5]
    });

    // User Metrics
    this.usersRegisteredTotal = new Counter({
      name: 'users_registered_total',
      help: 'Total number of user registrations',
      labelNames: ['source', 'verification_method']
    });

    this.usersActiveGauge = new Gauge({
      name: 'users_active_total',
      help: 'Total number of active users',
      labelNames: ['status']
    });

    this.usersOnlineGauge = new Gauge({
      name: 'users_online_total',
      help: 'Total number of online users',
      labelNames: ['session_type']
    });

    // Email Metrics
    this.emailsSentTotal = new Counter({
      name: 'emails_sent_total',
      help: 'Total number of emails sent',
      labelNames: ['type', 'provider', 'status']
    });

    this.emailsFailedTotal = new Counter({
      name: 'emails_failed_total',
      help: 'Total number of failed emails',
      labelNames: ['type', 'provider', 'reason']
    });

    this.emailQueueSize = new Gauge({
      name: 'email_queue_size',
      help: 'Current email queue size',
      labelNames: ['priority']
    });

    // 2FA Metrics
    this.twoFactorEnabledTotal = new Counter({
      name: 'two_factor_enabled_total',
      help: 'Total number of 2FA enablements',
      labelNames: ['method', 'user_type']
    });

    this.twoFactorVerificationTotal = new Counter({
      name: 'two_factor_verification_total',
      help: 'Total number of 2FA verifications',
      labelNames: ['method', 'result']
    });

    this.twoFactorFailureTotal = new Counter({
      name: 'two_factor_failure_total',
      help: 'Total number of 2FA failures',
      labelNames: ['method', 'reason']
    });

    // Database Metrics
    this.dbConnectionsGauge = new Gauge({
      name: 'database_connections_total',
      help: 'Current database connections',
      labelNames: ['status']
    });

    this.dbQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5]
    });

    this.dbErrorsTotal = new Counter({
      name: 'database_errors_total',
      help: 'Total number of database errors',
      labelNames: ['operation', 'error_type']
    });

    // Redis Metrics
    this.redisConnectionsGauge = new Gauge({
      name: 'redis_connections_total',
      help: 'Current Redis connections',
      labelNames: ['status']
    });

    this.redisOperationsTotal = new Counter({
      name: 'redis_operations_total',
      help: 'Total number of Redis operations',
      labelNames: ['operation', 'result']
    });

    this.redisErrorsTotal = new Counter({
      name: 'redis_errors_total',
      help: 'Total number of Redis errors',
      labelNames: ['operation', 'error_type']
    });

    // Security Metrics
    this.securityEventsTotal = new Counter({
      name: 'security_events_total',
      help: 'Total number of security events',
      labelNames: ['event_type', 'severity', 'source']
    });

    this.rateLimitHitsTotal = new Counter({
      name: 'rate_limit_hits_total',
      help: 'Total number of rate limit hits',
      labelNames: ['endpoint', 'ip_address', 'user_agent']
    });

    this.suspiciousActivityTotal = new Counter({
      name: 'suspicious_activity_total',
      help: 'Total number of suspicious activities',
      labelNames: ['activity_type', 'severity', 'source']
    });

    // System Metrics
    this.memoryUsageGauge = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });

    this.cpuUsageGauge = new Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
      labelNames: ['type']
    });

    this.diskUsageGauge = new Gauge({
      name: 'disk_usage_bytes',
      help: 'Disk usage in bytes',
      labelNames: ['mount_point']
    });

    logger.info('📊 Prometheus metrics initialized');
  }

  /**
   * Start default Node.js metrics collection
   */
  private startDefaultMetrics(): void {
    collectDefaultMetrics({
      prefix: 'ultramarket_auth_',
      labels: {
        service: 'auth-service',
        version: process.env['SERVICE_VERSION'] || '1.0.0'
      }
    });
    logger.info('📊 Default metrics collection started');
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, endpoint: string, statusCode: number, duration: number, requestSize?: number, responseSize?: number): void {
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

  /**
   * Record authentication metrics
   */
  recordAuthAttempt(method: string, result: 'success' | 'failure', userType: string, duration: number, reason?: string): void {
    const labels = { method, result, user_type: userType };

    this.authAttemptsTotal.inc(labels);
    this.authDuration.observe(labels, duration);

    if (result === 'success') {
      this.authSuccessTotal.inc({ method, user_type: userType });
    } else {
      this.authFailureTotal.inc({ method, reason: reason || 'unknown', user_type: userType });
    }
  }

  /**
   * Record user registration
   */
  recordUserRegistration(source: string, verificationMethod: string): void {
    this.usersRegisteredTotal.inc({ source, verification_method: verificationMethod });
  }

  /**
   * Update active users gauge
   */
  updateActiveUsers(count: number, status: string): void {
    this.usersActiveGauge.set({ status }, count);
  }

  /**
   * Update online users gauge
   */
  updateOnlineUsers(count: number, sessionType: string): void {
    this.usersOnlineGauge.set({ session_type: sessionType }, count);
  }

  /**
   * Record email metrics
   */
  recordEmailSent(type: string, provider: string, status: string): void {
    this.emailsSentTotal.inc({ type, provider, status });
  }

  /**
   * Record email failure
   */
  recordEmailFailure(type: string, provider: string, reason: string): void {
    this.emailsFailedTotal.inc({ type, provider, reason });
  }

  /**
   * Update email queue size
   */
  updateEmailQueueSize(size: number, priority: string): void {
    this.emailQueueSize.set({ priority }, size);
  }

  /**
   * Record 2FA metrics
   */
  record2FAEnabled(method: string, userType: string): void {
    this.twoFactorEnabledTotal.inc({ method, user_type: userType });
  }

  /**
   * Record 2FA verification
   */
  record2FAVerification(method: string, result: 'success' | 'failure', reason?: string): void {
    this.twoFactorVerificationTotal.inc({ method, result });

    if (result === 'failure') {
      this.twoFactorFailureTotal.inc({ method, reason: reason || 'unknown' });
    }
  }

  /**
   * Record database metrics
   */
  recordDatabaseOperation(operation: string, table: string, duration: number, success: boolean, errorType?: string): void {
    this.dbQueryDuration.observe({ operation, table }, duration);

    if (!success) {
      this.dbErrorsTotal.inc({ operation, error_type: errorType || 'unknown' });
    }
  }

  /**
   * Update database connections gauge
   */
  updateDatabaseConnections(count: number, status: string): void {
    this.dbConnectionsGauge.set({ status }, count);
  }

  /**
   * Record Redis metrics
   */
  recordRedisOperation(operation: string, result: 'success' | 'failure', errorType?: string): void {
    this.redisOperationsTotal.inc({ operation, result });

    if (result === 'failure') {
      this.redisErrorsTotal.inc({ operation, error_type: errorType || 'unknown' });
    }
  }

  /**
   * Update Redis connections gauge
   */
  updateRedisConnections(count: number, status: string): void {
    this.redisConnectionsGauge.set({ status }, count);
  }

  /**
   * Record security events
   */
  recordSecurityEvent(eventType: string, severity: string, source: string): void {
    this.securityEventsTotal.inc({ event_type: eventType, severity, source });
  }

  /**
   * Record rate limit hits
   */
  recordRateLimitHit(endpoint: string, ipAddress: string, userAgent: string): void {
    this.rateLimitHitsTotal.inc({ endpoint, ip_address: ipAddress, user_agent: userAgent });
  }

  /**
   * Record suspicious activity
   */
  recordSuspiciousActivity(activityType: string, severity: string, source: string): void {
    this.suspiciousActivityTotal.inc({ activity_type: activityType, severity, source });
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(memoryUsage: number, cpuUsage: number, diskUsage: number): void {
    this.memoryUsageGauge.set({ type: 'heap' }, memoryUsage);
    this.cpuUsageGauge.set({ type: 'process' }, cpuUsage);
    this.diskUsageGauge.set({ mount_point: '/' }, diskUsage);
  }

  /**
   * Get metrics as string
   */
  async getMetrics(): Promise<string> {
    try {
      return await register.metrics();
    } catch (error) {
      logger.error('❌ Failed to get metrics:', error);
      return '';
    }
  }

  /**
   * Get metrics in JSON format
   */
  async getMetricsJSON(): Promise<any> {
    try {
      return await register.getMetricsAsJSON();
    } catch (error) {
      logger.error('❌ Failed to get metrics JSON:', error);
      return {};
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    register.clear();
    logger.info('📊 Metrics cleared');
  }
}

export const prometheusMetrics = new PrometheusMetrics(); 