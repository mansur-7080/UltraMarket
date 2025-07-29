import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3017;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'fraud-detection-service',
    timestamp: new Date().toISOString(),
  });
});

// Fraud detection endpoints
app.post('/api/v1/fraud/check-transaction', (req, res) => {
  const { transactionId, userId, amount, paymentMethod, location } = req.body;
  res.json({
    message: 'Check transaction for fraud',
    data: {
      transactionId,
      riskScore: 0.15, // Low risk (0-1 scale)
      riskLevel: 'low', // low, medium, high
      decision: 'approve', // approve, review, block
      reasons: [],
      confidence: 0.92,
      checkedAt: new Date().toISOString(),
    },
  });
});

app.post('/api/v1/fraud/check-user', (req, res) => {
  const { userId, action, context } = req.body;
  res.json({
    message: `Check user ${userId} for fraud patterns`,
    data: {
      userId,
      riskProfile: 'low',
      behaviorScore: 0.12,
      anomalies: [],
      recommendations: ['continue_monitoring'],
      lastUpdated: new Date().toISOString(),
    },
  });
});

app.get('/api/v1/fraud/alerts', (req, res) => {
  const { status, severity } = req.query;
  res.json({
    message: 'Get fraud alerts',
    data: {
      alerts: [
        {
          id: 'alert_1',
          type: 'suspicious_transaction',
          severity: 'medium',
          userId: 'user_123',
          description: 'Multiple failed payment attempts',
          createdAt: new Date().toISOString(),
          status: 'open',
        },
      ],
      total: 1,
      filters: { status, severity },
    },
  });
});

app.post('/api/v1/fraud/report', (req, res) => {
  const { transactionId, reportType, details } = req.body;
  res.status(201).json({
    message: 'Report fraudulent activity',
    data: {
      reportId: 'report_' + Date.now(),
      transactionId,
      type: reportType,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    },
  });
});

app.get('/api/v1/fraud/statistics', (req, res) => {
  const { period = '7d' } = req.query;
  res.json({
    message: `Get fraud statistics for ${period}`,
    data: {
      period,
      totalTransactions: 10000,
      fraudulentTransactions: 25,
      fraudRate: 0.25,
      blockedAmount: 12500,
      averageRiskScore: 0.08,
      topRiskFactors: ['unusual_location', 'high_amount', 'new_device'],
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`Fraud Detection Service running on port ${PORT}`);
});

export default app;
