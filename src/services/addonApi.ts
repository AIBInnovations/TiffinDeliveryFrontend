import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://food-delivery-backend-y6lw.onrender.com';

// Types for addon API responses based on API documentation
export interface Addon {
  _id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

export interface MenuItemInfo {
  id: string;
  name: string;
  mealType: 'LUNCH' | 'DINNER';
}

export interface AddonsByMenuItemData {
  menuItem: MenuItemInfo;
  addons: Addon[];
  count: number;
}

export interface AddonsByMenuItemResponse {
  success: boolean;
  message: string;
  data: AddonsByMenuItemData;
}

export interface AddonsListResponse {
  success: boolean;
  message: string;
  data: Addon[];
}

// Query params for addons
export interface AddonsQueryParams {
  menuItemId?: string;
  category?: string;
  isLive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class AddonApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
   * Get all live addons
   * This is a PUBLIC endpoint - no auth required
   */
  async getAddons(params?: AddonsQueryParams): Promise<AddonsListResponse> {
    return this.api.get('/api/addons', { params });
  }

  /**
   * Get addons for a specific menu item
   * This is a PUBLIC endpoint - no auth required
   */
  async getAddonsByMenuItemId(menuItemId: string): Promise<AddonsByMenuItemResponse> {
    return this.api.get(`/api/addons/menu-item/${menuItemId}`);
  }

  /**
   * Get addon by ID
   * This is a PUBLIC endpoint - no auth required
   */
  async getAddonById(id: string): Promise<{ success: boolean; message: string; data: Addon }> {
    return this.api.get(`/api/addons/${id}`);
  }
}

export default new AddonApiService();
