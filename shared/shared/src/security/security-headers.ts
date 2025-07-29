/**
 * 🛡️ SECURITY HEADERS MIDDLEWARE - UltraMarket
 * 
 * Comprehensive security headers implementation
 * Protects against XSS, CSRF, clickjacking, and other attacks
 * 
 * @author UltraMarket Security Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import { Request, Response, NextFunction } from 'express';
import { getValidatedEnv } from '../config/environment-validator';

export interface SecurityHeadersConfig {
  // Content Security Policy
  cspEnabled: boolean;
  cspReportOnly: boolean;
  cspDirectives: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    mediaSrc: string[];
    frameSrc: string[];
    workerSrc: string[];
    manifestSrc: string[];
    prefetchSrc: string[];
    baseUri: string[];
    formAction: string[];
    frameAncestors: string[];
    upgradeInsecureRequests: boolean;
    blockAllMixedContent: boolean;
  };
  
  // Other security headers
  hstsEnabled: boolean;
  hstsMaxAge: number;
  hstsIncludeSubDomains: boolean;
  hstsPreload: boolean;
  
  xFrameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  xContentTypeOptions: boolean;
  xXSSProtection: boolean;
  xXSSProtectionMode: '0' | '1' | '1; mode=block';
  
  referrerPolicy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  
  permissionsPolicy: {
    camera: string[];
    microphone: string[];
    geolocation: string[];
    payment: string[];
    usb: string[];
    magnetometer: string[];
    gyroscope: string[];
    accelerometer: string[];
    ambientLightSensor: string[];
    autoplay: string[];
    encryptedMedia: string[];
    fullscreen: string[];
    pictureInPicture: string[];
    publickeyCredentialsGet: string[];
    screenWakeLock: string[];
    syncXhr: string[];
    webShare: string[];
  };
  
  // Rate limiting
  rateLimitEnabled: boolean;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  
  // CORS
  corsEnabled: boolean;
  corsOrigins: string[];
  corsMethods: string[];
  corsHeaders: string[];
  corsCredentials: boolean;
  corsMaxAge: number;
  
  // Additional security
  removeServerHeader: boolean;
  removeXPoweredBy: boolean;
  enableExpectCt: boolean;
  enablePublicKeyPins: boolean;
}

export class SecurityHeadersMiddleware {
  private config: SecurityHeadersConfig;

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Get default security configuration
   */
  private getDefaultConfig(): SecurityHeadersConfig {
    const env = getValidatedEnv();
    
    return {
      // Content Security Policy
      cspEnabled: true,
      cspReportOnly: false,
      cspDirectives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Remove in production
          "'unsafe-eval'",   // Remove in production
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com",
          "https://connect.facebook.net"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Remove in production
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "https://www.google-analytics.com",
          "https://www.facebook.com"
        ],
        connectSrc: [
          "'self'",
          "https://api.ultramarket.com",
          "https://www.google-analytics.com",
          "https://graph.facebook.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com"
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.facebook.com",
          "https://www.youtube.com"
        ],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        prefetchSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: env.NODE_ENV === 'production',
        blockAllMixedContent: true
      },
      
      // HSTS
      hstsEnabled: env.NODE_ENV === 'production',
      hstsMaxAge: 31536000, // 1 year
      hstsIncludeSubDomains: true,
      hstsPreload: true,
      
      // X-Frame-Options
      xFrameOptions: 'DENY',
      xContentTypeOptions: true,
      xXSSProtection: true,
      xXSSProtectionMode: '1; mode=block',
      
      // Referrer Policy
      referrerPolicy: 'strict-origin-when-cross-origin',
      
      // Permissions Policy
      permissionsPolicy: {
        camera: ['none'],
        microphone: ['none'],
        geolocation: ['none'],
        payment: ['none'],
        usb: ['none'],
        magnetometer: ['none'],
        gyroscope: ['none'],
        accelerometer: ['none'],
        ambientLightSensor: ['none'],
        autoplay: ['none'],
        encryptedMedia: ['none'],
        fullscreen: ['self'],
        pictureInPicture: ['none'],
        publickeyCredentialsGet: ['none'],
        screenWakeLock: ['none'],
        syncXhr: ['none'],
        webShare: ['none']
      },
      
      // Rate limiting
      rateLimitEnabled: true,
      rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
      rateLimitMax: env.RATE_LIMIT_MAX,
      
      // CORS
      corsEnabled: true,
      corsOrigins: env.CORS_ORIGINS.split(','),
      corsMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      corsHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token'
      ],
      corsCredentials: true,
      corsMaxAge: 86400, // 24 hours
      
      // Additional security
      removeServerHeader: true,
      removeXPoweredBy: true,
      enableExpectCt: env.NODE_ENV === 'production',
      enablePublicKeyPins: false // Deprecated, but kept for legacy
    };
  }

  /**
   * Main middleware function
   */
  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Set security headers
      this.setSecurityHeaders(req, res);
      
      // Set CORS headers
      if (this.config.corsEnabled) {
        this.setCORSHeaders(req, res);
      }
      
      // Remove sensitive headers
      this.removeSensitiveHeaders(res);
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      
      next();
    } catch (error) {
      console.error('Security headers middleware error:', error);
      next();
    }
  };

  /**
   * Set comprehensive security headers
   */
  private setSecurityHeaders(req: Request, res: Response): void {
    // Content Security Policy
    if (this.config.cspEnabled) {
      const cspHeader = this.buildCSPHeader();
      const headerName = this.config.cspReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
      res.setHeader(headerName, cspHeader);
    }

    // HTTP Strict Transport Security
    if (this.config.hstsEnabled) {
      let hstsValue = `max-age=${this.config.hstsMaxAge}`;
      if (this.config.hstsIncludeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (this.config.hstsPreload) {
        hstsValue += '; preload';
      }
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // X-Frame-Options
    res.setHeader('X-Frame-Options', this.config.xFrameOptions);

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection
    if (this.config.xXSSProtection) {
      res.setHeader('X-XSS-Protection', this.config.xXSSProtectionMode);
    }

    // Referrer Policy
    res.setHeader('Referrer-Policy', this.config.referrerPolicy);

    // Permissions Policy
    const permissionsPolicy = this.buildPermissionsPolicyHeader();
    res.setHeader('Permissions-Policy', permissionsPolicy);

    // Expect-CT (Certificate Transparency)
    if (this.config.enableExpectCt) {
      res.setHeader('Expect-CT', 'max-age=86400, enforce, report-uri="https://ultramarket.report-uri.com/r/d/ct/enforce"');
    }

    // Public Key Pins (Deprecated but kept for legacy)
    if (this.config.enablePublicKeyPins) {
      res.setHeader('Public-Key-Pins', 'pin-sha256="base64+primary=="; pin-sha256="base64+backup=="; max-age=5184000; includeSubDomains');
    }

    // Additional security headers
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
  }

  /**
   * Build Content Security Policy header
   */
  private buildCSPHeader(): string {
    const directives = this.config.cspDirectives;
    const parts: string[] = [];

    // Add all directives
    Object.entries(directives).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          parts.push(`${this.camelToKebab(key)} ${value.join(' ')}`);
        }
      } else if (typeof value === 'boolean' && value) {
        parts.push(this.camelToKebab(key));
      }
    });

    return parts.join('; ');
  }

  /**
   * Build Permissions Policy header
   */
  private buildPermissionsPolicyHeader(): string {
    const policies = this.config.permissionsPolicy;
    const parts: string[] = [];

    Object.entries(policies).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        parts.push(`${this.camelToKebab(key)}=${value.join(', ')}`);
      }
    });

    return parts.join(', ');
  }

  /**
   * Set CORS headers
   */
  private setCORSHeaders(req: Request, res: Response): void {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    if (origin && this.config.corsOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (this.config.corsOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', this.config.corsMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', this.config.corsHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', this.config.corsMaxAge.toString());
    
    if (this.config.corsCredentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  /**
   * Remove sensitive headers
   */
  private removeSensitiveHeaders(res: Response): void {
    if (this.config.removeServerHeader) {
      res.removeHeader('Server');
    }
    
    if (this.config.removeXPoweredBy) {
      res.removeHeader('X-Powered-By');
    }
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Get security configuration
   */
  public getConfig(): SecurityHeadersConfig {
    return { ...this.config };
  }

  /**
   * Update security configuration
   */
  public updateConfig(config: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(): {
    headers: Record<string, string>;
    recommendations: string[];
  } {
    const headers: Record<string, string> = {};
    const recommendations: string[] = [];

    // Simulate headers that would be set
    if (this.config.cspEnabled) {
      headers['Content-Security-Policy'] = this.buildCSPHeader();
    }

    if (this.config.hstsEnabled) {
      headers['Strict-Transport-Security'] = `max-age=${this.config.hstsMaxAge}; includeSubDomains; preload`;
    }

    headers['X-Frame-Options'] = this.config.xFrameOptions;
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-XSS-Protection'] = this.config.xXSSProtectionMode;
    headers['Referrer-Policy'] = this.config.referrerPolicy;
    headers['Permissions-Policy'] = this.buildPermissionsPolicyHeader();

    // Security recommendations
    if (!this.config.cspEnabled) {
      recommendations.push('Enable Content Security Policy (CSP)');
    }

    if (!this.config.hstsEnabled) {
      recommendations.push('Enable HTTP Strict Transport Security (HSTS)');
    }

    if (this.config.cspDirectives.scriptSrc.includes("'unsafe-inline'")) {
      recommendations.push('Remove unsafe-inline from script-src in production');
    }

    if (this.config.cspDirectives.scriptSrc.includes("'unsafe-eval'")) {
      recommendations.push('Remove unsafe-eval from script-src in production');
    }

    return { headers, recommendations };
  }
}

// Export default instance
export const securityHeaders = new SecurityHeadersMiddleware();

// Export middleware function
export const securityHeadersMiddleware = securityHeaders.middleware;

// Export for testing
export { SecurityHeadersMiddleware as SecurityHeadersMiddlewareClass }; 