/**
 * UltraMarket Load Testing Suite
 * Comprehensive performance testing with K6
 */

/* eslint-disable no-undef, no-console, no-unused-vars */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const customTrend = new Trend('custom_duration');
const apiCalls = new Counter('api_calls');

// Test configuration
export const options = {
  stages: [
    // Warm-up
    { duration: '2m', target: 10 },
    // Ramp up
    { duration: '5m', target: 50 },
    // Stay at 50 users
    { duration: '10m', target: 50 },
    // Ramp up to 100 users
    { duration: '5m', target: 100 },
    // Stay at 100 users
    { duration: '10m', target: 100 },
    // Ramp up to 200 users
    { duration: '5m', target: 200 },
    // Stay at 200 users
    { duration: '10m', target: 200 },
    // Ramp down
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    // Performance requirements
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Error rate should be less than 1%
    http_req_waiting: ['p(95)<400'], // 95% of requests should wait less than 400ms

    // Custom thresholds
    errors: ['rate<0.01'],
    custom_duration: ['p(95)<600'],
  },

  // Test scenarios
  scenarios: {
    // API Load Test
    api_load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'api' },
    },

    // Authentication Load Test
    auth_load_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { test_type: 'auth' },
    },

    // Database Load Test
    db_load_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'database' },
    },

    // Spike Test
    spike_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 10 },
        { duration: '30s', target: 300 }, // Spike to 300 users
        { duration: '1m', target: 10 },
      ],
      tags: { test_type: 'spike' },
    },
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const API_VERSION = __ENV.API_VERSION || 'v1';
const API_BASE = `${BASE_URL}/api/${API_VERSION}`;

// Test data
const testUsers = [
  { email: process.env.TEST_USER1_EMAIL || 'test1@ultramarket.uz', password: process.env.TEST_USER1_PASSWORD || 'password123' },
  { email: process.env.TEST_USER2_EMAIL || 'test2@ultramarket.uz', password: process.env.TEST_USER2_PASSWORD || 'password123' },
  { email: process.env.TEST_USER3_EMAIL || 'test3@ultramarket.uz', password: process.env.TEST_USER3_PASSWORD || 'password123' },
  { email: process.env.TEST_USER4_EMAIL || 'test4@ultramarket.uz', password: process.env.TEST_USER4_PASSWORD || 'password123' },
  { email: process.env.TEST_USER5_EMAIL || 'test5@ultramarket.uz', password: process.env.TEST_USER5_PASSWORD || 'password123' },
];

const productCategories = ['electronics', 'clothing', 'books', 'home', 'sports', 'automotive'];

const searchTerms = [
  'laptop',
  'phone',
  'shirt',
  'book',
  'chair',
  'car',
  'samsung',
  'apple',
  'nike',
];

// Helper functions
function getRandomUser() {
  return testUsers[randomIntBetween(0, testUsers.length - 1)];
}

function getRandomCategory() {
  return productCategories[randomIntBetween(0, productCategories.length - 1)];
}

function getRandomSearchTerm() {
  return searchTerms[randomIntBetween(0, searchTerms.length - 1)];
}

