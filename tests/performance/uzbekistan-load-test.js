import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics for Uzbekistan-specific scenarios
export let uzbekPaymentErrors = new Rate('uzbek_payment_errors');
export let uzbekRegionalResponseTime = new Trend('uzbek_regional_response_time');
export let uzbekConcurrentUsers = new Counter('uzbek_concurrent_users');
export let clickPaymentDuration = new Trend('click_payment_duration');
export let paymePaymentDuration = new Trend('payme_payment_duration');

// Uzbekistan-specific configuration
const UZBEKISTAN_CONFIG = {
  regions: [
    { code: 'TSH', name: 'Toshkent', weight: 35, users: 3500 },
    { code: 'SAM', name: 'Samarqand', weight: 15, users: 1500 },
    { code: 'BUX', name: 'Buxoro', weight: 8, users: 800 },
    { code: 'AND', name: 'Andijon', weight: 12, users: 1200 },
    { code: 'FAR', name: "Farg'ona", weight: 10, users: 1000 },
    { code: 'NAM', name: 'Namangan', weight: 8, users: 800 },
    { code: 'QAS', name: 'Qashqadaryo', weight: 7, users: 700 },
    { code: 'SUR', name: 'Surxondaryo', weight: 5, users: 500 },
  ],
  paymentMethods: [
    { method: 'click', weight: 40, processingTime: { min: 10, max: 30 } },
    { method: 'payme', weight: 30, processingTime: { min: 15, max: 35 } },
    { method: 'uzcard', weight: 15, processingTime: { min: 45, max: 90 } },
    { method: 'humo', weight: 10, processingTime: { min: 50, max: 95 } },
    { method: 'cash_on_delivery', weight: 5, processingTime: { min: 0, max: 0 } },
  ],
  peakHours: {
    // Toshkent vaqti bo'yicha (UTC+5)
    morning: { start: 9, end: 11, multiplier: 1.5 },
    lunch: { start: 12, end: 14, multiplier: 2.0 },
    evening: { start: 18, end: 22, multiplier: 2.5 },
  },
  categories: [
    { name: 'elektronika', weight: 30 },
    { name: 'kiyim', weight: 25 },
    { name: 'uy-jihozlari', weight: 20 },
    { name: 'kompyuter', weight: 15 },
    { name: 'sport', weight: 10 },
  ],
  languages: [
    { code: 'uz', weight: 60 },
    { code: 'ru', weight: 35 },
    { code: 'en', weight: 5 },
  ],
};

// Test scenarios configuration
export let options = {
  scenarios: {
    // Normal daytime traffic
    uzbekistan_normal_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 100 }, // Ramp up
        { duration: '5m', target: 100 }, // Stay at 100 users
        { duration: '2m', target: 200 }, // Ramp to 200 users
        { duration: '5m', target: 200 }, // Stay at 200 users
        { duration: '2m', target: 0 }, // Ramp down
      ],
      gracefulRampDown: '30s',
      env: { SCENARIO: 'normal' },
    },

    // Peak hours simulation (lunch time in Uzbekistan)
    uzbekistan_peak_hours: {
      executor: 'ramping-vus',
      startTime: '16m',
      stages: [
        { duration: '1m', target: 300 }, // Quick ramp up
        { duration: '3m', target: 500 }, // Peak traffic
        { duration: '2m', target: 800 }, // Maximum peak
        { duration: '3m', target: 500 }, // Scale down
        { duration: '1m', target: 0 }, // End
      ],
      gracefulRampDown: '30s',
      env: { SCENARIO: 'peak' },
    },

    // Regional distribution test
    uzbekistan_regional_test: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 5,
      startTime: '26m',
      maxDuration: '5m',
      env: { SCENARIO: 'regional' },
    },

    // Payment systems stress test
    uzbekistan_payment_stress: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 payment attempts per second
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 100,
      maxVUs: 200,
      startTime: '31m',
      env: { SCENARIO: 'payment' },
    },

    // Mobile traffic simulation
    uzbekistan_mobile_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '3m', target: 150 },
        { duration: '5m', target: 150 },
        { duration: '2m', target: 0 },
      ],
      startTime: '34m',
      env: { SCENARIO: 'mobile' },
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    uzbek_payment_errors: ['rate<0.02'], // Payment error rate under 2%
    uzbek_regional_response_time: ['p(90)<1500'], // Regional response time
    click_payment_duration: ['p(95)<5000'], // Click payments under 5s
    payme_payment_duration: ['p(95)<6000'], // Payme payments under 6s
  },
};

