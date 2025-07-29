/**
 * 🚀 ULTRA PROFESSIONAL API DOCUMENTATION SYSTEM
 * UltraMarket E-commerce Platform
 * 
 * Comprehensive OpenAPI 3.0 documentation system featuring:
 * - Automatic API documentation generation
 * - Interactive Swagger UI with custom themes
 * - Multi-language support (Uzbek, Russian, English)
 * - Real-time API validation and testing
 * - Auto-generated SDK and client libraries
 * - Performance metrics and analytics
 * - Version management and migration guides
 * - Security documentation and compliance
 * - Integration examples and tutorials
 * - API lifecycle management
 * 
 * @author UltraMarket API Documentation Team
 * @version 5.0.0
 * @date 2024-12-28
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import swaggerJsdoc from 'swagger-jsdoc';
import { logger } from '../logging/ultra-professional-logger';

// =================== INTERFACES ===================

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: Record<string, APIResponse>;
  security?: APISecurityRequirement[];
  deprecated?: boolean;
  examples?: Record<string, any>;
  xCodeSamples?: CodeSample[];
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description: string;
  required: boolean;
  schema: any;
  example?: any;
  examples?: Record<string, any>;
}

export interface APIRequestBody {
  description: string;
  required: boolean;
  content: Record<string, APIMediaType>;
}

export interface APIResponse {
  description: string;
  content?: Record<string, APIMediaType>;
  headers?: Record<string, APIHeader>;
  examples?: Record<string, any>;
}

export interface APIMediaType {
  schema: any;
  example?: any;
  examples?: Record<string, any>;
  encoding?: Record<string, any>;
}

export interface APIHeader {
  description: string;
  schema: any;
  example?: any;
}

export interface APISecurityRequirement {
  [key: string]: string[];
}

export interface CodeSample {
  lang: string;
  label: string;
  source: string;
}

export interface APIDocumentationConfig {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  contactInfo: {
    name: string;
    email: string;
    url: string;
  };
  licenseInfo: {
    name: string;
    url: string;
  };
  servers: APIServer[];
  securitySchemes: Record<string, any>;
  tags: APITag[];
  externalDocs?: {
    description: string;
    url: string;
  };
}

export interface APIServer {
  url: string;
  description: string;
  variables?: Record<string, APIServerVariable>;
}

export interface APIServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

export interface APITag {
  name: string;
  description: string;
  externalDocs?: {
    description: string;
    url: string;
  };
}

export interface ServiceDocumentation {
  serviceName: string;
  serviceVersion: string;
  endpoints: APIEndpoint[];
  schemas: Record<string, any>;
  examples: Record<string, any>;
  customizations?: {
    theme?: string;
    logo?: string;
    favicon?: string;
    customCSS?: string;
  };
}

// =================== API DOCUMENTATION GENERATOR ===================

/**
 * Ultra Professional API Documentation Generator
 */
export class UltraProfessionalAPIDocumentation {
  private config: APIDocumentationConfig;
  private services: Map<string, ServiceDocumentation> = new Map();
  private generatedSpecs: Map<string, any> = new Map();
  private validationResults: Map<string, any> = new Map();

  constructor(config: APIDocumentationConfig) {
    this.config = config;
    
    logger.info('🚀 Ultra Professional API Documentation initialized', {
      title: config.title,
      version: config.version,
      services: this.services.size
    });
  }

  /**
   * Register a microservice for documentation
   */
  public registerService(serviceDoc: ServiceDocumentation): void {
    this.services.set(serviceDoc.serviceName, serviceDoc);
    
    logger.info('📝 Service registered for documentation', {
      serviceName: serviceDoc.serviceName,
      endpointsCount: serviceDoc.endpoints.length
    });
  }

