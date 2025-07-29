import { Request, Response, NextFunction } from 'express';
export interface ApiVersionConfig {
    currentVersion: string;
    supportedVersions: string[];
    deprecatedVersions: string[];
    defaultVersion: string;
    versionHeader: string;
    versionParam: string;
    versionPrefix: string;
}
export interface VersionCompatibility {
    [version: string]: {
        supportedUntil: string;
        deprecationWarning: string;
        migrationGuide: string;
        breakingChanges: string[];
        features: string[];
    };
}
export declare class ApiVersionManager {
    private config;
    private compatibility;
    constructor(config: ApiVersionConfig, compatibility: VersionCompatibility);
    private validateConfig;
    /**
     * Extract API version from request
     */
    extractVersion(req: Request): string;
    /**
     * Normalize version string
     */
    private normalizeVersion;
    /**
     * Extract version from URL path
     */
    private extractVersionFromPath;
    /**
     * Extract version from Accept header
     */
    private extractVersionFromAcceptHeader;
    /**
     * Check if version is supported
     */
    isVersionSupported(version: string): boolean;
    /**
     * Check if version is deprecated
     */
    isVersionDeprecated(version: string): boolean;
    /**
     * Get version compatibility info
     */
    getVersionInfo(version: string): VersionCompatibility[string] | null;
    /**
     * Get migration path between versions
     */
    getMigrationPath(fromVersion: string, toVersion: string): string[];
    /**
     * Parse version string into components
     */
    private parseVersion;
    /**
     * Format version components back to string
     */
    private formatVersion;
    /**
     * Compare two versions
     */
    private compareVersions;
    /**
     * Generate version compatibility report
     */
    generateCompatibilityReport(): {
        currentVersion: string;
        supportedVersions: string[];
        deprecatedVersions: string[];
        migrationPaths: Record<string, string[]>;
    };
}
export declare function versionMiddleware(versionManager: ApiVersionManager, options?: {
    strict?: boolean;
    deprecationWarnings?: boolean;
    logVersionUsage?: boolean;
}): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function versionedRoute(versions: Record<string, (req: Request, res: Response, next: NextFunction) => void>): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare function versionResponseTransformer(transformers: Record<string, (data: any) => any>): (req: Request, res: Response, next: NextFunction) => void;
export declare const defaultApiVersionConfig: ApiVersionConfig;
export declare const defaultVersionCompatibility: VersionCompatibility;
export declare const defaultVersionManager: ApiVersionManager;
//# sourceMappingURL=versioning.d.ts.map