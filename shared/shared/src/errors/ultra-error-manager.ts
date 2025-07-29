/**
 * 🚨 ULTRA ERROR MANAGER
 * UltraMarket E-commerce Platform
 * 
 * SOLVES: Centralized error handling and professional error management
 * 
 * Key Features:
 * - Unified error handling across all services
 * - Professional error classification and recovery
 * - Real-time error monitoring and alerting
 * - Comprehensive error tracking and analytics
 * - Performance impact analysis
 * - User-friendly error messages
 * - TypeScript strict mode compatibility
 * 
 * @author UltraMarket Error Management Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import { EventEmitter } from 'events';
import { logger } from '../logging/ultra-professional-logger';

// Error classification types
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  NETWORK = 'network',
  PERFORMANCE = 'performance',
  SECURITY = 'security'
}

export enum ErrorCode {
  // Validation errors (1000-1999)
  VALIDATION_FAILED = 'ERR_1001',
  INVALID_INPUT = 'ERR_1002',
  MISSING_REQUIRED_FIELD = 'ERR_1003',
  INVALID_FORMAT = 'ERR_1004',
  
  // Authentication errors (2000-2999)
  AUTHENTICATION_FAILED = 'ERR_2001',
  INVALID_CREDENTIALS = 'ERR_2002',
  TOKEN_EXPIRED = 'ERR_2003',
  TOKEN_INVALID = 'ERR_2004',
  MFA_REQUIRED = 'ERR_2005',
  
  // Authorization errors (3000-3999)
  ACCESS_DENIED = 'ERR_3001',
  INSUFFICIENT_PERMISSIONS = 'ERR_3002',
  ROLE_REQUIRED = 'ERR_3003',
  SUBSCRIPTION_REQUIRED = 'ERR_3004',
  
  // Database errors (4000-4999)
  DATABASE_CONNECTION_FAILED = 'ERR_4001',
  QUERY_FAILED = 'ERR_4002',
  RECORD_NOT_FOUND = 'ERR_4003',
  DUPLICATE_ENTRY = 'ERR_4004',
  CONSTRAINT_VIOLATION = 'ERR_4005',
  TRANSACTION_FAILED = 'ERR_4006',
  
  // External API errors (5000-5999)
  EXTERNAL_SERVICE_UNAVAILABLE = 'ERR_5001',
  API_RATE_LIMIT_EXCEEDED = 'ERR_5002',
  THIRD_PARTY_ERROR = 'ERR_5003',
  PAYMENT_GATEWAY_ERROR = 'ERR_5004',
  
  // Business logic errors (6000-6999)
  BUSINESS_RULE_VIOLATION = 'ERR_6001',
  INSUFFICIENT_INVENTORY = 'ERR_6002',
  ORDER_PROCESSING_ERROR = 'ERR_6003',
  PRICE_CALCULATION_ERROR = 'ERR_6004',
  
  // System errors (7000-7999)
  INTERNAL_SERVER_ERROR = 'ERR_7001',
  SERVICE_UNAVAILABLE = 'ERR_7002',
  CONFIGURATION_ERROR = 'ERR_7003',
  MEMORY_LIMIT_EXCEEDED = 'ERR_7004',
  
  // Network errors (8000-8999)
  NETWORK_ERROR = 'ERR_8001',
  TIMEOUT_ERROR = 'ERR_8002',
  CONNECTION_REFUSED = 'ERR_8003',
  
  // Performance errors (9000-9999)
  SLOW_QUERY = 'ERR_9001',
  HIGH_MEMORY_USAGE = 'ERR_9002',
  CPU_OVERLOAD = 'ERR_9003',
  
  // Security errors (10000-10999)
  SECURITY_VIOLATION = 'ERR_10001',
  SUSPICIOUS_ACTIVITY = 'ERR_10002',
  XSS_ATTEMPT = 'ERR_10003',
  SQL_INJECTION_ATTEMPT = 'ERR_10004'
}

// Core error interfaces
export interface UltraErrorDetails {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  stack?: string;
  source: {
    service: string;
    method: string;
    file?: string;
    line?: number;
  };
  recovery?: {
    suggestions: string[];
    retryable: boolean;
    maxRetries?: number;
  };
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCode: Record<ErrorCode, number>;
  averageResolutionTime: number;
  errorRate: number;
  recentErrors: UltraErrorDetails[];
}

export interface ErrorRecoveryStrategy {
  code: ErrorCode;
  strategy: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation' | 'manual_intervention';
  config: Record<string, any>;
  isActive: boolean;
}

/**
 * Ultra Professional Error Class
 * Enhanced error with comprehensive metadata
 */