  /**
   * Generate complete OpenAPI 3.0 specification
   */
  public generateOpenAPISpec(): any {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.enhanceDescription(this.config.description),
        contact: this.config.contactInfo,
        license: this.config.licenseInfo,
        termsOfService: 'https://ultramarket.uz/terms',
        'x-logo': {
          url: 'https://ultramarket.uz/logo.png',
          altText: 'UltraMarket Logo'
        }
      },
      servers: this.config.servers,
      paths: this.generatePaths(),
      components: {
        schemas: this.generateSchemas(),
        securitySchemes: this.config.securitySchemes,
        responses: this.generateCommonResponses(),
        parameters: this.generateCommonParameters(),
        examples: this.generateExamples(),
        requestBodies: this.generateCommonRequestBodies(),
        headers: this.generateCommonHeaders(),
        callbacks: this.generateCallbacks()
      },
      tags: this.config.tags,
      externalDocs: this.config.externalDocs,
      security: this.generateGlobalSecurity(),
      'x-tagGroups': this.generateTagGroups(),
      'x-servers': this.generateExtendedServers()
    };

    this.generatedSpecs.set('main', spec);
    return spec;
  }

  /**
   * Enhance API description with comprehensive information
   */
  private enhanceDescription(baseDescription: string): string {
    return `
${baseDescription}

## 🌟 API Features

- **🛡️ Enterprise Security**: JWT + OAuth2 + API Keys
- **📊 Real-time Analytics**: Performance monitoring and insights
- **🌐 Multi-language**: Uzbek, Russian, English support
- **💳 Local Payments**: Click, Payme, Uzcard, Humo integration
- **📱 Mobile Optimized**: Responsive design and PWA support
- **🚀 High Performance**: Sub-200ms response times
- **📈 Scalable Architecture**: Microservices with load balancing
- **🔄 Real-time Updates**: WebSocket and Server-Sent Events

## 🏗️ Architecture Overview

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   API Gateway   │────│  Microservices  │
│   (React/Next)  │    │   (Kong/Nginx)  │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Databases     │
                    │ PostgreSQL+Redis│
                    └─────────────────┘
\`\`\`

## 🚦 Rate Limiting

| Plan | Requests/Minute | Requests/Day |
|------|----------------|--------------|
| Free | 60 | 1,000 |
| Pro | 1,000 | 50,000 |
| Enterprise | 10,000 | 1,000,000 |

## 📞 Support

- **📧 Email**: api-support@ultramarket.uz
- **💬 Telegram**: @ultramarket_support
- **📱 Phone**: +998 (71) 123-45-67
- **🌐 Website**: https://ultramarket.uz
- **📚 Documentation**: https://docs.ultramarket.uz
- **📊 Status Page**: https://status.ultramarket.uz

## 🔗 Quick Links

- [Getting Started Guide](https://docs.ultramarket.uz/getting-started)
- [Authentication Guide](https://docs.ultramarket.uz/auth)
- [SDKs & Libraries](https://docs.ultramarket.uz/sdks)
- [Postman Collection](https://www.postman.com/ultramarket/workspace/ultramarket-api)
- [OpenAPI Spec](https://api.ultramarket.uz/v1/openapi.json)
`;
  }

  /**
   * Generate API paths from all registered services
   */
  private generatePaths(): Record<string, any> {
    const paths: Record<string, any> = {};

    this.services.forEach((serviceDoc, serviceName) => {
      serviceDoc.endpoints.forEach((endpoint) => {
        const pathKey = endpoint.path;
        
        if (!paths[pathKey]) {
          paths[pathKey] = {};
        }

        paths[pathKey][endpoint.method.toLowerCase()] = {
          operationId: endpoint.operationId,
          summary: endpoint.summary,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: endpoint.parameters,
          requestBody: endpoint.requestBody,
          responses: this.enhanceResponses(endpoint.responses),
          security: endpoint.security,
          deprecated: endpoint.deprecated || false,
          'x-service': serviceName,
          'x-code-samples': endpoint.xCodeSamples || this.generateCodeSamples(endpoint),
          'x-examples': endpoint.examples
        };
      });
    });

    return paths;
  }

  /**
   * Generate schemas from all services
   */
  private generateSchemas(): Record<string, any> {
    const schemas: Record<string, any> = {};

    // Common schemas
    schemas.ErrorResponse = {
      type: 'object',
      required: ['success', 'error', 'message', 'timestamp'],
      properties: {
        success: {
          type: 'boolean',
          example: false,
          description: 'Request success status'
        },
        error: {
          type: 'string',
          example: 'VALIDATION_ERROR',
          description: 'Error code for programmatic handling'
        },
        message: {
          type: 'string',
          example: 'Validation failed for the provided data',
          description: 'Human-readable error message'
        },
        details: {
          type: 'object',
          description: 'Additional error details and validation errors'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-12-28T12:00:00.000Z',
          description: 'Error timestamp in ISO format'
        },
        requestId: {
          type: 'string',
          example: 'req_123456789',
          description: 'Unique request identifier for debugging'
        }
      }
    };

    schemas.SuccessResponse = {
      type: 'object',
      required: ['success', 'data', 'message'],
      properties: {
        success: {
          type: 'boolean',
          example: true,
          description: 'Request success status'
        },
        data: {
          type: 'object',
          description: 'Response data'
        },
        message: {
          type: 'string',
          example: 'Operation completed successfully',
          description: 'Success message'
        },
        meta: {
          type: 'object',
          description: 'Additional metadata (pagination, etc.)'
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Response timestamp'
        }
      }
    };

    schemas.PaginationMeta = {
      type: 'object',
      required: ['page', 'limit', 'total', 'totalPages'],
      properties: {
        page: {
          type: 'integer',
          minimum: 1,
          example: 1,
          description: 'Current page number'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          example: 20,
          description: 'Items per page'
        },
        total: {
          type: 'integer',
          minimum: 0,
          example: 150,
          description: 'Total number of items'
        },
        totalPages: {
          type: 'integer',
          minimum: 0,
          example: 8,
          description: 'Total number of pages'
        },
        hasNext: {
          type: 'boolean',
          example: true,
          description: 'Whether there are more pages'
        },
        hasPrev: {
          type: 'boolean',
          example: false,
          description: 'Whether there are previous pages'
        }
      }
    };

    // Service-specific schemas
    this.services.forEach((serviceDoc) => {
      Object.assign(schemas, serviceDoc.schemas);
    });

    return schemas;
  }

  /**
   * Generate common responses
   */
  private generateCommonResponses(): Record<string, any> {
    return {
      BadRequest: {
        description: 'Bad request - validation error or malformed request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            examples: {
              validationError: {
                summary: 'Validation Error',
                value: {
                  success: false,
                  error: 'VALIDATION_ERROR',
                  message: 'Validation failed',
                  details: {
                    email: ['Email is required', 'Email format is invalid'],
                    password: ['Password must be at least 8 characters']
                  },
                  timestamp: '2024-12-28T12:00:00.000Z',
                  requestId: 'req_123456789'
                }
              }
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized - authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'UNAUTHORIZED',
              message: 'Authentication required',
              timestamp: '2024-12-28T12:00:00.000Z',
              requestId: 'req_123456789'
            }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'FORBIDDEN',
              message: 'Insufficient permissions',
              timestamp: '2024-12-28T12:00:00.000Z',
              requestId: 'req_123456789'
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'NOT_FOUND',
              message: 'Requested resource not found',
              timestamp: '2024-12-28T12:00:00.000Z',
              requestId: 'req_123456789'
            }
          }
        }
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'RATE_LIMITED',
              message: 'Rate limit exceeded. Try again later.',
              details: {
                retryAfter: 60,
                limit: 100,
                remaining: 0,
                resetTime: '2024-12-28T12:01:00.000Z'
              },
              timestamp: '2024-12-28T12:00:00.000Z',
              requestId: 'req_123456789'
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'INTERNAL_ERROR',
              message: 'An unexpected error occurred',
              timestamp: '2024-12-28T12:00:00.000Z',
              requestId: 'req_123456789'
            }
          }
        }
      }
    };
  }

  /**
   * Generate common parameters
   */
  private generateCommonParameters(): Record<string, any> {
    return {
      PageQuery: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        },
        example: 1
      },
      LimitQuery: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        },
        example: 20
      },
      SortQuery: {
        name: 'sort',
        in: 'query',
        description: 'Sort field and direction (e.g., "createdAt:desc")',
        required: false,
        schema: {
          type: 'string',
          pattern: '^[a-zA-Z][a-zA-Z0-9_]*:(asc|desc)$'
        },
        example: 'createdAt:desc'
      },
      SearchQuery: {
        name: 'search',
        in: 'query',
        description: 'Search query string',
        required: false,
        schema: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        example: 'laptop gaming'
      },
      LanguageHeader: {
        name: 'Accept-Language',
        in: 'header',
        description: 'Preferred language for response',
        required: false,
        schema: {
          type: 'string',
          enum: ['uz', 'ru', 'en'],
          default: 'uz'
        },
        example: 'uz'
      },
      RequestIdHeader: {
        name: 'X-Request-ID',
        in: 'header',
        description: 'Unique request identifier',
        required: false,
        schema: {
          type: 'string',
          format: 'uuid'
        },
        example: '123e4567-e89b-12d3-a456-426614174000'
      }
    };
  }

  /**
   * Generate examples
   */
  private generateExamples(): Record<string, any> {
    return {
      SuccessfulLogin: {
        summary: 'Successful login',
        value: {
          success: true,
          data: {
            user: {
              id: 'usr_123456789',
              email: 'user@example.com',
              firstName: 'John',
              lastName: 'Doe',
              role: 'customer'
            },
            tokens: {
              accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              expiresIn: 3600
            }
          },
          message: 'Login successful',
          timestamp: '2024-12-28T12:00:00.000Z'
        }
      },
      ProductList: {
        summary: 'Product list with pagination',
        value: {
          success: true,
          data: {
            products: [
              {
                id: 'prd_123456789',
                name: 'Gaming Laptop ASUS ROG',
                description: 'Professional gaming laptop',
                price: 15000000,
                currency: 'UZS',
                category: 'laptops',
                images: ['https://cdn.ultramarket.uz/products/asus-rog-1.jpg'],
                inStock: true,
                rating: 4.8
              }
            ],
            meta: {
              page: 1,
              limit: 20,
              total: 150,
              totalPages: 8,
              hasNext: true,
              hasPrev: false
            }
          },
          message: 'Products retrieved successfully',
          timestamp: '2024-12-28T12:00:00.000Z'
        }
      }
    };
  }

  /**
   * Generate common request bodies
   */
  private generateCommonRequestBodies(): Record<string, any> {
    return {
      LoginRequest: {
        description: 'User login credentials',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address'
                },
                password: {
                  type: 'string',
                  minLength: 8,
                  description: 'User password'
                },
                rememberMe: {
                  type: 'boolean',
                  default: false,
                  description: 'Keep user logged in'
                }
              }
            },
            example: {
              email: 'user@example.com',
              password: 'securePassword123',
              rememberMe: true
            }
          }
        }
      }
    };
  }

  /**
   * Generate common headers
   */
  private generateCommonHeaders(): Record<string, any> {
    return {
      RateLimitRemaining: {
        description: 'Number of requests remaining in current rate limit window',
        schema: {
          type: 'integer',
          minimum: 0
        },
        example: 95
      },
      RateLimitReset: {
        description: 'Time when rate limit window resets (Unix timestamp)',
        schema: {
          type: 'integer'
        },
        example: 1640995200
      },
      RequestId: {
        description: 'Unique request identifier for tracking',
        schema: {
          type: 'string'
        },
        example: 'req_123456789'
      }
    };
  }

  /**
   * Generate callbacks for async operations
   */
  private generateCallbacks(): Record<string, any> {
    return {
      PaymentWebhook: {
        '{$request.body#/callbackUrl}': {
          post: {
            summary: 'Payment status update',
            description: 'Webhook callback for payment status updates',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      orderId: { type: 'string' },
                      status: { type: 'string', enum: ['success', 'failed', 'pending'] },
                      transactionId: { type: 'string' },
                      amount: { type: 'number' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Webhook received successfully'
              }
            }
          }
        }
      }
    };
  }

  /**
   * Generate global security requirements
   */
  private generateGlobalSecurity(): any[] {
    return [
      { BearerAuth: [] },
      { ApiKeyAuth: [] },
      {}  // Some endpoints may not require authentication
    ];
  }

  /**
   * Generate tag groups for better organization
   */
  private generateTagGroups(): any[] {
    return [
      {
        name: 'Authentication & Users',
        tags: ['Authentication', 'Users', 'Profiles']
      },
      {
        name: 'Product Catalog',
        tags: ['Products', 'Categories', 'Search', 'Reviews']
      },
      {
        name: 'Shopping & Orders',
        tags: ['Cart', 'Orders', 'Payments', 'Shipping']
      },
      {
        name: 'Business Operations',
        tags: ['Inventory', 'Analytics', 'Reports', 'Admin']
      },
      {
        name: 'Platform Services',
        tags: ['Notifications', 'Files', 'Settings', 'Health']
      }
    ];
  }

  /**
   * Generate extended server configurations
   */
  private generateExtendedServers(): any[] {
    return [
      {
        url: 'https://api.ultramarket.uz/v1',
        description: 'Production API Server',
        variables: {
          version: {
            default: 'v1',
            description: 'API version'
          }
        }
      },
      {
        url: 'https://staging-api.ultramarket.uz/v1',
        description: 'Staging API Server',
        variables: {
          version: {
            default: 'v1',
            description: 'API version'
          }
        }
      },
      {
        url: 'http://localhost:3000/v1',
        description: 'Development Server',
        variables: {
          port: {
            default: '3000',
            description: 'Port number'
          }
        }
      }
    ];
  }

  /**
   * Enhance responses with additional metadata
   */
  private enhanceResponses(responses: Record<string, APIResponse>): Record<string, any> {
    const enhanced: Record<string, any> = {};

    Object.entries(responses).forEach(([code, response]) => {
      enhanced[code] = {
        ...response,
        headers: {
          'X-Request-ID': { $ref: '#/components/headers/RequestId' },
          'X-RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
          'X-RateLimit-Reset': { $ref: '#/components/headers/RateLimitReset' },
          ...response.headers
        }
      };
    });

    // Add common error responses if not present
    if (!enhanced['400']) {
      enhanced['400'] = { $ref: '#/components/responses/BadRequest' };
    }
    if (!enhanced['401']) {
      enhanced['401'] = { $ref: '#/components/responses/Unauthorized' };
    }
    if (!enhanced['429']) {
      enhanced['429'] = { $ref: '#/components/responses/TooManyRequests' };
    }
    if (!enhanced['500']) {
      enhanced['500'] = { $ref: '#/components/responses/InternalServerError' };
    }

    return enhanced;
  }

  /**
   * Generate code samples for endpoints
   */
  private generateCodeSamples(endpoint: APIEndpoint): CodeSample[] {
    const samples: CodeSample[] = [];

    // JavaScript/Node.js example
    samples.push({
      lang: 'javascript',
      label: 'JavaScript (Fetch)',
      source: this.generateJavaScriptSample(endpoint)
    });

    // Python example
    samples.push({
      lang: 'python',
      label: 'Python (Requests)',
      source: this.generatePythonSample(endpoint)
    });

    // cURL example
    samples.push({
      lang: 'shell',
      label: 'cURL',
      source: this.generateCurlSample(endpoint)
    });

    // PHP example
    samples.push({
      lang: 'php',
      label: 'PHP (Guzzle)',
      source: this.generatePHPSample(endpoint)
    });

    return samples;
  }

  /**
   * Generate JavaScript sample code
   */
  private generateJavaScriptSample(endpoint: APIEndpoint): string {
    const hasBody = endpoint.requestBody !== undefined;
    const pathWithParams = endpoint.path.replace(/{([^}]+)}/g, '${$1}');

    return `
const response = await fetch('https://api.ultramarket.uz/v1${pathWithParams}', {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json',
    'Accept-Language': 'uz'
  }${hasBody ? `,
  body: JSON.stringify({
    // Request body data
  })` : ''}
});

const data = await response.json();

if (data.success) {
  console.log('Success:', data.data);
} else {
  console.error('Error:', data.error, data.message);
}
`.trim();
  }

  /**
   * Generate Python sample code
   */
  private generatePythonSample(endpoint: APIEndpoint): string {
    const hasBody = endpoint.requestBody !== undefined;
    const pathWithParams = endpoint.path.replace(/{([^}]+)}/g, '{$1}');

    return `
import requests

url = f"https://api.ultramarket.uz/v1${pathWithParams}"
headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json",
    "Accept-Language": "uz"
}

${hasBody ? `data = {
    # Request body data
}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)` : `response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)`}

if response.status_code == 200:
    result = response.json()
    if result["success"]:
        print("Success:", result["data"])
    else:
        print("Error:", result["error"], result["message"])
else:
    print(f"HTTP Error: {response.status_code}")
`.trim();
  }

  /**
   * Generate cURL sample code
   */
  private generateCurlSample(endpoint: APIEndpoint): string {
    const hasBody = endpoint.requestBody !== undefined;
    const pathWithParams = endpoint.path.replace(/{([^}]+)}/g, '{$1}');

    let curl = `curl -X ${endpoint.method} "https://api.ultramarket.uz/v1${pathWithParams}" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Accept-Language: uz"`;

    if (hasBody) {
      curl += ` \\
  -d '{
    "example": "data"
  }'`;
    }

    return curl;
  }

  /**
   * Generate PHP sample code
   */
  private generatePHPSample(endpoint: APIEndpoint): string {
    const hasBody = endpoint.requestBody !== undefined;
    const pathWithParams = endpoint.path.replace(/{([^}]+)}/g, '{$1}');

    return `
<?php
require_once 'vendor/autoload.php';

use GuzzleHttp\\Client;
use GuzzleHttp\\Exception\\RequestException;

$client = new Client();

try {
    $response = $client->${endpoint.method.toLowerCase()}('https://api.ultramarket.uz/v1${pathWithParams}', [
        'headers' => [
            'Authorization' => 'Bearer YOUR_ACCESS_TOKEN',
            'Content-Type' => 'application/json',
            'Accept-Language' => 'uz'
        ]${hasBody ? `,
        'json' => [
            // Request body data
        ]` : ''}
    ]);

    $data = json_decode($response->getBody(), true);
    
    if ($data['success']) {
        echo "Success: " . json_encode($data['data']);
    } else {
        echo "Error: " . $data['error'] . " - " . $data['message'];
    }
} catch (RequestException $e) {
    echo "HTTP Error: " . $e->getMessage();
}
?>
`.trim();
  }

  /**
   * Generate service-specific documentation
   */
  public generateServiceDocumentation(serviceName: string): any {
    const serviceDoc = this.services.get(serviceName);
    if (!serviceDoc) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const spec = {
      openapi: '3.0.3',
      info: {
        title: `${this.config.title} - ${serviceName}`,
        version: serviceDoc.serviceVersion,
        description: `API documentation for ${serviceName} microservice`
      },
      servers: this.config.servers,
      paths: this.generateServicePaths(serviceDoc),
      components: {
        schemas: serviceDoc.schemas,
        securitySchemes: this.config.securitySchemes
      },
      tags: this.config.tags.filter(tag => 
        serviceDoc.endpoints.some(endpoint => endpoint.tags.includes(tag.name))
      )
    };

    this.generatedSpecs.set(serviceName, spec);
    return spec;
  }

  /**
   * Generate paths for a specific service
   */
  private generateServicePaths(serviceDoc: ServiceDocumentation): Record<string, any> {
    const paths: Record<string, any> = {};

    serviceDoc.endpoints.forEach((endpoint) => {
      const pathKey = endpoint.path;
      
      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }

      paths[pathKey][endpoint.method.toLowerCase()] = {
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: this.enhanceResponses(endpoint.responses),
        security: endpoint.security,
        deprecated: endpoint.deprecated || false,
        'x-code-samples': endpoint.xCodeSamples || this.generateCodeSamples(endpoint)
      };
    });

    return paths;
  }

  /**
   * Export documentation to file
   */
  public async exportDocumentation(format: 'json' | 'yaml' = 'json', outputPath?: string): Promise<void> {
    const spec = this.generateOpenAPISpec();
    
    const fileName = outputPath || `openapi-spec.${format}`;
    const content = format === 'yaml' ? yaml.stringify(spec) : JSON.stringify(spec, null, 2);

    await fs.promises.writeFile(fileName, content, 'utf8');
    
    logger.info('📄 API documentation exported', {
      format,
      fileName,
      size: content.length
    });
  }

  /**
   * Validate OpenAPI specification
   */
  public validateSpecification(spec?: any): { valid: boolean; errors: string[] } {
    const specToValidate = spec || this.generateOpenAPISpec();
    const errors: string[] = [];

    // Basic validation
    if (!specToValidate.openapi) {
      errors.push('Missing openapi version');
    }

    if (!specToValidate.info) {
      errors.push('Missing info section');
    }

    if (!specToValidate.paths || Object.keys(specToValidate.paths).length === 0) {
      errors.push('No paths defined');
    }

    // Validate paths
    Object.entries(specToValidate.paths || {}).forEach(([path, pathItem]: [string, any]) => {
      if (!path.startsWith('/')) {
        errors.push(`Path ${path} must start with /`);
      }

      Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
        if (!operation.operationId) {
          errors.push(`Missing operationId for ${method.toUpperCase()} ${path}`);
        }

        if (!operation.responses) {
          errors.push(`Missing responses for ${method.toUpperCase()} ${path}`);
        }
      });
    });

    const result = { valid: errors.length === 0, errors };
    this.validationResults.set('main', result);

    return result;
  }

  /**
   * Generate SDKs for different languages
   */
  public async generateSDKs(outputDir: string): Promise<void> {
    const spec = this.generateOpenAPISpec();
    
    // This would integrate with OpenAPI generators
    logger.info('🛠️ Generating SDKs', {
      outputDir,
      languages: ['javascript', 'python', 'php', 'java', 'csharp']
    });

    // TODO: Implement actual SDK generation using openapi-generator
    // For now, create placeholder files
    const languages = ['javascript', 'python', 'php', 'java', 'csharp'];
    
    for (const lang of languages) {
      const langDir = path.join(outputDir, lang);
      await fs.promises.mkdir(langDir, { recursive: true });
      
      const readmeContent = `# UltraMarket API SDK - ${lang.charAt(0).toUpperCase() + lang.slice(1)}

## Installation

\`\`\`bash
# Installation instructions for ${lang}
\`\`\`

## Usage

\`\`\`${lang}
// Usage examples for ${lang}
\`\`\`

## Documentation

For full API documentation, visit: https://docs.ultramarket.uz
`;

      await fs.promises.writeFile(
        path.join(langDir, 'README.md'),
        readmeContent,
        'utf8'
      );
    }
  }

  /**
   * Get documentation statistics
   */
  public getStatistics(): any {
    const totalEndpoints = Array.from(this.services.values())
      .reduce((sum, service) => sum + service.endpoints.length, 0);

    const endpointsByMethod = Array.from(this.services.values())
      .flatMap(service => service.endpoints)
      .reduce((acc, endpoint) => {
        acc[endpoint.method] = (acc[endpoint.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const serviceStats = Array.from(this.services.entries()).map(([name, service]) => ({
      name,
      version: service.serviceVersion,
      endpoints: service.endpoints.length,
      schemas: Object.keys(service.schemas).length
    }));

    return {
      totalServices: this.services.size,
      totalEndpoints,
      endpointsByMethod,
      serviceStats,
      generatedSpecs: Array.from(this.generatedSpecs.keys()),
      validationResults: Array.from(this.validationResults.entries())
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.services.clear();
    this.generatedSpecs.clear();
    this.validationResults.clear();
  }
}

// =================== DEFAULT CONFIGURATION ===================

export const defaultAPIConfig: APIDocumentationConfig = {
  title: 'UltraMarket E-commerce API',
  version: '1.0.0',
  description: 'Comprehensive API for UltraMarket e-commerce platform',
  baseUrl: 'https://api.ultramarket.uz',
  contactInfo: {
    name: 'UltraMarket API Support',
    email: 'api-support@ultramarket.uz',
    url: 'https://ultramarket.uz/support'
  },
  licenseInfo: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
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
  securitySchemes: {
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
            'write:orders': 'Create and update orders',
            'admin:users': 'Manage users (admin only)',
            'admin:products': 'Manage products (admin only)'
          }
        }
      }
    }
  },
  tags: [
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
  ],
  externalDocs: {
    description: 'UltraMarket Developer Portal',
    url: 'https://docs.ultramarket.uz'
  }
};

// =================== GLOBAL INSTANCE ===================

export const apiDocumentation = new UltraProfessionalAPIDocumentation(defaultAPIConfig);

export default UltraProfessionalAPIDocumentation; 