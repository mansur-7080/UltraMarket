import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3011;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'shipping-service',
    timestamp: new Date().toISOString(),
  });
});

// Shipping endpoints
app.get('/api/v1/shipping/rates', (req, res) => {
  const { region, weight = 1 } = req.query;
  res.json({
    message: 'Get shipping rates for Uzbekistan',
    data: [
      {
        id: 'express24',
        name: 'Express24',
        price: Number(weight) > 5 ? 25000 : 15000,
        currency: 'UZS',
        days: '1-2',
        logo: '/images/delivery/express24.png',
        regions: ['Toshkent shahri', 'Toshkent viloyati'],
        description: 'Tez yetkazib berish',
      },
      {
        id: 'uzpost',
        name: 'Uzbekiston Post',
        price: Number(weight) > 5 ? 15000 : 10000,
        currency: 'UZS',
        days: '3-5',
        logo: '/images/delivery/uzpost.png',
        regions: ['Barcha viloyatlar'],
        description: 'Davlat pochta xizmati',
      },
      {
        id: 'yandex',
        name: 'Yandex Delivery',
        price: Number(weight) > 5 ? 30000 : 20000,
        currency: 'UZS',
        days: '1-3',
        logo: '/images/delivery/yandex.png',
        regions: ['Toshkent shahri', 'Samarqand'],
        description: 'Tez va ishonchli',
      },
      {
        id: 'local',
        name: 'Mahalliy yetkazib berish',
        price: Number(weight) > 5 ? 12000 : 8000,
        currency: 'UZS',
        days: '2-4',
        logo: '/images/delivery/local.png',
        regions: [(region as string) || 'Toshkent shahri'],
        description: 'Mahalliy kuryer xizmati',
      },
    ],
  });
});

app.post('/api/v1/shipping/calculate', (req, res) => {
  res.json({ message: 'Calculate shipping cost', data: { cost: 9.99, method: 'standard' } });
});

app.get('/api/v1/shipping/track/:trackingNumber', (req, res) => {
  const trackingNumber = req.params.trackingNumber;
  let provider = 'unknown';

  // Determine provider based on tracking number format
  if (trackingNumber.startsWith('EX24')) provider = 'Express24';
  else if (trackingNumber.startsWith('UZ')) provider = 'Uzbekiston Post';
  else if (trackingNumber.startsWith('YD')) provider = 'Yandex Delivery';
  else if (trackingNumber.startsWith('LOC')) provider = 'Mahalliy yetkazib berish';

  res.json({
    message: `Track shipment ${trackingNumber}`,
    data: {
      trackingNumber,
      provider,
      status: 'Yetkazilmoqda',
      location: 'Toshkent tarqatish markazi',
      estimatedDelivery: '2024-01-20',
      history: [
        {
          date: '2024-01-18 09:00',
          status: 'Qabul qilindi',
          location: 'Toshkent',
        },
        {
          date: '2024-01-18 14:30',
          status: 'Tarqatish markazida',
          location: 'Toshkent tarqatish markazi',
        },
        {
          date: '2024-01-19 08:00',
          status: 'Yetkazilmoqda',
          location: "Kuryer qo'lida",
        },
      ],
    },
  });
});

app.post('/api/v1/shipping/create', (req, res) => {
  const { provider = 'express24', orderId, weight, region } = req.body;

  let trackingPrefix = 'ULT';
  switch (provider) {
    case 'express24':
      trackingPrefix = 'EX24';
      break;
    case 'uzpost':
      trackingPrefix = 'UZ';
      break;
    case 'yandex':
      trackingPrefix = 'YD';
      break;
    case 'local':
      trackingPrefix = 'LOC';
      break;
  }

  const trackingNumber = `${trackingPrefix}${Date.now().toString().slice(-8)}`;

  res.status(201).json({
    message: 'Yetkazib berish yaratildi',
    data: {
      trackingNumber,
      provider,
      orderId,
      status: 'created',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      region,
      weight,
    },
  });
});

app.put('/api/v1/shipping/:id/status', (req, res) => {
  res.json({ message: `Update shipment ${req.params.id} status`, data: req.body });
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
  console.log(`Shipping Service running on port ${PORT}`);
});

export default app;
