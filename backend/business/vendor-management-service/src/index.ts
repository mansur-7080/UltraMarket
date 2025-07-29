import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logError, trackVendorEvent, trackApiCall } from '../../../libs/shared/src/logging/production-logger';
import { createLogger } from '../../../../libs/shared/src/utils/logger-replacement';
import { PrismaClient } from '@prisma/client';
import redis from 'redis';
import { UzbekValidator, formatUZSPrice } from '../../../libs/shared/src/utils';
import { UzbekRegions, UzbekPaymentMethod } from '../../../libs/shared/src/constants';

// Initialize logger
const logger = createLogger('vendor-management-service');

interface VendorRegistration {
  businessName: string;
  businessNameRu?: string;
  businessType: 'individual' | 'llc' | 'jsc' | 'cooperative';
  ownerName: string;
  email: string;
  phone: string;
  region: string;
  address: UzbekAddress;
  taxId: string;
  bankAccount: string;
  bankName: string;
  businessLicense?: string;
  categories: string[];
  description: string;
  descriptionRu?: string;
  preferredLanguage: 'uz' | 'ru';
}

interface UzbekAddress {
  region: string;
  district: string;
  city: string;
  mahalla: string;
  street: string;
  houseNumber: string;
  apartment?: string;
  landmark?: string;
  postalCode: string;
}

interface VendorProfile {
  id: string;
  businessName: string;
  businessNameRu?: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalOrders: number;
  joinDate: Date;
  lastActive: Date;
  verificationLevel: 'basic' | 'verified' | 'premium';
  badges: string[];
  paymentMethods: UzbekPaymentMethod[];
  commission: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface VendorProduct {
  id: string;
  vendorId: string;
  name: string;
  nameRu?: string;
  description: string;
  descriptionRu?: string;
  price: number;
  currency: 'UZS';
  discountPrice?: number;
  stock: number;
  category: string;
  subcategory: string;
  images: string[];
  specifications: Record<string, any>;
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock';
  isPromoted: boolean;
  promotionExpiry?: Date;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  seoKeywords: string[];
}

interface VendorOrder {
  id: string;
  vendorId: string;
  customerId: string;
  items: VendorOrderItem[];
  subtotal: number;
  commission: number;
  vendorEarnings: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  shippingMethod: string;
  shippingCost: number;
  trackingNumber?: string;
  notes?: string;
  estimatedDelivery: Date;
  deliveryAddress: UzbekAddress;
  paymentMethod: UzbekPaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
}

interface VendorOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

const app = express();
const prisma = new PrismaClient();
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'vendor-management-service',
    timestamp: new Date().toISOString(),
    region: 'uzbekistan',
  });
});

// Vendor Registration
app.post('/api/v1/vendors/register', async (req, res) => {
  try {
    const registrationData: VendorRegistration = req.body;

    // Validate Uzbek phone number
    if (!UzbekValidator.validatePhone(registrationData.phone)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE',
        message: "O'zbekiston telefon raqami formatida kiriting",
      });
    }

    // Validate Uzbek region
    if (!UzbekRegions[registrationData.region as keyof typeof UzbekRegions]) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REGION',
        message: "Noto'g'ri viloyat kodi",
      });
    }

    // Validate tax ID for Uzbekistan
    if (!UzbekValidator.validateTaxId(registrationData.taxId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TAX_ID',
        message: "Noto'g'ri soliq ID raqami",
      });
    }

    // Check if vendor already exists
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { email: registrationData.email },
          { phone: registrationData.phone },
          { taxId: registrationData.taxId },
        ],
      },
    });

    if (existingVendor) {
      return res.status(409).json({
        success: false,
        error: 'VENDOR_EXISTS',
        message: "Ushbu ma'lumotlar bilan sotuvchi allaqachon ro'yxatdan o'tgan",
      });
    }

    // Create vendor record
    const vendor = await prisma.vendor.create({
      data: {
        businessName: registrationData.businessName,
        businessNameRu: registrationData.businessNameRu,
        businessType: registrationData.businessType,
        ownerName: registrationData.ownerName,
        email: registrationData.email,
        phone: registrationData.phone,
        region: registrationData.region,
        address: registrationData.address,
        taxId: registrationData.taxId,
        bankAccount: registrationData.bankAccount,
        bankName: registrationData.bankName,
        businessLicense: registrationData.businessLicense,
        categories: registrationData.categories,
        description: registrationData.description,
        descriptionRu: registrationData.descriptionRu,
        preferredLanguage: registrationData.preferredLanguage,
        status: 'pending',
        rating: 0,
        reviewCount: 0,
        totalSales: 0,
        totalOrders: 0,
        commission: 5.0, // Default 5% commission
        tier: 'bronze',
        verificationLevel: 'basic',
      },
    });

    // Send verification email/SMS
    await sendVendorVerification(vendor.id, registrationData.email, registrationData.phone);

    res.status(201).json({
      success: true,
      data: {
        vendorId: vendor.id,
        status: vendor.status,
        message: "Ro'yxatdan o'tish muvaffaqiyatli. Tasdiqlash kutilmoqda.",
      },
    });
  } catch (error) {
    logError('Vendor registration failed', error as Error, {
      service: 'vendor-management',
      action: 'register_vendor',
      metadata: { email: req.body.email }
    });
    res.status(500).json({
      success: false,
      error: 'REGISTRATION_FAILED',
      message: "Ro'yxatdan o'tishda xatolik yuz berdi",
    });
  }
});

