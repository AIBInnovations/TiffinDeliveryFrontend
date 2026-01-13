import axios, { AxiosInstance } from 'axios';
import { getIdToken } from '../config/firebase';

// Backend base URL - update this with your actual backend URL
const BASE_URL = 'https://tiffsy-backend.onrender.com';
// const BASE_URL = 'http://192.168.29.105:5005';

// Type definitions for API responses
export interface UserData {
  _id: string;
  phone: string;
  role: string;
  name?: string;
  email?: string;
  dietaryPreferences?: string[];
  profileImage?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncUserResponse {
  status: number;
  message: string;
  data: {
    user: UserData | null; // null when isNewUser is true
    isNewUser: boolean;
    isProfileComplete: boolean;
  };
}

export interface RegisterUserResponse {
  status: number;
  message: string;
  data: {
    user: UserData;
    isProfileComplete: boolean;
  };
}

export interface ZoneLookupResponse {
  status: number;
  message: string;
  data: {
    found: boolean;
    zone: {
      _id: string;
      pincode: string;
      name: string;
      city: string;
    } | null;
    isServiceable: boolean;
    message: string;
  };
}

export interface FcmTokenResponse {
  status: number;
  message: string;
  data: null;
}

export interface UpdateProfileResponse {
  status: number;
  message: string;
  data: {
    user: UserData;
    isProfileComplete: boolean;
  };
}

export interface ServiceabilityResponse {
  success: boolean;
  message: string;
  data: {
    isServiceable: boolean;
    message: string;
  };
}

export interface AddressData {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault?: boolean;
}

export interface ServerAddress {
  _id: string;
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  zoneId?: string;
  isServiceable: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressResponse {
  status: number;
  message: string;
  data: {
    address: ServerAddress;
    isServiceable: boolean;
    zone?: {
      _id: string;
      name: string;
      city: string;
    };
  };
}

export interface GetAddressesResponse {
  success: boolean;
  message: string;
  data: {
    addresses: ServerAddress[];
  };
}

export interface UpdateAddressResponse {
  success: boolean;
  message: string;
  data: {
    address: ServerAddress;
  };
}

export interface DeleteAddressResponse {
  success: boolean;
  message: string;
  data: null;
}

export interface KitchenData {
  id: string;
  displayName: string;
  fulfilledBy: string;
  type: string;
  isPremium: boolean;
  isGourmet: boolean;
  rating: number;
  totalRatings: number;
}

// New types for zone/kitchen/menu flow
export interface ZoneData {
  _id: string;
  pincode: string;
  name: string;
  city: string;
  state: string;
  status: string;
  orderingEnabled: boolean;
}

export interface ZoneLookupFullResponse {
  success: boolean;
  data: ZoneData;
}

export interface KitchenInfo {
  _id: string;
  name: string;
  code: string;
  type: 'TIFFSY' | 'PARTNER';
  premiumFlag: boolean;
  gourmetFlag: boolean;
  logo?: string;
  coverImage?: string;
  description?: string;
  cuisineTypes: string[];
  averageRating: number;
  totalRatings: number;
  isAcceptingOrders: boolean;
}

export interface KitchensForZoneResponse {
  success: boolean;
  data: KitchenInfo[];
}

export interface AddonItem {
  _id: string;
  name: string;
  price: number;
  dietaryType: 'VEG' | 'NON-VEG' | 'VEGAN';
  description?: string;
  category?: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  menuType: 'MEAL_MENU' | 'ON_DEMAND_MENU';
  mealWindow?: 'LUNCH' | 'DINNER';
  price: number;
  discountedPrice?: number;
  portionSize?: string;
  dietaryType: 'VEG' | 'NON-VEG' | 'VEGAN';
  spiceLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  includes?: string[];
  images?: string[];
  thumbnailImage?: string;
  isAvailable: boolean;
  isJainFriendly?: boolean;
  isFeatured?: boolean;
  cutoffTime?: string;
  isPastCutoff?: boolean;
  canUseVoucher?: boolean;
  cutoffMessage?: string;
  addonIds?: AddonItem[];
}

export interface KitchenMenuResponse {
  success: boolean;
  data: {
    mealMenu: {
      lunch?: MenuItem;
      dinner?: MenuItem;
    };
    onDemandMenu: MenuItem[];
  };
}

export interface AddressKitchensResponse {
  success: boolean;
  data: {
    address: {
      _id: string;
      label: string;
      zoneId: string;
    };
    kitchens: KitchenInfo[];
  };
}

export interface HomeFeedResponse {
  success: boolean;
  message: string;
  data: {
    address?: {
      id: string;
      label: string;
      addressLine1: string;
      locality: string;
      city: string;
    };
    kitchen?: KitchenData;
    _kitchenId?: string;
    alternativeKitchens?: KitchenData[];
    hasAlternatives?: boolean;
    mealWindow?: {
      current: string;
      isLunchActive: boolean;
      isDinnerActive: boolean;
    };
    menu?: {
      mealMenu?: {
        lunch?: any;
        dinner?: any;
      };
      onDemandMenu?: any[];
    };
    vouchers?: {
      lunch: number;
      dinner: number;
      total: number;
    };
    requiresAddressSetup?: boolean;
    isServiceable?: boolean;
  };
}

// ============================================
// ORDER TYPES
// ============================================

export interface OrderItemAddon {
  addonId: string;
  quantity: number;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  addons?: OrderItemAddon[];
}

export interface CalculatePricingRequest {
  kitchenId: string;
  menuType: 'MEAL_MENU' | 'ON_DEMAND_MENU';
  mealWindow?: 'LUNCH' | 'DINNER';
  deliveryAddressId: string;
  items: OrderItem[];
  voucherCount: number;
  couponCode?: string | null;
}

export interface PricingItemAddon {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PricingItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  addons: PricingItemAddon[];
}

export interface PricingCharges {
  deliveryFee: number;
  serviceFee: number;
  packagingFee: number;
  handlingFee: number;
  taxAmount: number;
  taxBreakdown?: { taxType: string; rate: number; amount: number }[];
}

export interface VoucherCoverage {
  voucherCount: number;
  mainCoursesCovered: number;
  value: number;
}

export interface PricingBreakdown {
  items: PricingItem[];
  subtotal: number;
  charges: PricingCharges;
  discount: { code?: string; type?: string; value?: number } | null;
  voucherCoverage: VoucherCoverage | null;
  grandTotal: number;
  amountToPay: number;
}

export interface VoucherEligibility {
  available: number;
  canUse: number;
  cutoffPassed: boolean;
  cutoffInfo: {
    cutoffTime: string;
    currentTime: string;
    message: string;
  };
}

export interface CalculatePricingResponse {
  success: boolean;
  message: string;
  data: {
    breakdown: PricingBreakdown;
    voucherEligibility: VoucherEligibility;
  };
}

export interface CreateOrderRequest extends CalculatePricingRequest {
  specialInstructions?: string;
  deliveryNotes?: string;
  paymentMethod:
    | 'UPI'
    | 'CARD'
    | 'WALLET'
    | 'NETBANKING'
    | 'VOUCHER_ONLY'
    | 'OTHER'
    | null;
}

export interface OrderVoucherUsage {
  voucherIds?: string[];
  voucherCount: number;
  mainCoursesCovered: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderRating {
  stars: number;
  comment?: string;
  ratedAt: string;
}

export interface KitchenSummary {
  _id: string;
  name: string;
  logo?: string;
  phone?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  kitchenId: string | KitchenSummary;
  menuType: 'MEAL_MENU' | 'ON_DEMAND_MENU';
  mealWindow?: 'LUNCH' | 'DINNER';
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    addons?: {
      addonId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  }[];
  subtotal: number;
  charges: PricingCharges;
  grandTotal: number;
  voucherUsage?: OrderVoucherUsage;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  status: OrderStatus;
  placedAt: string;
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    locality: string;
    city: string;
    pincode: string;
    contactName: string;
    contactPhone: string;
  };
  specialInstructions?: string;
  deliveryNotes?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  rating?: OrderRating;
  canCancel?: boolean;
  canRate?: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    vouchersUsed: number;
    amountToPay: number;
    paymentRequired: boolean;
  };
}

export interface GetOrdersParams {
  status?: OrderStatus;
  menuType?: 'MEAL_MENU' | 'ON_DEMAND_MENU';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface GetOrdersResponse {
  success?: boolean;
  message?: string | boolean;
  data: {
    orders: Order[];
    activeOrders?: string[]; // IDs of active orders
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | string;
  error?: {
    orders?: Order[];
    activeOrders?: string[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface OrderTimelineEvent {
  status: string;
  timestamp: string;
  message?: string;
}

export interface DriverInfo {
  name: string;
  phone: string;
  vehicleNumber?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface OrderTrackingData {
  status: OrderStatus;
  statusMessage: string;
  timeline: OrderTimelineEvent[];
  driver: DriverInfo | null;
  estimatedDelivery: string | null;
  canContactDriver: boolean;
  canContactKitchen: boolean;
  order?: Order;
}

export interface OrderTrackingResponse {
  success?: boolean;
  message?: string;
  data: OrderTrackingData;
  error?: {
    code?: string;
  };
}

// ============================================
// SUBSCRIPTION & VOUCHER TYPES
// ============================================

export type SubscriptionBadge = 'BEST_VALUE' | 'POPULAR' | 'FAMILY';

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  durationDays: number;
  vouchersPerDay: number;
  totalVouchers: number;
  price: number;
  originalPrice: number;
  badge?: SubscriptionBadge;
  features: string[];
  displayOrder: number;
  applicableZoneIds?: string[];
}

export interface PlanSnapshot {
  name: string;
  durationDays: number;
  vouchersPerDay: number;
  totalVouchers: number;
  price: number;
}

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED';

export interface Subscription {
  _id: string;
  userId: string;
  planId:
    | string
    | {
        _id: string;
        name: string;
        durationDays?: number;
        badge?: SubscriptionBadge;
      };
  planSnapshot: PlanSnapshot;
  purchaseDate: string;
  startDate: string;
  endDate: string;
  totalVouchersIssued: number;
  vouchersUsed: number;
  vouchersRemaining?: number;
  daysRemaining?: number;
  voucherExpiryDate: string;
  status: SubscriptionStatus;
  amountPaid: number;
  paymentId?: string;
  paymentMethod?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
}

export type VoucherStatus =
  | 'AVAILABLE'
  | 'REDEEMED'
  | 'EXPIRED'
  | 'RESTORED'
  | 'CANCELLED';
export type VoucherMealType = 'LUNCH' | 'DINNER' | 'ANY';

export interface Voucher {
  _id: string;
  voucherCode: string;
  userId: string;
  subscriptionId: string;
  mealType: VoucherMealType;
  issuedDate: string;
  expiryDate: string;
  status: VoucherStatus;
  redeemedAt?: string;
  redeemedOrderId?: string;
  redeemedKitchenId?: string;
  redeemedMealWindow?: string;
  restoredAt?: string;
  restorationReason?: string;
}

export interface VoucherSummary {
  available: number;
  redeemed: number;
  expired: number;
  restored: number;
  total: number;
}

// Subscription API Response Types
export interface GetActivePlansResponse {
  success: boolean;
  message: string;
  data: {
    plans: SubscriptionPlan[];
  };
}

export interface PurchaseSubscriptionRequest {
  planId: string;
  paymentId?: string;
  paymentMethod?: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'OTHER';
}

export interface PurchaseSubscriptionResponse {
  success: boolean;
  message: string;
  data: {
    subscription: Subscription;
    vouchersIssued: number;
    voucherExpiryDate: string;
  };
}

export interface GetMySubscriptionsParams {
  status?: SubscriptionStatus;
  page?: number;
  limit?: number;
}

export interface ActiveSubscriptionSummary {
  _id: string;
  planName: string;
  vouchersRemaining: number;
  daysRemaining: number;
  expiryDate: string;
}

export interface GetMySubscriptionsResponse {
  success: boolean;
  message: string;
  data: {
    subscriptions: Subscription[];
    activeSubscription: ActiveSubscriptionSummary | null;
    totalVouchersAvailable: number;
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  data: {
    subscription: Subscription;
    vouchersCancelled: number;
    refundEligible: boolean;
    refundAmount: number | null;
    refundReason: string;
  };
}

// Voucher API Response Types
export interface GetMyVouchersParams {
  status?: VoucherStatus;
  page?: number;
  limit?: number;
}

export interface GetMyVouchersResponse {
  success: boolean;
  message?: string;
  data: {
    vouchers: Voucher[];
    summary: VoucherSummary;
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface CheckVoucherEligibilityRequest {
  kitchenId: string;
  menuType: 'MEAL_MENU' | 'ON_DEMAND_MENU';
  mealWindow: 'LUNCH' | 'DINNER';
  mainCourseQuantity: number;
}

export interface VoucherCutoffInfo {
  isPastCutoff: boolean;
  cutoffTime: string;
  message: string;
}

export interface CheckVoucherEligibilityResponse {
  success: boolean;
  data: {
    canUseVoucher: boolean;
    availableVouchers: number;
    maxRedeemable: number;
    cutoffInfo?: VoucherCutoffInfo;
    reason?: string;
  };
}

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

    // Request interceptor to add auth token and log requests
    this.api.interceptors.request.use(
      async config => {
        const token = await getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Log raw request
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        console.log('[API] Request:', JSON.stringify({
          url: (config.baseURL || '') + (config.url || ''),
          method: config.method?.toUpperCase(),
          data: config.data,
          params: config.params,
        }, null, 2));
        return config;
      },
      error => {
        console.log('[API] Request Error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling and logging
    this.api.interceptors.response.use(
      response => {
        // Log raw response
        console.log(`[API] Response ${response.status}:`, JSON.stringify(response.data, null, 2));
        return response.data;
      },
      error => {
        // Log error response
        console.log(`[API] Error ${error.response?.status}:`, JSON.stringify(error.response?.data, null, 2));

        if (error.response) {
          return Promise.reject(error.response.data);
        } else if (error.request) {
          return Promise.reject({
            success: false,
            message: 'Network error. Please check your connection.',
            data: { error: 'NETWORK_ERROR' },
          });
        } else {
          return Promise.reject({
            success: false,
            message: 'An unexpected error occurred.',
            data: { error: 'UNKNOWN_ERROR' },
          });
        }
      },
    );
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  // Check if user exists after Firebase OTP verification
  // Returns user: null if new user, user object if existing
  async syncUser(): Promise<SyncUserResponse> {
    return this.api.post('/api/auth/sync', {});
  }

  // Register a new user (call when sync returns isNewUser: true)
  async registerUser(data: {
    name: string;
    email?: string;
    dietaryPreferences?: string[];
  }): Promise<RegisterUserResponse> {
    return this.api.post('/api/auth/register', data);
  }

  // Update profile for existing users (call when sync returns isProfileComplete: false)
  async updateProfile(data: {
    name: string;
    email?: string;
    dietaryPreferences?: string[];
    profileImage?: string;
  }): Promise<UpdateProfileResponse> {
    return this.api.put('/api/auth/profile', data);
  }

  // Register FCM token for push notifications
  async registerFcmToken(data: {
    fcmToken: string;
    deviceId: string;
  }): Promise<FcmTokenResponse> {
    return this.api.post('/api/auth/fcm-token', data);
  }

  // ============================================
  // ADDRESS ENDPOINTS
  // ============================================

  // Check if pincode is serviceable (no auth required)
  async checkServiceability(pincode: string): Promise<ZoneLookupResponse> {
    return this.api.get(`/api/zones/lookup/${pincode}`);
  }

  // Legacy serviceability check (POST method)
  async checkServiceabilityPost(
    pincode: string,
  ): Promise<ServiceabilityResponse> {
    return this.api.post('/api/customer/check-serviceability', { pincode });
  }

  // Get all addresses for the user
  async getAddresses(): Promise<GetAddressesResponse> {
    return this.api.get('/api/address');
  }

  // Get a single address by ID
  async getAddress(addressId: string): Promise<UpdateAddressResponse> {
    return this.api.get(`/api/address/${addressId}`);
  }

  // Create a new delivery address
  async createAddress(address: AddressData): Promise<CreateAddressResponse> {
    return this.api.post('/api/address', address);
  }

  // Update an existing address
  async updateAddress(
    addressId: string,
    address: Partial<AddressData>,
  ): Promise<UpdateAddressResponse> {
    return this.api.put(`/api/address/${addressId}`, address);
  }

  // Delete an address
  async deleteAddress(addressId: string): Promise<DeleteAddressResponse> {
    return this.api.delete(`/api/address/${addressId}`);
  }

  // Set an address as default
  async setDefaultAddress(addressId: string): Promise<UpdateAddressResponse> {
    return this.api.patch(`/api/address/${addressId}/default`, {});
  }

  // Get kitchens serving a specific address (authenticated)
  async getAddressKitchens(
    addressId: string,
    menuType?: 'MEAL_MENU' | 'ON_DEMAND_MENU',
  ): Promise<AddressKitchensResponse> {
    const params = menuType ? { menuType } : undefined;
    return this.api.get(`/api/address/${addressId}/kitchens`, { params });
  }

  // ============================================
  // ZONE & KITCHEN ENDPOINTS
  // ============================================

  // Get zone info by pincode (public, no auth)
  async getZoneByPincode(pincode: string): Promise<ZoneLookupFullResponse> {
    return this.api.get(`/api/zones/lookup/${pincode}`);
  }

  // Get all kitchens serving a zone (public, no auth)
  async getKitchensForZone(
    zoneId: string,
    menuType?: 'MEAL_MENU' | 'ON_DEMAND_MENU',
  ): Promise<KitchensForZoneResponse> {
    const params = menuType ? { menuType } : undefined;
    return this.api.get(`/api/kitchens/zone/${zoneId}`, { params });
  }

  // ============================================
  // MENU ENDPOINTS
  // ============================================

  // Get complete menu for a kitchen (public, no auth)
  async getKitchenMenu(
    kitchenId: string,
    menuType?: 'MEAL_MENU' | 'ON_DEMAND_MENU',
  ): Promise<KitchenMenuResponse> {
    const params = menuType ? { menuType } : undefined;
    return this.api.get(`/api/menu/kitchen/${kitchenId}`, { params });
  }

  // Get meal menu for specific window (LUNCH/DINNER)
  async getMealMenu(
    kitchenId: string,
    mealWindow: 'LUNCH' | 'DINNER',
  ): Promise<{ success: boolean; data: MenuItem }> {
    return this.api.get(`/api/menu/kitchen/${kitchenId}/meal/${mealWindow}`);
  }

  // Legacy: Get home feed (deprecated - use new flow)
  async getHomeFeed(params?: {
    addressId?: string;
    kitchenId?: string;
  }): Promise<HomeFeedResponse> {
    return this.api.get('/api/customer/home', { params });
  }

  // ============================================
  // LEGACY ENDPOINTS (for backward compatibility)
  // ============================================

  // Get customer profile status (deprecated - use syncUser)
  async getCustomerStatus() {
    return this.api.get('/api/auth/customer/status');
  }

  // Get comprehensive customer profile (deprecated - use syncUser)
  async getCustomerProfile() {
    return this.api.get('/api/auth/customer/profile');
  }

  // Complete customer onboarding (deprecated - use updateProfile)
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

  // ============================================
  // ORDER ENDPOINTS
  // ============================================

  // Calculate pricing for cart preview (validates items, checks voucher eligibility)
  async calculatePricing(
    data: CalculatePricingRequest,
  ): Promise<CalculatePricingResponse> {
    return this.api.post('/api/orders/calculate-pricing', data);
  }

  // Create a new order
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.api.post('/api/orders', data);
  }

  // Get user's orders (with optional filters)
  async getMyOrders(params?: GetOrdersParams): Promise<GetOrdersResponse> {
    return this.api.get('/api/orders/my-orders', { params });
  }

  // Get single order details
  async getOrder(orderId: string): Promise<{ success: boolean; data: Order }> {
    return this.api.get(`/api/orders/${orderId}`);
  }

  // Track order status and timeline
  async trackOrder(orderId: string): Promise<OrderTrackingResponse> {
    return this.api.get(`/api/orders/${orderId}/track`);
  }

  // Cancel an order (if allowed by business rules)
  async cancelOrder(
    orderId: string,
    reason: string,
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      order: Order;
      refundInitiated: boolean;
      vouchersRestored: number;
      message: string;
    };
  }> {
    return this.api.patch(`/api/orders/${orderId}/customer-cancel`, { reason });
  }

  // Rate a delivered order
  async rateOrder(
    orderId: string,
    stars: number,
    comment?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      order: Order;
    };
  }> {
    return this.api.post(`/api/orders/${orderId}/rate`, { stars, comment });
  }

  // ============================================
  // SUBSCRIPTION ENDPOINTS
  // ============================================

  // Get all active subscription plans
  async getActivePlans(zoneId?: string): Promise<GetActivePlansResponse> {
    const params = zoneId ? { zoneId } : undefined;
    return this.api.get('/api/subscriptions/plans/active', { params });
  }

  // Purchase a subscription plan
  async purchaseSubscription(
    data: PurchaseSubscriptionRequest,
  ): Promise<PurchaseSubscriptionResponse> {
    return this.api.post('/api/subscriptions/purchase', data);
  }

  // Get user's subscriptions
  async getMySubscriptions(
    params?: GetMySubscriptionsParams,
  ): Promise<GetMySubscriptionsResponse> {
    return this.api.get('/api/subscriptions/my-subscriptions', { params });
  }

  // Cancel a subscription
  async cancelSubscription(
    subscriptionId: string,
    reason?: string,
  ): Promise<CancelSubscriptionResponse> {
    return this.api.post(`/api/subscriptions/${subscriptionId}/cancel`, {
      reason,
    });
  }

  // ============================================
  // VOUCHER ENDPOINTS
  // ============================================

  // Get user's vouchers
  async getMyVouchers(
    params?: GetMyVouchersParams,
  ): Promise<GetMyVouchersResponse> {
    return this.api.get('/api/vouchers/my-vouchers', { params });
  }

  // Check voucher eligibility for an order
  async checkVoucherEligibility(
    data: CheckVoucherEligibilityRequest,
  ): Promise<CheckVoucherEligibilityResponse> {
    return this.api.post('/api/vouchers/check-eligibility', data);
  }

  // ============================================
  // CUSTOMER PROFILE ENDPOINTS
  // ============================================

  // Get current user profile
  async getProfile(): Promise<{
    message: string;
    data: { user: UserData };
  }> {
    return this.api.get('/api/customer/profile');
  }

  // Check if profile is complete
  async getProfileStatus(): Promise<{
    message: string;
    data: {
      isComplete: boolean;
      missingFields: string[];
      profile: UserData | null;
    };
  }> {
    return this.api.get('/api/customer/profile/status');
  }

  // Complete profile after signup
  async completeProfile(data: {
    name: string;
    email?: string;
    dietaryPreferences?: string[];
  }): Promise<{
    message: string;
    data: { user: UserData };
  }> {
    return this.api.post('/api/customer/profile/complete', data);
  }

  // Update profile details (full update)
  async updateCustomerProfile(data: {
    name?: string;
    email?: string;
    dietaryPreferences?: string[];
    profileImage?: string;
  }): Promise<{
    message: string;
    data: { user: UserData };
  }> {
    return this.api.put('/api/customer/profile', data);
  }

  // Update only dietary preferences
  async updateDietaryPreferences(
    dietaryPreferences: string[],
  ): Promise<{
    message: string;
    data: { user: { _id: string; dietaryPreferences: string[] } };
  }> {
    return this.api.patch('/api/customer/profile/dietary-preferences', {
      dietaryPreferences,
    });
  }

  // Update profile image URL
  async updateProfileImage(profileImage: string): Promise<{
    message: string;
    data: { user: { _id: string; profileImage: string } };
  }> {
    return this.api.patch('/api/customer/profile/image', { profileImage });
  }

  // Delete account with confirmation
  async deleteAccountWithConfirmation(data: {
    reason?: string;
    confirmPhone: string;
  }): Promise<{
    message: string;
    data: null;
    error?: { code: string; activeOrderCount?: number };
  }> {
    return this.api.delete('/api/customer/profile', { data });
  }

  // Upload file to cloud storage
  async uploadFile(
    file: { uri: string; type: string; name: string },
    folder?: string,
  ): Promise<{
    message: string;
    data: {
      files: Array<{
        url: string;
        publicId: string;
        format: string;
        resourceType: string;
        bytes: number;
        width: number;
        height: number;
        createdAt: string;
      }>;
      count: number;
    };
  }> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const url = folder ? `/api/upload?folder=${folder}` : '/api/upload';
    return this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export default new ApiService();
