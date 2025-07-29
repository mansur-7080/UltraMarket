"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorService = void 0;
const otplib_1 = require("otplib");
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
const email_service_1 = require("./email.service");
class TwoFactorService {
    redis;
    config;
    constructor() {
        this.config = {
            issuer: 'UltraMarket',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            window: 1
        };
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            this.redis = (0, redis_1.createClient)({
                url: process.env['REDIS_URL'] || 'redis://localhost:6379'
            });
            await this.redis.connect();
            logger_1.logger.info('🔐 2FA service Redis connected');
        }
        catch (error) {
            logger_1.logger.error('❌ 2FA service Redis connection failed:', error);
        }
    }
    async generateTOTPSecret(userId, email) {
        try {
            const secret = otplib_1.authenticator.generateSecret();
            const otpauth = otplib_1.authenticator.keyuri(email, this.config.issuer, secret);
            const backupCodes = this.generateBackupCodes();
            await this.redis.setEx(`2fa:${userId}:secret`, 300, secret);
            await this.redis.setEx(`2fa:${userId}:backup_codes`, 86400, JSON.stringify(backupCodes));
            logger_1.logger.info('🔐 TOTP secret generated', { userId, email });
            return {
                secret,
                qrCode: otpauth,
                backupCodes
            };
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to generate TOTP secret:', error);
            throw error;
        }
    }
    async verifyTOTP(userId, token) {
        try {
            const secret = await this.redis.get(`2fa:${userId}:secret`);
            if (!secret) {
                return false;
            }
            const isValid = otplib_1.authenticator.verify({
                token,
                secret,
                window: this.config.window
            });
            if (isValid) {
                await this.redis.del(`2fa:${userId}:secret`);
                logger_1.logger.info('🔐 TOTP verification successful', { userId });
            }
            return isValid;
        }
        catch (error) {
            logger_1.logger.error('❌ TOTP verification failed:', error);
            return false;
        }
    }
    async generateSMSCode(userId, phone) {
        try {
            const code = this.generateRandomCode(6);
            const ttl = 300;
            await this.redis.setEx(`2fa:${userId}:sms:${phone}`, ttl, code);
            logger_1.logger.info('📱 SMS verification code generated', { userId, phone, code });
            return code;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to generate SMS code:', error);
            throw error;
        }
    }
    async verifySMSCode(userId, phone, code) {
        try {
            const storedCode = await this.redis.get(`2fa:${userId}:sms:${phone}`);
            if (!storedCode) {
                return false;
            }
            const isValid = storedCode === code;
            if (isValid) {
                await this.redis.del(`2fa:${userId}:sms:${phone}`);
                logger_1.logger.info('📱 SMS verification successful', { userId, phone });
            }
            return isValid;
        }
        catch (error) {
            logger_1.logger.error('❌ SMS verification failed:', error);
            return false;
        }
    }
    async generateEmailCode(userId, email, name) {
        try {
            const code = this.generateRandomCode(6);
            const ttl = 300;
            await this.redis.setEx(`2fa:${userId}:email:${email}`, ttl, code);
            await email_service_1.emailService.send2FACode(email, name, code);
            logger_1.logger.info('📧 Email verification code generated', { userId, email });
            return code;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to generate email code:', error);
            throw error;
        }
    }
    async verifyEmailCode(userId, email, code) {
        try {
            const storedCode = await this.redis.get(`2fa:${userId}:email:${email}`);
            if (!storedCode) {
                return false;
            }
            const isValid = storedCode === code;
            if (isValid) {
                await this.redis.del(`2fa:${userId}:email:${email}`);
                logger_1.logger.info('📧 Email verification successful', { userId, email });
            }
            return isValid;
        }
        catch (error) {
            logger_1.logger.error('❌ Email verification failed:', error);
            return false;
        }
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(this.generateRandomCode(8));
        }
        return codes;
    }
    async verifyBackupCode(userId, code) {
        try {
            const backupCodesJson = await this.redis.get(`2fa:${userId}:backup_codes`);
            if (!backupCodesJson) {
                return false;
            }
            const backupCodes = JSON.parse(backupCodesJson);
            const codeIndex = backupCodes.indexOf(code);
            if (codeIndex === -1) {
                return false;
            }
            backupCodes[codeIndex] = 'USED';
            await this.redis.setEx(`2fa:${userId}:backup_codes`, 86400, JSON.stringify(backupCodes));
            logger_1.logger.info('🔐 Backup code verification successful', { userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Backup code verification failed:', error);
            return false;
        }
    }
    generateRandomCode(length) {
        const chars = '0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    async enable2FA(userId, method, secret, contact) {
        try {
            const methodData = {
                id: `${userId}_${method.toLowerCase()}`,
                type: method,
                secret: method === 'TOTP' ? secret : undefined,
                phone: method === 'SMS' ? contact : undefined,
                email: method === 'EMAIL' ? contact : undefined,
                isEnabled: true,
                isVerified: true,
                createdAt: new Date()
            };
            await this.redis.setEx(`2fa:${userId}:method:${method}`, 0, JSON.stringify(methodData));
            logger_1.logger.info('🔐 2FA enabled', { userId, method });
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to enable 2FA:', error);
            return false;
        }
    }
    async disable2FA(userId, method) {
        try {
            await this.redis.del(`2fa:${userId}:method:${method}`);
            await this.redis.del(`2fa:${userId}:backup_codes`);
            logger_1.logger.info('🔐 2FA disabled', { userId, method });
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to disable 2FA:', error);
            return false;
        }
    }
    async is2FAEnabled(userId, method) {
        try {
            const methodData = await this.redis.get(`2fa:${userId}:method:${method}`);
            if (!methodData) {
                return false;
            }
            const data = JSON.parse(methodData);
            return data.isEnabled && data.isVerified;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to check 2FA status:', error);
            return false;
        }
    }
    async getUser2FAMethods(userId) {
        try {
            const methods = [];
            const methodTypes = ['TOTP', 'SMS', 'EMAIL'];
            for (const method of methodTypes) {
                const methodData = await this.redis.get(`2fa:${userId}:method:${method}`);
                if (methodData) {
                    methods.push(JSON.parse(methodData));
                }
            }
            return methods;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to get user 2FA methods:', error);
            return [];
        }
    }
    async getStats() {
        try {
            const keys = await this.redis.keys('2fa:*:method:*');
            const enabledCount = keys.length;
            return {
                enabledCount,
                totalUsers: Math.floor(enabledCount / 3),
                methods: {
                    TOTP: keys.filter((k) => k.includes(':method:TOTP')).length,
                    SMS: keys.filter((k) => k.includes(':method:SMS')).length,
                    EMAIL: keys.filter((k) => k.includes(':method:EMAIL')).length
                }
            };
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to get 2FA stats:', error);
            return null;
        }
    }
    async close() {
        try {
            if (this.redis) {
                await this.redis.quit();
                logger_1.logger.info('🔐 2FA service Redis closed');
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Error closing 2FA service connections', { error });
        }
    }
}
exports.twoFactorService = new TwoFactorService();
//# sourceMappingURL=two-factor.service.js.map