"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemoryUsage = exports.updateEmailServiceHealth = exports.updateRedisHealth = exports.updateDatabaseHealth = exports.updateServiceHealth = exports.recordBusinessLogicError = exports.recordValidationError = exports.recordRateLimitHit = exports.recordJwtTokenValidation = exports.recordJwtTokenGenerated = exports.recordEmailError = exports.recordEmailSent = exports.recordRedisOperation = exports.recordDatabaseOperation = exports.recordHttpRequest = exports.churnRate = exports.conversionRate = exports.userRetentionRate = exports.responseTimePercentile = exports.errorRate = exports.searchQueries = exports.profileUpdateFrequency = exports.sessionDuration = exports.userEngagement = exports.eventLoopLag = exports.cpuUsage = exports.memoryUsage = exports.emailServiceHealth = exports.redisHealth = exports.databaseHealth = exports.serviceHealth = exports.businessLogicErrors = exports.validationErrors = exports.rateLimitHits = exports.jwtTokenValidations = exports.jwtTokensGenerated = exports.emailErrors = exports.emailSent = exports.redisOperationDuration = exports.redisOperations = exports.databaseOperationDuration = exports.databaseOperations = exports.emailVerifications = exports.passwordResets = exports.userLogouts = exports.userLogins = exports.userRegistrations = exports.activeUsers = exports.httpRequestTotal = exports.httpRequestDuration = void 0;
exports.startMetricsCollection = exports.updateHealthMetrics = exports.getMetrics = exports.updateChurnRate = exports.updateConversionRate = exports.updateUserRetentionRate = exports.updateUserEngagement = exports.recordSessionDuration = exports.recordError = exports.recordSearchQuery = exports.recordProfileUpdate = exports.recordEmailVerification = exports.recordPasswordReset = exports.recordUserLogout = exports.recordUserLogin = exports.recordUserRegistration = exports.updateActiveUsers = void 0;
const prom_client_1 = require("prom-client");
const logger_1 = require("../utils/logger");
(0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});
exports.httpRequestTotal = new prom_client_1.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
exports.activeUsers = new prom_client_1.Gauge({
    name: 'active_users_total',
    help: 'Total number of active users',
});
exports.userRegistrations = new prom_client_1.Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['role'],
});
exports.userLogins = new prom_client_1.Counter({
    name: 'user_logins_total',
    help: 'Total number of user logins',
    labelNames: ['role'],
});
exports.userLogouts = new prom_client_1.Counter({
    name: 'user_logouts_total',
    help: 'Total number of user logouts',
});
exports.passwordResets = new prom_client_1.Counter({
    name: 'password_resets_total',
    help: 'Total number of password reset requests',
});
exports.emailVerifications = new prom_client_1.Counter({
    name: 'email_verifications_total',
    help: 'Total number of email verifications',
});
exports.databaseOperations = new prom_client_1.Counter({
    name: 'database_operations_total',
    help: 'Total number of database operations',
    labelNames: ['operation', 'table'],
});
exports.databaseOperationDuration = new prom_client_1.Histogram({
    name: 'database_operation_duration_seconds',
    help: 'Duration of database operations in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
exports.redisOperations = new prom_client_1.Counter({
    name: 'redis_operations_total',
    help: 'Total number of Redis operations',
    labelNames: ['operation'],
});
exports.redisOperationDuration = new prom_client_1.Histogram({
    name: 'redis_operation_duration_seconds',
    help: 'Duration of Redis operations in seconds',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});
exports.emailSent = new prom_client_1.Counter({
    name: 'emails_sent_total',
    help: 'Total number of emails sent',
    labelNames: ['type'],
});
exports.emailErrors = new prom_client_1.Counter({
    name: 'email_errors_total',
    help: 'Total number of email sending errors',
    labelNames: ['type'],
});
exports.jwtTokensGenerated = new prom_client_1.Counter({
    name: 'jwt_tokens_generated_total',
    help: 'Total number of JWT tokens generated',
    labelNames: ['type'],
});
exports.jwtTokenValidations = new prom_client_1.Counter({
    name: 'jwt_token_validations_total',
    help: 'Total number of JWT token validations',
    labelNames: ['result'],
});
exports.rateLimitHits = new prom_client_1.Counter({
    name: 'rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['endpoint', 'ip'],
});
exports.validationErrors = new prom_client_1.Counter({
    name: 'validation_errors_total',
    help: 'Total number of validation errors',
    labelNames: ['field', 'type'],
});
exports.businessLogicErrors = new prom_client_1.Counter({
    name: 'business_logic_errors_total',
    help: 'Total number of business logic errors',
    labelNames: ['error_type', 'operation'],
});
exports.serviceHealth = new prom_client_1.Gauge({
    name: 'service_health',
    help: 'Service health status (1 = healthy, 0 = unhealthy)',
    labelNames: ['service'],
});
exports.databaseHealth = new prom_client_1.Gauge({
    name: 'database_health',
    help: 'Database health status (1 = healthy, 0 = unhealthy)',
});
exports.redisHealth = new prom_client_1.Gauge({
    name: 'redis_health',
    help: 'Redis health status (1 = healthy, 0 = unhealthy)',
});
exports.emailServiceHealth = new prom_client_1.Gauge({
    name: 'email_service_health',
    help: 'Email service health status (1 = healthy, 0 = unhealthy)',
});
exports.memoryUsage = new prom_client_1.Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type'],
});
exports.cpuUsage = new prom_client_1.Gauge({
    name: 'cpu_usage_percentage',
    help: 'CPU usage percentage',
});
exports.eventLoopLag = new prom_client_1.Histogram({
    name: 'event_loop_lag_seconds',
    help: 'Event loop lag in seconds',
    buckets: [0.001, 0.01, 0.1, 1, 10],
});
exports.userEngagement = new prom_client_1.Gauge({
    name: 'user_engagement_score',
    help: 'User engagement score',
    labelNames: ['user_id'],
});
exports.sessionDuration = new prom_client_1.Histogram({
    name: 'session_duration_seconds',
    help: 'User session duration in seconds',
    buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 28800],
});
exports.profileUpdateFrequency = new prom_client_1.Counter({
    name: 'profile_updates_total',
    help: 'Total number of profile updates',
    labelNames: ['field'],
});
exports.searchQueries = new prom_client_1.Counter({
    name: 'search_queries_total',
    help: 'Total number of search queries',
    labelNames: ['query_type'],
});
exports.errorRate = new prom_client_1.Counter({
    name: 'error_rate_total',
    help: 'Total number of errors',
    labelNames: ['error_type', 'severity'],
});
exports.responseTimePercentile = new prom_client_1.Histogram({
    name: 'response_time_percentile_seconds',
    help: 'Response time percentiles',
    labelNames: ['percentile'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});
exports.userRetentionRate = new prom_client_1.Gauge({
    name: 'user_retention_rate',
    help: 'User retention rate percentage',
});
exports.conversionRate = new prom_client_1.Gauge({
    name: 'conversion_rate',
    help: 'User conversion rate percentage',
    labelNames: ['funnel_step'],
});
exports.churnRate = new prom_client_1.Gauge({
    name: 'churn_rate',
    help: 'User churn rate percentage',
});
const recordHttpRequest = (method, route, statusCode, duration) => {
    try {
        exports.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
        exports.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    }
    catch (error) {
        logger_1.logger.error('Error recording HTTP request metrics:', error);
    }
};
exports.recordHttpRequest = recordHttpRequest;
const recordDatabaseOperation = (operation, table, duration) => {
    try {
        exports.databaseOperations.inc({ operation, table });
        exports.databaseOperationDuration.observe({ operation, table }, duration);
    }
    catch (error) {
        logger_1.logger.error('Error recording database operation metrics:', error);
    }
};
exports.recordDatabaseOperation = recordDatabaseOperation;
const recordRedisOperation = (operation, duration) => {
    try {
        exports.redisOperations.inc({ operation });
        exports.redisOperationDuration.observe({ operation }, duration);
    }
    catch (error) {
        logger_1.logger.error('Error recording Redis operation metrics:', error);
    }
};
exports.recordRedisOperation = recordRedisOperation;
const recordEmailSent = (type) => {
    try {
        exports.emailSent.inc({ type });
    }
    catch (error) {
        logger_1.logger.error('Error recording email sent metrics:', error);
    }
};
exports.recordEmailSent = recordEmailSent;
const recordEmailError = (type) => {
    try {
        exports.emailErrors.inc({ type });
    }
    catch (error) {
        logger_1.logger.error('Error recording email error metrics:', error);
    }
};
exports.recordEmailError = recordEmailError;
const recordJwtTokenGenerated = (type) => {
    try {
        exports.jwtTokensGenerated.inc({ type });
    }
    catch (error) {
        logger_1.logger.error('Error recording JWT token generated metrics:', error);
    }
};
exports.recordJwtTokenGenerated = recordJwtTokenGenerated;
const recordJwtTokenValidation = (result) => {
    try {
        exports.jwtTokenValidations.inc({ result });
    }
    catch (error) {
        logger_1.logger.error('Error recording JWT token validation metrics:', error);
    }
};
exports.recordJwtTokenValidation = recordJwtTokenValidation;
const recordRateLimitHit = (endpoint, ip) => {
    try {
        exports.rateLimitHits.inc({ endpoint, ip });
    }
    catch (error) {
        logger_1.logger.error('Error recording rate limit hit metrics:', error);
    }
};
exports.recordRateLimitHit = recordRateLimitHit;
const recordValidationError = (field, type) => {
    try {
        exports.validationErrors.inc({ field, type });
    }
    catch (error) {
        logger_1.logger.error('Error recording validation error metrics:', error);
    }
};
exports.recordValidationError = recordValidationError;
const recordBusinessLogicError = (errorType, operation) => {
    try {
        exports.businessLogicErrors.inc({ error_type: errorType, operation });
    }
    catch (error) {
        logger_1.logger.error('Error recording business logic error metrics:', error);
    }
};
exports.recordBusinessLogicError = recordBusinessLogicError;
const updateServiceHealth = (isHealthy) => {
    try {
        exports.serviceHealth.set({ service: 'user-service' }, isHealthy ? 1 : 0);
    }
    catch (error) {
        logger_1.logger.error('Error updating service health metrics:', error);
    }
};
exports.updateServiceHealth = updateServiceHealth;
const updateDatabaseHealth = (isHealthy) => {
    try {
        exports.databaseHealth.set(isHealthy ? 1 : 0);
    }
    catch (error) {
        logger_1.logger.error('Error updating database health metrics:', error);
    }
};
exports.updateDatabaseHealth = updateDatabaseHealth;
const updateRedisHealth = (isHealthy) => {
    try {
        exports.redisHealth.set(isHealthy ? 1 : 0);
    }
    catch (error) {
        logger_1.logger.error('Error updating Redis health metrics:', error);
    }
};
exports.updateRedisHealth = updateRedisHealth;
const updateEmailServiceHealth = (isHealthy) => {
    try {
        exports.emailServiceHealth.set(isHealthy ? 1 : 0);
    }
    catch (error) {
        logger_1.logger.error('Error updating email service health metrics:', error);
    }
};
exports.updateEmailServiceHealth = updateEmailServiceHealth;
const updateMemoryUsage = () => {
    try {
        const memUsage = process.memoryUsage();
        exports.memoryUsage.set({ type: 'rss' }, memUsage.rss);
        exports.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
        exports.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
        exports.memoryUsage.set({ type: 'external' }, memUsage.external);
    }
    catch (error) {
        logger_1.logger.error('Error updating memory usage metrics:', error);
    }
};
exports.updateMemoryUsage = updateMemoryUsage;
const updateActiveUsers = (count) => {
    try {
        exports.activeUsers.set(count);
    }
    catch (error) {
        logger_1.logger.error('Error updating active users metrics:', error);
    }
};
exports.updateActiveUsers = updateActiveUsers;
const recordUserRegistration = (role) => {
    try {
        exports.userRegistrations.inc({ role });
    }
    catch (error) {
        logger_1.logger.error('Error recording user registration metrics:', error);
    }
};
exports.recordUserRegistration = recordUserRegistration;
const recordUserLogin = (role) => {
    try {
        exports.userLogins.inc({ role });
    }
    catch (error) {
        logger_1.logger.error('Error recording user login metrics:', error);
    }
};
exports.recordUserLogin = recordUserLogin;
const recordUserLogout = () => {
    try {
        exports.userLogouts.inc();
    }
    catch (error) {
        logger_1.logger.error('Error recording user logout metrics:', error);
    }
};
exports.recordUserLogout = recordUserLogout;
const recordPasswordReset = () => {
    try {
        exports.passwordResets.inc();
    }
    catch (error) {
        logger_1.logger.error('Error recording password reset metrics:', error);
    }
};
exports.recordPasswordReset = recordPasswordReset;
const recordEmailVerification = () => {
    try {
        exports.emailVerifications.inc();
    }
    catch (error) {
        logger_1.logger.error('Error recording email verification metrics:', error);
    }
};
exports.recordEmailVerification = recordEmailVerification;
const recordProfileUpdate = (field) => {
    try {
        exports.profileUpdateFrequency.inc({ field });
    }
    catch (error) {
        logger_1.logger.error('Error recording profile update metrics:', error);
    }
};
exports.recordProfileUpdate = recordProfileUpdate;
const recordSearchQuery = (queryType) => {
    try {
        exports.searchQueries.inc({ query_type: queryType });
    }
    catch (error) {
        logger_1.logger.error('Error recording search query metrics:', error);
    }
};
exports.recordSearchQuery = recordSearchQuery;
const recordError = (errorType, severity) => {
    try {
        exports.errorRate.inc({ error_type: errorType, severity });
    }
    catch (error) {
        logger_1.logger.error('Error recording error metrics:', error);
    }
};
exports.recordError = recordError;
const recordSessionDuration = (duration) => {
    try {
        exports.sessionDuration.observe(duration);
    }
    catch (error) {
        logger_1.logger.error('Error recording session duration metrics:', error);
    }
};
exports.recordSessionDuration = recordSessionDuration;
const updateUserEngagement = (userId, score) => {
    try {
        exports.userEngagement.set({ user_id: userId }, score);
    }
    catch (error) {
        logger_1.logger.error('Error updating user engagement metrics:', error);
    }
};
exports.updateUserEngagement = updateUserEngagement;
const updateUserRetentionRate = (rate) => {
    try {
        exports.userRetentionRate.set(rate);
    }
    catch (error) {
        logger_1.logger.error('Error updating user retention rate metrics:', error);
    }
};
exports.updateUserRetentionRate = updateUserRetentionRate;
const updateConversionRate = (funnelStep, rate) => {
    try {
        exports.conversionRate.set({ funnel_step: funnelStep }, rate);
    }
    catch (error) {
        logger_1.logger.error('Error updating conversion rate metrics:', error);
    }
};
exports.updateConversionRate = updateConversionRate;
const updateChurnRate = (rate) => {
    try {
        exports.churnRate.set(rate);
    }
    catch (error) {
        logger_1.logger.error('Error updating churn rate metrics:', error);
    }
};
exports.updateChurnRate = updateChurnRate;
const getMetrics = async () => {
    try {
        return await prom_client_1.register.metrics();
    }
    catch (error) {
        logger_1.logger.error('Error getting metrics:', error);
        throw error;
    }
};
exports.getMetrics = getMetrics;
const updateHealthMetrics = () => {
    try {
        (0, exports.updateMemoryUsage)();
        (0, exports.updateServiceHealth)(true);
        logger_1.logger.debug('Health metrics updated successfully');
    }
    catch (error) {
        logger_1.logger.error('Error updating health metrics:', error);
    }
};
exports.updateHealthMetrics = updateHealthMetrics;
const startMetricsCollection = () => {
    try {
        setInterval(() => {
            (0, exports.updateHealthMetrics)();
        }, 30000);
        logger_1.logger.info('Metrics collection started');
    }
    catch (error) {
        logger_1.logger.error('Error starting metrics collection:', error);
    }
};
exports.startMetricsCollection = startMetricsCollection;
//# sourceMappingURL=metrics.js.map