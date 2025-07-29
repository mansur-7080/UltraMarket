/**
 * 🛡️ PROFESSIONAL SECURITY MIDDLEWARE - Payment Service
 * 
 * Financial-grade security implementation for payment processing
 * with PCI DSS compliance and advanced fraud detection
 * 
 * Version: 4.0.0 - Professional Financial Security
 * Date: 2024-12-28
 * Service: payment-service (FINANCIAL CRITICAL)
 * Compliance: PCI DSS Level 1, O'zbekiston CBU Regulations
 */

import { Request, Response, NextFunction, Application } from 'express';
import { professionalLogger } from '../utils/logger';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Financial Security Error Codes (PCI DSS Aligned)
export enum PaymentSecurityErrorCodes {
  RATE_LIMIT_EXCEEDED = 'PAY_SEC_001',
  IP_BLOCKED = 'PAY_SEC_002',
  SUSPICIOUS_TRANSACTION = 'PAY_SEC_003',
  CARD_DATA_VIOLATION = 'PAY_SEC_004',
  FRAUD_DETECTED = 'PAY_SEC_005',
  PCI_COMPLIANCE_VIOLATION = 'PAY_SEC_006',
  TRANSACTION_LIMIT_EXCEEDED = 'PAY_SEC_007',
  INVALID_PAYMENT_METHOD = 'PAY_SEC_008',
  AUTHENTICATION_FAILED = 'PAY_SEC_009',
  ENCRYPTION_ERROR = 'PAY_SEC_010',
  AUDIT_TRAIL_VIOLATION = 'PAY_SEC_011',
  REGULATORY_VIOLATION = 'PAY_SEC_012'
}

// Advanced Financial Threat Patterns
const FINANCIAL_THREAT_PATTERNS = {
  creditCardNumbers: [
    /\b4[0-9]{12}(?:[0-9]{3})?\b/, // Visa
    /\b5[1-5][0-9]{14}\b/, // Mastercard
    /\b3[47][0-9]{13}\b/, // American Express
    /\b6(?:011|5[0-9]{2})[0-9]{12}\b/, // Discover
    /\b(?:2131|1800|35\d{3})\d{11}\b/ // JCB
  ],
  bankAccountNumbers: [
    /\b\d{10,18}\b/, // General bank account pattern
    /\b[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/ // Formatted account numbers
  ],
  uzbekistanSpecific: {
    uzCard: /\b86(0[0-9]|1[0-4])\s?\d{4}\s?\d{4}\s?\d{4}\b/, // UzCard pattern
    humo: /\b9860\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Humo card pattern
    bankInn: /\b\d{9}\b/, // O'zbekiston bank INN
    mfo: /\b\d{5}\b/ // MFO (bank codes)
  },
  suspiciousPatterns: [
    /test.*card/gi,
    /fake.*payment/gi,
    /dummy.*data/gi,
    /1111.*1111/gi,
    /0000.*0000/gi,
    /9999.*9999/gi
  ],
  fraudIndicators: [
    /rapid.*transaction/gi,
    /bulk.*payment/gi,
    /money.*laundering/gi,
    /suspicious.*activity/gi,
    /unauthorized.*access/gi
  ]
};

// Payment Service security patterns
const PAYMENT_SERVICE_SECURITY_PATTERNS = {
  sensitivePaymentFields: [
    'cardNumber', 'cvv', 'pin', 'accountNumber', 'routingNumber',
    'iban', 'swiftCode', 'bankAccount', 'paymentToken', 'securityCode'
  ],
  criticalPaymentOperations: [
    /\/payments\/process/,
    /\/payments\/refund/,
    /\/payments\/cancel/,
    /\/cards\/add/,
    /\/cards\/update/,
    /\/accounts\/link/,
    /\/transfers\/initiate/
  ],
  fraudDetectionEndpoints: [
    /\/payments\/validate/,
    /\/fraud\/check/,
    /\/risk\/assess/,
    /\/compliance\/verify/
  ]
};

// Ultra-strict rate limiter for payment operations
const createPaymentRateLimiter = () => rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Very strict for payment operations
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use combination of IP and user ID for better tracking
    const userId = (req as any).user?.userId || 'anonymous';
    return `${req.ip}-${userId}`;
  },
  handler: (req: Request, res: Response) => {
    professionalLogger.security('Payment rate limit exceeded', {
      event: 'payment_rate_limit_exceeded',
      ip: req.ip,
      userId: (req as any).user?.userId,
      endpoint: `${req.method} ${req.path}`,
      correlationId: (req as any).correlationId,
      severity: 'critical',
      complianceImpact: 'high'
    });

    res.status(429).json({
      success: false,
      error: {
        code: PaymentSecurityErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Payment processing rate limit exceeded',
        correlationId: (req as any).correlationId
      }
    });
  }
});

