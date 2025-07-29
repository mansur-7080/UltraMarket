import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  People,
  LocationOn,
  CreditCard,
  LocalShipping,
  Assessment,
  DateRange,
  Download,
  Refresh,
} from '@mui/icons-material';
import { formatUZSPrice, formatDate } from '../../../libs/shared/src/utils';

interface DashboardData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    activeUsers: number;
    conversionRate: number;
    averageOrderValue: number;
    growth: {
      revenue: number;
      orders: number;
      users: number;
    };
  };
  regions: Array<{
    code: string;
    name: string;
    orders: number;
    revenue: number;
    users: number;
    growthRate: number;
  }>;
  paymentMethods: Array<{
    method: string;
    name: string;
    orders: number;
    revenue: number;
    percentage: number;
    avgProcessingTime: number;
    successRate: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    revenue: number;
    orders: number;
    users: number;
  }>;
  deliveryProviders: Array<{
    provider: string;
    name: string;
    orders: number;
    avgDeliveryTime: number;
    successRate: number;
    cost: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    sold: number;
    revenue: number;
    region: string;
  }>;
  languageUsage: Array<{
    language: string;
    name: string;
    users: number;
    percentage: number;
  }>;
}

const UzbekistanAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState('all');

  // O'zbekiston viloyatlari
  const uzbekRegions = {
    TSH: 'Toshkent',
    SAM: 'Samarqand',
    BUX: 'Buxoro',
    AND: 'Andijon',
    FAR: "Farg'ona",
    NAM: 'Namangan',
    QAS: 'Qashqadaryo',
    SUR: 'Surxondaryo',
    NAV: 'Navoiy',
    JIZ: 'Jizzax',
    SIR: 'Sirdaryo',
    XOR: 'Xorazm',
    QOR: "Qoraqalpog'iston",
  };

  // Colors for charts
  const colors = {
    primary: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    uzbekBlue: '#1e3a8a',
    uzbekGreen: '#065f46',
  };

  const paymentMethodColors = {
    click: '#00bcd4',
    payme: '#4caf50',
    uzcard: '#ff9800',
    humo: '#9c27b0',
    cash_on_delivery: '#607d8b',
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedRegion]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/uzbekistan?range=${dateRange}&region=${selectedRegion}`
      );
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
              // Analytics error should be handled through proper error boundary
      // Mock data for demonstration
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): DashboardData => ({
    overview: {
      totalRevenue: 15420000000, // 15.42 billion UZS
      totalOrders: 12450,
      activeUsers: 8920,
      conversionRate: 3.2,
      averageOrderValue: 1240000, // 1.24 million UZS
      growth: {
        revenue: 24.5,
        orders: 18.2,
        users: 15.8,
      },
    },
    regions: [
      {
        code: 'TSH',
        name: 'Toshkent',
        orders: 4200,
        revenue: 6800000000,
        users: 3200,
        growthRate: 28.5,
      },
      {
        code: 'SAM',
        name: 'Samarqand',
        orders: 1850,
        revenue: 2400000000,
        users: 1400,
        growthRate: 22.1,
      },
      {
        code: 'BUX',
        name: 'Buxoro',
        orders: 980,
        revenue: 1200000000,
        users: 750,
        growthRate: 19.3,
      },
      {
        code: 'AND',
        name: 'Andijon',
        orders: 1200,
        revenue: 1500000000,
        users: 900,
        growthRate: 25.7,
      },
      {
        code: 'FAR',
        name: "Farg'ona",
        orders: 1100,
        revenue: 1350000000,
        users: 820,
        growthRate: 21.4,
      },
      {
        code: 'NAM',
        name: 'Namangan',
        orders: 890,
        revenue: 1100000000,
        users: 680,
        growthRate: 18.9,
      },
    ],
    paymentMethods: [
      {
        method: 'click',
        name: 'Click',
        orders: 4200,
        revenue: 5800000000,
        percentage: 37.6,
        avgProcessingTime: 12,
        successRate: 98.5,
      },
      {
        method: 'payme',
        name: 'Payme',
        orders: 3100,
        revenue: 4200000000,
        percentage: 27.3,
        avgProcessingTime: 15,
        successRate: 97.8,
      },
      {
        method: 'uzcard',
        name: 'Uzcard',
        orders: 2400,
        revenue: 3100000000,
        percentage: 20.1,
        avgProcessingTime: 45,
        successRate: 96.2,
      },
      {
        method: 'humo',
        name: 'Humo',
        orders: 1800,
        revenue: 2200000000,
        percentage: 14.3,
        avgProcessingTime: 50,
        successRate: 95.8,
      },
      {
        method: 'cash_on_delivery',
        name: 'Naqd pul',
        orders: 950,
        revenue: 1120000000,
        percentage: 7.3,
        avgProcessingTime: 0,
        successRate: 92.1,
      },
    ],
    timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 800000000) + 200000000,
      orders: Math.floor(Math.random() * 500) + 100,
      users: Math.floor(Math.random() * 300) + 150,
    })),
    deliveryProviders: [
      {
        provider: 'express24',
        name: 'Express24',
        orders: 5200,
        avgDeliveryTime: 1.2,
        successRate: 96.8,
        cost: 25000,
      },
      {
        provider: 'uzpost',
        name: 'Uzbekiston Post',
        orders: 3100,
        avgDeliveryTime: 2.8,
        successRate: 94.2,
        cost: 18000,
      },
      {
        provider: 'yandex',
        name: 'Yandex Delivery',
        orders: 2400,
        avgDeliveryTime: 1.8,
        successRate: 95.5,
        cost: 30000,
      },
      {
        provider: 'local',
        name: 'Mahalliy',
        orders: 1750,
        avgDeliveryTime: 3.2,
        successRate: 91.8,
        cost: 15000,
      },
    ],
    topProducts: [
      {
        id: '1',
        name: 'iPhone 15 Pro',
        category: 'Elektronika',
        sold: 450,
        revenue: 850000000,
        region: 'TSH',
      },
      {
        id: '2',
        name: 'Samsung Galaxy S24',
        category: 'Elektronika',
        sold: 380,
        revenue: 680000000,
        region: 'TSH',
      },
      {
        id: '3',
        name: 'MacBook Air M2',
        category: 'Kompyuter',
        sold: 220,
        revenue: 620000000,
        region: 'SAM',
      },
      {
        id: '4',
        name: 'Nike Air Max',
        category: 'Kiyim',
        sold: 680,
        revenue: 340000000,
        region: 'BUX',
      },
      {
        id: '5',
        name: 'Sony WH-1000XM5',
        category: 'Aksessuarlar',
        sold: 520,
        revenue: 280000000,
        region: 'AND',
      },
    ],
    languageUsage: [
      { language: 'uz', name: "O'zbekcha", users: 5200, percentage: 58.3 },
      { language: 'ru', name: 'Ruscha', users: 3420, percentage: 38.3 },
      { language: 'en', name: 'Inglizcha', users: 300, percentage: 3.4 },
    ],
  });

  const MetricCard: React.FC<{
    title: string;
    value: string;
    growth?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, growth, icon, color }) => (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {growth !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {growth >= 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={growth >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(growth)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const RegionTable: React.FC = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Viloyat</TableCell>
            <TableCell align="right">Buyurtmalar</TableCell>
            <TableCell align="right">Daromad (UZS)</TableCell>
            <TableCell align="right">Foydalanuvchilar</TableCell>
            <TableCell align="right">O'sish</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.regions.map((region) => (
            <TableRow key={region.code}>
              <TableCell component="th" scope="row">
                <Box display="flex" alignItems="center">
                  <LocationOn fontSize="small" sx={{ mr: 1 }} />
                  {region.name}
                </Box>
              </TableCell>
              <TableCell align="right">{region.orders.toLocaleString()}</TableCell>
              <TableCell align="right">{formatUZSPrice(region.revenue)}</TableCell>
              <TableCell align="right">{region.users.toLocaleString()}</TableCell>
              <TableCell align="right">
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  {region.growthRate >= 0 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                  <Typography
                    variant="body2"
                    color={region.growthRate >= 0 ? 'success.main' : 'error.main'}
                    sx={{ ml: 0.5 }}
                  >
                    {region.growthRate}%
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} align="center">
          O'zbekiston analytics ma'lumotlari yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return <Alert severity="error">Analytics ma'lumotlarini yuklashda xatolik yuz berdi</Alert>;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          O'zbekiston Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <InputLabel>Vaqt oralig'i</InputLabel>
            <Select
              value={dateRange}
              label="Vaqt oralig'i"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="1d">Bugun</MenuItem>
              <MenuItem value="7d">7 kun</MenuItem>
              <MenuItem value="30d">30 kun</MenuItem>
              <MenuItem value="90d">90 kun</MenuItem>
              <MenuItem value="1y">1 yil</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Viloyat</InputLabel>
            <Select
              value={selectedRegion}
              label="Viloyat"
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <MenuItem value="all">Barchasi</MenuItem>
              {Object.entries(uzbekRegions).map(([code, name]) => (
                <MenuItem key={code} value={code}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Ma'lumotlarni yangilash">
            <IconButton onClick={fetchAnalyticsData}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Hisobotni yuklab olish">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Jami Daromad"
            value={formatUZSPrice(data.overview.totalRevenue)}
            growth={data.overview.growth.revenue}
            icon={<AttachMoney style={{ color: colors.success }} />}
            color={colors.success}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Buyurtmalar"
            value={data.overview.totalOrders.toLocaleString()}
            growth={data.overview.growth.orders}
            icon={<ShoppingCart style={{ color: colors.primary }} />}
            color={colors.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Faol Foydalanuvchilar"
            value={data.overview.activeUsers.toLocaleString()}
            growth={data.overview.growth.users}
            icon={<People style={{ color: colors.info }} />}
            color={colors.info}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Konversiya"
            value={`${data.overview.conversionRate}%`}
            icon={<Assessment style={{ color: colors.warning }} />}
            color={colors.warning}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="O'rtacha Buyurtma"
            value={formatUZSPrice(data.overview.averageOrderValue)}
            icon={<TrendingUp style={{ color: colors.uzbekBlue }} />}
            color={colors.uzbekBlue}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Umumiy ko'rinish" />
          <Tab label="Viloyatlar" />
          <Tab label="To'lov usullari" />
          <Tab label="Yetkazib berish" />
          <Tab label="Top mahsulotlar" />
          <Tab label="Til statistikasi" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Revenue Trend */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daromad Tendensiyasi (UZS)
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <ChartTooltip
                      formatter={(value) => [formatUZSPrice(Number(value)), 'Daromad']}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={colors.success}
                      fill={`${colors.success}30`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Methods Distribution */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  To'lov Usullari Taqsimoti
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={data.paymentMethods}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="percentage"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {data.paymentMethods.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            paymentMethodColors[entry.method as keyof typeof paymentMethodColors]
                          }
                        />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Orders by Day */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kunlik Buyurtmalar
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip
                      formatter={(value) => [value, 'Buyurtmalar']}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Bar dataKey="orders" fill={colors.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Viloyatlar bo'yicha Statistika
                </Typography>
                <RegionTable />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Viloyatlar bo'yicha Daromad
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.regions} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}B`}
                    />
                    <YAxis type="category" dataKey="name" />
                    <ChartTooltip
                      formatter={(value) => [formatUZSPrice(Number(value)), 'Daromad']}
                    />
                    <Bar dataKey="revenue" fill={colors.uzbekBlue} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  To'lov Usullari Tahlili
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>To'lov Usuli</TableCell>
                        <TableCell align="right">Buyurtmalar</TableCell>
                        <TableCell align="right">Daromad</TableCell>
                        <TableCell align="right">Ulush (%)</TableCell>
                        <TableCell align="right">Jarayon vaqti (s)</TableCell>
                        <TableCell align="right">Muvaffaqiyat (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.paymentMethods.map((method) => (
                        <TableRow key={method.method}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <CreditCard fontSize="small" sx={{ mr: 1 }} />
                              {method.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{method.orders.toLocaleString()}</TableCell>
                          <TableCell align="right">{formatUZSPrice(method.revenue)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${method.percentage}%`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">{method.avgProcessingTime}</TableCell>
                          <TableCell align="right">
                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                              {method.successRate}%
                              <LinearProgress
                                variant="determinate"
                                value={method.successRate}
                                sx={{ ml: 1, width: 50 }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yetkazib Berish Provayderlar Tahlili
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Provayder</TableCell>
                        <TableCell align="right">Buyurtmalar</TableCell>
                        <TableCell align="right">O'rtacha vaqt (kun)</TableCell>
                        <TableCell align="right">Muvaffaqiyat (%)</TableCell>
                        <TableCell align="right">Narx (UZS)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.deliveryProviders.map((provider) => (
                        <TableRow key={provider.provider}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocalShipping fontSize="small" sx={{ mr: 1 }} />
                              {provider.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{provider.orders.toLocaleString()}</TableCell>
                          <TableCell align="right">{provider.avgDeliveryTime}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${provider.successRate}%`}
                              size="small"
                              color={provider.successRate >= 95 ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">{formatUZSPrice(provider.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Eng Ko'p Sotiladigan Mahsulotlar
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mahsulot</TableCell>
                        <TableCell>Kategoriya</TableCell>
                        <TableCell align="right">Sotildi</TableCell>
                        <TableCell align="right">Daromad</TableCell>
                        <TableCell>Asosiy viloyat</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell component="th" scope="row">
                            {product.name}
                          </TableCell>
                          <TableCell>
                            <Chip label={product.category} size="small" />
                          </TableCell>
                          <TableCell align="right">{product.sold}</TableCell>
                          <TableCell align="right">{formatUZSPrice(product.revenue)}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                              {uzbekRegions[product.region as keyof typeof uzbekRegions]}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Til Tanlovi Statistikasi
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.languageUsage}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="percentage"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {data.languageUsage.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={[colors.uzbekBlue, colors.success, colors.warning][index]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Til bo'yicha Foydalanuvchilar
                </Typography>
                <Box mt={2}>
                  {data.languageUsage.map((lang, index) => (
                    <Box key={lang.language} mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{lang.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {lang.users.toLocaleString()} ({lang.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={lang.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: [colors.uzbekBlue, colors.success, colors.warning][
                              index
                            ],
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default UzbekistanAnalytics;
