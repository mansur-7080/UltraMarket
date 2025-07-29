/**
 * 🚀 ULTRA PROFESSIONAL API DOCUMENTATION SYSTEM
 * UltraMarket E-commerce Platform - OpenAPI 3.0 Complete Implementation
 *
 * @author UltraMarket API Team
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
    parameters?: any[];
    requestBody?: any;
    responses: Record<string, any>;
    security?: any[];
}
export interface ServiceDocumentation {
    serviceName: string;
    serviceVersion: string;
    endpoints: APIEndpoint[];
    schemas: Record<string, any>;
}
export declare class UltraProfessionalAPIDocumentation {
    private services;
    /**
     * Register microservice for documentation
     */
    registerService(serviceDoc: ServiceDocumentation): void;
    /**
     * Generate complete OpenAPI 3.0 specification
     */
    generateOpenAPISpec(): any;
    /**
     * Enhanced API description
     */
    private getEnhancedDescription;
    /**
     * Generate API paths from all services
     */
    private generatePaths;
    /**
     * Generate common schemas
     */
    private generateSchemas;
    /**
     * Get security schemes
     */
    private getSecuritySchemes;
    /**
     * Get common responses
     */
    private getCommonResponses;
    /**
     * Get common parameters
     */
    private getCommonParameters;
    /**
     * Get API tags
     */
    private getTags;
    /**
     * Enhance responses with common headers
     */
    private enhanceResponses;
    /**
     * Generate code samples for endpoints
     */
    private generateCodeSamples;
    /**
     * Export documentation to file
     */
    exportDocumentation(): Promise<string>;
    /**
     * Get documentation statistics
     */
    getStatistics(): any;
}
export declare const apiDocumentation: UltraProfessionalAPIDocumentation;
export default UltraProfessionalAPIDocumentation;
//# sourceMappingURL=api-documentation-system.d.ts.map