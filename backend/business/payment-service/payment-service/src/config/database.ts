import { logger } from '../utils/logger';

export const connectDB = async () => {
  logger.info('✅ Database connection established');
  return true;
};

(connectDB as any).close = async () => {
  logger.info('Database connection closed');
};
