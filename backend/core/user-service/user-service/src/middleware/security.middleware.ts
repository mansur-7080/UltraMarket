/**
 * 🛡️ PROFESSIONAL SECURITY MIDDLEWARE - User Service
 * 
 * Professional security implementation for user management operations
 * with advanced authentication security and user data protection
 * 
 * Version: 4.0.0 - Professional Security Integration
 * Date: 2024-12-28
 * Service: user-service (HIGH SECURITY)
 */

import { Request, Response, NextFunction, Application } from 'express';
import { professionalLogger } from '../utils/logger';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Professional Security Error Codes
export enum SecurityErrorCodes {
  RATE_LIMIT_EXCEEDED = 'SEC_001',
  IP_BLOCKED = 'SEC_002',
  SUSPICIOUS_ACTIVITY = 'SEC_003',
  SQL_INJECTION_ATTEMPT = 'SEC_004',
  XSS_ATTEMPT = 'SEC_005',
  CSRF_VIOLATION = 'SEC_006',
  PATH_TRAVERSAL_ATTEMPT = 'SEC_007',
  DATA_EXFILTRATION_ATTEMPT = 'SEC_008',
  INVALID_AUTHENTICATION = 'SEC_009',
  UNAUTHORIZED_ACCESS = 'SEC_010',
  MALFORMED_REQUEST = 'SEC_011',
  SECURITY_HEADER_VIOLATION = 'SEC_012'
}

// Professional Threat Patterns
const ADVANCED_THREAT_PATTERNS = {
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION.*SELECT|SELECT.*FROM|INSERT.*INTO|UPDATE.*SET)/i,
    /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/i,
    /(\'|\"|`|;|--|\*|\/\*|\*\/)/,
    /(\bxp_cmdshell\b|\bsp_executesql\b)/i
  ],
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["\'].*?["\']|on\w+\s*=\s*[^>\s]*/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi
  ],
  pathTraversal: [
    /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/gi,
    /%2e%2e%2f|%2e%2e%5c|%252e%252e%252f/gi,
    /\/etc\/passwd|\/etc\/shadow|\/etc\/hosts/gi,
    /\\windows\\system32|\\windows\\system/gi,
    /proc\/self\/environ|proc\/version|proc\/cmdline/gi
  ]
};

// User-specific security patterns
const USER_SERVICE_SECURITY_PATTERNS = {
  sensitiveUserFields: ['password', 'email', 'phone', 'passport', 'address', 'inn', 'birthDate'],
  suspiciousUserOperations: [
    /\/users\/\d+\/password/,
    /\/users\/\d+\/email/,
    /\/users\/\d+\/phone/,
    /\/auth\/reset-password/,
    /\/auth\/verify-email/,
    /\/auth\/change-password/
  ],
  bruteForcePatterns: [
    /\/auth\/login/,
    /\/auth\/verify/,
    /\/users\/profile/
  ]
};

// Professional rate limiter for User Service
const createUserServiceRateLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Strict for user operations
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  handler: (req: Request, res: Response) => {
    professionalLogger.security('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip: req.ip,
      endpoint: `${req.method} ${req.path}`,
      correlationId: (req as any).correlationId,
      severity: 'high'
    });

    res.status(429).json({
      success: false,
      error: {
        code: SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests, please try again later',
        correlationId: (req as any).correlationId
      }
    });
  }
});

// Strict rate limiter for auth endpoints
const createAuthRateLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Very strict for auth
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    professionalLogger.security('Auth rate limit exceeded', {
      event: 'auth_rate_limit_exceeded',
      ip: req.ip,
      endpoint: `${req.method} ${req.path}`,
      correlationId: (req as any).correlationId,
      severity: 'critical'
    });

    res.status(429).json({
      success: false,
      error: {
        code: SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Too many authentication attempts',
        correlationId: (req as any).correlationId
      }
    });
  }
});

/**
 * Apply comprehensive professional security for User Service
 */
export const applyUserServiceSecurity = (app: Application): void => {
  // Professional security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Correlation tracking
  app.use(correlationTrackingMiddleware);
  
  // Professional security headers
  app.use(professionalSecurityHeaders);
  
  // Rate limiting
  app.use(createUserServiceRateLimiter());
  
  // Strict auth rate limiting
  app.use('/auth', createAuthRateLimiter());
  
  // Threat detection
  app.use(threatDetectionMiddleware);
  
  // User-specific security
  app.use(userSpecificSecurityMiddleware);
  
  // User data protection
  app.use(userDataProtectionMiddleware);
  
  // Authentication security
  app.use(authenticationSecurityMiddleware);
  
  // Security audit
  app.use(securityAuditMiddleware);
};

/**
 * Correlation tracking middleware
 */
export const correlationTrackingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
  
  (req as any).correlationId = correlationId;
  (req as any).startTime = Date.now();
  
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Service', 'user-service');
  
  next();
};

