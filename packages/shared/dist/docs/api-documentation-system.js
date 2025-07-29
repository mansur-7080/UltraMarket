"use strict";
/**
 * 🚀 ULTRA PROFESSIONAL API DOCUMENTATION SYSTEM
 * UltraMarket E-commerce Platform - OpenAPI 3.0 Complete Implementation
 *
 * @author UltraMarket API Team
 * @version 5.0.0
 * @date 2024-12-28
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiDocumentation = exports.UltraProfessionalAPIDocumentation = void 0;
const ultra_professional_logger_1 = require("../logging/ultra-professional-logger");
// =================== MAIN DOCUMENTATION CLASS ===================
class UltraProfessionalAPIDocumentation {
    services = new Map();
    /**
     * Register microservice for documentation
     */
    registerService(serviceDoc) {
        this.services.set(serviceDoc.serviceName, serviceDoc);
        ultra_professional_logger_1.logger.info('📝 Service registered for documentation', {
            serviceName: serviceDoc.serviceName,
            endpointsCount: serviceDoc.endpoints.length
        });
    }
    /**
     * Generate complete OpenAPI 3.0 specification
     */
    generateOpenAPISpec() {
        return {
            openapi: '3.0.3',
            info: {
                title: 'UltraMarket E-commerce API',
                version: '1.0.0',
                description: this.getEnhancedDescription(),
                contact: {
                    name: 'UltraMarket API Support',
                    email: 'api-support@ultramarket.uz',
                    url: 'https://ultramarket.uz/support'
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            },
            servers: [
                {
                    url: 'https://api.ultramarket.uz/v1',
                    description: 'Production server'
                },
                {
                    url: 'https://staging-api.ultramarket.uz/v1',
                    description: 'Staging server'
                },
                {
                    url: 'http://localhost:3000/v1',
                    description: 'Development server'
                }
            ],
            paths: this.generatePaths(),
            components: {
                schemas: this.generateSchemas(),
                securitySchemes: this.getSecuritySchemes(),
                responses: this.getCommonResponses(),
                parameters: this.getCommonParameters()
            },
            tags: this.getTags(),
            security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }, {}]
        };
    }
    /**
     * Enhanced API description
     */
    getEnhancedDescription() {
        return `
# 🚀 UltraMarket API - Professional E-commerce Platform

## Features
- 🛡️ **Enterprise Security**: JWT + OAuth2 + API Keys
- 📊 **Real-time Analytics**: Performance monitoring
- 🌐 **Multi-language**: Uzbek, Russian, English
- 💳 **Local Payments**: Click, Payme, Uzcard, Humo
- 📱 **Mobile Optimized**: PWA support
- 🚀 **High Performance**: Sub-200ms response times

## Rate Limiting
| Plan | Requests/Minute | Requests/Day |
|------|----------------|--------------|
| Free | 60 | 1,000 |
| Pro | 1,000 | 50,000 |
| Enterprise | 10,000 | 1,000,000 |

## Support
- **Email**: api-support@ultramarket.uz
- **Telegram**: @ultramarket_support
- **Website**: https://ultramarket.uz
- **Status**: https://status.ultramarket.uz
`;
    }
    /**
     * Generate API paths from all services
     */
    generatePaths() {
        const paths = {};
        this.services.forEach((serviceDoc) => {
            serviceDoc.endpoints.forEach((endpoint) => {
                if (!paths[endpoint.path]) {
                    paths[endpoint.path] = {};
                }
                paths[endpoint.path][endpoint.method.toLowerCase()] = {
                    operationId: endpoint.operationId,
                    summary: endpoint.summary,
                    description: endpoint.description,
                    tags: endpoint.tags,
                    parameters: endpoint.parameters,
                    requestBody: endpoint.requestBody,
                    responses: this.enhanceResponses(endpoint.responses),
                    security: endpoint.security,
                    'x-code-samples': this.generateCodeSamples(endpoint)
                };
            });
        });
        return paths;
    }
    /**
     * Generate common schemas
     */
    generateSchemas() {
        const schemas = {
            ErrorResponse: {
                type: 'object',
                required: ['success', 'error', 'message', 'timestamp'],
                properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'VALIDATION_ERROR' },
                    message: { type: 'string', example: 'Validation failed' },
                    details: { type: 'object' },
                    timestamp: { type: 'string', format: 'date-time' },
                    requestId: { type: 'string', example: 'req_123456789' }
                }
            },
            SuccessResponse: {
                type: 'object',
                required: ['success', 'data', 'message'],
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    message: { type: 'string', example: 'Operation successful' },
                    meta: { type: 'object' },
                    timestamp: { type: 'string', format: 'date-time' }
                }
            },
            PaginationMeta: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1, example: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, example: 20 },
                    total: { type: 'integer', minimum: 0, example: 150 },
                    totalPages: { type: 'integer', minimum: 0, example: 8 },
                    hasNext: { type: 'boolean', example: true },
                    hasPrev: { type: 'boolean', example: false }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'usr_123456789' },
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    firstName: { type: 'string', example: 'John' },
                    lastName: { type: 'string', example: 'Doe' },
                    role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            Product: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'prd_123456789' },
                    name: { type: 'string', example: 'Gaming Laptop ASUS ROG' },
                    description: { type: 'string', example: 'Professional gaming laptop' },
                    price: { type: 'number', example: 15000000 },
                    currency: { type: 'string', example: 'UZS' },
                    category: { type: 'string', example: 'laptops' },
                    images: { type: 'array', items: { type: 'string' } },
                    inStock: { type: 'boolean', example: true },
                    rating: { type: 'number', minimum: 0, maximum: 5, example: 4.8 }
                }
            }
        };
        // Add service-specific schemas
        this.services.forEach((serviceDoc) => {
            Object.assign(schemas, serviceDoc.schemas);
        });
        return schemas;
    }
    /**
     * Get security schemes
     */
    getSecuritySchemes() {
        return {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT access token for authentication'
            },
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API key for service-to-service communication'
            },
            OAuth2: {
                type: 'oauth2',
                flows: {
                    authorizationCode: {
                        authorizationUrl: 'https://auth.ultramarket.uz/oauth/authorize',
                        tokenUrl: 'https://auth.ultramarket.uz/oauth/token',
                        scopes: {
                            'read:profile': 'Read user profile',
                            'write:profile': 'Update user profile',
                            'read:orders': 'Read user orders',
                            'write:orders': 'Create and update orders'
                        }
                    }
                }
            }
        };
    }
    /**
     * Get common responses
     */
    getCommonResponses() {
        return {
            BadRequest: {
                description: 'Bad request - validation error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                }
            },
            Unauthorized: {
                description: 'Unauthorized - authentication required',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                }
            },
            TooManyRequests: {
                description: 'Rate limit exceeded',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                }
            }
        };
    }
    /**
     * Get common parameters
     */
    getCommonParameters() {
        return {
            PageQuery: {
                name: 'page',
                in: 'query',
                description: 'Page number for pagination',
                required: false,
                schema: { type: 'integer', minimum: 1, default: 1 }
            },
            LimitQuery: {
                name: 'limit',
                in: 'query',
                description: 'Number of items per page',
                required: false,
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
            },
            SearchQuery: {
                name: 'search',
                in: 'query',
                description: 'Search query string',
                required: false,
                schema: { type: 'string', minLength: 1, maxLength: 100 }
            }
        };
    }
    /**
     * Get API tags
     */
    getTags() {
        return [
            { name: 'Authentication', description: 'User authentication and authorization' },
            { name: 'Users', description: 'User management operations' },
            { name: 'Products', description: 'Product catalog management' },
            { name: 'Categories', description: 'Product category management' },
            { name: 'Cart', description: 'Shopping cart operations' },
            { name: 'Orders', description: 'Order management' },
            { name: 'Payments', description: 'Payment processing' },
            { name: 'Reviews', description: 'Product reviews and ratings' },
            { name: 'Search', description: 'Search and filtering' },
            { name: 'Analytics', description: 'Analytics and reporting' },
            { name: 'Admin', description: 'Administrative operations' },
            { name: 'Health', description: 'System health and monitoring' }
        ];
    }
    /**
     * Enhance responses with common headers
     */
    enhanceResponses(responses) {
        const enhanced = { ...responses };
        // Add common error responses if not present
        if (!enhanced['400'])
            enhanced['400'] = { $ref: '#/components/responses/BadRequest' };
        if (!enhanced['401'])
            enhanced['401'] = { $ref: '#/components/responses/Unauthorized' };
        if (!enhanced['404'])
            enhanced['404'] = { $ref: '#/components/responses/NotFound' };
        if (!enhanced['429'])
            enhanced['429'] = { $ref: '#/components/responses/TooManyRequests' };
        return enhanced;
    }
    /**
     * Generate code samples for endpoints
     */
    generateCodeSamples(endpoint) {
        const path = endpoint.path.replace(/{([^}]+)}/g, '${$1}');
        const hasBody = endpoint.requestBody !== undefined;
        return [
            {
                lang: 'javascript',
                label: 'JavaScript (Fetch)',
                source: `
const response = await fetch('https://api.ultramarket.uz/v1${path}', {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }${hasBody ? `,
  body: JSON.stringify({
    // Request data
  })` : ''}
});

const data = await response.json();
console.log(data);
`.trim()
            },
            {
                lang: 'python',
                label: 'Python (Requests)',
                source: `
import requests

response = requests.${endpoint.method.toLowerCase()}(
    'https://api.ultramarket.uz/v1${path}',
    headers={'Authorization': 'Bearer YOUR_ACCESS_TOKEN'}${hasBody ? `,
    json={
        # Request data
    }` : ''}
)

print(response.json())
`.trim()
            },
            {
                lang: 'shell',
                label: 'cURL',
                source: `
curl -X ${endpoint.method} "https://api.ultramarket.uz/v1${path}" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"${hasBody ? ` \\
  -H "Content-Type: application/json" \\
  -d '{"example": "data"}'` : ''}
`.trim()
            }
        ];
    }
    /**
     * Export documentation to file
     */
    async exportDocumentation() {
        const spec = this.generateOpenAPISpec();
        const content = JSON.stringify(spec, null, 2);
        ultra_professional_logger_1.logger.info('📄 API documentation generated', {
            endpoints: Object.keys(spec.paths).length,
            services: this.services.size
        });
        return content;
    }
    /**
     * Get documentation statistics
     */
    getStatistics() {
        const totalEndpoints = Array.from(this.services.values())
            .reduce((sum, service) => sum + service.endpoints.length, 0);
        return {
            totalServices: this.services.size,
            totalEndpoints,
            servicesList: Array.from(this.services.keys())
        };
    }
}
exports.UltraProfessionalAPIDocumentation = UltraProfessionalAPIDocumentation;
// =================== GLOBAL INSTANCE ===================
exports.apiDocumentation = new UltraProfessionalAPIDocumentation();
exports.default = UltraProfessionalAPIDocumentation;
//# sourceMappingURL=api-documentation-system.js.map