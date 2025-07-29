import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');
const memoryLeakIndicator = new Trend('memory_leak_indicator');

// Endurance test configuration - long running test
export const options = {
  stages: [
    // Gradual ramp up
    { duration: '10m', target: 50 },
    // Sustained load for extended period
    { duration: '2h', target: 50 },
    // Gradual ramp down
    { duration: '10m', target: 0 },
  ],
  thresholds: {
    // Stricter thresholds for endurance testing
    error_rate: ['rate<0.02'], // 2% error rate max
    http_req_duration: ['p(95)<1500'], // 1.5 seconds max
    http_req_failed: ['rate<0.05'], // 5% failure rate max
    // Memory leak detection
    memory_leak_indicator: ['avg<2000'], // Response time shouldn't increase significantly
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

// Track response times over time to detect memory leaks
let responseTimeHistory = [];
let requestCounter = 0;

export default function () {
  requestCounter++;

  // Endurance test scenarios - realistic long-term usage
  const scenario = randomIntBetween(1, 100);

  if (scenario <= 30) {
    // Regular browsing pattern
    enduranceBrowsingPattern();
  } else if (scenario <= 50) {
    // User session pattern
    enduranceUserSession();
  } else if (scenario <= 70) {
    // Shopping pattern
    enduranceShoppingPattern();
  } else if (scenario <= 85) {
    // Search pattern
    enduranceSearchPattern();
  } else {
    // Background operations
    enduranceBackgroundOperations();
  }

  // Detect potential memory leaks
  if (requestCounter % 100 === 0) {
    detectMemoryLeaks();
  }

  sleep(randomIntBetween(2, 8)); // Realistic user think time
}

function enduranceBrowsingPattern() {
  const group = 'Endurance Browsing';

  // Simulate realistic browsing session
  // 1. Load homepage
  let response = http.get(`${baseUrl}/api/v1/products/featured?limit=10`);
  check(response, {
    [`${group} - Homepage loaded`]: (r) => r.status === 200,
  });
  recordMetrics(response, group);

  sleep(randomIntBetween(2, 5));

  // 2. Browse categories
  response = http.get(`${baseUrl}/api/v1/categories`);
  check(response, {
    [`${group} - Categories loaded`]: (r) => r.status === 200,
  });
  recordMetrics(response, group);

  sleep(randomIntBetween(1, 3));

  // 3. View products in category
  response = http.get(`${baseUrl}/api/v1/products?category=electronics&page=1&limit=20`);
  check(response, {
    [`${group} - Products loaded`]: (r) => r.status === 200,
  });
  recordMetrics(response, group);

  sleep(randomIntBetween(3, 7));

  // 4. View product details
  response = http.get(`${baseUrl}/api/v1/products/sample-product-id`);
  check(response, {
    [`${group} - Product details loaded`]: (r) => r.status === 200 || r.status === 404,
  });
  recordMetrics(response, group);
}

function enduranceUserSession() {
  const group = 'Endurance User Session';

  // Simulate complete user session
  // 1. Login attempt
  const loginData = {
    email: 'endurance-test@example.com',
    password: 'EnduranceTest123!',
  };

  let response = http.post(`${baseUrl}/api/v1/auth/login`, JSON.stringify(loginData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    [`${group} - Login attempted`]: (r) => r.status === 200 || r.status === 401,
  });
  recordMetrics(response, group);

  sleep(randomIntBetween(1, 3));

  // 2. Profile check (if login successful)
  if (response.status === 200) {
    const authToken = 'mock-token'; // In real test, extract from response

    response = http.get(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    check(response, {
      [`${group} - Profile loaded`]: (r) => r.status === 200 || r.status === 401,
    });
    recordMetrics(response, group);
  }
}

function enduranceShoppingPattern() {
  const group = 'Endurance Shopping';

  // Simulate shopping behavior
  // 1. Add to cart
  const cartData = {
    productId: `product-${randomIntBetween(1, 100)}`,
    quantity: randomIntBetween(1, 3),
  };

  let response = http.post(`${baseUrl}/api/v1/cart/add`, JSON.stringify(cartData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    [`${group} - Add to cart`]: (r) => r.status === 200 || r.status === 201,
  });
  recordMetrics(response, group);

  sleep(randomIntBetween(2, 5));

  // 2. View cart
  response = http.get(`${baseUrl}/api/v1/cart`);
  check(response, {
    [`${group} - Cart viewed`]: (r) => r.status === 200,
  });
  recordMetrics(response, group);

  sleep(randomIntBetween(1, 3));

  // 3. Update cart quantity
  const updateData = {
    productId: cartData.productId,
    quantity: randomIntBetween(1, 5),
  };

  response = http.put(`${baseUrl}/api/v1/cart/update`, JSON.stringify(updateData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    [`${group} - Cart updated`]: (r) => r.status === 200,
  });
  recordMetrics(response, group);
}

function enduranceSearchPattern() {
  const group = 'Endurance Search';

  // Simulate search behavior
  const searchTerms = [
    'laptop computer',
    'wireless headphones',
    'smartphone case',
    'gaming keyboard',
    'office chair',
    'led monitor',
    'bluetooth speaker',
    'fitness tracker',
  ];

  const searchTerm = searchTerms[randomIntBetween(0, searchTerms.length - 1)];

  const response = http.get(
    `${baseUrl}/api/v1/search?q=${encodeURIComponent(searchTerm)}&page=1&limit=20`
  );

  check(response, {
    [`${group} - Search completed`]: (r) => r.status === 200,
  });
  recordMetrics(response, group);
}

function enduranceBackgroundOperations() {
  const group = 'Endurance Background';

  // Simulate background operations that run continuously
  // 1. Health checks
  let response = http.get(`${baseUrl}/health`);
  check(response, {
    [`${group} - Health check`]: (r) => r.status === 200,
  });
  recordMetrics(response, group);

  sleep(1);

  // 2. Metrics endpoint
  response = http.get(`${baseUrl}/api/v1/metrics`);
  check(response, {
    [`${group} - Metrics check`]: (r) => r.status === 200 || r.status === 404,
  });
  recordMetrics(response, group);
}

function detectMemoryLeaks() {
  if (responseTimeHistory.length > 0) {
    const recentAvg = responseTimeHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const overallAvg = responseTimeHistory.reduce((a, b) => a + b, 0) / responseTimeHistory.length;

    // If recent average is significantly higher than overall average, possible memory leak
    const leakIndicator = recentAvg - overallAvg;
    memoryLeakIndicator.add(leakIndicator);

    if (leakIndicator > 500) {
      console.warn(
        `⚠️  Potential memory leak detected: ${leakIndicator}ms increase in response time`
      );
    }
  }
}

function recordMetrics(response, group) {
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  errorRate.add(response.status >= 400);

  // Track response times for memory leak detection
  responseTimeHistory.push(response.timings.duration);
  if (responseTimeHistory.length > 1000) {
    responseTimeHistory = responseTimeHistory.slice(-500); // Keep last 500 entries
  }

  // Log significant issues
  if (response.status >= 500) {
    console.log(`${group} - Server Error: ${response.status} at request ${requestCounter}`);
  }

  if (response.timings.duration > 3000) {
    console.log(
      `${group} - Slow Response: ${response.timings.duration}ms at request ${requestCounter}`
    );
  }
}

export function setup() {
  console.log('🚀 Starting Endurance Test');
  console.log('⏱️  This test runs for 2+ hours to detect memory leaks and degradation');
  console.log(`Base URL: ${baseUrl}`);

  // Verify system is ready
  const healthResponse = http.get(`${baseUrl}/health`);
  if (healthResponse.status !== 200) {
    throw new Error('System health check failed - cannot start endurance test');
  }

  console.log('✅ System health check passed');
  return { baseUrl };
}

export function teardown() {
  console.log('🏁 Endurance test completed');
  console.log(`📊 Total requests: ${requestCounter}`);
  console.log('📈 Check metrics for performance degradation over time');

  if (responseTimeHistory.length > 0) {
    const finalAvg = responseTimeHistory.slice(-50).reduce((a, b) => a + b, 0) / 50;
    const initialAvg = responseTimeHistory.slice(0, 50).reduce((a, b) => a + b, 0) / 50;
    const degradation = finalAvg - initialAvg;

    console.log(`📊 Performance degradation: ${degradation}ms`);

    if (degradation > 200) {
      console.warn('⚠️  Significant performance degradation detected');
    } else {
      console.log('✅ No significant performance degradation');
    }
  }
}
