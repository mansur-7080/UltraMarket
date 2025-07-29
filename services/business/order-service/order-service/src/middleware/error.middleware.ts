import { Request, Response, NextFunction } from 'express';
import { logger, professionalLogger } from '../utils/logger';
import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';

// Professional Order Service Error Codes
export enum OrderErrorCodes {
  // Order Management Errors
  ORDER_NOT_FOUND = 'ORD_001',
  ORDER_INVALID_STATUS = 'ORD_002',
  ORDER_CANNOT_CANCEL = 'ORD_003',
  ORDER_ALREADY_PROCESSED = 'ORD_004',
  ORDER_EXPIRED = 'ORD_005',
  ORDER_LIMIT_EXCEEDED = 'ORD_006',
  
  // Inventory Errors
  PRODUCT_OUT_OF_STOCK = 'INV_001',
  INSUFFICIENT_QUANTITY = 'INV_002',
  PRODUCT_DISCONTINUED = 'INV_003',
  INVENTORY_LOCKED = 'INV_004',
  RESERVATION_FAILED = 'INV_005',
  
  // Customer Errors
  CUSTOMER_NOT_FOUND = 'CUS_001',
  CUSTOMER_BLOCKED = 'CUS_002',
  CUSTOMER_LIMIT_EXCEEDED = 'CUS_003',
  ADDRESS_INVALID = 'CUS_004',
  DELIVERY_UNAVAILABLE = 'CUS_005',
  
  // Payment Integration Errors
  PAYMENT_METHOD_INVALID = 'PAY_001',
  PAYMENT_FAILED = 'PAY_002',
  PAYMENT_TIMEOUT = 'PAY_003',
  REFUND_FAILED = 'PAY_004',
  PAYMENT_VERIFICATION_FAILED = 'PAY_005',
  
  // System Errors
  DATABASE_ERROR = 'SYS_001',
  EXTERNAL_SERVICE_ERROR = 'SYS_002',
  VALIDATION_ERROR = 'SYS_003',
  AUTHENTICATION_ERROR = 'SYS_004',
  AUTHORIZATION_ERROR = 'SYS_005',
  RATE_LIMIT_EXCEEDED = 'SYS_006',
  
  // Business Rule Errors
  MINIMUM_ORDER_NOT_MET = 'BUS_001',
  MAXIMUM_ORDER_EXCEEDED = 'BUS_002',
  DELIVERY_SLOT_UNAVAILABLE = 'BUS_003',
  PROMOTION_INVALID = 'BUS_004',
  REGION_RESTRICTED = 'BUS_005'
}

// Professional Error Severity Levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Professional Error Categories
export enum ErrorCategory {
  BUSINESS_LOGIC = 'business_logic',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  INTEGRATION = 'integration',
  COMPLIANCE = 'compliance'
}

