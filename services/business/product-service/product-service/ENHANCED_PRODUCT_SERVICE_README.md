# Enhanced Product Service

This service implements a high-performance optimized product service for the UltraMarket platform. It leverages SQL queries and multi-level caching to deliver exceptional performance for product catalog operations.

## Features

- Optimized SQL queries for maximum performance
- Two-tier caching strategy (LRU in-memory + Redis)
- Comprehensive error handling
- Complete TypeScript type safety
- Support for complex product filtering and search
- RESTful API with validation and security

## Architecture

The Enhanced Product Service follows a clean architecture pattern:

1. **Controller Layer**: Handles HTTP requests/responses and validation
2. **Service Layer**: Contains core business logic and caching
3. **Data Access Layer**: Optimized SQL queries through Prisma

### Key Components

- **EnhancedProductService**: Core service with product operations
- **AdvancedCacheService**: Two-tier caching implementation
- **ProductController**: REST API handling

## API Documentation

See [ENHANCED_PRODUCT_API.md](docs/ENHANCED_PRODUCT_API.md) for comprehensive API documentation.

## Getting Started

```bash
# Install dependencies
cd microservices/business/product-service/product-service
npm install

# Run the service
npm run start:dev

# Test the service
npm test
```

## API Endpoints

- **GET /api/v1/enhanced-products** - List products with filtering and pagination
- **GET /api/v1/enhanced-products/:id** - Get product by ID
- **GET /api/v1/enhanced-products/slug/:slug** - Get product by slug
- **GET /api/v1/enhanced-products/search** - Search products
- **POST /api/v1/enhanced-products** - Create product (admin only)
- **PUT /api/v1/enhanced-products/:id** - Update product (admin only)
- **DELETE /api/v1/enhanced-products/:id** - Delete product (admin only)

## Performance

The Enhanced Product Service is designed for high-performance operations:

- Average response time: <50ms for cached requests
- Throughput: 1000+ requests per second on moderate hardware
- Cache hit ratio: >90% for common operations

## Error Handling

The service implements comprehensive error handling with standardized error codes and messages.

## Security

- All write operations are protected by JWT authentication
- Admin privileges required for product management
- Input validation on all endpoints
- Rate limiting to prevent abuse

## Testing

Run the test suite:

```bash
npm test
```

## Contributing

Please follow the project's coding standards and commit message conventions.
