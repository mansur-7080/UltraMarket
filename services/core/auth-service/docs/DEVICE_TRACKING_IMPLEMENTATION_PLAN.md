# Device Tracking Implementation Plan

## Overview

This document outlines the plan for implementing enhanced security through device tracking in the UltraMarket authentication service. The implementation will provide better security by detecting suspicious login attempts and allowing users to manage their active sessions.

## Migration Steps

### 1. Schema Updates

Update the Prisma schema with the following changes:

1. Add new fields to the `RefreshToken` model:
   - `isRevoked` - Boolean flag to indicate if the token has been manually revoked
   - `deviceId` - String identifier for the device that created the token
   - `userAgent` - User agent string from the browser/client
   - `ip` - IP address where the token was issued

2. Create a new `UserDevice` model to track user devices:
   - `id` - Unique identifier
   - `userId` - Reference to the user
   - `deviceId` - Unique fingerprint for the device
   - `userAgent` - Full user agent string
   - `browser` - Browser name
   - `browserVersion` - Browser version
   - `os` - Operating system name
   - `osVersion` - Operating system version
   - `device` - Device model/name
   - `ip` - Last known IP address
   - `lastAccessed` - Timestamp of the last access
   - `isTrusted` - Whether the device is trusted by the user
   - `createdAt` - When the device was first seen

3. Add a relation between `User` and `UserDevice` models

### 2. Database Migration

Apply the migration to the database:

```bash
npx prisma migrate dev --name add_device_tracking
```

In case of emergency rollback:

```bash
npx prisma migrate down
```

### 3. Service Implementation

1. Create utility functions for device tracking:
   - Device fingerprinting
   - Device information extraction
   - Suspicious activity detection

2. Update the TokenService to:
   - Include device tracking in token generation
   - Store device information with refresh tokens
   - Allow token revocation by device ID
   - Validate tokens with device context

3. Update the AuthController to:
   - Include device information in authentication responses
   - Add endpoints for managing trusted devices
   - Implement suspicious login detection and notification

### 4. Security Enhancements

1. Add rate limiting for failed login attempts per device
2. Implement automated suspicious activity detection
3. Add notification system for new device logins
4. Create admin dashboard for monitoring login patterns

### 5. API Endpoints

Add the following API endpoints:

- `GET /api/auth/devices` - List all active devices for the current user
- `DELETE /api/auth/devices/:deviceId` - Revoke access for a specific device
- `PUT /api/auth/devices/:deviceId/trust` - Mark a device as trusted
- `POST /api/auth/logout/all` - Revoke all active sessions

### 6. Testing

1. Unit tests for device fingerprinting and detection
2. Integration tests for token lifecycle with device tracking
3. Security testing for potential bypasses
4. Load testing to ensure performance is not impacted

### 7. Deployment

1. Deploy schema changes using the migration script
2. Deploy code updates with zero downtime using rolling updates
3. Monitor for errors or unexpected behaviors
4. Have rollback plan ready in case of issues

## Rollout Timeline

1. Development: 2 days
2. Testing: 1 day
3. Staging deployment: 1 day
4. Production deployment: 1 day (off-peak hours)
5. Monitoring: 3 days

## Success Metrics

1. Reduced unauthorized access attempts
2. Improved user confidence in security
3. Better visibility into session management
4. Enhanced audit capabilities for security incidents

## Future Enhancements

1. Geolocation tracking for logins
2. Behavioral analysis for detecting anomalies
3. Integration with fraud detection systems
4. Multi-factor authentication based on device risk score
