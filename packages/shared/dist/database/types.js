"use strict";
/**
 * UltraMarket Database Types
 * Shared database type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.TransactionError = exports.QueryError = exports.ConnectionError = exports.DatabaseError = void 0;
// Common database error types
class DatabaseError extends Error {
    code;
    detail;
    table;
    column;
    constructor(message, code, detail, table, column) {
        super(message);
        this.name = 'DatabaseError';
        this.code = code;
        this.detail = detail;
        this.table = table;
        this.column = column;
    }
}
exports.DatabaseError = DatabaseError;
class ConnectionError extends DatabaseError {
    constructor(message, detail) {
        super(message, 'CONNECTION_ERROR', detail);
        this.name = 'ConnectionError';
    }
}
exports.ConnectionError = ConnectionError;
class QueryError extends DatabaseError {
    constructor(message, detail, table, column) {
        super(message, 'QUERY_ERROR', detail, table, column);
        this.name = 'QueryError';
    }
}
exports.QueryError = QueryError;
class TransactionError extends DatabaseError {
    constructor(message, detail) {
        super(message, 'TRANSACTION_ERROR', detail);
        this.name = 'TransactionError';
    }
}
exports.TransactionError = TransactionError;
class ValidationError extends DatabaseError {
    constructor(message, detail, table, column) {
        super(message, 'VALIDATION_ERROR', detail, table, column);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
exports.default = {
    DatabaseError,
    ConnectionError,
    QueryError,
    TransactionError,
    ValidationError,
};
//# sourceMappingURL=types.js.map