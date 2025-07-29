/**
 * 🛒 UltraMarket Cart Service
 * Professional shopping cart microservice
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import * as crypto from 'crypto';

// ===== CART MICROSERVICE =====
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          🛒 ULTRA PROFESSIONAL CART MICROSERVICE 🛒          ║
║                                                               ║
║              Enterprise Shopping Cart System                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

const app = express();
const PORT = process.env['PORT'] || 3003;

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===== MOCK CART DATABASE =====
class UltraCartDB {
  private carts: Map<string, any>;
  private cartMetrics: any;

  constructor() {
    this.carts = new Map();
    this.cartMetrics = {
      totalCarts: 0,
      activeCarts: 0,
      abandonedCarts: 0,
      totalItems: 0,
      avgCartValue: 0,
    };
    this.initializeMockData();
    console.log('✅ Ultra Cart Database initialized');
  }

  private initializeMockData() {
    // Create some sample carts
    for (let i = 1; i <= 20; i++) {
      const cart = {
        id: `cart_${i}`,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        items: [
          {
            productId: `prod_${Math.floor(Math.random() * 100) + 1}`,
            name: `Product ${Math.floor(Math.random() * 100) + 1}`,
            quantity: Math.floor(Math.random() * 5) + 1,
            price: (Math.random() * 100 + 10).toFixed(2),
            image: `https://picsum.photos/200/200?random=${i}`,
          },
        ],
        totalAmount: (Math.random() * 500 + 50).toFixed(2),
        itemCount: Math.floor(Math.random() * 5) + 1,
        status: ['active', 'abandoned', 'converted'][Math.floor(Math.random() * 3)],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.carts.set(cart.id, cart);
      this.updateMetrics(cart);
    }
  }

  private updateMetrics(cart: any) {
    this.cartMetrics.totalCarts++;
    this.cartMetrics.totalItems += cart.itemCount;

    switch (cart.status) {
      case 'active':
        this.cartMetrics.activeCarts++;
        break;
      case 'abandoned':
        this.cartMetrics.abandonedCarts++;
        break;
    }

    this.cartMetrics.avgCartValue = parseFloat(cart.totalAmount);
  }

  async getAllCarts() {
    return Array.from(this.carts.values());
  }

  async getCartById(id: string) {
    return this.carts.get(id);
  }

  async getCartByUserId(userId: string) {
    return Array.from(this.carts.values()).find(cart => cart.userId === userId);
  }

  async createCart(cartData: any) {
    const cart = {
      id: `cart_${crypto.randomBytes(8).toString('hex')}`,
      ...cartData,
      items: [],
      totalAmount: '0.00',
      itemCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.carts.set(cart.id, cart);
    this.updateMetrics(cart);
    return cart;
  }

  async addItemToCart(cartId: string, item: any) {
    const cart = this.carts.get(cartId);
    if (cart) {
      const existingItem = cart.items.find((i: any) => i.productId === item.productId);
      
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.items.push(item);
      }

      cart.itemCount = cart.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
      cart.totalAmount = cart.items.reduce((sum: number, i: any) => sum + (parseFloat(i.price) * i.quantity), 0).toFixed(2);
      cart.updatedAt = new Date().toISOString();
      
      this.carts.set(cartId, cart);
      return cart;
    }
    return null;
  }

  async removeItemFromCart(cartId: string, productId: string) {
    const cart = this.carts.get(cartId);
    if (cart) {
      cart.items = cart.items.filter((i: any) => i.productId !== productId);
      cart.itemCount = cart.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
      cart.totalAmount = cart.items.reduce((sum: number, i: any) => sum + (parseFloat(i.price) * i.quantity), 0).toFixed(2);
      cart.updatedAt = new Date().toISOString();
      
      this.carts.set(cartId, cart);
      return cart;
    }
    return null;
  }

  async updateCartStatus(cartId: string, status: string) {
    const cart = this.carts.get(cartId);
    if (cart) {
      cart.status = status;
      cart.updatedAt = new Date().toISOString();
      this.carts.set(cartId, cart);
      return cart;
    }
    return null;
  }

  async clearCart(cartId: string) {
    const cart = this.carts.get(cartId);
    if (cart) {
      cart.items = [];
      cart.itemCount = 0;
      cart.totalAmount = '0.00';
      cart.updatedAt = new Date().toISOString();
      this.carts.set(cartId, cart);
      return cart;
    }
    return null;
  }

  getMetrics() {
    return this.cartMetrics;
  }
}

const cartDB = new UltraCartDB();

// ===== ROUTES =====

// Health Check
app.get('/health', (_req, res) => {
  try {
    const healthStatus = {
      service: 'cart-microservice',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      service: 'cart-microservice',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get all carts
app.get('/carts', async (_req, res) => {
  try {
    const carts = await cartDB.getAllCarts();
    res.json({
      success: true,
      data: carts,
      count: carts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch carts',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Get cart by ID
app.get('/carts/:id', async (req, res) => {
  try {
    const cart = await cartDB.getCartById(req.params.id);
    if (cart) {
      res.json({
        success: true,
        data: cart,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Get cart by user ID
app.get('/carts/user/:userId', async (req, res) => {
  try {
    const cart = await cartDB.getCartByUserId(req.params.userId);
    if (cart) {
      res.json({
        success: true,
        data: cart,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cart not found for user',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user cart',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Create new cart
app.post('/carts', async (req, res) => {
  try {
    const cart = await cartDB.createCart(req.body);
    res.status(201).json({
      success: true,
      data: cart,
      message: 'Cart created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create cart',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Add item to cart
app.post('/carts/:id/items', async (req, res) => {
  try {
    const cart = await cartDB.addItemToCart(req.params.id, req.body);
    if (cart) {
      res.json({
        success: true,
        data: cart,
        message: 'Item added to cart successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Remove item from cart
app.delete('/carts/:id/items/:productId', async (req, res) => {
  try {
    const cart = await cartDB.removeItemFromCart(req.params.id, req.params.productId);
    if (cart) {
      res.json({
        success: true,
        data: cart,
        message: 'Item removed from cart successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Clear cart
app.delete('/carts/:id/items', async (req, res) => {
  try {
    const cart = await cartDB.clearCart(req.params.id);
    if (cart) {
      res.json({
        success: true,
        data: cart,
        message: 'Cart cleared successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Update cart status
app.patch('/carts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const cart = await cartDB.updateCartStatus(req.params.id, status);
    if (cart) {
      res.json({
        success: true,
        data: cart,
        message: 'Cart status updated successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update cart status',
      errorId: crypto.randomBytes(8).toString('hex'),
    });
  }
});

// Get cart metrics
app.get('/metrics', (_req, res) => {
  res.json({
    success: true,
    data: cartDB.getMetrics(),
  });
});

// 404 Handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    service: 'cart-microservice',
    availableEndpoints: [
      'GET /health',
      'GET /carts',
      'GET /carts/:id',
      'GET /carts/user/:userId',
      'POST /carts',
      'POST /carts/:id/items',
      'DELETE /carts/:id/items/:productId',
      'DELETE /carts/:id/items',
      'PATCH /carts/:id/status',
      'GET /metrics',
    ],
  });
});

// Error Handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Cart service error:', error);
  res.status(500).json({
    success: false,
    error: 'Cart service error',
    errorId: crypto.randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
  });
});

// ===== START SERVER =====
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Ultra Professional Cart Microservice running on port ${PORT}`);
  console.log(`🛒 Service URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🎯 Process ID: ${process.pid}`);
  console.log(`🚀 Enterprise-grade shopping cart ready!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Cart Microservice...');
  server.close(() => {
    console.log('✅ Cart service shut down complete');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Cart Microservice...');
  server.close(() => {
    console.log('✅ Cart service shut down complete');
    process.exit(0);
  });
});

export default app; 