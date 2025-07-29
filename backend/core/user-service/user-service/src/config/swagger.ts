import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UltraMarket User Service API',
      version: '1.0.0',
      description: 'User management microservice for UltraMarket e-commerce platform',
      contact: {
        name: 'UltraMarket Team',
        email: 'support@ultramarket.uz',
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://api.ultramarket.uz/user-service'
            : `http://localhost:${process.env.PORT || 3002}`,
        description:
          process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
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
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string', pattern: '^\\+998[0-9]{9}$' },
            role: { type: 'string', enum: ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'] },
            isActive: { type: 'boolean' },
            isEmailVerified: { type: 'boolean' },
            profileImage: { type: 'string', format: 'uri' },
            bio: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            lastLoginAt: { type: 'string', format: 'date-time' },
          },
        },
        Address: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['SHIPPING', 'BILLING'] },
            region: { type: 'string', description: 'Viloyat' },
            district: { type: 'string', description: 'Tuman' },
            city: { type: 'string', description: 'Shahar' },
            mahalla: { type: 'string', description: 'Mahalla' },
            street: { type: 'string', description: "Ko'cha nomi" },
            house: { type: 'string', description: 'Uy raqami' },
            apartment: { type: 'string', description: 'Xonadon raqami' },
            postalCode: { type: 'string', description: 'Pochta indeksi' },
            landmark: { type: 'string', description: "Mo'ljal" },
            instructions: { type: 'string', description: "Yetkazib berish ko'rsatmalari" },
            country: { type: 'string', default: 'UZ' },
            isDefault: { type: 'boolean' },
            isActive: { type: 'boolean' },
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
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Addresses',
        description: 'Address management endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