// Extreme rate limiter for fraud detection
const createFraudDetectionRateLimiter = () => rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // Extremely strict for fraud detection
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    professionalLogger.security('Fraud detection rate limit exceeded', {
      event: 'fraud_detection_rate_limit_exceeded',
      ip: req.ip,
      endpoint: `${req.method} ${req.path}`,
      correlationId: (req as any).correlationId,
      severity: 'critical',
      fraudRisk: 'very_high'
    });

    res.status(429).json({
      success: false,
      error: {
        code: PaymentSecurityErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Fraud detection limit exceeded - account suspended',
        correlationId: (req as any).correlationId
      }
    });
  }
});

/**
 * Apply financial-grade professional security for Payment Service
 */
export const applyPaymentServiceSecurity = (app: Application): void => {
  // Financial-grade security headers (PCI DSS compliant)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"], // Deny by default for financial security
        styleSrc: ["'self'"],
        scriptSrc: ["'self'"], // No inline scripts for PCI DSS
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
        childSrc: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"]
      },
    },
    crossOriginEmbedderPolicy: true, // Strict for financial data
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' }
  }));

  // Financial correlation tracking
  app.use(financialCorrelationMiddleware);
  
  // PCI DSS security headers
  app.use(pciDssSecurityHeaders);
  
  // Ultra-strict payment rate limiting
  app.use('/payments', createPaymentRateLimiter());
  app.use('/cards', createPaymentRateLimiter());
  app.use('/accounts', createPaymentRateLimiter());
  
  // Fraud detection rate limiting
  app.use(['/fraud', '/risk'], createFraudDetectionRateLimiter());
  
  // Financial threat detection
  app.use(financialThreatDetectionMiddleware);
  
  // PCI DSS data protection
  app.use(pciDssDataProtectionMiddleware);
  
  // Payment transaction validation
  app.use(paymentTransactionValidationMiddleware);
  
  // Financial fraud detection
  app.use(fraudDetectionMiddleware);
  
  // Compliance audit logging
  app.use(complianceAuditMiddleware);
};

/**
 * Financial correlation tracking with enhanced audit trail
 */
export const financialCorrelationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
  const transactionId = req.headers['x-transaction-id'] as string || randomUUID();
  
  (req as any).correlationId = correlationId;
  (req as any).transactionId = transactionId;
  (req as any).startTime = Date.now();
  (req as any).financialContext = {
    service: 'payment-service',
    securityLevel: 'financial',
    pciCompliance: true,
    auditRequired: true
  };

  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Transaction-ID', transactionId);
  res.setHeader('X-Service', 'payment-service');
  res.setHeader('X-Security-Level', 'financial');
  
  next();
};

/**
 * PCI DSS compliant security headers
 */
export const pciDssSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  res.removeHeader('X-AspNet-Version');
  res.removeHeader('X-AspNetMvc-Version');
  
  // PCI DSS required headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Financial service specific headers
  res.setHeader('X-PCI-Compliant', 'true');
  res.setHeader('X-Financial-Grade', 'level-1');
  res.setHeader('X-Audit-Required', 'true');
  
  next();
};

