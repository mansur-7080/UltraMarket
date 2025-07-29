import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

export const connectDatabase = async () => {
  try {
    prisma = new PrismaClient({
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

    // Log database events
    prisma.$on('query', (e) => {
      logger.debug('Database query', {
        query: e.query,
        params: e.params,
        duration: e.duration,
      });
    });

    prisma.$on('error', (e) => {
      logger.error('Database error', {
        message: e.message,
        target: e.target,
      });
    });

    prisma.$on('info', (e) => {
      logger.info('Database info', {
        message: e.message,
        target: e.target,
      });
    });

    prisma.$on('warn', (e) => {
      logger.warn('Database warning', {
        message: e.message,
        target: e.target,
      });
    });

    // Test the connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    return prisma;
  } catch (error) {
    logger.error('Failed to connect to database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('Database disconnected successfully');
    }
  } catch (error) {
    logger.error('Failed to disconnect from database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export const getDatabaseClient = () => {
  if (!prisma) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return prisma;
};

export const checkDatabaseHealth = async () => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};
