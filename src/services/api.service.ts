import axios, { AxiosInstance } from 'axios';
import { getIdToken } from '../config/firebase';

// Backend base URL - update this with your actual backend URL
const BASE_URL = 'http://192.168.29.105:3000';

class ApiService {
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
          // Server responded with error
          return Promise.reject(error.response.data);
        } else if (error.request) {
          // Request made but no response
          return Promise.reject({
            success: false,
            message: 'Network error. Please check your connection.',
            data: { error: 'NETWORK_ERROR' },
          });
        } else {
          // Error in request setup
          return Promise.reject({
            success: false,
            message: 'An unexpected error occurred.',
            data: { error: 'UNKNOWN_ERROR' },
          });
        }
      }
    );
  }

  // Get customer profile status
  async getCustomerStatus() {
    return this.api.get('/api/auth/customer/status');
  }

  // Get comprehensive customer profile
  async getCustomerProfile() {
    return this.api.get('/api/auth/customer/profile');
  }

  // Complete customer onboarding
  async completeOnboarding(data: {
    name: string;
    email?: string;
    dietaryPreferences?: {
      foodType?: 'VEG' | 'NON-VEG' | 'VEGAN';
      eggiterian?: boolean;
      jainFriendly?: boolean;
      dabbaType?: 'DISPOSABLE' | 'STEEL DABBA';
      spiceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
    };
  }) {
    return this.api.put('/api/auth/customer/onboarding', data);
  }

  // Request account deletion
  async deleteAccount() {
    return this.api.delete('/api/auth/customer/delete-account');
  }
}

export default new ApiService();
