import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3014;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'content-service',
    timestamp: new Date().toISOString(),
  });
});

// Content endpoints
app.get('/api/v1/content/pages/:slug', (req, res) => {
  res.json({
    message: `Get page content for ${req.params.slug}`,
    data: {
      slug: req.params.slug,
      title: 'Sample Page',
      content: '<h1>Welcome to UltraMarket</h1>',
      meta: { description: 'Page description', keywords: 'ecommerce, tech' },
    },
  });
});

app.get('/api/v1/content/banners', (req, res) => {
  res.json({
    message: 'Get banners',
    data: [
      { id: 'banner_1', title: 'Summer Sale', image: '/banners/summer.jpg', url: '/sale' },
      { id: 'banner_2', title: 'New Arrivals', image: '/banners/new.jpg', url: '/new' },
    ],
  });
});

app.get('/api/v1/content/blog', (req, res) => {
  res.json({
    message: 'Get blog posts',
    data: [
      {
        id: 'post_1',
        title: 'Tech Trends 2024',
        excerpt: 'Latest trends...',
        publishedAt: new Date(),
      },
      {
        id: 'post_2',
        title: 'Gaming Setup Guide',
        excerpt: 'How to build...',
        publishedAt: new Date(),
      },
    ],
  });
});

app.post('/api/v1/content/pages', (req, res) => {
  res.status(201).json({
    message: 'Create page content',
    data: { id: 'page_' + Date.now(), ...req.body },
  });
});

app.put('/api/v1/content/pages/:id', (req, res) => {
  res.json({
    message: `Update page ${req.params.id}`,
    data: { id: req.params.id, ...req.body },
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
  console.log(`Content Service running on port ${PORT}`);
});

export default app;
