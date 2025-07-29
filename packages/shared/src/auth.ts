import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JwtPayload, TokenPair, UserRole } from './types';
import { UnauthorizedError } from './errors';
import { JWT_EXPIRY } from './constants';
import { v4 as uuidv4 } from 'uuid';

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// JWT token generation
export const generateTokens = (payload: JwtPayload): TokenPair => {
  const accessToken = jwt.sign(payload, process.env['JWT_SECRET']!, {
    expiresIn: JWT_EXPIRY.ACCESS_TOKEN,
  });

  const refreshToken = jwt.sign(payload, process.env['JWT_REFRESH_SECRET']!, {
    expiresIn: JWT_EXPIRY.REFRESH_TOKEN,
  });

  return { accessToken, refreshToken };
};

export const generateToken = (
  payload: string | object | Buffer,
  secret: string,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, { expiresIn } as any);
};

// JWT token verification
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, process.env['JWT_SECRET']!) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, process.env['JWT_REFRESH_SECRET']!) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

export const verifyToken = (token: string, secret: string): any => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

// Token extraction from headers
export const extractTokenFromHeader = (authHeader?: string): string => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }
  return authHeader.substring(7);
};

// Permission checking
export const hasRole = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
};

export const isSeller = (userRole: UserRole): boolean => {
  return userRole === UserRole.SELLER || isAdmin(userRole);
};

// Generate random tokens
export const generateRandomToken = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const generateOTP = (length = 6): string => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

// Session management
export interface SessionData {
  sessionId: string;
  userId: string;
  deviceInfo: Record<string, any>;
  ipAddress: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export const createSession = async (
  userId: string,
  deviceInfo: Record<string, any>,
  ipAddress: string
): Promise<SessionData> => {
  const sessionId = uuidv4();
  const now = new Date();

  const session: SessionData = {
    sessionId,
    userId,
    deviceInfo,
    ipAddress,
    createdAt: now,
    lastActivity: now,
    isActive: true,
  };

  // In a real implementation, you would store this in Redis or database
  // For now, we'll return the session data
  return session;
};

// Cache utility (Redis-like interface)
export const cache = {
  async setex(key: string, ttl: number, value: string): Promise<void> {
    // In a real implementation, this would use Redis
    // For now, we'll use a simple in-memory store
    const expiry = Date.now() + ttl * 1000;
    (cache as any)._store = (cache as any)._store || new Map();
    (cache as any)._store.set(key, { value, expiry });
  },

  async get(key: string): Promise<string | null> {
    const store = (cache as any)._store;
    if (!store) return null;

    const item = store.get(key);
    if (!item || Date.now() > item.expiry) {
      store.delete(key);
      return null;
    }
    return item.value;
  },

  async del(key: string): Promise<void> {
    const store = (cache as any)._store;
    if (store) {
      store.delete(key);
    }
  },

  async srem(key: string, value: string): Promise<void> {
    // Simple set removal - in real implementation would use Redis SET
    const store = (cache as any)._store;
    if (store) {
      const item = store.get(key);
      if (item && Array.isArray(item.value)) {
        item.value = item.value.filter((v: string) => v !== value);
        store.set(key, item);
      }
    }
  },

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  },

  async setJson(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.setex(key, ttl, JSON.stringify(value));
  },
};
