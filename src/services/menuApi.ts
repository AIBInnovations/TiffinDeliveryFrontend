import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://food-delivery-backend-y6lw.onrender.com';

// Types for menu API responses based on API documentation
export interface MenuItemMedia {
  thumbnail: string;
  shuffle: string[];
}

export interface MenuItem {
  _id: string;
  name: string;
  content: string;
  description: string;
  media: MenuItemMedia;
  mealType: 'LUNCH' | 'DINNER';
  price: number;
  compareAtPrice: number;
  isLive: boolean;
}

export interface MenuItemsPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface MenuItemsData {
  menuItems: MenuItem[];
  pagination: MenuItemsPagination;
}

export interface MenuItemsResponse {
  success: boolean;
  message: string;
  data: MenuItemsData;
}

export interface SingleMenuItemResponse {
  success: boolean;
  message: string;
  data: MenuItem;
}

// Query params for menu items
export interface MenuItemsQueryParams {
  mealType?: 'LUNCH' | 'DINNER';
  isLive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class MenuApiService {
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
   * Get all live menu items
   * This is a PUBLIC endpoint - no auth required
   */
  async getMenuItems(params?: MenuItemsQueryParams): Promise<MenuItemsResponse> {
    return this.api.get('/api/menu-items', { params });
  }

  /**
   * Get menu item by ID
   * This is a PUBLIC endpoint - no auth required
   */
  async getMenuItemById(id: string): Promise<SingleMenuItemResponse> {
    return this.api.get(`/api/menu-items/${id}`);
  }
}

export default new MenuApiService();
