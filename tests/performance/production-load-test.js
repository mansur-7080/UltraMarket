import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/* eslint-env k6 */
/* global __ENV, console */

// Custom metrics
const errorRate = new Rate('error_rate');
const orderCompletionTime = new Trend('order_completion_time');
const checkoutAbandonmentRate = new Rate('checkout_abandonment_rate');

// Test configuration
export const options = {
  stages: [
    // Ramp-up phase
    { duration: '2m', target: 100 }, // Warm up to 100 users
    { duration: '5m', target: 500 }, // Scale to 500 users
    { duration: '10m', target: 1000 }, // Peak load - 1000 users
    { duration: '5m', target: 1500 }, // Stress test - 1500 users
    { duration: '2m', target: 2000 }, // Spike test - 2000 users
    { duration: '5m', target: 1000 }, // Cool down to 1000
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    // Performance requirements
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    error_rate: ['rate<0.05'], // Custom error rate under 5%

    // Business requirements
    order_completion_time: ['p(95)<30000'], // 95% orders complete under 30s
    checkout_abandonment_rate: ['rate<0.20'], // Less than 20% abandonment

    // Specific endpoint requirements
    'http_req_duration{endpoint:auth}': ['p(95)<500'],
    'http_req_duration{endpoint:products}': ['p(95)<1000'],
    'http_req_duration{endpoint:cart}': ['p(95)<800'],
    'http_req_duration{endpoint:checkout}': ['p(95)<3000'],
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://api.ultramarket.com';
const WEB_URL = __ENV.WEB_URL || 'https://ultramarket.com';

const testUsers = [
  { email: 'test1@example.com', password: 'TestPass123!' },
  { email: 'test2@example.com', password: 'TestPass123!' },
  { email: 'test3@example.com', password: 'TestPass123!' },
];

const productIds = ['1', '2', '3', '4', '5', '10', '15', '20', '25', '30'];

// Utility functions
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomProduct() {
  return productIds[Math.floor(Math.random() * productIds.length)];
}

function getRandomQuantity() {
  return Math.floor(Math.random() * 5) + 1;
}

// Test scenarios
export default function () {
  const user = getRandomUser();
  let authToken = '';

  group('User Authentication Flow', () => {
    // Login
    const loginResponse = http.post(
      `${BASE_URL}/auth/login`,
      {
        email: user.email,
        password: user.password,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'auth' },
      }
    );

    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response time < 500ms': (r) => r.timings.duration < 500,
      'login returns token': (r) => JSON.parse(r.body).token !== undefined,
    });

    if (loginSuccess) {
      authToken = JSON.parse(loginResponse.body).token;
    } else {
      errorRate.add(1);
      return; // Exit if login fails
    }
  });

  group('Product Browsing', () => {
    // Browse homepage
    const homepageResponse = http.get(`${WEB_URL}/`, {
      tags: { endpoint: 'homepage' },
    });

    check(homepageResponse, {
      'homepage loads successfully': (r) => r.status === 200,
      'homepage response time < 1s': (r) => r.timings.duration < 1000,
    });

    // Search products
    const searchTerm = ['laptop', 'mouse', 'keyboard', 'monitor'][Math.floor(Math.random() * 4)];
    const searchResponse = http.get(`${BASE_URL}/products/search?q=${searchTerm}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      tags: { endpoint: 'products' },
    });

    check(searchResponse, {
      'product search successful': (r) => r.status === 200,
      'search response time < 1s': (r) => r.timings.duration < 1000,
      'search returns results': (r) => JSON.parse(r.body).data.length > 0,
    });

    // View product details
    const productId = getRandomProduct();
    const productResponse = http.get(`${BASE_URL}/products/${productId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      tags: { endpoint: 'products' },
    });

    check(productResponse, {
      'product details loaded': (r) => r.status === 200,
      'product response time < 800ms': (r) => r.timings.duration < 800,
    });
  });

  group('Shopping Cart Operations', () => {
    // Add items to cart
    const cartItems = [];
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const productId = getRandomProduct();
      const quantity = getRandomQuantity();

      const addToCartResponse = http.post(
        `${BASE_URL}/cart/add`,
        {
          productId: productId,
          quantity: quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          tags: { endpoint: 'cart' },
        }
      );

      const addSuccess = check(addToCartResponse, {
        'add to cart successful': (r) => r.status === 200,
        'add to cart response time < 800ms': (r) => r.timings.duration < 800,
      });

      if (addSuccess) {
        cartItems.push({ productId, quantity });
      }
    }

    // View cart
    const cartResponse = http.get(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${authToken}` },
      tags: { endpoint: 'cart' },
    });

    check(cartResponse, {
      'cart view successful': (r) => r.status === 200,
      'cart has items': (r) => JSON.parse(r.body).items.length > 0,
    });

    // Update cart item
    if (cartItems.length > 0) {
      const updateItem = cartItems[0];
      const updateResponse = http.put(
        `${BASE_URL}/cart/update`,
        {
          productId: updateItem.productId,
          quantity: updateItem.quantity + 1,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          tags: { endpoint: 'cart' },
        }
      );

      check(updateResponse, {
        'cart update successful': (r) => r.status === 200,
      });
    }
  });

  group('Checkout Process', () => {
    const checkoutStartTime = Date.now();

    // Start checkout
    const checkoutResponse = http.post(
      `${BASE_URL}/checkout/start`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
        tags: { endpoint: 'checkout' },
      }
    );

    const checkoutStarted = check(checkoutResponse, {
      'checkout started': (r) => r.status === 200,
      'checkout response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (!checkoutStarted) {
      checkoutAbandonmentRate.add(1);
      errorRate.add(1);
      return;
    }

    // Add shipping address
    const shippingResponse = http.post(
      `${BASE_URL}/checkout/shipping`,
      {
        address: '123 Test Street',
        city: 'Test City',
        zipCode: '12345',
        country: 'US',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'checkout' },
      }
    );

    check(shippingResponse, {
      'shipping address added': (r) => r.status === 200,
    });

    // Select payment method
    const paymentMethodResponse = http.post(
      `${BASE_URL}/checkout/payment-method`,
      {
        type: 'credit_card',
        cardNumber: '4242424242424242',
        expiryMonth: '12',
        expiryYear: '2025',
        cvc: '123',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'checkout' },
      }
    );

    check(paymentMethodResponse, {
      'payment method selected': (r) => r.status === 200,
    });

    // Complete order
    const orderResponse = http.post(
      `${BASE_URL}/checkout/complete`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
        tags: { endpoint: 'checkout' },
      }
    );

    const orderCompleted = check(orderResponse, {
      'order completed successfully': (r) => r.status === 200,
      'order completion time < 3s': (r) => r.timings.duration < 3000,
      'order ID returned': (r) => JSON.parse(r.body).orderId !== undefined,
    });

    const checkoutEndTime = Date.now();
    const totalCheckoutTime = checkoutEndTime - checkoutStartTime;

    if (orderCompleted) {
      orderCompletionTime.add(totalCheckoutTime);
    } else {
      checkoutAbandonmentRate.add(1);
      errorRate.add(1);
    }
  });

  group('User Account Operations', () => {
    // View order history
    const ordersResponse = http.get(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` },
      tags: { endpoint: 'orders' },
    });

    check(ordersResponse, {
      'order history loaded': (r) => r.status === 200,
      'orders response time < 1s': (r) => r.timings.duration < 1000,
    });

    // Update profile
    const profileResponse = http.put(
      `${BASE_URL}/user/profile`,
      {
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'user' },
      }
    );

    check(profileResponse, {
      'profile update successful': (r) => r.status === 200,
    });
  });

  // Random think time between 1-5 seconds
  sleep(Math.random() * 4 + 1);
}

// Teardown function
export function teardown() {
  console.log('Load test completed. Generating summary...');

  // You can add cleanup logic here if needed
  // For example, clearing test data or sending notifications
}

// Setup function for test initialization
export function setup() {
  console.log('Starting UltraMarket production load test...');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Web URL: ${WEB_URL}`);

  // Verify system availability before starting test
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('System health check failed - aborting load test');
  }

  return { startTime: Date.now() };
}
