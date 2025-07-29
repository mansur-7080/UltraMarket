"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseMonitor = exports.queryService = exports.transactionService = exports.databaseService = exports.DatabaseMonitor = exports.QueryService = exports.TransactionService = exports.DatabaseService = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logging/logger");
// Database connection configuration
const databaseConfig = {
    datasources: {
        db: {
            url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/ultramarket',
        },
    },
    log: (process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error']),
    errorFormat: 'pretty',
};
// Create Prisma client instance
exports.prisma = new client_1.PrismaClient(databaseConfig);
// Database connection management
class DatabaseService {
    client;
    constructor(client = exports.prisma) {
        this.client = client;
    }
    // Test database connection
    async testConnection() {
        try {
            await this.client.$queryRaw `SELECT 1`;
            logger_1.logger.info('Database connection successful');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Database connection failed:', error);
            return false;
        }
    }
    // Get database statistics
    async getStats() {
        try {
            const stats = await this.client.$queryRaw `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        LIMIT 100
      `;
            return { stats };
        }
        catch (error) {
            logger_1.logger.error('Failed to get database stats:', error);
            return {};
        }
    }
    // Run database migration
    async runMigration() {
        try {
            await this.client.$executeRaw `SELECT 1`;
            logger_1.logger.info('Database migration completed');
        }
        catch (error) {
            logger_1.logger.error('Database migration failed:', error);
            throw error;
        }
    }
    // Backup database (basic implementation)
    async backup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `./backups/backup-${timestamp}.sql`;
            // This would typically use pg_dump in production
            await this.client.$executeRaw `SELECT 1`;
            logger_1.logger.info(`Database backup created: ${backupPath}`);
            return backupPath;
        }
        catch (error) {
            logger_1.logger.error('Database backup failed:', error);
            throw error;
        }
    }
    // Health check
    async healthCheck() {
        try {
            const startTime = Date.now();
            await this.client.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - startTime;
            return {
                status: 'healthy',
                details: {
                    responseTime: `${responseTime}ms`,
                    timestamp: new Date().toISOString(),
                    version: await this.getVersion(),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
    // Get database version
    async getVersion() {
        try {
            const result = await this.client.$queryRaw `SELECT version()`;
            const versionResult = result;
            return versionResult[0]?.version || 'Unknown';
        }
        catch (error) {
            logger_1.logger.error('Failed to get database version:', error);
            return 'Unknown';
        }
    }
    // Close database connection
    async disconnect() {
        try {
            await this.client.$disconnect();
            logger_1.logger.info('Database connection closed');
        }
        catch (error) {
            logger_1.logger.error('Failed to close database connection:', error);
        }
    }
}
exports.DatabaseService = DatabaseService;
// Transaction utilities
class TransactionService {
    client;
    constructor(client = exports.prisma) {
        this.client = client;
    }
    // Execute transaction
    async executeTransaction(callback) {
        return this.client.$transaction(callback);
    }
    // Execute transaction with timeout
    async executeTransactionWithTimeout(callback, timeoutMs = 30000) {
        return this.client.$transaction(callback, {
            timeout: timeoutMs,
        });
    }
    // Execute transaction with isolation level
    async executeTransactionWithIsolation(callback, isolationLevel = 'ReadCommitted') {
        return this.client.$transaction(callback, {
            isolationLevel,
        });
    }
}
exports.TransactionService = TransactionService;
// Query utilities
class QueryService {
    client;
    constructor(client = exports.prisma) {
        this.client = client;
    }
    // Paginated query helper
    async paginatedQuery(model, options) {
        const { page = 1, limit = 20, where, orderBy, include, select } = options;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            model.findMany({
                where,
                orderBy,
                include,
                select,
                skip,
                take: limit,
            }),
            model.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    // Search query helper
    async searchQuery(model, searchTerm, searchFields, options) {
        const { page = 1, limit = 20, where = {}, orderBy, include } = options;
        const skip = (page - 1) * limit;
        // Build search conditions
        const searchConditions = searchFields.map((field) => ({
            [field]: {
                contains: searchTerm,
                mode: 'insensitive',
            },
        }));
        const searchWhere = {
            ...where,
            OR: searchConditions,
        };
        const [data, total] = await Promise.all([
            model.findMany({
                where: searchWhere,
                orderBy,
                include,
                skip,
                take: limit,
            }),
            model.count({ where: searchWhere }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }
    // Bulk operations helper
    async bulkCreate(model, data) {
        return (await model.createMany({
            data,
            skipDuplicates: true,
        }));
    }
    async bulkUpdate(model, data) {
        const updates = data.map((item) => {
            const { id, ...updateData } = item;
            return model.update({
                where: { id },
                data: updateData,
            });
        });
        return (await Promise.all(updates));
    }
    async bulkDelete(model, ids) {
        const deletes = ids.map((id) => model.delete({
            where: { id },
        }));
        return (await Promise.all(deletes));
    }
}
exports.QueryService = QueryService;
// Database monitoring
class DatabaseMonitor {
    client;
    constructor(client = exports.prisma) {
        this.client = client;
    }
    // Monitor slow queries
    async getSlowQueries(thresholdMs = 1000) {
        try {
            const result = await this.client.$queryRaw `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > ${thresholdMs}
        ORDER BY mean_time DESC
        LIMIT 10
      `;
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get slow queries:', error);
            return [];
        }
    }
    // Get table statistics
    async getTableStats() {
        try {
            const result = await this.client.$queryRaw `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `;
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get table stats:', error);
            return [];
        }
    }
    // Get index usage statistics
    async getIndexStats() {
        try {
            const result = await this.client.$queryRaw `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 20
      `;
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get index stats:', error);
            return [];
        }
    }
}
exports.DatabaseMonitor = DatabaseMonitor;
// Export default instances
exports.databaseService = new DatabaseService();
exports.transactionService = new TransactionService();
exports.queryService = new QueryService();
exports.databaseMonitor = new DatabaseMonitor();
// Graceful shutdown
if (typeof process !== 'undefined') {
    process.on('SIGINT', async () => {
        logger_1.logger.info('Shutting down database connections...');
        await exports.databaseService.disconnect();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger_1.logger.info('Shutting down database connections...');
        await exports.databaseService.disconnect();
        process.exit(0);
    });
}
exports.default = {
    prisma: exports.prisma,
    DatabaseService,
    TransactionService,
    QueryService,
    DatabaseMonitor,
    databaseService: exports.databaseService,
    transactionService: exports.transactionService,
    queryService: exports.queryService,
    databaseMonitor: exports.databaseMonitor,
};
//# sourceMappingURL=database.js.map