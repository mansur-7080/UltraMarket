"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.testConnection = exports.config = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
exports.prisma = new client_1.PrismaClient({
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
exports.config = {
    database: {
        url: process.env['DATABASE_URL'] ||
            (() => {
                throw new Error('DATABASE_URL environment variable is required');
            })(),
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        username: process.env['DB_USERNAME'] || 'postgres',
        password: process.env['DB_PASSWORD'] ||
            (() => {
                throw new Error('DB_PASSWORD environment variable is required');
            })(),
        database: process.env['DB_NAME'] || 'ultramarket_users',
    },
    redis: {
        url: process.env['REDIS_URL'] ||
            (() => {
                throw new Error('REDIS_URL environment variable is required');
            })(),
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        password: process.env['REDIS_PASSWORD'] ||
            (() => {
                throw new Error('REDIS_PASSWORD environment variable is required');
            })(),
    },
    jwt: {
        secret: process.env['JWT_SECRET'] ||
            (() => {
                throw new Error('JWT_SECRET environment variable is required (minimum 32 characters)');
            })(),
        expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
        refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || '',
        },
    },
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        s3: {
            bucket: process.env.AWS_S3_BUCKET || 'ultramarket-users',
        },
    },
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
};
exports.prisma.$on('query', (e) => {
    logger_1.logger.debug('Query: ' + e.query);
    logger_1.logger.debug('Params: ' + e.params);
    logger_1.logger.debug('Duration: ' + e.duration + 'ms');
});
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma Error: ' + e.message);
});
exports.prisma.$on('info', (e) => {
    logger_1.logger.info('Prisma Info: ' + e.message);
});
exports.prisma.$on('warn', (e) => {
    logger_1.logger.warn('Prisma Warning: ' + e.message);
});
const testConnection = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('✅ Database connection successful');
        return true;
    }
    catch (error) {
        logger_1.logger.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
const disconnectDatabase = async () => {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('Database connection closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
//# sourceMappingURL=database.js.map