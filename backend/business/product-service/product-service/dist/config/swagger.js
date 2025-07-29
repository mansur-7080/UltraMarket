"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const tslib_1 = require("tslib");
const swagger_jsdoc_1 = tslib_1.__importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'UltraMarket Product Service API',
            version: '1.0.0',
            description: 'Product catalog and inventory management microservice for UltraMarket e-commerce platform',
            contact: {
                name: 'UltraMarket Team',
                email: 'support@ultramarket.uz',
            },
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://api.ultramarket.uz/product-service'
                    : `http://localhost:${process.env.PORT || 3003}`,
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        description: { type: 'string' },
                        shortDescription: { type: 'string' },
                        sku: { type: 'string' },
                        category: { type: 'string' },
                        subcategory: { type: 'string' },
                        brand: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        price: { type: 'number', minimum: 0 },
                        compareAtPrice: { type: 'number', minimum: 0 },
                        cost: { type: 'number', minimum: 0 },
                        currency: { type: 'string', default: 'UZS' },
                        taxable: { type: 'boolean', default: true },
                        inventory: {
                            type: 'object',
                            properties: {
                                quantity: { type: 'number', minimum: 0 },
                                tracked: { type: 'boolean', default: true },
                                allowBackorder: { type: 'boolean', default: false },
                                lowStockThreshold: { type: 'number', minimum: 0 },
                            },
                        },
                        weight: { type: 'number', minimum: 0 },
                        dimensions: {
                            type: 'object',
                            properties: {
                                length: { type: 'number', minimum: 0 },
                                width: { type: 'number', minimum: 0 },
                                height: { type: 'number', minimum: 0 },
                                unit: { type: 'string', default: 'cm' },
                            },
                        },
                        images: { type: 'array', items: { type: 'string' } },
                        videos: { type: 'array', items: { type: 'string' } },
                        hasVariants: { type: 'boolean', default: false },
                        variants: { type: 'array', items: { $ref: '#/components/schemas/ProductVariant' } },
                        status: { type: 'string', enum: ['draft', 'active', 'archived'], default: 'draft' },
                        publishedAt: { type: 'string', format: 'date-time' },
                        vendorId: { type: 'string' },
                        rating: {
                            type: 'object',
                            properties: {
                                average: { type: 'number', minimum: 0, maximum: 5 },
                                count: { type: 'number', minimum: 0 },
                                distribution: {
                                    type: 'object',
                                    properties: {
                                        1: { type: 'number' },
                                        2: { type: 'number' },
                                        3: { type: 'number' },
                                        4: { type: 'number' },
                                        5: { type: 'number' },
                                    },
                                },
                            },
                        },
                        featured: { type: 'boolean', default: false },
                        trending: { type: 'boolean', default: false },
                        newArrival: { type: 'boolean', default: false },
                        onSale: { type: 'boolean', default: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                ProductVariant: {
                    type: 'object',
                    properties: {
                        sku: { type: 'string' },
                        name: { type: 'string' },
                        price: { type: 'number', minimum: 0 },
                        compareAtPrice: { type: 'number', minimum: 0 },
                        cost: { type: 'number', minimum: 0 },
                        inventory: {
                            type: 'object',
                            properties: {
                                quantity: { type: 'number', minimum: 0 },
                                tracked: { type: 'boolean', default: true },
                                allowBackorder: { type: 'boolean', default: false },
                                lowStockThreshold: { type: 'number', minimum: 0 },
                            },
                        },
                        weight: { type: 'number', minimum: 0 },
                        dimensions: {
                            type: 'object',
                            properties: {
                                length: { type: 'number', minimum: 0 },
                                width: { type: 'number', minimum: 0 },
                                height: { type: 'number', minimum: 0 },
                            },
                        },
                        attributes: { type: 'object' },
                        images: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean', default: true },
                    },
                },
                Category: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        description: { type: 'string' },
                        image: { type: 'string' },
                        parentId: { type: 'string' },
                        level: { type: 'number', minimum: 0 },
                        sortOrder: { type: 'number', minimum: 0 },
                        isActive: { type: 'boolean', default: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Review: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        productId: { type: 'string' },
                        userId: { type: 'string' },
                        rating: { type: 'number', minimum: 1, maximum: 5 },
                        title: { type: 'string' },
                        comment: { type: 'string' },
                        verified: { type: 'boolean', default: false },
                        helpful: { type: 'number', default: 0 },
                        reported: { type: 'number', default: 0 },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', default: false },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        path: { type: 'string' },
                        method: { type: 'string' },
                        details: { type: 'object' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints',
            },
            {
                name: 'Products',
                description: 'Product management endpoints',
            },
            {
                name: 'Categories',
                description: 'Category management endpoints',
            },
            {
                name: 'Inventory',
                description: 'Inventory management endpoints',
            },
            {
                name: 'Reviews',
                description: 'Product review endpoints',
            },
            {
                name: 'Search',
                description: 'Product search endpoints',
            },
            {
                name: 'Admin',
                description: 'Admin endpoints',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map