"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultVersionManager = exports.defaultVersionCompatibility = exports.defaultApiVersionConfig = exports.ApiVersionManager = void 0;
exports.versionMiddleware = versionMiddleware;
exports.versionedRoute = versionedRoute;
exports.versionResponseTransformer = versionResponseTransformer;
const logger_1 = require("../logger");
// API versioning manager
class ApiVersionManager {
    config;
    compatibility;
    constructor(config, compatibility) {
        this.config = config;
        this.compatibility = compatibility;
        this.validateConfig();
    }
    validateConfig() {
        if (!this.config.currentVersion) {
            throw new Error('Current API version must be specified');
        }
        if (!this.config.supportedVersions.includes(this.config.currentVersion)) {
            throw new Error('Current version must be in supported versions list');
        }
        if (!this.config.defaultVersion) {
            this.config.defaultVersion = this.config.currentVersion;
        }
    }
    /**
     * Extract API version from request
     */
    extractVersion(req) {
        // Check header first
        const headerVersion = req.headers[this.config.versionHeader.toLowerCase()];
        if (headerVersion) {
            return this.normalizeVersion(headerVersion);
        }
        // Check query parameter
        const paramVersion = req.query[this.config.versionParam];
        if (paramVersion) {
            return this.normalizeVersion(paramVersion);
        }
        // Check URL path
        const pathVersion = this.extractVersionFromPath(req.path);
        if (pathVersion) {
            return this.normalizeVersion(pathVersion);
        }
        // Check Accept header
        const acceptVersion = this.extractVersionFromAcceptHeader(req.headers.accept);
        if (acceptVersion) {
            return this.normalizeVersion(acceptVersion);
        }
        // Return default version
        return this.config.defaultVersion;
    }
    /**
     * Normalize version string
     */
    normalizeVersion(version) {
        // Remove 'v' prefix if present
        const normalized = version.replace(/^v/i, '');
        // Validate version format (e.g., 1.0, 2.1, 3.0.1)
        if (!/^\d+\.\d+(\.\d+)?$/.test(normalized)) {
            throw new Error(`Invalid version format: ${version}`);
        }
        return normalized;
    }
    /**
     * Extract version from URL path
     */
    extractVersionFromPath(path) {
        const match = path.match(new RegExp(`^${this.config.versionPrefix}/(v?\\d+\\.\\d+(?:\\.\\d+)?)`));
        return match ? match[1] : null;
    }
    /**
     * Extract version from Accept header
     */
    extractVersionFromAcceptHeader(acceptHeader) {
        if (!acceptHeader)
            return null;
        // Look for version in Accept header like: application/vnd.ultramarket.v2+json
        const match = acceptHeader.match(/application\/vnd\.ultramarket\.v?(\d+\.\d+(?:\.\d+)?)/);
        return match ? match[1] : null;
    }
    /**
     * Check if version is supported
     */
    isVersionSupported(version) {
        return this.config.supportedVersions.includes(version);
    }
    /**
     * Check if version is deprecated
     */
    isVersionDeprecated(version) {
        return this.config.deprecatedVersions.includes(version);
    }
    /**
     * Get version compatibility info
     */
    getVersionInfo(version) {
        return this.compatibility[version] || null;
    }
    /**
     * Get migration path between versions
     */
    getMigrationPath(fromVersion, toVersion) {
        const from = this.parseVersion(fromVersion);
        const to = this.parseVersion(toVersion);
        const path = [];
        // Simple migration path - increment major/minor versions
        let current = from;
        while (this.compareVersions(current, to) < 0) {
            if (current.major < to.major) {
                current = { major: current.major + 1, minor: 0, patch: 0 };
            }
            else if (current.minor < to.minor) {
                current = { major: current.major, minor: current.minor + 1, patch: 0 };
            }
            else {
                current = { major: current.major, minor: current.minor, patch: current.patch + 1 };
            }
            path.push(this.formatVersion(current));
        }
        return path;
    }
    /**
     * Parse version string into components
     */
    parseVersion(version) {
        const parts = version.split('.').map(Number);
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0,
        };
    }
    /**
     * Format version components back to string
     */
    formatVersion(version) {
        return `${version.major}.${version.minor}.${version.patch}`;
    }
    /**
     * Compare two versions
     */
    compareVersions(a, b) {
        if (a.major !== b.major)
            return a.major - b.major;
        if (a.minor !== b.minor)
            return a.minor - b.minor;
        return a.patch - b.patch;
    }
    /**
     * Generate version compatibility report
     */
    generateCompatibilityReport() {
        const migrationPaths = {};
        for (const version of this.config.supportedVersions) {
            if (version !== this.config.currentVersion) {
                migrationPaths[version] = this.getMigrationPath(version, this.config.currentVersion);
            }
        }
        return {
            currentVersion: this.config.currentVersion,
            supportedVersions: this.config.supportedVersions,
            deprecatedVersions: this.config.deprecatedVersions,
            migrationPaths,
        };
    }
}
exports.ApiVersionManager = ApiVersionManager;
// Version middleware
function versionMiddleware(versionManager, options = {}) {
    return (req, res, next) => {
        try {
            const requestedVersion = versionManager.extractVersion(req);
            // Check if version is supported
            if (!versionManager.isVersionSupported(requestedVersion)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'UNSUPPORTED_API_VERSION',
                        message: `API version ${requestedVersion} is not supported`,
                        supportedVersions: versionManager['config'].supportedVersions,
                        currentVersion: versionManager['config'].currentVersion,
                    },
                });
            }
            // Add version to request
            req.apiVersion = requestedVersion;
            // Add version headers to response
            res.setHeader('X-API-Version', requestedVersion);
            res.setHeader('X-API-Current-Version', versionManager['config'].currentVersion);
            // Check for deprecation
            if (options.deprecationWarnings && versionManager.isVersionDeprecated(requestedVersion)) {
                const versionInfo = versionManager.getVersionInfo(requestedVersion);
                const deprecationWarning = versionInfo?.deprecationWarning || `API version ${requestedVersion} is deprecated`;
                res.setHeader('X-API-Deprecation-Warning', deprecationWarning);
                res.setHeader('X-API-Sunset', versionInfo?.supportedUntil || 'TBD');
                if (versionInfo?.migrationGuide) {
                    res.setHeader('X-API-Migration-Guide', versionInfo.migrationGuide);
                }
            }
            // Log version usage
            if (options.logVersionUsage) {
                logger_1.logger.info('API version used', {
                    version: requestedVersion,
                    path: req.path,
                    method: req.method,
                    userAgent: req.headers['user-agent'],
                    ip: req.ip,
                    deprecated: versionManager.isVersionDeprecated(requestedVersion),
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Version middleware error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                path: req.path,
                method: req.method,
            });
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_API_VERSION',
                    message: error instanceof Error ? error.message : 'Invalid API version',
                },
            });
        }
    };
}
// Version-specific route handler
function versionedRoute(versions) {
    return (req, res, next) => {
        const apiVersion = req.apiVersion;
        if (!apiVersion) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 'MISSING_API_VERSION',
                    message: 'API version not found in request',
                },
            });
        }
        const handler = versions[apiVersion];
        if (!handler) {
            // Try to find closest compatible version
            const availableVersions = Object.keys(versions).sort();
            const compatibleVersion = findCompatibleVersion(apiVersion, availableVersions);
            if (compatibleVersion) {
                logger_1.logger.info('Using compatible version', {
                    requested: apiVersion,
                    using: compatibleVersion,
                });
                return versions[compatibleVersion](req, res, next);
            }
            return res.status(501).json({
                success: false,
                error: {
                    code: 'VERSION_NOT_IMPLEMENTED',
                    message: `No handler found for API version ${apiVersion}`,
                    availableVersions,
                },
            });
        }
        return handler(req, res, next);
    };
}
// Find compatible version
function findCompatibleVersion(requestedVersion, availableVersions) {
    const requested = parseVersionString(requestedVersion);
    // Find the highest compatible version
    for (const version of availableVersions.reverse()) {
        const available = parseVersionString(version);
        // Compatible if major version matches and minor version is >= requested
        if (available.major === requested.major && available.minor >= requested.minor) {
            return version;
        }
    }
    return null;
}
// Parse version string helper
function parseVersionString(version) {
    const parts = version.split('.').map(Number);
    return {
        major: parts[0] || 0,
        minor: parts[1] || 0,
        patch: parts[2] || 0,
    };
}
// Response transformation middleware
function versionResponseTransformer(transformers) {
    return (req, res, next) => {
        const apiVersion = req.apiVersion;
        const transformer = transformers[apiVersion];
        if (transformer) {
            // Override res.json to apply transformation
            const originalJson = res.json;
            res.json = function (data) {
                const transformedData = transformer(data);
                return originalJson.call(this, transformedData);
            };
        }
        next();
    };
}
// Default configuration
exports.defaultApiVersionConfig = {
    currentVersion: '2.0',
    supportedVersions: ['1.0', '1.1', '2.0'],
    deprecatedVersions: ['1.0'],
    defaultVersion: '2.0',
    versionHeader: 'X-API-Version',
    versionParam: 'version',
    versionPrefix: '/api',
};
// Default compatibility matrix
exports.defaultVersionCompatibility = {
    '1.0': {
        supportedUntil: '2024-12-31',
        deprecationWarning: 'API v1.0 is deprecated. Please migrate to v2.0',
        migrationGuide: 'https://docs.ultramarket.com/api/migration/v1-to-v2',
        breakingChanges: [
            'User object structure changed',
            'Authentication endpoints updated',
            'Error response format updated',
        ],
        features: ['Basic CRUD operations', 'Simple authentication', 'Basic error handling'],
    },
    '1.1': {
        supportedUntil: '2025-06-30',
        deprecationWarning: 'API v1.1 will be deprecated soon. Consider migrating to v2.0',
        migrationGuide: 'https://docs.ultramarket.com/api/migration/v1.1-to-v2',
        breakingChanges: ['Pagination format changed', 'Search API updated'],
        features: ['Enhanced pagination', 'Advanced search', 'Improved error handling'],
    },
    '2.0': {
        supportedUntil: '2026-12-31',
        deprecationWarning: '',
        migrationGuide: '',
        breakingChanges: [],
        features: [
            'GraphQL support',
            'Real-time subscriptions',
            'Advanced security features',
            'Comprehensive API documentation',
        ],
    },
};
// Create default version manager
exports.defaultVersionManager = new ApiVersionManager(exports.defaultApiVersionConfig, exports.defaultVersionCompatibility);
//# sourceMappingURL=versioning.js.map