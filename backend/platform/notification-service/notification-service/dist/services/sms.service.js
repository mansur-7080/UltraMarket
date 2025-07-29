"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class SMSService {
    constructor() {
        this.eskizToken = null;
        this.eskizTokenExpiry = null;
        this.eskizBaseUrl = 'https://notify.eskiz.uz/api';
        this.playMobileBaseUrl = 'https://send.smsxabar.uz/broker-api';
        this.initializeProviders();
    }
    /**
     * Initialize SMS providers
     */
    async initializeProviders() {
        try {
            // Initialize ESKIZ token
            await this.refreshESKIZToken();
            logger_1.logger.info('SMS providers initialized successfully', {
                providers: ['ESKIZ', 'Play Mobile'],
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize SMS providers:', error);
        }
    }
    /**
     * Send SMS using the best available provider
     */
    async sendSMS(smsData) {
        try {
            // Validate phone number format
            const phoneNumber = this.normalizePhoneNumber(smsData.to);
            if (!this.isValidUzbekPhoneNumber(phoneNumber)) {
                throw new Error('Invalid Uzbekistan phone number format');
            }
            // Try ESKIZ first (usually more reliable)
            try {
                const eskizResult = await this.sendViaESKIZ({
                    ...smsData,
                    to: phoneNumber,
                });
                if (eskizResult.success) {
                    logger_1.logger.info('SMS sent successfully via ESKIZ', {
                        to: phoneNumber,
                        messageId: eskizResult.messageId,
                    });
                    return eskizResult;
                }
            }
            catch (eskizError) {
                logger_1.logger.warn('ESKIZ SMS failed, trying Play Mobile:', eskizError);
            }
            // Fallback to Play Mobile
            try {
                const playMobileResult = await this.sendViaPlayMobile({
                    ...smsData,
                    to: phoneNumber,
                });
                if (playMobileResult.success) {
                    logger_1.logger.info('SMS sent successfully via Play Mobile', {
                        to: phoneNumber,
                        messageId: playMobileResult.messageId,
                    });
                    return playMobileResult;
                }
            }
            catch (playMobileError) {
                logger_1.logger.error('Play Mobile SMS also failed:', playMobileError);
            }
            // Both providers failed
            throw new Error('All SMS providers failed');
        }
        catch (error) {
            logger_1.logger.error('SMS sending failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                provider: 'none',
            };
        }
    }
    /**
     * Send SMS via ESKIZ
     */
    async sendViaESKIZ(smsData) {
        try {
            // Ensure we have a valid token
            await this.ensureValidESKIZToken();
            const response = await axios_1.default.post(`${this.eskizBaseUrl}/message/sms/send`, {
                mobile_phone: smsData.to,
                message: smsData.message,
                from: smsData.from || process.env.ESKIZ_FROM || '4546',
            }, {
                headers: {
                    Authorization: `Bearer ${this.eskizToken}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            if (response.data.data && response.data.data.id) {
                return {
                    success: true,
                    messageId: response.data.data.id.toString(),
                    provider: 'ESKIZ',
                };
            }
            else {
                throw new Error(response.data.message || 'Unknown ESKIZ error');
            }
        }
        catch (error) {
            logger_1.logger.error('ESKIZ SMS error:', error);
            throw error;
        }
    }
    /**
     * Send SMS via Play Mobile
     */
    async sendViaPlayMobile(smsData) {
        try {
            const response = await axios_1.default.post(`${this.playMobileBaseUrl}/send`, {
                messages: [
                    {
                        recipient: smsData.to,
                        'message-id': `msg_${Date.now()}`,
                        sms: {
                            originator: smsData.from || process.env.PLAY_MOBILE_FROM || 'UltraMarket',
                            content: {
                                text: smsData.message,
                            },
                        },
                    },
                ],
            }, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${process.env.PLAY_MOBILE_LOGIN}:${process.env.PLAY_MOBILE_PASSWORD}`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            if (response.data.status === 'ok' && response.data.message_id) {
                return {
                    success: true,
                    messageId: response.data.message_id,
                    provider: 'Play Mobile',
                };
            }
            else {
                throw new Error(response.data.error || 'Unknown Play Mobile error');
            }
        }
        catch (error) {
            logger_1.logger.error('Play Mobile SMS error:', error);
            throw error;
        }
    }
    /**
     * Refresh ESKIZ authentication token
     */
    async refreshESKIZToken() {
        try {
            const response = await axios_1.default.post(`${this.eskizBaseUrl}/auth/login`, {
                email: process.env.ESKIZ_EMAIL,
                password: process.env.ESKIZ_PASSWORD,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            if (response.data.data && response.data.data.token) {
                this.eskizToken = response.data.data.token;
                this.eskizTokenExpiry = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000); // 29 days
                logger_1.logger.info('ESKIZ token refreshed successfully');
            }
            else {
                throw new Error('Failed to get ESKIZ token');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh ESKIZ token:', error);
            throw error;
        }
    }
    /**
     * Ensure ESKIZ token is valid
     */
    async ensureValidESKIZToken() {
        if (!this.eskizToken || !this.eskizTokenExpiry || this.eskizTokenExpiry < new Date()) {
            await this.refreshESKIZToken();
        }
    }
    /**
     * Normalize Uzbekistan phone number
     */
    normalizePhoneNumber(phoneNumber) {
        // Remove all non-digit characters
        let normalized = phoneNumber.replace(/\D/g, '');
        // Handle different formats
        if (normalized.startsWith('998')) {
            return `+${normalized}`;
        }
        else if (normalized.startsWith('8')) {
            return `+99${normalized}`;
        }
        else if (normalized.length === 9) {
            return `+998${normalized}`;
        }
        else if (normalized.length === 12 && normalized.startsWith('998')) {
            return `+${normalized}`;
        }
        return `+998${normalized}`;
    }
    /**
     * Validate Uzbekistan phone number
     */
    isValidUzbekPhoneNumber(phoneNumber) {
        // Uzbekistan phone number pattern: +998XXXXXXXXX
        const uzbekPattern = /^\+998[0-9]{9}$/;
        return uzbekPattern.test(phoneNumber);
    }
    /**
     * Send bulk SMS
     */
    async sendBulkSMS(smsDataList) {
        const results = [];
        // Process in batches to avoid overwhelming the providers
        const batchSize = 10;
        for (let i = 0; i < smsDataList.length; i += batchSize) {
            const batch = smsDataList.slice(i, i + batchSize);
            const batchPromises = batch.map(async (smsData) => {
                try {
                    return await this.sendSMS(smsData);
                }
                catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        provider: 'none',
                    };
                }
            });
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            // Small delay between batches
            if (i + batchSize < smsDataList.length) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        logger_1.logger.info('Bulk SMS completed', {
            total: smsDataList.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
        });
        return results;
    }
    /**
     * Get SMS delivery status
     */
    async getDeliveryStatus(messageId, provider) {
        try {
            if (provider === 'ESKIZ') {
                return await this.getESKIZDeliveryStatus(messageId);
            }
            else if (provider === 'Play Mobile') {
                return await this.getPlayMobileDeliveryStatus(messageId);
            }
            else {
                throw new Error('Unknown SMS provider');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to get delivery status:', error);
            throw error;
        }
    }
    /**
     * Get ESKIZ delivery status
     */
    async getESKIZDeliveryStatus(messageId) {
        await this.ensureValidESKIZToken();
        const response = await axios_1.default.get(`${this.eskizBaseUrl}/message/sms/status/${messageId}`, {
            headers: {
                Authorization: `Bearer ${this.eskizToken}`,
            },
            timeout: 10000,
        });
        return response.data;
    }
    /**
     * Get Play Mobile delivery status
     */
    async getPlayMobileDeliveryStatus(messageId) {
        const response = await axios_1.default.get(`${this.playMobileBaseUrl}/dlr/${messageId}`, {
            headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.PLAY_MOBILE_LOGIN}:${process.env.PLAY_MOBILE_PASSWORD}`).toString('base64')}`,
            },
            timeout: 10000,
        });
        return response.data;
    }
    /**
     * Get SMS pricing
     */
    async getSMSPricing() {
        try {
            await this.ensureValidESKIZToken();
            const response = await axios_1.default.get(`${this.eskizBaseUrl}/user/get-limit`, {
                headers: {
                    Authorization: `Bearer ${this.eskizToken}`,
                },
                timeout: 10000,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get SMS pricing:', error);
            throw error;
        }
    }
    /**
     * Test SMS providers connectivity
     */
    async testProviders() {
        const results = {
            eskiz: false,
            playMobile: false,
        };
        // Test ESKIZ
        try {
            await this.ensureValidESKIZToken();
            results.eskiz = true;
        }
        catch (error) {
            logger_1.logger.error('ESKIZ test failed:', error);
        }
        // Test Play Mobile (basic connectivity test)
        try {
            await axios_1.default.get(`${this.playMobileBaseUrl}/ping`, {
                timeout: 5000,
            });
            results.playMobile = true;
        }
        catch (error) {
            logger_1.logger.error('Play Mobile test failed:', error);
        }
        return results;
    }
}
exports.SMSService = SMSService;
//# sourceMappingURL=sms.service.js.map