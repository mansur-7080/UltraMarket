"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sslConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
class SSLConfiguration {
    sslConfig;
    securityHeaders;
    constructor() {
        this.sslConfig = this.loadSSLConfig();
        this.securityHeaders = this.loadSecurityHeaders();
    }
    loadSSLConfig() {
        return {
            enabled: process.env['SSL_ENABLED'] === 'true',
            certPath: process.env['SSL_CERT_PATH'] || '',
            keyPath: process.env['SSL_KEY_PATH'] || '',
            caPath: process.env['SSL_CA_PATH'] || undefined,
            passphrase: process.env['SSL_PASSPHRASE'] || undefined,
            minVersion: process.env['SSL_MIN_VERSION'] || 'TLSv1.2',
            maxVersion: process.env['SSL_MAX_VERSION'] || 'TLSv1.3',
            ciphers: (process.env['SSL_CIPHERS'] || 'ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384').split(':'),
            honorCipherOrder: process.env['SSL_HONOR_CIPHER_ORDER'] === 'true',
            requestCert: process.env['SSL_REQUEST_CERT'] === 'true',
            rejectUnauthorized: process.env['SSL_REJECT_UNAUTHORIZED'] === 'true'
        };
    }
    loadSecurityHeaders() {
        return {
            hsts: {
                enabled: process.env['HSTS_ENABLED'] === 'true',
                maxAge: parseInt(process.env['HSTS_MAX_AGE'] || '31536000'),
                includeSubDomains: process.env['HSTS_INCLUDE_SUBDOMAINS'] === 'true',
                preload: process.env['HSTS_PRELOAD'] === 'true'
            },
            csp: {
                enabled: process.env['CSP_ENABLED'] === 'true',
                directives: {
                    'default-src': ["'self'"],
                    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    'style-src': ["'self'", "'unsafe-inline'"],
                    'img-src': ["'self'", 'data:', 'https:'],
                    'font-src': ["'self'", 'https:'],
                    'connect-src': ["'self'", 'https:'],
                    'frame-src': ["'none'"],
                    'object-src': ["'none'"],
                    'base-uri': ["'self'"],
                    'form-action': ["'self'"],
                    'frame-ancestors': ["'none'"],
                    'upgrade-insecure-requests': []
                }
            },
            xss: {
                enabled: process.env['XSS_PROTECTION_ENABLED'] === 'true',
                mode: process.env['XSS_PROTECTION_MODE'] || 'block'
            },
            frameOptions: {
                enabled: process.env['FRAME_OPTIONS_ENABLED'] === 'true',
                action: process.env['FRAME_OPTIONS_ACTION'] || 'DENY',
                uri: process.env['FRAME_OPTIONS_URI'] || undefined
            }
        };
    }
    getSSLOptions() {
        if (!this.sslConfig.enabled) {
            return null;
        }
        try {
            const options = {
                cert: fs_1.default.readFileSync(this.sslConfig.certPath),
                key: fs_1.default.readFileSync(this.sslConfig.keyPath),
                minVersion: this.sslConfig.minVersion,
                maxVersion: this.sslConfig.maxVersion,
                ciphers: this.sslConfig.ciphers.join(':'),
                honorCipherOrder: this.sslConfig.honorCipherOrder,
                requestCert: this.sslConfig.requestCert,
                rejectUnauthorized: this.sslConfig.rejectUnauthorized
            };
            if (this.sslConfig.caPath) {
                options.ca = fs_1.default.readFileSync(this.sslConfig.caPath);
            }
            if (this.sslConfig.passphrase) {
                options.passphrase = this.sslConfig.passphrase;
            }
            logger_1.logger.info('🔒 SSL configuration loaded successfully');
            return options;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to load SSL configuration:', error);
            return null;
        }
    }
    getSecurityHeaders() {
        return this.securityHeaders;
    }
    getHSTSHeader() {
        if (!this.securityHeaders.hsts.enabled) {
            return null;
        }
        let header = `max-age=${this.securityHeaders.hsts.maxAge}`;
        if (this.securityHeaders.hsts.includeSubDomains) {
            header += '; includeSubDomains';
        }
        if (this.securityHeaders.hsts.preload) {
            header += '; preload';
        }
        return header;
    }
    getCSPHeader() {
        if (!this.securityHeaders.csp.enabled) {
            return null;
        }
        const directives = [];
        for (const [directive, sources] of Object.entries(this.securityHeaders.csp.directives)) {
            if (sources.length > 0) {
                directives.push(`${directive} ${sources.join(' ')}`);
            }
            else {
                directives.push(directive);
            }
        }
        return directives.join('; ');
    }
    getXSSProtectionHeader() {
        if (!this.securityHeaders.xss.enabled) {
            return null;
        }
        return `1; mode=${this.securityHeaders.xss.mode}`;
    }
    getFrameOptionsHeader() {
        if (!this.securityHeaders.frameOptions.enabled) {
            return null;
        }
        let header = this.securityHeaders.frameOptions.action;
        if (this.securityHeaders.frameOptions.action === 'ALLOW-FROM' && this.securityHeaders.frameOptions.uri) {
            header += ` ${this.securityHeaders.frameOptions.uri}`;
        }
        return header;
    }
    validateSSLConfig() {
        const errors = [];
        if (this.sslConfig.enabled) {
            if (!this.sslConfig.certPath || !fs_1.default.existsSync(this.sslConfig.certPath)) {
                errors.push('SSL certificate file not found or not specified');
            }
            if (!this.sslConfig.keyPath || !fs_1.default.existsSync(this.sslConfig.keyPath)) {
                errors.push('SSL private key file not found or not specified');
            }
            if (this.sslConfig.caPath && !fs_1.default.existsSync(this.sslConfig.caPath)) {
                errors.push('SSL CA certificate file not found');
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    getSSLStatus() {
        const validation = this.validateSSLConfig();
        return {
            enabled: this.sslConfig.enabled,
            isValid: validation.isValid,
            errors: validation.errors,
            config: {
                minVersion: this.sslConfig.minVersion,
                maxVersion: this.sslConfig.maxVersion,
                ciphersCount: this.sslConfig.ciphers.length,
                honorCipherOrder: this.sslConfig.honorCipherOrder,
                requestCert: this.sslConfig.requestCert,
                rejectUnauthorized: this.sslConfig.rejectUnauthorized
            }
        };
    }
    getSecurityHeadersStatus() {
        return {
            hsts: {
                enabled: this.securityHeaders.hsts.enabled,
                maxAge: this.securityHeaders.hsts.maxAge,
                includeSubDomains: this.securityHeaders.hsts.includeSubDomains,
                preload: this.securityHeaders.hsts.preload
            },
            csp: {
                enabled: this.securityHeaders.csp.enabled,
                directivesCount: Object.keys(this.securityHeaders.csp.directives).length
            },
            xss: {
                enabled: this.securityHeaders.xss.enabled,
                mode: this.securityHeaders.xss.mode
            },
            frameOptions: {
                enabled: this.securityHeaders.frameOptions.enabled,
                action: this.securityHeaders.frameOptions.action
            }
        };
    }
}
exports.sslConfig = new SSLConfiguration();
//# sourceMappingURL=ssl.config.js.map