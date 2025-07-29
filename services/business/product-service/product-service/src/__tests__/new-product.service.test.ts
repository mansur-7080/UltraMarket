import { ProductService } from '../services/product.service';
import { ProductRepository } from '../repositories/product-repository';
import { CategoryRepository } from '../repositories/category-repository';
import { AppError } from '../shared';
import { Prisma, PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import db from '../lib/database';

// Mock repositories
jest.mock('../repositories/product-repository');
jest.mock('../repositories/category-repository');

// Mock database client
jest.mock('../lib/database', () => ({
  executeWithTransaction: jest.fn(),
  prisma: {
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock decimal
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  return {
    ...originalModule,
    Prisma: {
      ...originalModule.Prisma,
      Decimal: class {
        private value: number;
        constructor(value: number) {
          this.value = value;
        }
        toString(): string {
          return String(this.value);
        }
      },
    },
  };
});

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;
  let mockDbClient: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProductRepository = new ProductRepository() as jest.Mocked<ProductRepository>;
    mockCategoryRepository = new CategoryRepository() as jest.Mocked<CategoryRepository>;

    // Mock database transaction
    const mockTransaction = jest.fn().mockImplementation(async (callback) => {
      return await callback({ product: { create: jest.fn() } });
    });

    (db.executeWithTransaction as jest.Mock) = mockTransaction;

    // Create the service with mocked repositories
    productService = new ProductService();
    (productService as any).productRepository = mockProductRepository;
    (productService as any).categoryRepository = mockCategoryRepository;
  });

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      // Mock data
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          slug: 'product-1',
          price: new Prisma.Decimal(100),
          category: { id: 'cat1', name: 'Category 1', slug: 'category-1' },
        },
        {
          id: '2',
          name: 'Product 2',
          slug: 'product-2',
          price: new Prisma.Decimal(200),
          category: { id: 'cat2', name: 'Category 2', slug: 'category-2' },
        },
      ];

      // Setup mocks
      mockProductRepository.findMany.mockResolvedValue(mockProducts as any);
      mockProductRepository.count.mockResolvedValue(2);

      // Call the service
      const result = await productService.getProducts({
        page: 1,
        limit: 10,
      });

      // Assert results
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);

      // Check repository calls
      expect(mockProductRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should apply search filters correctly', async () => {
      // Setup mocks
      mockProductRepository.findMany.mockResolvedValue([]);
      mockProductRepository.count.mockResolvedValue(0);

      // Call with search parameters
      await productService.getProducts({
        search: 'test',
        minPrice: 10,
        maxPrice: 100,
        category: 'category-id',
        brand: 'test-brand',
      });

      // Verify search filters are applied
      expect(mockProductRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            categoryId: 'category-id',
            brand: 'test-brand',
            price: { gte: 10, lte: 100 },
            isActive: true,
          }),
        })
      );
    });
  });

  describe('getProductById', () => {
    it('should return a product when found', async () => {
      // Mock data
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        price: new Prisma.Decimal(100),
        category: { id: 'cat1', name: 'Category 1', slug: 'category-1' },
      };

      // Setup mocks
      mockProductRepository.findUnique.mockResolvedValue(mockProduct as any);

      // Call the service
      const result = await productService.getProductById('1');

      // Assert results
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.name).toBe('Test Product');
      expect(result.price).toBe(100);

      // Check repository call
      expect(mockProductRepository.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          category: expect.any(Object),
        }),
      });
    });

    it('should throw error when product not found', async () => {
      // Setup mock to return null (not found)
      mockProductRepository.findUnique.mockResolvedValue(null);

      // Assert that it throws
      await expect(productService.getProductById('non-existent')).rejects.toThrow(
        new AppError(404, 'Product not found')
      );
    });
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      // Mock data
      const mockProductData = {
        name: 'New Product',
        categoryId: 'cat1',
        price: 299.99,
        sku: 'TEST123',
      };

      const mockCreatedProduct = {
        id: 'new-id',
        name: 'New Product',
        slug: 'new-product',
        price: new Prisma.Decimal(299.99),
        sku: 'TEST123',
        category: { id: 'cat1', name: 'Category 1', slug: 'category-1' },
      };

      // Setup mocks
      mockCategoryRepository.findUnique.mockResolvedValue({
        id: 'cat1',
        name: 'Category 1',
      } as any);
      mockProductRepository.findUnique.mockResolvedValue(null); // No existing product with slug

      // Mock transaction
      (db.executeWithTransaction as jest.Mock).mockImplementation(async (callback) => {
        return mockCreatedProduct;
      });

      // Call the service
      const result = await productService.createProduct(mockProductData as any, 'user-id');

      // Assert results
      expect(result).toBeDefined();
      expect(result.id).toBe('new-id');
      expect(result.name).toBe('New Product');
      expect(result.price).toBe(299.99);

      // Verify category was checked
      expect(mockCategoryRepository.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat1' },
      });
    });

    it('should throw error when category not found', async () => {
      // Setup mock to return null (category not found)
      mockCategoryRepository.findUnique.mockResolvedValue(null);

      // Call and assert
      await expect(
        productService.createProduct(
          { name: 'Test', categoryId: 'invalid', price: 100, sku: 'TEST' } as any,
          'user-id'
        )
      ).rejects.toThrow(new AppError(400, 'Category not found'));
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      // Mock data
      const mockProduct = {
        id: '1',
        name: 'Existing Product',
        slug: 'existing-product',
        price: new Prisma.Decimal(100),
        vendorId: 'user-id',
      };

      const updateData = {
        name: 'Updated Product',
        price: 150,
      };

      const updatedProduct = {
        id: '1',
        name: 'Updated Product',
        slug: 'existing-product',
        price: new Prisma.Decimal(150),
        vendorId: 'user-id',
        category: { id: 'cat1', name: 'Category 1', slug: 'category-1' },
      };

      // Setup mocks
      mockProductRepository.findUnique.mockResolvedValue(mockProduct as any);
      mockProductRepository.update.mockResolvedValue(updatedProduct as any);

      // Call the service
      const result = await productService.updateProduct('1', updateData as any, 'user-id');

      // Assert results
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(150);

      // Check repository calls
      expect(mockProductRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            name: 'Updated Product',
          }),
        })
      );
    });

    it('should throw error when product not found', async () => {
      // Setup mock
      mockProductRepository.findUnique.mockResolvedValue(null);

      // Call and assert
      await expect(
        productService.updateProduct('invalid', { name: 'Updated' }, 'user-id')
      ).rejects.toThrow(new AppError(404, 'Product not found'));
    });

    it('should throw error when user does not have permission', async () => {
      // Mock data - product owned by another user
      const mockProduct = {
        id: '1',
        name: 'Existing Product',
        vendorId: 'other-user-id',
      };

      // Setup mock
      mockProductRepository.findUnique.mockResolvedValue(mockProduct as any);

      // Call and assert
      await expect(
        productService.updateProduct('1', { name: 'Updated' }, 'user-id')
      ).rejects.toThrow(new AppError(403, 'You can only update your own products'));
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      // Mock data
      const mockProduct = {
        id: '1',
        name: 'Product to delete',
        vendorId: 'user-id',
      };

      const updatedProduct = {
        id: '1',
        isActive: false,
        status: 'ARCHIVED',
      };

      // Setup mocks
      mockProductRepository.findUnique.mockResolvedValue(mockProduct as any);
      mockProductRepository.update.mockResolvedValue(updatedProduct as any);

      // Call the service
      await productService.deleteProduct('1', 'user-id');

      // Check repository calls
      expect(mockProductRepository.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          isActive: false,
        }),
      });
    });

    it('should throw error when product not found', async () => {
      // Setup mock
      mockProductRepository.findUnique.mockResolvedValue(null);

      // Call and assert
      await expect(productService.deleteProduct('invalid', 'user-id')).rejects.toThrow(
        new AppError(404, 'Product not found')
      );
    });
  });
});
