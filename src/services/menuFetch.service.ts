/**
 * Menu Fetch Service
 * Handles the complete flow: Zone Lookup → Get Kitchens → Fetch Menu
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api.service';
import { storeLocationData } from '../utils/menuStorage';
import { Zone, Kitchen, KitchenMenu } from '../types/menu';

const LOCATION_SETUP_KEY = '@location_setup_complete';

interface MenuFetchResult {
  success: boolean;
  isServiceable: boolean;
  zone?: Zone;
  kitchen?: Kitchen;
  menu?: KitchenMenu;
  error?: string;
}

/**
 * Complete flow to check serviceability and fetch menu for a pincode
 * Steps:
 * 1. Check serviceability
 * 2. Lookup zone by pincode
 * 3. Get kitchens for zone
 * 4. Fetch menu from first available kitchen
 * 5. Store data in AsyncStorage
 */
export const fetchMenuForPincode = async (pincode: string): Promise<MenuFetchResult> => {
  try {
    // Step 1: Check serviceability
    console.log('🔍 Checking serviceability for pincode:', pincode);
    const serviceabilityResponse: any = await apiService.checkServiceability(pincode);

    console.log('📡 Serviceability Response:', JSON.stringify(serviceabilityResponse, null, 2));

    // Backend returns data in error.isServiceable (non-standard structure)
    const isServiceable = serviceabilityResponse.error?.isServiceable ||
                          serviceabilityResponse.data?.isServiceable;

    if (!isServiceable) {
      console.log('❌ Area is NOT serviceable');
      return {
        success: false,
        isServiceable: false,
        error: 'This area is not serviceable'
      };
    }

    console.log('✅ Area is serviceable!');

    // Step 2: Lookup zone by pincode
    console.log('📍 Looking up zone for pincode:', pincode);
    const zoneResponse: any = await apiService.lookupZone(pincode);

    console.log('📡 Zone Lookup Response:', JSON.stringify(zoneResponse, null, 2));

    // Handle both response structures from API doc and actual backend
    // API doc shows: { success: true, data: { _id, pincode, name, ... } }
    // Actual backend: { data: { found: true, zone: { _id, pincode, ... } } }
    const zone = zoneResponse.data?.zone || zoneResponse.data;

    if (!zone || !zone._id) {
      console.log('❌ Zone lookup failed');
      return {
        success: false,
        isServiceable: true,
        error: 'Could not find zone for this pincode'
      };
    }

    console.log('✅ Zone found:', zone.name, '- ID:', zone._id);
    console.log('📊 Zone Details:', {
      pincode: zone.pincode,
      city: zone.city,
      status: zone.status,
      orderingEnabled: zone.orderingEnabled
    });

    // Step 3: Get kitchens for this zone
    console.log('🍽️ Fetching kitchens for zone:', zone._id);
    let kitchensResponse: any;

    try {
      kitchensResponse = await apiService.getKitchensForZone(zone._id, 'MEAL_MENU');
      console.log('📡 Kitchens Response:', JSON.stringify(kitchensResponse, null, 2));
    } catch (kitchenError: any) {
      console.error('❌ Error fetching kitchens:', kitchenError);
      return {
        success: false,
        isServiceable: true,
        zone,
        error: 'Failed to fetch kitchens for this area'
      };
    }

    // Backend returns data in { data: { kitchens: [...], tiffsyKitchens: [...], partnerKitchens: [] } }
    const kitchensData = kitchensResponse.data?.kitchens || kitchensResponse.data;

    if (!kitchensData || (Array.isArray(kitchensData) && kitchensData.length === 0)) {
      console.log('❌ No kitchens found for this zone');
      return {
        success: false,
        isServiceable: true,
        zone,
        error: 'No kitchens available in this area'
      };
    }

    const kitchens = Array.isArray(kitchensData) ? kitchensData : [kitchensData];
    console.log(`✅ Found ${kitchens.length} kitchen(s)`);

    // Use the first available kitchen
    const selectedKitchen = kitchens[0];
    console.log('🏪 Selected kitchen:', selectedKitchen.name);

    // Step 4: Fetch menu from the kitchen
    console.log('📋 Fetching menu from kitchen:', selectedKitchen._id);
    let menuResponse: any;

    try {
      menuResponse = await apiService.getKitchenMenu(selectedKitchen._id, 'MEAL_MENU');
      console.log('📡 Menu Response:', JSON.stringify(menuResponse, null, 2));
    } catch (menuError: any) {
      console.error('❌ Error fetching menu:', menuError);
      return {
        success: false,
        isServiceable: true,
        zone,
        kitchen: selectedKitchen,
        error: 'Failed to fetch menu from kitchen'
      };
    }

    // Backend may or may not return success field, check for data existence
    if (!menuResponse.data) {
      console.log('❌ Menu fetch failed');
      return {
        success: false,
        isServiceable: true,
        zone,
        kitchen: selectedKitchen,
        error: 'Failed to fetch menu'
      };
    }

    console.log('✅ Menu fetched successfully!');
    const menu = menuResponse.data;

    // Step 5: Store location data using helper function
    await storeLocationData(pincode, zone, selectedKitchen, menu);

    // Mark location setup as complete
    await AsyncStorage.setItem(LOCATION_SETUP_KEY, 'true');
    console.log('✅ Location setup complete - ready to navigate to home');

    return {
      success: true,
      isServiceable: true,
      zone,
      kitchen: selectedKitchen,
      menu
    };

  } catch (error: any) {
    console.error('❌ Error in menu fetch flow:', error);
    return {
      success: false,
      isServiceable: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

export default {
  fetchMenuForPincode
};
