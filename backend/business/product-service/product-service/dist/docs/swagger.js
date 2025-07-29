"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const tslib_1 = require("tslib");
const swagger_jsdoc_1 = tslib_1.__importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = tslib_1.__importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'UltraMarket Product Service API',
            version: '1.0.0',
            description: 'Product Service API for UltraMarket e-commerce platform',
            contact: {
                name: 'UltraMarket Team',
                email: 'support@ultramarket.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3003',
                description: 'Development server',
            },
            {
                url: 'https://api.ultramarket.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Product: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Product ID',
                        },
                        name: {
                            type: 'string',
                            description: 'Product name',
                        },
                        description: {
                            type: 'string',
                            description: 'Product description',
                        },
                        price: {
                            type: 'number',
                            description: 'Product price',
                        },
                        originalPrice: {
                            type: 'number',
                            description: 'Original price before discount',
                        },
                        discount: {
                            type: 'number',
                            description: 'Discount percentage',
                        },
                        category: {
                            type: 'string',
                            description: 'Product category',
                        },
                        brand: {
                            type: 'string',
                            description: 'Product brand',
                        },
                        sku: {
                            type: 'string',
                            description: 'Stock Keeping Unit',
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Product images',
                        },
                        specifications: {
                            type: 'object',
                            description: 'Product specifications',
                        },
                        inStock: {
                            type: 'boolean',
                            description: 'Whether product is in stock',
                        },
                        quantity: {
                            type: 'number',
                            description: 'Available quantity',
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Product tags',
                        },
                        rating_average: {
                            type: 'number',
                            description: 'Average rating',
                        },
                        rating_count: {
                            type: 'number',
                            description: 'Number of ratings',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether product is active',
                        },
                        isFeatured: {
                            type: 'boolean',
                            description: 'Whether product is featured',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation date',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update date',
                        },
                    },
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Category ID',
                        },
                        name: {
                            type: 'string',
                            description: 'Category name',
                        },
                        slug: {
                            type: 'string',
                            description: 'Category slug',
                        },
                        description: {
                            type: 'string',
                            description: 'Category description',
                        },
                        parentCategory: {
                            type: 'string',
                            description: 'Parent category ID',
                        },
                        image: {
                            type: 'string',
                            description: 'Category image URL',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether category is active',
                        },
                        sortOrder: {
                            type: 'number',
                            description: 'Sort order',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation date',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update date',
                        },
                    },
                },
                CreateProductRequest: {
                    type: 'object',
                    required: ['name', 'description', 'price', 'category', 'brand', 'quantity'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Product name',
                        },
                        description: {
                            type: 'string',
                            description: 'Product description',
                        },
                        price: {
                            type: 'number',
                            description: 'Product price',
                        },
                        originalPrice: {
                            type: 'number',
                            description: 'Original price',
                        },
                        discount: {
                            type: 'number',
                            description: 'Discount percentage',
                        },
                        category: {
                            type: 'string',
                            description: 'Product category',
                        },
                        brand: {
                            type: 'string',
                            description: 'Product brand',
                        },
                        sku: {
                            type: 'string',
                            description: 'Stock Keeping Unit',
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Product images',
                        },
                        specifications: {
                            type: 'object',
                            description: 'Product specifications',
                        },
                        quantity: {
                            type: 'number',
                            description: 'Available quantity',
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Product tags',
                        },
                        isFeatured: {
                            type: 'boolean',
                            description: 'Whether product is featured',
                        },
                    },
                },
                UpdateProductRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Product name',
                        },
                        description: {
                            type: 'string',
                            description: 'Product description',
                        },
                        price: {
                            type: 'number',
                            description: 'Product price',
                        },
                        originalPrice: {
                            type: 'number',
                            description: 'Original price',
                        },
                        discount: {
                            type: 'number',
                            description: 'Discount percentage',
                        },
                        category: {
                            type: 'string',
                            description: 'Product category',
                        },
                        brand: {
                            type: 'string',
                            description: 'Product brand',
                        },
                        sku: {
                            type: 'string',
                            description: 'Stock Keeping Unit',
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Product images',
                        },
                        specifications: {
                            type: 'object',
                            description: 'Product specifications',
                        },
                        quantity: {
                            type: 'number',
                            description: 'Available quantity',
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Product tags',
                        },
                        isFeatured: {
                            type: 'boolean',
                            description: 'Whether product is featured',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether product is active',
                        },
                    },
                },
                ProductsResponse: {
                    type: 'object',
                    properties: {
                        products: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Product',
                            },
                        },
                        total: {
                            type: 'number',
                            description: 'Total number of products',
                        },
                        pages: {
                            type: 'number',
                            description: 'Total number of pages',
                        },
                        currentPage: {
                            type: 'number',
                            description: 'Current page number',
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        error: {
                            type: 'string',
                            description: 'Error details',
                        },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                        },
                        message: {
                            type: 'string',
                            description: 'Success message',
                        },
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
const specs = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'UltraMarket Product Service API Documentation',
        customfavIcon: '/favicon.ico',
    }));
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
};
exports.setupSwagger = setupSwagger;
/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management endpoints
 *   - name: Categories
 *     description: Category management endpoints
 *   - name: Health
 *     description: Health check endpoints
 */
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured products
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductsResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product by ID
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product by ID
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of featured products to return
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /products/sku/{sku}:
 *   get:
 *     summary: Get product by SKU
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *         description: Product SKU
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
//# sourceMappingURL=swagger.js.map