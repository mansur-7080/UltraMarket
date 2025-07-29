import axios, {AxiosResponse} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UzbekPaymentMethod} from '../../../../libs/shared/src/constants';

// Base configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://api.ultramarket.uz';
const PAYMENT_SERVICE_URL = `${API_BASE_URL}/payment`;

interface PaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  currency?: string;
  userId?: string;
}

interface PaymentResponse {
  success: boolean;
  data: {
    paymentId: string;
    paymentUrl: string;
    transactionId: string;
    status: string;
    qrCode?: string;
    deepLink?: string;
  };
  message: string;
  error?: string;
}

interface OrderConfirmRequest {
  orderId: string;
  paymentMethod: UzbekPaymentMethod;
  total: number;
  deliveryAddress?: any;
  notes?: string;
}

interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

interface PaymentMethod {
  id: UzbekPaymentMethod;
  name: string;
  description: string;
  fee: number;
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
}

class PaymentAPI {
  private static instance: PaymentAPI;
  private authToken: string | null = null;

  constructor() {
    this.loadAuthToken();
  }

  static getInstance(): PaymentAPI {
    if (!PaymentAPI.instance) {
      PaymentAPI.instance = new PaymentAPI();
    }
    return PaymentAPI.instance;
  }

  private async loadAuthToken(): Promise<void> {
    try {
      this.authToken = await AsyncStorage.getItem('authToken');
    } catch (error) {
      // Authentication error should be handled through proper error handling
    }
  }

