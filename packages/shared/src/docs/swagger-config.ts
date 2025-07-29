/**
 * Professional Swagger API Documentation Configuration
 * Comprehensive API documentation for UltraMarket microservices
 */

import { Options } from 'swagger-jsdoc';

// =================== SWAGGER CONFIGURATION ===================

/**
 * Base Swagger configuration for all services
 */
export const baseSwaggerConfig: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'UltraMarket API',
      version: '2.0.0',
      description: `
        # UltraMarket Enterprise E-commerce Platform API

        ## Overview
        UltraMarket is a comprehensive e-commerce platform built with microservices architecture.
        This API provides endpoints for managing users, products, orders, payments, and more.

        ## Features
        - 🛡️ JWT-based authentication
        - 🔒 Role-based access control
        - 📊 Real-time analytics
        - 💳 Multiple payment methods
        - 🚚 Advanced shipping options
        - 📱 Mobile-first design
        - 🌐 Uzbek and Russian language support

        ## Architecture
        - **API Gateway**: Kong-based routing and load balancing
        - **Microservices**: Independent, scalable services
        - **Databases**: PostgreSQL, MongoDB, Redis, Elasticsearch
        - **Message Queue**: Apache Kafka for async processing
        - **Monitoring**: Prometheus + Grafana
        - **Deployment**: Docker + Kubernetes

        ## Authentication
        Most endpoints require authentication. Include your JWT token in the Authorization header:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`

        ## Rate Limiting
        - **General API**: 100 requests per 15 minutes
        - **Authentication**: 5 requests per 15 minutes
        - **API Key**: 1000 requests per 15 minutes

        ## Error Handling
        All errors follow a consistent format:
        \`\`\`json
        {
          "success": false,
          "error": "ERROR_CODE",
          "message": "Human readable error message",
          "details": {},
          "timestamp": "2024-01-01T00:00:00.000Z",
          "requestId": "req_123456789"
        }
        \`\`\`

        ## Support
        - **Documentation**: [API Docs](https://docs.ultramarket.com)
        - **Support**: support@ultramarket.com
        - **Status**: [Status Page](https://status.ultramarket.com)
      `,
      contact: {
        name: 'UltraMarket API Support',
        email: 'api-support@ultramarket.com',
        url: 'https://ultramarket.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      termsOfService: 'https://ultramarket.com/terms',
    },
    servers: [
      {
        url: 'https://api.ultramarket.com/v2',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.ultramarket.com/v2',
        description: 'Staging server',
      },
      {
        url: 'http://localhost:3000/v2',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service communication',
        },
        OAuth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.ultramarket.com/oauth/authorize',
              tokenUrl: 'https://auth.ultramarket.com/oauth/token',
              scopes: {
                'read:profile': 'Read user profile',
                'write:profile': 'Update user profile',
                'read:orders': 'Read user orders',
                'write:orders': 'Create and update orders',
                'read:products': 'Read product catalog',
                'write:products': 'Manage product catalog',
                'admin:users': 'Manage all users',
                'admin:orders': 'Manage all orders',
                'admin:analytics': 'Access analytics data',
              },
            },
          },
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          required: ['success', 'error', 'message', 'timestamp'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
              description: 'Indicates if the request was successful',
            },
            error: {
              type: 'string',
              example: 'VALIDATION_ERROR',
              description: 'Error code for programmatic handling',
            },
            message: {
              type: 'string',
              example: 'Invalid input data',
              description: 'Human-readable error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              additionalProperties: true,
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
              description: 'Error timestamp',
            },
            requestId: {
              type: 'string',
              example: 'req_123456789',
              description: 'Unique request identifier for tracking',
            },
          },
        },

        Success: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
              description: 'Indicates if the request was successful',
            },
            data: {
              type: 'object',
              description: 'Response data',
              additionalProperties: true,
            },
            meta: {
              type: 'object',
              description: 'Response metadata',
              properties: {
                total: {
                  type: 'integer',
                  description: 'Total number of items',
                },
                page: {
                  type: 'integer',
                  description: 'Current page number',
                },
                limit: {
                  type: 'integer',
                  description: 'Items per page',
                },
                hasMore: {
                  type: 'boolean',
                  description: 'Whether there are more items',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
              description: 'Response timestamp',
            },
          },
        },

        // User schemas
        User: {
          type: 'object',
          required: ['id', 'email', 'firstName', 'lastName', 'role'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique user identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              description: 'User email address',
            },
            username: {
              type: 'string',
              example: 'johndoe',
              description: 'Unique username',
            },
            firstName: {
              type: 'string',
              example: 'John',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
              description: 'User last name',
            },
            phoneNumber: {
              type: 'string',
              example: '+1234567890',
              description: 'User phone number',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              example: '1990-01-01',
              description: 'User date of birth',
            },
            role: {
              type: 'string',
              enum: ['customer', 'admin', 'super_admin', 'moderator'],
              example: 'customer',
              description: 'User role',
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether user account is active',
            },
            isEmailVerified: {
              type: 'boolean',
              example: true,
              description: 'Whether email is verified',
            },
            profileImage: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/avatar.jpg',
              description: 'User profile image URL',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
              description: 'User last update timestamp',
            },
          },
        },

        // Product schemas
        Product: {
          type: 'object',
          required: ['id', 'name', 'price', 'sku', 'categoryId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique product identifier',
            },
            name: {
              type: 'string',
              example: 'Wireless Headphones',
              description: 'Product name',
            },
            description: {
              type: 'string',
              example: 'High-quality wireless headphones with noise cancellation',
              description: 'Product description',
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 299.99,
              description: 'Product price',
            },
            comparePrice: {
              type: 'number',
              format: 'decimal',
              example: 399.99,
              description: 'Compare at price (original price)',
            },
            sku: {
              type: 'string',
              example: 'WH-001',
              description: 'Stock keeping unit',
            },
            barcode: {
              type: 'string',
              example: '1234567890123',
              description: 'Product barcode',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Product category ID',
            },
            brandId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Product brand ID',
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri',
              },
              example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
              description: 'Product images',
            },
            variants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProductVariant',
              },
              description: 'Product variants',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['electronics', 'audio', 'wireless'],
              description: 'Product tags',
            },
            weight: {
              type: 'number',
              example: 0.5,
              description: 'Product weight in kg',
            },
            dimensions: {
              type: 'object',
              properties: {
                length: { type: 'number', example: 20 },
                width: { type: 'number', example: 15 },
                height: { type: 'number', example: 8 },
              },
              description: 'Product dimensions in cm',
            },
            inventory: {
              type: 'object',
              properties: {
                quantity: { type: 'integer', example: 100 },
                lowStockThreshold: { type: 'integer', example: 10 },
                trackQuantity: { type: 'boolean', example: true },
              },
              description: 'Inventory information',
            },
            seo: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Best Wireless Headphones' },
                description: { type: 'string', example: 'Shop the best wireless headphones...' },
                keywords: { type: 'array', items: { type: 'string' } },
              },
              description: 'SEO metadata',
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether product is active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
              description: 'Product creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
              description: 'Product last update timestamp',
            },
          },
        },

        ProductVariant: {
          type: 'object',
          required: ['id', 'name', 'price', 'sku'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique variant identifier',
            },
            name: {
              type: 'string',
              example: 'Black / Large',
              description: 'Variant name',
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 299.99,
              description: 'Variant price',
            },
            sku: {
              type: 'string',
              example: 'WH-001-BLK-L',
              description: 'Variant SKU',
            },
            barcode: {
              type: 'string',
              example: '1234567890124',
              description: 'Variant barcode',
            },
            options: {
              type: 'object',
              properties: {
                color: { type: 'string', example: 'Black' },
                size: { type: 'string', example: 'Large' },
              },
              description: 'Variant options',
            },
            inventory: {
              type: 'object',
              properties: {
                quantity: { type: 'integer', example: 50 },
                reserved: { type: 'integer', example: 5 },
              },
              description: 'Variant inventory',
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether variant is active',
            },
          },
        },

        // Order schemas
        Order: {
          type: 'object',
          required: ['id', 'orderNumber', 'userId', 'status', 'total'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique order identifier',
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-2024-001234',
              description: 'Human-readable order number',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'User who placed the order',
            },
            status: {
              type: 'string',
              enum: [
                'draft',
                'pending',
                'confirmed',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
                'refunded',
              ],
              example: 'confirmed',
              description: 'Order status',
            },
            paymentStatus: {
              type: 'string',
              enum: [
                'pending',
                'paid',
                'partially_paid',
                'failed',
                'refunded',
                'partially_refunded',
              ],
              example: 'paid',
              description: 'Payment status',
            },
            fulfillmentStatus: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
              example: 'processing',
              description: 'Fulfillment status',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
              description: 'Order items',
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
              example: 299.99,
              description: 'Order subtotal',
            },
            tax: {
              type: 'number',
              format: 'decimal',
              example: 24.0,
              description: 'Tax amount',
            },
            shipping: {
              type: 'number',
              format: 'decimal',
              example: 9.99,
              description: 'Shipping cost',
            },
            discount: {
              type: 'number',
              format: 'decimal',
              example: 30.0,
              description: 'Discount amount',
            },
            total: {
              type: 'number',
              format: 'decimal',
              example: 303.98,
              description: 'Order total',
            },
            currency: {
              type: 'string',
              example: 'USD',
              description: 'Order currency',
            },
            shippingAddress: {
              $ref: '#/components/schemas/Address',
              description: 'Shipping address',
            },
            billingAddress: {
              $ref: '#/components/schemas/Address',
              description: 'Billing address',
            },
            notes: {
              type: 'string',
              example: 'Please deliver after 5 PM',
              description: 'Order notes',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
              description: 'Order creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
              description: 'Order last update timestamp',
            },
          },
        },

        OrderItem: {
          type: 'object',
          required: ['id', 'productId', 'name', 'quantity', 'price', 'total'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique order item identifier',
            },
            productId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Product ID',
            },
            variantId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Product variant ID',
            },
            name: {
              type: 'string',
              example: 'Wireless Headphones',
              description: 'Product name at time of order',
            },
            sku: {
              type: 'string',
              example: 'WH-001',
              description: 'Product SKU at time of order',
            },
            quantity: {
              type: 'integer',
              example: 2,
              description: 'Quantity ordered',
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 299.99,
              description: 'Unit price at time of order',
            },
            total: {
              type: 'number',
              format: 'decimal',
              example: 599.98,
              description: 'Total price for this item',
            },
          },
        },

        Address: {
          type: 'object',
          required: ['street1', 'city', 'state', 'postalCode', 'country'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique address identifier',
            },
            type: {
              type: 'string',
              enum: ['home', 'work', 'billing', 'shipping'],
              example: 'home',
              description: 'Address type',
            },
            street1: {
              type: 'string',
              example: '123 Main Street',
              description: 'Primary street address',
            },
            street2: {
              type: 'string',
              example: 'Apt 4B',
              description: 'Secondary street address',
            },
            city: {
              type: 'string',
              example: 'New York',
              description: 'City',
            },
            state: {
              type: 'string',
              example: 'NY',
              description: 'State or province',
            },
            postalCode: {
              type: 'string',
              example: '10001',
              description: 'Postal or ZIP code',
            },
            country: {
              type: 'string',
              example: 'United States',
              description: 'Country',
            },
            isDefault: {
              type: 'boolean',
              example: true,
              description: 'Whether this is the default address',
            },
          },
        },

        // Pagination
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 1000,
              description: 'Total number of items',
            },
            page: {
              type: 'integer',
              example: 1,
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              example: 20,
              description: 'Items per page',
            },
            totalPages: {
              type: 'integer',
              example: 50,
              description: 'Total number of pages',
            },
            hasMore: {
              type: 'boolean',
              example: true,
              description: 'Whether there are more items',
            },
            hasPrevious: {
              type: 'boolean',
              example: false,
              description: 'Whether there are previous items',
            },
          },
        },
      },

      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field and direction (e.g., name:asc, createdAt:desc)',
          required: false,
          schema: {
            type: 'string',
            example: 'createdAt:desc',
          },
        },
        SearchParam: {
          name: 'q',
          in: 'query',
          description: 'Search query',
          required: false,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
          },
        },
      },

      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: {
                  email: 'Valid email is required',
                  password: 'Password must be at least 8 characters',
                },
                timestamp: '2024-01-01T00:00:00.000Z',
                requestId: 'req_123456789',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Authentication required',
                timestamp: '2024-01-01T00:00:00.000Z',
                requestId: 'req_123456789',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'FORBIDDEN',
                message: 'Insufficient permissions',
                timestamp: '2024-01-01T00:00:00.000Z',
                requestId: 'req_123456789',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'NOT_FOUND',
                message: 'Resource not found',
                timestamp: '2024-01-01T00:00:00.000Z',
                requestId: 'req_123456789',
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Too Many Requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later',
                timestamp: '2024-01-01T00:00:00.000Z',
                requestId: 'req_123456789',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                timestamp: '2024-01-01T00:00:00.000Z',
                requestId: 'req_123456789',
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Products',
        description: 'Product catalog management',
      },
      {
        name: 'Orders',
        description: 'Order management operations',
      },
      {
        name: 'Payments',
        description: 'Payment processing operations',
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting',
      },
      {
        name: 'Admin',
        description: 'Administrative operations',
      },
      {
        name: 'Health',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/models/*.ts'],
};

/**
 * Service-specific Swagger configurations
 */
export const serviceConfigs = {
  'auth-service': {
    ...baseSwaggerConfig,
    definition: {
      ...baseSwaggerConfig.definition,
      info: {
        ...baseSwaggerConfig.definition.info,
        title: 'UltraMarket Auth Service API',
        description: 'Authentication and authorization service for UltraMarket platform',
      },
    },
  },

  'user-service': {
    ...baseSwaggerConfig,
    definition: {
      ...baseSwaggerConfig.definition,
      info: {
        ...baseSwaggerConfig.definition.info,
        title: 'UltraMarket User Service API',
        description: 'User management service for UltraMarket platform',
      },
    },
  },

  'product-service': {
    ...baseSwaggerConfig,
    definition: {
      ...baseSwaggerConfig.definition,
      info: {
        ...baseSwaggerConfig.definition.info,
        title: 'UltraMarket Product Service API',
        description: 'Product catalog management service for UltraMarket platform',
      },
    },
  },

  'order-service': {
    ...baseSwaggerConfig,
    definition: {
      ...baseSwaggerConfig.definition,
      info: {
        ...baseSwaggerConfig.definition.info,
        title: 'UltraMarket Order Service API',
        description: 'Order management service for UltraMarket platform',
      },
    },
  },

  'payment-service': {
    ...baseSwaggerConfig,
    definition: {
      ...baseSwaggerConfig.definition,
      info: {
        ...baseSwaggerConfig.definition.info,
        title: 'UltraMarket Payment Service API',
        description: 'Payment processing service for UltraMarket platform',
      },
    },
  },

  'cart-service': {
    ...baseSwaggerConfig,
    definition: {
      ...baseSwaggerConfig.definition,
      info: {
        ...baseSwaggerConfig.definition.info,
        title: 'UltraMarket Cart Service API',
        description: 'Shopping cart service for UltraMarket platform',
      },
    },
  },
};

/**
 * Swagger UI options
 */
export const swaggerUIOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #1f2937; }
    .swagger-ui .info .description { color: #4b5563; }
    .swagger-ui .scheme-container { background: #f9fafb; }
    .swagger-ui .opblock.opblock-post { border-color: #10b981; }
    .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #10b981; }
    .swagger-ui .opblock.opblock-get { border-color: #3b82f6; }
    .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #3b82f6; }
    .swagger-ui .opblock.opblock-put { border-color: #f59e0b; }
    .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #f59e0b; }
    .swagger-ui .opblock.opblock-delete { border-color: #ef4444; }
    .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #ef4444; }
  `,
  customSiteTitle: 'UltraMarket API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

/**
 * Generate Swagger documentation for a service
 */
export function generateSwaggerDocs(serviceName: string): Options {
  const config = serviceConfigs[serviceName as keyof typeof serviceConfigs];
  if (!config) {
    throw new Error(`Unknown service: ${serviceName}`);
  }
  return config;
}

export default {
  baseSwaggerConfig,
  serviceConfigs,
  swaggerUIOptions,
  generateSwaggerDocs,
};
