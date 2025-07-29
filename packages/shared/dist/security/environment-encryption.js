"use strict";
/**
 * Environment Variable Encryption & Security System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl hardcoded secrets va environment variables ni xavfsiz boshqarish uchun
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureEnvironmentManager = void 0;
const tslib_1 = require("tslib");
const crypto = tslib_1.__importStar(require("crypto"));
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const logger_replacement_1 = require("../utils/logger-replacement");
const securityLogger = (0, logger_replacement_1.createLogger)('security-env-manager');
class SecureEnvironmentManager {
    config;
    encryptedVars = new Map();
    decryptedCache = new Map();
    algorithm = 'aes-256-gcm';
    // Algorithm is used in encryption methods
    constructor(config) {
        this.config = config;
        this.validateEncryptionKey();
    }
    // ✅ Encrypt sensitive environment variables
    async encryptEnvironmentVar(key, value) {
        try {
            const iv = crypto.randomBytes(16);
            const keyBuffer = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
            const cipher = crypto.createCipher('aes-256-cbc', keyBuffer);
            let encrypted = cipher.update(value, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const result = `${iv.toString('hex')}:${encrypted}`;
            securityLogger.info('Environment variable encrypted', {
                key,
                encryptedLength: result.length,
                algorithm: 'aes-256-cbc'
            });
            return result;
        }
        catch (error) {
            securityLogger.error('Failed to encrypt environment variable', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Encryption failed for ${key}`);
        }
    }
    // ✅ Decrypt environment variables safely
    async decryptEnvironmentVar(key, encryptedValue) {
        try {
            // Check cache first
            if (this.decryptedCache.has(key)) {
                return this.decryptedCache.get(key);
            }
            const parts = encryptedValue.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted format');
            }
            const [, encrypted] = parts;
            const keyBuffer = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
            const decipher = crypto.createDecipher('aes-256-cbc', keyBuffer);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            // Cache the decrypted value
            this.decryptedCache.set(key, decrypted);
            securityLogger.debug('Environment variable decrypted successfully', {
                key,
                decryptedLength: decrypted.length
            });
            return decrypted;
        }
        catch (error) {
            securityLogger.error('Failed to decrypt environment variable', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Decryption failed for ${key}`);
        }
    }
    // ✅ Load and validate environment variables
    async loadSecureEnvironment() {
        try {
            const env = {
                database: {},
                security: {},
                external: {},
                system: {},
                uzbekistan: {}
            };
            // Load and validate required variables
            for (const varName of this.config.requiredVars) {
                const value = process.env[varName];
                if (!value) {
                    throw new Error(`Required environment variable ${varName} is missing`);
                }
                const processedValue = await this.processEnvVar(varName, value);
                this.assignToCategory(env, varName, processedValue);
            }
            // Load optional variables with defaults
            for (const varName of this.config.optionalVars) {
                const value = process.env[varName];
                if (value) {
                    const processedValue = await this.processEnvVar(varName, value);
                    this.assignToCategory(env, varName, processedValue);
                }
            }
            // Validate all loaded variables
            await this.validateEnvironment(env);
            securityLogger.info('Secure environment loaded successfully', {
                requiredVarsCount: this.config.requiredVars.length,
                optionalVarsCount: this.config.optionalVars.length,
                totalVarsLoaded: Object.keys(env).length
            });
            return env;
        }
        catch (error) {
            securityLogger.error('Failed to load secure environment', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    // ✅ Generate secure configuration template
    async generateSecureTemplate() {
        const template = `# UltraMarket Secure Environment Configuration
# Generated at ${new Date().toISOString()}

# ================================================================
# DATABASE CONFIGURATION (All encrypted in production)
# ================================================================

# PostgreSQL Settings
POSTGRES_HOST=localhost
POSTGRES_PORT=5432  
POSTGRES_DB=ultramarket_db
POSTGRES_USER=ultramarket_user
# ENCRYPTED: Use encryption utility to generate
POSTGRES_PASSWORD=\${ENCRYPTED:your_encrypted_password_here}

# MongoDB Settings  
# ENCRYPTED: Full connection string with credentials
MONGODB_URI=\${ENCRYPTED:your_encrypted_mongodb_uri}

# Redis Settings
REDIS_HOST=localhost
REDIS_PORT=6379
# ENCRYPTED: Redis password
REDIS_PASSWORD=\${ENCRYPTED:your_encrypted_redis_password}

# ================================================================
# SECURITY CONFIGURATION (All must be encrypted)
# ================================================================

# JWT Secrets (Must be 64+ characters)
# ENCRYPTED: Main JWT secret for access tokens
JWT_SECRET=\${ENCRYPTED:your_64_char_jwt_secret}

# ENCRYPTED: Refresh token secret
JWT_REFRESH_SECRET=\${ENCRYPTED:your_64_char_refresh_secret}

# ENCRYPTED: Encryption key for sensitive data
ENCRYPTION_KEY=\${ENCRYPTED:your_32_char_encryption_key}

# ENCRYPTED: Password hash salt
BCRYPT_SALT=\${ENCRYPTED:your_bcrypt_salt}

# ================================================================
# EXTERNAL SERVICES (All API keys encrypted)
# ================================================================

# Payment Services
# ENCRYPTED: Payme.uz credentials
PAYME_MERCHANT_ID=\${ENCRYPTED:payme_merchant_id}
PAYME_SECRET_KEY=\${ENCRYPTED:payme_secret_key}

# ENCRYPTED: Click.uz credentials
CLICK_MERCHANT_ID=\${ENCRYPTED:click_merchant_id}
CLICK_SECRET_KEY=\${ENCRYPTED:click_secret_key}

# Email Service
# ENCRYPTED: SMTP credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=\${ENCRYPTED:smtp_username}
SMTP_PASSWORD=\${ENCRYPTED:smtp_password}

# SMS Service
# ENCRYPTED: SMS provider credentials
SMS_API_KEY=\${ENCRYPTED:sms_api_key}
SMS_SECRET=\${ENCRYPTED:sms_secret}

# File Storage
# ENCRYPTED: AWS S3 or cloud storage credentials
AWS_ACCESS_KEY_ID=\${ENCRYPTED:aws_access_key}
AWS_SECRET_ACCESS_KEY=\${ENCRYPTED:aws_secret_key}
AWS_REGION=us-east-1
AWS_S3_BUCKET=ultramarket-files

# ================================================================
# SYSTEM CONFIGURATION
# ================================================================

NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Rate limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Session settings
SESSION_TIMEOUT=3600000   # 1 hour
MAX_LOGIN_ATTEMPTS=5

# ================================================================  
# UZBEKISTAN SPECIFIC SETTINGS
# ================================================================

# Localization
DEFAULT_LANGUAGE=uz
SUPPORTED_LANGUAGES=uz,ru
TIMEZONE=Asia/Tashkent

# Currency
DEFAULT_CURRENCY=UZS
EXCHANGE_RATE_API=\${ENCRYPTED:exchange_api_key}

# Government integrations
# ENCRYPTED: Tax system integration
TAX_SYSTEM_API_KEY=\${ENCRYPTED:tax_api_key}

# ENCRYPTED: Business registry integration  
BUSINESS_REGISTRY_KEY=\${ENCRYPTED:registry_key}

# ================================================================
# MONITORING & LOGGING
# ================================================================

# Application monitoring
SENTRY_DSN=\${ENCRYPTED:sentry_dsn}
NEW_RELIC_LICENSE_KEY=\${ENCRYPTED:newrelic_key}

# Performance monitoring
ELASTICSEARCH_URL=\${ENCRYPTED:elasticsearch_url}
GRAFANA_API_KEY=\${ENCRYPTED:grafana_api_key}

# ================================================================
# PRODUCTION DEPLOYMENT SETTINGS
# ================================================================

# Load balancer settings
LOAD_BALANCER_SECRET=\${ENCRYPTED:lb_secret}

# Container orchestration
KUBERNETES_TOKEN=\${ENCRYPTED:k8s_token}

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/ultramarket.crt
SSL_KEY_PATH=/etc/ssl/private/ultramarket.key

# ================================================================
# INSTRUCTIONS
# ================================================================

# 1. Replace all \${ENCRYPTED:...} placeholders with actual encrypted values
# 2. Use the encryption utility: node scripts/encrypt-env.js
# 3. Never commit unencrypted secrets to version control
# 4. Store encryption keys separately in secure vault
# 5. Rotate secrets regularly (every 90 days minimum)
# 6. Monitor for environment variable leaks in logs

# For development environment, create .env.development with non-encrypted values
# For production, all sensitive values MUST be encrypted
`;
        // Write to file
        const templatePath = path.join(process.cwd(), 'config/environments/secure-template.env');
        await fs.promises.writeFile(templatePath, template, 'utf8');
        securityLogger.info('Secure environment template generated', {
            templatePath,
            templateSize: template.length
        });
        return template;
    }
    // ✅ Environment variable rotation
    async rotateSecrets(secretsToRotate) {
        const results = {
            successful: [],
            failed: [],
            backupCreated: false
        };
        try {
            // Create backup of current secrets
            await this.createSecretsBackup();
            results.backupCreated = true;
            for (const secretName of secretsToRotate) {
                try {
                    const newSecret = await this.generateNewSecret(secretName);
                    const encrypted = await this.encryptEnvironmentVar(secretName, newSecret);
                    // Store new encrypted secret
                    this.encryptedVars.set(secretName, encrypted);
                    // Clear from cache to force reload
                    this.decryptedCache.delete(secretName);
                    results.successful.push({
                        name: secretName,
                        rotatedAt: new Date().toISOString(),
                        encrypted: encrypted
                    });
                    securityLogger.info('Secret rotated successfully', {
                        secretName,
                        rotatedAt: new Date().toISOString()
                    });
                }
                catch (error) {
                    results.failed.push({
                        name: secretName,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    securityLogger.error('Failed to rotate secret', {
                        secretName,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            return results;
        }
        catch (error) {
            securityLogger.error('Secret rotation process failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                secretsToRotate
            });
            throw error;
        }
    }
    // Helper methods
    validateEncryptionKey() {
        if (!this.config.encryptionKey || this.config.encryptionKey.length < 32) {
            throw new Error('Encryption key must be at least 32 characters long');
        }
    }
    async processEnvVar(name, value) {
        // Handle encrypted variables
        if (value.startsWith('${ENCRYPTED:')) {
            const encryptedValue = value.slice(12, -1); // Remove ${ENCRYPTED: and }
            return await this.decryptEnvironmentVar(name, encryptedValue);
        }
        // Apply validation rules
        const rule = this.config.validationRules[name];
        if (rule) {
            this.validateVarValue(name, value, rule);
            // Type conversion
            if (rule.type === 'number')
                return parseInt(value);
            if (rule.type === 'boolean')
                return value === 'true';
        }
        return value;
    }
    assignToCategory(env, varName, value) {
        if (varName.includes('DATABASE') || varName.includes('POSTGRES') || varName.includes('MONGODB') || varName.includes('REDIS')) {
            env.database[varName] = value;
        }
        else if (varName.includes('JWT') || varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')) {
            env.security[varName] = value;
        }
        else if (varName.includes('API') || varName.includes('SMTP') || varName.includes('SMS') || varName.includes('AWS')) {
            env.external[varName] = value;
        }
        else if (varName.includes('UZ') || varName.includes('CURRENCY') || varName.includes('TAX')) {
            env.uzbekistan[varName] = value;
        }
        else {
            env.system[varName] = value;
        }
    }
    validateVarValue(name, value, rule) {
        if (rule.required && !value) {
            throw new Error(`Required variable ${name} is missing`);
        }
        if (rule.minLength && value.length < rule.minLength) {
            throw new Error(`Variable ${name} must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            throw new Error(`Variable ${name} must be no more than ${rule.maxLength} characters long`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
            throw new Error(`Variable ${name} does not match required pattern`);
        }
        if (rule.type === 'url' && !this.isValidUrl(value)) {
            throw new Error(`Variable ${name} must be a valid URL`);
        }
        if (rule.type === 'email' && !this.isValidEmail(value)) {
            throw new Error(`Variable ${name} must be a valid email address`);
        }
    }
    async validateEnvironment(env) {
        // Validate critical security requirements
        const criticalVars = ['JWT_SECRET', 'ENCRYPTION_KEY', 'POSTGRES_PASSWORD'];
        for (const varName of criticalVars) {
            let found = false;
            for (const category of Object.values(env)) {
                if (category[varName]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new Error(`Critical security variable ${varName} is missing`);
            }
        }
    }
    async createSecretsBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            secrets: Object.fromEntries(this.encryptedVars)
        };
        const backupPath = path.join(process.cwd(), `backups/secrets-${Date.now()}.json`);
        await fs.promises.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf8');
    }
    async generateNewSecret(type) {
        switch (type) {
            case 'JWT_SECRET':
            case 'JWT_REFRESH_SECRET':
                return crypto.randomBytes(64).toString('hex');
            case 'ENCRYPTION_KEY':
                return crypto.randomBytes(32).toString('hex');
            default:
                return crypto.randomBytes(32).toString('base64');
        }
    }
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.SecureEnvironmentManager = SecureEnvironmentManager;
// Export the manager
exports.default = SecureEnvironmentManager;
/**
 * USAGE EXAMPLES:
 *
 * // Initialize secure environment manager
 * const envManager = new SecureEnvironmentManager({
 *   encryptionKey: process.env.MASTER_ENCRYPTION_KEY!,
 *   envFilePath: '.env.production',
 *   requiredVars: ['JWT_SECRET', 'POSTGRES_PASSWORD', 'ENCRYPTION_KEY'],
 *   optionalVars: ['REDIS_PASSWORD', 'SMTP_PASSWORD'],
 *   validationRules: {
 *     JWT_SECRET: { minLength: 64, required: true },
 *     POSTGRES_PASSWORD: { minLength: 16, required: true }
 *   }
 * });
 *
 * // Load secure environment
 * const env = await envManager.loadSecureEnvironment();
 *
 * // Encrypt a secret
 * const encrypted = await envManager.encryptEnvironmentVar('NEW_SECRET', 'secret_value');
 *
 * // Rotate secrets
 * const rotationResult = await envManager.rotateSecrets(['JWT_SECRET', 'ENCRYPTION_KEY']);
 */ 
//# sourceMappingURL=environment-encryption.js.map