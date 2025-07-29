import { Request, Response, NextFunction } from 'express';
import { logger, professionalLogger } from '../utils/logger';

// Extend Express Request interface for professional payment logging
declare global {
  namespace Express {
    interface Request {
      id?: string;
      correlationId?: string;
      user?: {
        id?: string;
        userId?: string;
      };
    }
  }
}

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 402);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Professional error handler middleware for financial operations
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  let details: any = {};
  let isOperational = false;

  // Generate request ID for payment operation tracking
  const requestId = req.id || req.header('X-Request-ID') || `payment-${Date.now()}`;
  const correlationId = (req as any).correlationId || requestId;
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const paymentId = req.params?.paymentId || req.body?.paymentId;

  // Handle custom payment errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
    errorCode = getPaymentErrorCode(error);
  }

  // Handle Payment-specific errors
  else if (error instanceof PaymentError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = true;
    errorCode = 'PAYMENT_ERROR';
  }

  // Handle Gateway errors (Click, Payme, etc.)
  else if (error.message?.includes('gateway') || error.message?.includes('payment')) {
    statusCode = 502;
    message = 'Payment gateway error';
    errorCode = 'GATEWAY_ERROR';
    isOperational = true;
    
    // Log gateway-specific error for O'zbekiston compliance
    const gatewayName = extractGatewayName(error.message);
    if (gatewayName) {
      professionalLogger.gateway(gatewayName, 'ERROR', paymentId || 'unknown', {
        error: error.message,
        statusCode,
        url: req.url
      }, userId);
    }
  }

  // Handle Database errors
  else if (error.name === 'MongoError' || error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Payment data validation failed';
    errorCode = 'VALIDATION_ERROR';
    isOperational = true;
  }

  // Handle Authentication errors (critical for payment security)
  else if (error.message?.includes('unauthorized') || error.message?.includes('token')) {
    statusCode = 401;
    message = 'Payment authentication required';
    errorCode = 'PAYMENT_AUTH_ERROR';
    isOperational = true;
    
    // Critical security log for payment authentication failures
    professionalLogger.security('Payment authentication failure', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      paymentId
    }, 'critical');
  }

  // Handle Rate limiting (DDoS protection for payment endpoints)
  else if (error.message?.includes('rate') || error.message?.includes('limit')) {
    statusCode = 429;
    message = 'Too many payment requests';
    errorCode = 'PAYMENT_RATE_LIMITED';
    isOperational = true;
    
    // Security audit for potential payment abuse
    professionalLogger.security('Payment rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      userId,
      paymentId
    }, 'high');
  }

  // Handle Network/Timeout errors
  else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    statusCode = 504;
    message = 'Payment gateway timeout';
    errorCode = 'GATEWAY_TIMEOUT';
    isOperational = true;
  }

  // Professional error context for financial operations
  const errorContext = {
    errorCode,
    message: error.message,
    name: error.name,
    stack: isOperational ? undefined : error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId,
    paymentId,
    requestId,
    correlationId,
    timestamp: new Date().toISOString(),
    service: 'payment-service',
    isOperational,
    severity: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low'
  };

  // Professional payment error logging
  const logLevel = isOperational ? 'warn' : 'error';
  logger[logLevel](`Payment Service Error: ${req.method} ${req.path} - ${statusCode} ${errorCode}`, errorContext);

  // Financial audit logging for all payment errors
  professionalLogger.audit('Payment error occurred', {
    errorCode,
    statusCode,
    method: req.method,
    path: req.path,
    isOperational,
    paymentId
  }, userId, paymentId);

  // Transaction logging for payment-related errors
  if (paymentId && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const amount = req.body?.amount;
    const currency = req.body?.currency || 'UZS';
    
    professionalLogger.transaction('TRANSACTION_ERROR', paymentId, amount, currency, {
      errorCode,
      statusCode,
      operation: req.method
    }, userId);
  }

  // Security monitoring for suspicious payment activities
  if (['PAYMENT_AUTH_ERROR', 'PAYMENT_RATE_LIMITED', 'VALIDATION_ERROR'].includes(errorCode)) {
    professionalLogger.security('Payment security event', {
      errorCode,
      statusCode,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      paymentId
    }, statusCode >= 400 && statusCode < 500 ? 'high' : 'critical');
  }

  // O'zbekiston compliance logging for regulatory requirements
  if (paymentId || req.url.includes('payment')) {
    professionalLogger.compliance('Payment operation error', {
      errorCode,
      statusCode,
      operation: `${req.method} ${req.path}`,
      isOperational,
      regulatoryImpact: statusCode >= 500 ? 'high' : 'medium'
    }, paymentId, userId);
  }

  // Performance monitoring for payment operation errors
  professionalLogger.performance('Payment error handling', 0, {
    errorCode,
    statusCode,
    path: req.path,
    method: req.method,
    paymentId
  });

  // Send professional payment error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details: Object.keys(details).length > 0 ? details : undefined,
    },
    meta: {
      requestId,
      correlationId,
      timestamp: new Date().toISOString(),
      service: 'payment-service',
      paymentId: paymentId || undefined
    },
    // Include additional context for payment errors
    payment: paymentId ? {
      id: paymentId,
      status: 'error',
      errorCode
    } : undefined
  });
};

// Helper function to extract gateway name from error message
function extractGatewayName(errorMessage: string): string | null {
  const gateways = ['click', 'payme', 'uzcard', 'humo', 'stripe', 'paypal'];
  const message = errorMessage.toLowerCase();
  
  for (const gateway of gateways) {
    if (message.includes(gateway)) {
      return gateway.toUpperCase();
    }
  }
  
  return null;
}

// Helper function to get payment-specific error codes
function getPaymentErrorCode(error: AppError): string {
  const statusCode = error.statusCode;
  
  if (statusCode === 402) return 'PAYMENT_REQUIRED';
  if (statusCode === 403) return 'PAYMENT_FORBIDDEN';
  if (statusCode === 404) return 'PAYMENT_NOT_FOUND';
  if (statusCode === 409) return 'PAYMENT_CONFLICT';
  if (statusCode === 422) return 'PAYMENT_VALIDATION_ERROR';
  if (statusCode >= 500) return 'PAYMENT_INTERNAL_ERROR';
  
  return 'PAYMENT_ERROR';
}