export class UltraError extends Error {
  public readonly details: UltraErrorDetails;
  public readonly timestamp: Date;
  public readonly errorId: string;
  
  constructor(details: Partial<UltraErrorDetails> & { code: ErrorCode; message: string }) {
    super(details.message);
    this.name = 'UltraError';
    this.timestamp = new Date();
    this.errorId = this.generateErrorId();
    
    this.details = {
      code: details.code,
      message: details.message,
      severity: details.severity || ErrorSeverity.MEDIUM,
      category: this.getCategoryFromCode(details.code),
      context: details.context || {},
      userId: details.userId,
      sessionId: details.sessionId,
      requestId: details.requestId,
      timestamp: this.timestamp,
      stack: this.stack,
      source: details.source || {
        service: 'unknown',
        method: 'unknown'
      },
      recovery: details.recovery
    };
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UltraError);
    }
  }
  
  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getCategoryFromCode(code: ErrorCode): ErrorCategory {
    const codeNum = parseInt(code.replace('ERR_', ''));
    
    if (codeNum >= 1000 && codeNum < 2000) return ErrorCategory.VALIDATION;
    if (codeNum >= 2000 && codeNum < 3000) return ErrorCategory.AUTHENTICATION;
    if (codeNum >= 3000 && codeNum < 4000) return ErrorCategory.AUTHORIZATION;
    if (codeNum >= 4000 && codeNum < 5000) return ErrorCategory.DATABASE;
    if (codeNum >= 5000 && codeNum < 6000) return ErrorCategory.EXTERNAL_API;
    if (codeNum >= 6000 && codeNum < 7000) return ErrorCategory.BUSINESS_LOGIC;
    if (codeNum >= 7000 && codeNum < 8000) return ErrorCategory.SYSTEM;
    if (codeNum >= 8000 && codeNum < 9000) return ErrorCategory.NETWORK;
    if (codeNum >= 9000 && codeNum < 10000) return ErrorCategory.PERFORMANCE;
    if (codeNum >= 10000 && codeNum < 11000) return ErrorCategory.SECURITY;
    
    return ErrorCategory.SYSTEM;
  }
  
  public toJSON(): Record<string, any> {
    return {
      errorId: this.errorId,
      name: this.name,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Ultra Error Manager
 * Centralized error handling and monitoring system
 */
export class UltraErrorManager extends EventEmitter {
  private static instance: UltraErrorManager | null = null;
  private errors: UltraErrorDetails[] = [];
  private metrics: ErrorMetrics;
  private recoveryStrategies = new Map<ErrorCode, ErrorRecoveryStrategy>();
  private circuitBreakers = new Map<string, { isOpen: boolean; failures: number; lastFailure: Date }>();
  
  // Configuration
  private config = {
    maxStoredErrors: 10000,
    alertThresholds: {
      errorRate: 0.1, // 10% error rate
      criticalErrorCount: 5,
      highSeverityErrorCount: 20
    },
    retryDefaults: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000
    },
    circuitBreaker: {
      failureThreshold: 5,
      timeout: 60000 // 1 minute
    }
  };
  
  private constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.initializeRecoveryStrategies();
    this.setupGlobalErrorHandlers();
  }
  
  /**
   * Singleton pattern - get instance
   */
  public static getInstance(): UltraErrorManager {
    if (!UltraErrorManager.instance) {
      UltraErrorManager.instance = new UltraErrorManager();
    }
    return UltraErrorManager.instance;
  }
  
  /**
   * Handle error with comprehensive processing
   */
  public async handleError(
    error: Error | UltraError,
    context?: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      service?: string;
      method?: string;
      additionalContext?: Record<string, any>;
    }
  ): Promise<{
    errorId: string;
    handled: boolean;
    recovery?: any;
    userMessage?: string;
  }> {
    try {
      let ultraError: UltraError;
      
      // Convert to UltraError if needed
      if (error instanceof UltraError) {
        ultraError = error;
      } else {
        ultraError = this.convertToUltraError(error, context);
      }
      
      // Store error
      this.storeError(ultraError.details);
      
      // Update metrics
      this.updateMetrics(ultraError.details);
      
      // Log error professionally
      this.logError(ultraError);
      
      // Attempt recovery
      const recovery = await this.attemptRecovery(ultraError);
      
      // Check for alerting
      await this.checkAlertConditions(ultraError.details);
      
      // Emit event for external handlers
      this.emit('error:handled', {
        error: ultraError,
        recovery,
        context
      });
      
      return {
        errorId: ultraError.errorId,
        handled: true,
        recovery: recovery.success ? recovery.result : null,
        userMessage: this.getUserFriendlyMessage(ultraError)
      };
      
    } catch (handlingError) {
      // Fallback error handling
      logger.error('❌ Error in error handling system', handlingError);
      
      return {
        errorId: `fallback-${Date.now()}`,
        handled: false,
        userMessage: 'An unexpected error occurred. Please try again later.'
      };
    }
  }
  
  /**
   * Create error with enhanced metadata
   */
  public createError(
    code: ErrorCode,
    message: string,
    options: {
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      userId?: string;
      sessionId?: string;
      requestId?: string;
      source?: {
        service: string;
        method: string;
        file?: string;
        line?: number;
      };
      recovery?: {
        suggestions: string[];
        retryable: boolean;
        maxRetries?: number;
      };
    } = {}
  ): UltraError {
    return new UltraError({
      code,
      message,
      severity: options.severity,
      context: options.context,
      userId: options.userId,
      sessionId: options.sessionId,
      requestId: options.requestId,
      source: options.source,
      recovery: options.recovery
    });
  }
  
  /**
   * Get error metrics and statistics
   */
  public getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get errors with filtering
   */
  public getErrors(filters: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    code?: ErrorCode;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): UltraErrorDetails[] {
    let filteredErrors = [...this.errors];
    
    if (filters.category) {
      filteredErrors = filteredErrors.filter(e => e.category === filters.category);
    }
    
    if (filters.severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === filters.severity);
    }
    
    if (filters.code) {
      filteredErrors = filteredErrors.filter(e => e.code === filters.code);
    }
    
    if (filters.userId) {
      filteredErrors = filteredErrors.filter(e => e.userId === filters.userId);
    }
    
    if (filters.startDate) {
      filteredErrors = filteredErrors.filter(e => e.timestamp >= filters.startDate!);
    }
    
    if (filters.endDate) {
      filteredErrors = filteredErrors.filter(e => e.timestamp <= filters.endDate!);
    }
    
    // Sort by timestamp (newest first)
    filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply limit
    if (filters.limit) {
      filteredErrors = filteredErrors.slice(0, filters.limit);
    }
    
    return filteredErrors;
  }
  
  /**
   * Retry operation with exponential backoff
   */
  public async retryOperation<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      retryCondition?: (error: Error) => boolean;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries || this.config.retryDefaults.maxRetries;
    const baseDelay = options.baseDelay || this.config.retryDefaults.baseDelay;
    const maxDelay = options.maxDelay || this.config.retryDefaults.maxDelay;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry
        if (attempt === maxRetries) break;
        
        if (options.retryCondition && !options.retryCondition(lastError)) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        
        // Call retry callback
        if (options.onRetry) {
          options.onRetry(attempt + 1, lastError);
        }
        
        logger.warn(`🔄 Retrying operation (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`, {
          error: lastError.message,
          attempt: attempt + 1,
          delay
        });
        
        // Wait before retry
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Circuit breaker pattern implementation
   */
  public async circuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    options: {
      failureThreshold?: number;
      timeout?: number;
      fallback?: () => Promise<T>;
    } = {}
  ): Promise<T> {
    const failureThreshold = options.failureThreshold || this.config.circuitBreaker.failureThreshold;
    const timeout = options.timeout || this.config.circuitBreaker.timeout;
    
    let circuitState = this.circuitBreakers.get(key);
    
    if (!circuitState) {
      circuitState = { isOpen: false, failures: 0, lastFailure: new Date(0) };
      this.circuitBreakers.set(key, circuitState);
    }
    
    // Check if circuit should be closed (timeout expired)
    if (circuitState.isOpen && Date.now() - circuitState.lastFailure.getTime() > timeout) {
      circuitState.isOpen = false;
      circuitState.failures = 0;
      logger.info(`🔄 Circuit breaker ${key} reset to closed state`);
    }
    
    // If circuit is open, use fallback or throw error
    if (circuitState.isOpen) {
      if (options.fallback) {
        return await options.fallback();
      }
      
      throw this.createError(
        ErrorCode.SERVICE_UNAVAILABLE,
        `Service ${key} is temporarily unavailable (circuit breaker open)`,
        {
          severity: ErrorSeverity.HIGH,
          context: { circuitBreaker: key, failures: circuitState.failures }
        }
      );
    }
    
    try {
      const result = await operation();
      
      // Success - reset failure count
      if (circuitState.failures > 0) {
        circuitState.failures = 0;
        logger.info(`✅ Circuit breaker ${key} reset failure count`);
      }
      
      return result;
      
    } catch (error) {
      // Failure - increment failure count
      circuitState.failures++;
      circuitState.lastFailure = new Date();
      
      // Open circuit if threshold reached
      if (circuitState.failures >= failureThreshold) {
        circuitState.isOpen = true;
        logger.warn(`🚨 Circuit breaker ${key} opened due to ${circuitState.failures} failures`);
        
        this.emit('circuit_breaker:opened', { key, failures: circuitState.failures });
      }
      
      throw error;
    }
  }
  
  /**
   * Initialize default recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    const strategies: ErrorRecoveryStrategy[] = [
      {
        code: ErrorCode.DATABASE_CONNECTION_FAILED,
        strategy: 'retry',
        config: { maxRetries: 3, baseDelay: 1000 },
        isActive: true
      },
      {
        code: ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
        strategy: 'circuit_breaker',
        config: { failureThreshold: 5, timeout: 60000 },
        isActive: true
      },
      {
        code: ErrorCode.API_RATE_LIMIT_EXCEEDED,
        strategy: 'retry',
        config: { maxRetries: 2, baseDelay: 5000 },
        isActive: true
      },
      {
        code: ErrorCode.NETWORK_ERROR,
        strategy: 'retry',
        config: { maxRetries: 3, baseDelay: 2000 },
        isActive: true
      },
      {
        code: ErrorCode.TIMEOUT_ERROR,
        strategy: 'graceful_degradation',
        config: { fallbackResponse: 'partial_data' },
        isActive: true
      }
    ];
    
    strategies.forEach(strategy => {
      this.recoveryStrategies.set(strategy.code, strategy);
    });
  }
  
  /**
   * Convert regular error to UltraError
   */
  private convertToUltraError(error: Error, context?: any): UltraError {
    // Determine error code based on error type/message
    let code = ErrorCode.INTERNAL_SERVER_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    
    if (error.name === 'ValidationError') {
      code = ErrorCode.VALIDATION_FAILED;
      severity = ErrorSeverity.LOW;
    } else if (error.name === 'AuthenticationError') {
      code = ErrorCode.AUTHENTICATION_FAILED;
      severity = ErrorSeverity.HIGH;
    } else if (error.name === 'DatabaseError') {
      code = ErrorCode.DATABASE_CONNECTION_FAILED;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('timeout')) {
      code = ErrorCode.TIMEOUT_ERROR;
      severity = ErrorSeverity.MEDIUM;
    }
    
    return new UltraError({
      code,
      message: error.message,
      severity,
      context: context?.additionalContext,
      userId: context?.userId,
      sessionId: context?.sessionId,
      requestId: context?.requestId,
      source: {
        service: context?.service || 'unknown',
        method: context?.method || 'unknown'
      }
    });
  }
  
  /**
   * Store error in memory (in production, use database)
   */
  private storeError(errorDetails: UltraErrorDetails): void {
    this.errors.push(errorDetails);
    
    // Keep only recent errors
    if (this.errors.length > this.config.maxStoredErrors) {
      this.errors = this.errors.slice(-this.config.maxStoredErrors);
    }
  }
  
  /**
   * Update error metrics
   */
  private updateMetrics(errorDetails: UltraErrorDetails): void {
    this.metrics.totalErrors++;
    this.metrics.errorsByCategory[errorDetails.category]++;
    this.metrics.errorsBySeverity[errorDetails.severity]++;
    this.metrics.errorsByCode[errorDetails.code] = (this.metrics.errorsByCode[errorDetails.code] || 0) + 1;
    
    // Update recent errors
    this.metrics.recentErrors = this.errors.slice(-10);
    
    // Calculate error rate (last hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentErrors = this.errors.filter(e => e.timestamp >= oneHourAgo);
    this.metrics.errorRate = recentErrors.length / 3600; // errors per second
  }
  
  /**
   * Log error with appropriate level
   */
  private logError(error: UltraError): void {
    const logData = {
      errorId: error.errorId,
      code: error.details.code,
      message: error.message,
      severity: error.details.severity,
      category: error.details.category,
      userId: error.details.userId,
      sessionId: error.details.sessionId,
      source: error.details.source,
      context: error.details.context
    };
    
    switch (error.details.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('🚨 CRITICAL ERROR', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('❌ HIGH SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('⚠️ MEDIUM SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('ℹ️ LOW SEVERITY ERROR', logData);
        break;
    }
  }
  
  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: UltraError): Promise<{ success: boolean; result?: any; message?: string }> {
    const strategy = this.recoveryStrategies.get(error.details.code);
    
    if (!strategy || !strategy.isActive) {
      return { success: false, message: 'No recovery strategy available' };
    }
    
    try {
      switch (strategy.strategy) {
        case 'retry':
          return { success: true, message: 'Retry strategy configured' };
          
        case 'circuit_breaker':
          return { success: true, message: 'Circuit breaker strategy configured' };
          
        case 'fallback':
          return { success: true, message: 'Fallback strategy configured' };
          
        case 'graceful_degradation':
          return { 
            success: true, 
            result: strategy.config.fallbackResponse,
            message: 'Graceful degradation applied'
          };
          
        default:
          return { success: false, message: 'Unknown recovery strategy' };
      }
    } catch (recoveryError) {
      logger.error('❌ Error recovery failed', recoveryError);
      return { success: false, message: 'Recovery strategy failed' };
    }
  }
  
  /**
   * Check alert conditions
   */
  private async checkAlertConditions(errorDetails: UltraErrorDetails): Promise<void> {
    // Critical error alert
    if (errorDetails.severity === ErrorSeverity.CRITICAL) {
      this.emit('alert:critical_error', errorDetails);
    }
    
    // High error rate alert
    if (this.metrics.errorRate > this.config.alertThresholds.errorRate) {
      this.emit('alert:high_error_rate', {
        errorRate: this.metrics.errorRate,
        threshold: this.config.alertThresholds.errorRate
      });
    }
    
    // High severity error count alert
    const recentHighSeverityErrors = this.errors.filter(e => 
      e.severity === ErrorSeverity.HIGH && 
      Date.now() - e.timestamp.getTime() < 300000 // Last 5 minutes
    );
    
    if (recentHighSeverityErrors.length >= this.config.alertThresholds.highSeverityErrorCount) {
      this.emit('alert:high_severity_errors', {
        count: recentHighSeverityErrors.length,
        threshold: this.config.alertThresholds.highSeverityErrorCount
      });
    }
  }
  
  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: UltraError): string {
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.VALIDATION_FAILED]: 'Please check your input and try again.',
      [ErrorCode.AUTHENTICATION_FAILED]: 'Please log in again to continue.',
      [ErrorCode.ACCESS_DENIED]: 'You do not have permission to perform this action.',
      [ErrorCode.RECORD_NOT_FOUND]: 'The requested item could not be found.',
      [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 'This service is temporarily unavailable. Please try again later.',
      [ErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
      [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Our team has been notified.'
    };
    
    return userMessages[error.details.code] || 'An error occurred. Please try again later.';
  }
  
  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        this.handleError(error, {
          service: 'global',
          method: 'unhandledRejection',
          additionalContext: { promise: promise.toString() }
        });
      });
      
      // Handle uncaught exceptions
      process.on('uncaughtException', (error: Error) => {
        this.handleError(error, {
          service: 'global',
          method: 'uncaughtException'
        });
        
        // In production, you might want to gracefully shutdown
        logger.error('🚨 Uncaught exception - process may need to restart', error);
      });
    }
  }
  
  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByCategory: Object.values(ErrorCategory).reduce((acc, category) => {
        acc[category] = 0;
        return acc;
      }, {} as Record<ErrorCategory, number>),
      errorsBySeverity: Object.values(ErrorSeverity).reduce((acc, severity) => {
        acc[severity] = 0;
        return acc;
      }, {} as Record<ErrorSeverity, number>),
      errorsByCode: {},
      averageResolutionTime: 0,
      errorRate: 0,
      recentErrors: []
    };
  }
  
  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Global error manager instance
 */
