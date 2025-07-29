"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const shared_1 = require("@ultramarket/shared");
class ClickService {
    merchantId;
    serviceId;
    secretKey;
    userId;
    baseUrl;
    constructor() {
        this.merchantId = process.env.CLICK_MERCHANT_ID || '';
        this.serviceId = process.env.CLICK_SERVICE_ID || '';
        this.secretKey = process.env.CLICK_SECRET_KEY || '';
        this.userId = process.env.CLICK_USER_ID || '';
        this.baseUrl = process.env.CLICK_ENDPOINT || 'https://api.click.uz/v2';
        if (!this.merchantId || !this.serviceId || !this.secretKey || !this.userId) {
            throw new Error('Click payment gateway configuration is missing');
        }
    }
    async createPayment(request) {
        try {
            shared_1.logger.info('Creating Click payment', {
                orderId: request.orderId,
                amount: request.amount,
                userId: request.userId,
            });
            const paymentUrl = this.generatePaymentUrl(request);
            return {
                success: true,
                paymentUrl,
                transactionId: request.merchantTransId,
            };
        }
        catch (error) {
            shared_1.logger.error('Click payment creation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                orderId: request.orderId,
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Payment creation failed',
            };
        }
    }
    generatePaymentUrl(request) {
        const params = new URLSearchParams({
            service_id: this.serviceId,
            merchant_id: this.merchantId,
            amount: request.amount.toString(),
            transaction_param: request.merchantTransId,
            return_url: request.returnUrl,
            cancel_url: request.cancelUrl,
        });
        return `${this.baseUrl}/services/pay?${params.toString()}`;
    }
    async handlePrepare(payload) {
        try {
            shared_1.logger.info('Handling Click PREPARE webhook', {
                clickTransId: payload.click_trans_id,
                merchantTransId: payload.merchant_trans_id,
                amount: payload.amount,
            });
            if (!this.verifySignature(payload)) {
                shared_1.logger.error('Click webhook signature verification failed', {
                    clickTransId: payload.click_trans_id,
                });
                return {
                    click_trans_id: payload.click_trans_id,
                    merchant_trans_id: payload.merchant_trans_id,
                    merchant_prepare_id: '',
                    error: -1,
                    error_note: 'Invalid signature',
                };
            }
            const orderValid = await this.verifyOrder(payload.merchant_trans_id, payload.amount);
            if (!orderValid) {
                shared_1.logger.error('Click order verification failed', {
                    merchantTransId: payload.merchant_trans_id,
                    amount: payload.amount,
                });
                return {
                    click_trans_id: payload.click_trans_id,
                    merchant_trans_id: payload.merchant_trans_id,
                    merchant_prepare_id: '',
                    error: -5,
                    error_note: 'Order not found or amount mismatch',
                };
            }
            const merchantPrepareId = this.generateMerchantPrepareId(payload.merchant_trans_id);
            await this.storePrepareTransaction(payload, merchantPrepareId);
            shared_1.logger.info('Click PREPARE successful', {
                clickTransId: payload.click_trans_id,
                merchantPrepareId,
            });
            return {
                click_trans_id: payload.click_trans_id,
                merchant_trans_id: payload.merchant_trans_id,
                merchant_prepare_id: merchantPrepareId,
                error: 0,
                error_note: 'Success',
            };
        }
        catch (error) {
            shared_1.logger.error('Click PREPARE handler error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                clickTransId: payload.click_trans_id,
            });
            return {
                click_trans_id: payload.click_trans_id,
                merchant_trans_id: payload.merchant_trans_id,
                merchant_prepare_id: '',
                error: -1,
                error_note: 'Internal error',
            };
        }
    }
    async handleComplete(payload) {
        try {
            shared_1.logger.info('Handling Click COMPLETE webhook', {
                clickTransId: payload.click_trans_id,
                merchantTransId: payload.merchant_trans_id,
                amount: payload.amount,
            });
            if (!this.verifySignature(payload)) {
                shared_1.logger.error('Click webhook signature verification failed', {
                    clickTransId: payload.click_trans_id,
                });
                return {
                    click_trans_id: payload.click_trans_id,
                    merchant_trans_id: payload.merchant_trans_id,
                    error: -1,
                    error_note: 'Invalid signature',
                };
            }
            const prepareExists = await this.verifyPrepareTransaction(payload.click_trans_id, payload.merchant_prepare_id);
            if (!prepareExists) {
                shared_1.logger.error('Click prepare transaction not found', {
                    clickTransId: payload.click_trans_id,
                    merchantPrepareId: payload.merchant_prepare_id,
                });
                return {
                    click_trans_id: payload.click_trans_id,
                    merchant_trans_id: payload.merchant_trans_id,
                    error: -6,
                    error_note: 'Transaction not found',
                };
            }
            await this.completePayment(payload);
            shared_1.logger.info('Click COMPLETE successful', {
                clickTransId: payload.click_trans_id,
                merchantTransId: payload.merchant_trans_id,
            });
            return {
                click_trans_id: payload.click_trans_id,
                merchant_trans_id: payload.merchant_trans_id,
                error: 0,
                error_note: 'Success',
            };
        }
        catch (error) {
            shared_1.logger.error('Click COMPLETE handler error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                clickTransId: payload.click_trans_id,
            });
            return {
                click_trans_id: payload.click_trans_id,
                merchant_trans_id: payload.merchant_trans_id,
                error: -1,
                error_note: 'Internal error',
            };
        }
    }
    verifySignature(payload) {
        const signString = this.generateSignString(payload);
        const hash = crypto_1.default.createHash('md5').update(signString).digest('hex');
        return hash === payload.sign_string;
    }
    generateSignString(payload) {
        return [
            payload.click_trans_id,
            payload.service_id,
            this.secretKey,
            payload.merchant_trans_id,
            payload.merchant_prepare_id || '',
            payload.amount,
            payload.action,
            payload.sign_time,
        ].join('');
    }
    async verifyOrder(merchantTransId, amount) {
        try {
            shared_1.logger.info('Verifying order', { merchantTransId, amount });
            return true;
        }
        catch (error) {
            shared_1.logger.error('Order verification failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                merchantTransId,
            });
            return false;
        }
    }
    generateMerchantPrepareId(merchantTransId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${merchantTransId}_${timestamp}_${random}`;
    }
    async storePrepareTransaction(payload, merchantPrepareId) {
        try {
            shared_1.logger.info('Storing prepare transaction', {
                clickTransId: payload.click_trans_id,
                merchantTransId: payload.merchant_trans_id,
                merchantPrepareId,
                amount: payload.amount,
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to store prepare transaction', {
                error: error instanceof Error ? error.message : 'Unknown error',
                clickTransId: payload.click_trans_id,
            });
            throw error;
        }
    }
    async verifyPrepareTransaction(clickTransId, merchantPrepareId) {
        try {
            shared_1.logger.info('Verifying prepare transaction', {
                clickTransId,
                merchantPrepareId,
            });
            return true;
        }
        catch (error) {
            shared_1.logger.error('Failed to verify prepare transaction', {
                error: error instanceof Error ? error.message : 'Unknown error',
                clickTransId,
            });
            return false;
        }
    }
    async completePayment(payload) {
        try {
            shared_1.logger.info('Completing payment', {
                clickTransId: payload.click_trans_id,
                merchantTransId: payload.merchant_trans_id,
                amount: payload.amount,
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to complete payment', {
                error: error instanceof Error ? error.message : 'Unknown error',
                clickTransId: payload.click_trans_id,
            });
            throw error;
        }
    }
    async getPaymentStatus(transactionId) {
        try {
            shared_1.logger.info('Getting payment status', { transactionId });
            return {
                status: 'pending',
            };
        }
        catch (error) {
            shared_1.logger.error('Failed to get payment status', {
                error: error instanceof Error ? error.message : 'Unknown error',
                transactionId,
            });
            return {
                status: 'failed',
                error: 'Status check failed',
            };
        }
    }
}
exports.ClickService = ClickService;
//# sourceMappingURL=click.service.js.map