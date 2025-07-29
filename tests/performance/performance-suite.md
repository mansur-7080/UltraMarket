# 📊 UltraMarket Performance Testing Suite

## Overview

UltraMarket performance testing suite ta'minlaydi comprehensive performance validation for enterprise-grade e-commerce platform. Bu testing suite K6 testing framework ishlatadi va real-world user scenarios ni simulate qiladi.

## 🚀 Quick Start

### Prerequisites

```bash
# Install K6
# Windows (Chocolatey)
choco install k6

# macOS (Homebrew)
brew install k6

# Linux (APT)
sudo apt update && sudo apt install k6

# Or download from: https://k6.io/docs/getting-started/installation/
```

### Running Tests

```bash
# Basic load test
k6 run tests/performance/load-test.js

# Load test with custom settings
k6 run --vus 50 --duration 5m tests/performance/load-test.js

# Stress test
k6 run tests/performance/stress-test.js

# Spike test
k6 run tests/performance/spike-test.js

# Endurance test
k6 run tests/performance/endurance-test.js

# Custom environment
k6 run -e BASE_URL=https://staging-api.ultramarket.com/v2 tests/performance/load-test.js
```

## 📋 Test Scenarios

### 1. Load Testing (`load-test.js`)

**Maqsad**: Normal traffic conditions ostida system performance ni test qilish

**Scenarios**:

- **Product Browsing** (40% traffic)
  - Product list loading
  - Product detail viewing
  - Category browsing
- **User Authentication** (15% traffic)
  - User login/logout
  - Profile management
  - Session handling

- **Shopping Cart** (25% traffic)
  - Add/remove items
  - Update quantities
  - Cart persistence

- **Product Search** (20% traffic)
  - Text search
  - Filtered search
  - Autocomplete

**Performance Thresholds**:

- Response time: 95% < 500ms, 99% < 1000ms
- Error rate: < 1%
- Request rate: > 10 RPS

### 2. Stress Testing (`stress-test.js`)

**Maqsad**: System limits va breaking points ni aniqlash

**Configuration**:

```javascript
stages: [
  { duration: '1m', target: 100 }, // Warm up
  { duration: '5m', target: 500 }, // Stress level
  { duration: '10m', target: 1000 }, // High stress
  { duration: '5m', target: 1500 }, // Peak stress
  { duration: '2m', target: 0 }, // Cool down
];
```

**Thresholds**:

- Response time: 95% < 1000ms, 99% < 2000ms
- Error rate: < 5%

### 3. Spike Testing (`spike-test.js`)

**Maqsad**: Sudden traffic spikes ga system reaction ni test qilish

**Pattern**: Sharp traffic increases va decreases

### 4. Endurance Testing (`endurance-test.js`)

**Maqsad**: Long-term stability va memory leaks ni detect qilish

**Duration**: 30+ minutes constant load

## 🎯 Performance Metrics

### Application Metrics

1. **Response Time**
   - Average response time
   - 95th percentile response time
   - 99th percentile response time
   - Maximum response time

2. **Throughput**
   - Requests per second (RPS)
   - Data transfer rate
   - Concurrent users handled

3. **Error Rates**
   - HTTP 4xx errors
   - HTTP 5xx errors
   - Connection timeouts
   - DNS resolution failures

4. **Resource Utilization**
   - CPU usage
   - Memory consumption
   - Network I/O
   - Database connections

### Business Metrics

1. **User Experience**
   - Page load times
   - API response times
   - Search response times
   - Cart operations speed

2. **E-commerce Specific**
   - Product browsing performance
   - Search functionality speed
   - Cart operations latency
   - Checkout process timing

## 📊 Test Results Analysis

### Performance Benchmarks

| Metric              | Excellent  | Good      | Acceptable | Poor      |
| ------------------- | ---------- | --------- | ---------- | --------- |
| Response Time (p95) | < 200ms    | < 500ms   | < 1000ms   | > 1000ms  |
| Error Rate          | < 0.1%     | < 1%      | < 5%       | > 5%      |
| Throughput          | > 1000 RPS | > 500 RPS | > 100 RPS  | < 100 RPS |
| Availability        | > 99.9%    | > 99.5%   | > 99%      | < 99%     |

### Sample Test Report

```
📊 Performance Test Results
==========================

Test Duration: 30 minutes
Peak Users: 200 concurrent
Total Requests: 125,000

📈 Response Times:
   Average: 245ms
   95th percentile: 420ms
   99th percentile: 680ms
   Maximum: 1,200ms

📊 Throughput:
   Requests/sec: 69.4
   Data transferred: 2.1 GB
   Data received: 850 MB

❌ Error Analysis:
   Total errors: 0.08%
   4xx errors: 0.05%
   5xx errors: 0.03%
   Timeouts: 0.00%

🎯 Scenario Performance:
   Product Browsing: ✅ 98.5% success
   User Authentication: ✅ 99.2% success
   Shopping Cart: ✅ 97.8% success
   Product Search: ✅ 96.9% success

✅ All performance thresholds PASSED
```

## 🔧 Configuration Options

### Environment Variables

```bash
# Base URLs
BASE_URL=https://api.ultramarket.com/v2
WEB_URL=https://ultramarket.com

# Test Configuration
TEST_DURATION=30m
MAX_VUS=500
RAMP_UP_TIME=2m

# Thresholds
MAX_RESPONSE_TIME=1000
MAX_ERROR_RATE=0.01
MIN_REQUEST_RATE=10

# Database
DB_HOST=postgres-cluster
DB_NAME=ultramarket_test
DB_USER=test_user

# Redis
REDIS_HOST=redis-cluster
REDIS_PORT=6379
```

