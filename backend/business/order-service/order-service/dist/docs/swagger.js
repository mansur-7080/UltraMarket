"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
var swagger_shim_1 = require("./swagger-shim");
var options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Order Service API',
            version: '1.0.0',
            description: 'API documentation for the Order Service',
            contact: {
                name: 'UltraMarket Team',
                email: 'support@ultramarket.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:4003',
                description: 'Development server',
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
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
var specs = swagger_shim_1.swaggerJsdoc.setup(options);
var setupSwagger = function (app) {
    app.use('/api-docs', swagger_shim_1.swaggerUi.serve, swagger_shim_1.swaggerUi.setup(specs));
};
exports.setupSwagger = setupSwagger;
