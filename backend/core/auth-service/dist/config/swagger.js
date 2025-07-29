"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSetup = void 0;
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'UltraMarket Auth Service API',
            version: '1.0.0',
            description: 'Authentication and Authorization API for UltraMarket',
            contact: {
                name: 'UltraMarket Team',
                email: 'support@ultramarket.uz',
            },
        },
        servers: [
            {
                url: process.env['API_GATEWAY_URL'] || 'http://localhost:3000',
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
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        phone: { type: 'string' },
                        role: { type: 'string', enum: ['CUSTOMER', 'VENDOR', 'ADMIN'] },
                        isEmailVerified: { type: 'boolean' },
                        isPhoneVerified: { type: 'boolean' },
                        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'password', 'confirmPassword', 'firstName', 'lastName'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 },
                        confirmPassword: { type: 'string' },
                        firstName: { type: 'string', minLength: 2, maxLength: 50 },
                        lastName: { type: 'string', minLength: 2, maxLength: 50 },
                        phone: { type: 'string', pattern: '^\\+998[0-9]{9}$' },
                        role: { type: 'string', enum: ['CUSTOMER', 'VENDOR'], default: 'CUSTOMER' },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' },
                        rememberMe: { type: 'boolean', default: false },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                user: { $ref: '#/components/schemas/User' },
                                tokens: {
                                    type: 'object',
                                    properties: {
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', default: false },
                        error: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                                stack: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts']
};
const swaggerSetup = (app) => {
};
exports.swaggerSetup = swaggerSetup;
//# sourceMappingURL=swagger.js.map