function authenticateUser() {
  const user = getRandomUser();
  const loginPayload = {
    email: user.email,
    password: user.password,
  };

  const response = http.post(`${API_BASE}/auth/login`, JSON.stringify(loginPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'auth_login' },
  });

  apiCalls.add(1);

  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
    return null;
  }

  try {
    const body = JSON.parse(response.body);
    return body.accessToken;
  } catch (e) {
    errorRate.add(1);
    return null;
  }
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/health`, {
    tags: { name: 'health_check' },
  });

  apiCalls.add(1);

  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  if (!success) {
    errorRate.add(1);
  }

  customTrend.add(response.timings.duration);
}

function testProductsAPI(token) {
  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
      };

  // Test products list
  const productsResponse = http.get(`${API_BASE}/products?page=1&limit=20`, {
    headers,
    tags: { name: 'products_list' },
  });

  apiCalls.add(1);

  const productsSuccess = check(productsResponse, {
    'products list status is 200': (r) => r.status === 200,
    'products list response time < 300ms': (r) => r.timings.duration < 300,
    'products list has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
  });

  if (!productsSuccess) {
    errorRate.add(1);
  }

  // Test products by category
  const category = getRandomCategory();
  const categoryResponse = http.get(`${API_BASE}/products?category=${category}&page=1&limit=10`, {
    headers,
    tags: { name: 'products_by_category' },
  });

  apiCalls.add(1);

  const categorySuccess = check(categoryResponse, {
    'products by category status is 200': (r) => r.status === 200,
    'products by category response time < 400ms': (r) => r.timings.duration < 400,
  });

  if (!categorySuccess) {
    errorRate.add(1);
  }

  // Test product search
  const searchTerm = getRandomSearchTerm();
  const searchResponse = http.get(`${API_BASE}/products/search?q=${searchTerm}&page=1&limit=10`, {
    headers,
    tags: { name: 'product_search' },
  });

  apiCalls.add(1);

  const searchSuccess = check(searchResponse, {
    'product search status is 200': (r) => r.status === 200,
    'product search response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (!searchSuccess) {
    errorRate.add(1);
  }

  // Get product details if products exist
  try {
    const productsBody = JSON.parse(productsResponse.body);
    if (productsBody.data && productsBody.data.length > 0) {
      const productId = productsBody.data[0].id;
      const productResponse = http.get(`${API_BASE}/products/${productId}`, {
        headers,
        tags: { name: 'product_details' },
      });

      apiCalls.add(1);

      const productSuccess = check(productResponse, {
        'product details status is 200': (r) => r.status === 200,
        'product details response time < 200ms': (r) => r.timings.duration < 200,
      });

      if (!productSuccess) {
        errorRate.add(1);
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
}

function testCartAPI(token) {
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Get cart
  const cartResponse = http.get(`${API_BASE}/cart`, {
    headers,
    tags: { name: 'cart_get' },
  });

  apiCalls.add(1);

  const cartSuccess = check(cartResponse, {
    'cart get status is 200': (r) => r.status === 200,
    'cart get response time < 200ms': (r) => r.timings.duration < 200,
  });

  if (!cartSuccess) {
    errorRate.add(1);
  }

  // Add item to cart (simulate)
  const addItemPayload = {
    productId: 'sample-product-id',
    quantity: randomIntBetween(1, 3),
  };

  const addItemResponse = http.post(`${API_BASE}/cart/items`, JSON.stringify(addItemPayload), {
    headers,
    tags: { name: 'cart_add_item' },
  });

  apiCalls.add(1);

  const addItemSuccess = check(addItemResponse, {
    'cart add item status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'cart add item response time < 300ms': (r) => r.timings.duration < 300,
  });

  if (!addItemSuccess) {
    errorRate.add(1);
  }
}

function testOrderAPI(token) {
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Get user orders
  const ordersResponse = http.get(`${API_BASE}/orders?page=1&limit=10`, {
    headers,
    tags: { name: 'orders_list' },
  });

  apiCalls.add(1);

  const ordersSuccess = check(ordersResponse, {
    'orders list status is 200': (r) => r.status === 200,
    'orders list response time < 400ms': (r) => r.timings.duration < 400,
  });

  if (!ordersSuccess) {
    errorRate.add(1);
  }
}

function testAnalyticsAPI(token) {
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test analytics endpoints (if user has permission)
  const analyticsResponse = http.get(`${API_BASE}/analytics/dashboard`, {
    headers,
    tags: { name: 'analytics_dashboard' },
  });

  apiCalls.add(1);

  // Analytics might return 403 for regular users, which is expected
  const analyticsSuccess = check(analyticsResponse, {
    'analytics response is valid': (r) => r.status === 200 || r.status === 403,
    'analytics response time < 600ms': (r) => r.timings.duration < 600,
  });

  if (!analyticsSuccess) {
    errorRate.add(1);
  }
}

function testNotificationAPI(token) {
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test getting notifications
  const notificationsResponse = http.get(`${API_BASE}/notifications?page=1&limit=10`, {
    headers,
    tags: { name: 'notifications_list' },
  });

  apiCalls.add(1);

  const notificationsSuccess = check(notificationsResponse, {
    'notifications list status is 200': (r) => r.status === 200,
    'notifications list response time < 300ms': (r) => r.timings.duration < 300,
  });

  if (!notificationsSuccess) {
    errorRate.add(1);
  }
}

function testFileUploadAPI(token) {
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Create a simple test file
  const testFile = {
    filename: 'test-file.txt',
    content_type: 'text/plain',
    data: 'This is a test file for load testing',
  };

  const uploadResponse = http.post(`${API_BASE}/files/upload`, testFile, {
    headers,
    tags: { name: 'file_upload' },
  });

  apiCalls.add(1);

  const uploadSuccess = check(uploadResponse, {
    'file upload response is valid': (r) =>
      r.status === 200 || r.status === 201 || r.status === 413,
    'file upload response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!uploadSuccess) {
    errorRate.add(1);
  }
}

function performDatabaseIntensiveOperations(token) {
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Perform multiple database-intensive operations
  const operations = [
    // Complex product search with filters
    () =>
      http.get(
        `${API_BASE}/products/search?q=laptop&minPrice=1000&maxPrice=5000&brand=apple&category=electronics&sort=price&page=1&limit=20`,
        {
          headers,
          tags: { name: 'complex_search' },
        }
      ),

    // Get product recommendations
    () =>
      http.get(`${API_BASE}/products/sample-id/recommendations?limit=10`, {
        headers,
        tags: { name: 'product_recommendations' },
      }),

    // Get user activity
    () =>
      http.get(`${API_BASE}/users/activity?page=1&limit=20`, {
        headers,
        tags: { name: 'user_activity' },
      }),

    // Get order history with filters
    () =>
      http.get(
        `${API_BASE}/orders?status=completed&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20`,
        {
          headers,
          tags: { name: 'order_history' },
        }
      ),
  ];

  operations.forEach((operation, index) => {
    const response = operation();
    apiCalls.add(1);

    const success = check(response, {
      [`db operation ${index} status is valid`]: (r) => r.status >= 200 && r.status < 500,
      [`db operation ${index} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    });

    if (!success) {
      errorRate.add(1);
    }
  });
}

