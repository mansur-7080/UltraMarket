/**
 * UltraMarket Database Types
 * Shared database type definitions
 */

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: Record<string, unknown>;
  include?: string[];
  select?: string[];
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  command: string;
  duration: number;
}

export interface DatabaseStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  queriesExecuted: number;
  avgQueryTime: number;
  slowQueries: number;
}

export interface MigrationInfo {
  id: string;
  name: string;
  appliedAt: Date;
  executionTime: number;
}

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  type: 'full' | 'incremental';
  status: 'pending' | 'completed' | 'failed';
}

// Common database error types
export class DatabaseError extends Error {
  public readonly code: string;
  public readonly detail?: string;
  public readonly table?: string;
  public readonly column?: string;

  constructor(message: string, code: string, detail?: string, table?: string, column?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.detail = detail;
    this.table = table;
    this.column = column;
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string, detail?: string) {
    super(message, 'CONNECTION_ERROR', detail);
    this.name = 'ConnectionError';
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, detail?: string, table?: string, column?: string) {
    super(message, 'QUERY_ERROR', detail, table, column);
    this.name = 'QueryError';
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string, detail?: string) {
    super(message, 'TRANSACTION_ERROR', detail);
    this.name = 'TransactionError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, detail?: string, table?: string, column?: string) {
    super(message, 'VALIDATION_ERROR', detail, table, column);
    this.name = 'ValidationError';
  }
}

// Database operation types
export type DatabaseOperation =
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'CREATE'
  | 'DROP'
  | 'ALTER';

export interface QueryLog {
  id: string;
  query: string;
  params?: unknown[];
  operation: DatabaseOperation;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  rowsAffected?: number;
}

export interface ConnectionPool {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

export interface DatabaseConfig {
  connection: DatabaseConnection;
  pool: ConnectionPool;
  logging: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
    logQueries: boolean;
    logSlowQueries: boolean;
    slowQueryThreshold: number;
  };
  migrations: {
    directory: string;
    tableName: string;
    schemaName?: string;
  };
  seeds: {
    directory: string;
  };
}

// Utility types for better type safety
export type NonNullable<T> = T extends null | undefined ? never : T;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Generic repository interface
export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  findMany(options: QueryOptions): Promise<PaginationResult<T>>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
  exists(id: ID): Promise<boolean>;
  count(where?: Record<string, unknown>): Promise<number>;
}

export default {
  DatabaseError,
  ConnectionError,
  QueryError,
  TransactionError,
  ValidationError,
};
