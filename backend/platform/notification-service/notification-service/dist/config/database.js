"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseHealth = exports.getDatabaseClient = exports.disconnectDatabase = exports.connectDatabase = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
let prisma;
const connectDatabase = async () => {
    try {
        prisma = new client_1.PrismaClient({
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
        });
        // Log database events
        prisma.$on('query', (e) => {
            logger_1.logger.debug('Database query', {
                query: e.query,
                params: e.params,
                duration: e.duration,
            });
        });
        prisma.$on('error', (e) => {
            logger_1.logger.error('Database error', {
                message: e.message,
                target: e.target,
            });
        });
        prisma.$on('info', (e) => {
            logger_1.logger.info('Database info', {
                message: e.message,
                target: e.target,
            });
        });
        prisma.$on('warn', (e) => {
            logger_1.logger.warn('Database warning', {
                message: e.message,
                target: e.target,
            });
        });
        // Test the connection
        await prisma.$connect();
        logger_1.logger.info('Database connected successfully');
        return prisma;
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to database', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        if (prisma) {
            await prisma.$disconnect();
            logger_1.logger.info('Database disconnected successfully');
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to disconnect from database', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};
exports.disconnectDatabase = disconnectDatabase;
const getDatabaseClient = () => {
    if (!prisma) {
        throw new Error('Database not connected. Call connectDatabase() first.');
    }
    return prisma;
};
exports.getDatabaseClient = getDatabaseClient;
const checkDatabaseHealth = async () => {
    try {
        const start = Date.now();
        await prisma.$queryRaw `SELECT 1`;
        const responseTime = Date.now() - start;
        return {
            status: 'healthy',
            responseTime,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        logger_1.logger.error('Database health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
//# sourceMappingURL=database.js.map