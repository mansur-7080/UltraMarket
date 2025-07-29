import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { testLogger, LogLevel, LogCategory } from '../../libs/shared/src/utils/professional-logger.ts';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    // Warm-up
    { duration: '2m', target: 10 },
    // Ramp up to 50 users
    { duration: '5m', target: 50 },
    // Stay at 50 users
    { duration: '10m', target: 50 },
    // Ramp up to 100 users
    { duration: '5m', target: 100 },
    // Stay at 100 users
    { duration: '10m', target: 100 },
    // Peak load - 200 users
    { duration: '3m', target: 200 },
    // Stay at peak
    { duration: '5m', target: 200 },
    // Ramp down
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    // 95% of requests should be below 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate should be below 1%
    errors: ['rate<0.01'],
    // 99% of requests should be below 1000ms
    'http_req_duration{name:api_response}': ['p(99)<1000'],
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

// Test data
const testUsers = [
  { email: 'test1@ultramarket.uz', password: 'Test123!@#' },
  { email: 'test2@ultramarket.uz', password: 'Test123!@#' },
  { email: 'test3@ultramarket.uz', password: 'Test123!@#' },
];

const searchQueries = [
  'laptop',
  'smartphone',
  'televizor',
  'kompyuter',
  'telefon',
  'notebook',
  'planshet',
  'muzlatgich',
];

const productCategories = ['electronics', 'computers', 'smartphones', 'home-appliances', 'gaming'];

// Helper functions
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomSearchQuery() {
  return searchQueries[Math.floor(Math.random() * searchQueries.length)];
}

function getRandomCategory() {
  return productCategories[Math.floor(Math.random() * productCategories.length)];
}

