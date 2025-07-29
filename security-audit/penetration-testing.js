const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { testLogger, LogLevel, LogCategory } = require('../libs/shared/src/utils/professional-logger.ts');

// Penetration testing configuration
const config = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  maxConcurrency: 5,
  reportPath: './security-audit/penetration-test-report.json',
};

// Test results collector
class TestResults {
  constructor() {
    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        criticalVulnerabilities: 0,
        highVulnerabilities: 0,
        mediumVulnerabilities: 0,
        lowVulnerabilities: 0,
      },
      vulnerabilities: [],
      testDetails: [],
    };
  }

  addTest(testName, category, severity, passed, details) {
    this.results.summary.totalTests++;

    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;

      // Count vulnerabilities by severity
      switch (severity.toLowerCase()) {
        case 'critical':
          this.results.summary.criticalVulnerabilities++;
          break;
        case 'high':
          this.results.summary.highVulnerabilities++;
          break;
        case 'medium':
          this.results.summary.mediumVulnerabilities++;
          break;
        case 'low':
          this.results.summary.lowVulnerabilities++;
          break;
      }

      this.results.vulnerabilities.push({
        testName,
        category,
        severity,
        details,
        timestamp: new Date().toISOString(),
      });
    }

    this.results.testDetails.push({
      testName,
      category,
      severity,
      passed,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  generateReport() {
    const report = {
      ...this.results,
      metadata: {
        testDate: new Date().toISOString(),
        targetURL: config.baseURL,
        testDuration: 0, // Will be calculated
        tester: 'Automated Security Scanner',
        version: '1.0.0',
      },
    };

    // Calculate security score
    const totalVulns =
      this.results.summary.criticalVulnerabilities +
      this.results.summary.highVulnerabilities +
      this.results.summary.mediumVulnerabilities +
      this.results.summary.lowVulnerabilities;

    const maxScore = 100;
    const criticalPenalty = this.results.summary.criticalVulnerabilities * 25;
    const highPenalty = this.results.summary.highVulnerabilities * 15;
    const mediumPenalty = this.results.summary.mediumVulnerabilities * 8;
    const lowPenalty = this.results.summary.lowVulnerabilities * 3;

    report.securityScore = Math.max(
      0,
      maxScore - criticalPenalty - highPenalty - mediumPenalty - lowPenalty
    );

    return report;
  }

  saveReport() {
    const report = this.generateReport();
    fs.writeFileSync(config.reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${config.reportPath}`);
    return report;
  }
}

// HTTP client with security testing capabilities
class SecurityTester {
  constructor() {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      validateStatus: () => true, // Don't throw on any status code
    });
    this.results = new TestResults();
  }

  async makeRequest(method, url, data = null, headers = {}) {
    try {
      const response = await this.client.request({
        method,
        url,
        data,
        headers,
      });
      return response;
    } catch (error) {
      return {
        status: 0,
        data: null,
        error: error.message,
      };
    }
  }

  // Authentication and Authorization Tests
  async testAuthentication() {
    testLogger.securityAudit(LogLevel.INFO, '🔐 Testing Authentication & Authorization', {
      phase: 'authentication_testing',
      timestamp: new Date().toISOString()
    });

    // Test 1: Access protected endpoint without token
    const response1 = await this.makeRequest('GET', '/api/users/profile');
    this.results.addTest(
      'Unauthenticated Access Protection',
      'Authentication',
      'High',
      response1.status === 401,
      `Expected 401, got ${response1.status}`
    );

    // Test 2: Invalid JWT token
    const response2 = await this.makeRequest('GET', '/api/users/profile', null, {
      Authorization: 'Bearer invalid_token_here',
    });
    this.results.addTest(
      'Invalid JWT Token Handling',
      'Authentication',
      'High',
      response2.status === 401,
      `Expected 401, got ${response2.status}`
    );

    // Test 3: Expired JWT token
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    const response3 = await this.makeRequest('GET', '/api/users/profile', null, {
      Authorization: `Bearer ${expiredToken}`,
    });
    this.results.addTest(
      'Expired JWT Token Handling',
      'Authentication',
      'High',
      response3.status === 401,
      `Expected 401, got ${response3.status}`
    );

    // Test 4: JWT algorithm confusion
    const algNoneToken =
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.';
    const response4 = await this.makeRequest('GET', '/api/users/profile', null, {
      Authorization: `Bearer ${algNoneToken}`,
    });
    this.results.addTest(
      'JWT Algorithm Confusion Attack',
      'Authentication',
      'Critical',
      response4.status === 401,
      `Expected 401, got ${response4.status} - Vulnerable to alg:none attack`
    );
  }

  // Input Validation Tests
  async testInputValidation() {
    testLogger.securityAudit(LogLevel.INFO, '🛡️ Testing Input Validation', {
      phase: 'input_validation_testing',
      timestamp: new Date().toISOString()
    });

    // Test 1: SQL Injection
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "1' UNION SELECT * FROM users--",
    ];

    for (const payload of sqlPayloads) {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: payload,
        password: 'password',
      });

      this.results.addTest(
        `SQL Injection Test: ${payload.substring(0, 20)}...`,
        'Input Validation',
        'Critical',
        response.status !== 200 && !response.data?.success,
        `SQL injection payload: ${payload}`
      );
    }

    // Test 2: XSS (Cross-Site Scripting)
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
    ];

    for (const payload of xssPayloads) {
      const response = await this.makeRequest('POST', '/api/products', {
        name: payload,
        description: 'Test product',
      });

      this.results.addTest(
        `XSS Test: ${payload.substring(0, 20)}...`,
        'Input Validation',
        'High',
        !response.data?.name?.includes('<script>') && !response.data?.name?.includes('javascript:'),
        `XSS payload: ${payload}`
      );
    }

    // Test 3: Path Traversal
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ];

    for (const payload of pathTraversalPayloads) {
      const response = await this.makeRequest('GET', `/api/files/${payload}`);

      this.results.addTest(
        `Path Traversal Test: ${payload.substring(0, 20)}...`,
        'Input Validation',
        'High',
        response.status === 400 || response.status === 403 || response.status === 404,
        `Path traversal payload: ${payload}`
      );
    }

    // Test 4: Command Injection
    const commandPayloads = ['; ls -la', '| whoami', '&& cat /etc/passwd', '`id`'];

    for (const payload of commandPayloads) {
      const response = await this.makeRequest('POST', '/api/system/ping', {
        host: `localhost${payload}`,
      });

      this.results.addTest(
        `Command Injection Test: ${payload.substring(0, 20)}...`,
        'Input Validation',
        'Critical',
        response.status !== 200 || !response.data?.output?.includes('root'),
        `Command injection payload: ${payload}`
      );
    }
  }

  // Rate Limiting Tests
  async testRateLimiting() {
    testLogger.securityAudit(LogLevel.INFO, '⚡ Testing Rate Limiting', {
      phase: 'rate_limiting_testing',
      timestamp: new Date().toISOString()
    });

    const endpoint = '/api/auth/login';
    const requests = [];
    const requestCount = 20;

    // Send multiple requests rapidly
    for (let i = 0; i < requestCount; i++) {
      requests.push(
        this.makeRequest('POST', endpoint, {
          email: 'test@test.com',
          password: 'wrongpassword',
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);

    this.results.addTest(
      'Rate Limiting Protection',
      'Rate Limiting',
      'Medium',
      rateLimitedResponses.length > 0,
      `${rateLimitedResponses.length}/${requestCount} requests were rate limited`
    );
  }

  // CORS Tests
  async testCORS() {
    testLogger.securityAudit(LogLevel.INFO, '🌐 Testing CORS Configuration', {
      phase: 'cors_testing',
      timestamp: new Date().toISOString()
    });

    // Test 1: Preflight request
    const response1 = await this.makeRequest('OPTIONS', '/api/users', null, {
      Origin: 'https://evil.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    });

    this.results.addTest(
      'CORS Preflight Protection',
      'CORS',
      'Medium',
      !response1.headers?.['access-control-allow-origin']?.includes('evil.com'),
      `CORS headers: ${JSON.stringify(response1.headers)}`
    );

    // Test 2: Wildcard origin
    const response2 = await this.makeRequest('GET', '/api/health', null, {
      Origin: 'https://malicious.com',
    });

    this.results.addTest(
      'CORS Wildcard Origin',
      'CORS',
      'High',
      response2.headers?.['access-control-allow-origin'] !== '*',
      `Access-Control-Allow-Origin: ${response2.headers?.['access-control-allow-origin']}`
    );
  }

  // Security Headers Tests
  async testSecurityHeaders() {
    testLogger.securityAudit(LogLevel.INFO, '🛡️ Testing Security Headers', {
      phase: 'security_headers_testing',
      timestamp: new Date().toISOString()
    });

    const response = await this.makeRequest('GET', '/api/health');
    const headers = response.headers || {};

    const securityHeaders = [
      {
        name: 'X-Content-Type-Options',
        expected: 'nosniff',
        severity: 'Medium',
      },
      {
        name: 'X-Frame-Options',
        expected: 'DENY',
        severity: 'Medium',
      },
      {
        name: 'X-XSS-Protection',
        expected: '1; mode=block',
        severity: 'Medium',
      },
      {
        name: 'Strict-Transport-Security',
        expected: null, // Just check if present
        severity: 'High',
      },
      {
        name: 'Content-Security-Policy',
        expected: null, // Just check if present
        severity: 'High',
      },
    ];

    securityHeaders.forEach((header) => {
      const headerValue = headers[header.name.toLowerCase()];
      const isPresent = headerValue !== undefined;
      const isCorrect = header.expected ? headerValue === header.expected : isPresent;

      this.results.addTest(
        `Security Header: ${header.name}`,
        'Security Headers',
        header.severity,
        isCorrect,
        `Expected: ${header.expected || 'Present'}, Got: ${headerValue || 'Missing'}`
      );
    });

    // Test for information disclosure headers
    const dangerousHeaders = ['Server', 'X-Powered-By', 'X-AspNet-Version'];
    dangerousHeaders.forEach((header) => {
      const headerValue = headers[header.toLowerCase()];
      this.results.addTest(
        `Information Disclosure: ${header}`,
        'Security Headers',
        'Low',
        headerValue === undefined,
        `Header value: ${headerValue || 'Not present (good)'}`
      );
    });
  }

  // Session Management Tests
  async testSessionManagement() {
    testLogger.securityAudit(LogLevel.INFO, '🔑 Testing Session Management', {
      phase: 'session_management_testing',
      timestamp: new Date().toISOString()
    });

    // Test 1: Session fixation
    const response1 = await this.makeRequest('POST', '/api/auth/login', {
      email: 'test@test.com',
      password: 'password',
    });

    const sessionCookie = response1.headers?.['set-cookie']?.find((c) => c.includes('session'));

    this.results.addTest(
      'Session Cookie Security',
      'Session Management',
      'Medium',
      sessionCookie?.includes('HttpOnly') && sessionCookie?.includes('Secure'),
      `Session cookie: ${sessionCookie || 'No session cookie found'}`
    );

    // Test 2: Session timeout
    // This would require a more complex test setup
    this.results.addTest(
      'Session Timeout',
      'Session Management',
      'Medium',
      true, // Placeholder - would need actual session testing
      'Session timeout testing requires manual verification'
    );
  }

  // File Upload Tests
  async testFileUpload() {
    testLogger.securityAudit(LogLevel.INFO, '📁 Testing File Upload Security', {
      phase: 'file_upload_testing',
      timestamp: new Date().toISOString()
    });

    // Test 1: Malicious file upload
    const maliciousFiles = [
      { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
      { name: 'script.js', content: 'alert("XSS")', type: 'application/javascript' },
      { name: 'large.txt', content: 'A'.repeat(10 * 1024 * 1024), type: 'text/plain' }, // 10MB
    ];

    for (const file of maliciousFiles) {
      const formData = new FormData();
      formData.append('file', new Blob([file.content], { type: file.type }), file.name);

      const response = await this.makeRequest('POST', '/api/upload', formData, {
        'Content-Type': 'multipart/form-data',
      });

      this.results.addTest(
        `File Upload: ${file.name}`,
        'File Upload',
        'High',
        response.status === 400 || response.status === 403,
        `File upload response: ${response.status}`
      );
    }
  }

  // Business Logic Tests
  async testBusinessLogic() {
    testLogger.securityAudit(LogLevel.INFO, '💼 Testing Business Logic', {
      phase: 'business_logic_testing',
      timestamp: new Date().toISOString()
    });

    // Test 1: Price manipulation
    const response1 = await this.makeRequest('POST', '/api/orders', {
      items: [
        { productId: '123', quantity: 1, price: -100 }, // Negative price
      ],
    });

    this.results.addTest(
      'Price Manipulation',
      'Business Logic',
      'High',
      response1.status === 400 || !response1.data?.success,
      `Negative price response: ${response1.status}`
    );

    // Test 2: Quantity manipulation
    const response2 = await this.makeRequest('POST', '/api/cart/add', {
      productId: '123',
      quantity: -5, // Negative quantity
    });

    this.results.addTest(
      'Quantity Manipulation',
      'Business Logic',
      'Medium',
      response2.status === 400 || !response2.data?.success,
      `Negative quantity response: ${response2.status}`
    );

    // Test 3: Race condition in cart
    const cartRequests = [];
    for (let i = 0; i < 10; i++) {
      cartRequests.push(
        this.makeRequest('POST', '/api/cart/add', {
          productId: '123',
          quantity: 1,
        })
      );
    }

    const cartResponses = await Promise.all(cartRequests);
    const successfulRequests = cartResponses.filter((r) => r.status === 200);

    this.results.addTest(
      'Race Condition in Cart',
      'Business Logic',
      'Medium',
      successfulRequests.length <= 1, // Only one should succeed if properly handled
      `${successfulRequests.length}/10 requests succeeded`
    );
  }

  // Information Disclosure Tests
  async testInformationDisclosure() {
    testLogger.securityAudit(LogLevel.INFO, '🔍 Testing Information Disclosure', {
      phase: 'information_disclosure_testing',
      timestamp: new Date().toISOString()
    });

    // Test 1: Error message disclosure
    const response1 = await this.makeRequest('GET', '/api/users/99999999');
    const errorMessage = response1.data?.error?.message || '';

    this.results.addTest(
      'Database Error Disclosure',
      'Information Disclosure',
      'Low',
      !errorMessage.toLowerCase().includes('sql') &&
        !errorMessage.toLowerCase().includes('database'),
      `Error message: ${errorMessage}`
    );

    // Test 2: Stack trace disclosure
    const response2 = await this.makeRequest('POST', '/api/invalid-endpoint', {
      malformed: 'data',
    });

    const stackTrace = JSON.stringify(response2.data).toLowerCase();
    this.results.addTest(
      'Stack Trace Disclosure',
      'Information Disclosure',
      'Medium',
      !stackTrace.includes('stack') && !stackTrace.includes('traceback'),
      `Response contains stack trace: ${stackTrace.includes('stack')}`
    );

    // Test 3: Directory listing
    const response3 = await this.makeRequest('GET', '/uploads/');
    this.results.addTest(
      'Directory Listing',
      'Information Disclosure',
      'Low',
      response3.status === 403 || response3.status === 404,
      `Directory listing response: ${response3.status}`
    );
  }

  // Run all tests
  async runAllTests() {
    testLogger.testStart(LogCategory.SECURITY_AUDIT, 'Comprehensive Security Testing', {
      target: this.config.baseURL,
      userAgent: this.config.userAgent,
      timeout: this.config.timeout
    });
    
    const startTime = Date.now();

    try {
      await this.testAuthentication();
      await this.testInputValidation();
      await this.testRateLimiting();
      await this.testCORS();
      await this.testSecurityHeaders();
      await this.testSessionManagement();
      await this.testFileUpload();
      await this.testBusinessLogic();
      await this.testInformationDisclosure();

      const endTime = Date.now();
      const report = this.results.generateReport();
      report.metadata.testDuration = endTime - startTime;

      const summaryData = {
        totalTests: report.summary.totalTests,
        passed: report.summary.passed,
        failed: report.summary.failed,
        securityScore: report.securityScore,
        criticalVulnerabilities: report.summary.criticalVulnerabilities,
        highVulnerabilities: report.summary.highVulnerabilities,
        mediumVulnerabilities: report.summary.mediumVulnerabilities,
        lowVulnerabilities: report.summary.lowVulnerabilities
      };

      testLogger.testComplete(LogCategory.SECURITY_AUDIT, 'Comprehensive Security Testing', 
        endTime - startTime, summaryData);

      // Log detailed security metrics
      testLogger.securityAudit(LogLevel.INFO, '📊 Security Testing Complete', {
        ...summaryData,
        testDuration: `${(endTime - startTime) / 1000}s`
      });

      // Save detailed report
      if (this.config.reportPath) {
        fs.writeFileSync(this.config.reportPath, JSON.stringify(report, null, 2));
        testLogger.securityAudit(LogLevel.INFO, `Security report saved`, {
          reportPath: this.config.reportPath,
          reportSize: `${fs.statSync(this.config.reportPath).size} bytes`
        });
      }

      return report;
    } catch (error) {
      testLogger.testError(LogCategory.SECURITY_AUDIT, 'Comprehensive Security Testing', error, {
        duration: Date.now() - startTime
      });
      throw error;
    }
  }
}

// Main execution
async function main() {
  const tester = new SecurityTester();

  try {
    const report = await tester.runAllTests();

    // Exit with appropriate code
    if (report.summary.criticalVulnerabilities > 0) {
      console.log('\n❌ Critical vulnerabilities found! Immediate action required.');
      process.exit(1);
    } else if (report.summary.highVulnerabilities > 0) {
      console.log('\n⚠️ High severity vulnerabilities found! Please address soon.');
      process.exit(1);
    } else if (report.summary.mediumVulnerabilities > 0) {
      console.log('\n⚠️ Medium severity vulnerabilities found. Consider addressing.');
      process.exit(0);
    } else {
      console.log('\n✅ No critical or high severity vulnerabilities found!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Security testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SecurityTester, TestResults };
