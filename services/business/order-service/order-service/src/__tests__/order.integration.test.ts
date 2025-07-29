import request from 'supertest';
import app from '../index';

describe('Order Service Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'order-service',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/v1/orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        userId: 'user-123',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            price: 99.99,
            quantity: 2,
          },
        ],
      };

      const response = await request(app).post('/api/v1/orders').send(orderData).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return error for invalid order data', async () => {
      const invalidOrderData = {
        userId: '',
        items: [],
      };

      const response = await request(app).post('/api/v1/orders').send(invalidOrderData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return 404 for non-existent order', async () => {
      const response = await request(app).get('/api/v1/orders/non-existent-id').expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route').expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Route not found',
        path: '/unknown-route',
      });
    });
  });
});
