"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const shared_1 = require("../shared");
// Initialize Prisma Client as a singleton
class Database {
    static instance;
    _prisma;
    constructor() {
        this._prisma = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
        // Connect to the database
        this.connect();
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        try {
            await this._prisma.$connect();
            shared_1.logger.info('Successfully connected to the database');
        }
        catch (error) {
            shared_1.logger.error('Failed to connect to the database', { error });
            process.exit(1);
        }
    }
    get prisma() {
        return this._prisma;
    }
    async disconnect() {
        try {
            await this._prisma.$disconnect();
            shared_1.logger.info('Successfully disconnected from the database');
        }
        catch (error) {
            shared_1.logger.error('Failed to disconnect from the database', { error });
        }
    }
    async executeWithTransaction(fn) {
        return this._prisma.$transaction(async (tx) => {
            return fn(tx);
        });
    }
}
// Export singleton instance
const db = Database.getInstance();
exports.default = db;
//# sourceMappingURL=database.js.map