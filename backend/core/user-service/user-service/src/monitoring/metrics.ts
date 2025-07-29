import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { logger } from '../utils/logger';

// Enable default metrics collection
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Total number of active users',
});

export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['role'],
});

export const userLogins = new Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
  labelNames: ['role'],
});

export const userLogouts = new Counter({
  name: 'user_logouts_total',
  help: 'Total number of user logouts',
});

export const passwordResets = new Counter({
  name: 'password_resets_total',
  help: 'Total number of password reset requests',
});

export const emailVerifications = new Counter({
  name: 'email_verifications_total',
  help: 'Total number of email verifications',
});

export const databaseOperations = new Counter({
  name: 'database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'table'],
});

export const databaseOperationDuration = new Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const redisOperations = new Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation'],
});

export const redisOperationDuration = new Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

export const emailSent = new Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type'],
});

export const emailErrors = new Counter({
  name: 'email_errors_total',
  help: 'Total number of email sending errors',
  labelNames: ['type'],
});

export const jwtTokensGenerated = new Counter({
  name: 'jwt_tokens_generated_total',
  help: 'Total number of JWT tokens generated',
  labelNames: ['type'],
});

export const jwtTokenValidations = new Counter({
  name: 'jwt_token_validations_total',
  help: 'Total number of JWT token validations',
  labelNames: ['result'],
});

export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'ip'],
});

export const validationErrors = new Counter({
  name: 'validation_errors_total',
  help: 'Total number of validation errors',
  labelNames: ['field', 'type'],
});

export const businessLogicErrors = new Counter({
  name: 'business_logic_errors_total',
  help: 'Total number of business logic errors',
  labelNames: ['error_type', 'operation'],
});

// Health check metrics
export const serviceHealth = new Gauge({
  name: 'service_health',
  help: 'Service health status (1 = healthy, 0 = unhealthy)',
  labelNames: ['service'],
});

export const databaseHealth = new Gauge({
  name: 'database_health',
  help: 'Database health status (1 = healthy, 0 = unhealthy)',
});

export const redisHealth = new Gauge({
  name: 'redis_health',
  help: 'Redis health status (1 = healthy, 0 = unhealthy)',
});

export const emailServiceHealth = new Gauge({
  name: 'email_service_health',
  help: 'Email service health status (1 = healthy, 0 = unhealthy)',
});

// Memory and performance metrics
export const memoryUsage = new Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
});

export const cpuUsage = new Gauge({
  name: 'cpu_usage_percentage',
  help: 'CPU usage percentage',
});

export const eventLoopLag = new Histogram({
  name: 'event_loop_lag_seconds',
  help: 'Event loop lag in seconds',
  buckets: [0.001, 0.01, 0.1, 1, 10],
});

// Business metrics
export const userEngagement = new Gauge({
  name: 'user_engagement_score',
  help: 'User engagement score',
  labelNames: ['user_id'],
});

export const sessionDuration = new Histogram({
  name: 'session_duration_seconds',
  help: 'User session duration in seconds',
  buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 28800],
});

export const profileUpdateFrequency = new Counter({
  name: 'profile_updates_total',
  help: 'Total number of profile updates',
  labelNames: ['field'],
});

export const searchQueries = new Counter({
  name: 'search_queries_total',
  help: 'Total number of search queries',
  labelNames: ['query_type'],
});

// Error tracking
export const errorRate = new Counter({
  name: 'error_rate_total',
  help: 'Total number of errors',
  labelNames: ['error_type', 'severity'],
});

