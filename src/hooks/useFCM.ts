import { useEffect, useState } from 'react';
import { getFCMToken, initializeFCM, requestNotificationPermission } from '../services/fcm.service';

/**
 * Custom hook to manage FCM functionality
 */
export const useFCM = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupFCM = async () => {
      try {
        // Initialize FCM listeners
        unsubscribe = initializeFCM();

        // Request permission and get token
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          setHasPermission(true);
        }
      } catch (error) {
        console.error('Error setting up FCM:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupFCM();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const requestPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      setHasPermission(granted);

      if (granted) {
        const token = await getFCMToken();
        setFcmToken(token);
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  return {
    fcmToken,
    hasPermission,
    isLoading,
    requestPermission,
  };
};
