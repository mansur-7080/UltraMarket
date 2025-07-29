"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.dropIndexes = exports.createIndexes = exports.getDatabaseStats = exports.healthCheck = exports.getConnectionStatus = exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const mongoOptions = {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
    heartbeatFrequencyMS: 10000,
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 30000,
    },
    readPreference: 'primary',
    compressors: ['zlib'],
    ssl: process.env.NODE_ENV === 'production',
    appName: 'ultramarket-review-service',
};
let isConnected = false;
const connectDB = async () => {
    try {
        if (isConnected) {
            logger_1.logger.info('MongoDB already connected');
            return;
        }
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ultramarket_reviews';
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        logger_1.logger.info('Connecting to MongoDB...', {
            uri: mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
        });
        await mongoose_1.default.connect(mongoUri, mongoOptions);
        isConnected = true;
        logger_1.logger.info('✅ MongoDB connected successfully', {
            host: mongoose_1.default.connection.host,
            port: mongoose_1.default.connection.port,
            database: mongoose_1.default.connection.name,
            readyState: mongoose_1.default.connection.readyState,
        });
        setupConnectionListeners();
    }
    catch (error) {
        logger_1.logger.error('❌ MongoDB connection failed:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        if (!isConnected) {
            logger_1.logger.info('MongoDB already disconnected');
            return;
        }
        await mongoose_1.default.disconnect();
        isConnected = false;
        logger_1.logger.info('✅ MongoDB disconnected successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ MongoDB disconnection failed:', error);
        throw error;
    }
};
exports.disconnectDB = disconnectDB;
const getConnectionStatus = () => {
    return {
        isConnected,
        readyState: mongoose_1.default.connection.readyState,
        host: mongoose_1.default.connection.host,
        port: mongoose_1.default.connection.port,
        database: mongoose_1.default.connection.name,
    };
};
exports.getConnectionStatus = getConnectionStatus;
const setupConnectionListeners = () => {
    mongoose_1.default.connection.on('connected', () => {
        logger_1.logger.info('🔗 MongoDB connection established');
        isConnected = true;
    });
    mongoose_1.default.connection.on('error', (error) => {
        logger_1.logger.error('❌ MongoDB connection error:', error);
        isConnected = false;
    });
    mongoose_1.default.connection.on('disconnected', () => {
        logger_1.logger.warn('🔌 MongoDB connection lost');
        isConnected = false;
    });
    mongoose_1.default.connection.on('reconnected', () => {
        logger_1.logger.info('🔄 MongoDB reconnected');
        isConnected = true;
    });
    mongoose_1.default.connection.on('close', () => {
        logger_1.logger.info('🔒 MongoDB connection closed');
        isConnected = false;
    });
    mongoose_1.default.connection.on('fullsetup', () => {
        logger_1.logger.info('🔗 MongoDB replica set connection established');
    });
    mongoose_1.default.connection.on('all', () => {
        logger_1.logger.warn('⚠️ All MongoDB servers disconnected');
    });
    mongoose_1.default.connection.on('serverSelectionError', (error) => {
        logger_1.logger.error('🔍 MongoDB server selection failed:', error);
    });
};
const healthCheck = async () => {
    try {
        const connectionStatus = (0, exports.getConnectionStatus)();
        if (!connectionStatus.isConnected || connectionStatus.readyState !== 1) {
            return {
                status: 'unhealthy',
                details: {
                    message: 'MongoDB not connected',
                    ...connectionStatus,
                },
            };
        }
        const startTime = Date.now();
        await mongoose_1.default.connection.db.admin().ping();
        const responseTime = Date.now() - startTime;
        return {
            status: 'healthy',
            details: {
                message: 'MongoDB connection healthy',
                responseTime: `${responseTime}ms`,
                ...connectionStatus,
            },
        };
    }
    catch (error) {
        logger_1.logger.error('MongoDB health check failed:', error);
        return {
            status: 'unhealthy',
            details: {
                message: 'MongoDB health check failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                ...(0, exports.getConnectionStatus)(),
            },
        };
    }
};
exports.healthCheck = healthCheck;
const getDatabaseStats = async () => {
    try {
        if (!isConnected) {
            throw new Error('Database not connected');
        }
        const stats = await mongoose_1.default.connection.db.stats();
        return {
            database: mongoose_1.default.connection.name,
            collections: stats.collections,
            objects: stats.objects,
            avgObjSize: stats.avgObjSize,
            dataSize: stats.dataSize,
            storageSize: stats.storageSize,
            indexes: stats.indexes,
            indexSize: stats.indexSize,
            fileSize: stats.fileSize,
            nsSizeMB: stats.nsSizeMB,
            ok: stats.ok,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to get database stats:', error);
        throw error;
    }
};
exports.getDatabaseStats = getDatabaseStats;
const createIndexes = async () => {
    try {
        if (!isConnected) {
            throw new Error('Database not connected');
        }
        logger_1.logger.info('Creating database indexes...');
        const collections = await mongoose_1.default.connection.db.listCollections().toArray();
        for (const collection of collections) {
            const collectionName = collection.name;
            if (collectionName.startsWith('system.')) {
                continue;
            }
            logger_1.logger.info(`Creating indexes for collection: ${collectionName}`);
            if (collectionName === 'reviews') {
                await createReviewIndexes();
            }
        }
        logger_1.logger.info('✅ Database indexes created successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to create database indexes:', error);
        throw error;
    }
};
exports.createIndexes = createIndexes;
const createReviewIndexes = async () => {
    try {
        const reviewsCollection = mongoose_1.default.connection.db.collection('reviews');
        await Promise.all([
            reviewsCollection.createIndex({ productId: 1 }),
            reviewsCollection.createIndex({ userId: 1 }),
            reviewsCollection.createIndex({ rating: 1 }),
            reviewsCollection.createIndex({ verified: 1 }),
            reviewsCollection.createIndex({ moderationStatus: 1 }),
            reviewsCollection.createIndex({ featured: 1 }),
            reviewsCollection.createIndex({ createdAt: -1 }),
            reviewsCollection.createIndex({ updatedAt: -1 }),
            reviewsCollection.createIndex({ productId: 1, rating: -1 }),
            reviewsCollection.createIndex({ productId: 1, moderationStatus: 1 }),
            reviewsCollection.createIndex({ productId: 1, createdAt: -1 }),
            reviewsCollection.createIndex({ userId: 1, createdAt: -1 }),
            reviewsCollection.createIndex({ moderationStatus: 1, createdAt: 1 }),
            reviewsCollection.createIndex({ featured: 1, 'helpful.yes': -1 }),
            reviewsCollection.createIndex({
                productId: 1,
                moderationStatus: 1,
                rating: -1,
                createdAt: -1,
            }),
            reviewsCollection.createIndex({
                title: 'text',
                content: 'text',
                pros: 'text',
                cons: 'text',
            }, {
                weights: {
                    title: 10,
                    content: 5,
                    pros: 3,
                    cons: 3,
                },
                name: 'review_text_search',
            }),
            reviewsCollection.createIndex({ 'metadata.location': '2dsphere' }),
        ]);
        logger_1.logger.info('✅ Review collection indexes created successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to create review indexes:', error);
        throw error;
    }
};
const dropIndexes = async (collectionName) => {
    try {
        if (!isConnected) {
            throw new Error('Database not connected');
        }
        if (collectionName) {
            await mongoose_1.default.connection.db.collection(collectionName).dropIndexes();
            logger_1.logger.info(`Dropped indexes for collection: ${collectionName}`);
        }
        else {
            const collections = await mongoose_1.default.connection.db.listCollections().toArray();
            for (const collection of collections) {
                if (!collection.name.startsWith('system.')) {
                    await mongoose_1.default.connection.db.collection(collection.name).dropIndexes();
                    logger_1.logger.info(`Dropped indexes for collection: ${collection.name}`);
                }
            }
        }
        logger_1.logger.info('✅ Database indexes dropped successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to drop database indexes:', error);
        throw error;
    }
};
exports.dropIndexes = dropIndexes;
const gracefulShutdown = async () => {
    try {
        logger_1.logger.info('Initiating graceful database shutdown...');
        await mongoose_1.default.connection.close();
        logger_1.logger.info('✅ Database shutdown completed');
    }
    catch (error) {
        logger_1.logger.error('❌ Database shutdown failed:', error);
        throw error;
    }
};
exports.gracefulShutdown = gracefulShutdown;
process.on('SIGINT', async () => {
    await (0, exports.gracefulShutdown)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.gracefulShutdown)();
    process.exit(0);
});
exports.default = {
    connectDB: exports.connectDB,
    disconnectDB: exports.disconnectDB,
    getConnectionStatus: exports.getConnectionStatus,
    healthCheck: exports.healthCheck,
    getDatabaseStats: exports.getDatabaseStats,
    createIndexes: exports.createIndexes,
    dropIndexes: exports.dropIndexes,
    gracefulShutdown: exports.gracefulShutdown,
};
//# sourceMappingURL=database.js.map