// Helper functions
function getRandomRegion() {
  const random = Math.random() * 100;
  let weightSum = 0;

  for (const region of UZBEKISTAN_CONFIG.regions) {
    weightSum += region.weight;
    if (random <= weightSum) {
      return region;
    }
  }
  return UZBEKISTAN_CONFIG.regions[0];
}

function getRandomPaymentMethod() {
  const random = Math.random() * 100;
  let weightSum = 0;

  for (const method of UZBEKISTAN_CONFIG.paymentMethods) {
    weightSum += method.weight;
    if (random <= weightSum) {
      return method;
    }
  }
  return UZBEKISTAN_CONFIG.paymentMethods[0];
}

function getRandomLanguage() {
  const random = Math.random() * 100;
  let weightSum = 0;

  for (const lang of UZBEKISTAN_CONFIG.languages) {
    weightSum += lang.weight;
    if (random <= weightSum) {
      return lang;
    }
  }
  return UZBEKISTAN_CONFIG.languages[0];
}

function getRandomCategory() {
  return randomItem(UZBEKISTAN_CONFIG.categories).name;
}

function getCurrentHourMultiplier() {
  const hour = new Date().getUTCHours() + 5; // Toshkent time (UTC+5)
  const adjustedHour = hour % 24;

  for (const [period, config] of Object.entries(UZBEKISTAN_CONFIG.peakHours)) {
    if (adjustedHour >= config.start && adjustedHour <= config.end) {
      return config.multiplier;
    }
  }
  return 1.0; // Normal traffic
}

function generateUzbekUserData() {
  const region = getRandomRegion();
  const language = getRandomLanguage();

  return {
    region: region.code,
    regionName: region.name,
    language: language.code,
    userAgent:
      __ENV.SCENARIO === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    currency: 'UZS',
    timezone: 'Asia/Tashkent',
  };
}

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'https://api.ultramarket.uz';

// Main test function
export default function () {
  const userData = generateUzbekUserData();
  const scenario = __ENV.SCENARIO || 'normal';

  // Set headers for Uzbekistan context
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language':
      userData.language === 'uz'
        ? 'uz-UZ,uz;q=0.9'
        : userData.language === 'ru'
          ? 'ru-RU,ru;q=0.9'
          : 'en-US,en;q=0.9',
    'User-Agent': userData.userAgent,
    'X-Region': userData.region,
    'X-Currency': userData.currency,
    'X-Timezone': userData.timezone,
  };

  uzbekConcurrentUsers.add(1);

  switch (scenario) {
    case 'normal':
      normalTrafficPattern(headers, userData);
      break;
    case 'peak':
      peakHoursPattern(headers, userData);
      break;
    case 'regional':
      regionalTestPattern(headers, userData);
      break;
    case 'payment':
      paymentStressPattern(headers, userData);
      break;
    case 'mobile':
      mobileTrafficPattern(headers, userData);
      break;
    default:
      normalTrafficPattern(headers, userData);
  }
}

