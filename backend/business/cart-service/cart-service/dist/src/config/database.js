"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const connectMongoDB = async () => {
    try {
        const mongoUri = process.env['MONGODB_URL'] || 'mongodb://mongo:mongo123@localhost:27017/ultramarket_cart';
        await mongoose_1.default.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger_1.logger.info('✅ MongoDB connected successfully');
        await mongoose_1.default.connection.db.admin().ping();
        logger_1.logger.info('✅ MongoDB ping successful');
    }
    catch (error) {
        logger_1.logger.error('❌ MongoDB connection failed:', error);
        throw error;
    }
};
exports.connectMongoDB = connectMongoDB;
process.on('SIGTERM', async () => {
    await mongoose_1.default.connection.close();
    logger_1.logger.info('MongoDB connection closed');
});
process.on('SIGINT', async () => {
    await mongoose_1.default.connection.close();
    logger_1.logger.info('MongoDB connection closed');
});
//# sourceMappingURL=database.js.map