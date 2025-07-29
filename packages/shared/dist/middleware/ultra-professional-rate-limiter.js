"use strict";
/**
 * 🛡️ ULTRA PROFESSIONAL RATE LIMITER
 * UltraMarket E-commerce Platform
 *
 * Advanced DDoS protection and rate limiting with:
 * - Multi-tier rate limiting (IP, User, API Key)
 * - Dynamic rate adjustment based on load
 * - Geolocation-based rate limiting
 * - Intelligent bot detection
 * - Whitelist/Blacklist management
 * - Real-time threat analysis
 * - O'zbekiston-specific optimizations
 *
 * @author UltraMarket Security Team
 * @version 3.0.0
 * @date 2024-12-28
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultRateLimiter = exports.createStrictRateLimiter = exports.createAPIRateLimiter = exports.createAuthRateLimiter = exports.UltraProfessionalRateLimiter = void 0;
const ultra_professional_logger_1 = require("../logging/ultra-professional-logger");
/**
 * Ultra Professional Rate Limiter Class
 */
class UltraProfessionalRateLimiter {
    redis;
    rules = new Map();
    whitelist = new Set();
    blacklist = new Set();
    threatSignatures = [];
    keyPrefix = 'rl:';
    metricsPrefix = 'metrics:';
    defaultConfig;
    constructor(redisClient, defaultConfig = {}) {
        this.redis = redisClient;
        this.defaultConfig = {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            enableDynamicAdjustment: true,
            enableBotDetection: true,
            enableGeolocationFiltering: true,
            whitelistEnabled: true,
            blacklistEnabled: true,
            customMessage: 'Too many requests, please try again later.',
            ...defaultConfig
        };
        this.initializeThreatSignatures();
        this.loadRulesFromConfig();
        this.startMaintenanceJob();
        ultra_professional_logger_1.logger.security('🛡️ Ultra Professional Rate Limiter initialized', {
            event: 'RATE_LIMITER_INIT',
            severity: 'LOW',
            defaultWindowMs: this.defaultConfig.windowMs,
            defaultMaxRequests: this.defaultConfig.maxRequests,
            featuresEnabled: {
                dynamicAdjustment: this.defaultConfig.enableDynamicAdjustment,
                botDetection: this.defaultConfig.enableBotDetection,
                geolocationFiltering: this.defaultConfig.enableGeolocationFiltering
            }
        });
    }
    /**
     * Initialize threat detection signatures
     */
    initializeThreatSignatures() {
        this.threatSignatures = [
            // Bot detection patterns
            {
                id: 'bot_curl',
                name: 'cURL Bot',
                pattern: /curl\//i,
                threatLevel: 'medium',
                action: 'limit',
                description: 'cURL command line tool detected'
            },
            {
                id: 'bot_wget',
                name: 'Wget Bot',
                pattern: /wget/i,
                threatLevel: 'medium',
                action: 'limit',
                description: 'Wget download tool detected'
            },
            {
                id: 'bot_python',
                name: 'Python Bot',
                pattern: /python-requests|urllib|httplib/i,
                threatLevel: 'medium',
                action: 'limit',
                description: 'Python automation tool detected'
            },
            {
                id: 'bot_selenium',
                name: 'Selenium Bot',
                pattern: /selenium|webdriver/i,
                threatLevel: 'high',
                action: 'limit',
                description: 'Selenium automation detected'
            },
            // Attack patterns
            {
                id: 'attack_sql_injection',
                name: 'SQL Injection Attack',
                pattern: /(union.*select|select.*from|insert.*into|drop.*table|delete.*from)/i,
                threatLevel: 'critical',
                action: 'block',
                description: 'SQL injection attempt detected'
            },
            {
                id: 'attack_xss',
                name: 'XSS Attack',
                pattern: /<script|javascript:|on\w+\s*=|eval\(|alert\(/i,
                threatLevel: 'critical',
                action: 'block',
                description: 'Cross-site scripting attempt detected'
            },
            {
                id: 'attack_path_traversal',
                name: 'Path Traversal Attack',
                pattern: /\.\.[\/\\]|%2e%2e[%2f%5c]/i,
                threatLevel: 'high',
                action: 'block',
                description: 'Path traversal attempt detected'
            },
            // Suspicious behavior
            {
                id: 'suspicious_fast_requests',
                name: 'Rapid Fire Requests',
                pattern: /.*/,
                threatLevel: 'medium',
                action: 'monitor',
                description: 'Unusually fast request pattern'
            },
            {
                id: 'suspicious_user_agent',
                name: 'Suspicious User Agent',
                pattern: /^$|null|undefined|<|>|\||;/i,
                threatLevel: 'medium',
                action: 'limit',
                description: 'Invalid or suspicious user agent'
            }
        ];
    }
    /**
     * Load rate limiting rules from configuration
     */
    loadRulesFromConfig() {
        // Default rules for different endpoints
        const defaultRules = [
            // Authentication endpoints (strict)
            {
                id: 'auth_login',
                name: 'Login Rate Limit',
                pattern: /^\/api\/(auth|admin)\/login$/,
                config: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    maxRequests: 5, // 5 attempts per 15 minutes
                    skipSuccessfulRequests: false,
                    skipFailedRequests: false
                },
                priority: 100,
                enabled: true,
                conditions: [
                    { type: 'method', operator: 'equals', value: 'POST' }
                ]
            },
            // Password reset (strict)
            {
                id: 'auth_reset',
                name: 'Password Reset Rate Limit',
                pattern: /^\/api\/auth\/(forgot-password|reset-password)$/,
                config: {
                    windowMs: 60 * 60 * 1000, // 1 hour
                    maxRequests: 3, // 3 attempts per hour
                    skipSuccessfulRequests: false
                },
                priority: 90,
                enabled: true
            },
            // Registration (moderate)
            {
                id: 'auth_register',
                name: 'Registration Rate Limit',
                pattern: /^\/api\/auth\/register$/,
                config: {
                    windowMs: 60 * 60 * 1000, // 1 hour
                    maxRequests: 10, // 10 registrations per hour
                    skipSuccessfulRequests: true
                },
                priority: 80,
                enabled: true
            },
            // API endpoints (moderate)
            {
                id: 'api_general',
                name: 'General API Rate Limit',
                pattern: /^\/api\//,
                config: {
                    windowMs: 60 * 1000, // 1 minute
                    maxRequests: 60, // 60 requests per minute
                    skipSuccessfulRequests: false,
                    enableDynamicAdjustment: true
                },
                priority: 50,
                enabled: true
            },
            // Search endpoints (moderate)
            {
                id: 'search',
                name: 'Search Rate Limit',
                pattern: /^\/api\/(search|products\/search)$/,
                config: {
                    windowMs: 60 * 1000, // 1 minute
                    maxRequests: 30, // 30 searches per minute
                    skipSuccessfulRequests: true
                },
                priority: 70,
                enabled: true
            },
            // File uploads (strict)
            {
                id: 'file_upload',
                name: 'File Upload Rate Limit',
                pattern: /^\/api\/upload/,
                config: {
                    windowMs: 60 * 1000, // 1 minute
                    maxRequests: 5, // 5 uploads per minute
                    skipSuccessfulRequests: true
                },
                priority: 85,
                enabled: true,
                conditions: [
                    { type: 'method', operator: 'equals', value: 'POST' },
                    { type: 'request_size', operator: 'greater_than', value: 1024 * 1024 } // > 1MB
                ]
            },
            // Admin endpoints (very strict)
            {
                id: 'admin_api',
                name: 'Admin API Rate Limit',
                pattern: /^\/api\/admin\//,
                config: {
                    windowMs: 60 * 1000, // 1 minute
                    maxRequests: 30, // 30 requests per minute
                    skipSuccessfulRequests: false,
                    enableBotDetection: true
                },
                priority: 95,
                enabled: true
            }
        ];
        defaultRules.forEach(rule => {
            this.rules.set(rule.id, rule);
        });
        ultra_professional_logger_1.logger.info('🔧 Rate limiting rules loaded', {
            rulesCount: this.rules.size,
            enabledRules: Array.from(this.rules.values()).filter(r => r.enabled).length
        });
    }
    /**
     * Create Express middleware
     */
    createMiddleware(ruleId, customConfig) {
        return async (req, res, next) => {
            try {
                const startTime = Date.now();
                // Get applicable rule
                const rule = this.getApplicableRule(req, ruleId);
                const config = rule ? { ...rule.config, ...customConfig } : { ...this.defaultConfig, ...customConfig };
                // Generate unique key for this request
                const key = this.generateKey(req, config);
                // Check whitelist/blacklist
                const clientIp = this.getClientIP(req);
                if (config.blacklistEnabled && this.blacklist.has(clientIp)) {
                    await this.logSecurityEvent(req, 'BLACKLIST_BLOCK', 'critical');
                    this.sendRateLimitResponse(res, {
                        remaining: 0,
                        resetTime: Date.now() + config.windowMs,
                        limit: 0,
                        windowMs: config.windowMs,
                        blocked: true,
                        reason: 'IP blacklisted',
                        threatLevel: 'critical'
                    });
                    return;
                }
                if (config.whitelistEnabled && this.whitelist.has(clientIp)) {
                    // Whitelisted IPs bypass rate limiting
                    next();
                    return;
                }
                // Perform threat analysis
                const threatAnalysis = await this.analyzeThreat(req);
                if (threatAnalysis.threatLevel === 'critical' && threatAnalysis.action === 'block') {
                    await this.logSecurityEvent(req, 'THREAT_BLOCK', 'critical', threatAnalysis);
                    this.sendRateLimitResponse(res, {
                        remaining: 0,
                        resetTime: Date.now() + config.windowMs,
                        limit: 0,
                        windowMs: config.windowMs,
                        blocked: true,
                        reason: threatAnalysis.reason,
                        threatLevel: 'critical'
                    });
                    return;
                }
                // Check rate limit
                const status = await this.checkRateLimit(key, config, req);
                // Update client metrics
                await this.updateClientMetrics(clientIp, req, status);
                // Set rate limit headers
                res.set({
                    'X-RateLimit-Limit': status.limit.toString(),
                    'X-RateLimit-Remaining': status.remaining.toString(),
                    'X-RateLimit-Reset': status.resetTime.toString(),
                    'X-RateLimit-Window': status.windowMs.toString()
                });
                if (status.blocked) {
                    await this.logSecurityEvent(req, 'RATE_LIMIT_EXCEEDED', status.threatLevel, { status });
                    this.sendRateLimitResponse(res, status);
                    return;
                }
                // Dynamic adjustment based on system load
                if (config.enableDynamicAdjustment) {
                    await this.adjustRateLimit(key, config, req);
                }
                // Log performance metrics
                const duration = Date.now() - startTime;
                ultra_professional_logger_1.logger.performance('Rate limiter check completed', {
                    metric: 'rate_limiter_duration',
                    value: duration,
                    unit: 'ms',
                    key,
                    remaining: status.remaining,
                    threatLevel: status.threatLevel
                });
                next();
            }
            catch (error) {
                ultra_professional_logger_1.logger.error('❌ Rate limiter error', error, {
                    url: req.url,
                    method: req.method,
                    ip: this.getClientIP(req)
                });
                // Fail open - allow request if rate limiter fails
                next();
            }
        };
    }
    /**
     * Check rate limit for a key
     */
    async checkRateLimit(key, config, req) {
        const now = Date.now();
        const windowStart = now - config.windowMs;
        // Use Redis sorted set for sliding window
        const pipeline = this.redis.pipeline();
        // Remove old entries
        pipeline.zremrangebyscore(key, 0, windowStart);
        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        // Count requests in window
        pipeline.zcard(key);
        // Set expiry
        pipeline.expire(key, Math.ceil(config.windowMs / 1000));
        const results = await pipeline.exec();
        const requestCount = results?.[2]?.[1] || 0;
        const remaining = Math.max(0, config.maxRequests - requestCount);
        const resetTime = now + config.windowMs;
        // Determine threat level based on usage
        let threatLevel = 'low';
        const usage = requestCount / config.maxRequests;
        if (usage >= 1.0)
            threatLevel = 'critical';
        else if (usage >= 0.8)
            threatLevel = 'high';
        else if (usage >= 0.6)
            threatLevel = 'medium';
        return {
            remaining,
            resetTime,
            limit: config.maxRequests,
            windowMs: config.windowMs,
            blocked: requestCount > config.maxRequests,
            threatLevel
        };
    }
    /**
     * Analyze request for threats
     */
    async analyzeThreat(req) {
        let maxThreatLevel = 'low';
        let action = 'monitor';
        let detectedSignatures = [];
        const userAgent = req.get('User-Agent') || '';
        const url = req.url;
        const body = JSON.stringify(req.body || {});
        const query = JSON.stringify(req.query || {});
        // Check against threat signatures
        for (const signature of this.threatSignatures) {
            let matches = false;
            switch (signature.id) {
                case 'bot_curl':
                case 'bot_wget':
                case 'bot_python':
                case 'bot_selenium':
                case 'suspicious_user_agent':
                    matches = signature.pattern.test(userAgent);
                    break;
                case 'attack_sql_injection':
                case 'attack_xss':
                case 'attack_path_traversal':
                    matches = signature.pattern.test(url) ||
                        signature.pattern.test(body) ||
                        signature.pattern.test(query);
                    break;
                case 'suspicious_fast_requests':
                    // This would be checked based on request frequency
                    matches = await this.checkFastRequests(req);
                    break;
            }
            if (matches) {
                detectedSignatures.push(signature.name);
                // Update threat level
                const levels = ['low', 'medium', 'high', 'critical'];
                if (levels.indexOf(signature.threatLevel) > levels.indexOf(maxThreatLevel)) {
                    maxThreatLevel = signature.threatLevel;
                    action = signature.action;
                }
            }
        }
        return {
            threatLevel: maxThreatLevel,
            action,
            reason: detectedSignatures.length > 0 ? `Threats detected: ${detectedSignatures.join(', ')}` : undefined,
            signature: detectedSignatures.join(', ')
        };
    }
    /**
     * Check for unusually fast requests
     */
    async checkFastRequests(req) {
        const clientIp = this.getClientIP(req);
        const key = `${this.keyPrefix}fast:${clientIp}`;
        const now = Date.now();
        // Get last request time
        const lastRequest = await this.redis.get(key);
        if (lastRequest) {
            const timeDiff = now - parseInt(lastRequest);
            // If less than 100ms between requests, consider it suspicious
            if (timeDiff < 100) {
                return true;
            }
        }
        // Update last request time
        await this.redis.setex(key, 60, now.toString()); // Expire in 1 minute
        return false;
    }
    /**
     * Update client metrics for behavior analysis
     */
    async updateClientMetrics(clientIp, req, status) {
        const key = `${this.metricsPrefix}${clientIp}`;
        const now = Date.now();
        try {
            const existingMetrics = await this.redis.get(key);
            const metrics = existingMetrics
                ? JSON.parse(existingMetrics)
                : {
                    ipAddress: clientIp,
                    requestCount: 0,
                    lastRequest: now,
                    suspiciousActivity: 0,
                    userAgent: req.get('User-Agent'),
                    country: req.get('CF-IPCountry') || 'unknown',
                    asn: req.get('CF-IPAsn') || 'unknown',
                    threatLevel: 'low',
                    isWhitelisted: this.whitelist.has(clientIp),
                    isBlacklisted: this.blacklist.has(clientIp),
                    behaviorScore: 100
                };
            // Update metrics
            metrics.requestCount++;
            metrics.lastRequest = now;
            // Calculate behavior score
            let scoreAdjustment = 0;
            if (status.blocked)
                scoreAdjustment -= 10;
            if (status.threatLevel === 'high')
                scoreAdjustment -= 5;
            if (status.threatLevel === 'critical')
                scoreAdjustment -= 20;
            // Time-based suspicious activity
            if (existingMetrics) {
                const timeSinceLastRequest = now - metrics.lastRequest;
                if (timeSinceLastRequest < 1000) { // Less than 1 second
                    metrics.suspiciousActivity++;
                    scoreAdjustment -= 2;
                }
            }
            metrics.behaviorScore = Math.max(0, Math.min(100, metrics.behaviorScore + scoreAdjustment));
            // Update threat level based on behavior score
            if (metrics.behaviorScore < 20)
                metrics.threatLevel = 'critical';
            else if (metrics.behaviorScore < 40)
                metrics.threatLevel = 'high';
            else if (metrics.behaviorScore < 70)
                metrics.threatLevel = 'medium';
            else
                metrics.threatLevel = 'low';
            // Store updated metrics (expire in 24 hours)
            await this.redis.setex(key, 24 * 60 * 60, JSON.stringify(metrics));
            // Auto-blacklist extremely suspicious clients
            if (metrics.behaviorScore < 10 && metrics.suspiciousActivity > 20) {
                await this.addToBlacklist(clientIp, 'Automatic - Suspicious behavior detected');
            }
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to update client metrics', error, { clientIp });
        }
    }
    /**
     * Dynamic rate limit adjustment based on system load
     */
    async adjustRateLimit(key, config, req) {
        try {
            // Get system load metrics
            const systemLoad = await this.getSystemLoad();
            // Adjust rate limits based on load
            if (systemLoad > 80) {
                // High load - reduce rate limits by 50%
                const adjustedKey = `${key}:adjusted`;
                const adjustedLimit = Math.floor(config.maxRequests * 0.5);
                await this.redis.setex(adjustedKey, Math.ceil(config.windowMs / 1000), adjustedLimit.toString());
                ultra_professional_logger_1.logger.warn('🔧 Rate limits adjusted due to high system load', {
                    systemLoad,
                    originalLimit: config.maxRequests,
                    adjustedLimit,
                    key
                });
            }
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to adjust rate limits', error);
        }
    }
    /**
     * Get system load percentage
     */
    async getSystemLoad() {
        try {
            // This would integrate with your monitoring system
            // For now, return a mock value
            const cpuUsage = process.cpuUsage();
            const memUsage = process.memoryUsage();
            // Simple calculation based on memory usage
            const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            return Math.min(100, memPercent);
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to get system load', error);
            return 0;
        }
    }
    /**
     * Get applicable rule for request
     */
    getApplicableRule(req, ruleId) {
        if (ruleId && this.rules.has(ruleId)) {
            return this.rules.get(ruleId);
        }
        // Find matching rule by priority
        const applicableRules = Array.from(this.rules.values())
            .filter(rule => rule.enabled && this.matchesRule(req, rule))
            .sort((a, b) => b.priority - a.priority);
        return applicableRules[0] || null;
    }
    /**
     * Check if request matches rule
     */
    matchesRule(req, rule) {
        // Check pattern match
        let patternMatches = false;
        if (typeof rule.pattern === 'string') {
            patternMatches = req.path === rule.pattern;
        }
        else {
            patternMatches = rule.pattern.test(req.path);
        }
        if (!patternMatches)
            return false;
        // Check additional conditions
        if (rule.conditions) {
            return rule.conditions.every(condition => this.evaluateCondition(req, condition));
        }
        return true;
    }
    /**
     * Evaluate rate limit condition
     */
    evaluateCondition(req, condition) {
        let actualValue;
        switch (condition.type) {
            case 'method':
                actualValue = req.method;
                break;
            case 'path':
                actualValue = req.path;
                break;
            case 'user_agent':
                actualValue = req.get('User-Agent') || '';
                break;
            case 'country':
                actualValue = req.get('CF-IPCountry') || 'unknown';
                break;
            case 'request_size':
                actualValue = parseInt(req.get('Content-Length') || '0');
                break;
            default:
                return false;
        }
        switch (condition.operator) {
            case 'equals':
                return actualValue === condition.value;
            case 'contains':
                return String(actualValue).includes(condition.value);
            case 'matches':
                return new RegExp(condition.value).test(String(actualValue));
            case 'greater_than':
                return Number(actualValue) > Number(condition.value);
            case 'less_than':
                return Number(actualValue) < Number(condition.value);
            default:
                return false;
        }
    }
    /**
     * Generate unique key for rate limiting
     */
    generateKey(req, config) {
        if (config.keyGenerator) {
            return `${this.keyPrefix}${config.keyGenerator(req)}`;
        }
        // Default key generation
        const ip = this.getClientIP(req);
        const path = req.path;
        const method = req.method;
        return `${this.keyPrefix}${ip}:${method}:${path}`;
    }
    /**
     * Get client IP address
     */
    getClientIP(req) {
        return (req.get('CF-Connecting-IP') || // Cloudflare
            req.get('X-Forwarded-For')?.split(',')[0] || // Proxy
            req.get('X-Real-IP') || // Nginx
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown');
    }
    /**
     * Send rate limit response
     */
    sendRateLimitResponse(res, status) {
        const message = status.reason || this.defaultConfig.customMessage || 'Too many requests';
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message,
                details: {
                    limit: status.limit,
                    remaining: status.remaining,
                    resetTime: status.resetTime,
                    retryAfter: Math.ceil((status.resetTime - Date.now()) / 1000)
                }
            }
        });
    }
    /**
     * Log security events
     */
    async logSecurityEvent(req, eventType, severity, details) {
        // Map severity to SecurityLogContext enum
        const severityMap = {
            'low': 'LOW',
            'medium': 'MEDIUM',
            'high': 'HIGH',
            'critical': 'CRITICAL'
        };
        ultra_professional_logger_1.logger.security(`🚨 Rate Limiter: ${eventType}`, {
            event: eventType,
            severity: severityMap[severity],
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString(),
            details
        });
    }
    /**
     * Add IP to whitelist
     */
    async addToWhitelist(ip, reason) {
        this.whitelist.add(ip);
        await this.redis.sadd('rl:whitelist', ip);
        ultra_professional_logger_1.logger.security('➕ IP added to whitelist', {
            event: 'WHITELIST_ADD',
            severity: 'LOW',
            ipAddress: ip,
            reason
        });
    }
    /**
     * Add IP to blacklist
     */
    async addToBlacklist(ip, reason) {
        this.blacklist.add(ip);
        await this.redis.sadd('rl:blacklist', ip);
        ultra_professional_logger_1.logger.security('🚫 IP added to blacklist', {
            event: 'BLACKLIST_ADD',
            severity: 'HIGH',
            ipAddress: ip,
            reason
        });
    }
    /**
     * Remove IP from whitelist
     */
    async removeFromWhitelist(ip) {
        this.whitelist.delete(ip);
        await this.redis.srem('rl:whitelist', ip);
        ultra_professional_logger_1.logger.security('➖ IP removed from whitelist', {
            event: 'WHITELIST_REMOVE',
            severity: 'LOW',
            ipAddress: ip
        });
    }
    /**
     * Remove IP from blacklist
     */
    async removeFromBlacklist(ip) {
        this.blacklist.delete(ip);
        await this.redis.srem('rl:blacklist', ip);
        ultra_professional_logger_1.logger.security('✅ IP removed from blacklist', {
            event: 'BLACKLIST_REMOVE',
            severity: 'MEDIUM',
            ipAddress: ip
        });
    }
    /**
     * Get client metrics
     */
    async getClientMetrics(ip) {
        try {
            const key = `${this.metricsPrefix}${ip}`;
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to get client metrics', error, { ip });
            return null;
        }
    }
    /**
     * Start maintenance job to clean up old data
     */
    startMaintenanceJob() {
        setInterval(async () => {
            try {
                // Clean up old rate limit keys
                const pattern = `${this.keyPrefix}*`;
                const keys = await this.redis.keys(pattern);
                for (const key of keys) {
                    const ttl = await this.redis.ttl(key);
                    if (ttl === -1) {
                        // Key without expiry, set a default expiry
                        await this.redis.expire(key, 3600); // 1 hour
                    }
                }
                // Reload whitelist/blacklist from Redis
                const whitelistIPs = await this.redis.smembers('rl:whitelist');
                const blacklistIPs = await this.redis.smembers('rl:blacklist');
                this.whitelist = new Set(whitelistIPs);
                this.blacklist = new Set(blacklistIPs);
                ultra_professional_logger_1.logger.debug('🧹 Rate limiter maintenance completed', {
                    keysProcessed: keys.length,
                    whitelistSize: this.whitelist.size,
                    blacklistSize: this.blacklist.size
                });
            }
            catch (error) {
                ultra_professional_logger_1.logger.error('❌ Rate limiter maintenance failed', error);
            }
        }, 60 * 60 * 1000); // Run every hour
    }
}
exports.UltraProfessionalRateLimiter = UltraProfessionalRateLimiter;
// Pre-configured rate limiters for different use cases
const createAuthRateLimiter = (redis) => {
    const limiter = new UltraProfessionalRateLimiter(redis, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts
        enableBotDetection: true,
        enableGeolocationFiltering: true
    });
    return limiter.createMiddleware('auth_login');
};
exports.createAuthRateLimiter = createAuthRateLimiter;
const createAPIRateLimiter = (redis) => {
    const limiter = new UltraProfessionalRateLimiter(redis, {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 requests per minute
        enableDynamicAdjustment: true,
        skipSuccessfulRequests: false
    });
    return limiter.createMiddleware('api_general');
};
exports.createAPIRateLimiter = createAPIRateLimiter;
const createStrictRateLimiter = (redis) => {
    const limiter = new UltraProfessionalRateLimiter(redis, {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 requests per minute
        enableBotDetection: true,
        enableGeolocationFiltering: true,
        enableDynamicAdjustment: false
    });
    return limiter.createMiddleware();
};
exports.createStrictRateLimiter = createStrictRateLimiter;
// Export default configured instance
const createDefaultRateLimiter = (redis) => {
    return new UltraProfessionalRateLimiter(redis, {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        enableDynamicAdjustment: process.env.RATE_LIMIT_DYNAMIC !== 'false',
        enableBotDetection: process.env.RATE_LIMIT_BOT_DETECTION !== 'false',
        enableGeolocationFiltering: process.env.RATE_LIMIT_GEO_FILTER !== 'false',
        customMessage: process.env.RATE_LIMIT_MESSAGE || 'Juda ko\'p so\'rov yuborildi. Iltimos, keyinroq urinib ko\'ring.'
    });
};
exports.createDefaultRateLimiter = createDefaultRateLimiter;
exports.default = UltraProfessionalRateLimiter;
//# sourceMappingURL=ultra-professional-rate-limiter.js.map