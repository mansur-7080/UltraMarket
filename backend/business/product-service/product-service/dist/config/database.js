"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const shared_1 = require("@ultramarket/shared");
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ultramarket_products';
        await mongoose_1.default.connect(mongoUri, {
            // Modern MongoDB driver options
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        shared_1.logger.info('MongoDB connected successfully');
        // Handle connection events
        mongoose_1.default.connection.on('error', (error) => {
            shared_1.logger.error('MongoDB connection error:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            shared_1.logger.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            shared_1.logger.info('MongoDB reconnected');
        });
    }
    catch (error) {
        shared_1.logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=database.js.map