/**
 * Menu Storage Utility
 * Helper functions to store and retrieve menu data from AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Zone, Kitchen, KitchenMenu, StoredLocationData } from '../types/menu';

// AsyncStorage Keys
const KEYS = {
  PINCODE: '@selected_pincode',
  ZONE: '@selected_zone',
  KITCHEN: '@selected_kitchen',
  MENU: '@kitchen_menu',
  LOCATION_SETUP: '@location_setup_complete',
};

/**
 * Store complete location and menu data
 */
export const storeLocationData = async (
  pincode: string,
  zone: Zone,
  kitchen: Kitchen,
  menu: KitchenMenu
): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(KEYS.PINCODE, pincode),
      AsyncStorage.setItem(KEYS.ZONE, JSON.stringify(zone)),
      AsyncStorage.setItem(KEYS.KITCHEN, JSON.stringify(kitchen)),
      AsyncStorage.setItem(KEYS.MENU, JSON.stringify(menu)),
    ]);
    console.log('✅ Location data stored successfully');
  } catch (error) {
    console.error('❌ Error storing location data:', error);
    throw error;
  }
};

/**
 * Get complete location data
 */
export const getLocationData = async (): Promise<StoredLocationData | null> => {
  try {
    const [pincode, zoneStr, kitchenStr, menuStr] = await Promise.all([
      AsyncStorage.getItem(KEYS.PINCODE),
      AsyncStorage.getItem(KEYS.ZONE),
      AsyncStorage.getItem(KEYS.KITCHEN),
      AsyncStorage.getItem(KEYS.MENU),
    ]);

    if (!pincode || !zoneStr || !kitchenStr || !menuStr) {
      console.log('⚠️ Incomplete location data in storage');
      return null;
    }

    return {
      pincode,
      zone: JSON.parse(zoneStr),
      kitchen: JSON.parse(kitchenStr),
      menu: JSON.parse(menuStr),
    };
  } catch (error) {
    console.error('❌ Error retrieving location data:', error);
    return null;
  }
};

/**
 * Get only pincode
 */
export const getPincode = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.PINCODE);
  } catch (error) {
    console.error('❌ Error retrieving pincode:', error);
    return null;
  }
};

/**
 * Get only zone data
 */
export const getZone = async (): Promise<Zone | null> => {
  try {
    const zoneStr = await AsyncStorage.getItem(KEYS.ZONE);
    return zoneStr ? JSON.parse(zoneStr) : null;
  } catch (error) {
    console.error('❌ Error retrieving zone:', error);
    return null;
  }
};

/**
 * Get only kitchen data
 */
export const getKitchen = async (): Promise<Kitchen | null> => {
  try {
    const kitchenStr = await AsyncStorage.getItem(KEYS.KITCHEN);
    return kitchenStr ? JSON.parse(kitchenStr) : null;
  } catch (error) {
    console.error('❌ Error retrieving kitchen:', error);
    return null;
  }
};

/**
 * Get only menu data
 */
export const getMenu = async (): Promise<KitchenMenu | null> => {
  try {
    const menuStr = await AsyncStorage.getItem(KEYS.MENU);
    return menuStr ? JSON.parse(menuStr) : null;
  } catch (error) {
    console.error('❌ Error retrieving menu:', error);
    return null;
  }
};

/**
 * Update only menu data (useful for refresh)
 */
export const updateMenu = async (menu: KitchenMenu): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.MENU, JSON.stringify(menu));
    console.log('✅ Menu updated successfully');
  } catch (error) {
    console.error('❌ Error updating menu:', error);
    throw error;
  }
};

/**
 * Clear all location data (for logout or location change)
 */
export const clearLocationData = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.PINCODE),
      AsyncStorage.removeItem(KEYS.ZONE),
      AsyncStorage.removeItem(KEYS.KITCHEN),
      AsyncStorage.removeItem(KEYS.MENU),
      AsyncStorage.removeItem(KEYS.LOCATION_SETUP),
    ]);
    console.log('✅ Location data cleared');
  } catch (error) {
    console.error('❌ Error clearing location data:', error);
    throw error;
  }
};

/**
 * Check if location data exists
 */
export const hasLocationData = async (): Promise<boolean> => {
  try {
    const data = await getLocationData();
    return data !== null;
  } catch (error) {
    return false;
  }
};

export default {
  storeLocationData,
  getLocationData,
  getPincode,
  getZone,
  getKitchen,
  getMenu,
  updateMenu,
  clearLocationData,
  hasLocationData,
};