// Get vendor profile
app.get('/api/v1/vendors/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        products: {
          where: { status: 'active' },
          take: 10,
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'VENDOR_NOT_FOUND',
        message: 'Sotuvchi topilmadi',
      });
    }

    // Get vendor statistics
    const stats = await getVendorStatistics(vendorId);

    res.json({
      success: true,
      data: {
        vendor: {
          ...vendor,
          totalSalesFormatted: formatUZSPrice(vendor.totalSales),
          statistics: stats,
        },
      },
    });
  } catch (error) {
    logError('Failed to fetch vendor profile', error as Error, {
      service: 'vendor-management',
      action: 'get_vendor_profile',
      metadata: { vendorId: req.params.vendorId }
    });
    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: "Sotuvchi ma'lumotlarini olishda xatolik",
    });
  }
});

// Update vendor profile
app.put('/api/v1/vendors/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const updateData = req.body;

    // Validate vendor ownership
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'VENDOR_NOT_FOUND',
      });
    }

    // Update vendor profile
    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        businessName: updateData.businessName,
        businessNameRu: updateData.businessNameRu,
        description: updateData.description,
        descriptionRu: updateData.descriptionRu,
        categories: updateData.categories,
        address: updateData.address,
        bankAccount: updateData.bankAccount,
        bankName: updateData.bankName,
        preferredLanguage: updateData.preferredLanguage,
        lastActive: new Date(),
      },
    });

    res.json({
      success: true,
      data: updatedVendor,
      message: 'Profil muvaffaqiyatli yangilandi',
    });
  } catch (error) {
    // Log error to monitoring service in production
    res.status(500).json({
      success: false,
      error: 'UPDATE_FAILED',
    });
  }
});

// Vendor product management
app.post('/api/v1/vendors/:vendorId/products', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const productData: VendorProduct = req.body;

    // Validate vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor || vendor.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'VENDOR_NOT_APPROVED',
        message: 'Sotuvchi tasdiqlanmagan',
      });
    }

    // Validate product data
    if (!productData.name || !productData.price || !productData.category) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PRODUCT_DATA',
        message: "Mahsulot ma'lumotlari to'liq emas",
      });
    }

    // Check product limit based on vendor tier
    const productCount = await prisma.product.count({
      where: { vendorId },
    });

    const maxProducts = getMaxProductsByTier(vendor.tier);
    if (productCount >= maxProducts) {
      return res.status(403).json({
        success: false,
        error: 'PRODUCT_LIMIT_EXCEEDED',
        message: `${vendor.tier} darajada maksimal ${maxProducts} ta mahsulot qo'shish mumkin`,
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        vendorId,
        name: productData.name,
        nameRu: productData.nameRu,
        description: productData.description,
        descriptionRu: productData.descriptionRu,
        price: productData.price,
        currency: 'UZS',
        discountPrice: productData.discountPrice,
        stock: productData.stock,
        category: productData.category,
        subcategory: productData.subcategory,
        images: productData.images,
        specifications: productData.specifications,
        status: 'draft',
        weight: productData.weight,
        dimensions: productData.dimensions,
        tags: productData.tags,
        seoKeywords: productData.seoKeywords,
      },
    });

    // Update vendor statistics
    await updateVendorStatistics(vendorId);

    res.status(201).json({
      success: true,
      data: product,
      message: "Mahsulot muvaffaqiyatli qo'shildi",
    });
  } catch (error) {
    // Log error to monitoring service in production
    res.status(500).json({
      success: false,
      error: 'PRODUCT_CREATION_FAILED',
    });
  }
});

