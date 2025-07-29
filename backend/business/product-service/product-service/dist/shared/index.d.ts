declare const logger: import("winston").Logger;
declare class AppError extends Error {
    statusCode: number;
    code: string;
    details: any;
    constructor(statusCode: number, message: string, code?: string, details?: any);
}
declare class UnauthorizedError extends AppError {
    constructor(message?: string, details?: any);
}
declare const extractTokenFromHeader: (header: string) => string | null;
declare const verifyAccessToken: (token: string) => JwtPayload;
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
declare enum UserRole {
    ADMIN = "ADMIN",
    CUSTOMER = "CUSTOMER",
    VENDOR = "VENDOR",
    STAFF = "STAFF"
}
export { logger, AppError, UnauthorizedError, extractTokenFromHeader, verifyAccessToken, PaginationParams, PaginatedResponse, JwtPayload, TokenPair, UserRole, };
//# sourceMappingURL=index.d.ts.map