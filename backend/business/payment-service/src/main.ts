/**
 * 💳 UltraMarket Payment Service
 * Professional payment processing microservice
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import * as crypto from 'crypto';

// ===== PAYMENT MICROSERVICE =====
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          💳 ULTRA SECURE PAYMENT MICROSERVICE 💳             ║
║                                                               ║
║              Enterprise Payment Processing System             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

const app = express();
const PORT = process.env['PORT'] || 3005;

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===== MOCK PAYMENT DATABASE =====
class UltraPaymentDB {
  private payments: Map<string, any>;
  private paymentMetrics: any;

  constructor() {
    this.payments = new Map();
    this.paymentMetrics = {
      totalPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      pendingPayments: 0,
      totalAmount: 0,
      avgPaymentAmount: 0,
    };
    this.initializeMockData();
    console.log('✅ Ultra Payment Database initialized');
  }

  private initializeMockData() {
    // Create some sample payments
    for (let i = 1; i <= 30; i++) {
      const payment = {
        id: `payment_${i}`,
        orderId: `order_${i}`,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        amount: (Math.random() * 1000 + 50).toFixed(2),
        currency: 'USD',
        method: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 4)],
        status: ['pending', 'processing', 'completed', 'failed', 'refunded'][Math.floor(Math.random() * 5)],
        transactionId: `txn_${crypto.randomBytes(8).toString('hex')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.payments.set(payment.id, payment);
      this.updateMetrics(payment);
    }
  }

  private updateMetrics(payment: any) {
    this.paymentMetrics.totalPayments++;
    this.paymentMetrics.totalAmount += parseFloat(payment.amount);

    switch (payment.status) {
      case 'completed':
        this.paymentMetrics.successfulPayments++;
        break;
      case 'failed':
        this.paymentMetrics.failedPayments++;
        break;
      case 'pending':
        this.paymentMetrics.pendingPayments++;
        break;
    }

    this.paymentMetrics.avgPaymentAmount = this.paymentMetrics.totalAmount / this.paymentMetrics.totalPayments;
  }

  async getAllPayments() {
    return Array.from(this.payments.values());
  }

  async getPaymentById(id: string) {
    return this.payments.get(id);
  }

  async createPayment(paymentData: any) {
    const payment = {
      id: `payment_${crypto.randomBytes(8).toString('hex')}`,
      ...paymentData,
      status: 'pending',
      transactionId: `txn_${crypto.randomBytes(8).toString('hex')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.payments.set(payment.id, payment);
    this.updateMetrics(payment);
    return payment;
  }

  async processPayment(id: string) {
    const payment = this.payments.get(id);
    if (payment) {
      // Simulate payment processing
      const success = Math.random() > 0.1; // 90% success rate
      payment.status = success ? 'completed' : 'failed';
      payment.updatedAt = new Date().toISOString();
      
      this.payments.set(id, payment);
      this.updateMetrics(payment);
      return payment;
    }
    return null;
  }

  async refundPayment(id: string) {
    const payment = this.payments.get(id);
    if (payment && payment.status === 'completed') {
      payment.status = 'refunded';
      payment.updatedAt = new Date().toISOString();
      this.payments.set(id, payment);
      return payment;
    }
    return null;
  }

  getMetrics() {
    return this.paymentMetrics;
  }
}

const paymentDB = new UltraPaymentDB();

// ===== ROUTES =====

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    service: 'payment-microservice',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Get all payments
app.get('/payments', async (_req, res) => {
  try {
    const payments = await paymentDB.getAllPayments();
    res.json({
      success: true,
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Get payment by ID
app.get('/payments/:id', async (req, res) => {
  try {
    const payment = await paymentDB.getPaymentById(req.params.id);
    if (payment) {
      res.json({
        success: true,
        data: payment,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Create new payment
app.post('/payments', async (req, res) => {
  try {
    const payment = await paymentDB.createPayment(req.body);
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create payment',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Process payment
app.post('/payments/:id/process', async (req, res) => {
  try {
    const payment = await paymentDB.processPayment(req.params.id);
    if (payment) {
      res.json({
        success: true,
        data: payment,
        message: `Payment ${payment.status} successfully`,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Refund payment
app.post('/payments/:id/refund', async (req, res) => {
  try {
    const payment = await paymentDB.refundPayment(req.params.id);
    if (payment) {
      res.json({
        success: true,
        data: payment,
        message: 'Payment refunded successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment cannot be refunded',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refund payment',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Get payment metrics
app.get('/metrics', (_req, res) => {
  res.json({
    success: true,
    data: paymentDB.getMetrics(),
  });
});

// 404 Handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    service: 'payment-microservice',
    availableEndpoints: [
      'GET /health',
      'GET /payments',
      'GET /payments/:id',
      'POST /payments',
      'POST /payments/:id/process',
      'POST /payments/:id/refund',
      'GET /metrics',
    ],
  });
});

// Error Handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Payment service error:', error);
  res.status(500).json({
    success: false,
    error: 'Payment service error',
    errorId: crypto.randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
  });
});

// ===== START SERVER =====
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Ultra Secure Payment Microservice running on port ${PORT}`);
  console.log(`💳 Service URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🎯 Process ID: ${process.pid}`);
  console.log(`🚀 Enterprise-grade payment processing ready!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Payment Microservice...');
  server.close(() => {
    console.log('✅ Payment service shut down complete');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Payment Microservice...');
  server.close(() => {
    console.log('✅ Payment service shut down complete');
    process.exit(0);
  });
});

export default app; 