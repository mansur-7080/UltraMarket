import { Product, PrismaClient } from '@prisma/client';
import { ProductRepository } from '../repositories/product-repository';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock Prisma Client
jest.mock('../lib/database', () => {
  return {
    __esModule: true,
    default: {
      prisma: mockDeep<PrismaClient>(),
    },
  };
});

// Import database with mocked Prisma client
import db from '../lib/database';
const mockPrisma = db.prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('ProductRepository', () => {
  let productRepository: ProductRepository;

  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    shortDescription: null,
    sku: 'TEST-SKU-001',
    barcode: null,
    brand: 'Test Brand',
    model: null,
    weight: null,
    dimensions: null,
    price: 99.99 as any, // Using 'as any' for Decimal
    comparePrice: null,
    costPrice: null,
    currency: 'USD',
    status: 'ACTIVE' as any, // Using 'as any' for enum
    type: 'PHYSICAL' as any, // Using 'as any' for enum
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isOnSale: false,
    salePercentage: null,
    saleStartDate: null,
    saleEndDate: null,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    tags: [],
    attributes: null,
    specifications: null,
    warranty: null,
    returnPolicy: null,
    shippingInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    categoryId: '1',
    vendorId: '1',
    deletedAt: null,
  };

  beforeEach(() => {
    mockReset(mockPrisma);
    productRepository = new ProductRepository();
  });

  describe('findMany', () => {
    it('should return array of products', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await productRepository.findMany({});

      expect(result).toEqual([mockProduct]);
      expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findUnique', () => {
    it('should return a single product when found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productRepository.findUnique({ where: { id: '1' } });

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const result = await productRepository.findUnique({ where: { id: '999' } });

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new product', async () => {
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const result = await productRepository.create({
        data: {
          name: 'Test Product',
          slug: 'test-product',
          sku: 'TEST-SKU-001',
          price: 99.99 as any,
          category: {
            connect: { id: '1' },
          },
        },
      });

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update and return the product', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      mockPrisma.product.update.mockResolvedValue(updatedProduct as any);

      const result = await productRepository.update({
        where: { id: '1' },
        data: { name: 'Updated Product' },
      });

      expect(result).toEqual(updatedProduct);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Product' },
      });
    });
  });

  describe('delete', () => {
    it('should delete and return the deleted product', async () => {
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const result = await productRepository.delete({
        where: { id: '1' },
      });

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