export const responseTimePercentile = new Histogram({
  name: 'response_time_percentile_seconds',
  help: 'Response time percentiles',
  labelNames: ['percentile'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

// Custom business metrics
export const userRetentionRate = new Gauge({
  name: 'user_retention_rate',
  help: 'User retention rate percentage',
});

export const conversionRate = new Gauge({
  name: 'conversion_rate',
  help: 'User conversion rate percentage',
  labelNames: ['funnel_step'],
});

export const churnRate = new Gauge({
  name: 'churn_rate',
  help: 'User churn rate percentage',
});

// Metrics collection functions
export const recordHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  duration: number
): void => {
  try {
    httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
    httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
  } catch (error) {
    logger.error('Error recording HTTP request metrics:', error);
  }
};

export const recordDatabaseOperation = (
  operation: string,
  table: string,
  duration: number
): void => {
  try {
    databaseOperations.inc({ operation, table });
    databaseOperationDuration.observe({ operation, table }, duration);
  } catch (error) {
    logger.error('Error recording database operation metrics:', error);
  }
};

export const recordRedisOperation = (operation: string, duration: number): void => {
  try {
    redisOperations.inc({ operation });
    redisOperationDuration.observe({ operation }, duration);
  } catch (error) {
    logger.error('Error recording Redis operation metrics:', error);
  }
};

export const recordEmailSent = (type: string): void => {
  try {
    emailSent.inc({ type });
  } catch (error) {
    logger.error('Error recording email sent metrics:', error);
  }
};

export const recordEmailError = (type: string): void => {
  try {
    emailErrors.inc({ type });
  } catch (error) {
    logger.error('Error recording email error metrics:', error);
  }
};

export const recordJwtTokenGenerated = (type: string): void => {
  try {
    jwtTokensGenerated.inc({ type });
  } catch (error) {
    logger.error('Error recording JWT token generated metrics:', error);
  }
};

export const recordJwtTokenValidation = (result: string): void => {
  try {
    jwtTokenValidations.inc({ result });
  } catch (error) {
    logger.error('Error recording JWT token validation metrics:', error);
  }
};

export const recordRateLimitHit = (endpoint: string, ip: string): void => {
  try {
    rateLimitHits.inc({ endpoint, ip });
  } catch (error) {
    logger.error('Error recording rate limit hit metrics:', error);
  }
};

export const recordValidationError = (field: string, type: string): void => {
  try {
    validationErrors.inc({ field, type });
  } catch (error) {
    logger.error('Error recording validation error metrics:', error);
  }
};

export const recordBusinessLogicError = (errorType: string, operation: string): void => {
  try {
    businessLogicErrors.inc({ error_type: errorType, operation });
  } catch (error) {
    logger.error('Error recording business logic error metrics:', error);
  }
};

export const updateServiceHealth = (isHealthy: boolean): void => {
  try {
    serviceHealth.set({ service: 'user-service' }, isHealthy ? 1 : 0);
  } catch (error) {
    logger.error('Error updating service health metrics:', error);
  }
};

export const updateDatabaseHealth = (isHealthy: boolean): void => {
  try {
    databaseHealth.set(isHealthy ? 1 : 0);
  } catch (error) {
    logger.error('Error updating database health metrics:', error);
  }
};

export const updateRedisHealth = (isHealthy: boolean): void => {
  try {
    redisHealth.set(isHealthy ? 1 : 0);
  } catch (error) {
    logger.error('Error updating Redis health metrics:', error);
  }
};

export const updateEmailServiceHealth = (isHealthy: boolean): void => {
  try {
    emailServiceHealth.set(isHealthy ? 1 : 0);
  } catch (error) {
    logger.error('Error updating email service health metrics:', error);
  }
};

export const updateMemoryUsage = (): void => {
  try {
    const memUsage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'external' }, memUsage.external);
  } catch (error) {
    logger.error('Error updating memory usage metrics:', error);
  }
};

export const updateActiveUsers = (count: number): void => {
  try {
    activeUsers.set(count);
  } catch (error) {
    logger.error('Error updating active users metrics:', error);
  }
};

export const recordUserRegistration = (role: string): void => {
  try {
    userRegistrations.inc({ role });
  } catch (error) {
    logger.error('Error recording user registration metrics:', error);
  }
};

export const recordUserLogin = (role: string): void => {
  try {
    userLogins.inc({ role });
  } catch (error) {
    logger.error('Error recording user login metrics:', error);
  }
};

export const recordUserLogout = (): void => {
  try {
    userLogouts.inc();
  } catch (error) {
    logger.error('Error recording user logout metrics:', error);
  }
};

export const recordPasswordReset = (): void => {
  try {
    passwordResets.inc();
  } catch (error) {
    logger.error('Error recording password reset metrics:', error);
  }
};

export const recordEmailVerification = (): void => {
  try {
    emailVerifications.inc();
  } catch (error) {
    logger.error('Error recording email verification metrics:', error);
  }
};

export const recordProfileUpdate = (field: string): void => {
  try {
    profileUpdateFrequency.inc({ field });
  } catch (error) {
    logger.error('Error recording profile update metrics:', error);
  }
};

export const recordSearchQuery = (queryType: string): void => {
  try {
    searchQueries.inc({ query_type: queryType });
  } catch (error) {
    logger.error('Error recording search query metrics:', error);
  }
};

export const recordError = (errorType: string, severity: string): void => {
  try {
    errorRate.inc({ error_type: errorType, severity });
  } catch (error) {
    logger.error('Error recording error metrics:', error);
  }
};

export const recordSessionDuration = (duration: number): void => {
  try {
    sessionDuration.observe(duration);
  } catch (error) {
    logger.error('Error recording session duration metrics:', error);
  }
};

export const updateUserEngagement = (userId: string, score: number): void => {
  try {
    userEngagement.set({ user_id: userId }, score);
  } catch (error) {
    logger.error('Error updating user engagement metrics:', error);
  }
};

export const updateUserRetentionRate = (rate: number): void => {
  try {
    userRetentionRate.set(rate);
  } catch (error) {
    logger.error('Error updating user retention rate metrics:', error);
  }
};

export const updateConversionRate = (funnelStep: string, rate: number): void => {
  try {
    conversionRate.set({ funnel_step: funnelStep }, rate);
  } catch (error) {
    logger.error('Error updating conversion rate metrics:', error);
  }
};

export const updateChurnRate = (rate: number): void => {
  try {
    churnRate.set(rate);
  } catch (error) {
    logger.error('Error updating churn rate metrics:', error);
  }
};

// Metrics endpoint
export const getMetrics = async (): Promise<string> => {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error('Error getting metrics:', error);
    throw error;
  }
};

// Health check metrics
export const updateHealthMetrics = (): void => {
  try {
    // Update memory usage
    updateMemoryUsage();

    // Update service health (assuming healthy for now)
    updateServiceHealth(true);

    logger.debug('Health metrics updated successfully');
  } catch (error) {
    logger.error('Error updating health metrics:', error);
  }
};

// Start periodic metrics collection
export const startMetricsCollection = (): void => {
  try {
    // Update metrics every 30 seconds
    setInterval(() => {
      updateHealthMetrics();
    }, 30000);

    logger.info('Metrics collection started');
  } catch (error) {
    logger.error('Error starting metrics collection:', error);
  }
};
