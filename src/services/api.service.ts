import axios, { AxiosInstance } from 'axios';
import { getIdToken } from '../config/firebase';
import type { SyncUserResponse, RegisterUserResponse, UpdateProfileResponse, FCMTokenResponse } from '../types/auth';

// Backend base URL - update this with your actual backend URL
const BASE_URL = 'https://tiffsy-backend.onrender.com';


class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 60000, // 60 seconds to handle cold starts on free tier hosting
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        console.log('\n🔄 Getting Firebase ID token...');
        const token = await getIdToken();
        console.log('✅ Token retrieved:', !!token);

        // Detailed request logging
        console.log('\n' + '='.repeat(60));
        console.log('📤 OUTGOING REQUEST');
        console.log('='.repeat(60));
        console.log('🌐 URL:', (config.baseURL || '') + (config.url || ''));
        console.log('📍 Method:', config.method?.toUpperCase() || 'UNKNOWN');
        console.log('⏱️ Timeout:', config.timeout, 'ms');
        console.log('🔐 Has Token:', !!token);
        if (token) {
          console.log('🔑 Token Preview:', token.substring(0, 30) + '...');
        } else {
          console.warn('⚠️ WARNING: No Firebase token available!');
        }
        console.log('📋 Headers:', {
          'Content-Type': config.headers['Content-Type'],
          'Authorization': token ? 'Bearer ***' : 'None'
        });
        console.log('📦 Request Body:');
        if (config.data) {
          console.log(JSON.stringify(config.data, null, 2));
        } else {
          console.log('  (empty)');
        }
        console.log('⏰ Request starting at:', new Date().toISOString());
        console.log('='.repeat(60) + '\n');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.error('❌ CRITICAL: No Firebase token - request may fail!');
        }
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        // Detailed success response logging
        console.log('\n' + '='.repeat(60));
        console.log('✅ INCOMING RESPONSE - SUCCESS');
        console.log('='.repeat(60));
        console.log('🌐 URL:', (response.config.baseURL || '') + (response.config.url || ''));
        console.log('📊 Status:', response.status, response.statusText);
        console.log('⏰ Response received at:', new Date().toISOString());
        console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
        console.log('='.repeat(60) + '\n');
        return response.data;
      },
      (error) => {
        // Detailed error response logging
        console.log('\n' + '='.repeat(60));
        console.log('❌ INCOMING RESPONSE - ERROR');
        console.log('='.repeat(60));
        console.log('⏰ Error received at:', new Date().toISOString());
        console.log('🌐 URL:', (error.config?.baseURL || '') + (error.config?.url || ''));
        console.log('📍 Method:', error.config?.method?.toUpperCase() || 'UNKNOWN');
        console.log('⏱️ Timeout was:', error.config?.timeout, 'ms');
        console.log('📦 Request Body:');
        if (error.config?.data) {
          try {
            // Try to parse if it's a string, otherwise just log it
            const requestData = typeof error.config.data === 'string'
              ? JSON.parse(error.config.data)
              : error.config.data;
            console.log(JSON.stringify(requestData, null, 2));
          } catch {
            console.log(error.config.data);
          }
        } else {
          console.log('  (empty)');
        }
        console.log('📊 Status:', error.response?.status || 'No Status');
        console.log('📛 Status Text:', error.response?.statusText || 'No Status Text');
        console.log('💥 Error Code:', error.code || 'No Code');
        console.log('💥 Error Message:', error.message);
        console.log('📥 Response Data:', JSON.stringify(error.response?.data, null, 2) || 'No response data');
        console.log('🔍 Error Type:', error.response ? 'Server Error' : error.request ? 'Network/Timeout Error' : 'Request Setup Error');
        console.log('='.repeat(60) + '\n');

        if (error.response) {
          // Server responded with error - return as-is (backend format)
          return Promise.reject(error.response.data);
        } else if (error.request) {
          // Request made but no response - match auth API format
          console.error('⚠️ No response received from server');
          return Promise.reject({
            status: 0,
            message: 'Network error. Please check your connection.',
            data: null,
            error: 'NETWORK_ERROR',
          });
        } else {
          // Error in request setup - match auth API format
          console.error('⚠️ Request setup error:', error.message);
          return Promise.reject({
            status: 0,
            message: 'An unexpected error occurred.',
            data: null,
            error: 'UNKNOWN_ERROR',
          });
        }
      }
    );
  }

  // ============ NEW AUTH FLOW ============

  // Sync user after Firebase authentication
  // Returns: { status, message, data: { isNewUser, isProfileComplete, user }, error }
  async syncUser(): Promise<SyncUserResponse> {
    console.log('🚀 CALLING syncUser API');
    console.log('📍 Full URL:', BASE_URL + '/api/auth/sync');
    console.log('📦 Request Body:', JSON.stringify({}, null, 2));
    return this.api.post('/api/auth/sync', {});
  }

  // Register new user (call when sync returns isNewUser: true)
  // Returns: { status, message, data: { user, isProfileComplete }, error }
  async registerUser(data: {
    name: string;
    email?: string;
    dietaryPreferences?: string[];
  }): Promise<RegisterUserResponse> {
    console.log('🚀 CALLING registerUser API');
    console.log('📍 Full URL:', BASE_URL + '/api/auth/register');
    console.log('📦 Request Body:', JSON.stringify(data, null, 2));
    return this.api.post('/api/auth/register', data);
  }

  // Update profile for existing users (call when sync returns isProfileComplete: false)
  // Returns: { status, message, data: { user, isProfileComplete }, error }
  async updateProfile(data: {
    name?: string;
    email?: string;
    dietaryPreferences?: string[];
    profileImage?: string;
  }): Promise<UpdateProfileResponse> {
    console.log('🚀 CALLING updateProfile API');
    console.log('📍 Full URL:', BASE_URL + '/api/auth/profile');
    console.log('📦 Request Body:', JSON.stringify(data, null, 2));
    return this.api.put('/api/auth/profile', data);
  }

  // Register FCM token for push notifications
  // Returns: { status, message, data: null, error }
  async registerFCMToken(data: {
    fcmToken: string;
    deviceId: string;
  }): Promise<FCMTokenResponse> {
    return this.api.post('/api/auth/fcm-token', data);
  }

  // ============ LOCATION & SERVICEABILITY ============

  // Check if pincode is serviceable (no auth required)
  async checkServiceability(pincode: string) {
    return this.api.post('/api/customer/check-serviceability', { pincode });
  }

  // Lookup zone by pincode (no auth required)
  async lookupZone(pincode: string) {
    return this.api.get(`/api/zones/lookup/${pincode}`);
  }

  // Get kitchens for a zone (no auth required)
  async getKitchensForZone(zoneId: string, menuType?: 'MEAL_MENU' | 'ON_DEMAND_MENU') {
    const params = new URLSearchParams();
    if (menuType) params.append('menuType', menuType);
    const queryString = params.toString();
    return this.api.get(`/api/kitchens/zone/${zoneId}${queryString ? `?${queryString}` : ''}`);
  }

  // ============ MENU ============

  // Get home feed with menu
  async getHomeFeed(addressId?: string, kitchenId?: string) {
    const params = new URLSearchParams();
    if (addressId) params.append('addressId', addressId);
    if (kitchenId) params.append('kitchenId', kitchenId);

    const queryString = params.toString();
    return this.api.get(`/api/customer/home${queryString ? `?${queryString}` : ''}`);
  }

  // Get detailed meal menu for specific meal window
  async getMealMenu(mealWindow: 'LUNCH' | 'DINNER', addressId?: string, kitchenId?: string) {
    const params = new URLSearchParams();
    if (addressId) params.append('addressId', addressId);
    if (kitchenId) params.append('kitchenId', kitchenId);

    const queryString = params.toString();
    return this.api.get(`/api/customer/menu/${mealWindow}${queryString ? `?${queryString}` : ''}`);
  }

  // Get kitchen menu (no auth required)
  async getKitchenMenu(kitchenId: string, menuType?: 'MEAL_MENU' | 'ON_DEMAND_MENU') {
    const params = new URLSearchParams();
    if (menuType) params.append('menuType', menuType);
    const queryString = params.toString();
    return this.api.get(`/api/menu/kitchen/${kitchenId}${queryString ? `?${queryString}` : ''}`);
  }

  // Get meal menu for specific window (no auth required)
  async getMealMenuForWindow(kitchenId: string, mealWindow: 'LUNCH' | 'DINNER') {
    return this.api.get(`/api/menu/kitchen/${kitchenId}/meal/${mealWindow}`);
  }

  // ============ LEGACY/DEPRECATED (kept for backward compatibility) ============

  // Get customer profile status (DEPRECATED - use syncUser instead)
  async getCustomerStatus() {
    return this.api.get('/api/auth/customer/status');
  }

  // Get comprehensive customer profile (DEPRECATED - use syncUser instead)
  async getCustomerProfile() {
    return this.api.get('/api/auth/customer/profile');
  }

  // Complete customer onboarding (DEPRECATED - use registerUser or updateProfile instead)
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
