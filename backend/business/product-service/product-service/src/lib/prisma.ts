import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Create a singleton Prisma client
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

// Log database warnings and errors
prisma.$on('warn', (e) => {
  logger.warn('Database warning', { message: e.message });
});

prisma.$on('error', (e) => {
  logger.error('Database error', { message: e.message, target: e.target });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Prisma client disconnected');
});

export default prisma;
