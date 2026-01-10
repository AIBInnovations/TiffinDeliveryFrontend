import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api.service';

const FCM_TOKEN_KEY = '@fcm_token';
const DEVICE_ID_KEY = '@device_id';

/**
 * Request notification permissions from the user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted:', authStatus);
    } else {
      console.log('Notification permission denied');
    }

    return enabled;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get or generate device ID
 */
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
};

/**
 * Get FCM token (without auto-registering to backend)
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('\n========================================');
    console.log('🔔 Starting FCM Token Generation');
    console.log('========================================');

    // Check if we have permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('❌ No notification permission, skipping FCM token generation');
      console.log('========================================\n');
      return null;
    }

    // Get FCM token
    const token = await messaging().getToken();
    console.log('✅ FCM Token Generated Successfully!');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔑 FCM Token (Full):', token);
    console.log('🔑 FCM Token (Short):', token.substring(0, 30) + '...');
    console.log('========================================\n');

    // Store token locally
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    console.log('💾 FCM Token stored in AsyncStorage');

    return token;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    console.log('========================================\n');
    return null;
  }
};

/**
 * Register FCM token with backend API
 */
export const registerFCMToken = async (token: string): Promise<boolean> => {
  try {
    console.log('\n========================================');
    console.log('🚀 Registering FCM Token with Backend API');
    console.log('========================================');

    // Import here to avoid circular dependency
    const { firebaseAuth } = await import('../config/firebase');
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      console.log('⚠️ No Firebase user logged in - skipping FCM registration');
      console.log('========================================\n');
      return false;
    }

    console.log('✅ Firebase user authenticated:', currentUser.uid);

    const deviceId = await getDeviceId();
    console.log('📱 Device ID:', deviceId);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔑 FCM Token:', token.substring(0, 30) + '...');
    console.log('🌐 API Endpoint: POST /api/auth/fcm-token');

    const response = await apiService.registerFCMToken({
      fcmToken: token,
      deviceId: deviceId,
    });

    console.log('✅ FCM token registered with backend successfully!');
    console.log('📡 Backend Response:', JSON.stringify(response, null, 2));
    console.log('========================================\n');

    return true;
  } catch (error: any) {
    console.error('❌ Error registering FCM token with backend:', error?.message || error);
    console.error('📋 Error details:', JSON.stringify(error, null, 2));
    if (error?.response) {
      console.error('📡 Backend response status:', error.response.status);
      console.error('📡 Backend response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('========================================\n');
    // Don't throw - FCM registration failure shouldn't block user flow
    return false;
  }
};

/**
 * Get stored FCM token from local storage
 */
export const getStoredFCMToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting stored FCM token:', error);
    return null;
  }
};

/**
 * Initialize FCM listeners
 */
export const initializeFCM = () => {
  // Handle token refresh
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
    console.log('FCM token refreshed:', token);
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    await registerFCMToken(token);
  });

  // Handle foreground messages
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);

    // Handle the notification in foreground
    // You can show a local notification or update UI
    if (remoteMessage.notification) {
      console.log('Notification title:', remoteMessage.notification.title);
      console.log('Notification body:', remoteMessage.notification.body);
    }
  });

  // Handle background/quit state messages
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
  });

  // Handle notification opened app from background/quit state
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app from background:', remoteMessage);
    // Navigate to specific screen based on notification data
  });

  // Check if app was opened from a notification (quit state)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from quit state by notification:', remoteMessage);
        // Navigate to specific screen based on notification data
      }
    });

  return () => {
    unsubscribeTokenRefresh();
    unsubscribeForeground();
  };
};

/**
 * Delete FCM token (for logout)
 */
export const deleteFCMToken = async (): Promise<void> => {
  try {
    await messaging().deleteToken();
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    console.log('FCM token deleted');
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
};

export default {
  requestNotificationPermission,
  getFCMToken,
  registerFCMToken,
  getStoredFCMToken,
  initializeFCM,
  deleteFCMToken,
};
