import { Request, Response } from 'express';

export class TechCategoryController {
  static async getCategories(req: Request, res: Response) {
    try {
      // Mock tech categories
      const categories = [
        {
          id: 'computers',
          name: 'Computers',
          nameUz: 'Kompyuterlar',
          nameRu: 'Компьютеры',
          icon: '/icons/computer.svg',
          description: 'Desktop and laptop computers',
          descriptionUz: 'Desktop va laptop kompyuterlar',
          productCount: 450,
          subcategories: [
            {
              id: 'gaming-pc',
              name: 'Gaming PCs',
              nameUz: 'Gaming kompyuterlar',
              productCount: 125,
              averagePrice: 12500000,
            },
            {
              id: 'business-pc',
              name: 'Business PCs',
              nameUz: 'Biznes kompyuterlar',
              productCount: 180,
              averagePrice: 7500000,
            },
            {
              id: 'laptops',
              name: 'Laptops',
              nameUz: 'Noutbuklar',
              productCount: 145,
              averagePrice: 8500000,
            },
          ],
          popularBrands: ['ASUS', 'HP', 'Dell', 'Lenovo'],
          priceRange: { min: 3000000, max: 25000000 },
        },
        {
          id: 'components',
          name: 'Components',
          nameUz: 'Komponentlar',
          nameRu: 'Компоненты',
          icon: '/icons/components.svg',
          description: 'PC parts and components',
          descriptionUz: 'PC qismlari va komponentlari',
          productCount: 850,
          subcategories: [
            {
              id: 'cpu',
              name: 'Processors',
              nameUz: 'Protsessorlar',
              productCount: 125,
              averagePrice: 3500000,
            },
            {
              id: 'gpu',
              name: 'Graphics Cards',
              nameUz: 'Videokartalar',
              productCount: 95,
              averagePrice: 4500000,
            },
            {
              id: 'motherboard',
              name: 'Motherboards',
              nameUz: 'Motherboardlar',
              productCount: 180,
              averagePrice: 2200000,
            },
            {
              id: 'ram',
              name: 'Memory',
              nameUz: 'Xotira',
              productCount: 150,
              averagePrice: 1200000,
            },
            {
              id: 'storage',
              name: 'Storage',
              nameUz: 'Saqlash qurilmalari',
              productCount: 200,
              averagePrice: 800000,
            },
            {
              id: 'psu',
              name: 'Power Supplies',
              nameUz: 'Quvvat manbalari',
              productCount: 100,
              averagePrice: 1000000,
            },
          ],
          popularBrands: ['Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI'],
          priceRange: { min: 300000, max: 15000000 },
        },
        {
          id: 'peripherals',
          name: 'Peripherals',
          nameUz: 'Periferiya',
          nameRu: 'Периферия',
          icon: '/icons/peripherals.svg',
          description: 'Monitors, keyboards, mice and accessories',
          descriptionUz: 'Monitorlar, klaviaturalar, sichqonchalar va aksessuarlar',
          productCount: 680,
          subcategories: [
            {
              id: 'monitors',
              name: 'Monitors',
              nameUz: 'Monitorlar',
              productCount: 220,
              averagePrice: 3200000,
            },
            {
              id: 'keyboards',
              name: 'Keyboards',
              nameUz: 'Klaviaturalar',
              productCount: 150,
              averagePrice: 650000,
            },
            {
              id: 'mice',
              name: 'Mice',
              nameUz: 'Sichqonchalar',
              productCount: 120,
              averagePrice: 450000,
            },
            {
              id: 'audio',
              name: 'Audio',
              nameUz: 'Audio qurilmalar',
              productCount: 190,
              averagePrice: 850000,
            },
          ],
          popularBrands: ['Samsung', 'LG', 'ASUS', 'Corsair', 'Logitech'],
          priceRange: { min: 150000, max: 8000000 },
        },
        {
          id: 'smartphones',
          name: 'Smartphones',
          nameUz: 'Smartfonlar',
          nameRu: 'Смартфоны',
          icon: '/icons/smartphone.svg',
          description: 'Mobile phones and accessories',
          descriptionUz: 'Mobil telefonlar va aksessuarlar',
          productCount: 320,
          subcategories: [
            {
              id: 'android',
              name: 'Android Phones',
              nameUz: 'Android telefonlar',
              productCount: 200,
              averagePrice: 4500000,
            },
            {
              id: 'iphones',
              name: 'iPhones',
              nameUz: "iPhone'lar",
              productCount: 45,
              averagePrice: 12000000,
            },
            {
              id: 'accessories',
              name: 'Accessories',
              nameUz: 'Aksessuarlar',
              productCount: 75,
              averagePrice: 350000,
            },
          ],
          popularBrands: ['Samsung', 'Apple', 'Xiaomi', 'OPPO', 'Vivo'],
          priceRange: { min: 1500000, max: 20000000 },
        },
      ];

      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getCategoryProducts(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'popularity',
        sortOrder = 'desc',
        brand,
        priceMin,
        priceMax,
        subcategory,
      } = req.query;

      // Mock products for category
      let products: any[] = [];

      switch (category) {
        case 'cpu':
          products = [
            {
              id: 'intel-i5-13600k',
              name: 'Intel Core i5-13600K',
              brand: 'Intel',
              price: 3200000,
              originalPrice: 3500000,
              discount: 9,
              image: '/images/products/intel-i5-13600k.jpg',
              rating: 4.8,
              reviewCount: 342,
              stock: 15,
              keySpecs: {
                cores: 14,
                threads: 20,
                baseClock: '3.5 GHz',
                socket: 'LGA1700',
              },
              isPopular: true,
              isFeatured: true,
            },
            {
              id: 'amd-ryzen5-7600x',
              name: 'AMD Ryzen 5 7600X',
              brand: 'AMD',
              price: 2800000,
              originalPrice: 2800000,
              discount: 0,
              image: '/images/products/amd-ryzen5-7600x.jpg',
              rating: 4.6,
              reviewCount: 189,
              stock: 22,
              keySpecs: {
                cores: 6,
                threads: 12,
                baseClock: '4.7 GHz',
                socket: 'AM5',
              },
              isPopular: true,
              isFeatured: false,
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
              originalPrice: 4200000,
              discount: 10,
              image: '/images/products/rtx-4060.jpg',
              rating: 4.6,
              reviewCount: 156,
              stock: 8,
              keySpecs: {
                memory: '8GB GDDR6',
                coreClock: '1830 MHz',
                powerConsumption: '115W',
              },
              isPopular: true,
              isFeatured: true,
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

      if (priceMin || priceMax) {
        const min = priceMin ? Number(priceMin) : 0;
        const max = priceMax ? Number(priceMax) : Infinity;
        products = products.filter((p) => p.price >= min && p.price <= max);
      }

      // Apply sorting
      products.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
            break;
          case 'popularity':
            aValue = a.reviewCount;
            bValue = b.reviewCount;
            break;
          case 'newest':
            aValue = a.id; // Mock: newer products have later IDs
            bValue = b.id;
            break;
          default:
            aValue = a.rating;
            bValue = b.rating;
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Paginate
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedProducts = products.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedProducts,
        total: products.length,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(products.length / Number(limit)),
        category,
        filters: { brand, priceMin, priceMax, subcategory },
        sorting: { sortBy, sortOrder },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category products',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getCategoryFilters(req: Request, res: Response) {
    try {
      const { category } = req.params;

      // Mock filters for category
      let filters: any = {};

      switch (category) {
        case 'cpu':
          filters = {
            brands: [
              { name: 'Intel', count: 45, popular: true },
              { name: 'AMD', count: 38, popular: true },
            ],
            priceRanges: [
              { label: 'Under 2M', labelUz: '2M dan kam', min: 0, max: 2000000, count: 15 },
              { label: '2M - 4M', labelUz: '2M - 4M', min: 2000000, max: 4000000, count: 35 },
              { label: '4M - 6M', labelUz: '4M - 6M', min: 4000000, max: 6000000, count: 25 },
              { label: 'Over 6M', labelUz: '6M dan yuqori', min: 6000000, max: null, count: 8 },
            ],
            specifications: {
              socket: [
                { value: 'LGA1700', label: 'LGA1700', count: 42 },
                { value: 'AM5', label: 'AM5', count: 35 },
                { value: 'AM4', label: 'AM4', count: 28 },
              ],
              cores: [
                { value: '4-6', label: '4-6 yadrolar', count: 25 },
                { value: '8-12', label: '8-12 yadrolar', count: 35 },
                { value: '14+', label: '14+ yadrolar', count: 23 },
              ],
              tdp: [
                { value: '65W', label: '65W', count: 18 },
                { value: '125W', label: '125W', count: 42 },
                { value: '170W+', label: '170W+', count: 23 },
              ],
            },
            features: [
              { name: 'Overclockable', nameUz: 'Overclocking', count: 35 },
              { name: 'Integrated Graphics', nameUz: "O'rnatilgan grafika", count: 55 },
              { name: 'Hyperthreading', nameUz: 'Hyperthreading', count: 28 },
            ],
          };
          break;

        case 'gpu':
          filters = {
            brands: [
              { name: 'NVIDIA', count: 52, popular: true },
              { name: 'AMD', count: 35, popular: true },
            ],
            priceRanges: [
              { label: 'Under 3M', labelUz: '3M dan kam', min: 0, max: 3000000, count: 12 },
              { label: '3M - 6M', labelUz: '3M - 6M', min: 3000000, max: 6000000, count: 28 },
              { label: '6M - 10M', labelUz: '6M - 10M', min: 6000000, max: 10000000, count: 25 },
              { label: 'Over 10M', labelUz: '10M dan yuqori', min: 10000000, max: null, count: 22 },
            ],
            specifications: {
              memory: [
                { value: '8GB', label: '8GB', count: 35 },
                { value: '12GB', label: '12GB', count: 28 },
                { value: '16GB+', label: '16GB+', count: 24 },
              ],
              interface: [
                { value: 'PCIe 4.0', label: 'PCIe 4.0', count: 65 },
                { value: 'PCIe 5.0', label: 'PCIe 5.0', count: 22 },
              ],
            },
            features: [
              { name: 'Ray Tracing', nameUz: 'Ray Tracing', count: 45 },
              { name: 'DLSS/FSR', nameUz: 'DLSS/FSR', count: 38 },
              { name: '4K Gaming', nameUz: '4K Gaming', count: 25 },
            ],
          };
          break;

        default:
          filters = {
            brands: [],
            priceRanges: [],
            specifications: {},
            features: [],
          };
      }

      res.json({
        success: true,
        data: filters,
        category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category filters',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getSpecsTemplate(req: Request, res: Response) {
    try {
      const { category } = req.params;

      // Mock specs template for category
      let template: any = {};

      switch (category) {
        case 'cpu':
          template = {
            category: 'cpu',
            requiredSpecs: [
              {
                key: 'brand',
                nameUz: 'Brend',
                type: 'string',
                required: true,
                options: ['Intel', 'AMD'],
              },
              {
                key: 'socket',
                nameUz: 'Socket',
                type: 'string',
                required: true,
                options: ['LGA1700', 'AM5', 'AM4'],
              },
              {
                key: 'cores',
                nameUz: 'Yadrolar soni',
                type: 'number',
                required: true,
                min: 2,
                max: 32,
              },
              {
                key: 'threads',
                nameUz: 'Oqimlar soni',
                type: 'number',
                required: true,
              },
              {
                key: 'baseClock',
                nameUz: 'Bazaviy chastota',
                type: 'string',
                required: true,
                unit: 'GHz',
              },
              {
                key: 'boostClock',
                nameUz: 'Maksimal chastota',
                type: 'string',
                required: false,
                unit: 'GHz',
              },
              {
                key: 'cache',
                nameUz: 'Kesh xotira',
                type: 'string',
                required: true,
                unit: 'MB',
              },
              {
                key: 'tdp',
                nameUz: "Quvvat iste'moli",
                type: 'number',
                required: true,
                unit: 'W',
              },
            ],
            optionalSpecs: [
              {
                key: 'architecture',
                nameUz: 'Arxitektura',
                type: 'string',
              },
              {
                key: 'process',
                nameUz: 'Texnologik jarayon',
                type: 'string',
                unit: 'nm',
              },
              {
                key: 'integratedGraphics',
                nameUz: "O'rnatilgan grafika",
                type: 'string',
              },
            ],
          };
          break;

        case 'gpu':
          template = {
            category: 'gpu',
            requiredSpecs: [
              {
                key: 'brand',
                nameUz: 'Brend',
                type: 'string',
                required: true,
                options: ['NVIDIA', 'AMD'],
              },
              {
                key: 'memory',
                nameUz: 'Video xotira',
                type: 'string',
                required: true,
                unit: 'GB',
              },
              {
                key: 'coreClock',
                nameUz: 'Yadro chastotasi',
                type: 'string',
                required: true,
                unit: 'MHz',
              },
              {
                key: 'boostClock',
                nameUz: 'Boost chastota',
                type: 'string',
                required: false,
                unit: 'MHz',
              },
              {
                key: 'powerConsumption',
                nameUz: "Quvvat iste'moli",
                type: 'number',
                required: true,
                unit: 'W',
              },
            ],
            optionalSpecs: [
              {
                key: 'memoryType',
                nameUz: 'Xotira turi',
                type: 'string',
              },
              {
                key: 'busWidth',
                nameUz: 'Xotira magistrali',
                type: 'string',
                unit: 'bit',
              },
              {
                key: 'outputs',
                nameUz: 'Chiqish portlari',
                type: 'string',
              },
            ],
          };
          break;

        default:
          template = {
            category,
            requiredSpecs: [],
            optionalSpecs: [],
          };
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch specs template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
