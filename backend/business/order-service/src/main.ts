/**
 * 📦 UltraMarket Order Service
 * Professional order management microservice
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import * as crypto from 'crypto';

// ===== ORDER MICROSERVICE =====
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          📦 ULTRA PROFESSIONAL ORDER MICROSERVICE 📦         ║
║                                                               ║
║              Enterprise Order Management System               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

const app = express();
const PORT = process.env['PORT'] || 3004;

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===== MOCK ORDER DATABASE =====
class UltraOrderDB {
  private orders: Map<string, any>;
  private orderMetrics: any;

  constructor() {
    this.orders = new Map();
    this.orderMetrics = {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
    };
    this.initializeMockData();
    console.log('✅ Ultra Order Database initialized');
  }

  private initializeMockData() {
    // Create some sample orders
    for (let i = 1; i <= 50; i++) {
      const order = {
        id: `order_${i}`,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        items: [
          {
            productId: `prod_${Math.floor(Math.random() * 100) + 1}`,
            quantity: Math.floor(Math.random() * 5) + 1,
            price: (Math.random() * 100 + 10).toFixed(2),
          },
        ],
        totalAmount: (Math.random() * 500 + 50).toFixed(2),
        status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 5)],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.orders.set(order.id, order);
      this.updateMetrics(order);
    }
  }

  private updateMetrics(order: any) {
    this.orderMetrics.totalOrders++;
    this.orderMetrics.totalRevenue += parseFloat(order.totalAmount);

    switch (order.status) {
      case 'pending':
        this.orderMetrics.pendingOrders++;
        break;
      case 'delivered':
        this.orderMetrics.completedOrders++;
        break;
      case 'cancelled':
        this.orderMetrics.cancelledOrders++;
        break;
    }

    this.orderMetrics.avgOrderValue = this.orderMetrics.totalRevenue / this.orderMetrics.totalOrders;
  }

  async getAllOrders() {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: string) {
    return this.orders.get(id);
  }

  async createOrder(orderData: any) {
    const order = {
      id: `order_${crypto.randomBytes(8).toString('hex')}`,
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(order.id, order);
    this.updateMetrics(order);
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this.orders.set(id, order);
      return order;
    }
    return null;
  }

  getMetrics() {
    return this.orderMetrics;
  }
}

const orderDB = new UltraOrderDB();

// ===== ROUTES =====

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    service: 'order-microservice',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Get all orders
app.get('/orders', async (_req, res) => {
  try {
    const orders = await orderDB.getAllOrders();
    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Get order by ID
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await orderDB.getOrderById(req.params.id);
    if (order) {
      res.json({
        success: true,
        data: order,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Create new order
app.post('/orders', async (req, res) => {
  try {
    const order = await orderDB.createOrder(req.body);
    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Update order status
app.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderDB.updateOrderStatus(req.params.id, status);
    if (order) {
      res.json({
        success: true,
        data: order,
        message: 'Order status updated successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Get order metrics
app.get('/metrics', (_req, res) => {
  res.json({
    success: true,
    data: orderDB.getMetrics(),
  });
});

// 404 Handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    service: 'order-microservice',
    availableEndpoints: [
      'GET /health',
      'GET /orders',
      'GET /orders/:id',
      'POST /orders',
      'PATCH /orders/:id/status',
      'GET /metrics',
    ],
  });
});

// Error Handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Order service error:', error);
  res.status(500).json({
    success: false,
    error: 'Order service error',
    errorId: crypto.randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
  });
});

// ===== START SERVER =====
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Ultra Professional Order Microservice running on port ${PORT}`);
  console.log(`📦 Service URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🎯 Process ID: ${process.pid}`);
  console.log(`🚀 Enterprise-grade order management ready!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Order Microservice...');
  server.close(() => {
    console.log('✅ Order service shut down complete');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Order Microservice...');
  server.close(() => {
    console.log('✅ Order service shut down complete');
    process.exit(0);
  });
});

export default app; 