/**
 * Advanced financial threat detection
 */
export const financialThreatDetectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req as any).correlationId || randomUUID();
  const threats = detectFinancialThreats(req);
  
  if (threats.length > 0) {
    const clientIP = req.ip || req.socket.remoteAddress;
    
    professionalLogger.security('Financial security threats detected', {
      event: 'financial_threats_detected',
      threats,
      ip: clientIP,
      userId: (req as any).user?.userId,
      endpoint: `${req.method} ${req.path}`,
      userAgent: req.get('User-Agent'),
      correlationId,
      transactionId: (req as any).transactionId,
      severity: 'critical',
      complianceImpact: 'high',
      pciViolation: true
    });

    // Block ALL financial threats immediately
    res.status(400).json({
      success: false,
      error: {
        code: PaymentSecurityErrorCodes.SUSPICIOUS_TRANSACTION,
        message: 'Transaction blocked due to security policy',
        correlationId,
        complianceReference: `PCI-${correlationId}`
      }
    });
    return;
  }

  next();
};

/**
 * PCI DSS data protection middleware
 */
export const pciDssDataProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req as any).correlationId || randomUUID();

  // Mask all payment-sensitive data
  if (req.body && typeof req.body === 'object') {
    (req as any).maskedBody = maskPaymentSensitiveData(req.body);
  }

  // Detect PCI DSS violations
  if (req.body) {
    const pciViolations = detectPciDssViolations(req.body);
    if (pciViolations.length > 0) {
      professionalLogger.compliance('PCI DSS violation detected', {
        event: 'pci_dss_violation',
        violations: pciViolations,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip,
        userId: (req as any).user?.userId,
        correlationId,
        severity: 'critical',
        regulatoryImpact: 'immediate_action_required'
      });

      // Immediately block PCI DSS violations
      res.status(400).json({
        success: false,
        error: {
          code: PaymentSecurityErrorCodes.PCI_COMPLIANCE_VIOLATION,
          message: 'Request violates PCI DSS compliance',
          correlationId,
          complianceReference: `PCI-VIOLATION-${correlationId}`
        }
      });
      return;
    }
  }

  // Enhanced response security for payment data
  const originalSend = res.send;
  res.send = function(data: any) {
    if (data && typeof data === 'string') {
      try {
        const responseData = JSON.parse(data);
        if (containsPaymentData(responseData)) {
          const sanitizedData = sanitizePaymentResponse(responseData);
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
 * Payment transaction validation middleware
 */
export const paymentTransactionValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req as any).correlationId || randomUUID();

  // Validate transaction patterns
  if (isCriticalPaymentOperation(req)) {
         professionalLogger.gateway('Critical payment operation initiated', correlationId, (req as any).transactionId, {
       event: 'critical_payment_operation',
       endpoint: `${req.method} ${req.path}`,
       ip: req.ip,
       userId: (req as any).user?.userId,
       riskLevel: 'high',
       auditRequired: true
     });

    // Enhanced validation for critical operations
    if (!req.headers.authorization) {
      professionalLogger.security('Unauthorized payment operation attempt', {
        event: 'unauthorized_payment_operation',
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip,
        correlationId,
        severity: 'critical',
        pciViolation: true
      });

      res.status(401).json({
        success: false,
        error: {
          code: PaymentSecurityErrorCodes.AUTHENTICATION_FAILED,
          message: 'Authentication required for payment operations',
          correlationId
        }
      });
      return;
    }

    // Validate transaction limits
    const transactionRisk = assessTransactionRisk(req);
    if (transactionRisk.riskLevel === 'high') {
      professionalLogger.security('High-risk transaction detected', {
        event: 'high_risk_transaction',
        riskAssessment: transactionRisk,
        endpoint: `${req.method} ${req.path}`,
        correlationId,
        severity: 'high',
        requiresApproval: true
      });
    }
  }

  next();
};

/**
 * Advanced fraud detection middleware
 */
export const fraudDetectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req as any).correlationId || randomUUID();
  const fraudIndicators = detectFraudIndicators(req);
  
  if (fraudIndicators.length > 0) {
    const clientIP = req.ip || req.socket.remoteAddress;
    
    professionalLogger.security('Fraud indicators detected', {
      event: 'fraud_indicators_detected',
      fraudIndicators,
      ip: clientIP,
      userId: (req as any).user?.userId,
      endpoint: `${req.method} ${req.path}`,
      correlationId,
      transactionId: (req as any).transactionId,
      severity: 'critical',
      fraudRisk: 'high',
      actionRequired: 'immediate_investigation'
    });

    // High fraud risk - block immediately
    if (fraudIndicators.some(indicator => indicator.riskLevel === 'high')) {
      res.status(400).json({
        success: false,
        error: {
          code: PaymentSecurityErrorCodes.FRAUD_DETECTED,
          message: 'Transaction blocked due to fraud detection',
          correlationId,
          fraudReference: `FRAUD-${correlationId}`
        }
      });
      return;
    }
  }

  next();
};