export const errorManager = UltraErrorManager.getInstance();

/**
 * Helper functions for common error scenarios
 */
export const ErrorHelpers = {
  /**
   * Create validation error
   */
  validation: (message: string, field?: string, value?: any) => 
    errorManager.createError(ErrorCode.VALIDATION_FAILED, message, {
      severity: ErrorSeverity.LOW,
      context: { field, value }
    }),
  
  /**
   * Create authentication error
   */
  authentication: (message: string = 'Authentication failed') =>
    errorManager.createError(ErrorCode.AUTHENTICATION_FAILED, message, {
      severity: ErrorSeverity.HIGH
    }),
  
  /**
   * Create authorization error
   */
  authorization: (message: string = 'Access denied') =>
    errorManager.createError(ErrorCode.ACCESS_DENIED, message, {
      severity: ErrorSeverity.MEDIUM
    }),
  
  /**
   * Create database error
   */
  database: (message: string, query?: string) =>
    errorManager.createError(ErrorCode.QUERY_FAILED, message, {
      severity: ErrorSeverity.HIGH,
      context: { query }
    }),
  
  /**
   * Create business logic error
   */
  business: (message: string, context?: Record<string, any>) =>
    errorManager.createError(ErrorCode.BUSINESS_RULE_VIOLATION, message, {
      severity: ErrorSeverity.MEDIUM,
      context
    })
};

/**
 * Export types for external use
 */
export type {
  UltraErrorDetails as ErrorDetails,
  ErrorMetrics as UltraErrorMetrics,
  ErrorRecoveryStrategy as RecoveryStrategy
}; 