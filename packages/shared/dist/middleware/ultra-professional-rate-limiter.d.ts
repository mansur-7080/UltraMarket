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
import { Request, Response, NextFunction } from 'express';
export interface RedisClient {
    pipeline(): any;
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<string>;
    zadd(key: string, score: number, member: string): Promise<number>;
    zremrangebyscore(key: string, min: number, max: number): Promise<number>;
    zcard(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    ttl(key: string): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    del(...keys: string[]): Promise<number>;
}
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    enableDynamicAdjustment?: boolean;
    enableBotDetection?: boolean;
    enableGeolocationFiltering?: boolean;
    whitelistEnabled?: boolean;
    blacklistEnabled?: boolean;
    onLimitReached?: (req: Request, res: Response) => void;
    customMessage?: string;
}
export interface RateLimitRule {
    id: string;
    name: string;
    pattern: string | RegExp;
    config: RateLimitConfig;
    priority: number;
    enabled: boolean;
    conditions?: RateLimitCondition[];
}
export interface RateLimitCondition {
    type: 'method' | 'path' | 'user_agent' | 'country' | 'time_window' | 'request_size';
    operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
    value: any;
}
export interface RateLimitStatus {
    remaining: number;
    resetTime: number;
    limit: number;
    windowMs: number;
    blocked: boolean;
    reason?: string;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface ClientMetrics {
    ipAddress: string;
    requestCount: number;
    lastRequest: number;
    suspiciousActivity: number;
    userAgent?: string;
    country?: string;
    asn?: string;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    isWhitelisted: boolean;
    isBlacklisted: boolean;
    behaviorScore: number;
}
export interface ThreatSignature {
    id: string;
    name: string;
    pattern: RegExp;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    action: 'monitor' | 'limit' | 'block';
    description: string;
}
/**
 * Ultra Professional Rate Limiter Class
 */
export declare class UltraProfessionalRateLimiter {
    private redis;
    private rules;
    private whitelist;
    private blacklist;
    private threatSignatures;
    private keyPrefix;
    private metricsPrefix;
    private defaultConfig;
    constructor(redisClient: RedisClient, defaultConfig?: Partial<RateLimitConfig>);
    /**
     * Initialize threat detection signatures
     */
    private initializeThreatSignatures;
    /**
     * Load rate limiting rules from configuration
     */
    private loadRulesFromConfig;
    /**
     * Create Express middleware
     */
    createMiddleware(ruleId?: string, customConfig?: Partial<RateLimitConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Check rate limit for a key
     */
    private checkRateLimit;
    /**
     * Analyze request for threats
     */
    private analyzeThreat;
    /**
     * Check for unusually fast requests
     */
    private checkFastRequests;
    /**
     * Update client metrics for behavior analysis
     */
    private updateClientMetrics;
    /**
     * Dynamic rate limit adjustment based on system load
     */
    private adjustRateLimit;
    /**
     * Get system load percentage
     */
    private getSystemLoad;
    /**
     * Get applicable rule for request
     */
    private getApplicableRule;
    /**
     * Check if request matches rule
     */
    private matchesRule;
    /**
     * Evaluate rate limit condition
     */
    private evaluateCondition;
    /**
     * Generate unique key for rate limiting
     */
    private generateKey;
    /**
     * Get client IP address
     */
    private getClientIP;
    /**
     * Send rate limit response
     */
    private sendRateLimitResponse;
    /**
     * Log security events
     */
    private logSecurityEvent;
    /**
     * Add IP to whitelist
     */
    addToWhitelist(ip: string, reason: string): Promise<void>;
    /**
     * Add IP to blacklist
     */
    addToBlacklist(ip: string, reason: string): Promise<void>;
    /**
     * Remove IP from whitelist
     */
    removeFromWhitelist(ip: string): Promise<void>;
    /**
     * Remove IP from blacklist
     */
    removeFromBlacklist(ip: string): Promise<void>;
    /**
     * Get client metrics
     */
    getClientMetrics(ip: string): Promise<ClientMetrics | null>;
    /**
     * Start maintenance job to clean up old data
     */
    private startMaintenanceJob;
}
export declare const createAuthRateLimiter: (redis: RedisClient) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createAPIRateLimiter: (redis: RedisClient) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createStrictRateLimiter: (redis: RedisClient) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createDefaultRateLimiter: (redis: RedisClient) => UltraProfessionalRateLimiter;
export default UltraProfessionalRateLimiter;
//# sourceMappingURL=ultra-professional-rate-limiter.d.ts.map