/**
 * Professional security headers middleware
 */
export const professionalSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  next();
};

/**
 * Advanced threat detection middleware
 */
export const threatDetectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req as any).correlationId || randomUUID();
  const threats = detectThreats(req);
  
  if (threats.length > 0) {
    const clientIP = req.ip || req.socket.remoteAddress;
    
    professionalLogger.security('Security threats detected', {
      event: 'threats_detected',
      threats,
      ip: clientIP,
      endpoint: `${req.method} ${req.path}`,
      userAgent: req.get('User-Agent'),
      correlationId,
      severity: 'high'
    });

    // Block high-severity threats
    const highSeverityThreats = ['sql_injection', 'xss', 'path_traversal'];
    if (threats.some(threat => highSeverityThreats.includes(threat.type))) {
      res.status(400).json({
        success: false,
        error: {
          code: SecurityErrorCodes.SUSPICIOUS_ACTIVITY,
          message: 'Request blocked due to security policy',
          correlationId
        }
      });
      return;
    }
  }

  next();
};

/**
 * User-specific security middleware
 */
export const userSpecificSecurityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req as any).correlationId || randomUUID();
  const clientIP = req.ip || req.socket.remoteAddress;

  // Monitor sensitive user operations
  if (isUserSensitiveOperation(req)) {
    professionalLogger.security('Sensitive user operation detected', {
      event: 'sensitive_user_operation',
      endpoint: `${req.method} ${req.path}`,
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      correlationId,
      severity: 'high'
    });

    // Require authentication for sensitive operations
    if (!req.headers.authorization && requiresAuthentication(req)) {
      professionalLogger.security('Unauthenticated sensitive operation attempt', {
        event: 'unauthenticated_sensitive_operation',
        endpoint: `${req.method} ${req.path}`,
        ip: clientIP,
        correlationId,
        severity: 'critical'
      });

      res.status(401).json({
        success: false,
        error: {
          code: SecurityErrorCodes.INVALID_AUTHENTICATION,
          message: 'Authentication required for this operation',
          correlationId
        }
      });
      return;
    }
  }

  // Monitor brute force attempts
  if (isBruteForcePattern(req)) {
    professionalLogger.security('Potential brute force attempt', {
      event: 'brute_force_attempt',
      endpoint: `${req.method} ${req.path}`,
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      correlationId,
      severity: 'high'
    });
  }

  next();
};

/**
 * User data protection middleware
 */
export const userDataProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req as any).correlationId || randomUUID();

  // Mask sensitive user data
  if (req.body && typeof req.body === 'object') {
    (req as any).maskedBody = maskUserSensitiveData(req.body);
  }

  // Detect O'zbekiston data violations
  if (req.body) {
    const dataViolations = detectUserDataViolations(req.body);
    if (dataViolations.length > 0) {
      professionalLogger.security('User data policy violation', {
        event: 'user_data_violation',
        violations: dataViolations,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip,
        correlationId,
        severity: 'medium'
      });
    }
  }

  // Sanitize user responses
  const originalSend = res.send;
  res.send = function(data: any) {
    if (data && typeof data === 'string') {
      try {
        const responseData = JSON.parse(data);
        if (responseData.user || responseData.users) {
          const sanitizedData = sanitizeUserResponse(responseData);
          return originalSend.call(this, JSON.stringify(sanitizedData));
        }
      } catch (e) {
        // Not JSON, proceed normally
      }
    }
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Authentication security middleware
 */
export const authenticationSecurityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req as any).correlationId || randomUUID();
  const authHeader = req.headers.authorization;

  // JWT token validation
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (!isValidTokenFormat(token)) {
      professionalLogger.security('Invalid token format detected', {
        event: 'invalid_token_format',
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip,
        tokenLength: token.length,
        correlationId,
        severity: 'medium'
      });

      res.status(401).json({
        success: false,
        error: {
          code: SecurityErrorCodes.INVALID_AUTHENTICATION,
          message: 'Invalid token format',
          correlationId
        }
      });
      return;
    }

    if (!hasGoodTokenEntropy(token)) {
      professionalLogger.security('Low entropy token detected', {
        event: 'weak_token_detected',
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip,
        correlationId,
        severity: 'high'
      });
    }
  }

  // Log auth operations
  if (req.path.includes('/auth/')) {
    professionalLogger.audit('Authentication operation', {
      action: 'auth_operation',
      endpoint: `${req.method} ${req.path}`,
      hasAuth: !!authHeader,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      correlationId
    });
  }

  next();
};

/**
 * Security audit logging middleware
 */
export const securityAuditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const endTime = Date.now();
    const duration = endTime - ((req as any).startTime || endTime);

    // Log security audit event
    professionalLogger.audit('API request completed', {
      action: 'api_request_completed',
      correlationId: (req as any).correlationId,
      service: 'user-service',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId
    });

    return originalSend.call(this, data);
  };

  next();
};

