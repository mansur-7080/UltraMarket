/**
 * UltraMarket E-Commerce Platform
 * Professional Database Migration Utilities
 * Enterprise-Grade Schema Management
 */

import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// ===== TYPESCRIPT INTERFACES =====

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

interface MigrationFile {
  up: string;
  down?: string;
  metadata: {
    name: string;
    description: string;
    version: string;
    dependencies?: string[];
    tags?: string[];
  };
}

interface MigrationHistory {
  migration: Migration;
  error?: string;
  rollbackAvailable: boolean;
}

enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

// ===== MIGRATION MANAGER CLASS =====

export class MigrationManager {
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private migrationsPath: string;

  constructor(
    prisma: PrismaClient,
    migrationsPath: string = './src/database/migrations'
  ) {
    this.prisma = prisma;
    this.migrationsPath = migrationsPath;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'migrations' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/migrations.log'
        })
      ]
    });
  }

  /**
   * Initialize migration tracking table
   */
  async initialize(): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS _migrations (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          version VARCHAR(50) NOT NULL,
          description TEXT,
          filename VARCHAR(255) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          applied_by VARCHAR(255),
          execution_time INTEGER,
          status VARCHAR(20) DEFAULT 'completed',
          rollback_sql TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.logger.info('Migration tracking table initialized');
    } catch (error) {
      this.logger.error('Failed to initialize migration table', error);
      throw error;
    }
  }

  /**
   * Generate new migration file
   */
  async generateMigration(
    name: string,
    description: string,
    version?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0];
    const migrationVersion = version || `${timestamp}`;
    const filename = `${migrationVersion}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
    const filePath = path.join(this.migrationsPath, filename);

    const migrationTemplate = `-- Migration: ${name}
-- Version: ${migrationVersion}
-- Description: ${description}
-- Created: ${new Date().toISOString()}

-- ======= UP MIGRATION =======
-- Add your schema changes here

-- Example: CREATE TABLE example (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );


-- ======= DOWN MIGRATION (ROLLBACK) =======
-- Add rollback statements here (optional but recommended)