function normalTrafficPattern(headers, userData) {
  group('Normal Uzbekistan User Journey', function () {
    // 1. Homepage visit
    group('Homepage', function () {
      const homeResponse = http.get(`${BASE_URL}/`, { headers });
      check(homeResponse, {
        'Homepage loaded successfully': (r) => r.status === 200,
        'Homepage response time OK': (r) => r.timings.duration < 2000,
      });
      uzbekRegionalResponseTime.add(homeResponse.timings.duration, { region: userData.region });
    });

    sleep(randomIntBetween(1, 3));

    // 2. Browse categories
    group('Category Browse', function () {
      const category = getRandomCategory();
      const categoryResponse = http.get(`${BASE_URL}/api/products/category/${category}`, {
        headers,
      });
      check(categoryResponse, {
        'Category loaded': (r) => r.status === 200,
        'Category has products': (r) => JSON.parse(r.body).length > 0,
      });
    });

    sleep(randomIntBetween(2, 5));

    // 3. Search products
    group('Product Search', function () {
      const searchTerms = ['telefon', 'kompyuter', 'kiyim', 'oyoq kiyim', 'soat'];
      const searchTerm = randomItem(searchTerms);
      const searchResponse = http.get(
        `${BASE_URL}/api/search?q=${searchTerm}&region=${userData.region}`,
        { headers }
      );
      check(searchResponse, {
        'Search completed': (r) => r.status === 200,
      });
    });

    sleep(randomIntBetween(1, 3));

    // 4. View product details
    group('Product Details', function () {
      const productId = randomIntBetween(1, 1000);
      const productResponse = http.get(`${BASE_URL}/api/products/${productId}`, { headers });
      check(productResponse, {
        'Product details loaded': (r) => r.status === 200 || r.status === 404,
      });
    });

    sleep(randomIntBetween(2, 4));

    // 5. Add to cart (30% probability)
    if (Math.random() < 0.3) {
      group('Add to Cart', function () {
        const cartData = {
          productId: randomIntBetween(1, 1000),
          quantity: randomIntBetween(1, 3),
          region: userData.region,
        };
        const cartResponse = http.post(`${BASE_URL}/api/cart/add`, JSON.stringify(cartData), {
          headers,
        });
        check(cartResponse, {
          'Product added to cart': (r) => r.status === 200 || r.status === 201,
        });
      });

      sleep(randomIntBetween(1, 2));

      // 6. Proceed to checkout (50% of cart users)
      if (Math.random() < 0.5) {
        checkoutFlow(headers, userData);
      }
    }
  });
}

function peakHoursPattern(headers, userData) {
  group('Peak Hours Traffic', function () {
    const multiplier = getCurrentHourMultiplier();

    // Faster browsing during peak hours
    const sleepTime = Math.max(0.5, 2 / multiplier);

    // Homepage
    const homeResponse = http.get(`${BASE_URL}/`, { headers });
    check(homeResponse, {
      'Peak hour homepage loaded': (r) => r.status === 200,
    });

    sleep(sleepTime);

    // Quick product search
    const searchResponse = http.get(`${BASE_URL}/api/search?q=chegirma&region=${userData.region}`, {
      headers,
    });
    check(searchResponse, {
      'Peak hour search completed': (r) => r.status === 200,
    });

    sleep(sleepTime);

    // High probability of checkout during peak hours
    if (Math.random() < 0.7) {
      checkoutFlow(headers, userData);
    }
  });
}

function regionalTestPattern(headers, userData) {
  group(`Regional Test - ${userData.regionName}`, function () {
    // Test regional-specific endpoints
    const regionalResponse = http.get(`${BASE_URL}/api/region/${userData.region}/products`, {
      headers,
    });
    check(regionalResponse, {
      [`${userData.regionName} products loaded`]: (r) => r.status === 200,
    });
    uzbekRegionalResponseTime.add(regionalResponse.timings.duration, { region: userData.region });

    // Test regional delivery options
    const deliveryResponse = http.get(`${BASE_URL}/api/delivery/options/${userData.region}`, {
      headers,
    });
    check(deliveryResponse, {
      [`${userData.regionName} delivery options available`]: (r) => r.status === 200,
    });

    sleep(randomIntBetween(1, 2));
  });
}

