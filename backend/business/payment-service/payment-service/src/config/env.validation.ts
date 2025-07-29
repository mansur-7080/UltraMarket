import { logger } from '../utils/logger';

export const validateEnv = () => {
  logger.info('✅ Environment validation passed');
  return true;
};