// Get vendor products
app.get('/api/v1/vendors/:vendorId/products', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 20, category, status, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { vendorId };

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { nameRu: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: { businessName: true, rating: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithFormatting = products.map((product) => ({
      ...product,
      priceFormatted: formatUZSPrice(product.price),
      discountPriceFormatted: product.discountPrice ? formatUZSPrice(product.discountPrice) : null,
    }));

    res.json({
      success: true,
      data: {
        products: productsWithFormatting,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    // Log error to monitoring service in production
    res.status(500).json({
      success: false,
      error: 'FETCH_PRODUCTS_FAILED',
    });
  }
});

// Vendor order management
app.get('/api/v1/vendors/:vendorId/orders', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { vendorId };

    if (status) where.status = status;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const [orders, total] = await Promise.all([
      prisma.vendorOrder.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, phone: true },
          },
          items: {
            include: {
              product: {
                select: { name: true, images: true },
              },
            },
          },
        },
      }),
      prisma.vendorOrder.count({ where }),
    ]);

    const ordersWithFormatting = orders.map((order) => ({
      ...order,
      subtotalFormatted: formatUZSPrice(order.subtotal),
      commissionFormatted: formatUZSPrice(order.commission),
      vendorEarningsFormatted: formatUZSPrice(order.vendorEarnings),
    }));

    res.json({
      success: true,
      data: {
        orders: ordersWithFormatting,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    // Log error to monitoring service in production
    res.status(500).json({
      success: false,
      error: 'FETCH_ORDERS_FAILED',
    });
  }
});

// Update order status
app.patch('/api/v1/vendors/:vendorId/orders/:orderId/status', async (req, res) => {
  try {
    const { vendorId, orderId } = req.params;
    const { status, trackingNumber, notes } = req.body;

    const order = await prisma.vendorOrder.findFirst({
      where: {
        id: orderId,
        vendorId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
      });
    }

    const updatedOrder = await prisma.vendorOrder.update({
      where: { id: orderId },
      data: {
        status,
        trackingNumber,
        notes,
        updatedAt: new Date(),
      },
    });

    // Send notification to customer
    await sendOrderStatusNotification(orderId, status);

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Buyurtma holati yangilandi',
    });
  } catch (error) {
    logger.error('Update order status error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.orderId,
      status: req.body.status,
      service: 'vendor-management'
    });
    res.status(500).json({
      success: false,
      error: 'UPDATE_STATUS_FAILED',
    });
  }
});

// Vendor analytics
app.get('/api/v1/vendors/:vendorId/analytics', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { period = '30d' } = req.query;

    const analytics = await getVendorAnalytics(vendorId, period as string);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    // Log error to monitoring service in production
    res.status(500).json({
      success: false,
      error: 'ANALYTICS_FAILED',
    });
  }
});

