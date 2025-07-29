"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("../shims/swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'UltraMarket Cart Service API',
            version: '1.0.0',
            description: 'Shopping cart management microservice for UltraMarket e-commerce platform',
            contact: {
                name: 'UltraMarket Team',
                email: 'support@ultramarket.uz',
            },
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://api.ultramarket.uz/cart-service'
                    : `http://localhost:${process.env.PORT || 3004}`,
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
                CartItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        productId: { type: 'string' },
                        productName: { type: 'string' },
                        price: { type: 'number', minimum: 0 },
                        originalPrice: { type: 'number', minimum: 0 },
                        quantity: { type: 'integer', minimum: 1 },
                        maxQuantity: { type: 'integer', minimum: 1 },
                        image: { type: 'string' },
                        sku: { type: 'string' },
                        variant: { type: 'string' },
                        addedAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: ['id', 'productId', 'productName', 'price', 'quantity'],
                },
                Cart: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                        sessionId: { type: 'string' },
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/CartItem' },
                        },
                        subtotal: { type: 'number', minimum: 0 },
                        tax: { type: 'number', minimum: 0 },
                        shipping: { type: 'number', minimum: 0 },
                        discount: { type: 'number', minimum: 0 },
                        total: { type: 'number', minimum: 0 },
                        currency: { type: 'string', default: 'UZS' },
                        expiresAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: [
                        'userId',
                        'items',
                        'subtotal',
                        'tax',
                        'shipping',
                        'discount',
                        'total',
                        'currency',
                    ],
                },
                CartSummary: {
                    type: 'object',
                    properties: {
                        itemCount: { type: 'integer', minimum: 0 },
                        subtotal: { type: 'number', minimum: 0 },
                        tax: { type: 'number', minimum: 0 },
                        shipping: { type: 'number', minimum: 0 },
                        discount: { type: 'number', minimum: 0 },
                        total: { type: 'number', minimum: 0 },
                        currency: { type: 'string', default: 'UZS' },
                    },
                },
                AddItemRequest: {
                    type: 'object',
                    properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'integer', minimum: 1, default: 1 },
                        variant: { type: 'string' },
                    },
                    required: ['productId'],
                },
                UpdateItemRequest: {
                    type: 'object',
                    properties: {
                        quantity: { type: 'integer', minimum: 0 },
                    },
                    required: ['quantity'],
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
                name: 'Cart',
                description: 'Shopping cart management endpoints',
            },
            {
                name: 'Cart Items',
                description: 'Cart item management endpoints',
            },
            {
                name: 'Saved Items',
                description: 'Save for later functionality',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map