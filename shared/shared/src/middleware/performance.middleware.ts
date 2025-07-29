/**
 * 📊 PROFESSIONAL PERFORMANCE MONITORING MIDDLEWARE
 * 
 * Automatic performance tracking middleware that integrates with
 * the professional performance monitoring system
 * 
 * Version: 4.0.0 - Professional Performance Integration
 * Date: 2024-12-28
 * Features: Automatic request tracking, real-time metrics, alerting
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { randomUUID } from 'crypto';
import { ProfessionalPerformanceMonitor, RequestTracker } from '../performance/professional-monitoring';

// Performance middleware configuration
export interface PerformanceMiddlewareConfig {
  serviceName: string;
  enableDetailedTracking: boolean;
  enableBusinessMetrics: boolean;
  enableDatabaseTracking: boolean;
  enableCacheTracking: boolean;
  enableExternalServiceTracking: boolean;
  customThresholds?: any;
}

// Business context interface
export interface BusinessContext {
  transactionType?: string;
  userId?: string;
  customerId?: string;
  amount?: number;
  productIds?: string[];
  paymentMethod?: string;
  region?: string;
}

// Performance middleware class
export class PerformanceMiddleware {
  private monitor: ProfessionalPerformanceMonitor;
  private config: PerformanceMiddlewareConfig;

  constructor(config: PerformanceMiddlewareConfig) {
    this.config = config;
    this.monitor = new ProfessionalPerformanceMonitor(
      config.serviceName,
      config.customThresholds
    );

    // Start monitoring
    this.monitor.startMonitoring();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Main performance tracking middleware
   */
  public trackRequest(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
      const startTime = performance.now();

      // Add correlation ID to request
      (req as any).correlationId = correlationId;
      (req as any).startTime = startTime;

      // Start request tracking
      const tracker = this.monitor.trackRequest(
        correlationId,
        req.method,
        req.path,
        (req as any).user?.userId
      );

      // Add performance tracking methods to request
      (req as any).addMarker = (markerName: string) => {
        this.monitor.addMarker(correlationId, markerName);
      };

      (req as any).trackDatabaseOp = (operation: string, duration: number, success: boolean, poolStats?: any) => {
        this.monitor.trackDatabaseOperation(operation, duration, success, poolStats);
      };

      (req as any).trackCacheOp = (operation: 'hit' | 'miss', latency: number) => {
        this.monitor.trackCacheOperation(operation, latency);
      };

      (req as any).trackExternalService = (serviceName: string, duration: number, success: boolean) => {
        this.monitor.trackExternalService(serviceName, duration, success);
      };

      // Override response methods to track completion
      const originalSend = res.send;
      const originalJson = res.json;

      res.send = function(data: any) {
        const businessContext = extractBusinessContext(req, data);
        completeTracking(correlationId, res.statusCode, businessContext);
        return originalSend.call(this, data);
      };

      res.json = function(data: any) {
        const businessContext = extractBusinessContext(req, data);
        completeTracking(correlationId, res.statusCode, businessContext);
        return originalJson.call(this, data);
      };

      // Complete tracking function
      const completeTracking = (correlationId: string, statusCode: number, businessContext?: BusinessContext) => {
        this.monitor.completeRequest(correlationId, statusCode, businessContext);
        
        // Emit request completed event
        this.monitor.emit('request:completed', {
          correlationId,
          duration: performance.now() - startTime,
          statusCode,
          method: req.method,
          path: req.path,
          service: this.config.serviceName
        });
      };

      next();
    };
  }

  /**
   * Database operation tracking middleware
   */
  public trackDatabase(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!this.config.enableDatabaseTracking) {
        return next();
      }

      // Hook into database operations (example implementation)
      const originalQuery = (req as any).db?.query;
      if (originalQuery) {
        (req as any).db.query = async (...args: any[]) => {
          const start = performance.now();
          let success = true;
          
          try {
            const result = await originalQuery.apply((req as any).db, args);
            return result;
          } catch (error) {
            success = false;
            throw error;
          } finally {
            const duration = performance.now() - start;
            this.monitor.trackDatabaseOperation('query', duration, success);
          }
        };
      }

      next();
    };
  }

  /**
   * Cache operation tracking middleware
   */
  public trackCache(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!this.config.enableCacheTracking) {
        return next();
      }

      // Add cache tracking headers
      res.setHeader('X-Cache-Tracking', 'enabled');

      next();
    };
  }

  /**
   * Business metrics tracking middleware
   */
  public trackBusinessMetrics(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!this.config.enableBusinessMetrics) {
        return next();
      }

      // Track business-specific metrics
      const businessType = this.detectBusinessOperationType(req);
      if (businessType) {
        (req as any).businessType = businessType;
        this.monitor.addMarker((req as any).correlationId, `business_${businessType}_start`);
      }

      next();
    };
  }

  /**
   * Get performance metrics
   */
  public getMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Get performance summary
   */
  public getSummary() {
    return this.monitor.getPerformanceSummary();
  }

  /**
   * Get active alerts
   */
  public getAlerts() {
    return this.monitor.getActiveAlerts();
  }

  // Private methods
  private setupEventListeners(): void {
    // Listen to performance events
    this.monitor.on('alert:generated', (alert) => {
      console.log(JSON.stringify({
        event: 'performance_alert',
        alert,
        service: this.config.serviceName,
        timestamp: new Date().toISOString()
      }));
    });

    this.monitor.on('performance:degraded', (data) => {
      console.log(JSON.stringify({
        event: 'performance_degradation',
        data,
        service: this.config.serviceName,
        timestamp: new Date().toISOString()
      }));
    });

    this.monitor.on('metrics:collected', (data) => {
      if (this.config.enableDetailedTracking) {
        console.log(JSON.stringify({
          event: 'metrics_collected',
          metrics: data.metrics,
          service: this.config.serviceName,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  private detectBusinessOperationType(req: Request): string | null {
    // Detect business operation type based on URL patterns
    const path = req.path.toLowerCase();
    
    if (path.includes('/payment') || path.includes('/pay')) return 'payment';
    if (path.includes('/order')) return 'order';
    if (path.includes('/product')) return 'product';
    if (path.includes('/user') || path.includes('/auth')) return 'user';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/inventory')) return 'inventory';
    
    return null;
  }
}

// Helper function to extract business context
function extractBusinessContext(req: Request, responseData?: any): BusinessContext {
  const context: BusinessContext = {};

  // Extract from user context
  if ((req as any).user) {
    context.userId = (req as any).user.userId;
  }

  // Extract from request body
  if (req.body) {
    context.customerId = req.body.customerId;
    context.amount = req.body.amount;
    context.productIds = req.body.productIds;
    context.paymentMethod = req.body.paymentMethod;
    context.region = req.body.region;
  }

  // Extract from response data
  if (responseData && typeof responseData === 'object') {
    if (responseData.transactionType) context.transactionType = responseData.transactionType;
    if (responseData.amount) context.amount = responseData.amount;
  }

  // Detect transaction type from URL
  const path = req.path.toLowerCase();
  if (path.includes('/payment')) context.transactionType = 'payment';
  else if (path.includes('/order')) context.transactionType = 'order';
  else if (path.includes('/refund')) context.transactionType = 'refund';

  return context;
}

// Factory functions for different services
export const createUserServicePerformanceMiddleware = (customConfig?: Partial<PerformanceMiddlewareConfig>) =>
  new PerformanceMiddleware({
    serviceName: 'user-service',
    enableDetailedTracking: true,
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: false,
    ...customConfig
  });

export const createPaymentServicePerformanceMiddleware = (customConfig?: Partial<PerformanceMiddlewareConfig>) =>
  new PerformanceMiddleware({
    serviceName: 'payment-service',
    enableDetailedTracking: true,
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: true,
    customThresholds: {
      responseTime: { excellent: 50, good: 200, acceptable: 500, poor: 1000, critical: 2000 },
      business: { errorRate: { warning: 0.001, critical: 0.005 } }
    },
    ...customConfig
  });

export const createOrderServicePerformanceMiddleware = (customConfig?: Partial<PerformanceMiddlewareConfig>) =>
  new PerformanceMiddleware({
    serviceName: 'order-service',
    enableDetailedTracking: true,
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: true,
    ...customConfig
  });

export const createProductServicePerformanceMiddleware = (customConfig?: Partial<PerformanceMiddlewareConfig>) =>
  new PerformanceMiddleware({
    serviceName: 'product-service',
    enableDetailedTracking: false, // Less detailed for product service
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: false,
    ...customConfig
  });

// Express middleware factory
export const createPerformanceMiddleware = (serviceName: string, customConfig?: Partial<PerformanceMiddlewareConfig>) => {
  const middleware = new PerformanceMiddleware({
    serviceName,
    enableDetailedTracking: true,
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: true,
    ...customConfig
  });

  return {
    trackRequest: middleware.trackRequest(),
    trackDatabase: middleware.trackDatabase(),
    trackCache: middleware.trackCache(),
    trackBusinessMetrics: middleware.trackBusinessMetrics(),
    getMetrics: () => middleware.getMetrics(),
    getSummary: () => middleware.getSummary(),
    getAlerts: () => middleware.getAlerts()
  };
};

export default PerformanceMiddleware; 