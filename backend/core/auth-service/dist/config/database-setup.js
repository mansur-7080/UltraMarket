"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.databaseManager = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const memory_manager_1 = require("../utils/memory-manager");
class DatabaseManager {
    static instance;
    prisma;
    config;
    isConnected = false;
    healthCheckInterval = null;
    constructor() {
        this.config = {
            url: process.env['DATABASE_URL'] || '',
            pool: {
                min: parseInt(process.env['DB_POOL_MIN'] || '2'),
                max: parseInt(process.env['DB_POOL_MAX'] || '10'),
                acquireTimeoutMillis: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
                createTimeoutMillis: parseInt(process.env['DB_CREATE_TIMEOUT'] || '30000'),
                destroyTimeoutMillis: parseInt(process.env['DB_DESTROY_TIMEOUT'] || '5000'),
                idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
                reapIntervalMillis: parseInt(process.env['DB_REAP_INTERVAL'] || '1000'),
                createRetryIntervalMillis: parseInt(process.env['DB_CREATE_RETRY_INTERVAL'] || '200'),
            },
            logging: {
                level: process.env['DB_LOG_LEVEL'] || 'warn',
                slowQueryThreshold: parseInt(process.env['DB_SLOW_QUERY_THRESHOLD'] || '1000'),
            },
        };
        this.prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: this.config.url,
                },
            },
            log: this.getLogLevels(),
        });
        this.registerMemoryCleanup();
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    getClient() {
        return this.prisma;
    }
    async connect() {
        try {
            await this.prisma.$connect();
            this.isConnected = true;
            logger_1.logger.info('✅ Database connected successfully', {
                url: this.maskDatabaseUrl(this.config.url),
                pool: this.config.pool,
            });
            this.startHealthCheck();
        }
        catch (error) {
            logger_1.logger.error('❌ Database connection failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                url: this.maskDatabaseUrl(this.config.url),
            });
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }
            await this.prisma.$disconnect();
            this.isConnected = false;
            logger_1.logger.info('✅ Database disconnected successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Database disconnection failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - startTime;
            return {
                status: 'healthy',
                responseTime,
                details: {
                    isConnected: this.isConnected,
                    poolSize: this.config.pool.max,
                },
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger_1.logger.error('❌ Database health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime,
            });
            return {
                status: 'unhealthy',
                responseTime,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }
    async getStats() {
        try {
            const health = await this.healthCheck();
            return {
                ...health,
                config: {
                    pool: this.config.pool,
                    logging: this.config.logging,
                },
                isConnected: this.isConnected,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get database stats', { error });
            return null;
        }
    }
    registerMemoryCleanup() {
        memory_manager_1.memoryManager.registerCleanupTask('database-connections', () => {
            if (global.gc) {
                global.gc();
            }
        });
    }
    startHealthCheck() {
        const interval = parseInt(process.env['DB_HEALTH_CHECK_INTERVAL'] || '30000');
        this.healthCheckInterval = setInterval(async () => {
            try {
                const health = await this.healthCheck();
                if (health.status === 'unhealthy') {
                    logger_1.logger.error('Database health check failed', { health });
                }
            }
            catch (error) {
                logger_1.logger.error('Database health check error', { error });
            }
        }, interval);
        logger_1.logger.info('Database health check started', { interval });
    }
    getLogLevels() {
        const levels = [];
        switch (this.config.logging.level) {
            case 'query':
                levels.push('query');
            case 'info':
                levels.push('info');
            case 'warn':
                levels.push('warn');
            case 'error':
                levels.push('error');
                break;
            default:
                levels.push('warn', 'error');
        }
        return levels;
    }
    maskDatabaseUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        }
        catch {
            return 'invalid-url';
        }
    }
}
exports.databaseManager = DatabaseManager.getInstance();
exports.prisma = exports.databaseManager.getClient();
//# sourceMappingURL=database-setup.js.map