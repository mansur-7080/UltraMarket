# UltraMarket Auth Service - Professional Implementation

## Overview

The UltraMarket Auth Service is a robust, secure authentication and authorization service for the UltraMarket e-commerce platform. This service handles user registration, login, session management, and permission control across the entire platform.

## Professional Improvements

The following professional enhancements have been implemented:

### 1. Enhanced Security

- **Device Tracking**: Monitor and manage user sessions across different devices
- **Suspicious Login Detection**: Identify potentially unauthorized access attempts
- **Standardized Error Handling**: Consistent, secure error responses that don't leak sensitive information

### 2. Robust Token Management

- **Token Lifecycle Management**: Complete lifecycle for access and refresh tokens
- **Secure Token Storage**: Hashed token storage in database
- **Device-Aware Tokens**: Tokens linked to specific devices for better security

### 3. Comprehensive Input Validation

- **Request Validation**: Professional validation utility for all incoming requests
- **Schema Validation**: Detailed schema validation with appropriate error messages
- **Data Sanitization**: Protection against injection attacks

### 4. Professional Logging

- **Structured Logging**: Consistent log format for better monitoring
- **Sensitive Data Masking**: Automatic redaction of sensitive information in logs
- **Performance Monitoring**: Tracking of slow operations

## API Documentation

### Authentication

#### Register

```
POST /api/auth/register
```

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Login

```
POST /api/auth/login
```

Authenticate a user and receive access and refresh tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clk2x9pmh0000jz08g7etbq1j",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    }
  }
}
```

#### Refresh Token

```
POST /api/auth/refresh
```

Get a new access token using a refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout

```
POST /api/auth/logout
```

Invalidate the current refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Device Management

#### List Devices

```
GET /api/auth/devices
```

List all active devices for the current user.

#### Revoke Device

```
DELETE /api/auth/devices/:deviceId
```

Revoke access for a specific device.

#### Trust Device

```
PUT /api/auth/devices/:deviceId/trust
```

Mark a device as trusted to reduce security checks.

#### Logout All Devices

```
POST /api/auth/logout/all
```

Revoke all active sessions across all devices.

## Development

### Prerequisites

- Node.js 16+
- PostgreSQL 13+
- Redis (for rate limiting)

### Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Set up environment variables:

   ```
   cp .env.example .env
   ```

3. Run database migrations:

   ```
   npx prisma migrate dev
   ```

4. Start the service:
   ```
   npm run dev
   ```

### Testing

Run the test suite:

```
npm test
```

## Production Deployment

For production deployment, use the Docker container:

```
docker build -t ultramarket-auth-service .
docker run -p 3001:3001 --env-file .env.production ultramarket-auth-service
```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are signed with strong secrets
- Rate limiting is applied to prevent brute force attacks
- Suspicious login attempts are logged and can trigger notifications
- All input is validated and sanitized to prevent injection attacks
