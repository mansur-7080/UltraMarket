import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateToken, requireRole } from '../../../../libs/shared/src/auth/jwt';
import { logError, logInfo, trackApiCall } from '../../../../libs/shared/src/logging/production-logger';
import { env } from '../../../../libs/shared/src/config/env-validator';
import { PrismaClient } from '@prisma/client';
import redis from 'redis';

const app = express();
const PORT = env.PORT || 3023;
const prisma = new PrismaClient();

// Redis client for caching fraud scores and rate limiting
const redisClient = redis.createClient({
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  password: env.REDIS_PASSWORD
});
redisClient.connect();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const fraudLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: 'Too many fraud check requests, please try again later',
  },
});
app.use('/api/', fraudLimiter);

// API timing middleware
app.use('/api/', (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    trackApiCall(req.method, req.path, res.statusCode, duration, {
      service: 'fraud-detection-service',
      userId: (req as any).user?.userId
    });
  });
  
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    
    res.status(200).json({
      status: 'ok',
      service: 'fraud-detection-service',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    logError('Health check failed', error as Error, { service: 'fraud-detection-service' });
    res.status(503).json({
      status: 'error',
      service: 'fraud-detection-service',
      timestamp: new Date().toISOString(),
      database: 'unknown',
      redis: 'unknown'
    });
  }
});

