import { PrismaClient } from '@prisma/client';
declare class Database {
    private static instance;
    private _prisma;
    private constructor();
    static getInstance(): Database;
    private connect;
    get prisma(): PrismaClient;
    disconnect(): Promise<void>;
    executeWithTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;
}
declare const db: Database;
export default db;
//# sourceMappingURL=database.d.ts.map