/**
 * 🚀 ULTRA PROFESSIONAL BACKUP & DISASTER RECOVERY SYSTEM
 * UltraMarket E-commerce Platform
 *
 * Comprehensive backup and disaster recovery featuring:
 * - Automated database backups with encryption
 * - Multi-tier backup strategy (hot, warm, cold)
 * - Cross-region replication and redundancy
 * - Point-in-time recovery capabilities
 * - File system and media backup
 * - Real-time monitoring and alerting
 * - Compliance and audit logging
 * - Automated recovery testing
 * - Data integrity verification
 * - Uzbekistan-specific compliance requirements
 *
 * @author UltraMarket Backup Team
 * @version 4.0.0
 * @date 2024-12-28
 */
export interface BackupConfig {
    postgresql: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        compression: boolean;
        encryptionKey: string;
    };
    mongodb: {
        uri: string;
        database: string;
        compression: boolean;
        encryptionKey: string;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
    };
    storage: {
        local: string;
        s3?: {
            bucket: string;
            region: string;
            accessKey: string;
            secretKey: string;
        };
        backup_retention: {
            daily: number;
            weekly: number;
            monthly: number;
            yearly: number;
        };
    };
    schedule: {
        full_backup: string;
        incremental_backup: string;
        log_backup: string;
    };
    monitoring: {
        enabled: boolean;
        webhookUrl?: string;
        email?: string;
        telegram?: string;
    };
}
export interface BackupMetadata {
    id: string;
    type: 'full' | 'incremental' | 'log' | 'differential';
    timestamp: Date;
    size: number;
    checksum: string;
    encrypted: boolean;
    compressed: boolean;
    retention_until: Date;
    databases: string[];
    status: 'success' | 'failed' | 'in_progress';
    recovery_point: Date;
    location: {
        local?: string;
        s3?: string;
        redundant?: string[];
    };
}
export interface RecoveryPoint {
    timestamp: Date;
    type: 'full' | 'incremental';
    databases: string[];
    backup_ids: string[];
    verified: boolean;
    recovery_time_objective: number;
    recovery_point_objective: number;
}
export declare class UltraProfessionalBackupSystem {
    private config;
    private backupHistory;
    private _recoveryPoints;
    private isBackupRunning;
    constructor(config: BackupConfig);
    /**
     * Initialize backup system
     */
    private initializeBackupSystem;
    /**
     * Ensure backup directories exist
     */
    private ensureDirectories;
    /**
     * Load backup history from metadata
     */
    private loadBackupHistory;
    /**
     * Schedule automatic backups
     */
    private scheduleBackups;
    /**
     * Start backup monitoring
     */
    private startMonitoring;
    /**
     * Perform full backup of all systems
     */
    performFullBackup(): Promise<BackupMetadata>;
    /**
     * Backup PostgreSQL database
     */
    private backupPostgreSQL;
    /**
     * Backup MongoDB database
     */
    private backupMongoDB;
    /**
     * Backup Redis database
     */
    private backupRedis;
    /**
     * Backup application files
     */
    private backupApplicationFiles;
    /**
     * Perform incremental backup
     */
    performIncrementalBackup(): Promise<BackupMetadata>;
    /**
     * Restore from backup
     */
    restoreFromBackup(backupId: string, targetDatabases?: string[]): Promise<void>;
    /**
     * Point-in-time recovery
     */
    pointInTimeRecovery(targetTime: Date): Promise<void>;
    /**
     * Test backup integrity
     */
    testBackupIntegrity(backupId: string): Promise<boolean>;
    /**
     * Get backup statistics
     */
    getBackupStatistics(): any;
    private generateBackupId;
    private calculateRetentionDate;
    private executeCommand;
    private encryptFile;
    private createArchive;
    private copyDirectory;
    private getLastBackup;
    private saveBackupMetadata;
    private sendNotification;
    private formatSize;
    private calculateBackupSize;
    private calculateBackupChecksum;
    private uploadToCloud;
    private createRecoveryPoint;
    private waitForRedisSave;
    private verifyBackupIntegrity;
    private stopServices;
    private startServices;
    private restorePostgreSQL;
    private restoreMongoDB;
    private restoreRedis;
    private verifyRestore;
    private findRecoveryPoint;
    private applyIncrementalBackup;
    private performRestoreTest;
    private performHealthCheck;
    private checkRetentionCompliance;
}
export declare const defaultBackupConfig: BackupConfig;
export declare const backupSystem: UltraProfessionalBackupSystem;
export default UltraProfessionalBackupSystem;
//# sourceMappingURL=ultra-professional-backup-system.d.ts.map