### Custom Test Data

```javascript
// Custom user data
const customUsers = [
  { email: 'premium@test.com', password: 'Premium123!', type: 'premium' },
  { email: 'business@test.com', password: 'Business123!', type: 'business' },
  { email: 'regular@test.com', password: 'Regular123!', type: 'regular' },
];

// Custom product data
const customProducts = [
  { id: '101', category: 'electronics', price: 1299.99 },
  { id: '102', category: 'clothing', price: 59.99 },
  { id: '103', category: 'books', price: 19.99 },
];
```

## 🎛️ Advanced Testing Scenarios

### E-commerce Flow Testing

```javascript
export function ecommerceFlow() {
  group('Complete E-commerce Flow', function () {
    // 1. Browse products
    const products = browseProducts();

    // 2. Search and filter
    const searchResults = searchProducts('laptop');

    // 3. View product details
    const productDetails = viewProductDetails(searchResults[0].id);

    // 4. Add to cart
    const cartResponse = addToCart(productDetails.id, 2);

    // 5. Update cart
    const updatedCart = updateCartItem(productDetails.id, 3);

    // 6. Proceed to checkout
    const checkoutResponse = initiateCheckout();

    // 7. Complete payment (mock)
    const paymentResponse = processPayment();

    // Measure complete flow time
    check(paymentResponse, {
      'Complete flow successful': (r) => r.status === 200,
      'Flow completed under 5 seconds': (r) => r.timings.duration < 5000,
    });
  });
}
```

### API Endpoint Testing

```javascript
const apiEndpoints = [
  { method: 'GET', url: '/products', weight: 30 },
  { method: 'GET', url: '/categories', weight: 10 },
  { method: 'POST', url: '/auth/login', weight: 15 },
  { method: 'GET', url: '/cart', weight: 20 },
  { method: 'POST', url: '/cart/items', weight: 15 },
  { method: 'GET', url: '/search', weight: 10 },
];

export function apiEndpointTest() {
  const endpoint = weightedRandomSelect(apiEndpoints);
  testEndpoint(endpoint.method, endpoint.url);
}
```

## 📊 Monitoring Integration

### Prometheus Metrics

```javascript
// Custom metrics for Prometheus
const customMetrics = {
  ecommerce_flow_duration: new Trend('ecommerce_flow_duration'),
  cart_operations_count: new Counter('cart_operations_count'),
  search_performance: new Trend('search_performance'),
  payment_success_rate: new Rate('payment_success_rate'),
};
```

### Grafana Dashboard

Integration qiling Grafana dashboard bilan real-time performance monitoring uchun:

```json
{
  "dashboard": {
    "title": "UltraMarket Performance Testing",
    "panels": [
      {
        "title": "Response Time Trends",
        "type": "graph",
        "targets": ["k6_http_req_duration"]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": ["k6_http_req_failed"]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": ["k6_http_reqs"]
      }
    ]
  }
}
```

## 🚨 Performance Alerts

### AlertManager Rules

```yaml
groups:
  - name: performance-testing
    rules:
      - alert: HighResponseTime
        expr: k6_http_req_duration{quantile="0.95"} > 1000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'Performance test showing high response times'

      - alert: HighErrorRate
        expr: rate(k6_http_req_failed[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Performance test error rate too high'
```

## 📋 Best Practices

### Test Design

1. **Realistic Scenarios**
   - Use real user behavior patterns
   - Include think time between actions
   - Simulate different user types

2. **Data Management**
   - Use shared arrays for large datasets
   - Avoid memory leaks in test data
   - Clean up test data after runs

3. **Gradual Load Increase**
   - Always ramp up gradually
   - Monitor system behavior during ramp up
   - Include ramp down period

### Performance Targets

1. **Response Time Goals**
   - API endpoints: < 200ms average
   - Database queries: < 100ms
   - Search operations: < 500ms
   - File uploads: < 2s per MB

2. **Scalability Targets**
   - Support 1000+ concurrent users
   - Handle 10,000+ RPS peak load
   - Maintain < 1% error rate under load

3. **Resource Efficiency**
   - CPU usage < 70% under normal load
   - Memory usage < 80% under peak load
   - Database connections < 80% of pool

## 🔍 Troubleshooting

### Common Issues

1. **High Response Times**

   ```bash
   # Check database performance
   k6 run --summary-trend-stats="avg,min,med,max,p(95),p(99)" load-test.js

   # Enable detailed logging
   k6 run --log-output=file --log-format=json load-test.js
   ```

2. **Memory Issues**

   ```javascript
   // Use smaller test datasets
   const limitedUsers = testUsers.slice(0, 100);

   // Clear variables after use
   delete largeDataStructure;
   ```

3. **Network Timeouts**
   ```javascript
   // Increase timeout settings
   export const options = {
     timeout: '60s',
     insecureSkipTLSVerify: true,
   };
   ```

## 📈 Performance Optimization

### Recommendations

1. **Code Level**
   - Optimize database queries
   - Implement proper caching
   - Minimize API calls
   - Use connection pooling

2. **Infrastructure Level**
   - Scale horizontally
   - Use CDN for static assets
   - Implement load balancing
   - Optimize network configuration

3. **Monitoring Level**
   - Set up real-time alerts
   - Monitor key business metrics
   - Track performance trends
   - Regular performance reviews

---

**🎯 Target**: 99.9% uptime, < 200ms response time, 1000+ concurrent users\*\*