// Professional AppError class
export class AppError extends Error {
  public statusCode: number;
  public errorCode: OrderErrorCodes;
  public severity: ErrorSeverity;
  public category: ErrorCategory;
  public isOperational: boolean;
  public context: Record<string, any>;
  public correlationId: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: OrderErrorCodes,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.BUSINESS_LOGIC,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.severity = severity;
    this.category = category;
    this.isOperational = true;
    this.context = context;
    this.correlationId = randomUUID();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific Error Classes for Order Service
export class OrderNotFoundError extends AppError {
  constructor(orderId: string, context: Record<string, any> = {}) {
    super(
      `Order with ID ${orderId} not found`,
      404,
      OrderErrorCodes.ORDER_NOT_FOUND,
      ErrorSeverity.MEDIUM,
      ErrorCategory.BUSINESS_LOGIC,
      { orderId, ...context }
    );
  }
}

export class InsufficientStockError extends AppError {
  constructor(productId: string, requestedQuantity: number, availableQuantity: number, context: Record<string, any> = {}) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requestedQuantity}, Available: ${availableQuantity}`,
      409,
      OrderErrorCodes.INSUFFICIENT_QUANTITY,
      ErrorSeverity.HIGH,
      ErrorCategory.BUSINESS_LOGIC,
      { productId, requestedQuantity, availableQuantity, ...context }
    );
  }
}

export class CustomerBlockedError extends AppError {
  constructor(customerId: string, reason: string, context: Record<string, any> = {}) {
    super(
      `Customer ${customerId} is blocked: ${reason}`,
      403,
      OrderErrorCodes.CUSTOMER_BLOCKED,
      ErrorSeverity.HIGH,
      ErrorCategory.SECURITY,
      { customerId, reason, ...context }
    );
  }
}

export class PaymentFailedError extends AppError {
  constructor(paymentId: string, reason: string, context: Record<string, any> = {}) {
    super(
      `Payment failed for ${paymentId}: ${reason}`,
      402,
      OrderErrorCodes.PAYMENT_FAILED,
      ErrorSeverity.HIGH,
      ErrorCategory.INTEGRATION,
      { paymentId, reason, ...context }
    );
  }
}

// Professional Error Handler Middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const startTime = (req as any).startTime || performance.now();
  const duration = performance.now() - startTime;
  
  let appError: AppError;

  // Convert known errors to AppError format
  if (error instanceof AppError) {
    appError = error;
  } else {
    // Handle specific database and system errors
    appError = convertToAppError(error, req);
  }

  // Security audit for failed operations
  logSecurityAudit(appError, req);

  // Business intelligence logging
  logBusinessIntelligence(appError, req);

  // Compliance logging for order operations
  logComplianceEvent(appError, req);

  // Performance monitoring
  logPerformanceMetrics(appError, req, duration);

  // Professional structured error logging
  logger.error('Order service error occurred', {
    // Error Details
    errorId: appError.correlationId,
    errorCode: appError.errorCode,
    message: appError.message,
    severity: appError.severity,
    category: appError.category,
    statusCode: appError.statusCode,
    stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined,
    
    // Request Context
    method: req.method,
    url: req.url,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    correlationId: req.headers['x-correlation-id'] || appError.correlationId,
    
    // User Context (masked for security)
    userId: (req as any).user?.userId,
    userRole: (req as any).user?.role,
    customerId: (req as any).customer?.id,
    
    // Business Context
    orderId: appError.context.orderId,
    productIds: appError.context.productIds,
    totalAmount: appError.context.totalAmount,
    paymentMethod: appError.context.paymentMethod,
    
    // Performance Metrics
    responseTime: duration,
    memoryUsage: process.memoryUsage(),
    
    // System Context
    service: 'order-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    
    // Additional Context
    context: appError.context
  });

  // Professional error response format
  const errorResponse = {
    success: false,
    error: {
      id: appError.correlationId,
      code: appError.errorCode,
      message: appError.message,
      severity: appError.severity,
      category: appError.category,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    },
    meta: {
      correlationId: req.headers['x-correlation-id'] || appError.correlationId,
      service: 'order-service',
      version: process.env.SERVICE_VERSION || '1.0.0'
    }
  };

  // Include additional details in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse.error as any).stack = appError.stack;
    (errorResponse.error as any).context = appError.context;
  }

  res.status(appError.statusCode).json(errorResponse);
};

// Convert generic errors to AppError
function convertToAppError(error: Error, req: Request): AppError {
  // Prisma/Database Errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      return new AppError(
        'Resource already exists',
        409,
        OrderErrorCodes.ORDER_ALREADY_PROCESSED,
        ErrorSeverity.MEDIUM,
        ErrorCategory.BUSINESS_LOGIC,
        { prismaCode: prismaError.code, meta: prismaError.meta }
      );
    } else if (prismaError.code === 'P2025') {
      return new AppError(
        'Resource not found',
        404,
        OrderErrorCodes.ORDER_NOT_FOUND,
        ErrorSeverity.MEDIUM,
        ErrorCategory.BUSINESS_LOGIC,
        { prismaCode: prismaError.code }
      );
    }
    return new AppError(
      'Database operation failed',
      500,
      OrderErrorCodes.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      ErrorCategory.SYSTEM,
      { prismaCode: prismaError.code }
    );
  }

  // JWT Errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return new AppError(
      'Authentication failed',
      401,
      OrderErrorCodes.AUTHENTICATION_ERROR,
      ErrorSeverity.HIGH,
      ErrorCategory.SECURITY,
      { jwtError: error.name }
    );
  }

  // Validation Errors
  if (error.name === 'ValidationError') {
    return new AppError(
      'Invalid data provided',
      400,
      OrderErrorCodes.VALIDATION_ERROR,
      ErrorSeverity.MEDIUM,
      ErrorCategory.BUSINESS_LOGIC,
      { validationDetails: (error as any).details }
    );
  }

  // Timeout Errors
  if (error.name === 'TimeoutError') {
    return new AppError(
      'Request timeout',
      408,
      OrderErrorCodes.EXTERNAL_SERVICE_ERROR,
      ErrorSeverity.HIGH,
      ErrorCategory.PERFORMANCE,
      { timeout: true }
    );
  }

  // Generic Internal Server Error
  return new AppError(
    'Internal server error',
    500,
    OrderErrorCodes.DATABASE_ERROR,
    ErrorSeverity.CRITICAL,
    ErrorCategory.SYSTEM,
    { originalError: error.message }
  );
}

// Security audit logging
function logSecurityAudit(error: AppError, req: Request) {
  if (error.category === ErrorCategory.SECURITY || error.statusCode === 401 || error.statusCode === 403) {
         professionalLogger.security('Security violation detected', {
      event: 'access_denied',
      errorCode: error.errorCode,
      severity: error.severity,
      userId: (req as any).user?.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      reason: error.message,
      timestamp: new Date().toISOString(),
      correlationId: error.correlationId
    });
  }
}

// Business intelligence logging
function logBusinessIntelligence(error: AppError, req: Request) {
  // Log business-critical errors for analytics
  const businessCriticalCodes = [
    OrderErrorCodes.PRODUCT_OUT_OF_STOCK,
    OrderErrorCodes.INSUFFICIENT_QUANTITY,
    OrderErrorCodes.PAYMENT_FAILED,
    OrderErrorCodes.ORDER_LIMIT_EXCEEDED,
    OrderErrorCodes.CUSTOMER_LIMIT_EXCEEDED
  ];

  if (businessCriticalCodes.includes(error.errorCode)) {
              professionalLogger.business('order_operation_failed', 1, {
       errorCode: error.errorCode,
       category: error.category,
       customerId: (req as any).customer?.id,
       productIds: error.context.productIds,
       failureReason: error.message,
       impactLevel: error.severity,
       correlationId: error.correlationId
     }, error.context.orderId, (req as any).user?.userId);
  }
}

// Compliance logging
function logComplianceEvent(error: AppError, req: Request) {
  // Log compliance-relevant events
  const complianceCriticalCodes = [
    OrderErrorCodes.CUSTOMER_BLOCKED,
    OrderErrorCodes.REGION_RESTRICTED,
    OrderErrorCodes.PAYMENT_VERIFICATION_FAILED
  ];

  if (complianceCriticalCodes.includes(error.errorCode)) {
         professionalLogger.compliance('order_compliance_violation', {
       errorCode: error.errorCode,
       severity: error.severity,
       customerId: (req as any).customer?.id,
       region: (req as any).customer?.region,
       violationType: error.errorCode,
       details: error.context,
       correlationId: error.correlationId
     }, error.context.orderId, (req as any).user?.userId);
  }
}

// Performance metrics logging
function logPerformanceMetrics(error: AppError, req: Request, duration: number) {
  if (error.category === ErrorCategory.PERFORMANCE || duration > 5000) { // 5 seconds threshold
         logger.warn('Performance issue detected', {
      event: 'slow_error_response',
      errorCode: error.errorCode,
      duration,
      memoryUsage: process.memoryUsage(),
      path: req.path,
      method: req.method,
      threshold_exceeded: duration > 5000,
      timestamp: new Date().toISOString(),
      correlationId: error.correlationId
    });
  }
}

// Professional async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Rate limiting error handler
export const handleRateLimit = (req: Request, res: Response) => {
  const error = new AppError(
    'Too many requests, please try again later',
    429,
    OrderErrorCodes.RATE_LIMIT_EXCEEDED,
    ErrorSeverity.MEDIUM,
    ErrorCategory.SECURITY
  );

     professionalLogger.security('Rate limit exceeded', {
    event: 'rate_limit_exceeded',
    ip: req.ip,
    path: req.path,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(429).json({
    success: false,
    error: {
      code: error.errorCode,
      message: error.message,
      timestamp: new Date().toISOString()
    }
  });
};
