import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UltraMarket Notification Service API',
      version: '1.0.0',
      description:
        'Professional notification service with SMS, Email, and Push notification capabilities for Uzbekistan market',
      contact: {
        name: 'UltraMarket Team',
        email: 'support@ultramarket.uz',
        url: 'https://ultramarket.uz',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3008',
        description: 'Development server',
      },
      {
        url: 'https://api.ultramarket.uz',
        description: 'Production server',
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
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique notification ID',
            },
            userId: {
              type: 'string',
              description: 'User ID (optional)',
            },
            type: {
              type: 'string',
              enum: [
                'ORDER_CONFIRMATION',
                'ORDER_SHIPPED',
                'ORDER_DELIVERED',
                'ORDER_CANCELLED',
                'PAYMENT_SUCCESS',
                'PAYMENT_FAILED',
                'ACCOUNT_VERIFICATION',
                'PASSWORD_RESET',
                'SECURITY_ALERT',
                'PROMOTION',
                'NEWSLETTER',
                'WELCOME',
                'CUSTOM',
              ],
              description: 'Notification type',
            },
            channel: {
              type: 'string',
              enum: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP', 'ALL'],
              description: 'Notification channel',
            },
            status: {
              type: 'string',
              enum: [
                'PENDING',
                'QUEUED',
                'SENDING',
                'SENT',
                'DELIVERED',
                'READ',
                'FAILED',
                'CANCELLED',
                'SCHEDULED',
              ],
              description: 'Notification status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
              description: 'Notification priority',
            },
            title: {
              type: 'string',
              description: 'Notification title',
            },
            message: {
              type: 'string',
              description: 'Notification message',
            },
            recipient: {
              type: 'string',
              description: 'Recipient (email, phone, or device token)',
            },
            scheduledAt: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled delivery time',
            },
            sentAt: {
              type: 'string',
              format: 'date-time',
              description: 'Actual sent time',
            },
            deliveredAt: {
              type: 'string',
              format: 'date-time',
              description: 'Delivery confirmation time',
            },
            readAt: {
              type: 'string',
              format: 'date-time',
              description: 'Read confirmation time',
            },
            metadata: {
              type: 'object',
              description: 'Additional notification metadata',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        NotificationTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique template ID',
            },
            name: {
              type: 'string',
              description: 'Template name',
            },
            type: {
              type: 'string',
              enum: [
                'ORDER_CONFIRMATION',
                'ORDER_SHIPPED',
                'ORDER_DELIVERED',
                'ORDER_CANCELLED',
                'PAYMENT_SUCCESS',
                'PAYMENT_FAILED',
                'ACCOUNT_VERIFICATION',
                'PASSWORD_RESET',
                'SECURITY_ALERT',
                'PROMOTION',
                'NEWSLETTER',
                'WELCOME',
                'CUSTOM',
              ],
              description: 'Template type',
            },
            channel: {
              type: 'string',
              enum: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP'],
              description: 'Template channel',
            },
            subject: {
              type: 'string',
              description: 'Template subject (for email)',
            },
            message: {
              type: 'string',
              description: 'Template message content',
            },
            variables: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Template variables',
            },
            isActive: {
              type: 'boolean',
              description: 'Template active status',
            },
            version: {
              type: 'integer',
              description: 'Template version',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Detailed error information',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
      {
        name: 'Templates',
        description: 'Notification template management',
      },
      {
        name: 'Webhooks',
        description: 'Delivery status webhook endpoints',
      },
      {
        name: 'Health',
        description: 'Service health check endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
