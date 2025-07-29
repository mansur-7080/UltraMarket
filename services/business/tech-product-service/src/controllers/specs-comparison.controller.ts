import { Request, Response } from 'express';

export class SpecsComparisonController {
  static async compareProducts(req: Request, res: Response) {
    try {
      const { productIds } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'At least 2 product IDs required for comparison',
        });
      }

      // Mock product comparison data
      const comparison = {
        products: productIds.map((id: string, index: number) => ({
          id,
          name: `Product ${index + 1}`,
          brand: index === 0 ? 'Intel' : 'AMD',
          category: 'cpu',
          price: 3000000 + index * 200000,
          image: `/images/products/product-${id}.jpg`,
          specifications: {
            cores: 6 + index * 2,
            threads: 12 + index * 4,
            baseClock: `${3.5 + index * 0.2} GHz`,
            boostClock: `${5.0 + index * 0.3} GHz`,
            cache: `${24 + index * 8}MB`,
            tdp: 125 + index * 20,
            socket: index === 0 ? 'LGA1700' : 'AM5',
          },
        })),
        comparisonMatrix: [
          {
            specName: 'Cores',
            specNameUz: 'Yadrolar',
            unit: '',
            values: productIds.map((id: string, index: number) => ({
              productId: id,
              value: 6 + index * 2,
              isBest: index === productIds.length - 1,
              isWorst: index === 0,
            })),
          },
          {
            specName: 'Threads',
            specNameUz: 'Oqimlar',
            unit: '',
            values: productIds.map((id: string, index: number) => ({
              productId: id,
              value: 12 + index * 4,
              isBest: index === productIds.length - 1,
              isWorst: index === 0,
            })),
          },
          {
            specName: 'Base Clock',
            specNameUz: 'Bazaviy chastota',
            unit: 'GHz',
            values: productIds.map((id: string, index: number) => ({
              productId: id,
              value: 3.5 + index * 0.2,
              formattedValue: `${3.5 + index * 0.2} GHz`,
              isBest: index === productIds.length - 1,
              isWorst: index === 0,
            })),
          },
          {
            specName: 'Price',
            specNameUz: 'Narx',
            unit: 'UZS',
            values: productIds.map((id: string, index: number) => ({
              productId: id,
              value: 3000000 + index * 200000,
              formattedValue: `${(3000000 + index * 200000).toLocaleString()} so'm`,
              isBest: index === 0,
              isWorst: index === productIds.length - 1,
            })),
          },
        ],
        recommendations: productIds.map((id: string, index: number) => ({
          productId: id,
          score: 85 - index * 5,
          bestFor: index === 0 ? 'Budget gaming' : 'High-end performance',
          bestForUz: index === 0 ? 'Arzon gaming' : 'Yuqori unumdorlik',
          strongPoints: [
            index === 0 ? 'Better value' : 'Higher performance',
            index === 0 ? 'Lower power consumption' : 'More cores',
          ],
          strongPointsUz: [
            index === 0 ? 'Yaxshi narx-sifat nisbati' : 'Yuqori unumdorlik',
            index === 0 ? "Kam quvvat iste'moli" : "Ko'proq yadrolar",
          ],
          weakPoints: [
            index === 0 ? 'Lower performance' : 'Higher price',
            index === 0 ? 'Fewer cores' : 'Higher power consumption',
          ],
        })),
        summary: {
          totalProducts: productIds.length,
          priceRange: {
            min: 3000000,
            max: 3000000 + (productIds.length - 1) * 200000,
          },
          performanceRange: {
            min: 85 - (productIds.length - 1) * 5,
            max: 85,
          },
        },
      };

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Comparison failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getComparableProducts(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { priceRange, brand, featured } = req.query;

      // Mock comparable products for category
      let products: any[] = [];

      switch (category) {
        case 'cpu':
          products = [
            {
              id: 'intel-i5-13600k',
              name: 'Intel Core i5-13600K',
              brand: 'Intel',
              price: 3200000,
              image: '/images/products/intel-i5-13600k.jpg',
              keySpecs: {
                cores: 14,
                threads: 20,
                baseClock: '3.5 GHz',
                socket: 'LGA1700',
              },
              rating: 4.8,
              isPopular: true,
            },
            {
              id: 'amd-ryzen5-7600x',
              name: 'AMD Ryzen 5 7600X',
              brand: 'AMD',
              price: 2800000,
              image: '/images/products/amd-ryzen5-7600x.jpg',
              keySpecs: {
                cores: 6,
                threads: 12,
                baseClock: '4.7 GHz',
                socket: 'AM5',
              },
              rating: 4.6,
              isPopular: true,
            },
            {
              id: 'intel-i7-13700k',
              name: 'Intel Core i7-13700K',
              brand: 'Intel',
              price: 4200000,
              image: '/images/products/intel-i7-13700k.jpg',
              keySpecs: {
                cores: 16,
                threads: 24,
                baseClock: '3.4 GHz',
                socket: 'LGA1700',
              },
              rating: 4.9,
              isPopular: false,
            },
          ];
          break;

        case 'gpu':
          products = [
            {
              id: 'rtx-4060',
              name: 'NVIDIA GeForce RTX 4060',
              brand: 'NVIDIA',
              price: 3800000,
              image: '/images/products/rtx-4060.jpg',
              keySpecs: {
                memory: '8GB GDDR6',
                coreClock: '1830 MHz',
                powerConsumption: '115W',
              },
              rating: 4.6,
              isPopular: true,
            },
            {
              id: 'rtx-4070',
              name: 'NVIDIA GeForce RTX 4070',
              brand: 'NVIDIA',
              price: 5500000,
              image: '/images/products/rtx-4070.jpg',
              keySpecs: {
                memory: '12GB GDDR6X',
                coreClock: '1920 MHz',
                powerConsumption: '200W',
              },
              rating: 4.8,
              isPopular: true,
            },
            {
              id: 'rx-7600',
              name: 'AMD Radeon RX 7600',
              brand: 'AMD',
              price: 3200000,
              image: '/images/products/rx-7600.jpg',
              keySpecs: {
                memory: '8GB GDDR6',
                coreClock: '2250 MHz',
                powerConsumption: '165W',
              },
              rating: 4.4,
              isPopular: false,
            },
          ];
          break;

        default:
          products = [];
      }

      // Apply filters
      if (brand) {
        products = products.filter((p) => p.brand.toLowerCase() === brand.toString().toLowerCase());
      }

      if (priceRange) {
        const [min, max] = priceRange.toString().split('-').map(Number);
        products = products.filter((p) => p.price >= min && p.price <= max);
      }

      if (featured === 'true') {
        products = products.filter((p) => p.isPopular);
      }

      res.json({
        success: true,
        data: products,
        category,
        filters: { priceRange, brand, featured },
        total: products.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch comparable products',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async saveComparison(req: Request, res: Response) {
    try {
      const { userId, comparisonName, productIds, notes } = req.body;

      if (!userId || !comparisonName || !productIds || productIds.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Mock save comparison
      const savedComparison = {
        id: `comparison-${Date.now()}`,
        userId,
        name: comparisonName,
        productIds,
        notes: notes || '',
        productCount: productIds.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: savedComparison,
        message: 'Comparison saved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to save comparison',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getSavedComparisons(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Mock saved comparisons
      const comparisons = [
        {
          id: 'comparison-1',
          name: 'CPU Gaming Comparison',
          nameUz: 'Gaming CPU Taqqoslash',
          productCount: 3,
          products: [
            {
              id: 'intel-i5-13600k',
              name: 'Intel i5-13600K',
              image: '/images/products/intel-i5-13600k.jpg',
            },
            {
              id: 'amd-ryzen5-7600x',
              name: 'AMD Ryzen 5 7600X',
              image: '/images/products/amd-ryzen5-7600x.jpg',
            },
            {
              id: 'intel-i7-13700k',
              name: 'Intel i7-13700K',
              image: '/images/products/intel-i7-13700k.jpg',
            },
          ],
          category: 'cpu',
          notes: 'Comparing for gaming build',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 'comparison-2',
          name: 'GPU Performance Comparison',
          nameUz: 'GPU Unumdorlik Taqqoslash',
          productCount: 2,
          products: [
            { id: 'rtx-4060', name: 'NVIDIA RTX 4060', image: '/images/products/rtx-4060.jpg' },
            { id: 'rtx-4070', name: 'NVIDIA RTX 4070', image: '/images/products/rtx-4070.jpg' },
          ],
          category: 'gpu',
          notes: '1440p gaming comparison',
          createdAt: '2024-01-12T14:20:00Z',
          updatedAt: '2024-01-12T14:20:00Z',
        },
      ];

      // Paginate results
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedComparisons = comparisons.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedComparisons,
        total: comparisons.length,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(comparisons.length / Number(limit)),
        userId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch saved comparisons',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
