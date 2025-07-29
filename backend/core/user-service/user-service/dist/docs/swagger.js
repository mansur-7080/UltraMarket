"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'UltraMarket User Service API',
            version: '1.0.0',
            description: 'API documentation for UltraMarket User Service',
            contact: {
                name: 'UltraMarket Team',
                email: 'support@ultramarket.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:3001',
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
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'User ID',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        firstName: {
                            type: 'string',
                            description: 'User first name',
                        },
                        lastName: {
                            type: 'string',
                            description: 'User last name',
                        },
                        phoneNumber: {
                            type: 'string',
                            description: 'User phone number',
                        },
                        role: {
                            type: 'string',
                            enum: ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR'],
                            description: 'User role',
                        },
                        emailVerified: {
                            type: 'boolean',
                            description: 'Email verification status',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Account active status',
                        },
                        profileImage: {
                            type: 'string',
                            description: 'Profile image URL',
                        },
                        bio: {
                            type: 'string',
                            description: 'User bio',
                        },
                        dateOfBirth: {
                            type: 'string',
                            format: 'date',
                            description: 'User date of birth',
                        },
                        gender: {
                            type: 'string',
                            enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
                            description: 'User gender',
                        },
                        lastLoginAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last login timestamp',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                CreateUserRequest: {
                    type: 'object',
                    required: ['email', 'password', 'firstName', 'lastName'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            description: 'User password (min 8 characters)',
                        },
                        firstName: {
                            type: 'string',
                            minLength: 2,
                            description: 'User first name',
                        },
                        lastName: {
                            type: 'string',
                            minLength: 2,
                            description: 'User last name',
                        },
                        phoneNumber: {
                            type: 'string',
                            description: 'User phone number',
                        },
                        role: {
                            type: 'string',
                            enum: ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'MODERATOR'],
                            default: 'CUSTOMER',
                            description: 'User role',
                        },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        password: {
                            type: 'string',
                            description: 'User password',
                        },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        user: {
                            $ref: '#/components/schemas/User',
                        },
                        accessToken: {
                            type: 'string',
                            description: 'JWT access token',
                        },
                        refreshToken: {
                            type: 'string',
                            description: 'JWT refresh token',
                        },
                    },
                },
                UpdateUserRequest: {
                    type: 'object',
                    properties: {
                        firstName: {
                            type: 'string',
                            minLength: 2,
                            description: 'User first name',
                        },
                        lastName: {
                            type: 'string',
                            minLength: 2,
                            description: 'User last name',
                        },
                        phoneNumber: {
                            type: 'string',
                            description: 'User phone number',
                        },
                        bio: {
                            type: 'string',
                            description: 'User bio',
                        },
                        profileImage: {
                            type: 'string',
                            description: 'Profile image URL',
                        },
                        dateOfBirth: {
                            type: 'string',
                            format: 'date',
                            description: 'User date of birth',
                        },
                        gender: {
                            type: 'string',
                            enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
                            description: 'User gender',
                        },
                        preferences: {
                            type: 'object',
                            description: 'User preferences',
                        },
                    },
                },
                ChangePasswordRequest: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: {
                            type: 'string',
                            description: 'Current password',
                        },
                        newPassword: {
                            type: 'string',
                            minLength: 8,
                            description: 'New password (min 8 characters)',
                        },
                    },
                },
                PasswordResetRequest: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
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
                        code: {
                            type: 'string',
                            description: 'Error code',
                        },
                        errors: {
                            type: 'object',
                            description: 'Validation errors',
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
        customSiteTitle: 'UltraMarket User Service API Documentation',
        customfavIcon: '/favicon.ico',
    }));
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
};
exports.setupSwagger = setupSwagger;
//# sourceMappingURL=swagger.js.map