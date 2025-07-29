/**
 * 🚀 ULTRA PROFESSIONAL CONFIGURATION MANAGER
 * UltraMarket E-commerce Platform
 *
 * Advanced configuration management system featuring:
 * - Environment-based configuration loading
 * - Configuration validation and type safety
 * - Secrets management and encryption
 * - Dynamic configuration updates
 * - Configuration versioning and rollback
 * - Environment variable validation
 * - Configuration templates and inheritance
 * - Secure configuration distribution
 * - Configuration audit logging
 * - Health checks for configuration
 *
 * @author UltraMarket Configuration Team
 * @version 9.0.0
 * @date 2024-12-28
 */
export interface ConfigurationSchema {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        required: boolean;
        default?: any;
        validation?: (value: any) => boolean | string;
        description: string;
        sensitive?: boolean;
        environment?: string[];
    };
}
export interface EnvironmentConfig {
    name: string;
    description: string;
    inherits?: string;
    variables: Record<string, any>;
    secrets: Record<string, string>;
    features: Record<string, boolean>;
    metadata: {
        version: string;
        lastUpdated: Date;
        updatedBy: string;
        checksum: string;
    };
}
export interface ConfigurationValidationResult {
    valid: boolean;
    errors: Array<{
        key: string;
        message: string;
        severity: 'error' | 'warning' | 'info';
    }>;
    warnings: Array<{
        key: string;
        message: string;
        recommendation: string;
    }>;
}
export interface SecretConfig {
    provider: 'env' | 'vault' | 'aws-secrets' | 'azure-keyvault' | 'gcp-secret-manager';
    config: Record<string, any>;
    encryption: {
        algorithm: string;
        keyDerivation: string;
        iterations: number;
    };
}
export interface ConfigurationAuditLog {
    timestamp: Date;
    environment: string;
    action: 'load' | 'update' | 'validate' | 'rollback';
    user: string;
    changes: Array<{
        key: string;
        oldValue?: any;
        newValue?: any;
        sensitive: boolean;
    }>;
    checksum: string;
    success: boolean;
    error?: string;
}
/**
 * Ultra Professional Configuration Manager
 */
export declare class UltraProfessionalConfigManager {
    private currentEnvironment;
    private configurations;
    private schema;
    private secretsManager;
    private auditLogs;
    private watchers;
    private configCache;
    private encryptionKey;
    constructor(environment: string | undefined, schema: ConfigurationSchema, secretsConfig?: SecretConfig);
    /**
     * Load configurations for all environments
     */
    private loadConfigurations;
    /**
     * Load configuration file
     */
    private loadConfigurationFile;
    /**
     * Get configuration value
     */
    get<T = any>(key: string, defaultValue?: T): T;
    /**
     * Set configuration value
     */
    set(key: string, value: any): Promise<void>;
    /**
     * Resolve configuration value with inheritance
     */
    private resolveConfigurationValue;
    /**
     * Process configuration value (handle interpolation, etc.)
     */
    private processConfigurationValue;
    /**
     * Validate entire configuration
     */
    validateConfiguration(config?: any): ConfigurationValidationResult;
    /**
     * Validate value type
     */
    private validateType;
    /**
     * Validate individual value
     */
    private validateValue;
    /**
     * Get all configuration values for current environment
     */
    getAllConfigurationValues(): Record<string, any>;
    /**
     * Get configuration summary
     */
    getConfigurationSummary(): {
        environment: string;
        totalKeys: number;
        requiredKeys: number;
        sensitiveKeys: number;
        loadedKeys: number;
        missingRequiredKeys: string[];
        validation: ConfigurationValidationResult;
    };
    /**
     * Watch for configuration changes
     */
    watch(callback: (config: any) => void): () => void;
    /**
     * Notify watchers of configuration changes
     */
    private notifyWatchers;
    /**
     * Setup configuration file watching
     */
    private setupConfigurationWatching;
    /**
     * Helper methods
     */
    private deriveEncryptionKey;
    private calculateChecksum;
    private loadEnvironmentSecrets;
    private createDefaultConfigurations;
    private generateDefaultConfig;
    private logConfigurationChange;
    /**
     * Get audit logs
     */
    getAuditLogs(): ConfigurationAuditLog[];
}
export declare function createConfigurationSchema(): ConfigurationSchema;
export default UltraProfessionalConfigManager;
//# sourceMappingURL=ultra-professional-config-manager.d.ts.map