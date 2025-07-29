export interface PaymePaymentRequest {
    amount: number;
    orderId: string;
    userId: string;
    description: string;
    returnUrl: string;
    cancelUrl: string;
    merchantTransId: string;
}
export interface PaymePaymentResponse {
    success: boolean;
    paymentUrl?: string;
    transactionId?: string;
    error?: string;
}
export interface PaymeWebhookPayload {
    method: string;
    params: {
        id?: string;
        time?: number;
        amount?: number;
        account?: {
            order_id: string;
        };
        reason?: number;
    };
    id: string;
}
export interface PaymeTransaction {
    id: string;
    time: number;
    amount: number;
    account: {
        order_id: string;
    };
    create_time?: number;
    perform_time?: number;
    cancel_time?: number;
    state: number;
    reason?: number;
}
export declare class PaymeService {
    private readonly merchantId;
    private readonly secretKey;
    private readonly endpoint;
    private readonly testMode;
    constructor();
    createPayment(request: PaymePaymentRequest): Promise<PaymePaymentResponse>;
    private generatePaymentUrl;
    checkPerformTransaction(payload: PaymeWebhookPayload): Promise<{
        allow: boolean;
        detail?: {
            receipt_type: number;
            items: Array<{
                title: string;
                price: number;
                count: number;
                code: string;
                units: number;
                vat_percent: number;
                package_code: string;
            }>;
        };
    }>;
    createTransaction(payload: PaymeWebhookPayload): Promise<{
        create_time: number;
        transaction: string;
        state: number;
    }>;
    performTransaction(payload: PaymeWebhookPayload): Promise<{
        perform_time: number;
        transaction: string;
        state: number;
    }>;
    cancelTransaction(payload: PaymeWebhookPayload): Promise<{
        cancel_time: number;
        transaction: string;
        state: number;
    }>;
    checkTransaction(payload: PaymeWebhookPayload): Promise<{
        create_time: number;
        perform_time?: number;
        cancel_time?: number;
        transaction: string;
        state: number;
        reason?: number;
    }>;
    private verifyOrder;
    private getOrderDetails;
    private storeTransaction;
    private getTransaction;
    private updateTransaction;
    private completeOrder;
    private refundOrder;
    private sendOrderCompletionNotifications;
    private sendRefundNotifications;
    private logRefundForAccounting;
    verifyWebhookSignature(payload: string, signature: string): boolean;
}
//# sourceMappingURL=payme.service.d.ts.map