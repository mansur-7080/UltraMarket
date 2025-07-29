import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
