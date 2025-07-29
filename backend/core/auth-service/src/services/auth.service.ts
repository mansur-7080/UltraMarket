/**
 * UltraMarket Auth Service - Authentication Service
 * Professional authentication business logic
 */

import { PrismaClient } from '@prisma/client';
import type { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import crypto from 'crypto';
// import { logger } from '@ultramarket/shared/logging/logger';
// import { ApiError } from '@ultramarket/shared/errors/api-error';
const logger = console;
class ApiError extends Error {
  constructor(public statusCode: number, public override message: string) {
    super(message);
  }
}

const prisma = new PrismaClient();

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  constructor() {
    logger.debug('Auth Service initialized');
  }

  // Additional auth business logic can be added here
  // For now, most logic is in the controller
}
