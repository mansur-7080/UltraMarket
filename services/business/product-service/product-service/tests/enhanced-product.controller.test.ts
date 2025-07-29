import { Request, Response } from 'express';
import { ProductController } from '../src/controllers/enhanced-product.controller';
import { EnhancedProductService } from '../src/services/enhanced-product-service-optimized';
import { ProductError } from '../src/services/enhanced-product-service-optimized';

// Mock EnhancedProductService
jest.mock('../src/services/enhanced-product-service-optimized');
const MockEnhancedProductService = EnhancedProductService as jest.MockedClass<
  typeof EnhancedProductService
>;

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn().mockReturnThis(),
  param: jest.fn().mockReturnThis(),
  query: jest.fn().mockReturnThis(),
  validationResult: jest.fn().mockReturnValue({
    isEmpty: jest.fn().mockReturnValue(true),
    array: jest.fn().mockReturnValue([]),
  }),
  isIn: jest.fn().mockReturnThis(),
  isUUID: jest.fn().mockReturnThis(),
  isString: jest.fn().mockReturnThis(),
  isInt: jest.fn().mockReturnThis(),
  isFloat: jest.fn().mockReturnThis(),
  isBoolean: jest.fn().mockReturnThis(),
  isObject: jest.fn().mockReturnThis(),
  isArray: jest.fn().mockReturnThis(),
  optional: jest.fn().mockReturnThis(),
  notEmpty: jest.fn().mockReturnThis(),
  withMessage: jest.fn().mockReturnThis(),
  toInt: jest.fn().mockReturnThis(),
  toFloat: jest.fn().mockReturnThis(),
  toBoolean: jest.fn().mockReturnThis(),
}));

describe('ProductController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockProductService: jest.Mocked<EnhancedProductService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock request
    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    // Mock product service instance
    mockProductService = MockEnhancedProductService.mock
      .instances[0] as jest.Mocked<EnhancedProductService>;
  });

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      // Arrange
      const mockProducts = [
        { id: '1', name: 'Test Product 1' },
        { id: '2', name: 'Test Product 2' },
      ];

      mockProductService.getProducts = jest.fn().mockResolvedValue({
        products: mockProducts,
        totalCount: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      // Act
      await ProductController.getProducts[ProductController.getProducts.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
        totalCount: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle filters correctly', async () => {
      // Arrange
      mockRequest.query = {
        page: '1',
        limit: '10',
        categoryId: 'test-category',
        minPrice: '10',
        maxPrice: '100',
        isActive: 'true',
      };

      mockProductService.getProducts = jest.fn().mockResolvedValue({
        products: [],
        totalCount: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      // Act
      await ProductController.getProducts[ProductController.getProducts.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          filters: expect.objectContaining({
            categoryId: 'test-category',
            minPrice: 10,
            maxPrice: 100,
            isActive: true,
          }),
        })
      );
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      // Arrange
      const mockProduct = { id: '1', name: 'Test Product' };
      mockRequest.params = { id: '1' };
      mockProductService.getProductById = jest.fn().mockResolvedValue(mockProduct);

      // Act
      await ProductController.getProductById[ProductController.getProductById.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        product: mockProduct,
      });
    });

    it('should handle product not found', async () => {
      // Arrange
      const mockNext = jest.fn();
      mockRequest.params = { id: 'non-existent' };
      mockProductService.getProductById = jest
        .fn()
        .mockRejectedValue(new ProductError('Product not found', 'PRODUCT_NOT_FOUND', 404));

      // Act
      await ProductController.getProductById[ProductController.getProductById.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createProduct', () => {
    it('should create and return product', async () => {
      // Arrange
      const mockProductData = {
        name: 'New Product',
        description: 'Product description',
        sku: 'NPD-001',
        price: 99.99,
        categoryId: 'category-1',
      };

      const mockCreatedProduct = {
        id: 'new-id',
        ...mockProductData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRequest.body = mockProductData;
      mockProductService.createProduct = jest.fn().mockResolvedValue(mockCreatedProduct);

      // Act
      await ProductController.createProduct[ProductController.createProduct.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        product: mockCreatedProduct,
      });
    });
  });
});