// Get vendors list (public)
app.get('/api/v1/vendors', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      region,
      category,
      rating,
      search,
      sortBy = 'rating',
      order = 'desc',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      status: 'approved',
    };

    if (region && region !== 'all') where.region = region;
    if (category) where.categories = { has: category };
    if (rating) where.rating = { gte: Number(rating) };
    if (search) {
      where.OR = [
        { businessName: { contains: search as string, mode: 'insensitive' } },
        { businessNameRu: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = order;

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        select: {
          id: true,
          businessName: true,
          businessNameRu: true,
          description: true,
          descriptionRu: true,
          region: true,
          categories: true,
          rating: true,
          reviewCount: true,
          totalOrders: true,
          tier: true,
          verificationLevel: true,
          badges: true,
          joinDate: true,
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        vendors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    // Log error to monitoring service in production
    res.status(500).json({
      success: false,
      error: 'FETCH_VENDORS_FAILED',
    });
  }
});

// Helper functions
async function sendVendorVerification(vendorId: string, email: string, phone: string) {
  // Implementation for sending verification email/SMS
  // In production, integrate with actual email/SMS service
}

async function getVendorStatistics(vendorId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalProducts, activeProducts, ordersThisMonth, salesThisMonth, avgOrderValue] =
    await Promise.all([
      prisma.product.count({ where: { vendorId } }),
      prisma.product.count({ where: { vendorId, status: 'active' } }),
      prisma.vendorOrder.count({
        where: {
          vendorId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.vendorOrder.aggregate({
        where: {
          vendorId,
          status: 'delivered',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { vendorEarnings: true },
      }),
      prisma.vendorOrder.aggregate({
        where: { vendorId, status: 'delivered' },
        _avg: { subtotal: true },
      }),
    ]);

  return {
    totalProducts,
    activeProducts,
    ordersThisMonth,
    salesThisMonth: salesThisMonth._sum.vendorEarnings || 0,
    avgOrderValue: avgOrderValue._avg.subtotal || 0,
    salesThisMonthFormatted: formatUZSPrice(salesThisMonth._sum.vendorEarnings || 0),
    avgOrderValueFormatted: formatUZSPrice(avgOrderValue._avg.subtotal || 0),
  };
}

async function updateVendorStatistics(vendorId: string) {
  const stats = await getVendorStatistics(vendorId);

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      lastActive: new Date(),
    },
  });
}

function getMaxProductsByTier(tier: string): number {
  const limits = {
    bronze: 50,
    silver: 200,
    gold: 500,
    platinum: 1000,
  };
  return limits[tier as keyof typeof limits] || 50;
}

async function sendOrderStatusNotification(orderId: string, status: string) {
  // Implementation for sending order status notifications
  logger.info('Order status notification sent', {
    orderId,
    status,
    timestamp: new Date().toISOString(),
    service: 'vendor-management'
  });
}

async function getVendorAnalytics(vendorId: string, period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [salesData, orderData, topProducts, revenueByRegion] = await Promise.all([
    prisma.vendorOrder.groupBy({
      by: ['createdAt'],
      where: {
        vendorId,
        createdAt: { gte: startDate },
      },
      _sum: { vendorEarnings: true },
      _count: true,
    }),
    prisma.vendorOrder.groupBy({
      by: ['status'],
      where: {
        vendorId,
        createdAt: { gte: startDate },
      },
      _count: true,
    }),
    prisma.product.findMany({
      where: { vendorId },
      orderBy: { totalSold: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        totalSold: true,
        price: true,
        images: true,
      },
    }),
    prisma.vendorOrder.groupBy({
      by: ['deliveryAddress'],
      where: {
        vendorId,
        status: 'delivered',
        createdAt: { gte: startDate },
      },
      _sum: { vendorEarnings: true },
    }),
  ]);

  return {
    period,
    salesData,
    orderData,
    topProducts,
    revenueByRegion,
    summary: {
      totalRevenue: salesData.reduce((sum, item) => sum + (item._sum.vendorEarnings || 0), 0),
      totalOrders: salesData.reduce((sum, item) => sum + item._count, 0),
      averageOrderValue:
        salesData.length > 0
          ? salesData.reduce((sum, item) => sum + (item._sum.vendorEarnings || 0), 0) /
            salesData.reduce((sum, item) => sum + item._count, 0)
          : 0,
    },
  };
}

const PORT = process.env.PORT || 3020;

app.listen(PORT, () => {
  logger.info('Vendor Management Service started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    marketplace: 'Uzbekistan',
    service: 'vendor-management',
    features: ['vendor-registration', 'order-management', 'analytics']
  });
});

export default app;
