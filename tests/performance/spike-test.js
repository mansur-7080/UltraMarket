import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');

// Spike test configuration - sudden traffic spikes
export const options = {
  stages: [
    // Normal load
    { duration: '2m', target: 10 },
    // Sudden spike
    { duration: '30s', target: 1000 },
    // Back to normal
    { duration: '2m', target: 10 },
    // Another spike
    { duration: '30s', target: 1500 },
    // Recovery
    { duration: '3m', target: 10 },
    // Final spike
    { duration: '1m', target: 2000 },
    // Cooldown
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // During spikes, some degradation is expected
    error_rate: ['rate<0.2'], // 20% error rate acceptable during spikes
    http_req_duration: ['p(95)<10000'], // 10 seconds max during spikes
    http_req_failed: ['rate<0.25'], // 25% failure rate acceptable during spikes
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Spike test scenarios - focus on most critical paths
  const scenario = randomIntBetween(1, 100);

  if (scenario <= 50) {
    // Homepage and product listing - most common requests
    spikeHomepageLoad();
  } else if (scenario <= 75) {
    // Search functionality - search spikes are common
    spikeSearchLoad();
  } else if (scenario <= 90) {
    // Product details - product viral spikes
    spikeProductDetails();
  } else {
    // API health checks - monitoring spikes
    spikeHealthChecks();
  }

  sleep(randomIntBetween(0.1, 1)); // Shorter sleep for spike testing
}

function spikeHomepageLoad() {
  const group = 'Spike Homepage Load';

  // Simulate homepage requests
  const response = http.get(`${baseUrl}/api/v1/products/featured?limit=20`);

  check(response, {
    [`${group} - Homepage loaded`]: (r) => r.status === 200 || r.status === 503,
  });

  recordMetrics(response, group);

  // Quick category check
  if (response.status === 200) {
    const categoriesResponse = http.get(`${baseUrl}/api/v1/categories`);
    check(categoriesResponse, {
      [`${group} - Categories loaded`]: (r) => r.status === 200 || r.status === 503,
    });
    recordMetrics(categoriesResponse, group);
  }
}

function spikeSearchLoad() {
  const group = 'Spike Search Load';

  // Popular search terms that might cause spikes
  const popularSearches = [
    'iphone',
    'laptop',
    'sale',
    'discount',
    'free shipping',
    'bestseller',
    'new arrival',
    'gaming',
  ];

  const searchTerm = popularSearches[randomIntBetween(0, popularSearches.length - 1)];

  const response = http.get(
    `${baseUrl}/api/v1/search?q=${encodeURIComponent(searchTerm)}&page=1&limit=20`
  );

  check(response, {
    [`${group} - Search completed`]: (r) =>
      r.status === 200 || r.status === 503 || r.status === 429,
  });

  recordMetrics(response, group);
}

function spikeProductDetails() {
  const group = 'Spike Product Details';

  // Simulate viral product requests (same product getting many requests)
  const viralProductIds = ['prod-viral-1', 'prod-viral-2', 'prod-viral-3'];
  const productId = viralProductIds[randomIntBetween(0, viralProductIds.length - 1)];

  const response = http.get(`${baseUrl}/api/v1/products/${productId}`);

  check(response, {
    [`${group} - Product details loaded`]: (r) =>
      r.status === 200 || r.status === 404 || r.status === 503,
  });

  recordMetrics(response, group);

  // Check related products if main product loads
  if (response.status === 200) {
    const relatedResponse = http.get(`${baseUrl}/api/v1/products/${productId}/related?limit=5`);
    check(relatedResponse, {
      [`${group} - Related products loaded`]: (r) => r.status === 200 || r.status === 503,
    });
    recordMetrics(relatedResponse, group);
  }
}

function spikeHealthChecks() {
  const group = 'Spike Health Checks';

  // Health check endpoints that might get hammered during incidents
  const healthEndpoints = [
    '/health',
    '/api/v1/health',
    '/api/v1/products/health',
    '/api/v1/users/health',
    '/api/v1/orders/health',
  ];

  const endpoint = healthEndpoints[randomIntBetween(0, healthEndpoints.length - 1)];

  const response = http.get(`${baseUrl}${endpoint}`);

  check(response, {
    [`${group} - Health check responded`]: (r) => r.status === 200 || r.status === 503,
  });

  recordMetrics(response, group);
}

function recordMetrics(response, group) {
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  errorRate.add(response.status >= 400);

  // Log significant issues during spikes
  if (response.status >= 500) {
    console.log(
      `${group} - Server Error: ${response.status} - Duration: ${response.timings.duration}ms`
    );
  }

  if (response.timings.duration > 5000) {
    console.log(
      `${group} - Slow Response: ${response.timings.duration}ms - Status: ${response.status}`
    );
  }
}

export function setup() {
  console.log('🚀 Starting Spike Test');
  console.log('⚠️  This test simulates sudden traffic spikes');
  console.log(`Base URL: ${baseUrl}`);

  // Verify system is ready
  const healthResponse = http.get(`${baseUrl}/health`);
  if (healthResponse.status !== 200) {
    console.warn('⚠️  System health check failed, proceeding anyway');
  }

  return { baseUrl };
}

export function teardown() {
  console.log('🏁 Spike test completed');
  console.log('📊 Check metrics for spike handling performance');
}
