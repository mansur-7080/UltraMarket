import axios from 'axios';
import crypto from 'crypto';

export interface UzbekPaymentRequest {
  amount: number;
  orderId: string;
  description: string;
  returnUrl: string;
  method: 'click' | 'payme' | 'uzcard' | 'humo';
}

export interface UzbekPaymentResponse {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  message?: string;
}

export class UzbekPaymentService {
  private clickMerchantId: string;
  private clickSecretKey: string;
  private paymeId: string;
  private paymeKey: string;

  constructor() {
    this.clickMerchantId = process.env.CLICK_MERCHANT_ID || '';
    this.clickSecretKey = process.env.CLICK_SECRET_KEY || '';
    this.paymeId = process.env.PAYME_MERCHANT_ID || '';
    this.paymeKey = process.env.PAYME_KEY || '';
  }

  async processPayment(request: UzbekPaymentRequest): Promise<UzbekPaymentResponse> {
    switch (request.method) {
      case 'click':
        return this.processClickPayment(request);
      case 'payme':
        return this.processPaymePayment(request);
      case 'uzcard':
      case 'humo':
        return this.processCardPayment(request);
      default:
        throw new Error(`Unsupported payment method: ${request.method}`);
    }
  }

  private async processClickPayment(request: UzbekPaymentRequest): Promise<UzbekPaymentResponse> {
    try {
      // Click API integration
      const clickParams = {
        service_id: this.clickMerchantId,
        merchant_id: this.clickMerchantId,
        amount: request.amount,
        transaction_param: request.orderId,
        return_url: request.returnUrl,
        merchant_prepare_id: Date.now().toString(),
      };

      // Generate signature for Click
      const signString = [
        clickParams.service_id,
        clickParams.merchant_id,
        clickParams.amount,
        clickParams.transaction_param,
        clickParams.merchant_prepare_id,
        this.clickSecretKey,
      ].join('');

      const sign = crypto.createHash('md5').update(signString).digest('hex');

      const response = await axios.post('https://api.click.uz/v2/merchant/', {
        ...clickParams,
        sign,
      });

      return {
        success: true,
        paymentId: response.data.click_trans_id,
        paymentUrl: `https://my.click.uz/services/pay?service_id=${this.clickMerchantId}&merchant_id=${this.clickMerchantId}&amount=${request.amount}&transaction_param=${request.orderId}`,
        status: 'pending',
        message: "Click orqali to'lash uchun havola yaratildi",
      };
    } catch (error: any) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        message: `Click to'lov xatoligi: ${error.message}`,
      };
    }
  }

  private async processPaymePayment(request: UzbekPaymentRequest): Promise<UzbekPaymentResponse> {
    try {
      // Payme API integration
      const paymeUrl = `https://checkout.paycom.uz/${Buffer.from(this.paymeId).toString('base64')}`;
      const params = new URLSearchParams({
        m: this.paymeId,
        'ac.order_id': request.orderId,
        a: (request.amount * 100).toString(), // Payme tiyin hisoblaydi
        c: request.returnUrl,
        l: 'uz', // Til
      });

      const paymentUrl = `${paymeUrl}?${params.toString()}`;

      return {
        success: true,
        paymentId: `payme_${Date.now()}`,
        paymentUrl,
        status: 'pending',
        message: "Payme orqali to'lash uchun havola yaratildi",
      };
    } catch (error: any) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        message: `Payme to'lov xatoligi: ${error.message}`,
      };
    }
  }

  private async processCardPayment(request: UzbekPaymentRequest): Promise<UzbekPaymentResponse> {
    // Uzcard/Humo uchun umumiy karta to'lovi
    return {
      success: true,
      paymentId: `card_${Date.now()}`,
      status: 'pending',
      message: `${request.method.toUpperCase()} karta orqali to'lov`,
    };
  }

  // Click webhook handler
  async handleClickWebhook(data: any): Promise<{ success: boolean; message: string }> {
    try {
      // Click webhook ma'lumotlarini tekshirish
      const expectedSign = crypto
        .createHash('md5')
        .update(
          `${data.click_trans_id}${data.service_id}${this.clickSecretKey}${data.merchant_trans_id}${data.amount}${data.action}${data.sign_time}`
        )
        .digest('hex');

      if (data.sign_string !== expectedSign) {
        return { success: false, message: 'Invalid signature' };
      }

      // To'lov statusini yangilash
      if (data.action === 1) {
        // To'lov tasdiqlandi - log to monitoring service in production
        // Update order status in database
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Payme webhook handler
  async handlePaymeWebhook(data: any): Promise<{ success: boolean; message: string }> {
    try {
      // Payme webhook ma'lumotlarini qayta ishlash
      const { method, params } = data;

      switch (method) {
        case 'CheckPerformTransaction':
          return { success: true, message: 'Transaction can be performed' };
        case 'CreateTransaction':
          return { success: true, message: 'Transaction created' };
        case 'PerformTransaction':
          return { success: true, message: 'Transaction performed' };
        case 'CancelTransaction':
          return { success: true, message: 'Transaction cancelled' };
        default:
          return { success: false, message: 'Unknown method' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
