import Stripe from 'stripe';
import { PaymentMethod, PaymentStatus, Currency } from '../types/payment.types';
import { logger } from '@ultramarket/shared';
import { createError } from '@ultramarket/shared';
import { PaymentModel } from '../models/Payment';
import { EventEmitter } from 'events';
import axios from 'axios';

// O'zbekiston Payment Providers
interface ClickConfig {
  serviceId: string;
  merchantId: string;
  secretKey: string;
  environment: 'test' | 'production';
}

interface PaymeConfig {
  merchantId: string;
  secretKey: string;
  environment: 'test' | 'production';
}

interface ApelsinConfig {
  merchantId: string;
  secretKey: string;
  environment: 'test' | 'production';
}

interface UzbekPaymentOrder {
  id: string;
  status: string;
  amount: number;
  currency: string;
  merchantId: string;
  paymentUrl?: string;
  transactionId?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  orderId: string;
  userId: string;
  description?: string;
  metadata?: Record<string, any>;
  customer?: {
    email: string;
    name: string;
    phone?: string;
  };
  billing?: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  transactionId?: string;
  clientSecret?: string;
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export class PaymentService extends EventEmitter {
  private stripe: Stripe;
  private webhookSecret: string;
  private clickConfig: ClickConfig;
  private paymeConfig: PaymeConfig;
  private apelsinConfig: ApelsinConfig;

  constructor() {
    super();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    // O'zbekiston payment providers configuration
    this.clickConfig = {
      serviceId: process.env.CLICK_SERVICE_ID || '',
      merchantId: process.env.CLICK_MERCHANT_ID || '',
      secretKey: process.env.CLICK_SECRET_KEY || '',
      environment: (process.env.CLICK_ENVIRONMENT as 'test' | 'production') || 'test',
    };

    this.paymeConfig = {
      merchantId: process.env.PAYME_MERCHANT_ID || '',
      secretKey: process.env.PAYME_SECRET_KEY || '',
      environment: (process.env.PAYME_ENVIRONMENT as 'test' | 'production') || 'test',
    };

    this.apelsinConfig = {
      merchantId: process.env.APELSIN_MERCHANT_ID || '',
      secretKey: process.env.APELSIN_SECRET_KEY || '',
      environment: (process.env.APELSIN_ENVIRONMENT as 'test' | 'production') || 'test',
    };
  }

  /**
   * Process a payment
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info('Processing payment', { orderId: request.orderId, amount: request.amount });

      // Create payment record
      const payment = await PaymentModel.create({
        orderId: request.orderId,
        userId: request.userId,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        status: PaymentStatus.PENDING,
        description: request.description,
        metadata: request.metadata,
      });

      let response: PaymentResponse;

      switch (request.method) {
        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          response = await this.processCardPayment(payment.id, request);
          break;

        case PaymentMethod.PAYPAL:
          response = await this.processPayPalPayment(payment.id, request);
          break;

        case PaymentMethod.APPLE_PAY:
          response = await this.processApplePayPayment(payment.id, request);
          break;

        case PaymentMethod.GOOGLE_PAY:
          response = await this.processGooglePayPayment(payment.id, request);
          break;

        case PaymentMethod.BANK_TRANSFER:
          response = await this.processBankTransfer(payment.id, request);
          break;

        case PaymentMethod.CRYPTO:
          response = await this.processCryptoPayment(payment.id, request);
          break;

        default:
          throw createError(400, `Unsupported payment method: ${request.method}`);
      }

      // Update payment record
      await PaymentModel.findByIdAndUpdate(payment.id, {
        status: response.status,
        transactionId: response.transactionId,
        processedAt: response.status === PaymentStatus.COMPLETED ? new Date() : undefined,
      });

      // Emit payment event
      this.emit('payment.processed', {
        paymentId: payment.id,
        orderId: request.orderId,
        status: response.status,
        amount: request.amount,
        currency: request.currency,
      });

      return response;
    } catch (error) {
      logger.error('Payment processing failed', error);
      throw error;
    }
  }

  /**
   * Process card payment using Stripe
   */
  private async processCardPayment(
    paymentId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Create or retrieve customer
      let customerId: string | undefined;
      if (request.customer?.email) {
        const customers = await this.stripe.customers.list({
          email: request.customer.email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await this.stripe.customers.create({
            email: request.customer.email,
            name: request.customer.name,
            phone: request.customer.phone,
            metadata: {
              userId: request.userId,
            },
          });
          customerId = customer.id;
        }
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency.toLowerCase(),
        customer: customerId,
        description: request.description,
        metadata: {
          paymentId,
          orderId: request.orderId,
          userId: request.userId,
          ...request.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentId,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      logger.error('Stripe payment failed', error);
      throw createError(400, `Card payment failed: ${error.message}`);
    }
  }

  /**
   * Process PayPal payment using PayPal Orders API
   */
  private async processPayPalPayment(
    paymentId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      logger.info('Processing PayPal payment', {
        paymentId,
        orderId: request.orderId,
        amount: request.amount,
      });

      // Get PayPal access token
      const accessToken = await this.getPayPalAccessToken();

      // Create PayPal order
      const paypalOrder = await this.createPayPalOrder(accessToken, request);

      // Find approval link
      const approvalLink = paypalOrder.links.find((link) => link.rel === 'approve');
      if (!approvalLink) {
        throw createError(500, 'PayPal approval link not found');
      }

      logger.info('PayPal order created successfully', {
        paypalOrderId: paypalOrder.id,
        paymentId,
        status: paypalOrder.status,
      });

      return {
        id: paymentId,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        transactionId: paypalOrder.id,
        redirectUrl: approvalLink.href,
        metadata: {
          ...request.metadata,
          paypalOrderId: paypalOrder.id,
          paypalIntent: paypalOrder.intent,
        },
      };
    } catch (error) {
      logger.error('PayPal payment processing failed', error);
      throw createError(
        400,
        `PayPal payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get PayPal access token
   */
  private async getPayPalAccessToken(): Promise<string> {
    try {
      const authUrl =
        this.paypalConfig.environment === 'live'
          ? 'https://api-m.paypal.com/v1/oauth2/token'
          : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

      const response = await axios.post(authUrl, 'grant_type=client_credentials', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${this.paypalConfig.clientId}:${this.paypalConfig.clientSecret}`)}`,
        },
      });

      return response.data.access_token;
    } catch (error) {
      logger.error('Failed to get PayPal access token', error);
      throw createError(500, 'PayPal authentication failed');
    }
  }

  /**
   * Create PayPal order
   */
  private async createPayPalOrder(
    accessToken: string,
    request: PaymentRequest
  ): Promise<PayPalOrder> {
    try {
      const apiUrl =
        this.paypalConfig.environment === 'live'
          ? 'https://api-m.paypal.com/v2/checkout/orders'
          : 'https://api-m.sandbox.paypal.com/v2/checkout/orders';

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: request.orderId,
            description: request.description || 'UltraMarket Purchase',
            amount: {
              currency_code: request.currency,
              value: request.amount.toString(),
            },
            payee: {
              email_address: process.env.PAYPAL_MERCHANT_EMAIL || 'merchant@ultramarket.com',
            },
            custom_id: paymentId,
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          brand_name: 'UltraMarket',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      };

      const response = await axios.post(apiUrl, orderData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create PayPal order', error);
      throw createError(500, 'PayPal order creation failed');
    }
  }

  /**
   * Capture PayPal payment
   */
  async capturePayPalPayment(paypalOrderId: string): Promise<PaymentResponse> {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const apiUrl =
        this.paypalConfig.environment === 'live'
          ? `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`
          : `https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`;

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const captureData = response.data;

      logger.info('PayPal payment captured successfully', {
        paypalOrderId,
        captureId: captureData.purchase_units[0].payments.captures[0].id,
        status: captureData.status,
      });

      return {
        id: captureData.purchase_units[0].payments.captures[0].id,
        status: PaymentStatus.COMPLETED,
        amount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
        currency: captureData.purchase_units[0].payments.captures[0].amount
          .currency_code as Currency,
        method: PaymentMethod.PAYPAL,
        transactionId: captureData.purchase_units[0].payments.captures[0].id,
        metadata: {
          paypalOrderId: captureData.id,
          paypalCaptureId: captureData.purchase_units[0].payments.captures[0].id,
          paypalStatus: captureData.status,
        },
      };
    } catch (error) {
      logger.error('PayPal payment capture failed', error);
      throw createError(500, 'PayPal payment capture failed');
    }
  }

  /**
   * Process Click payment (O'zbekiston)
   */
  private async processClickPayment(
    paymentId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      logger.info('Processing Click payment', {
        paymentId,
        orderId: request.orderId,
        amount: request.amount,
      });

      const clickOrder = await this.createClickOrder(request);

      logger.info('Click order created successfully', {
        clickOrderId: clickOrder.id,
        paymentId,
        status: clickOrder.status,
      });

      return {
        id: paymentId,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        transactionId: clickOrder.id,
        redirectUrl: clickOrder.paymentUrl,
        metadata: {
          ...request.metadata,
          clickOrderId: clickOrder.id,
          clickMerchantId: clickOrder.merchantId,
        },
      };
    } catch (error) {
      logger.error('Click payment processing failed', error);
      throw createError(
        400,
        `Click payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process Payme payment (O'zbekiston)
   */
  private async processPaymePayment(
    paymentId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      logger.info('Processing Payme payment', {
        paymentId,
        orderId: request.orderId,
        amount: request.amount,
      });

      const paymeOrder = await this.createPaymeOrder(request);

      logger.info('Payme order created successfully', {
        paymeOrderId: paymeOrder.id,
        paymentId,
        status: paymeOrder.status,
      });

      return {
        id: paymentId,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        transactionId: paymeOrder.id,
        redirectUrl: paymeOrder.paymentUrl,
        metadata: {
          ...request.metadata,
          paymeOrderId: paymeOrder.id,
          paymeMerchantId: paymeOrder.merchantId,
        },
      };
    } catch (error) {
      logger.error('Payme payment processing failed', error);
      throw createError(
        400,
        `Payme payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process Apelsin payment (O'zbekiston)
   */
  private async processApelsinPayment(
    paymentId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      logger.info('Processing Apelsin payment', {
        paymentId,
        orderId: request.orderId,
        amount: request.amount,
      });

      const apelsinOrder = await this.createApelsinOrder(request);

      logger.info('Apelsin order created successfully', {
        apelsinOrderId: apelsinOrder.id,
        paymentId,
        status: apelsinOrder.status,
      });

      return {
        id: paymentId,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        transactionId: apelsinOrder.id,
        redirectUrl: apelsinOrder.paymentUrl,
        metadata: {
          ...request.metadata,
          apelsinOrderId: apelsinOrder.id,
          apelsinMerchantId: apelsinOrder.merchantId,
        },
      };
    } catch (error) {
      logger.error('Apelsin payment processing failed', error);
      throw createError(
        400,
        `Apelsin payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create Click order
   */
  private async createClickOrder(request: PaymentRequest): Promise<UzbekPaymentOrder> {
    try {
      const apiUrl =
        this.clickConfig.environment === 'production'
          ? 'https://api.click.uz/v2/merchant/invoice/create'
          : 'https://testmerchant.click.uz/v2/merchant/invoice/create';

      const orderData = {
        service_id: this.clickConfig.serviceId,
        merchant_id: this.clickConfig.merchantId,
        amount: request.amount,
        currency: request.currency,
        merchant_trans_id: request.orderId,
        merchant_prepare_id: request.orderId,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
        description: request.description || "UltraMarket to'lov",
      };

      const response = await axios.post(apiUrl, orderData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`${this.clickConfig.merchantId}:${this.clickConfig.secretKey}`)}`,
        },
      });

      return {
        id: response.data.invoice_id,
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        merchantId: this.clickConfig.merchantId,
        paymentUrl: response.data.payment_url,
        transactionId: response.data.invoice_id,
      };
    } catch (error) {
      logger.error('Failed to create Click order', error);
      throw createError(500, 'Click order creation failed');
    }
  }

  /**
   * Create Payme order
   */
  private async createPaymeOrder(request: PaymentRequest): Promise<UzbekPaymentOrder> {
    try {
      const apiUrl =
        this.paymeConfig.environment === 'production'
          ? 'https://checkout.paycom.uz'
          : 'https://test.paycom.uz';

      const orderData = {
        method: 'cards.create',
        params: {
          amount: request.amount * 100, // Payme uses tiyin (1/100 of sum)
          currency: request.currency,
          account: {
            order: request.orderId,
          },
          description: request.description || "UltraMarket to'lov",
          callback_url: `${process.env.API_URL}/payment/payme/callback`,
          callback_timeout: 15,
        },
      };

      const response = await axios.post(apiUrl, orderData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`${this.paymeConfig.merchantId}:${this.paymeConfig.secretKey}`)}`,
        },
      });

      return {
        id: response.data.result.id,
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        merchantId: this.paymeConfig.merchantId,
        paymentUrl: response.data.result.pay_url,
        transactionId: response.data.result.id,
      };
    } catch (error) {
      logger.error('Failed to create Payme order', error);
      throw createError(500, 'Payme order creation failed');
    }
  }

  /**
   * Create Apelsin order
   */
  private async createApelsinOrder(request: PaymentRequest): Promise<UzbekPaymentOrder> {
    try {
      const apiUrl =
        this.apelsinConfig.environment === 'production'
          ? 'https://pay.apelsin.uz/api/v1/invoice'
          : 'https://test.pay.apelsin.uz/api/v1/invoice';

      const orderData = {
        merchant_id: this.apelsinConfig.merchantId,
        amount: request.amount,
        currency: request.currency,
        order_id: request.orderId,
        description: request.description || "UltraMarket to'lov",
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        callback_url: `${process.env.API_URL}/payment/apelsin/callback`,
      };

      const response = await axios.post(apiUrl, orderData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apelsinConfig.secretKey}`,
        },
      });

      return {
        id: response.data.invoice_id,
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        merchantId: this.apelsinConfig.merchantId,
        paymentUrl: response.data.payment_url,
        transactionId: response.data.invoice_id,
      };
    } catch (error) {
      logger.error('Failed to create Apelsin order', error);
      throw createError(500, 'Apelsin order creation failed');
    }
  }

  /**
   * Process bank transfer (O'zbekiston banks)
   */
  private async processBankTransfer(
    paymentId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      logger.info('Processing bank transfer', {
        paymentId,
        orderId: request.orderId,
        amount: request.amount,
      });

      // Generate bank transfer instructions
      const transferInstructions = this.generateBankTransferInstructions(request);

      logger.info('Bank transfer instructions generated', {
        paymentId,
        bankAccount: transferInstructions.bankAccount,
        amount: transferInstructions.amount,
      });

      return {
        id: paymentId,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        metadata: {
          ...request.metadata,
          bankAccount: transferInstructions.bankAccount,
          bankName: transferInstructions.bankName,
          transferCode: transferInstructions.transferCode,
          instructions: transferInstructions.instructions,
        },
      };
    } catch (error) {
      logger.error('Bank transfer processing failed', error);
      throw createError(
        400,
        `Bank transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate bank transfer instructions for O'zbekiston banks
   */
  private generateBankTransferInstructions(request: PaymentRequest) {
    const banks = [
      {
        name: 'NBU (Milliy Bank)',
        account: '2021 4000 1234 5678',
        mfo: '00014',
      },
      {
        name: 'Asaka Bank',
        account: '2021 4000 8765 4321',
        mfo: '00015',
      },
      {
        name: 'Xalq Banki',
        account: '2021 4000 1111 2222',
        mfo: '00016',
      },
    ];

    const selectedBank = banks[Math.floor(Math.random() * banks.length)];
    const transferCode = `UZ${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    return {
      bankName: selectedBank.name,
      bankAccount: selectedBank.account,
      mfo: selectedBank.mfo,
      amount: request.amount,
      currency: request.currency,
      transferCode: transferCode,
      instructions: `
        To'lov ma'lumotlari:
        Bank: ${selectedBank.name}
        Hisob raqami: ${selectedBank.account}
        MFO: ${selectedBank.mfo}
        Summa: ${request.amount} ${request.currency}
        To'lov kodi: ${transferCode}
        Izoh: UltraMarket buyurtma ${request.orderId}
      `,
    };
  }

  /**
   * Process cryptocurrency payment
   */
  private async processCryptoPayment(
    paymentId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    // Crypto payment implementation (e.g., using Coinbase Commerce)
    return {
      id: paymentId,
      status: PaymentStatus.PENDING,
      amount: request.amount,
      currency: request.currency,
      method: request.method,
      redirectUrl: `https://commerce.coinbase.com/checkout/${paymentId}`,
      metadata: request.metadata,
    };
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(paymentId: string, data: any): Promise<PaymentResponse> {
    try {
      const payment = await PaymentModel.findById(paymentId);
      if (!payment) {
        throw createError(404, 'Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw createError(400, 'Payment is not in pending status');
      }

      // Process confirmation based on payment method
      let status = PaymentStatus.COMPLETED;
      let transactionId = payment.transactionId;

      if (
        payment.method === PaymentMethod.CREDIT_CARD ||
        payment.method === PaymentMethod.DEBIT_CARD
      ) {
        // Confirm Stripe payment intent
        const paymentIntent = await this.stripe.paymentIntents.confirm(payment.transactionId!);
        status = this.mapStripeStatus(paymentIntent.status);
        transactionId = paymentIntent.id;
      }

      // Update payment status
      payment.status = status;
      payment.transactionId = transactionId;
      payment.processedAt = status === PaymentStatus.COMPLETED ? new Date() : undefined;
      await payment.save();

      // Emit confirmation event
      this.emit('payment.confirmed', {
        paymentId: payment.id,
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
      });

      return {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        transactionId: payment.transactionId,
      };
    } catch (error) {
      logger.error('Payment confirmation failed', error);
      throw error;
    }
  }

  /**
   * Process a refund
   */
  async processRefund(request: RefundRequest): Promise<any> {
    try {
      const payment = await PaymentModel.findById(request.paymentId);
      if (!payment) {
        throw createError(404, 'Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw createError(400, 'Cannot refund uncompleted payment');
      }

      const refundAmount = request.amount || payment.amount;
      if (refundAmount > payment.amount - payment.refundedAmount) {
        throw createError(400, 'Refund amount exceeds available amount');
      }

      let refund: any;

      if (
        payment.method === PaymentMethod.CREDIT_CARD ||
        payment.method === PaymentMethod.DEBIT_CARD
      ) {
        // Process Stripe refund
        refund = await this.stripe.refunds.create({
          payment_intent: payment.transactionId!,
          amount: Math.round(refundAmount * 100),
          reason: request.reason as any,
          metadata: request.metadata,
        });
      }

      // Update payment record
      payment.refundedAmount += refundAmount;
      payment.status =
        payment.refundedAmount >= payment.amount
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;
      await payment.save();

      // Emit refund event
      this.emit('payment.refunded', {
        paymentId: payment.id,
        orderId: payment.orderId,
        refundAmount,
        totalRefunded: payment.refundedAmount,
        status: payment.status,
      });

      return {
        id: refund?.id,
        paymentId: payment.id,
        amount: refundAmount,
        status: refund?.status || 'succeeded',
        reason: request.reason,
        metadata: request.metadata,
      };
    } catch (error) {
      logger.error('Refund processing failed', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);

      logger.info('Stripe webhook received', { type: event.type, id: event.id });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleRefundUpdate(event.data.object as Stripe.Charge);
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      logger.error('Webhook processing failed', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await PaymentModel.findOne({ transactionId: paymentIntent.id });
    if (!payment) {
      logger.warn('Payment not found for successful payment intent', { id: paymentIntent.id });
      return;
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.processedAt = new Date();
    await payment.save();

    this.emit('payment.success', {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await PaymentModel.findOne({ transactionId: paymentIntent.id });
    if (!payment) {
      logger.warn('Payment not found for failed payment intent', { id: paymentIntent.id });
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.failureReason = paymentIntent.last_payment_error?.message;
    await payment.save();

    this.emit('payment.failed', {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      reason: payment.failureReason,
    });
  }

  /**
   * Handle refund update
   */
  private async handleRefundUpdate(charge: Stripe.Charge): Promise<void> {
    const payment = await PaymentModel.findOne({ transactionId: charge.payment_intent });
    if (!payment) {
      logger.warn('Payment not found for refunded charge', { id: charge.id });
      return;
    }

    const refundedAmount = charge.amount_refunded / 100;
    payment.refundedAmount = refundedAmount;
    payment.status =
      refundedAmount >= payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
    await payment.save();

    this.emit('payment.refund.updated', {
      paymentId: payment.id,
      orderId: payment.orderId,
      refundedAmount,
      status: payment.status,
    });
  }

  /**
   * Map Stripe payment intent status to our status
   */
  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<any> {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      throw createError(404, 'Payment not found');
    }
    return payment;
  }

  /**
   * Get payments by order ID
   */
  async getPaymentsByOrderId(orderId: string): Promise<any[]> {
    return PaymentModel.find({ orderId }).sort({ createdAt: -1 });
  }

  /**
   * Get payments by user ID
   */
  async getPaymentsByUserId(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    const query = PaymentModel.find({ userId }).sort({ createdAt: -1 });

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    return query.exec();
  }
}

export const paymentService = new PaymentService();
