import { CategoryService } from '../services/category.service';
import { CategoryRepository } from '../repositories/category-repository';
import { AppError } from '../shared';
import { Prisma } from '@prisma/client';
import db from '../lib/database';

// Mock repository
jest.mock('../repositories/category-repository');

// Mock database client
jest.mock('../lib/database', () => ({
  executeWithTransaction: jest.fn(),
  prisma: {
    category: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCategoryRepository = new CategoryRepository() as jest.Mocked<CategoryRepository>;

    // Create the service with mocked repository
    categoryService = new CategoryService();
    (categoryService as any).categoryRepository = mockCategoryRepository;
  });

  describe('getCategories', () => {
    it('should return categories with pagination', async () => {
      // Mock data
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Electronics',
          slug: 'electronics',
          _count: { products: 10 },
        },
        {
          id: 'cat2',
          name: 'Clothing',
          slug: 'clothing',
          _count: { products: 5 },
        },
      ];

      // Setup mocks
      mockCategoryRepository.findMany.mockResolvedValue(mockCategories as any);
      mockCategoryRepository.count.mockResolvedValue(2);

      // Call the service
      const result = await categoryService.getCategories({
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
      expect(mockCategoryRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });
  });

  describe('getCategoryById', () => {
    it('should return a category when found', async () => {
      // Mock data
      const mockCategory = {
        id: 'cat1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic items',
        _count: { products: 10 },
      };

      // Setup mock
      mockCategoryRepository.findUnique.mockResolvedValue(mockCategory as any);

      // Call the service
      const result = await categoryService.getCategoryById('cat1');

      // Assert results
      expect(result).toBeDefined();
      expect(result.id).toBe('cat1');
      expect(result.name).toBe('Electronics');
      expect(result.productCount).toBe(10);

      // Check repository call
      expect(mockCategoryRepository.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat1' },
        include: expect.any(Object),
      });
    });

    it('should throw error when category not found', async () => {
      // Setup mock
      mockCategoryRepository.findUnique.mockResolvedValue(null);

      // Call and assert
      await expect(categoryService.getCategoryById('invalid')).rejects.toThrow(
        new AppError(404, 'Category not found')
      );
    });
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      // Mock data
      const mockCategoryData = {
        name: 'New Category',
        description: 'A new category',
      };

      const mockCreatedCategory = {
        id: 'new-cat-id',
        name: 'New Category',
        slug: 'new-category',
        description: 'A new category',
      };

      // Setup mocks
      mockCategoryRepository.findUnique.mockResolvedValue(null); // No existing category with slug

      // Mock transaction
      (db.executeWithTransaction as jest.Mock).mockImplementation(async (callback) => {
        return mockCreatedCategory;
      });

      // Call the service
      const result = await categoryService.createCategory(mockCategoryData);

      // Assert results
      expect(result).toBeDefined();
      expect(result.id).toBe('new-cat-id');
      expect(result.name).toBe('New Category');
      expect(result.slug).toBe('new-category');
    });
  });

  describe('updateCategory', () => {
    it('should update a category successfully', async () => {
      // Mock data
      const mockCategory = {
        id: 'cat1',
        name: 'Electronics',
        slug: 'electronics',
      };

      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const updatedCategory = {
        id: 'cat1',
        name: 'Updated Category',
        slug: 'electronics',
        description: 'Updated description',
      };

      // Setup mocks
      mockCategoryRepository.findUnique.mockResolvedValue(mockCategory as any);
      mockCategoryRepository.update.mockResolvedValue(updatedCategory as any);

      // Call the service
      const result = await categoryService.updateCategory('cat1', updateData);

      // Assert results
      expect(result).toBeDefined();
      expect(result.id).toBe('cat1');
      expect(result.name).toBe('Updated Category');
      expect(result.description).toBe('Updated description');

      // Check repository calls
      expect(mockCategoryRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cat1' },
          data: expect.objectContaining({
            name: 'Updated Category',
            description: 'Updated description',
          }),
        })
      );
    });

    it('should throw error when category not found', async () => {
      // Setup mock
      mockCategoryRepository.findUnique.mockResolvedValue(null);

      // Call and assert
      await expect(categoryService.updateCategory('invalid', { name: 'Updated' })).rejects.toThrow(
        new AppError(404, 'Category not found')
      );
    });
  });

  describe('deleteCategory', () => {
    it('should throw error when category has products', async () => {
      // Mock data
      const mockCategory = {
        id: 'cat1',
        name: 'Electronics',
        children: [],
        products: [{ id: 'prod1' }], // Has one product
      };

      // Setup mock
      mockCategoryRepository.findUnique.mockResolvedValue(mockCategory as any);

      // Call and assert
      await expect(categoryService.deleteCategory('cat1')).rejects.toThrow(
        new AppError(400, 'Cannot delete category with products')
      );
    });

    it('should throw error when category has child categories', async () => {
      // Mock data
      const mockCategory = {
        id: 'cat1',
        name: 'Electronics',
        children: [{ id: 'cat2', name: 'Computers' }], // Has child categories
        products: [],
      };

      // Setup mock
      mockCategoryRepository.findUnique.mockResolvedValue(mockCategory as any);

      // Call and assert
      await expect(categoryService.deleteCategory('cat1')).rejects.toThrow(
        new AppError(400, 'Cannot delete category with child categories')
      );
    });

    it('should delete category successfully when no products or children', async () => {
      // Mock data
      const mockCategory = {
        id: 'cat1',
        name: 'Electronics',
        children: [],
        products: [],
      };

      // Setup mocks
      mockCategoryRepository.findUnique.mockResolvedValue(mockCategory as any);
      mockCategoryRepository.delete.mockResolvedValue(mockCategory as any);

      // Should not throw
      await expect(categoryService.deleteCategory('cat1')).resolves.not.toThrow();

      // Verify repository was called
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith({
        where: { id: 'cat1' },
      });
    });
  });

  describe('getCategoryTree', () => {
    it('should return category tree structure', async () => {
      // Mock data with hierarchical structure
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Electronics',
          slug: 'electronics',
          children: [
            {
              id: 'cat2',
              name: 'Computers',
              slug: 'computers',
              children: [],
              _count: { products: 5 },
            },
          ],
          _count: { products: 10 },
        },
      ];

      // Setup mock
      mockCategoryRepository.findMany.mockResolvedValue(mockCategories as any);

      // Call the service
      const result = await categoryService.getCategoryTree();

      // Assert results
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cat1');
      expect(result[0].name).toBe('Electronics');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children![0].id).toBe('cat2');
      expect(result[0].children![0].name).toBe('Computers');
    });
  });
});
