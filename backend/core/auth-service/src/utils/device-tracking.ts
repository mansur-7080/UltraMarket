/**
 * Device tracking utility for enhanced security
 */

import UAParser from 'ua-parser-js';
import { Request } from 'express';
import { logger } from '../utils/logger';

export interface DeviceInfo {
  deviceId: string; // Generated unique identifier for this device
  userAgent: string; // Raw user agent string
  browser: {
    name: string;
    version: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    vendor: string;
    model: string;
    type: string;
  };
  ip: string;
  lastAccessed: Date;
}

/**
 * Generate a fingerprint for the device based on available information
 * This helps track suspicious logins across devices
 */
export function generateDeviceFingerprint(req: Request): string {
  const ua = req.headers['user-agent'] || '';
  const ip = getClientIp(req);
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';

  // Combine values that are unlikely to change between sessions
  const fingerprint = `${ua}|${acceptLanguage}|${acceptEncoding}`;

  // Generate a hash of the fingerprint
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Extract device information from a request
 */
export function extractDeviceInfo(req: Request): DeviceInfo {
  // Parse user agent
  const parser = new (UAParser as any)(req.headers['user-agent']);
  const uaResult = parser.getResult();

  // Get IP address with fallbacks for various proxy setups
  const ip = getClientIp(req);

  // Create device fingerprint
  const deviceId = generateDeviceFingerprint(req);

  return {
    deviceId,
    userAgent: req.headers['user-agent'] || 'unknown',
    browser: {
      name: uaResult.browser.name || 'unknown',
      version: uaResult.browser.version || 'unknown',
    },
    os: {
      name: uaResult.os.name || 'unknown',
      version: uaResult.os.version || 'unknown',
    },
    device: {
      vendor: uaResult.device.vendor || 'unknown',
      model: uaResult.device.model || 'unknown',
      type: uaResult.device.type || 'unknown',
    },
    ip,
    lastAccessed: new Date(),
  };
}

/**
 * Get client IP address with fallbacks for proxies
 */
function getClientIp(req: Request): string {
  // Try various headers that might contain the client IP
  const ipSources = [
    req.headers['x-forwarded-for'],
    req.headers['x-real-ip'],
    req.headers['x-client-ip'],
    req.socket?.remoteAddress,
  ];

  // Find the first defined value
  const rawIp = ipSources.find((src) => typeof src === 'string' && src.length > 0) || '0.0.0.0';

  // Handle x-forwarded-for format which can be comma-separated IPs
  if (typeof rawIp === 'string' && rawIp.includes(',')) {
    return rawIp?.split(',')[0]?.trim() || 'unknown';
  }

  return typeof rawIp === 'string' ? rawIp : '0.0.0.0';
}

/**
 * Detect suspicious login patterns
 */
export function detectSuspiciousLogin(
  currentDevice: DeviceInfo,
  knownDevices: DeviceInfo[]
): { suspicious: boolean; reason?: string } {
  // If this is the first device, it's not suspicious
  if (!knownDevices.length) {
    return { suspicious: false };
  }

  // Check if this device has been used before
  const knownDevice = knownDevices.find((d) => d.deviceId === currentDevice.deviceId);

  if (knownDevice) {
    // Device known, but check if IP has changed dramatically
    if (knownDevice.ip !== currentDevice.ip) {
      // Log IP change but don't mark as suspicious unless it's a drastic change
      logger.info('User logged in from new IP address', {
        userId: 'user-context', // This should be populated from request context
        previousIp: knownDevice.ip,
        newIp: currentDevice.ip,
      });

      // Further IP geolocation analysis could be done here
    }

    return { suspicious: false };
  }

  // New device, check against time patterns of other devices
  // If user logged in from another device very recently, might be suspicious
  const recentLogins = knownDevices.filter((d) => {
    const timeDiff = Date.now() - d.lastAccessed.getTime();
    return timeDiff < 60 * 60 * 1000; // Less than 1 hour
  });

  if (recentLogins.length > 0) {
    // User recently logged in from another device, may be suspicious
    return {
      suspicious: true,
      reason: 'New device login shortly after login from another device',
    };
  }

  // New device but not suspicious timing
  return { suspicious: false };
}
