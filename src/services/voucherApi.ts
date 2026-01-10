import axios, { AxiosInstance } from 'axios';
import { getIdToken } from '../config/firebase';

const BASE_URL = 'https://food-delivery-backend-y6lw.onrender.com';

// Types for voucher API responses based on API documentation
export interface AvailableByMealType {
  LUNCH: number;
  DINNER: number;
  BOTH: number;
}

export interface VoucherSummary {
  totalBatches: number;
  expiredBatches: number;
  totalVouchersIssued: number;
  availableVouchers: number;
  usedVouchers: number;
  availableByMealType: AvailableByMealType;
}

export interface VoucherSummaryResponse {
  success: boolean;
  message: string;
  data: VoucherSummary;
}

// Voucher item interface
export interface Voucher {
  _id: string;
  subscriptionId: {
    _id: string;
    planId: string;
  };
  mealType: 'LUNCH' | 'DINNER' | 'BOTH';
  issuedDate: string;
  expiryDate: string;
  totalVouchers: number;
  remainingVouchers: number;
  usedVouchers: number;
  isExpired: boolean;
  isExhausted: boolean;
}

export interface VouchersResponse {
  success: boolean;
  message: string;
  data: Voucher[];
}

// Query params for vouchers list
export interface VouchersQueryParams {
  mealType?: 'LUNCH' | 'DINNER' | 'BOTH';
  hasRemaining?: boolean;
  isExpired?: boolean;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class VoucherApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
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
   * Get voucher summary for the current user
   * Returns available, used, expired, and total voucher counts
   */
  async getVoucherSummary(): Promise<VoucherSummaryResponse> {
    return this.api.get('/api/vouchers/my/summary');
  }

  /**
   * Get all vouchers for the current user
   * Returns list of voucher batches with details including expiry dates
   */
  async getMyVouchers(params?: VouchersQueryParams): Promise<VouchersResponse> {
    return this.api.get('/api/vouchers/my', { params });
  }

  /**
   * Get available (non-expired, has remaining) vouchers
   */
  async getAvailableVouchers(mealType?: 'LUNCH' | 'DINNER' | 'BOTH'): Promise<VouchersResponse> {
    return this.api.get('/api/vouchers/my/available', { params: { mealType } });
  }
}

export default new VoucherApiService();
