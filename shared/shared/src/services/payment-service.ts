/**
 * 💳 PAYMENT SERVICE - UltraMarket
 * 
 * Professional payment service implementation
 * Supports Click, Payme, Apelsin, and Stripe
 * 
 * @author UltraMarket Payment Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import crypto from 'crypto';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getValidatedEnv } from '../config/environment-validator';

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
  provider: 'click' | 'payme' | 'apelsin' | 'stripe';
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  redirectUrl?: string;
  checkoutUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  orderId: string;
  provider: string;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerification {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'cancelled' | 'pending';
  customerId: string;
  customerEmail: string;
  timestamp: Date;
  provider: string;
  transactionId?: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  isEnabled: boolean;
  environment: 'test' | 'production';
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(paymentId: string, signature?: string): Promise<PaymentVerification>;
  refundPayment(paymentId: string, amount?: number): Promise<boolean>;
}

export class ClickPaymentProvider implements PaymentProvider {
  public name = 'Click';
  public isEnabled: boolean;
  public environment: 'test' | 'production';
  
  private serviceId: string;
  private merchantId: string;
  private secretKey: string;
  private apiUrl: string;
  private httpClient: AxiosInstance;

  constructor() {
    const env = getValidatedEnv();
    this.serviceId = env.CLICK_SERVICE_ID;
    this.merchantId = env.CLICK_MERCHANT_ID;
    this.secretKey = env.CLICK_SECRET_KEY;
    this.environment = env.CLICK_ENVIRONMENT;
    this.isEnabled = !!this.serviceId && !!this.merchantId && !!this.secretKey;
    
    this.apiUrl = this.environment === 'production' 
      ? 'https://api.click.uz/v2/merchant'
      : 'https://test.click.uz/v2/merchant';
    
    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.isEnabled) {
        throw new Error('Click payment provider is not configured');
      }

      const paymentId = this.generatePaymentId();
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Click payment request parameters
      const clickRequest: Record<string, any> = {
        service_id: this.serviceId,
        merchant_id: this.merchantId,
        amount: request.amount,
        currency: request.currency === 'UZS' ? '860' : '840', // Click uses numeric codes
        transaction_param: request.orderId,
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl,
        merchant_user_id: request.customerId,
        merchant_service_id: this.serviceId,
        merchant_transaction_id: paymentId,
        merchant_prepare_id: paymentId,
        merchant_confirm_id: paymentId,
        merchant_cancel_id: paymentId,
        merchant_redirect_url: request.returnUrl,
        merchant_redirect_timeout: 300, // 5 minutes
        merchant_redirect_method: 'POST',
        merchant_redirect_params: JSON.stringify({
          order_id: request.orderId,
          customer_id: request.customerId,
          customer_email: request.customerEmail,
          amount: request.amount,
          currency: request.currency,
          description: request.description,
          ...request.metadata
        })
      };

      // Generate signature
      const signature = this.generateSignature(clickRequest, timestamp);
      clickRequest['sign_time'] = timestamp;
      clickRequest['sign_string'] = signature;

      // Make API request to Click
      const response: AxiosResponse = await this.httpClient.post('/payment/create', clickRequest);
      
      if (response.data.error_code === '0') {
        return {
          success: true,
          paymentId: paymentId,
          redirectUrl: response.data.pay_url,
          status: 'pending',
          amount: request.amount,
          currency: request.currency,
          orderId: request.orderId,
          provider: this.name,
          timestamp: new Date(),
          metadata: {
            click_transaction_id: response.data.transaction_id,
            click_pay_url: response.data.pay_url
          }
        };
      } else {
        throw new Error(`Click API error: ${response.data.error_note}`);
      }
    } catch (error) {
      console.error('Click payment creation error:', error);
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        provider: this.name,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async verifyPayment(paymentId: string, signature?: string): Promise<PaymentVerification> {
    try {
      if (!this.isEnabled) {
        throw new Error('Click payment provider is not configured');
      }

      // Click verification request
      const verifyRequest: Record<string, any> = {
        service_id: this.serviceId,
        merchant_id: this.merchantId,
        merchant_transaction_id: paymentId,
        merchant_prepare_id: paymentId,
        merchant_confirm_id: paymentId,
        merchant_cancel_id: paymentId
      };

      // Generate signature for verification
      const timestamp = Math.floor(Date.now() / 1000);
      const verifySignature = this.generateSignature(verifyRequest, timestamp);
      verifyRequest['sign_time'] = timestamp;
      verifyRequest['sign_string'] = verifySignature;

      // Make API request to verify payment
      const response: AxiosResponse = await this.httpClient.post('/payment/status', verifyRequest);
      
      if (response.data.error_code === '0') {
        const status = this.mapClickStatus(response.data.status);
        return {
          success: true,
          paymentId: paymentId,
          orderId: response.data.transaction_param,
          amount: response.data.amount,
          currency: response.data.currency === '860' ? 'UZS' : 'USD',
          status: status,
          customerId: response.data.merchant_user_id,
          customerEmail: '', // Click doesn't return email
          timestamp: new Date(),
          provider: this.name,
          transactionId: response.data.transaction_id
        };
      } else {
        throw new Error(`Click verification error: ${response.data.error_note}`);
      }
    } catch (error) {
      console.error('Click payment verification error:', error);
      return {
        success: false,
        paymentId: paymentId,
        orderId: '',
        amount: 0,
        currency: '',
        status: 'failed',
        customerId: '',
        customerEmail: '',
        timestamp: new Date(),
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      if (!this.isEnabled) {
        throw new Error('Click payment provider is not configured');
      }

      // Click refund request
      const refundRequest: Record<string, any> = {
        service_id: this.serviceId,
        merchant_id: this.merchantId,
        merchant_transaction_id: paymentId,
        amount: amount || 0 // Full refund if amount not specified
      };

      // Generate signature for refund
      const timestamp = Math.floor(Date.now() / 1000);
      const refundSignature = this.generateSignature(refundRequest, timestamp);
      refundRequest['sign_time'] = timestamp;
      refundRequest['sign_string'] = refundSignature;

      // Make API request to refund payment
      const response: AxiosResponse = await this.httpClient.post('/payment/refund', refundRequest);
      
      return response.data.error_code === '0';
    } catch (error) {
      console.error('Click payment refund error:', error);
      return false;
    }
  }

  private generatePaymentId(): string {
    return `click_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateSignature(data: Record<string, any>, timestamp: number): string {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
    const finalString = `${signString}&sign_time=${timestamp}`;
    
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(finalString)
      .digest('hex');
  }

  private mapClickStatus(clickStatus: string): 'completed' | 'failed' | 'cancelled' | 'pending' {
    switch (clickStatus) {
      case '2': return 'completed';
      case '3': return 'failed';
      case '4': return 'cancelled';
      default: return 'pending';
    }
  }
}

export class PaymePaymentProvider implements PaymentProvider {
  public name = 'Payme';
  public isEnabled: boolean;
  public environment: 'test' | 'production';
  
  private merchantId: string;
  private secretKey: string;
  private apiUrl: string;
  private httpClient: AxiosInstance;

  constructor() {
    const env = getValidatedEnv();
    this.merchantId = env.PAYME_MERCHANT_ID;
    this.secretKey = env.PAYME_SECRET_KEY;
    this.environment = env.PAYME_ENVIRONMENT;
    this.isEnabled = !!this.merchantId && !!this.secretKey;
    
    this.apiUrl = this.environment === 'production' 
      ? 'https://checkout.paycom.uz'
      : 'https://test.paycom.uz';
    
    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.isEnabled) {
        throw new Error('Payme payment provider is not configured');
      }

      const paymentId = this.generatePaymentId();
      
      // Payme payment request parameters
      const paymeRequest: Record<string, any> = {
        method: 'receipts.create',
        params: {
          amount: request.amount * 100, // Payme uses tiyin (1/100 of sum)
          currency: request.currency === 'UZS' ? '860' : '840',
          account: {
            order_id: request.orderId,
            customer_id: request.customerId,
            customer_email: request.customerEmail,
            customer_phone: request.customerPhone
          },
          description: request.description,
          callback_url: request.returnUrl,
          cancel_url: request.cancelUrl
        }
      };

      // Generate signature
      const signature = this.generateSignature(paymeRequest);
      paymeRequest['sign'] = signature;

      // Make API request to Payme
      const response: AxiosResponse = await this.httpClient.post('/api/receipts.create', paymeRequest);
      
      if (response.data.result && response.data.result.receipt) {
        const receipt = response.data.result.receipt;
        return {
          success: true,
          paymentId: paymentId,
          redirectUrl: `${this.apiUrl}/${receipt._id}`,
          status: 'pending',
          amount: request.amount,
          currency: request.currency,
          orderId: request.orderId,
          provider: this.name,
          timestamp: new Date(),
          metadata: {
            payme_receipt_id: receipt._id,
            payme_redirect_url: `${this.apiUrl}/${receipt._id}`
          }
        };
      } else {
        throw new Error(`Payme API error: ${response.data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Payme payment creation error:', error);
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        provider: this.name,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async verifyPayment(paymentId: string, signature?: string): Promise<PaymentVerification> {
    try {
      if (!this.isEnabled) {
        throw new Error('Payme payment provider is not configured');
      }

      // Payme verification request
      const verifyRequest: Record<string, any> = {
        method: 'receipts.get',
        params: {
          id: paymentId
        }
      };

      // Generate signature for verification
      const verifySignature = this.generateSignature(verifyRequest);
      verifyRequest['sign'] = verifySignature;

      // Make API request to verify payment
      const response: AxiosResponse = await this.httpClient.post('/api/receipts.get', verifyRequest);
      
      if (response.data.result && response.data.result.receipt) {
        const receipt = response.data.result.receipt;
        const status = this.mapPaymeStatus(receipt.status);
        
        return {
          success: true,
          paymentId: paymentId,
          orderId: receipt.account?.order_id || '',
          amount: receipt.amount / 100, // Convert from tiyin
          currency: receipt.currency === '860' ? 'UZS' : 'USD',
          status: status,
          customerId: receipt.account?.customer_id || '',
          customerEmail: receipt.account?.customer_email || '',
          timestamp: new Date(),
          provider: this.name,
          transactionId: receipt._id
        };
      } else {
        throw new Error(`Payme verification error: ${response.data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Payme payment verification error:', error);
      return {
        success: false,
        paymentId: paymentId,
        orderId: '',
        amount: 0,
        currency: '',
        status: 'failed',
        customerId: '',
        customerEmail: '',
        timestamp: new Date(),
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    try {
      if (!this.isEnabled) {
        throw new Error('Payme payment provider is not configured');
      }

      // Payme refund request
      const refundRequest: Record<string, any> = {
        method: 'receipts.cancel',
        params: {
          id: paymentId,
          reason: 'Customer request'
        }
      };

      // Generate signature for refund
      const refundSignature = this.generateSignature(refundRequest);
      refundRequest['sign'] = refundSignature;

      // Make API request to refund payment
      const response: AxiosResponse = await this.httpClient.post('/api/receipts.cancel', refundRequest);
      
      return response.data.result && response.data.result.receipt;
    } catch (error) {
      console.error('Payme payment refund error:', error);
      return false;
    }
  }

  private generatePaymentId(): string {
    return `payme_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateSignature(data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys.map(key => `${key}=${JSON.stringify(data[key])}`).join('&');
    
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(signString)
      .digest('hex');
  }

  private mapPaymeStatus(paymeStatus: string): 'completed' | 'failed' | 'cancelled' | 'pending' {
    switch (paymeStatus) {
      case 'paid': return 'completed';
      case 'cancelled': return 'cancelled';
      case 'expired': return 'failed';
      default: return 'pending';
    }
  }
}

export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();
  private payments: Map<string, PaymentResponse> = new Map();

  constructor() {
    // Initialize payment providers
    const clickProvider = new ClickPaymentProvider();
    const paymeProvider = new PaymePaymentProvider();

    if (clickProvider.isEnabled) {
      this.providers.set('click', clickProvider);
    }

    if (paymeProvider.isEnabled) {
      this.providers.set('payme', paymeProvider);
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const provider = this.providers.get(request.provider);
      if (!provider) {
        throw new Error(`Payment provider '${request.provider}' is not available`);
      }

      const payment = await provider.createPayment(request);
      
      if (payment.success) {
        this.payments.set(payment.paymentId, payment);
      }

      return payment;
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        provider: request.provider,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async verifyPayment(paymentId: string, provider: string, signature?: string): Promise<PaymentVerification> {
    try {
      const paymentProvider = this.providers.get(provider);
      if (!paymentProvider) {
        throw new Error(`Payment provider '${provider}' is not available`);
      }

      return await paymentProvider.verifyPayment(paymentId, signature);
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        paymentId: paymentId,
        orderId: '',
        amount: 0,
        currency: '',
        status: 'failed',
        customerId: '',
        customerEmail: '',
        timestamp: new Date(),
        provider: provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async refundPayment(paymentId: string, provider: string, amount?: number): Promise<boolean> {
    try {
      const paymentProvider = this.providers.get(provider);
      if (!paymentProvider) {
        throw new Error(`Payment provider '${provider}' is not available`);
      }

      return await paymentProvider.refundPayment(paymentId, amount);
    } catch (error) {
      console.error('Payment refund error:', error);
      return false;
    }
  }

  getPayment(paymentId: string): PaymentResponse | undefined {
    return this.payments.get(paymentId);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  isProviderEnabled(provider: string): boolean {
    return this.providers.has(provider);
  }

  getProviderStatus(): Record<string, { enabled: boolean; environment: string }> {
    const status: Record<string, { enabled: boolean; environment: string }> = {};
    
    this.providers.forEach((provider, name) => {
      status[name] = {
        enabled: provider.isEnabled,
        environment: provider.environment
      };
    });

    return status;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export for testing
export { PaymentService as PaymentServiceClass }; 