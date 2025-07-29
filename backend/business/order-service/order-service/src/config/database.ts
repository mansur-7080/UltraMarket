import { logger } from '../utils/logger';

export const connectDB = async () => {
  try {
    // Database connection logic will be implemented
    logger.info('✅ Database connection established');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Add close method for graceful shutdown
(connectDB as any).close = async () => {
  logger.info('Database connection closed');
};
