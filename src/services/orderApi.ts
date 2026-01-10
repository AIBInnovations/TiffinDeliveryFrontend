import axios, { AxiosInstance } from 'axios';
import { getIdToken } from '../config/firebase';

const BASE_URL = 'https://food-delivery-backend-y6lw.onrender.com';

// Types for order API based on API documentation
export type MealType = 'LUNCH' | 'DINNER';
export type PackagingType = 'DISPOSABLE' | 'STEEL_DABBA';
export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface CreateOrderRequest {
  mealType: MealType;
  scheduledForDate: string; // Format: "YYYY-MM-DD"
  menuItemId: string;
  addonIds?: string[];
  specialInstructions?: string;
  packagingType: PackagingType;
  useSubscription?: boolean;
}

export interface OrderMenuItem {
  menuItemId: {
    _id: string;
    name: string;
    price: number;
  };
  orderPlacedPrice: number;
}

export interface OrderAddon {
  addonId: {
    _id: string;
    name: string;
    price: number;
  };
  orderPlacedPrice: number;
}

export interface OrderStatusTimestamps {
  placedAt?: string;
  acceptedAt?: string;
  preparingAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface Order {
  _id: string;
  mealType: MealType;
  scheduledForDate: string;
  isAutoOrder: boolean;
  menuItem: OrderMenuItem;
  addons: OrderAddon[];
  subscriptionUsed?: string;
  vouchersConsumed: number;
  totalAmount: number;
  specialInstructions?: string;
  packagingType: PackagingType;
  orderStatus: OrderStatusTimestamps;
  currentStatus: OrderStatus;
  driverId?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface OrdersPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface GetOrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    pagination: OrdersPagination;
  };
}

export interface GetOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    orderStatus: OrderStatusTimestamps;
    currentStatus: 'cancelled';
  };
}

// Query params for orders
export interface OrdersQueryParams {
  mealType?: MealType;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class OrderApiService {
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
   * Create a new order
   * Requires authentication
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.api.post('/api/orders', orderData);
  }

  /**
   * Get all orders for the current user
   * Requires authentication
   */
  async getMyOrders(params?: OrdersQueryParams): Promise<GetOrdersResponse> {
    return this.api.get('/api/orders/my-orders', { params });
  }

  /**
   * Get a specific order by ID
   * Requires authentication
   */
  async getOrderById(orderId: string): Promise<GetOrderResponse> {
    return this.api.get(`/api/orders/${orderId}`);
  }

  /**
   * Cancel an order
   * Note: Orders can only be cancelled before acceptance
   * Requires authentication
   */
  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    return this.api.patch(`/api/orders/${orderId}/cancel`);
  }

  /**
   * Request a refund for an order
   * Requires authentication
   */
  async requestRefund(orderId: string, reason: string): Promise<{ success: boolean; message: string; data: any }> {
    return this.api.post(`/api/orders/${orderId}/refund`, { reason });
  }
}

export default new OrderApiService();
