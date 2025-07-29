/**
 * UltraMarket Auth Service - Authentication Service
 * Professional authentication business logic
 */

import { PrismaClient, UserRole } from '@prisma/client';
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
  private userService: any;

  constructor() {
    logger.debug('Auth Service initialized');
    // Initialize user service
    this.userService = {
      getUserByEmail: async (email: string) => {
        return await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true,
            role: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      getUserById: async (id: string) => {
        return await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true,
            role: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      createUser: async (data: any) => {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        return await prisma.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: data.role || 'CUSTOMER',
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true,
            role: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      updateLastLogin: async (userId: string) => {
        await prisma.user.update({
          where: { id: userId },
          data: {
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          },
        });
      },
      changePassword: async (userId: string, newPassword: string) => {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        });
      },
      verifyEmail: async (userId: string) => {
        return await prisma.user.update({
          where: { id: userId },
          data: {
            isEmailVerified: true,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            password: true,
            role: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
    };
  }

  // Additional auth business logic can be added here
  // For now, most logic is in the controller
}
