import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  getFCMToken,
  initializeFCM,
  requestNotificationPermission,
  deleteFCMToken,
  registerFCMToken
} from '../services/fcm.service';
import { firebaseAuth } from '../config/firebase';

interface FCMContextType {
  fcmToken: string | null;
  hasPermission: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
  clearToken: () => Promise<void>;
}

const FCMContext = createContext<FCMContextType | undefined>(undefined);

export const useFCMContext = () => {
  const context = useContext(FCMContext);
  if (!context) {
    throw new Error('useFCMContext must be used within FCMProvider');
  }
  return context;
};

interface FCMProviderProps {
  children: ReactNode;
}

export const FCMProvider: React.FC<FCMProviderProps> = ({ children }) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupFCM = async () => {
      try {
        console.log('\n🚀 FCM Context: App Startup - Initializing FCM');

        // Initialize FCM listeners
        unsubscribe = initializeFCM();

        // Get FCM token
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          setHasPermission(true);

          // Register token with backend if user is logged in
          const currentUser = firebaseAuth.currentUser;
          if (currentUser) {
            console.log('✅ User is logged in - registering FCM token on app startup...');
            await registerFCMToken(token);
          } else {
            console.log('ℹ️ User not logged in - FCM token will be registered after login');
          }
        }
      } catch (error) {
        console.error('Error setting up FCM:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupFCM();

    // Handle app state changes (foreground/background)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 App came to foreground - refreshing FCM token...');
        // Refresh token when app comes to foreground
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);

          // Register token with backend if user is logged in
          const currentUser = firebaseAuth.currentUser;
          if (currentUser) {
            await registerFCMToken(token);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      subscription.remove();
    };
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await requestNotificationPermission();
      setHasPermission(granted);

      if (granted) {
        const token = await getFCMToken();
        setFcmToken(token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const token = await getFCMToken();
      if (token) {
        setFcmToken(token);
      }
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
    }
  };

  const clearToken = async (): Promise<void> => {
    try {
      await deleteFCMToken();
      setFcmToken(null);
      setHasPermission(false);
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
  };

  const value: FCMContextType = {
    fcmToken,
    hasPermission,
    isLoading,
    requestPermission,
    refreshToken,
    clearToken,
  };

  return <FCMContext.Provider value={value}>{children}</FCMContext.Provider>;
};
