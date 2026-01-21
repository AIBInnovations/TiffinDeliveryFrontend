/**
 * Notification Service for FCM
 *
 * SETUP REQUIRED:
 * 1. Install the messaging package:
 *    npm install @react-native-firebase/messaging
 *
 * 2. For Android (android/app/build.gradle is already configured with Firebase)
 *
 * 3. For iOS:
 *    - cd ios && pod install
 *    - Enable Push Notifications capability in Xcode
 *    - Add APNs key in Firebase Console
 */

import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FCM Token storage key
const FCM_TOKEN_KEY = 'fcm_token';
const FCM_PERMISSION_ASKED_KEY = 'fcm_permission_asked';

// Conditional require for messaging to handle cases where it's not installed
let messaging: any = null;

const loadMessaging = () => {
  if (messaging) return messaging;

  try {
    // Use require instead of import() for React Native Metro compatibility
    messaging = require('@react-native-firebase/messaging').default;
    return messaging;
  } catch (error) {
    console.warn('Firebase Messaging not installed. Run: npm install @react-native-firebase/messaging');
    return null;
  }
};

class NotificationService {
  private tokenRefreshUnsubscribe: (() => void) | null = null;

  /**
   * Check if Firebase Messaging is available
   */
  async isAvailable(): Promise<boolean> {
    const msg = loadMessaging();
    return msg !== null;
  }

  /**
   * Request notification permission
   * Returns true if granted, false otherwise
   */
  async requestPermission(): Promise<boolean> {
    const msg = loadMessaging();
    if (!msg) {
      console.warn('Firebase Messaging not available');
      return false;
    }

    try {
      // For Android 13+ (API 33+), need to request POST_NOTIFICATIONS permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'Allow notifications to stay updated on your orders',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Android notification permission denied');
          return false;
        }
      }

      // Request Firebase messaging permission (required for iOS, also works on Android)
      const authStatus = await msg().requestPermission();

      const enabled =
        authStatus === msg.AuthorizationStatus.AUTHORIZED ||
        authStatus === msg.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
        await AsyncStorage.setItem(FCM_PERMISSION_ASKED_KEY, 'true');
        return true;
      }

      console.log('Notification permission denied');
      await AsyncStorage.setItem(FCM_PERMISSION_ASKED_KEY, 'true');
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check current permission status without requesting
   */
  async checkPermission(): Promise<boolean> {
    const msg = loadMessaging();
    if (!msg) return false;

    try {
      const authStatus = await msg().hasPermission();
      return (
        authStatus === msg.AuthorizationStatus.AUTHORIZED ||
        authStatus === msg.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  /**
   * Check if permission was already asked before
   */
  async wasPermissionAsked(): Promise<boolean> {
    const asked = await AsyncStorage.getItem(FCM_PERMISSION_ASKED_KEY);
    return asked === 'true';
  }

  /**
   * Get FCM token
   * Returns null if permission not granted or error occurs
   */
  async getToken(): Promise<string | null> {
    const msg = loadMessaging();
    if (!msg) return null;

    try {
      // Check if permission is granted
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        console.log('No notification permission, cannot get FCM token');
        return null;
      }

      const token = await msg().getToken();

      if (token) {
        // Store token locally
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        console.log('FCM Token obtained successfully');
      }

      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Get stored FCM token
   */
  async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem(FCM_TOKEN_KEY);
  }

  /**
   * Delete FCM token (useful for logout)
   */
  async deleteToken(): Promise<void> {
    const msg = loadMessaging();

    try {
      if (msg) {
        await msg().deleteToken();
      }
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      console.log('FCM Token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }

  /**
   * Set up token refresh listener
   */
  async setupTokenRefreshListener(onTokenRefresh: (token: string) => void): Promise<void> {
    const msg = loadMessaging();
    if (!msg) return;

    try {
      // Clean up existing listener
      if (this.tokenRefreshUnsubscribe) {
        this.tokenRefreshUnsubscribe();
      }

      this.tokenRefreshUnsubscribe = msg().onTokenRefresh(async (token: string) => {
        console.log('FCM Token refreshed');
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        onTokenRefresh(token);
      });
    } catch (error) {
      console.error('Error setting up token refresh listener:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.tokenRefreshUnsubscribe) {
      this.tokenRefreshUnsubscribe();
      this.tokenRefreshUnsubscribe = null;
    }
  }

  /**
   * Generate a device ID (for FCM token registration)
   */
  async getDeviceId(): Promise<string> {
    const DEVICE_ID_KEY = 'device_id';

    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate a unique device ID
      deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  }
}

export default new NotificationService();