function authenticateUser() {
  const user = getRandomUser();

  const loginResponse = http.post(
    `${API_URL}/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'auth_login' },
    }
  );

  const isLoginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data && body.data.token;
      } catch {
        return false;
      }
    },
  });

  if (isLoginSuccess) {
    const body = JSON.parse(loginResponse.body);
    return body.data.token;
  }

  return null;
}

// Main test scenarios
export default function () {
  group('Authentication Flow', () => {
    // Test user registration
    group('User Registration', () => {
      const randomEmail = `test_${Math.random().toString(36).substr(2, 9)}@ultramarket.uz`;

      const registerResponse = http.post(
        `${API_URL}/auth/register`,
        JSON.stringify({
          email: randomEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
          phone: '+998901234567',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'auth_register' },
        }
      );

      check(registerResponse, {
        'registration status is 201': (r) => r.status === 201,
        'registration response is valid': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true;
          } catch {
            return false;
          }
        },
      });

      requestCount.add(1);
      responseTime.add(registerResponse.timings.duration);
      if (registerResponse.status >= 400) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }
    });

    // Test user login
    group('User Login', () => {
      const token = authenticateUser();

      check(token, {
        'authentication successful': (t) => t !== null,
      });
    });
  });

  group('Product Catalog', () => {
    // Test product listing
    group('Product Listing', () => {
      const category = getRandomCategory();
      const page = Math.floor(Math.random() * 5) + 1;

      const productsResponse = http.get(
        `${API_URL}/products?category=${category}&page=${page}&limit=20`,
        {
          tags: { name: 'products_list' },
        }
      );

      check(productsResponse, {
        'products list status is 200': (r) => r.status === 200,
        'products list has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success && Array.isArray(body.data);
          } catch {
            return false;
          }
        },
        'products list response time < 300ms': (r) => r.timings.duration < 300,
      });

      requestCount.add(1);
      responseTime.add(productsResponse.timings.duration);
      if (productsResponse.status >= 400) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }
    });

    // Test product search
    group('Product Search', () => {
      const query = getRandomSearchQuery();

      const searchResponse = http.get(
        `${API_URL}/search/products?q=${encodeURIComponent(query)}&limit=20`,
        {
          tags: { name: 'search_products' },
        }
      );

      check(searchResponse, {
        'search status is 200': (r) => r.status === 200,
        'search has results': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success && body.data && body.data.products;
          } catch {
            return false;
          }
        },
        'search response time < 500ms': (r) => r.timings.duration < 500,
      });

      requestCount.add(1);
      responseTime.add(searchResponse.timings.duration);
      if (searchResponse.status >= 400) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }
    });

    // Test product details
    group('Product Details', () => {
      // First get a product ID from the list
      const productsResponse = http.get(`${API_URL}/products?limit=1`);

      if (productsResponse.status === 200) {
        try {
          const body = JSON.parse(productsResponse.body);
          if (body.success && body.data.length > 0) {
            const productId = body.data[0].id;

            const productResponse = http.get(`${API_URL}/products/${productId}`, {
              tags: { name: 'product_details' },
            });

            check(productResponse, {
              'product details status is 200': (r) => r.status === 200,
              'product details has data': (r) => {
                try {
                  const productBody = JSON.parse(r.body);
                  return productBody.success && productBody.data;
                } catch {
                  return false;
                }
              },
            });

            requestCount.add(1);
            responseTime.add(productResponse.timings.duration);
            if (productResponse.status >= 400) {
              errorRate.add(1);
            } else {
              errorRate.add(0);
            }
          }
        } catch (e) {
          // Handle parsing error
        }
      }
    });
  });

  group('Shopping Cart', () => {
    const token = authenticateUser();

    if (token) {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Test add to cart
      group('Add to Cart', () => {
        // Get a random product
        const productsResponse = http.get(`${API_URL}/products?limit=10`);

        if (productsResponse.status === 200) {
          try {
            const body = JSON.parse(productsResponse.body);
            if (body.success && body.data.length > 0) {
              const randomProduct = body.data[Math.floor(Math.random() * body.data.length)];

              const addToCartResponse = http.post(
                `${API_URL}/cart/add`,
                JSON.stringify({
                  productId: randomProduct.id,
                  quantity: Math.floor(Math.random() * 3) + 1,
                }),
                {
                  headers,
                  tags: { name: 'cart_add' },
                }
              );

              check(addToCartResponse, {
                'add to cart status is 200': (r) => r.status === 200,
                'add to cart successful': (r) => {
                  try {
                    const cartBody = JSON.parse(r.body);
                    return cartBody.success;
                  } catch {
                    return false;
                  }
                },
              });

              requestCount.add(1);
              responseTime.add(addToCartResponse.timings.duration);
              if (addToCartResponse.status >= 400) {
                errorRate.add(1);
              } else {
                errorRate.add(0);
              }
            }
          } catch (e) {
            // Handle parsing error
          }
        }
      });

      // Test get cart
      group('Get Cart', () => {
        const cartResponse = http.get(`${API_URL}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
          tags: { name: 'cart_get' },
        });

        check(cartResponse, {
          'get cart status is 200': (r) => r.status === 200,
          'get cart has data': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.success;
            } catch {
              return false;
            }
          },
        });

        requestCount.add(1);
        responseTime.add(cartResponse.timings.duration);
        if (cartResponse.status >= 400) {
          errorRate.add(1);
        } else {
          errorRate.add(0);
        }
      });
    }
  });

  group('Order Management', () => {
    const token = authenticateUser();

    if (token) {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Test get orders
      group('Get Orders', () => {
        const ordersResponse = http.get(`${API_URL}/orders?page=1&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
          tags: { name: 'orders_get' },
        });

        check(ordersResponse, {
          'get orders status is 200': (r) => r.status === 200,
          'get orders response is valid': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.success;
            } catch {
              return false;
            }
          },
        });

        requestCount.add(1);
        responseTime.add(ordersResponse.timings.duration);
        if (ordersResponse.status >= 400) {
          errorRate.add(1);
        } else {
          errorRate.add(0);
        }
      });
    }
  });

  group('File Upload', () => {
    const token = authenticateUser();

    if (token) {
      // Test file upload (simulated)
      group('Upload File', () => {
        const fileData =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

        const uploadResponse = http.post(
          `${API_URL}/files/upload`,
          {
            file: http.file(fileData, 'test.png', 'image/png'),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            tags: { name: 'file_upload' },
          }
        );

        check(uploadResponse, {
          'file upload status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        });

        requestCount.add(1);
        responseTime.add(uploadResponse.timings.duration);
        if (uploadResponse.status >= 400) {
          errorRate.add(1);
        } else {
          errorRate.add(0);
        }
      });
    }
  });

  group('Analytics', () => {
    // Test analytics endpoints
    group('Business Metrics', () => {
      const analyticsResponse = http.get(`${API_URL}/analytics/business-metrics`, {
        tags: { name: 'analytics_metrics' },
      });

      check(analyticsResponse, {
        'analytics status is 200': (r) => r.status === 200,
      });

      requestCount.add(1);
      responseTime.add(analyticsResponse.timings.duration);
      if (analyticsResponse.status >= 400) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }
    });
  });

  // Add some realistic user behavior delays
  sleep(Math.random() * 3 + 1); // 1-4 seconds between requests
}

// Setup function (runs once at the beginning)
export function setup() {
  const setupData = { startTime: Date.now() };
  
  testLogger.testStart(LogCategory.LOAD_TEST, 'UltraMarket Comprehensive Load Test', {
    targetUrl: BASE_URL,
    testUsers: testUsers.length,
    searchQueries: searchQueries.length,
    environment: __ENV.TEST_ENV || 'development'
  });

  // Verify API is accessible
  const healthResponse = http.get(`${API_URL}/health`);
  if (healthResponse.status !== 200) {
    testLogger.testError(LogCategory.LOAD_TEST, 'API Health Check', `API health check failed: ${healthResponse.status}`, {
      url: `${API_URL}/health`,
      status: healthResponse.status,
      body: healthResponse.body
    });
    throw new Error('API is not accessible');
  }

  testLogger.loadTest(LogLevel.INFO, '✅ API health check passed', {
    healthCheckUrl: `${API_URL}/health`,
    status: healthResponse.status,
    responseTime: healthResponse.timings.duration
  });
  
  return setupData;
}

// Teardown function (runs once at the end)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  
  const testResults = {
    totalRequests: requestCount.count,
    errorRate: `${(errorRate.rate * 100).toFixed(2)}%`,
    avgResponseTime: `${responseTime.avg.toFixed(2)}ms`,
    p95ResponseTime: `${responseTime.p95.toFixed(2)}ms`,
    testDuration: `${duration}s`
  };
  
  testLogger.testComplete(LogCategory.LOAD_TEST, 'UltraMarket Load Test', duration * 1000, testResults);

  // Log detailed performance metrics
  testLogger.performanceMetric('Total Requests', requestCount.count, ' requests', {
    testType: 'load-test',
    phase: 'teardown'
  });
  
  testLogger.performanceMetric('Error Rate', (errorRate.rate * 100), '%', {
    testType: 'load-test',
    phase: 'teardown'
  });
  
  testLogger.performanceMetric('Avg Response Time', responseTime.avg, 'ms', {
    testType: 'load-test',
    phase: 'teardown'
  });
  
  testLogger.performanceMetric('95th Percentile Response Time', responseTime.p95, 'ms', {
    testType: 'load-test',
    phase: 'teardown'
  });
}
