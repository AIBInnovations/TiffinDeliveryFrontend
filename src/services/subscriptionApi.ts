import axios, { AxiosInstance } from 'axios';
import { getIdToken } from '../config/firebase';

const BASE_URL = 'https://food-delivery-backend-y6lw.onrender.com';

// Types for subscription plans
export type PlanType = 'BOTH' | 'LUNCH_ONLY' | 'DINNER_ONLY';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface SubscriptionPlan {
  _id: string;
  planName: string;
  days: string; // e.g., "7D", "15D", "30D"
  planType: PlanType;
  totalVouchers: number;
  planPrice: number;
  compareAtPlanPrice: number;
  description?: string;
}

export interface SubscriptionPlansResponse {
  success: boolean;
  message: string;
  data: SubscriptionPlan[];
}

export interface GroupedPlansResponse {
  success: boolean;
  message: string;
  data: {
    BOTH: SubscriptionPlan[];
    LUNCH_ONLY: SubscriptionPlan[];
    DINNER_ONLY: SubscriptionPlan[];
  };
}

// Purchase types
export interface PurchaseRequest {
  planId: string;
}

export interface PurchasedSubscription {
  _id: string;
  planId: {
    _id: string;
    planName: string;
    days: string;
    planType: PlanType;
    totalVouchers: number;
  };
  customerId: string;
  purchaseDate: string;
  expiryDate: string;
  totalVouchers: number;
  usedVouchers: number;
  amountPaid: number;
  status: SubscriptionStatus;
}

export interface PurchasedVoucher {
  _id: string;
  mealType: 'LUNCH' | 'DINNER' | 'BOTH';
  totalVouchers: number;
  remainingVouchers: number;
  expiryDate: string;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  data: {
    subscription: PurchasedSubscription;
    voucher: PurchasedVoucher;
  };
}

// My subscriptions types
export interface MySubscription {
  _id: string;
  planId: {
    planName: string;
    planType: PlanType;
  };
  purchaseDate: string;
  expiryDate: string;
  totalVouchers: number;
  usedVouchers: number;
  remainingVouchers: number;
  status: SubscriptionStatus;
}

export interface MySubscriptionsResponse {
  success: boolean;
  message: string;
  data: MySubscription[];
}

export interface SubscriptionSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  totalVouchersEarned: number;
  totalVouchersUsed: number;
  totalVouchersRemaining: number;
}

export interface SubscriptionSummaryResponse {
  success: boolean;
  message: string;
  data: SubscriptionSummary;
}

class SubscriptionApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          return Promise.reject(error.response.data);
        } else if (error.request) {
          return Promise.reject({
            success: false,
            message: 'Network error. Please check your connection.',
            data: null,
          });
        } else {
          return Promise.reject({
            success: false,
            message: 'An unexpected error occurred.',
            data: null,
          });
        }
      }
    );
  }

  /**
   * Get all active subscription plans (public endpoint)
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
    return this.api.get('/api/subscription-plans/public');
  }

  /**
   * Get subscription plans grouped by type (public endpoint)
   */
  async getGroupedPlans(): Promise<GroupedPlansResponse> {
    return this.api.get('/api/subscription-plans/public/grouped');
  }

  /**
   * Get a specific subscription plan by ID (public endpoint)
   */
  async getPlanById(planId: string): Promise<{ success: boolean; message: string; data: SubscriptionPlan }> {
    return this.api.get(`/api/subscription-plans/public/${planId}`);
  }

  /**
   * Purchase a subscription plan
   * Requires authentication
   */
  async purchaseSubscription(planId: string): Promise<PurchaseResponse> {
    return this.api.post('/api/subscriptions/purchase', { planId });
  }

  /**
   * Get my subscriptions
   * Requires authentication
   */
  async getMySubscriptions(params?: { status?: SubscriptionStatus; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<MySubscriptionsResponse> {
    return this.api.get('/api/subscriptions/my', { params });
  }

  /**
   * Get active subscriptions only
   * Requires authentication
   */
  async getActiveSubscriptions(): Promise<MySubscriptionsResponse> {
    return this.api.get('/api/subscriptions/my/active');
  }

  /**
   * Get subscription summary
   * Requires authentication
   */
  async getSubscriptionSummary(): Promise<SubscriptionSummaryResponse> {
    return this.api.get('/api/subscriptions/my/summary');
  }

  /**
   * Cancel a subscription
   * Requires authentication
   */
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message: string; data: any }> {
    return this.api.patch(`/api/subscriptions/my/${subscriptionId}/cancel`);
  }
}

export default new SubscriptionApiService();
