/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import './global.css';
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { AddressProvider, useAddress } from './src/context/AddressContext';
import { UserProvider } from './src/context/UserContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';

const AppContent = () => {
  const { requestLocationPermission, getCurrentLocationWithAddress } = useAddress();

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

    // Run location request asynchronously without blocking app startup
    requestLocation();
  }, []);

  return <AppNavigator />;
};

const App = () => {
  return (
    <UserProvider>
      <AddressProvider>
        <SubscriptionProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </SubscriptionProvider>
      </AddressProvider>
    </UserProvider>
  );
};

export default App;
