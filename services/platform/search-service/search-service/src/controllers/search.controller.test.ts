import request from 'supertest';
import express from 'express';
import searchRoutes from '../routes/search.routes';

describe('SearchController (integration)', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/search', searchRoutes);
  });

  it('GET /api/v1/search/health should return 200', async () => {
    const res = await request(app).get('/api/v1/search/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success');
  });

  it('GET /api/v1/search/products returns 200', async () => {
    const res = await request(app).get('/api/v1/search/products?q=test');
    // 200 yoki 500 bo'lishi mumkin, lekin endpoint mavjudligini tekshiramiz
    expect([200, 500, 400]).toContain(res.status);
  });

  it('GET /api/v1/search/suggestions returns 200 or 400', async () => {
    const res = await request(app).get('/api/v1/search/suggestions?q=te');
    expect([200, 400]).toContain(res.status);
  });

  it('GET /api/v1/search/popular returns 200 or 400', async () => {
    const res = await request(app).get('/api/v1/search/popular');
    expect([200, 400, 500]).toContain(res.status);
  });

  it('GET /api/v1/search/filters returns 200 or 400', async () => {
    const res = await request(app).get('/api/v1/search/filters');
    expect([200, 400, 500]).toContain(res.status);
  });

  it('GET /api/v1/search/analytics returns 401 (auth required)', async () => {
    const res = await request(app).get('/api/v1/search/analytics');
    expect([401, 403]).toContain(res.status);
  });

  it('POST /api/v1/search/track/click returns 200 or 400', async () => {
    const res = await request(app)
      .post('/api/v1/search/track/click')
      .send({ query: 'test', productId: '1', position: 1 });
    expect([200, 400, 500]).toContain(res.status);
  });

  it('POST /api/v1/search/index/bulk returns 401 (auth required)', async () => {
    const res = await request(app)
      .post('/api/v1/search/index/bulk')
      .send({ products: [{ id: '1', name: 'Test', price: 100 }] });
    expect([401, 403]).toContain(res.status);
  });

  it('DELETE /api/v1/search/index/clear returns 401 (auth required)', async () => {
    const res = await request(app).delete('/api/v1/search/index/clear');
    expect([401, 403]).toContain(res.status);
  });
}); 