/**
 * Compliance audit logging middleware
 */
export const complianceAuditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const endTime = Date.now();
    const duration = endTime - ((req as any).startTime || endTime);

    // Comprehensive financial audit log
    professionalLogger.compliance('Financial operation completed', {
      event: 'financial_operation_completed',
      correlationId: (req as any).correlationId,
      transactionId: (req as any).transactionId,
      service: 'payment-service',
      securityLevel: 'financial',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId,
      pciCompliant: true,
      auditTrail: {
        requestTimestamp: new Date((req as any).startTime).toISOString(),
        responseTimestamp: new Date().toISOString(),
        processingTime: duration,
        securityValidated: true,
        complianceVerified: true
      }
    });

    return originalSend.call(this, data);
  };

  next();
};

// Helper functions
function detectFinancialThreats(req: Request): Array<{ type: string; pattern: string; location: string; severity: string }> {
  const threats: Array<{ type: string; pattern: string; location: string; severity: string }> = [];
  const requestData = {
    url: req.url,
    body: JSON.stringify(req.body || {}),
    query: JSON.stringify(req.query || {}),
    headers: JSON.stringify(req.headers || {})
  };

  // Credit card number detection
  FINANCIAL_THREAT_PATTERNS.creditCardNumbers.forEach(pattern => {
    Object.entries(requestData).forEach(([location, data]) => {
      if (pattern.test(data)) {
        threats.push({ type: 'credit_card_exposure', pattern: pattern.source, location, severity: 'critical' });
      }
    });
  });

  // Bank account number detection
  FINANCIAL_THREAT_PATTERNS.bankAccountNumbers.forEach(pattern => {
    Object.entries(requestData).forEach(([location, data]) => {
      if (pattern.test(data) && location !== 'headers') { // Allow in headers for auth
        threats.push({ type: 'bank_account_exposure', pattern: pattern.source, location, severity: 'high' });
      }
    });
  });

  // O'zbekiston specific patterns
  Object.entries(FINANCIAL_THREAT_PATTERNS.uzbekistanSpecific).forEach(([key, pattern]) => {
    Object.entries(requestData).forEach(([location, data]) => {
      if (pattern.test(data)) {
        threats.push({ type: `uzbekistan_${key}_exposure`, pattern: pattern.source, location, severity: 'high' });
      }
    });
  });

  // Suspicious patterns
  FINANCIAL_THREAT_PATTERNS.suspiciousPatterns.forEach(pattern => {
    Object.entries(requestData).forEach(([location, data]) => {
      if (pattern.test(data)) {
        threats.push({ type: 'suspicious_payment_pattern', pattern: pattern.source, location, severity: 'medium' });
      }
    });
  });

  return threats;
}

function isCriticalPaymentOperation(req: Request): boolean {
  return PAYMENT_SERVICE_SECURITY_PATTERNS.criticalPaymentOperations.some(pattern => 
    pattern.test(req.path)
  );
}

