/**
 * UltraMarket E-Commerce Platform
 * Professional Database Migration Utilities
 * Enterprise-Grade Schema Management
 */
import { PrismaClient } from '@prisma/client';
interface Migration {
    id: string;
    name: string;
    version: string;
    description: string;
    filename: string;
    checksum: string;
    appliedAt?: Date;
    appliedBy?: string;
    executionTime?: number;
    status: MigrationStatus;
    rollbackSql?: string;
}
interface MigrationHistory {
    migration: Migration;
    error?: string;
    rollbackAvailable: boolean;
}
declare enum MigrationStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    ROLLED_BACK = "rolled_back"
}
export declare class MigrationManager {
    private prisma;
    private logger;
    private migrationsPath;
    constructor(prisma: PrismaClient, migrationsPath?: string);
    /**
     * Initialize migration tracking table
     */
    initialize(): Promise<void>;
    /**
     * Generate new migration file
     */
    generateMigration(name: string, description: string, version?: string): Promise<string>;
    /**
     * Parse migration file
     */
    private parseMigrationFile;
    /**
     * Get pending migrations
     */
    getPendingMigrations(): Promise<Migration[]>;
    /**
     * Run pending migrations
     */
    migrate(options?: {
        target?: string;
        dryRun?: boolean;
    }): Promise<MigrationHistory[]>;
    /**
     * Rollback migrations
     */
    rollback(options?: {
        target?: string;
        steps?: number;
    }): Promise<MigrationHistory[]>;
    /**
     * Get migration history
     */
    getHistory(): Promise<Migration[]>;
    /**
     * Validate migration integrity
     */
    validateIntegrity(): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    private generateMigrationId;
    private generateChecksum;
    private recordMigration;
    private updateMigrationStatus;
}
export declare const createMigrationManager: (prisma: PrismaClient, migrationsPath?: string) => MigrationManager;
export declare const runMigrations: (prisma: PrismaClient, migrationsPath?: string, options?: {
    target?: string;
    dryRun?: boolean;
}) => Promise<MigrationHistory[]>;
export declare const rollbackMigrations: (prisma: PrismaClient, migrationsPath?: string, options?: {
    target?: string;
    steps?: number;
}) => Promise<MigrationHistory[]>;
export default MigrationManager;
//# sourceMappingURL=migrations.d.ts.map