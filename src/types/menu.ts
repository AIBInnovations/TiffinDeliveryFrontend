// Menu and Kitchen Type Definitions

export interface Zone {
  _id: string;
  pincode: string;
  name: string;
  city: string;
  state: string;
  status: 'ACTIVE' | 'INACTIVE';
  orderingEnabled: boolean;
}

export interface Kitchen {
  _id: string;
  name: string;
  code: string;
  type: 'TIFFSY' | 'PARTNER' | 'CENTRAL';
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

export interface Addon {
  _id: string;
  name: string;
  description?: string;
  price: number;
  dietaryType: 'VEG' | 'NON-VEG' | 'VEGAN' | 'EGGETARIAN';
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: 'MAIN_COURSE' | 'STARTER' | 'DESSERT' | 'BEVERAGE';
  menuType: 'MEAL_MENU' | 'ON_DEMAND_MENU';
  mealWindow?: 'LUNCH' | 'DINNER';
  price: number;
  discountedPrice?: number;
  portionSize?: string;
  dietaryType: 'VEG' | 'NON-VEG' | 'VEGAN' | 'EGGETARIAN';
  spiceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  includes?: string[];
  isAvailable: boolean;
  addonIds?: Addon[];
  imageUrl?: string;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
}

export interface MealMenu {
  lunch?: MenuItem;
  dinner?: MenuItem;
}

export interface KitchenMenu {
  mealMenu?: MealMenu;
  onDemandMenu?: MenuItem[];
  isVoucherEligible?: boolean;
  isCouponEligible?: boolean;
}

export interface StoredLocationData {
  pincode: string;
  zone: Zone;
  kitchen: Kitchen;
  menu: KitchenMenu;
}

// API Response Types

export interface ServiceabilityResponse {
  success: boolean;
  message: string;
  data: {
    isServiceable: boolean;
    message: string;
  };
}

export interface ZoneLookupResponse {
  success: boolean;
  message: string;
  data: Zone;
}

export interface KitchensResponse {
  success: boolean;
  message: string;
  data: Kitchen[];
}

export interface MenuResponse {
  success: boolean;
  message: string;
  data: KitchenMenu;
}
