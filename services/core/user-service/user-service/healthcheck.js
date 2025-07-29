#!/usr/bin/env node

const http = require('http');
const url = require('url');

// Configuration
const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3001/health';
const TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10);
const MAX_RETRIES = parseInt(process.env.HEALTH_CHECK_RETRIES || '3', 10);

// Parse URL for healthcheck
const healthUrl = url.parse(HEALTH_CHECK_URL);

// Health check options
const options = {
  hostname: healthUrl.hostname,
  port: healthUrl.port || 3001,
  path: healthUrl.path || '/health',
  method: 'GET',
  timeout: TIMEOUT,
  headers: {
    'User-Agent': 'Docker-Healthcheck/1.0',
    Accept: 'application/json',
  },
};

/**
 * Perform health check with retry logic
 */
async function performHealthCheck(retryCount = 0) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.status === 'healthy' || response.status === 'ok') {
              resolve({
                status: 'healthy',
                statusCode: res.statusCode,
                response: response,
                timestamp: new Date().toISOString(),
              });
            } else {
              reject(new Error(`Service unhealthy: ${response.status || 'unknown'}`));
            }
          } catch (parseError) {
            // If response is not JSON, check if it's a simple "OK" response
            if (data.trim().toLowerCase() === 'ok' || data.trim().toLowerCase() === 'healthy') {
              resolve({
                status: 'healthy',
                statusCode: res.statusCode,
                response: data.trim(),
                timestamp: new Date().toISOString(),
              });
            } else {
              reject(new Error(`Invalid health check response: ${data}`));
            }
          }
        } else {
          reject(new Error(`Health check failed with status code: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Health check request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Health check timeout after ${TIMEOUT}ms`));
    });

    req.setTimeout(TIMEOUT);
    req.end();
  });
}

/**
 * Main health check function with retry logic
 */
async function healthCheck() {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await performHealthCheck();

      // Success - log and exit with success code
      process.stdout.write(
        JSON.stringify({
          status: 'success',
          service: 'user-service',
          attempt: attempt,
          timestamp: result.timestamp,
          response: result.response,
          message: 'Health check passed',
        }) + '\n'
      );

      process.exit(0);
    } catch (error) {
      lastError = error;

      // Log the attempt failure
      process.stderr.write(
        JSON.stringify({
          status: 'error',
          service: 'user-service',
          attempt: attempt,
          maxRetries: MAX_RETRIES,
          error: error.message,
          timestamp: new Date().toISOString(),
        }) + '\n'
      );

      // Wait before retry (except for the last attempt)
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  process.stderr.write(
    JSON.stringify({
      status: 'failed',
      service: 'user-service',
      error: lastError.message,
      attempts: MAX_RETRIES,
      timestamp: new Date().toISOString(),
      message: 'Health check failed after all retries',
    }) + '\n'
  );

  process.exit(1);
}

// Handle process signals
process.on('SIGTERM', () => {
  process.stderr.write(
    JSON.stringify({
      status: 'terminated',
      service: 'user-service',
      message: 'Health check terminated by SIGTERM',
      timestamp: new Date().toISOString(),
    }) + '\n'
  );
  process.exit(1);
});

process.on('SIGINT', () => {
  process.stderr.write(
    JSON.stringify({
      status: 'interrupted',
      service: 'user-service',
      message: 'Health check interrupted by SIGINT',
      timestamp: new Date().toISOString(),
    }) + '\n'
  );
  process.exit(1);
});

// Start health check
healthCheck().catch((error) => {
  process.stderr.write(
    JSON.stringify({
      status: 'error',
      service: 'user-service',
      error: error.message,
      timestamp: new Date().toISOString(),
      message: 'Unexpected error during health check',
    }) + '\n'
  );
  process.exit(1);
});
