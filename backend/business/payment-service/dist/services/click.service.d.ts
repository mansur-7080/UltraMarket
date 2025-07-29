export interface ClickPaymentRequest {
    amount: number;
    orderId: string;
    userId: string;
    description: string;
    returnUrl: string;
    cancelUrl: string;
    merchantTransId: string;
}
export interface ClickPaymentResponse {
    success: boolean;
    paymentUrl?: string;
    transactionId?: string;
    error?: string;
}
export interface ClickWebhookPayload {
    click_trans_id: string;
    service_id: string;
    click_paydoc_id: string;
    merchant_trans_id: string;
    merchant_prepare_id: string;
    amount: number;
    action: number;
    error: number;
    error_note: string;
    sign_time: string;
    sign_string: string;
}
export declare class ClickService {
    private readonly merchantId;
    private readonly serviceId;
    private readonly secretKey;
    private readonly userId;
    private readonly baseUrl;
    constructor();
    createPayment(request: ClickPaymentRequest): Promise<ClickPaymentResponse>;
    private generatePaymentUrl;
    handlePrepare(payload: ClickWebhookPayload): Promise<{
        click_trans_id: string;
        merchant_trans_id: string;
        merchant_prepare_id: string;
        error: number;
        error_note: string;
    }>;
    handleComplete(payload: ClickWebhookPayload): Promise<{
        click_trans_id: string;
        merchant_trans_id: string;
        error: number;
        error_note: string;
    }>;
    private verifySignature;
    private generateSignString;
    private verifyOrder;
    private generateMerchantPrepareId;
    private storePrepareTransaction;
    private verifyPrepareTransaction;
    private completePayment;
    getPaymentStatus(transactionId: string): Promise<{
        status: 'pending' | 'completed' | 'failed' | 'cancelled';
        amount?: number;
        error?: string;
    }>;
}
//# sourceMappingURL=click.service.d.ts.map