function paymentStressPattern(headers, userData) {
  group('Payment System Stress Test', function () {
    const paymentMethod = getRandomPaymentMethod();
    const orderData = {
      amount: randomIntBetween(50000, 5000000), // 50k to 5M UZS
      currency: 'UZS',
      paymentMethod: paymentMethod.method,
      region: userData.region,
    };

    // Create payment
    const paymentStart = Date.now();
    const paymentResponse = http.post(
      `${BASE_URL}/api/payment/${paymentMethod.method}/create`,
      JSON.stringify(orderData),
      { headers }
    );

    const paymentDuration = Date.now() - paymentStart;

    if (paymentMethod.method === 'click') {
      clickPaymentDuration.add(paymentDuration);
    } else if (paymentMethod.method === 'payme') {
      paymePaymentDuration.add(paymentDuration);
    }

    const paymentSuccess = check(paymentResponse, {
      'Payment created successfully': (r) => r.status === 200 || r.status === 201,
      'Payment response valid': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!paymentSuccess) {
      uzbekPaymentErrors.add(1);
    }

    // Simulate payment processing time
    const processingTime = randomIntBetween(
      paymentMethod.processingTime.min,
      paymentMethod.processingTime.max
    );
    if (processingTime > 0) {
      sleep(processingTime / 1000); // Convert to seconds
    }
  });
}

function mobileTrafficPattern(headers, userData) {
  group('Mobile User Experience', function () {
    // Mobile-specific headers
    const mobileHeaders = {
      ...headers,
      'X-Requested-With': 'XMLHttpRequest',
      Connection: 'keep-alive',
    };

    // Simplified mobile journey
    const mobileHomeResponse = http.get(`${BASE_URL}/mobile/api/homepage`, {
      headers: mobileHeaders,
    });
    check(mobileHomeResponse, {
      'Mobile homepage loaded': (r) => r.status === 200,
    });

    sleep(randomIntBetween(2, 4));

    // Mobile search with autocomplete
    const mobileSearchResponse = http.get(`${BASE_URL}/mobile/api/search/autocomplete?q=tel`, {
      headers: mobileHeaders,
    });
    check(mobileSearchResponse, {
      'Mobile autocomplete working': (r) => r.status === 200,
    });

    sleep(randomIntBetween(1, 2));

    // Quick mobile checkout
    if (Math.random() < 0.4) {
      mobileCheckoutFlow(mobileHeaders, userData);
    }
  });
}

function checkoutFlow(headers, userData) {
  group('Checkout Flow', function () {
    const paymentMethod = getRandomPaymentMethod();

    // Get cart
    const cartResponse = http.get(`${BASE_URL}/api/cart`, { headers });
    check(cartResponse, {
      'Cart retrieved': (r) => r.status === 200,
    });

    sleep(1);

    // Apply shipping
    const shippingData = {
      region: userData.region,
      address: {
        region: userData.region,
        city: userData.regionName,
        district: 'Test District',
        street: 'Test Street 123',
      },
    };
    const shippingResponse = http.post(
      `${BASE_URL}/api/shipping/calculate`,
      JSON.stringify(shippingData),
      { headers }
    );
    check(shippingResponse, {
      'Shipping calculated': (r) => r.status === 200,
    });

    sleep(2);

    // Create order
    const orderData = {
      paymentMethod: paymentMethod.method,
      shipping: shippingData,
      currency: 'UZS',
      language: userData.language,
    };
    const orderResponse = http.post(`${BASE_URL}/api/orders/create`, JSON.stringify(orderData), {
      headers,
    });
    check(orderResponse, {
      'Order created': (r) => r.status === 200 || r.status === 201,
    });

    sleep(randomIntBetween(1, 3));
  });
}

function mobileCheckoutFlow(headers, userData) {
  group('Mobile Checkout', function () {
    // Simplified mobile checkout
    const mobileOrderData = {
      paymentMethod: 'click', // Most popular for mobile
      quickCheckout: true,
      region: userData.region,
    };

    const mobileOrderResponse = http.post(
      `${BASE_URL}/mobile/api/orders/quick-create`,
      JSON.stringify(mobileOrderData),
      { headers }
    );
    check(mobileOrderResponse, {
      'Mobile order created': (r) => r.status === 200 || r.status === 201,
    });
  });
}

// Test teardown
export function teardown(data) {
  const { createLogger } = require('../../packages/shared/src/utils/logger-replacement');
const logger = createLogger('uzbekistan-load-test');

logger.info('Uzbekistan Load Test Summary:');
logger.info('=============================');
logger.info(`Test completed at: ${new Date().toISOString()}`);
logger.info('Scenarios tested:');
logger.info('- Normal traffic patterns');
logger.info('- Peak hours simulation');
logger.info('- Regional distribution');
logger.info('- Payment systems stress');
logger.info('- Mobile user experience');
logger.info('');
logger.info('Key Uzbekistan-specific metrics tracked:');
logger.info('- Regional response times');
logger.info('- Payment method performance');
logger.info('- Language preference impact');
logger.info('- Peak hour capacity');
logger.info('- Mobile vs desktop performance');
}
