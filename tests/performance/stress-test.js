import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');

// Stress test configuration
export const options = {
  stages: [
    // Ramp up to breaking point
    { duration: '5m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 300 },
    { duration: '5m', target: 400 },
    { duration: '5m', target: 500 },
    { duration: '10m', target: 500 }, // Sustained stress
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    // More lenient thresholds for stress testing
    error_rate: ['rate<0.1'], // 10% error rate acceptable
    http_req_duration: ['p(95)<5000'], // 5 seconds max
    http_req_failed: ['rate<0.15'], // 15% failure rate acceptable
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Stress test scenarios
  const scenario = randomIntBetween(1, 100);

  if (scenario <= 40) {
    // Heavy product browsing
    stressProductBrowsing();
  } else if (scenario <= 70) {
    // Concurrent user registration
    stressUserRegistration();
  } else if (scenario <= 90) {
    // Cart operations under stress
    stressCartOperations();
  } else {
    // Database intensive operations
    stressDatabaseOperations();
  }

  sleep(randomIntBetween(0.5, 2));
}

function stressProductBrowsing() {
  const group = 'Stress Product Browsing';

  // Rapid product requests
  for (let i = 0; i < 10; i++) {
    const response = http.get(`${baseUrl}/api/v1/products?page=${i}&limit=50`);

    check(response, {
      [`${group} - Status OK`]: (r) => r.status === 200 || r.status === 429,
    });

    recordMetrics(response, group);

    if (response.status === 429) {
      // Rate limited, back off
      sleep(1);
      break;
    }
  }
}

function stressUserRegistration() {
  const group = 'Stress User Registration';

  const userData = {
    email: `stress-test-${Date.now()}-${randomIntBetween(1, 10000)}@example.com`,
    password: 'StressTest123!',
    firstName: 'Stress',
    lastName: 'Test',
  };

  const response = http.post(`${baseUrl}/api/v1/auth/register`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    [`${group} - Registration handled`]: (r) =>
      r.status === 201 || r.status === 409 || r.status === 429,
  });

  recordMetrics(response, group);
}

function stressCartOperations() {
  const group = 'Stress Cart Operations';

  // Simulate rapid cart updates
  for (let i = 0; i < 5; i++) {
    const cartData = {
      productId: `product-${randomIntBetween(1, 100)}`,
      quantity: randomIntBetween(1, 10),
    };

    const response = http.post(`${baseUrl}/api/v1/cart/add`, JSON.stringify(cartData), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
      [`${group} - Cart operation handled`]: (r) => r.status < 500,
    });

    recordMetrics(response, group);
  }
}

function stressDatabaseOperations() {
  const group = 'Stress Database Operations';

  // Complex search queries
  const searchQueries = [
    'electronics laptop gaming',
    'smartphone android ios',
    'headphones wireless bluetooth',
    'camera dslr mirrorless',
    'tablet ipad android windows',
  ];

  const query = searchQueries[randomIntBetween(0, searchQueries.length - 1)];

  const response = http.get(
    `${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&page=1&limit=100`
  );

  check(response, {
    [`${group} - Search handled`]: (r) => r.status < 500,
  });

  recordMetrics(response, group);
}

function recordMetrics(response, group) {
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  errorRate.add(response.status >= 400);

  if (response.status >= 400) {
    console.log(`${group} - Error: ${response.status} - ${response.body.substring(0, 100)}`);
  }
}

export function teardown() {
  console.log('🏁 Stress test completed');
}
