# Enhanced Product Service Implementation Guide

This document provides a guide to the Enhanced Product Service implementation, explaining its features, patterns, and how to use it in your UltraMarket application.

## Overview

The Enhanced Product Service provides a professional, robust implementation for product management in the UltraMarket e-commerce platform. It implements several enterprise patterns and practices:

- **Repository Pattern**: Separates data access from business logic
- **Caching Strategy**: Multi-layer caching for performance optimization
- **Validation**: Comprehensive input validation
- **Error Handling**: Structured error types with descriptive messages
- **Monitoring**: Performance logging and metrics
- **Resilience**: Transaction support for data consistency

## Files Structure

```
src/
├── services/
│   ├── enhanced-product.service.ts    # Main service implementation
│   ├── demo-product-service.ts        # Demo implementation with mocks
│   ├── demo-example.ts                # Usage examples
│   └── README.md                      # Service documentation
├── repositories/
│   └── product.repository.ts          # Data access layer
├── utils/
│   ├── advanced-cache.service.ts      # Caching implementation
│   ├── validation.ts                  # Validation utilities
│   └── logger.ts                      # Logging utilities
└── lib/
    └── prisma.ts                      # Database client configuration
```

## Implementation Details

### Service Interface

The Enhanced Product Service provides these core operations:

- `createProduct`: Create a new product with validation
- `getProductById`: Retrieve a product by ID with caching
- `getProducts`: List products with filtering, sorting, and pagination
- `updateProduct`: Update a product with validation
- `deleteProduct`: Soft delete a product
- `permanentlyDeleteProduct`: Hard delete a product
- `bulkUpdateStock`: Update stock levels for multiple products
- `searchProducts`: Full-text search for products
- `getFeaturedProducts`: Get featured products (optionally filtered by category)
- `getRelatedProducts`: Get products related to a specific product
- `getProductByField`: Get a product by a custom field (e.g., slug)
- `checkLowStockProducts`: Check for products with stock below threshold

### Key Features

#### 1. Multi-Level Caching

The service integrates with the Advanced Cache Service to provide multi-level caching:

- **Memory Cache**: First-level cache for ultra-fast access
- **Redis Cache**: Second-level distributed cache
- **Tag-Based Invalidation**: Invalidate related cache entries
- **Compression**: Automatic compression for large objects
- **Circuit Breaker**: Fallback to memory cache if Redis is down

#### 2. Structured Error Handling

Custom error classes provide detailed information:

- `ProductServiceError`: Base error class
- `ProductNotFoundError`: When a product doesn't exist
- `ProductValidationError`: When validation fails
- `DuplicateProductError`: When a product with the same SKU already exists

#### 3. Comprehensive Validation

The service validates all inputs to ensure data integrity:

- Required fields validation
- Format validation
- Range validation
- Business rules validation

#### 4. Performance Optimizations

- Selective field projection
- Optimized queries with proper indexing
- Bulk operations for efficiency
- Caching of common queries

## Usage Guide

### Basic Usage

```typescript
import { EnhancedProductService } from '../services/enhanced-product.service';
import { AdvancedCacheService } from '../utils/advanced-cache.service';

// Initialize cache service
const cacheService = new AdvancedCacheService('redis://localhost:6379');

// Initialize product service
const productService = new EnhancedProductService(cacheService);

// Create a new product
const newProduct = await productService.createProduct({
  name: 'Premium Wireless Headphones',
  description: 'High-quality noise-cancelling wireless headphones',
  sku: 'HEAD-PREMIUM-001',
  category: 'electronics',
  brand: 'AudioTech',
  price: 249.99,
  stock: 50,
  // ... other fields
});

// Get a product by ID
const product = await productService.getProductById('product-id');

// Update a product
const updatedProduct = await productService.updateProduct('product-id', {
  price: 229.99,
  stock: 45,
});

// List products with filtering
const products = await productService.getProducts({
  page: 1,
  limit: 20,
  filters: {
    category: 'electronics',
    minPrice: 100,
    maxPrice: 300,
    inStock: true,
  },
  sortBy: 'price',
  sortOrder: 'asc',
});
```

### Error Handling

```typescript
import {
  ProductNotFoundError,
  ProductValidationError,
  DuplicateProductError,
} from '../services/enhanced-product.service';

try {
  const product = await productService.getProductById('invalid-id');
} catch (error) {
  if (error instanceof ProductNotFoundError) {
    // Handle not found case
    console.log('Product not found:', error.message);
  } else if (error instanceof ProductValidationError) {
    // Handle validation errors
    console.log('Validation failed:', error.validationErrors);
  } else if (error instanceof DuplicateProductError) {
    // Handle duplicate SKU error
    console.log('Duplicate SKU:', error.sku);
  } else {
    // Handle unexpected errors
    console.error('Service error:', error.message);
  }
}
```

### Bulk Operations

```typescript
// Update stock levels for multiple products
await productService.bulkUpdateStock([
  { productId: 'product1', newStock: 25 },
  { productId: 'product2', newStock: 50 },
  { productId: 'product3', newStock: 0 },
]);
```

## Testing

The service includes a demo implementation that can be used for testing:

```typescript
import {
  EnhancedProductService,
  MockCacheService,
} from '../services/demo-product-service';

// Initialize mock cache service
const mockCache = new MockCacheService();

// Initialize service with mocks
const productService = new EnhancedProductService(mockCache);

// Run demo operations
await productService.getProductById('1'); // Returns mock product
```

## Integration with API Controllers

When integrating with API controllers, follow this pattern:

```typescript
import { Request, Response } from 'express';
import { EnhancedProductService } from '../services/enhanced-product.service';
import {
  ProductNotFoundError,
  ProductValidationError,
} from '../services/enhanced-product.service';

export const getProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const product = await productService.getProductById(productId);

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve product',
    });
  }
};
```

## Best Practices

1. **Always validate inputs**: Use the provided validation functions for all external data
2. **Handle all error types**: Catch and handle all specific error types
3. **Use caching appropriately**: Consider cache TTL based on data volatility
4. **Monitor performance**: Check service logs for slow operations
5. **Optimize queries**: Use selective projection and proper filtering
6. **Clean up resources**: Close connections when the service is no longer needed

## Performance Considerations

- **Cache Invalidation**: Be careful with cache invalidation strategies
- **Bulk Operations**: Use bulk operations for multiple updates
- **Query Optimization**: Only request the fields you need
- **Connection Pooling**: Database connections are pooled for efficiency
- **Monitoring**: Check cache hit rates and operation durations

## Security Considerations

- **Input Validation**: All inputs are validated to prevent injection
- **Data Access Control**: Repository layer enforces access control
- **Error Handling**: Errors don't expose sensitive information
- **Logging**: Sensitive data is masked in logs
