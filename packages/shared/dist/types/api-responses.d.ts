/**
 * UltraMarket API Response Types
 * Standardized response formats for all microservices
 */
export interface BaseApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: ApiError;
    meta?: ResponseMeta;
    timestamp: string;
    requestId: string;
    version: string;
}
export interface SuccessResponse<T = any> extends BaseApiResponse<T> {
    success: true;
    data: T;
    error?: never;
}
export interface ErrorResponse extends BaseApiResponse<never> {
    success: false;
    data?: never;
    error: ApiError;
}
export interface PaginatedResponse<T = any> extends SuccessResponse<T[]> {
    meta: PaginationMeta;
}
export interface ApiError {
    code: string;
    message: string;
    details?: ErrorDetail[];
    stack?: string;
    timestamp: string;
    path?: string;
    method?: string;
}
export interface ErrorDetail {
    field: string;
    message: string;
    value?: any;
    code?: string;
}
export interface ResponseMeta {
    requestId: string;
    timestamp: string;
    processingTime: number;
    service: string;
    version: string;
    environment: string;
}
export interface PaginationMeta extends ResponseMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage?: number;
    prevPage?: number;
}
export declare enum HttpStatusCode {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504
}
export declare enum ErrorCode {
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",
    INVALID_FORMAT = "INVALID_FORMAT",
    INVALID_VALUE = "INVALID_VALUE",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
    INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
}
export interface UserResponse {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ProductResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    currency: string;
    status: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface OrderResponse {
    id: string;
    orderNumber: string;
    userId: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}
export interface AuthResponse {
    user: UserResponse;
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    };
}
export interface RefreshTokenResponse {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
}
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy' | 'degraded';
    version: string;
    uptime: number;
    timestamp: string;
    checks: {
        database: HealthCheckDetail;
        cache: HealthCheckDetail;
        externalServices?: HealthCheckDetail[];
    };
}
export interface HealthCheckDetail {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    message?: string;
    lastChecked: string;
}
export interface FileUploadResponse {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    metadata?: Record<string, any>;
    uploadedAt: string;
}
export interface SearchResponse<T = any> {
    results: T[];
    query: string;
    filters?: Record<string, any>;
    suggestions?: string[];
    meta: SearchMeta;
}
export interface SearchMeta extends PaginationMeta {
    query: string;
    totalResults: number;
    searchTime: number;
    filters: Record<string, any>;
    facets?: Record<string, SearchFacet[]>;
}
export interface SearchFacet {
    value: string;
    count: number;
    selected: boolean;
}
export interface AnalyticsResponse {
    metrics: Record<string, number>;
    timeRange: {
        start: string;
        end: string;
    };
    granularity: string;
    data: AnalyticsDataPoint[];
}
export interface AnalyticsDataPoint {
    timestamp: string;
    value: number;
    metadata?: Record<string, any>;
}
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
export type PaginatedApiResponse<T = any> = PaginatedResponse<T> | ErrorResponse;
export interface ResponseBuilderOptions {
    requestId?: string;
    service?: string;
    version?: string;
    environment?: string;
    processingTime?: number;
}
//# sourceMappingURL=api-responses.d.ts.map