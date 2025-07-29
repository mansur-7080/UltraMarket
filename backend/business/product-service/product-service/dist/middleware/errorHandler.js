"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const shared_1 = require("@ultramarket/shared");
const errorHandler = (err, req, res, next) => {
    shared_1.logger.error('Error:', err);
    // Default error
    let statusCode = 500;
    let message = 'Internal Server Error';
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }
    else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
    }
    else if (err.message) {
        message = err.message;
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map