-- Example: DROP TABLE IF EXISTS example;
`;

    try {
      // Ensure migrations directory exists
      await fs.mkdir(this.migrationsPath, { recursive: true });
      
      // Write migration file
      await fs.writeFile(filePath, migrationTemplate);
      
      this.logger.info(`Migration file generated: ${filename}`);
      return filename;
    } catch (error) {
      this.logger.error('Failed to generate migration file', error);
      throw error;
    }
  }

  /**
   * Parse migration file
   */
  private async parseMigrationFile(filename: string): Promise<MigrationFile> {
    const filePath = path.join(this.migrationsPath, filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract metadata from comments
      const metadataRegex = /-- Migration: (.+)\n-- Version: (.+)\n-- Description: (.+)/;
      const match = content.match(metadataRegex);
      
      if (!match) {
        throw new Error(`Invalid migration file format: ${filename}`);
      }

      // Split UP and DOWN sections
      const upSection = content.split('-- ======= UP MIGRATION =======')[1]?.split('-- ======= DOWN MIGRATION')[0]?.trim();
      const downSection = content.split('-- ======= DOWN MIGRATION (ROLLBACK) =======')[1]?.trim();

      if (!upSection) {
        throw new Error(`No UP migration found in: ${filename}`);
      }

      return {
        up: upSection,
        down: downSection,
        metadata: {
          name: match[1].trim(),
          version: match[2].trim(),
          description: match[3].trim()
        }
      };
    } catch (error) {
      this.logger.error(`Failed to parse migration file: ${filename}`, error);
      throw error;
    }
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    try {
      // Get all migration files
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.sql')).sort();

      // Get applied migrations
      const appliedMigrations = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM _migrations WHERE status = 'completed' ORDER BY applied_at
      `;

      const appliedNames = new Set(appliedMigrations.map(m => m.filename));
      const pendingFiles = migrationFiles.filter(f => !appliedNames.has(f));

      // Parse pending migration files
      const pendingMigrations: Migration[] = [];
      
      for (const filename of pendingFiles) {
        try {
          const migrationFile = await this.parseMigrationFile(filename);
          const fileContent = await fs.readFile(path.join(this.migrationsPath, filename), 'utf-8');
          
          const migration: Migration = {
            id: this.generateMigrationId(filename, migrationFile.metadata.version),
            name: migrationFile.metadata.name,
            version: migrationFile.metadata.version,
            description: migrationFile.metadata.description,
            filename,
            checksum: this.generateChecksum(fileContent),
            status: MigrationStatus.PENDING,
            rollbackSql: migrationFile.down
          };
          
          pendingMigrations.push(migration);
        } catch (error) {
          this.logger.error(`Error parsing migration ${filename}`, error);
        }
      }

      return pendingMigrations;
    } catch (error) {
      this.logger.error('Failed to get pending migrations', error);
      throw error;
    }
  }

  /**
   * Run pending migrations
   */
  async migrate(options?: { target?: string; dryRun?: boolean }): Promise<MigrationHistory[]> {
    const history: MigrationHistory[] = [];
    
    try {
      await this.initialize();
      
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        this.logger.info('No pending migrations found');
        return history;
      }

      this.logger.info(`Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        if (options?.target && migration.version > options.target) {
          break;
        }

        const startTime = Date.now();
        
        try {
          if (options?.dryRun) {
            this.logger.info(`[DRY RUN] Would apply migration: ${migration.name}`);
            history.push({
              migration,
              rollbackAvailable: !!migration.rollbackSql
            });
            continue;
          }

          // Update status to running
          await this.updateMigrationStatus(migration.id, MigrationStatus.RUNNING);
          
          this.logger.info(`Applying migration: ${migration.name}`);
          
          // Parse and execute migration
          const migrationFile = await this.parseMigrationFile(migration.filename);
          
          // Execute in transaction
          await this.prisma.$transaction(async (tx) => {
            // Split SQL statements and execute each one
            const statements = migrationFile.up
              .split(';')
              .map(s => s.trim())
              .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
              await tx.$executeRawUnsafe(statement);
            }
          });

          const executionTime = Date.now() - startTime;

          // Record successful migration
          await this.recordMigration({
            ...migration,
            appliedAt: new Date(),
            executionTime,
            status: MigrationStatus.COMPLETED
          });

          this.logger.info(`Migration completed: ${migration.name} (${executionTime}ms)`);
          
          history.push({
            migration: { ...migration, status: MigrationStatus.COMPLETED, executionTime },
            rollbackAvailable: !!migration.rollbackSql
          });

        } catch (error) {
          const executionTime = Date.now() - startTime;
          
          // Update status to failed
          await this.updateMigrationStatus(migration.id, MigrationStatus.FAILED);
          
          this.logger.error(`Migration failed: ${migration.name}`, error);
          
          history.push({
            migration: { ...migration, status: MigrationStatus.FAILED, executionTime },
            error: error.message,
            rollbackAvailable: !!migration.rollbackSql
          });

          // Stop on first failure
          break;
        }
      }

      return history;
    } catch (error) {
      this.logger.error('Migration process failed', error);
      throw error;
    }
  }

  /**
   * Rollback migrations
   */
  async rollback(options?: { target?: string; steps?: number }): Promise<MigrationHistory[]> {
    const history: MigrationHistory[] = [];
    
    try {
      // Get applied migrations in reverse order
      const appliedMigrations = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM _migrations 
        WHERE status = 'completed' 
        ORDER BY applied_at DESC
      `;

      if (appliedMigrations.length === 0) {
        this.logger.info('No migrations to rollback');
        return history;
      }

      let migrationsToRollback = appliedMigrations;

      // Filter by target or steps
      if (options?.target) {
        const targetIndex = appliedMigrations.findIndex(m => m.version === options.target);
        if (targetIndex >= 0) {
          migrationsToRollback = appliedMigrations.slice(0, targetIndex);
        }
      } else if (options?.steps) {
        migrationsToRollback = appliedMigrations.slice(0, options.steps);
      } else {
        // Default: rollback last migration only
        migrationsToRollback = appliedMigrations.slice(0, 1);
      }

      this.logger.info(`Rolling back ${migrationsToRollback.length} migrations`);

      for (const migrationRecord of migrationsToRollback) {
        const startTime = Date.now();
        
        try {
          this.logger.info(`Rolling back migration: ${migrationRecord.name}`);

          if (!migrationRecord.rollback_sql) {
            throw new Error(`No rollback script available for migration: ${migrationRecord.name}`);
          }

          // Execute rollback in transaction
          await this.prisma.$transaction(async (tx) => {
            const statements = migrationRecord.rollback_sql
              .split(';')
              .map(s => s.trim())
              .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
              await tx.$executeRawUnsafe(statement);
            }
          });

          const executionTime = Date.now() - startTime;

          // Update migration status
          await this.prisma.$executeRaw`
            UPDATE _migrations 
            SET status = 'rolled_back', updated_at = CURRENT_TIMESTAMP
            WHERE id = ${migrationRecord.id}
          `;

          this.logger.info(`Migration rolled back: ${migrationRecord.name} (${executionTime}ms)`);
          
          history.push({
            migration: {
              ...migrationRecord,
              status: MigrationStatus.ROLLED_BACK,
              executionTime
            },
            rollbackAvailable: true
          });

        } catch (error) {
          this.logger.error(`Rollback failed: ${migrationRecord.name}`, error);
          
          history.push({
            migration: migrationRecord,
            error: error.message,
            rollbackAvailable: true
          });

          // Stop on first failure
          break;
        }
      }

      return history;
    } catch (error) {
      this.logger.error('Rollback process failed', error);
      throw error;
    }
  }

  /**
   * Get migration history
   */
  async getHistory(): Promise<Migration[]> {
    try {
      const migrations = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM _migrations ORDER BY applied_at DESC
      `;

      return migrations.map(m => ({
        id: m.id,
        name: m.name,
        version: m.version,
        description: m.description,
        filename: m.filename,
        checksum: m.checksum,
        appliedAt: m.applied_at,
        appliedBy: m.applied_by,
        executionTime: m.execution_time,
        status: m.status as MigrationStatus,
        rollbackSql: m.rollback_sql
      }));
    } catch (error) {
      this.logger.error('Failed to get migration history', error);
      throw error;
    }
  }

  /**
   * Validate migration integrity
   */
  async validateIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      const appliedMigrations = await this.getHistory();
      
      for (const migration of appliedMigrations) {
        if (migration.status === MigrationStatus.COMPLETED) {
          try {
            const filePath = path.join(this.migrationsPath, migration.filename);
            const currentContent = await fs.readFile(filePath, 'utf-8');
            const currentChecksum = this.generateChecksum(currentContent);
            
            if (currentChecksum !== migration.checksum) {
              issues.push(`Checksum mismatch for migration: ${migration.name}`);
            }
          } catch (error) {
            issues.push(`Migration file missing: ${migration.filename}`);
          }
        }
      }

      return {
        valid: issues.length === 0,
        issues
      };
    } catch (error) {
      this.logger.error('Migration integrity validation failed', error);
      return {
        valid: false,
        issues: ['Failed to validate migration integrity']
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private generateMigrationId(filename: string, version: string): string {
    return crypto.createHash('md5').update(`${filename}_${version}`).digest('hex');
  }

  private generateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async recordMigration(migration: Migration): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO _migrations (
        id, name, version, description, filename, checksum, 
        applied_at, execution_time, status, rollback_sql
      ) VALUES (
        ${migration.id}, ${migration.name}, ${migration.version}, 
        ${migration.description}, ${migration.filename}, ${migration.checksum},
        ${migration.appliedAt}, ${migration.executionTime}, ${migration.status},
        ${migration.rollbackSql}
      )
    `;
  }

  private async updateMigrationStatus(id: string, status: MigrationStatus): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE _migrations 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
    `;
  }
}

// ===== UTILITY FUNCTIONS =====

export const createMigrationManager = (prisma: PrismaClient, migrationsPath?: string) => {
  return new MigrationManager(prisma, migrationsPath);
};

export const runMigrations = async (
  prisma: PrismaClient, 
  migrationsPath?: string,
  options?: { target?: string; dryRun?: boolean }
) => {
  const manager = new MigrationManager(prisma, migrationsPath);
  return await manager.migrate(options);
};

export const rollbackMigrations = async (
  prisma: PrismaClient,
  migrationsPath?: string, 
  options?: { target?: string; steps?: number }
) => {
  const manager = new MigrationManager(prisma, migrationsPath);
  return await manager.rollback(options);
};

export default MigrationManager; 