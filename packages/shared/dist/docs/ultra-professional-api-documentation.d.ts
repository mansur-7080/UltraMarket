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
/**
 * Ultra Professional API Documentation Generator
 */
export declare class UltraProfessionalAPIDocumentation {
    private config;
    private services;
    private generatedSpecs;
    private validationResults;
    constructor(config: APIDocumentationConfig);
    /**
     * Register a microservice for documentation
     */
    registerService(serviceDoc: ServiceDocumentation): void;
    /**
     * Generate complete OpenAPI 3.0 specification
     */
    generateOpenAPISpec(): any;
    /**
     * Enhance API description with comprehensive information
     */
    private enhanceDescription;
    /**
     * Generate API paths from all registered services
     */
    private generatePaths;
    /**
     * Generate schemas from all services
     */
    private generateSchemas;
    /**
     * Generate common responses
     */
    private generateCommonResponses;
    /**
     * Generate common parameters
     */
    private generateCommonParameters;
    /**
     * Generate examples
     */
    private generateExamples;
    /**
     * Generate common request bodies
     */
    private generateCommonRequestBodies;
    /**
     * Generate common headers
     */
    private generateCommonHeaders;
    /**
     * Generate callbacks for async operations
     */
    private generateCallbacks;
    /**
     * Generate global security requirements
     */
    private generateGlobalSecurity;
    /**
     * Generate tag groups for better organization
     */
    private generateTagGroups;
    /**
     * Generate extended server configurations
     */
    private generateExtendedServers;
    /**
     * Enhance responses with additional metadata
     */
    private enhanceResponses;
    /**
     * Generate code samples for endpoints
     */
    private generateCodeSamples;
    /**
     * Generate JavaScript sample code
     */
    private generateJavaScriptSample;
    /**
     * Generate Python sample code
     */
    private generatePythonSample;
    /**
     * Generate cURL sample code
     */
    private generateCurlSample;
    /**
     * Generate PHP sample code
     */
    private generatePHPSample;
    /**
     * Generate service-specific documentation
     */
    generateServiceDocumentation(serviceName: string): any;
    /**
     * Generate paths for a specific service
     */
    private generateServicePaths;
    /**
     * Export documentation to file
     */
    exportDocumentation(format?: 'json' | 'yaml', outputPath?: string): Promise<void>;
    /**
     * Validate OpenAPI specification
     */
    validateSpecification(spec?: any): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Generate SDKs for different languages
     */
    generateSDKs(outputDir: string): Promise<void>;
    /**
     * Get documentation statistics
     */
    getStatistics(): any;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export declare const defaultAPIConfig: APIDocumentationConfig;
export declare const apiDocumentation: UltraProfessionalAPIDocumentation;
export default UltraProfessionalAPIDocumentation;
//# sourceMappingURL=ultra-professional-api-documentation.d.ts.map