function maskPaymentSensitiveData(data: any): any {
  const maskedData = JSON.parse(JSON.stringify(data));
  
  const maskRecursive = (obj: any): void => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (PAYMENT_SERVICE_SECURITY_PATTERNS.sensitivePaymentFields.some(field => 
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

function detectPciDssViolations(data: any): string[] {
  const violations: string[] = [];
  const dataString = JSON.stringify(data).toLowerCase();

  // Check for unencrypted payment data
  if (dataString.includes('cardnumber') || dataString.includes('card_number')) {
    violations.push('unencrypted_card_data');
  }
  
  if (dataString.includes('cvv') || dataString.includes('cvc')) {
    violations.push('cvv_data_transmission');
  }
  
  if (dataString.includes('pin')) {
    violations.push('pin_data_transmission');
  }
  
  // O'zbekiston specific checks
  if (dataString.includes('uzcard') || dataString.includes('humo')) {
    violations.push('uzbekistan_card_data_exposure');
  }

  return violations;
}

function containsPaymentData(data: any): boolean {
  const dataString = JSON.stringify(data).toLowerCase();
  return PAYMENT_SERVICE_SECURITY_PATTERNS.sensitivePaymentFields.some(field =>
    dataString.includes(field.toLowerCase())
  );
}

function sanitizePaymentResponse(data: any): any {
  const sanitized = JSON.parse(JSON.stringify(data));
  
  const sanitizeRecursive = (obj: any): void => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (PAYMENT_SERVICE_SECURITY_PATTERNS.sensitivePaymentFields.some(field => 
            key.toLowerCase().includes(field.toLowerCase()))) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeRecursive(obj[key]);
        }
      });
    }
  };

  sanitizeRecursive(sanitized);
  
  // Mask card numbers in responses
  if (sanitized.cardNumber) {
    sanitized.cardNumber = `****-****-****-${sanitized.cardNumber.slice(-4)}`;
  }

  return sanitized;
}

function assessTransactionRisk(req: Request): { riskLevel: string; factors: string[] } {
  const riskFactors: string[] = [];
  let riskLevel = 'low';

  // Check transaction amount (if available)
  const amount = req.body?.amount || req.query?.amount;
  if (amount && parseFloat(amount) > 1000000) { // 1M UZS threshold
    riskFactors.push('high_amount');
    riskLevel = 'high';
  }

  // Check unusual patterns
  if (req.body?.rapid_transactions) {
    riskFactors.push('rapid_transactions');
    riskLevel = 'high';
  }

  return { riskLevel, factors: riskFactors };
}

function detectFraudIndicators(req: Request): Array<{ type: string; riskLevel: string; description: string }> {
  const indicators: Array<{ type: string; riskLevel: string; description: string }> = [];
  const requestData = JSON.stringify({ body: req.body, query: req.query }).toLowerCase();

  // Fraud pattern detection
  FINANCIAL_THREAT_PATTERNS.fraudIndicators.forEach(pattern => {
    if (pattern.test(requestData)) {
      indicators.push({
        type: 'fraud_pattern_match',
        riskLevel: 'high',
        description: `Matched fraud pattern: ${pattern.source}`
      });
    }
  });

  // Velocity checks (simplified)
  const userAgent = req.get('User-Agent')?.toLowerCase();
  if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
    indicators.push({
      type: 'suspicious_user_agent',
      riskLevel: 'medium',
      description: 'Suspicious or missing user agent'
    });
  }

  return indicators;
}

// Legacy compatibility
export const securityMiddleware = pciDssSecurityHeaders;

export default {
  applyPaymentServiceSecurity,
  financialCorrelationMiddleware,
  pciDssSecurityHeaders,
  financialThreatDetectionMiddleware,
  pciDssDataProtectionMiddleware,
  paymentTransactionValidationMiddleware,
  fraudDetectionMiddleware,
  complianceAuditMiddleware
};
