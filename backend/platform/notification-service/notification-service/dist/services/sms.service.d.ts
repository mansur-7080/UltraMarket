export interface SMSData {
    to: string;
    message: string;
    from?: string;
    templateId?: string;
    variables?: Record<string, string>;
}
export interface SMSResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: string;
    cost?: number;
}
export interface ESKIZTokenResponse {
    message: string;
    data: {
        token: string;
    };
}
export interface ESKIZSendResponse {
    message: string;
    data: {
        id: number;
        message: string;
        status: string;
    };
}
export interface PlayMobileResponse {
    status: string;
    message_id?: string;
    error?: string;
}
export declare class SMSService {
    private eskizToken;
    private eskizTokenExpiry;
    private readonly eskizBaseUrl;
    private readonly playMobileBaseUrl;
    constructor();
    /**
     * Initialize SMS providers
     */
    private initializeProviders;
    /**
     * Send SMS using the best available provider
     */
    sendSMS(smsData: SMSData): Promise<SMSResult>;
    /**
     * Send SMS via ESKIZ
     */
    private sendViaESKIZ;
    /**
     * Send SMS via Play Mobile
     */
    private sendViaPlayMobile;
    /**
     * Refresh ESKIZ authentication token
     */
    private refreshESKIZToken;
    /**
     * Ensure ESKIZ token is valid
     */
    private ensureValidESKIZToken;
    /**
     * Normalize Uzbekistan phone number
     */
    private normalizePhoneNumber;
    /**
     * Validate Uzbekistan phone number
     */
    private isValidUzbekPhoneNumber;
    /**
     * Send bulk SMS
     */
    sendBulkSMS(smsDataList: SMSData[]): Promise<SMSResult[]>;
    /**
     * Get SMS delivery status
     */
    getDeliveryStatus(messageId: string, provider: string): Promise<any>;
    /**
     * Get ESKIZ delivery status
     */
    private getESKIZDeliveryStatus;
    /**
     * Get Play Mobile delivery status
     */
    private getPlayMobileDeliveryStatus;
    /**
     * Get SMS pricing
     */
    getSMSPricing(): Promise<any>;
    /**
     * Test SMS providers connectivity
     */
    testProviders(): Promise<{
        eskiz: boolean;
        playMobile: boolean;
    }>;
}
//# sourceMappingURL=sms.service.d.ts.map