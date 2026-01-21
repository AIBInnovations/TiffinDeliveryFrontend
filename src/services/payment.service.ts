import RazorpayCheckout from 'react-native-razorpay';
import apiService from './api.service';
import {
  RazorpayOptions,
  RazorpaySuccessResponse,
  RazorpayErrorResponse,
  PaymentConfig,
  InitiateOrderPaymentData,
  InitiateSubscriptionPaymentData,
  VerifyPaymentRequest,
  OrderPaymentResult,
  SubscriptionPaymentResult,
} from '../types/payment';

const MERCHANT_NAME = 'TiffinDabba';
const THEME_COLOR = '#F56B4C';

class PaymentService {
  private razorpayKey: string | null = null;
  private isConfigured: boolean = false;

  /**
   * Initialize payment service by fetching config from backend
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('[PaymentService] Initializing...');
      const response = await apiService.getPaymentConfig();

      if (response.success && response.data.available && response.data.key) {
        this.razorpayKey = response.data.key;
        this.isConfigured = true;
        console.log('[PaymentService] Initialized successfully with key:', this.razorpayKey.substring(0, 10) + '...');
        return true;
      }

      console.warn('[PaymentService] Payment not available:', response.message);
      return false;
    } catch (error) {
      console.error('[PaymentService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Get payment config from backend
   */
  async getConfig(): Promise<PaymentConfig> {
    const response = await apiService.getPaymentConfig();
    return response.data;
  }

  /**
   * Check if payment service is ready to process payments
   */
  isReady(): boolean {
    return this.isConfigured && !!this.razorpayKey;
  }

  /**
   * Open Razorpay checkout modal
   */
  async openCheckout(options: RazorpayOptions): Promise<RazorpaySuccessResponse> {
    console.log('[PaymentService] Opening Razorpay checkout with options:', {
      ...options,
      key: options.key.substring(0, 10) + '...',
    });

    return new Promise((resolve, reject) => {
      RazorpayCheckout.open(options)
        .then((data: RazorpaySuccessResponse) => {
          console.log('[PaymentService] Razorpay payment successful:', {
            payment_id: data.razorpay_payment_id,
            order_id: data.razorpay_order_id,
          });
          resolve(data);
        })
        .catch((error: RazorpayErrorResponse) => {
          console.error('[PaymentService] Razorpay payment failed:', error);
          reject(error);
        });
    });
  }

  /**
   * Build Razorpay checkout options for order payment
   */
  buildOrderCheckoutOptions(data: InitiateOrderPaymentData): RazorpayOptions {
    return {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: MERCHANT_NAME,
      description: `Order #${data.orderNumber}`,
      order_id: data.razorpayOrderId,
      prefill: {
        name: data.prefill.name,
        contact: data.prefill.contact,
        email: data.prefill.email,
      },
      theme: {
        color: THEME_COLOR,
      },
    };
  }

  /**
   * Build Razorpay checkout options for subscription payment
   */
  buildSubscriptionCheckoutOptions(data: InitiateSubscriptionPaymentData): RazorpayOptions {
    return {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: MERCHANT_NAME,
      description: `${data.planName} Subscription`,
      order_id: data.razorpayOrderId,
      prefill: {
        name: data.prefill.name,
        contact: data.prefill.contact,
        email: data.prefill.email,
      },
      theme: {
        color: THEME_COLOR,
      },
    };
  }

