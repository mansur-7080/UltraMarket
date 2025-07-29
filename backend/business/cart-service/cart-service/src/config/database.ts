import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env['MONGODB_URL'] || 'mongodb://mongo:mongo123@localhost:27017/ultramarket_cart';

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');

    // Test connection
    await mongoose.connection.db.admin().ping();
    logger.info('✅ MongoDB ping successful');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
});
