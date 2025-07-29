#!/usr/bin/env node

/**
 * UltraMarket Notification Service Health Check
 * Professional health monitoring with comprehensive checks
 */

const http = require('http');
const { performance } = require('perf_hooks');

const HEALTH_CHECK_CONFIG = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 3000,
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
  path: '/health',
  retries: 3,
  retryDelay: 1000,
};

class HealthChecker {
  constructor(config) {
    this.config = config;
    this.startTime = performance.now();
  }

  async checkHealth() {
    const startTime = performance.now();

    try {
      const result = await this.performHealthCheck();
      const duration = Math.round(performance.now() - startTime);

      this.logSuccess(result, duration);
      process.exit(0);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.logError(error, duration);
      process.exit(1);
    }
  }

  performHealthCheck() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.config.host,
        port: this.config.port,
        path: this.config.path,
        method: 'GET',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'UltraMarket-HealthCheck/1.0',
          Accept: 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const healthData = JSON.parse(data);
              resolve({
                status: res.statusCode,
                message: res.statusMessage,
                data: healthData,
                headers: res.headers,
              });
            } catch (parseError) {
              resolve({
                status: res.statusCode,
                message: res.statusMessage,
                data: data,
                headers: res.headers,
              });
            }
          } else {
            reject(
              new Error(`Health check failed with status ${res.statusCode}: ${res.statusMessage}`)
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Health check request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Health check timed out after ${this.config.timeout}ms`));
      });

      req.setTimeout(this.config.timeout);
      req.end();
    });
  }

  logSuccess(result, duration) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      service: 'notification-service',
      status: 'healthy',
      statusCode: result.status,
      duration: `${duration}ms`,
      message: 'Health check passed',
      data: result.data,
    };

    console.log(JSON.stringify(logData, null, 2));
  }

  logError(error, duration) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      service: 'notification-service',
      status: 'unhealthy',
      duration: `${duration}ms`,
      error: error.message,
      message: 'Health check failed',
    };

    console.error(JSON.stringify(logData, null, 2));
  }
}

// Retry mechanism for health checks
async function healthCheckWithRetry() {
  const checker = new HealthChecker(HEALTH_CHECK_CONFIG);

  for (let attempt = 1; attempt <= HEALTH_CHECK_CONFIG.retries; attempt++) {
    try {
      await checker.checkHealth();
      return; // Success, exit
    } catch (error) {
      if (attempt === HEALTH_CHECK_CONFIG.retries) {
        console.error(`Health check failed after ${attempt} attempts`);
        process.exit(1);
      }

      console.warn(
        `Health check attempt ${attempt} failed, retrying in ${HEALTH_CHECK_CONFIG.retryDelay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_CONFIG.retryDelay));
    }
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('Health check interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Health check terminated');
  process.exit(1);
});

// Execute health check
if (require.main === module) {
  healthCheckWithRetry().catch((error) => {
    console.error('Unexpected error during health check:', error);
    process.exit(1);
  });
}

module.exports = { HealthChecker, HEALTH_CHECK_CONFIG };