// Helper functions
function detectThreats(req: Request): Array<{ type: string; pattern: string; location: string }> {
  const threats: Array<{ type: string; pattern: string; location: string }> = [];
  const requestData = {
    url: req.url,
    body: JSON.stringify(req.body || {}),
    query: JSON.stringify(req.query || {}),
    headers: JSON.stringify(req.headers || {})
  };

  // SQL Injection Detection
  ADVANCED_THREAT_PATTERNS.sqlInjection.forEach(pattern => {
    Object.entries(requestData).forEach(([location, data]) => {
      if (pattern.test(data)) {
        threats.push({ type: 'sql_injection', pattern: pattern.source, location });
      }
    });
  });

  // XSS Detection
  ADVANCED_THREAT_PATTERNS.xss.forEach(pattern => {
    Object.entries(requestData).forEach(([location, data]) => {
      if (pattern.test(data)) {
        threats.push({ type: 'xss', pattern: pattern.source, location });
      }
    });
  });

  // Path Traversal Detection
  ADVANCED_THREAT_PATTERNS.pathTraversal.forEach(pattern => {
    Object.entries(requestData).forEach(([location, data]) => {
      if (pattern.test(data)) {
        threats.push({ type: 'path_traversal', pattern: pattern.source, location });
      }
    });
  });

  return threats;
}

function isUserSensitiveOperation(req: Request): boolean {
  return USER_SERVICE_SECURITY_PATTERNS.suspiciousUserOperations.some(pattern => 
    pattern.test(req.path)
  );
}

function requiresAuthentication(req: Request): boolean {
  const publicEndpoints = ['/health', '/metrics', '/auth/login', '/auth/register'];
  return !publicEndpoints.some(endpoint => req.path.startsWith(endpoint));
}

function isBruteForcePattern(req: Request): boolean {
  return USER_SERVICE_SECURITY_PATTERNS.bruteForcePatterns.some(pattern => 
    pattern.test(req.path)
  );
}

function maskUserSensitiveData(data: any): any {
  const maskedData = JSON.parse(JSON.stringify(data));
  
  const maskRecursive = (obj: any): void => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (USER_SERVICE_SECURITY_PATTERNS.sensitiveUserFields.some(field => 
            key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '***MASKED***';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          maskRecursive(obj[key]);
        }
      });
    }
  };

  maskRecursive(maskedData);
  return maskedData;
}

function detectUserDataViolations(data: any): string[] {
  const violations: string[] = [];
  
  const uzbekPatterns = {
    passport: /[A-Z]{2}\d{7}/g,
    phone: /(\+998|998)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g,
    inn: /\b\d{9}\b/g
  };

  const dataString = JSON.stringify(data);
  
  Object.entries(uzbekPatterns).forEach(([type, pattern]) => {
    if (pattern.test(dataString)) {
      violations.push(`potential_${type}_exposure`);
    }
  });

  return violations;
}

function sanitizeUserResponse(data: any): any {
  const sanitized = JSON.parse(JSON.stringify(data));
  
  const sanitizeUser = (user: any) => {
    if (user && typeof user === 'object') {
      const sensitiveFields = ['password', 'passwordHash', 'salt', 'refreshToken', 'resetToken'];
      sensitiveFields.forEach(field => {
        delete user[field];
      });
      
      if (user.email) {
        const [username, domain] = user.email.split('@');
        user.email = `${username.slice(0, 2)}***@${domain}`;
      }
      
      if (user.phone) {
        user.phone = user.phone.replace(/(\d{3})\d{3}(\d{2})/, '$1***$2');
      }
    }
    return user;
  };

  if (sanitized.user) {
    sanitized.user = sanitizeUser(sanitized.user);
  }
  
  if (sanitized.users && Array.isArray(sanitized.users)) {
    sanitized.users = sanitized.users.map(sanitizeUser);
  }

  return sanitized;
}

function isValidTokenFormat(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    parts.forEach(part => {
      Buffer.from(part, 'base64');
    });
    return true;
  } catch (e) {
    return false;
  }
}

function hasGoodTokenEntropy(token: string): boolean {
  const uniqueChars = new Set(token).size;
  const entropyRatio = uniqueChars / token.length;
  return entropyRatio >= 0.4;
}

// Legacy compatibility
export const securityMiddleware = userSpecificSecurityMiddleware;

export default { 
  applyUserServiceSecurity, 
  userSpecificSecurityMiddleware, 
  userDataProtectionMiddleware, 
  authenticationSecurityMiddleware,
  correlationTrackingMiddleware,
  professionalSecurityHeaders,
  threatDetectionMiddleware,
  securityAuditMiddleware
};
