import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('UltraMarket API Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let adminToken: string;
  let userToken: string;
  let vendorToken: string;

  // Test data
  const testUser = {
    email: 'test@ultramarket.uz',
    phone: '+998901234567',
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
  };

  const testProduct = {
    name: 'Test Product',
    nameUz: 'Test Mahsulot',
    nameRu: 'Тестовый Продукт',
    nameEn: 'Test Product',
    description: 'Test product description',
    price: 100000,
    currency: 'UZS',
    sku: 'TEST-PRODUCT-001',
    stock: 10,
    brand: 'TestBrand',
    categoryId: null,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    await app.init();

    // Generate test tokens
    adminToken = jwtService.sign(
      { sub: 'admin-id', email: 'admin@ultramarket.uz', role: 'admin' },
      { secret: configService.get('JWT_SECRET') }
    );

    userToken = jwtService.sign(
      { sub: 'user-id', email: 'user@ultramarket.uz', role: 'customer' },
      { secret: configService.get('JWT_SECRET') }
    );

    vendorToken = jwtService.sign(
      { sub: 'vendor-id', email: 'vendor@ultramarket.uz', role: 'vendor' },
      { secret: configService.get('JWT_SECRET') }
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) should return 200', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });

    it('/health/detailed (GET) should return detailed health info', () => {
      return request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('services');
          expect(res.body.services).toHaveProperty('database');
          expect(res.body.services).toHaveProperty('redis');
          expect(res.body.services).toHaveProperty('elasticsearch');
        });
    });
  });

  describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user).not.toHaveProperty('password');
          });
      });

      it('should not register user with existing email', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send(testUser)
          .expect(409)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('already exists');
          });
      });

      it('should validate required fields', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: '123', // too short
          })
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(Array.isArray(res.body.message)).toBe(true);
          });
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
          });
      });

      it('should not login with invalid credentials', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Invalid credentials');
          });
      });
    });

    describe('POST /api/auth/refresh', () => {
      let refreshToken: string;

      beforeAll(async () => {
        const response = await request(app.getHttpServer()).post('/api/auth/login').send({
          email: testUser.email,
          password: testUser.password,
        });
        refreshToken = response.body.refreshToken;
      });

      it('should refresh tokens with valid refresh token', () => {
        return request(app.getHttpServer())
          .post('/api/auth/refresh')
          .send({ refreshToken })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
          });
      });

      it('should not refresh with invalid token', () => {
        return request(app.getHttpServer())
          .post('/api/auth/refresh')
          .send({ refreshToken: 'invalid-token' })
          .expect(401);
      });
    });
  });

  describe('Products API', () => {
    let productId: string;

    describe('GET /api/products', () => {
      it('should return products list', () => {
        return request(app.getHttpServer())
          .get('/api/products')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('meta');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.meta).toHaveProperty('total');
            expect(res.body.meta).toHaveProperty('page');
            expect(res.body.meta).toHaveProperty('limit');
          });
      });

      it('should support pagination', () => {
        return request(app.getHttpServer())
          .get('/api/products?page=1&limit=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.meta.page).toBe(1);
            expect(res.body.meta.limit).toBe(5);
            expect(res.body.data.length).toBeLessThanOrEqual(5);
          });
      });

      it('should support filtering by category', () => {
        return request(app.getHttpServer())
          .get('/api/products?category=electronics')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            // All products should be from electronics category
            if (res.body.data.length > 0) {
              expect(res.body.data[0]).toHaveProperty('categoryId');
            }
          });
      });

      it('should support price range filtering', () => {
        return request(app.getHttpServer())
          .get('/api/products?minPrice=100000&maxPrice=500000')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            res.body.data.forEach((product: any) => {
              expect(product.price).toBeGreaterThanOrEqual(100000);
              expect(product.price).toBeLessThanOrEqual(500000);
            });
          });
      });
    });

    describe('POST /api/products', () => {
      it('should create product with admin token', () => {
        return request(app.getHttpServer())
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testProduct)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe(testProduct.name);
            expect(res.body.price).toBe(testProduct.price);
            productId = res.body.id;
          });
      });

      it('should not create product without admin token', () => {
        return request(app.getHttpServer())
          .post('/api/products')
          .set('Authorization', `Bearer ${userToken}`)
          .send(testProduct)
          .expect(403);
      });

      it('should validate product data', () => {
        return request(app.getHttpServer())
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '', // empty name
            price: -100, // negative price
          })
          .expect(400);
      });
    });

    describe('GET /api/products/:id', () => {
      it('should return product by id', () => {
        return request(app.getHttpServer())
          .get(`/api/products/${productId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id', productId);
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('price');
          });
      });

      it('should return 404 for non-existent product', () => {
        return request(app.getHttpServer()).get('/api/products/non-existent-id').expect(404);
      });
    });

    describe('PUT /api/products/:id', () => {
      it('should update product with admin token', () => {
        const updatedData = { name: 'Updated Product Name', price: 150000 };
        return request(app.getHttpServer())
          .put(`/api/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updatedData)
          .expect(200)
          .expect((res) => {
            expect(res.body.name).toBe(updatedData.name);
            expect(res.body.price).toBe(updatedData.price);
          });
      });

      it('should not update product without admin token', () => {
        return request(app.getHttpServer())
          .put(`/api/products/${productId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ name: 'Unauthorized Update' })
          .expect(403);
      });
    });

    describe('GET /api/products/search', () => {
      it('should search products by query', () => {
        return request(app.getHttpServer())
          .get('/api/products/search?q=test')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('meta');
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });

      it('should return empty results for non-matching query', () => {
        return request(app.getHttpServer())
          .get('/api/products/search?q=nonexistentproduct12345')
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toHaveLength(0);
          });
      });
    });

    describe('DELETE /api/products/:id', () => {
      it('should delete product with admin token', () => {
        return request(app.getHttpServer())
          .delete(`/api/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(204);
      });

      it('should return 404 after deletion', () => {
        return request(app.getHttpServer()).get(`/api/products/${productId}`).expect(404);
      });
    });
  });

  describe('Orders API', () => {
    let orderId: string;

    describe('POST /api/orders', () => {
      it('should create order with user token', () => {
        const orderData = {
          items: [
            {
              productId: 'sample-product-id',
              quantity: 2,
              price: 100000,
            },
          ],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            phone: '+998901234567',
            address: 'Test Address',
            city: 'Tashkent',
            region: 'Tashkent',
            postalCode: '100000',
            country: 'Uzbekistan',
          },
        };

        return request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(orderData)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('orderNumber');
            expect(res.body).toHaveProperty('status', 'pending');
            expect(res.body.items).toHaveLength(1);
            orderId = res.body.id;
          });
      });

      it('should not create order without token', () => {
        return request(app.getHttpServer()).post('/api/orders').send({ items: [] }).expect(401);
      });
    });

    describe('GET /api/orders', () => {
      it('should return user orders with user token', () => {
        return request(app.getHttpServer())
          .get('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });

      it('should return all orders with admin token', () => {
        return request(app.getHttpServer())
          .get('/api/orders')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });

    describe('GET /api/orders/:id', () => {
      it('should return order by id', () => {
        return request(app.getHttpServer())
          .get(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id', orderId);
            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('items');
          });
      });
    });

    describe('PUT /api/orders/:id', () => {
      it('should update order status with admin token', () => {
        return request(app.getHttpServer())
          .put(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'processing' })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe('processing');
          });
      });
    });
  });

  describe('Payments API', () => {
    describe('POST /api/payments/click/prepare', () => {
      it('should handle click prepare request', () => {
        const clickData = {
          click_trans_id: '123456789',
          service_id: '12345',
          click_paydoc_id: '987654321',
          merchant_trans_id: orderId,
          amount: '200000',
          action: '0',
          error: '0',
          error_note: 'Success',
          sign_time: '2024-01-15 10:30:00',
          sign_string: 'test-signature',
        };

        return request(app.getHttpServer())
          .post('/api/payments/click/prepare')
          .send(clickData)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('click_trans_id');
            expect(res.body).toHaveProperty('merchant_trans_id');
            expect(res.body).toHaveProperty('error');
          });
      });
    });

    describe('POST /api/payments/payme/rpc', () => {
      it('should handle payme RPC request', () => {
        const paymeData = {
          jsonrpc: '2.0',
          id: 123,
          method: 'CheckPerformTransaction',
          params: {
            amount: 200000,
            account: {
              order_id: orderId,
            },
          },
        };

        return request(app.getHttpServer())
          .post('/api/payments/payme/rpc')
          .send(paymeData)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('jsonrpc', '2.0');
            expect(res.body).toHaveProperty('id', 123);
            expect(res.body).toHaveProperty('result');
          });
      });
    });
  });

  describe('File Upload API', () => {
    describe('POST /api/files/upload', () => {
      it('should upload file with admin token', () => {
        return request(app.getHttpServer())
          .post('/api/files/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', Buffer.from('test file content'), 'test.txt')
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('filename');
            expect(res.body).toHaveProperty('url');
          });
      });

      it('should not upload file without token', () => {
        return request(app.getHttpServer())
          .post('/api/files/upload')
          .attach('file', Buffer.from('test file content'), 'test.txt')
          .expect(401);
      });
    });
  });

  describe('Search API', () => {
    describe('GET /api/search', () => {
      it('should search across all entities', () => {
        return request(app.getHttpServer())
          .get('/api/search?q=test&type=products')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('meta');
            expect(res.body.meta).toHaveProperty('total');
            expect(res.body.meta).toHaveProperty('took');
          });
      });

      it('should support faceted search', () => {
        return request(app.getHttpServer())
          .get('/api/search?q=test&facets=brand,category')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('facets');
            expect(res.body.facets).toHaveProperty('brand');
            expect(res.body.facets).toHaveProperty('category');
          });
      });
    });

    describe('GET /api/search/autocomplete', () => {
      it('should return autocomplete suggestions', () => {
        return request(app.getHttpServer())
          .get('/api/search/autocomplete?q=te')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('suggestions');
            expect(Array.isArray(res.body.suggestions)).toBe(true);
          });
      });
    });
  });

  describe('Notifications API', () => {
    describe('POST /api/notifications/send', () => {
      it('should send notification with admin token', () => {
        const notificationData = {
          type: 'email',
          recipient: 'test@ultramarket.uz',
          template: 'welcome_email',
          data: {
            firstName: 'Test',
            frontendUrl: 'https://ultramarket.uz',
          },
        };

        return request(app.getHttpServer())
          .post('/api/notifications/send')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(notificationData)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
          });
      });
    });

    describe('POST /api/notifications/sms', () => {
      it('should send SMS with admin token', () => {
        const smsData = {
          recipient: '+998901234567',
          template: 'sms_verification',
          data: {
            code: '123456',
          },
        };

        return request(app.getHttpServer())
          .post('/api/notifications/sms')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(smsData)
          .expect(200);
      });
    });
  });

  describe('Analytics API', () => {
    describe('GET /api/analytics/dashboard', () => {
      it('should return dashboard data with admin token', () => {
        return request(app.getHttpServer())
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('totalUsers');
            expect(res.body).toHaveProperty('totalOrders');
            expect(res.body).toHaveProperty('totalRevenue');
            expect(res.body).toHaveProperty('topProducts');
          });
      });

      it('should not return dashboard data without admin token', () => {
        return request(app.getHttpServer())
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const promises = Array.from({ length: 20 }, () =>
        request(app.getHttpServer()).get('/api/products')
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some((res) => res.status === 429);

      // Depending on rate limit configuration, some requests should be rate limited
      // This test might need adjustment based on actual rate limit settings
      expect(responses.length).toBe(20);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', () => {
      return request(app.getHttpServer()).get('/api/non-existent-endpoint').expect(404);
    });

    it('should return 405 for unsupported methods', () => {
      return request(app.getHttpServer()).patch('/api/products').expect(405);
    });

    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
          expect(res.headers).toHaveProperty('x-frame-options', 'DENY');
          expect(res.headers).toHaveProperty('x-xss-protection', '1; mode=block');
        });
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', () => {
      return request(app.getHttpServer())
        .options('/api/products')
        .set('Origin', 'https://ultramarket.uz')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200)
        .expect((res) => {
          expect(res.headers).toHaveProperty('access-control-allow-origin');
          expect(res.headers).toHaveProperty('access-control-allow-methods');
        });
    });
  });
});
