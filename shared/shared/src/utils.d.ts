import { PaginationParams, PaginatedResponse } from './types';
export declare const paginate: <T>(data: T[], total: number, params: PaginationParams) => PaginatedResponse<T>;
export declare const calculateOffset: (page: number, limit: number) => number;
export declare const generateId: (prefix?: string) => string;
export declare const sleep: (ms: number) => Promise<void>;
export declare const retry: <T>(fn: () => Promise<T>, retries?: number, delay?: number) => Promise<T>;
export declare const filterObject: <T extends Record<string, any>>(obj: T, predicate: (value: any, key: string) => boolean) => Partial<T>;
export declare const removeUndefined: <T extends Record<string, any>>(obj: T) => Partial<T>;
export declare const deepClone: <T>(obj: T) => T;
export declare const formatCurrency: (amount: number, currency?: string, locale?: string) => string;
export declare const generateSlug: (str: string) => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPhone: (phone: string) => boolean;
export declare const calculatePercentage: (value: number, total: number) => number;
export declare const parseSort: (sortString?: string) => {
    field: string;
    order: "asc" | "desc";
} | null;
export declare const chunk: <T>(array: T[], size: number) => T[][];
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
export declare const throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => ((...args: Parameters<T>) => void);
//# sourceMappingURL=utils.d.ts.map