// Main test function
export default function () {
  // Always test health check
  testHealthCheck();

  // Authenticate user (50% chance)
  let token = null;
  if (Math.random() < 0.5) {
    token = authenticateUser();
  }

  // Test different API endpoints based on scenario
  const testType = __ENV.TEST_TYPE || 'mixed';

  switch (testType) {
    case 'api':
      testProductsAPI(token);
      testCartAPI(token);
      testOrderAPI(token);
      break;

    case 'auth':
      if (!token) {
        token = authenticateUser();
      }
      testProductsAPI(token);
      testNotificationAPI(token);
      break;

    case 'database':
      if (!token) {
        token = authenticateUser();
      }
      performDatabaseIntensiveOperations(token);
      break;

    case 'spike':
      testProductsAPI(token);
      testCartAPI(token);
      testFileUploadAPI(token);
      break;

    default: // mixed
      testProductsAPI(token);

      if (Math.random() < 0.3) {
        testCartAPI(token);
      }

      if (Math.random() < 0.2) {
        testOrderAPI(token);
      }

      if (Math.random() < 0.1) {
        testAnalyticsAPI(token);
      }

      if (Math.random() < 0.1) {
        testNotificationAPI(token);
      }

      if (Math.random() < 0.05) {
        testFileUploadAPI(token);
      }

      if (Math.random() < 0.1) {
        performDatabaseIntensiveOperations(token);
      }
      break;
  }

  // Random sleep between requests (1-5 seconds)
  sleep(randomIntBetween(1, 5));
}

// Setup function (runs once before all VUs)
export function setup() {
  console.log('🚀 Starting UltraMarket Load Test');
  console.log(`📊 Base URL: ${BASE_URL}`);
  console.log(`🎯 API Base: ${API_BASE}`);
  console.log(`👥 Test Users: ${testUsers.length}`);
  console.log(`🏷️  Categories: ${productCategories.length}`);
  console.log(`🔍 Search Terms: ${searchTerms.length}`);

  // Test basic connectivity
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`Health check failed: ${healthResponse.status}`);
  }

  console.log('✅ Health check passed');
  return { baseUrl: BASE_URL, apiBase: API_BASE };
}

// Teardown function (runs once after all VUs)
export function teardown(data) {
  console.log('🏁 UltraMarket Load Test Completed');
  console.log(`📊 Total API Calls: ${apiCalls.value}`);
  console.log(`❌ Total Errors: ${errorRate.value}`);
  console.log(`📈 Error Rate: ${((errorRate.value / apiCalls.value) * 100).toFixed(2)}%`);

  // Generate summary report
  const summary = {
    totalRequests: apiCalls.value,
    errorRate: errorRate.value / apiCalls.value,
    testDuration: '52m', // Total test duration
    baseUrl: data.baseUrl,
    apiBase: data.apiBase,
    timestamp: new Date().toISOString(),
  };

  console.log('📋 Test Summary:');
  console.log(JSON.stringify(summary, null, 2));
}