// Fraud detection algorithms
class FraudDetectionEngine {
  // Risk levels
  static readonly RISK_LEVELS = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  };

  // User behavior analysis
  static async analyzeUserBehavior(userId: string): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let riskScore = 0;

    // Get user's order history
    const userOrders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { items: true }
    });

    if (userOrders.length === 0) {
      factors.push('New user with no order history');
      riskScore += 20;
    }

    // Check for unusual order patterns
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOrders = userOrders.filter(order => order.createdAt >= last24h);
    
    if (recentOrders.length > 5) {
      factors.push('Unusually high order frequency (>5 orders in 24h)');
      riskScore += 30;
    }

    // Check for high-value orders
    const avgOrderValue = userOrders.reduce((sum, order) => sum + order.totalAmount, 0) / userOrders.length;
    const highValueOrders = userOrders.filter(order => order.totalAmount > avgOrderValue * 3);
    
    if (highValueOrders.length > userOrders.length * 0.2) {
      factors.push('High proportion of unusually large orders');
      riskScore += 25;
    }

    // Check payment method diversity
    const paymentMethods = new Set(userOrders.map(order => order.paymentMethod));
    if (paymentMethods.size > 3) {
      factors.push('Multiple payment methods used');
      riskScore += 15;
    }

    return { score: Math.min(riskScore, 100), factors };
  }

  // Transaction analysis
  static async analyzeTransaction(transactionData: any): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let riskScore = 0;

    const { amount, paymentMethod, ipAddress, userAgent, deviceFingerprint, items } = transactionData;

    // Amount-based risk
    if (amount > 500000) { // 500,000 UZS
      factors.push('High transaction amount');
      riskScore += 25;
    }

    if (amount > 1000000) { // 1,000,000 UZS
      factors.push('Very high transaction amount');
      riskScore += 40;
    }

    // Payment method risk
    if (paymentMethod === 'BANK_TRANSFER') {
      factors.push('Bank transfer payment method');
      riskScore += 10;
    }

    // IP and device analysis
    if (ipAddress) {
      const ipRisk = await this.analyzeIPAddress(ipAddress);
      if (ipRisk.isVPN || ipRisk.isTor) {
        factors.push('VPN or proxy detected');
        riskScore += 35;
      }
      
      if (ipRisk.isBlacklisted) {
        factors.push('IP address is blacklisted');
        riskScore += 50;
      }
    }

    // Device fingerprint analysis
    if (deviceFingerprint) {
      const deviceRisk = await this.analyzeDevice(deviceFingerprint);
      if (deviceRisk.isEmulator) {
        factors.push('Device emulator detected');
        riskScore += 30;
      }
    }

    // Velocity checks
    const velocityRisk = await this.checkVelocity(transactionData);
    riskScore += velocityRisk.score;
    factors.push(...velocityRisk.factors);

    return { score: Math.min(riskScore, 100), factors };
  }

  // IP address analysis
  static async analyzeIPAddress(ipAddress: string): Promise<any> {
    const cacheKey = `ip_analysis_${ipAddress}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // In production, integrate with IP intelligence services
    const analysis = {
      isVPN: this.isVPNIP(ipAddress),
      isTor: this.isTorIP(ipAddress),
      isBlacklisted: await this.isBlacklistedIP(ipAddress),
      country: this.getIPCountry(ipAddress),
      riskScore: 0
    };

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(analysis));
    
    return analysis;
  }

  // Device analysis
  static async analyzeDevice(fingerprint: string): Promise<any> {
    // Basic device analysis - in production, use advanced device fingerprinting
    return {
      isEmulator: fingerprint.includes('emulator') || fingerprint.includes('simulator'),
      isBot: fingerprint.includes('bot') || fingerprint.includes('crawler'),
      riskScore: 0
    };
  }

  // Velocity checks - multiple transactions in short time
  static async checkVelocity(transactionData: any): Promise<{ score: number; factors: string[] }> {
    const { userId, ipAddress, amount } = transactionData;
    const factors: string[] = [];
    let score = 0;

    const last1Hour = new Date(Date.now() - 60 * 60 * 1000);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check user velocity
    if (userId) {
      const userTransactions1h = await prisma.order.count({
        where: {
          userId,
          createdAt: { gte: last1Hour }
        }
      });

      if (userTransactions1h > 3) {
        factors.push('High user transaction velocity (>3 in 1 hour)');
        score += 25;
      }

      const userTransactions24h = await prisma.order.count({
        where: {
          userId,
          createdAt: { gte: last24Hours }
        }
      });

      if (userTransactions24h > 10) {
        factors.push('Very high user transaction velocity (>10 in 24 hours)');
        score += 35;
      }
    }

    // Check IP velocity
    if (ipAddress) {
      const ipKey = `ip_velocity_${ipAddress}`;
      const ipCount = await redisClient.get(ipKey) || '0';
      
      if (parseInt(ipCount) > 5) {
        factors.push('High IP transaction velocity');
        score += 20;
      }

      // Increment IP counter
      await redisClient.setEx(ipKey, 3600, String(parseInt(ipCount) + 1));
    }

    return { score, factors };
  }

  // ML-based fraud scoring (simplified)
  static calculateMLScore(features: any): number {
    // In production, this would use a trained ML model
    const weights = {
      userAge: -2, // Older users are less risky
      orderCount: -1, // More orders = less risky
      avgOrderValue: 0.5,
      paymentFailures: 3,
      deviceChanges: 2,
      locationChanges: 2.5
    };

    let score = 50; // Base score

    Object.keys(weights).forEach(feature => {
      if (features[feature] !== undefined) {
        score += features[feature] * weights[feature];
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  // Blacklist checks
  static async isBlacklistedIP(ipAddress: string): Promise<boolean> {
    // Check against blacklist database
    const blacklisted = await prisma.blacklistedIP.findFirst({
      where: { ipAddress }
    });
    return !!blacklisted;
  }

  static isVPNIP(ipAddress: string): boolean {
    // Basic VPN detection - in production, use professional services
    const vpnRanges = ['10.', '172.', '192.168.'];
    return vpnRanges.some(range => ipAddress.startsWith(range));
  }

  static isTorIP(ipAddress: string): boolean {
    // Tor exit node detection - in production, use Tor exit node lists
    return false; // Placeholder
  }

  static getIPCountry(ipAddress: string): string {
    // IP geolocation - in production, use GeoIP services
    return 'UZ'; // Default to Uzbekistan
  }

  // Risk level calculation
  static getRiskLevel(score: number): string {
    if (score >= 80) return this.RISK_LEVELS.CRITICAL;
    if (score >= 60) return this.RISK_LEVELS.HIGH;
    if (score >= 40) return this.RISK_LEVELS.MEDIUM;
    return this.RISK_LEVELS.LOW;
  }
}

// Authentication required for all fraud detection endpoints
app.use('/api/v1/fraud', validateToken);

// Real-time fraud analysis endpoint
app.post('/api/v1/fraud/analyze', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const transactionData = req.body;

    // Comprehensive fraud analysis
    const [userBehavior, transactionRisk] = await Promise.all([
      FraudDetectionEngine.analyzeUserBehavior(userId),
      FraudDetectionEngine.analyzeTransaction(transactionData)
    ]);

    // Calculate overall risk score
    const overallScore = Math.round((userBehavior.score * 0.4) + (transactionRisk.score * 0.6));
    const riskLevel = FraudDetectionEngine.getRiskLevel(overallScore);

    // All risk factors
    const allFactors = [...userBehavior.factors, ...transactionRisk.factors];

    // Store fraud check result
    await prisma.fraudCheck.create({
      data: {
        userId,
        transactionData: JSON.stringify(transactionData),
        riskScore: overallScore,
        riskLevel,
        factors: allFactors,
        timestamp: new Date()
      }
    });

    const result = {
      riskScore: overallScore,
      riskLevel,
      recommendation: this.getRecommendation(riskLevel),
      factors: allFactors,
      userBehaviorScore: userBehavior.score,
      transactionRiskScore: transactionRisk.score,
      timestamp: new Date().toISOString()
    };

    // Log high-risk transactions
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      logInfo('High-risk transaction detected', {
        service: 'fraud-detection-service',
        action: 'fraud_analysis',
        userId,
        metadata: { riskScore: overallScore, riskLevel }
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Failed to analyze fraud risk', error as Error, {
      service: 'fraud-detection-service',
      action: 'analyze_fraud',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to analyze fraud risk'
    });
  }
});

// Get fraud recommendation based on risk level
function getRecommendation(riskLevel: string): string {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'BLOCK - Transaction should be blocked immediately';
    case 'HIGH':
      return 'MANUAL_REVIEW - Requires manual review before processing';
    case 'MEDIUM':
      return 'ADDITIONAL_VERIFICATION - Request additional verification';
    case 'LOW':
    default:
      return 'APPROVE - Transaction can be processed normally';
  }
}

// Blacklist management endpoints (Admin only)
app.post('/api/v1/fraud/blacklist/ip', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { ipAddress, reason } = req.body;

    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    await prisma.blacklistedIP.create({
      data: {
        ipAddress,
        reason: reason || 'Manual blacklist',
        addedBy: (req as any).user.userId,
        addedAt: new Date()
      }
    });

    logInfo('IP address blacklisted', {
      service: 'fraud-detection-service',
      action: 'blacklist_ip',
      userId: (req as any).user.userId,
      metadata: { ipAddress, reason }
    });

    res.json({
      success: true,
      message: 'IP address blacklisted successfully'
    });
  } catch (error) {
    logError('Failed to blacklist IP', error as Error, {
      service: 'fraud-detection-service',
      action: 'blacklist_ip',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to blacklist IP address'
    });
  }
});

// Fraud analytics endpoint (Admin/Analyst only)
app.get('/api/v1/fraud/analytics', requireRole(['ADMIN', 'ANALYST']), async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Promise.all([
      // Fraud checks by risk level
      prisma.fraudCheck.groupBy({
        by: ['riskLevel'],
        where: { timestamp: { gte: startDate } },
        _count: { riskLevel: true }
      }),

      // Average risk score over time
      prisma.$queryRaw`
        SELECT DATE(timestamp) as date, AVG(risk_score) as avg_risk_score
        FROM fraud_checks
        WHERE timestamp >= ${startDate}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `,

      // Top risk factors
      prisma.$queryRaw`
        SELECT factor, COUNT(*) as frequency
        FROM (
          SELECT unnest(factors) as factor
          FROM fraud_checks
          WHERE timestamp >= ${startDate}
        ) subquery
        GROUP BY factor
        ORDER BY frequency DESC
        LIMIT 10
      `
    ]);

    res.json({
      success: true,
      data: {
        period,
        riskLevelDistribution: analytics[0],
        riskTrend: analytics[1],
        topRiskFactors: analytics[2],
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logError('Failed to get fraud analytics', error as Error, {
      service: 'fraud-detection-service',
      action: 'get_analytics',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get fraud analytics'
    });
  }
});

// Fraud rule management (Admin only)
app.post('/api/v1/fraud/rules', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, description, conditions, action, priority } = req.body;

    const rule = await prisma.fraudRule.create({
      data: {
        name,
        description,
        conditions: JSON.stringify(conditions),
        action,
        priority: priority || 0,
        isActive: true,
        createdBy: (req as any).user.userId,
        createdAt: new Date()
      }
    });

    logInfo('Fraud rule created', {
      service: 'fraud-detection-service',
      action: 'create_fraud_rule',
      userId: (req as any).user.userId,
      metadata: { ruleId: rule.id, name }
    });

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Fraud rule created successfully'
    });
  } catch (error) {
    logError('Failed to create fraud rule', error as Error, {
      service: 'fraud-detection-service',
      action: 'create_fraud_rule',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create fraud rule'
    });
  }
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Unhandled fraud detection service error', error, {
    service: 'fraud-detection-service',
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Fraud detection endpoint not found',
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Fraud detection service shutting down gracefully', { service: 'fraud-detection-service' });
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logInfo('Fraud detection service shutting down gracefully', { service: 'fraud-detection-service' });
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  logInfo(`Fraud detection service running on port ${PORT}`, {
    service: 'fraud-detection-service',
    port: PORT,
    environment: env.NODE_ENV
  });
});