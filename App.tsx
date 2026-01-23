/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import './global.css';
import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { AddressProvider, useAddress } from './src/context/AddressContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { PaymentProvider } from './src/context/PaymentContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';
import NotificationPopup from './src/components/NotificationPopup';
import notificationService from './src/services/notification.service';
import notificationChannelService from './src/services/notificationChannel.service';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

const AppContent = () => {
  const { requestLocationPermission, getCurrentLocationWithAddress } = useAddress();
  const { isAuthenticated } = useUser();
  const {
    fetchLatestUnread,
    fetchUnreadCount,
    latestUnreadNotification,
    showPopup,
    dismissPopup,
  } = useNotifications();
  const navigationRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  // Handle notification deep linking
  const handleNotification = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const navigationData = notificationService.handleNotificationData(remoteMessage.data);

    if (navigationData && navigationRef.current) {
      // Navigate to the appropriate screen
      console.log('[App] Navigating to:', navigationData.screen);
      navigationRef.current.navigate(navigationData.screen, navigationData.params);
    }
  };

  // Display notification when app is in foreground
  const displayForegroundNotification = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('[App] Foreground notification received:', remoteMessage.notification?.title);

    // Fetch latest unread to update NotificationContext
    // This will trigger the NotificationPopup to display
    fetchLatestUnread();

    // Note: The intrusive Alert.alert has been replaced with NotificationPopup
    // which is a non-blocking banner displayed via NotificationContext
  };

  // Handle notification popup view action
  const handlePopupView = () => {
    dismissPopup();
    if (latestUnreadNotification) {
      // Navigate to notifications screen
      if (navigationRef.current) {
        navigationRef.current.navigate('Notifications');
      }
    }
  };

  // Set up FCM notification handlers
  useEffect(() => {
    let foregroundUnsubscribe: (() => void) | null = null;
    let notificationOpenedUnsubscribe: (() => void) | null = null;

    const setupNotifications = async () => {
      // Only set up notification handlers if user is authenticated
      if (!isAuthenticated) {
        console.log('[App] User not authenticated, skipping notification setup');
        return;
      }

      try {
        console.log('[App] Setting up FCM notification handlers...');

        // Create notification channels (Android 8+ only)
        await notificationChannelService.createChannels();

        // Request notification permission if not already granted
        const hasPermission = await notificationService.checkPermission();
        if (!hasPermission) {
          console.log('[App] Requesting notification permission...');
          const granted = await notificationService.requestPermission();
          if (granted) {
            console.log('[App] Notification permission granted');
          } else {
            console.log('[App] Notification permission denied');
          }
        } else {
          console.log('[App] Notification permission already granted');
        }

        // Handle notifications when app is in foreground
        foregroundUnsubscribe = await notificationService.setupForegroundHandler(
          displayForegroundNotification
        );

        // Handle notification opened (app in background/quit)
        notificationOpenedUnsubscribe = notificationService.setupNotificationOpenedHandler(
          handleNotification
        );

        // Check if app was opened by a notification
        const initialNotification = await notificationService.getInitialNotification();
        if (initialNotification) {
          console.log('[App] App opened by notification:', initialNotification);
          handleNotification(initialNotification);
        }

        // Fetch latest unread notification on app open
        fetchLatestUnread();

        console.log('[App] FCM notification handlers set up successfully');
      } catch (error) {
        console.error('[App] Error setting up FCM notification handlers:', error);
      }
    };

    setupNotifications();

    // Cleanup
    return () => {
      if (foregroundUnsubscribe) {
        foregroundUnsubscribe();
      }
      if (notificationOpenedUnsubscribe) {
        notificationOpenedUnsubscribe();
      }
    };
  }, [isAuthenticated]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // App has come to the foreground from background
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[App] App has come to the foreground');
        // Fetch latest unread notification
        fetchLatestUnread();
        // Refresh unread count
        fetchUnreadCount();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, fetchLatestUnread, fetchUnreadCount]);

  // Request location permission
  useEffect(() => {
    const requestLocation = async () => {
      try {
        console.log('[App] Requesting location permission...');

        // Request location permission on app start
        const granted = await requestLocationPermission();

        if (granted) {
          console.log('[App] Location permission granted, fetching location...');

          // Get current location with address and pincode
          // This runs in background and doesn't block app startup
          getCurrentLocationWithAddress()
            .then((location) => {
              console.log('[App] Location fetched successfully:', location.pincode);
            })
            .catch((error) => {
              console.log('[App] Location fetch failed (non-blocking):', error.message);
            });
        } else {
          console.log('[App] Location permission denied');
        }
      } catch (error) {
        console.log('[App] Location permission request error:', error);
      }
    };

    // Delay permission request to ensure Android Activity is fully attached
    // This prevents "Tried to use permissions API while not attached to an Activity" error
    const timer = setTimeout(() => {
      requestLocation();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AppNavigator ref={navigationRef} />
      <NotificationPopup
        visible={showPopup}
        notification={latestUnreadNotification}
        onDismiss={dismissPopup}
        onView={handlePopupView}
      />
    </>
  );
};

const App = () => {
  return (
    <UserProvider>
      <AddressProvider>
        <SubscriptionProvider>
          <PaymentProvider>
            <CartProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </CartProvider>
          </PaymentProvider>
        </SubscriptionProvider>
      </AddressProvider>
    </UserProvider>
  );
};

export default App;