  /**
   * Process complete order payment flow
   * 1. Initiate payment with backend
   * 2. Open Razorpay checkout
   * 3. Verify payment with backend
   */
  async processOrderPayment(orderId: string): Promise<OrderPaymentResult> {
    try {
      console.log('[PaymentService] Processing order payment for orderId:', orderId);

      // Step 1: Initiate payment with backend
      const initiateResponse = await apiService.initiateOrderPayment(orderId);
      if (!initiateResponse.success) {
        throw new Error(initiateResponse.message || 'Failed to initiate payment');
      }

      console.log('[PaymentService] Payment initiated, Razorpay order:', initiateResponse.data.razorpayOrderId);

      // Step 2: Open Razorpay checkout
      const checkoutOptions = this.buildOrderCheckoutOptions(initiateResponse.data);
      const paymentResponse = await this.openCheckout(checkoutOptions);

      // Step 3: Verify payment with backend
      console.log('[PaymentService] Verifying payment...');
      const verifyResponse = await apiService.verifyPayment({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      if (!verifyResponse.success || !verifyResponse.data.success) {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }

      console.log('[PaymentService] Order payment completed successfully');
      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
      };
    } catch (error: any) {
      console.error('[PaymentService] Order payment failed:', error);

      // Check if user cancelled (Razorpay error code 0 or 2)
      if (error.code === 0 || error.code === 2) {
        return {
          success: false,
          error: 'Payment cancelled',
        };
      }

      return {
        success: false,
        error: error.description || error.message || 'Payment failed',
      };
    }
  }

  /**
   * Process complete subscription payment flow
   * 1. Initiate subscription payment with backend
   * 2. Open Razorpay checkout
   * 3. Verify payment with backend
   */
  async processSubscriptionPayment(planId: string): Promise<SubscriptionPaymentResult> {
    try {
      console.log('[PaymentService] Processing subscription payment for planId:', planId);

      // Step 1: Initiate payment with backend
      const initiateResponse = await apiService.initiateSubscriptionPayment(planId);
      if (!initiateResponse.success) {
        throw new Error(initiateResponse.message || 'Failed to initiate payment');
      }

      console.log('[PaymentService] Subscription payment initiated, Razorpay order:', initiateResponse.data.razorpayOrderId);

      // Step 2: Open Razorpay checkout
      const checkoutOptions = this.buildSubscriptionCheckoutOptions(initiateResponse.data);
      const paymentResponse = await this.openCheckout(checkoutOptions);

      // Step 3: Verify payment with backend
      console.log('[PaymentService] Verifying subscription payment...');
      const verifyResponse = await apiService.verifyPayment({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      if (!verifyResponse.success || !verifyResponse.data.success) {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }

      console.log('[PaymentService] Subscription payment completed successfully');
      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
        subscriptionId: verifyResponse.data.referenceId,
      };
    } catch (error: any) {
      console.error('[PaymentService] Subscription payment failed:', error);

      // Check if user cancelled
      if (error.code === 0 || error.code === 2) {
        return {
          success: false,
          error: 'Payment cancelled',
        };
      }

      return {
        success: false,
        error: error.description || error.message || 'Payment failed',
      };
    }
  }

  /**
   * Retry order payment for failed orders
   */
  async retryOrderPayment(orderId: string): Promise<OrderPaymentResult> {
    try {
      console.log('[PaymentService] Retrying order payment for orderId:', orderId);

      // Step 1: Get new Razorpay order via retry endpoint
      const retryResponse = await apiService.retryOrderPayment(orderId);
      if (!retryResponse.success) {
        throw new Error(retryResponse.message || 'Failed to retry payment');
      }

      console.log('[PaymentService] Retry initiated, new Razorpay order:', retryResponse.data.razorpayOrderId);

      // Step 2: Open Razorpay checkout
      const checkoutOptions: RazorpayOptions = {
        key: retryResponse.data.key,
        amount: retryResponse.data.amount,
        currency: retryResponse.data.currency,
        name: MERCHANT_NAME,
        description: `Order Payment Retry`,
        order_id: retryResponse.data.razorpayOrderId,
        prefill: retryResponse.data.prefill
          ? {
              name: retryResponse.data.prefill.name,
              contact: retryResponse.data.prefill.contact,
              email: retryResponse.data.prefill.email,
            }
          : undefined,
        theme: {
          color: THEME_COLOR,
        },
      };

      const paymentResponse = await this.openCheckout(checkoutOptions);

      // Step 3: Verify payment
      console.log('[PaymentService] Verifying retry payment...');
      const verifyResponse = await apiService.verifyPayment({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      if (!verifyResponse.success || !verifyResponse.data.success) {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }

      console.log('[PaymentService] Retry payment completed successfully');
      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
      };
    } catch (error: any) {
      console.error('[PaymentService] Retry payment failed:', error);

      if (error.code === 0 || error.code === 2) {
        return {
          success: false,
          error: 'Payment cancelled',
        };
      }

      return {
        success: false,
        error: error.description || error.message || 'Payment failed',
      };
    }
  }

  /**
   * Get payment status from backend
   */
  async getPaymentStatus(razorpayOrderId: string) {
    return apiService.getPaymentStatus(razorpayOrderId);
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(params?: {
    status?: string;
    purchaseType?: 'ORDER' | 'SUBSCRIPTION';
    limit?: number;
    skip?: number;
  }) {
    return apiService.getPaymentHistory(params);
  }
}

export default new PaymentService();
