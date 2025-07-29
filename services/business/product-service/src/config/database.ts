/**
 * Database Configuration for Product Service
 * Uses Prisma with PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared/logging/logger';

let prisma: PrismaClient;

export const connectDatabase = async (): Promise<PrismaClient> => {
  try {
    if (!prisma) {
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
        errorFormat: 'pretty'
      });
    }

    // Test the connection
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    
    logger.info('✅ Database connected successfully', {
      service: 'product-service',
      database: 'PostgreSQL with Prisma'
    });
    
    return prisma;
  } catch (error) {
    logger.error('❌ Database connection failed', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('✅ Database disconnected successfully');
    }
  } catch (error) {
    logger.error('❌ Database disconnection failed', error);
    throw error;
  }
};

export { prisma };
