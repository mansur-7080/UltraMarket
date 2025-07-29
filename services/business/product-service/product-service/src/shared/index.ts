// Shared utilities and types for product-service
// This file provides local implementations of shared functionality

import { createLogger, format, transports } from 'winston';
import jwt from 'jsonwebtoken';

// Create local logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'product-service' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, service, ...meta }) => {
          return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
  ],
});

// Error classes
class AppError extends Error {
  statusCode: number;
  code: string;
  details: any;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'INTERNAL_ERROR',
    details: any = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details: any = {}) {
    super(401, message, 'UNAUTHORIZED', details);
  }
}

// Auth functions
const extractTokenFromHeader = (header: string): string | null => {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.split(' ')[1];
};

const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const secret = process.env.JWT_SECRET || 'default-jwt-secret-key';
    const payload = jwt.verify(token, secret) as JwtPayload;
    return payload;
  } catch (error) {
    throw new UnauthorizedError('Invalid token', { error });
  }
};

// Types
interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  STAFF = 'STAFF',
}

// Export everything
export {
  logger,
  AppError,
  UnauthorizedError,
  extractTokenFromHeader,
  verifyAccessToken,
  PaginationParams,
  PaginatedResponse,
  JwtPayload,
  TokenPair,
  UserRole,
};
