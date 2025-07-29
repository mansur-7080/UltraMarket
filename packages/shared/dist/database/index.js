"use strict";
/**
 * UltraMarket E-Commerce Platform
 * Professional TypeScript Database Client
 * Enterprise-Grade Database Management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbAuditLogs = exports.dbMetrics = exports.dbHealth = exports.db = exports.database = exports.DatabaseClient = void 0;
const tslib_1 = require("tslib");
// import { PrismaClient, Prisma } from '@prisma/client'; // Optional import
let PrismaClient = null;
let Prisma = null;
try {
    const prisma = require('@prisma/client');
    PrismaClient = prisma.PrismaClient;
    Prisma = prisma.Prisma;
}
catch (error) {
    console.warn('Prisma not available, using fallback');
    PrismaClient = class MockPrismaClient {
        constructor() { }
        async $connect() { }
        async $disconnect() { }
    };
    Prisma = {
        TransactionIsolationLevel: {
            ReadUncommitted: 'ReadUncommitted',
            ReadCommitted: 'ReadCommitted',
            RepeatableRead: 'RepeatableRead',
            Serializable: 'Serializable'
        }
    };
}
const winston_1 = tslib_1.__importDefault(require("winston"));
const perf_hooks_1 = require("perf_hooks");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
var DatabaseOperation;
(function (DatabaseOperation) {
    DatabaseOperation["CREATE"] = "CREATE";
    DatabaseOperation["READ"] = "READ";
    DatabaseOperation["UPDATE"] = "UPDATE";
    DatabaseOperation["DELETE"] = "DELETE";
    DatabaseOperation["BULK_INSERT"] = "BULK_INSERT";
    DatabaseOperation["BULK_UPDATE"] = "BULK_UPDATE";
    DatabaseOperation["BULK_DELETE"] = "BULK_DELETE";
})(DatabaseOperation || (DatabaseOperation = {}));
// ===== CONFIGURATION =====
const DATABASE_CONFIG = {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ultramarket',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
    logLevel: process.env.DB_LOG_LEVEL || 'warn',
    enableMetrics: process.env.DB_ENABLE_METRICS === 'true',
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000')
};
// ===== LOGGER CONFIGURATION =====
const dbLogger = winston_1.default.createLogger({
    level: DATABASE_CONFIG.logLevel,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'database' },
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
        }),
        new winston_1.default.transports.File({
            filename: 'logs/database-error.log',
            level: 'error'
        }),
        new winston_1.default.transports.File({
            filename: 'logs/database.log'
        })
    ]
});
// ===== PRISMA CLIENT CONFIGURATION =====
const prismaClientConfig = {
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
    ],
    errorFormat: 'pretty',
    rejectOnNotFound: false
};
// ===== DATABASE CLIENT CLASS =====
class DatabaseClient {
    static instance;
    prisma; // Changed from PrismaClient to any
    metrics;
    health;
    auditLogs = [];
    queryCache = new Map();
    isConnected = false;
    constructor() {
        this.prisma = new PrismaClient(prismaClientConfig);
        this.metrics = {
            totalQueries: 0,
            slowQueries: 0,
            failedQueries: 0,
            averageResponseTime: 0,
            connectionPoolSize: DATABASE_CONFIG.maxConnections,
            activeConnections: 0,
            peakConnections: 0,
            cacheHitRate: 0
        };
        this.health = {
            status: 'unhealthy',
            responseTime: 0,
            connections: {
                active: 0,
                idle: 0,
                total: 0,
                max: DATABASE_CONFIG.maxConnections
            },
            queries: {
                running: 0,
                queued: 0,
                completed: 0
            },
            lastCheck: new Date(),
            uptime: 0
        };
        this.setupEventListeners();
        this.startHealthMonitoring();
    }
    static getInstance() {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new DatabaseClient();
        }
        return DatabaseClient.instance;
    }
    setupEventListeners() {
        // Query event logging
        this.prisma.$on('query', (e) => {
            this.metrics.totalQueries++;
            if (e.duration > 1000) { // Slow query threshold: 1 second
                this.metrics.slowQueries++;
                dbLogger.warn('Slow query detected', {
                    query: e.query,
                    duration: e.duration,
                    params: e.params
                });
            }
            if (DATABASE_CONFIG.logLevel === 'query') {
                dbLogger.debug('Database query', {
                    query: e.query,
                    duration: e.duration,
                    params: e.params
                });
            }
        });
        // Error event logging
        this.prisma.$on('error', (e) => {
            this.metrics.failedQueries++;
            dbLogger.error('Database error', {
                message: e.message,
                target: e.target
            });
        });
        // Info and warn events
        this.prisma.$on('info', (e) => {
            dbLogger.info('Database info', e);
        });
        this.prisma.$on('warn', (e) => {
            dbLogger.warn('Database warning', e);
        });
    }
    async connect() {
        try {
            dbLogger.info('Connecting to database...');
            await this.prisma.$connect();
            this.isConnected = true;
            // Test connection
            await this.prisma.$queryRaw `SELECT 1`;
            this.health.status = 'healthy';
            this.health.uptime = Date.now();
            dbLogger.info('Database connected successfully', {
                url: this.maskDatabaseUrl(DATABASE_CONFIG.url),
                maxConnections: DATABASE_CONFIG.maxConnections
            });
        }
        catch (error) {
            this.health.status = 'unhealthy';
            dbLogger.error('Failed to connect to database', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            this.isConnected = false;
            this.health.status = 'unhealthy';
            dbLogger.info('Database disconnected');
        }
        catch (error) {
            dbLogger.error('Error disconnecting from database', error);
            throw error;
        }
    }
    // ===== QUERY METHODS WITH MONITORING =====
    async findUnique(model, args, options) {
        const startTime = perf_hooks_1.performance.now();
        const queryId = this.generateQueryId(model, 'findUnique', args);
        try {
            // Check cache first
            if (options?.cache) {
                const cached = this.getFromCache(queryId);
                if (cached) {
                    return cached;
                }
            }
            const result = await this.prisma[model].findUnique(args);
            // Cache the result
            if (options?.cache && result) {
                this.setCache(queryId, result, options.ttl || 300000); // 5 minutes default
            }
            this.recordQueryMetrics(startTime, true);
            return result;
        }
        catch (error) {
            this.recordQueryMetrics(startTime, false);
            throw this.handleDatabaseError(error, 'findUnique', model);
        }
    }
    async findMany(model, args, options) {
        const startTime = perf_hooks_1.performance.now();
        const queryId = this.generateQueryId(model, 'findMany', args);
        try {
            // Check cache first
            if (options?.cache) {
                const cached = this.getFromCache(queryId);
                if (cached) {
                    return cached;
                }
            }
            const result = await this.prisma[model].findMany(args);
            // Cache the result
            if (options?.cache) {
                this.setCache(queryId, result, options.ttl || 300000); // 5 minutes default
            }
            this.recordQueryMetrics(startTime, true);
            return result;
        }
        catch (error) {
            this.recordQueryMetrics(startTime, false);
            throw this.handleDatabaseError(error, 'findMany', model);
        }
    }
    async create(model, args, userId) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const result = await this.prisma[model].create(args);
            // Audit logging
            this.logAudit({
                operation: DatabaseOperation.CREATE,
                table: model,
                recordId: result.id,
                userId,
                after: result,
                duration: perf_hooks_1.performance.now() - startTime,
                success: true
            });
            this.recordQueryMetrics(startTime, true);
            this.invalidateCache(model);
            return result;
        }
        catch (error) {
            this.recordQueryMetrics(startTime, false);
            // Audit failed operation
            this.logAudit({
                operation: DatabaseOperation.CREATE,
                table: model,
                userId,
                duration: perf_hooks_1.performance.now() - startTime,
                success: false,
                error: error.message
            });
            throw this.handleDatabaseError(error, 'create', model);
        }
    }
    async update(model, args, userId) {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Get the record before update for audit
            const before = args.where ? await this.prisma[model].findUnique({
                where: args.where
            }) : null;
            const result = await this.prisma[model].update(args);
            // Audit logging
            this.logAudit({
                operation: DatabaseOperation.UPDATE,
                table: model,
                recordId: result.id,
                userId,
                before,
                after: result,
                duration: perf_hooks_1.performance.now() - startTime,
                success: true
            });
            this.recordQueryMetrics(startTime, true);
            this.invalidateCache(model);
            return result;
        }
        catch (error) {
            this.recordQueryMetrics(startTime, false);
            // Audit failed operation
            this.logAudit({
                operation: DatabaseOperation.UPDATE,
                table: model,
                userId,
                duration: perf_hooks_1.performance.now() - startTime,
                success: false,
                error: error.message
            });
            throw this.handleDatabaseError(error, 'update', model);
        }
    }
    async delete(model, args, userId) {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Get the record before delete for audit
            const before = await this.prisma[model].findUnique({
                where: args.where
            });
            const result = await this.prisma[model].delete(args);
            // Audit logging
            this.logAudit({
                operation: DatabaseOperation.DELETE,
                table: model,
                recordId: before?.id,
                userId,
                before,
                duration: perf_hooks_1.performance.now() - startTime,
                success: true
            });
            this.recordQueryMetrics(startTime, true);
            this.invalidateCache(model);
            return result;
        }
        catch (error) {
            this.recordQueryMetrics(startTime, false);
            // Audit failed operation
            this.logAudit({
                operation: DatabaseOperation.DELETE,
                table: model,
                userId,
                duration: perf_hooks_1.performance.now() - startTime,
                success: false,
                error: error.message
            });
            throw this.handleDatabaseError(error, 'delete', model);
        }
    }
    // ===== TRANSACTION SUPPORT =====
    async transaction(operations, options) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const result = await this.prisma.$transaction(operations, {
                timeout: options?.timeout || DATABASE_CONFIG.queryTimeout,
                isolationLevel: options?.isolationLevel,
                maxWait: options?.maxWait || 5000
            });
            this.recordQueryMetrics(startTime, true);
            return result;
        }
        catch (error) {
            this.recordQueryMetrics(startTime, false);
            throw this.handleDatabaseError(error, 'transaction', 'multiple');
        }
    }
    // ===== RAW QUERIES =====
    async query(sql, values) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const result = await this.prisma.$queryRawUnsafe(sql, ...(values || []));
            this.recordQueryMetrics(startTime, true);
            return result;
        }
        catch (error) {
            this.recordQueryMetrics(startTime, false);
            throw this.handleDatabaseError(error, 'rawQuery', 'raw');
        }
    }
    async execute(sql, values) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const result = await this.prisma.$executeRawUnsafe(sql, ...(values || []));
            this.recordQueryMetrics(startTime, true);
            return result;
        }
        catch (error) {
            this.recordQueryMetrics(startTime, false);
            throw this.handleDatabaseError(error, 'rawExecute', 'raw');
        }
    }
    // ===== HEALTH MONITORING =====
    async healthCheck() {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Test basic connectivity
            await this.prisma.$queryRaw `SELECT 1`;
            // Get connection pool info (if available)
            const responseTime = perf_hooks_1.performance.now() - startTime;
            this.health = {
                status: responseTime < 1000 ? 'healthy' : 'degraded',
                responseTime,
                connections: {
                    active: this.metrics.activeConnections,
                    idle: DATABASE_CONFIG.maxConnections - this.metrics.activeConnections,
                    total: this.metrics.activeConnections,
                    max: DATABASE_CONFIG.maxConnections
                },
                queries: {
                    running: 0, // Would need database-specific queries to get this
                    queued: 0,
                    completed: this.metrics.totalQueries
                },
                lastCheck: new Date(),
                uptime: this.health.uptime ? Date.now() - this.health.uptime : 0
            };
            return this.health;
        }
        catch (error) {
            this.health.status = 'unhealthy';
            this.health.lastCheck = new Date();
            throw error;
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getAuditLogs(limit = 100) {
        return this.auditLogs.slice(-limit);
    }
    // ===== UTILITY METHODS =====
    recordQueryMetrics(startTime, success) {
        const duration = perf_hooks_1.performance.now() - startTime;
        if (success) {
            this.metrics.averageResponseTime =
                (this.metrics.averageResponseTime + duration) / 2;
        }
        this.metrics.totalQueries++;
        if (duration > 1000) {
            this.metrics.slowQueries++;
        }
    }
    handleDatabaseError(error, operation, model) {
        const errorMessage = `Database ${operation} failed for ${model}: ${error.message}`;
        if (error.code === 'P2002') {
            return new Error(`Unique constraint violation: ${error.meta?.target}`);
        }
        else if (error.code === 'P2025') {
            return new Error('Record not found');
        }
        else if (error.code === 'P2003') {
            return new Error('Foreign key constraint violation');
        }
        return new Error(errorMessage);
    }
    logAudit(log) {
        const auditEntry = {
            id: crypto_1.default.randomBytes(16).toString('hex'),
            operation: log.operation,
            table: log.table,
            recordId: log.recordId,
            userId: log.userId,
            before: log.before,
            after: log.after,
            timestamp: new Date(),
            duration: log.duration,
            success: log.success,
            error: log.error
        };
        this.auditLogs.push(auditEntry);
        // Keep only last 1000 audit logs in memory
        if (this.auditLogs.length > 1000) {
            this.auditLogs = this.auditLogs.slice(-1000);
        }
        // Log to file for persistent storage
        dbLogger.info('Database audit', auditEntry);
    }
    generateQueryId(model, operation, args) {
        const key = `${model}:${operation}:${JSON.stringify(args)}`;
        return crypto_1.default.createHash('md5').update(key).digest('hex');
    }
    getFromCache(key) {
        const cached = this.queryCache.get(key);
        if (cached && Date.now() < cached.timestamp + cached.ttl) {
            this.metrics.cacheHitRate++;
            return cached.data;
        }
        return null;
    }
    setCache(key, data, ttl) {
        this.queryCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        // Clean expired cache entries
        if (this.queryCache.size > 1000) {
            this.cleanCache();
        }
    }
    invalidateCache(model) {
        for (const [key] of this.queryCache.entries()) {
            if (key.startsWith(`${model}:`)) {
                this.queryCache.delete(key);
            }
        }
    }
    cleanCache() {
        const now = Date.now();
        for (const [key, cached] of this.queryCache.entries()) {
            if (now >= cached.timestamp + cached.ttl) {
                this.queryCache.delete(key);
            }
        }
    }
    maskDatabaseUrl(url) {
        return url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    }
    startHealthMonitoring() {
        setInterval(async () => {
            try {
                await this.healthCheck();
            }
            catch (error) {
                dbLogger.error('Health check failed', error);
            }
        }, 30000); // Check every 30 seconds
    }
    // ===== PUBLIC API =====
    get client() {
        return this.prisma;
    }
    get isHealthy() {
        return this.health.status === 'healthy';
    }
    get status() {
        return { ...this.health };
    }
}
exports.DatabaseClient = DatabaseClient;
// ===== SINGLETON EXPORT =====
exports.database = DatabaseClient.getInstance();
// ===== CONVENIENCE EXPORTS =====
exports.db = exports.database.client;
const dbHealth = () => exports.database.healthCheck();
exports.dbHealth = dbHealth;
const dbMetrics = () => exports.database.getMetrics();
exports.dbMetrics = dbMetrics;
const dbAuditLogs = (limit) => exports.database.getAuditLogs(limit);
exports.dbAuditLogs = dbAuditLogs;
// ===== DEFAULT EXPORT =====
exports.default = exports.database;
//# sourceMappingURL=index.js.map