  private async getHeaders(): Promise<Record<string, string>> {
    if (!this.authToken) {
      await this.loadAuthToken();
    }

    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: this.authToken ? `Bearer ${this.authToken}` : '',
      'X-Client': 'mobile-app',
      'X-Version': '1.0.0',
      'X-Platform': 'uzbekistan',
    };
  }

  private handleError(error: any): PaymentResponse {
          // Payment API error should be handled through proper error handling

    if (error.response) {
      return {
        success: false,
        data: {
          paymentId: '',
          paymentUrl: '',
          transactionId: '',
          status: 'failed',
        },
        message: error.response.data.message || "To'lov xatoligi",
        error: error.response.data.error,
      };
    }

    return {
      success: false,
      data: {
        paymentId: '',
        paymentUrl: '',
        transactionId: '',
        status: 'failed',
      },
      message: 'Tarmoq xatoligi. Internetni tekshiring.',
      error: 'NETWORK_ERROR',
    };
  }

  // ===========================================
  // CLICK PAYMENT METHODS
  // ===========================================

  async createClickPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${PAYMENT_SERVICE_URL}/click/create`,
        {
          ...request,
          currency: 'UZS',
          paymentMethod: UzbekPaymentMethod.CLICK,
          returnUrl: 'ultramarket://payment/success',
          cancelUrl: 'ultramarket://payment/cancel',
        },
        {headers},
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyClickPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${PAYMENT_SERVICE_URL}/click/verify`,
        {paymentId},
        {headers},
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ===========================================
  // PAYME PAYMENT METHODS
  // ===========================================

  async createPaymePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${PAYMENT_SERVICE_URL}/payme/create`,
        {
          ...request,
          currency: 'UZS',
          paymentMethod: UzbekPaymentMethod.PAYME,
          returnUrl: 'ultramarket://payment/success',
          cancelUrl: 'ultramarket://payment/cancel',
        },
        {headers},
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async checkPaymeStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<{success: boolean; data: PaymentStatus}> =
        await axios.get(`${PAYMENT_SERVICE_URL}/payme/status/${paymentId}`, {
          headers,
        });

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // ===========================================
  // UZCARD/HUMO CARD PAYMENTS
  // ===========================================

  async createCardPayment(
    request: PaymentRequest & {
      paymentMethod: UzbekPaymentMethod.UZCARD | UzbekPaymentMethod.HUMO;
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cardHolder: string;
    },
  ): Promise<PaymentResponse> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${PAYMENT_SERVICE_URL}/card/create`,
        {
          ...request,
          currency: 'UZS',
        },
        {headers},
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyCardOTP(
    paymentId: string,
    otpCode: string,
  ): Promise<PaymentResponse> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${PAYMENT_SERVICE_URL}/card/verify-otp`,
        {paymentId, otpCode},
        {headers},
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ===========================================
  // CASH ON DELIVERY
  // ===========================================

  async confirmOrder(request: OrderConfirmRequest): Promise<PaymentResponse> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${PAYMENT_SERVICE_URL}/cash/confirm`,
        {
          ...request,
          currency: 'UZS',
        },
        {headers},
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ===========================================
  // PAYMENT STATUS & HISTORY
  // ===========================================

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<{success: boolean; data: PaymentStatus}> =
        await axios.get(`${PAYMENT_SERVICE_URL}/status/${paymentId}`, {
          headers,
        });

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async getPaymentHistory(
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaymentStatus[]> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<{success: boolean; data: PaymentStatus[]}> =
        await axios.get(
          `${PAYMENT_SERVICE_URL}/history?limit=${limit}&offset=${offset}`,
          {headers},
        );

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // ===========================================
  // PAYMENT METHODS & FEES
  // ===========================================

  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<{success: boolean; data: PaymentMethod[]}> =
        await axios.get(`${PAYMENT_SERVICE_URL}/methods`, {headers});

      return response.data.data;
    } catch (error) {
      // Return default methods if API fails
      return [
        {
          id: UzbekPaymentMethod.CLICK,
          name: 'Click',
          description: "Click to'lov tizimi",
          fee: 0.5,
          enabled: true,
          minAmount: 1000,
          maxAmount: 50000000,
        },
        {
          id: UzbekPaymentMethod.PAYME,
          name: 'Payme',
          description: "Payme to'lov tizimi",
          fee: 0.5,
          enabled: true,
          minAmount: 1000,
          maxAmount: 50000000,
        },
        {
          id: UzbekPaymentMethod.UZCARD,
          name: 'Uzcard',
          description: 'Uzcard bank kartasi',
          fee: 1.0,
          enabled: true,
          minAmount: 1000,
          maxAmount: 10000000,
        },
        {
          id: UzbekPaymentMethod.HUMO,
          name: 'Humo',
          description: 'Humo bank kartasi',
          fee: 1.0,
          enabled: true,
          minAmount: 1000,
          maxAmount: 10000000,
        },
        {
          id: UzbekPaymentMethod.CASH_ON_DELIVERY,
          name: 'Naqd pul',
          description: "Yetkazib berganda to'lash",
          fee: 0,
          enabled: true,
          minAmount: 10000,
          maxAmount: 5000000,
        },
      ];
    }
  }

  async calculatePaymentFee(
    amount: number,
    paymentMethod: UzbekPaymentMethod,
  ): Promise<{fee: number; total: number}> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<{
        success: boolean;
        data: {fee: number; total: number};
      }> = await axios.post(
        `${PAYMENT_SERVICE_URL}/calculate-fee`,
        {amount, paymentMethod},
        {headers},
      );

      return response.data.data;
    } catch (error) {
      // Fallback calculation
      const methods = await this.getAvailablePaymentMethods();
      const method = methods.find(m => m.id === paymentMethod);
      const feePercent = method?.fee || 0;
      const fee = Math.round(amount * (feePercent / 100));

      return {
        fee,
        total: amount + fee,
      };
    }
  }

  // ===========================================
  // REFUND & CANCELLATION
  // ===========================================

  async cancelPayment(
    paymentId: string,
    reason?: string,
  ): Promise<PaymentResponse> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${PAYMENT_SERVICE_URL}/cancel`,
        {paymentId, reason},
        {headers},
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async requestRefund(
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentResponse> {
    try {
      const headers = await this.getHeaders();

      const response: AxiosResponse<PaymentResponse> = await axios.post(
        `${PAYMENT_SERVICE_URL}/refund`,
        {paymentId, amount, reason},
        {headers},
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ===========================================
  // CURRENCY & EXCHANGE
  // ===========================================

  async getExchangeRates(): Promise<{USD: number; EUR: number; RUB: number}> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: {USD: number; EUR: number; RUB: number};
      }> = await axios.get(`${API_BASE_URL}/currency/rates`);

      return response.data.data;
    } catch (error) {
      // Fallback rates
      return {
        USD: 12300,
        EUR: 13500,
        RUB: 135,
      };
    }
  }

  // ===========================================
  // ANALYTICS & TRACKING
  // ===========================================

  async trackPaymentEvent(
    event:
      | 'payment_started'
      | 'payment_completed'
      | 'payment_failed'
      | 'payment_cancelled',
    paymentMethod: UzbekPaymentMethod,
    amount: number,
    additionalData?: Record<string, any>,
  ): Promise<void> {
    try {
      const headers = await this.getHeaders();

      await axios.post(
        `${API_BASE_URL}/analytics/payment-event`,
        {
          event,
          paymentMethod,
          amount,
          timestamp: new Date().toISOString(),
          ...additionalData,
        },
        {headers},
      );
    } catch (error) {
      // Analytics tracking should not block payment flow
              // Analytics tracking failure should be handled silently
    }
  }
}

export default PaymentAPI.getInstance();
