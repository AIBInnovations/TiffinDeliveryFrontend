import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geocoding from 'react-native-geocoding';

// Initialize Geocoding with Google Maps API key
// TODO: Add your Google Maps API key
Geocoding.init('YOUR_GOOGLE_MAPS_API_KEY');

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface AddressComponents {
  address: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

/**
 * Request location permission from user
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    console.log('\n📍 Requesting Location Permission...');

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Tiffsy needs access to your location to find nearby kitchens and ensure delivery.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      const permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      console.log(permissionGranted ? '✅ Location permission granted' : '❌ Location permission denied');

      return permissionGranted;
    }

    // For iOS, permission is requested automatically when calling getCurrentPosition
    return true;
  } catch (error) {
    console.error('❌ Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current location coordinates
 */
export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  try {
    console.log('\n📍 Getting Current Location...');

    // Request permission first
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('❌ Location permission not granted');
      return null;
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log('✅ Location obtained:', coords);
          resolve(coords);
        },
        (error) => {
          console.error('❌ Error getting location:', error.message);
          console.error('Error code:', error.code);
          console.error('Error details:', error);

          // Provide user-friendly error message
          let friendlyMessage = 'Unable to get location. ';
          if (error.code === 3) {
            friendlyMessage += 'Location request timed out. Please ensure GPS is enabled and try again outdoors.';
          } else if (error.code === 1) {
            friendlyMessage += 'Location permission denied.';
          } else if (error.code === 2) {
            friendlyMessage += 'Location unavailable. Please check your GPS settings.';
          }

          const enhancedError = new Error(friendlyMessage);
          (enhancedError as any).originalError = error;
          reject(enhancedError);
        },
        {
          enableHighAccuracy: false, // Use network location for faster response
          timeout: 30000, // Increased timeout to 30 seconds
          maximumAge: 60000, // Accept cached location up to 1 minute old
        }
      );
    });
  } catch (error) {
    console.error('❌ Error in getCurrentLocation:', error);
    return null;
  }
};

/**
 * Get address from coordinates using reverse geocoding
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<AddressComponents | null> => {
  try {
    console.log('\n🗺️ Reverse Geocoding...');
    console.log('📍 Coordinates:', { latitude, longitude });

    const response = await Geocoding.from(latitude, longitude);

    if (response.results.length > 0) {
      const result = response.results[0];
      const addressComponents = result.address_components;

      // Extract pincode
      const pincodeComponent = addressComponents.find(
        (component: any) => component.types.includes('postal_code')
      );

      // Extract locality
      const localityComponent = addressComponents.find(
        (component: any) =>
          component.types.includes('sublocality') || component.types.includes('locality')
      );

      // Extract city
      const cityComponent = addressComponents.find(
        (component: any) =>
          component.types.includes('locality') || component.types.includes('administrative_area_level_2')
      );

      // Extract state
      const stateComponent = addressComponents.find(
        (component: any) => component.types.includes('administrative_area_level_1')
      );

      // Extract country
      const countryComponent = addressComponents.find(
        (component: any) => component.types.includes('country')
      );

      const address: AddressComponents = {
        address: result.formatted_address,
        pincode: pincodeComponent?.long_name,
        locality: localityComponent?.long_name,
        city: cityComponent?.long_name,
        state: stateComponent?.long_name,
        country: countryComponent?.long_name,
      };

      console.log('✅ Address extracted:', address);
      return address;
    }

    console.log('❌ No address found for coordinates');
    return null;
  } catch (error) {
    console.error('❌ Error in reverse geocoding:', error);
    return null;
  }
};

/**
 * Get pincode from coordinates
 */
export const getPincodeFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const address = await getAddressFromCoordinates(latitude, longitude);
    return address?.pincode || null;
  } catch (error) {
    console.error('❌ Error getting pincode:', error);
    return null;
  }
};

/**
 * Validate pincode format (6 digits for India)
 */
export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

/**
 * Get current location and extract pincode
 */
export const getCurrentLocationWithPincode = async (): Promise<{
  coordinates: LocationCoordinates;
  address: AddressComponents;
} | null> => {
  try {
    console.log('\n📍 Getting Location with Pincode...');

    const coordinates = await getCurrentLocation();
    if (!coordinates) {
      console.log('❌ Could not get coordinates');
      return null;
    }

    const address = await getAddressFromCoordinates(coordinates.latitude, coordinates.longitude);
    if (!address || !address.pincode) {
      console.log('❌ Could not extract pincode from location');
      return null;
    }

    console.log('✅ Location with pincode obtained successfully');
    return { coordinates, address };
  } catch (error) {
    console.error('❌ Error in getCurrentLocationWithPincode:', error);
    return null;
  }
};

/**
 * Show alert to enable location services
 */
export const showEnableLocationAlert = () => {
  Alert.alert(
    'Location Services Disabled',
    'Please enable location services to automatically detect your area and find nearby kitchens.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Settings',
        onPress: () => {
          // Open settings (platform specific)
          if (Platform.OS === 'android') {
            // Android settings
          } else {
            // iOS settings
          }
        },
      },
    ]
  );
};

export default {
  requestLocationPermission,
  getCurrentLocation,
  getAddressFromCoordinates,
  getPincodeFromCoordinates,
  validatePincode,
  getCurrentLocationWithPincode,
  showEnableLocationAlert,
};
