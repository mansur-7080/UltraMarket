"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
// Create a singleton Prisma client
const prisma = new client_1.PrismaClient({
    log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
    ],
});
// Log database warnings and errors
prisma.$on('warn', (e) => {
    logger_1.logger.warn('Database warning', { message: e.message });
});
prisma.$on('error', (e) => {
    logger_1.logger.error('Database error', { message: e.message, target: e.target });
});
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger_1.logger.info('Prisma client disconnected');
});
exports.default = prisma;
//# sourceMappingURL=prisma.js.map