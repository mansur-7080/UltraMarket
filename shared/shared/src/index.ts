// Auth exports
export * from './auth';
// Cache exports
export * from './cache';
// Constants exports
export * from './constants';
// Error exports
export * from './errors';
// Logger exports
export * from './logger';
// Messaging exports
export * from './messaging';
// Types exports
export * from './types';
// Utils exports
export * from './utils';

// ⚡ PROFESSIONAL SYSTEMS EXPORTS - UltraMarket
export { 
  ProfessionalLogger, 
  logger as professionalLogger, 
  createLogger as createProfessionalLogger 
} from './logging/professional-logger';

export { 
  SecureEnvironmentManager, 
  secureEnvManager 
} from './config/secure-environment-manager';

export { 
  ApplicationError, 
  ProfessionalErrorHandler, 
  ErrorCodes, 
  ErrorSeverity,
  createBusinessError,
  createValidationError,
  createAuthError,
  createNotFoundError,
  errorHandler,
  asyncHandler 
} from './errors/unified-error-handler';

export { 
  SecurityValidator, 
  ValidationSchemas,
  validateRequest as validateRequestProfessional,
  createRateLimit,
  RateLimiters,
  SecurityMiddleware 
} from './validation/comprehensive-validation';

export { 
  ProfessionalDatabaseManager, 
  databaseManager as professionalDatabaseManager 
} from './database/professional-database-manager';

export { 
  ProfessionalPerformanceOptimizer, 
  performanceOptimizer as professionalPerformanceOptimizer,
  MultiLayerCache,
  PerformanceMonitor 
} from './performance/comprehensive-performance-optimizer';
// Explicitly export only needed validation and middleware symbols to avoid conflicts
export {
  passwordSchema,
  jwtSecretSchema,
  databaseUrlSchema,
  baseEnvironmentSchema,
  userServiceEnvironmentSchema,
  productServiceEnvironmentSchema,
  cartServiceEnvironmentSchema,
  orderServiceEnvironmentSchema,
  apiGatewayEnvironmentSchema,
  emailSchema,
  usernameSchema,
  phoneSchema,
  uuidSchema,
  sanitizeInput,
  sanitizeHtml,
  validateEnvironment,
  validateRequest,
  ValidationError,
  rateLimitSchema,
  fileUploadSchema,
  schemas,
} from './validation';
// Export securityHeaders and other middleware as needed
export { securityHeaders, xssProtection, sqlInjectionProtection } from './middleware/security';
