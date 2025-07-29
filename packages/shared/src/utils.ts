import { PaginationParams, PaginatedResponse } from './types';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from './constants';

// Pagination helper
export const paginate = <T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> => {
  const page = Math.max(1, params.page || DEFAULT_PAGE);
  const limit = Math.min(params.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
};

// Calculate pagination offset
export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

// Generate unique ID
export const generateId = (prefix?: string): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

// Sleep function for delays
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry function for operations
export const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

// Object filtering
export const filterObject = <T extends Record<string, any>>(
  obj: T,
  predicate: (value: any, key: string) => boolean
): Partial<T> => {
  return Object.keys(obj).reduce((acc, key) => {
    if (predicate(obj[key], key)) {
      acc[key as keyof T] = obj[key];
    }
    return acc;
  }, {} as Partial<T>);
};

// Remove undefined values from object
export const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  return filterObject(obj, (value) => value !== undefined);
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Format currency
export const formatCurrency = (amount: number, currency = 'UZS', locale = 'uz-UZ'): string => {
  if (currency === 'UZS') {
    return (
      new Intl.NumberFormat('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + " so'm"
    );
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

// Generate slug from string
export const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};

// Parse sort string
export const parseSort = (sortString?: string): { field: string; order: 'asc' | 'desc' } | null => {
  if (!sortString) return null;

  const [field, order = 'asc'] = sortString.split(':');
  return {
    field,
    order: order.toLowerCase() === 'desc' ? 'desc' : 'asc',
  };
};

// Chunk array
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
