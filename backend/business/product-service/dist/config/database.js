"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("@ultramarket/shared/logging/logger");
const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/ultramarket_products';
const connectDatabase = async () => {
    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
            bufferMaxEntries: 0,
        };
        await mongoose_1.default.connect(MONGODB_URI, options);
        logger_1.logger.info('MongoDB connected successfully', {
            host: mongoose_1.default.connection.host,
            database: mongoose_1.default.connection.name,
        });
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.logger.error('MongoDB connection error', { error });
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB reconnected');
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to MongoDB', { error });
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.disconnect();
        logger_1.logger.info('MongoDB disconnected successfully');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from MongoDB', { error });
        throw error;
    }
};
exports.disconnectDatabase = disconnectDatabase;
//# sourceMappingURL=database.js.map