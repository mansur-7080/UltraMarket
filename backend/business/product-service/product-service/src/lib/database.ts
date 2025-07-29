import { PrismaClient } from '@prisma/client';
import { logger } from '../shared';

// Initialize Prisma Client as a singleton
class Database {
  private static instance: Database;
  private _prisma: PrismaClient;

  private constructor() {
    this._prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Connect to the database
    this.connect();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async connect(): Promise<void> {
    try {
      await this._prisma.$connect();
      logger.info('Successfully connected to the database');
    } catch (error) {
      logger.error('Failed to connect to the database', { error });
      process.exit(1);
    }
  }

  public get prisma(): PrismaClient {
    return this._prisma;
  }

  public async disconnect(): Promise<void> {
    try {
      await this._prisma.$disconnect();
      logger.info('Successfully disconnected from the database');
    } catch (error) {
      logger.error('Failed to disconnect from the database', { error });
    }
  }

  public async executeWithTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this._prisma.$transaction(async (tx) => {
      return fn(tx as unknown as PrismaClient);
    });
  }
}

// Export singleton instance
const db = Database.getInstance();
export default db;
