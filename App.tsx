/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import './global.css';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { AddressProvider } from './src/context/AddressContext';
import { UserProvider } from './src/context/UserContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';

const App = () => {
  return (
    <UserProvider>
      <AddressProvider>
        <SubscriptionProvider>
          <CartProvider>
            <AppNavigator />
          </CartProvider>
        </SubscriptionProvider>
      </AddressProvider>
    </UserProvider>
  );
};

export default App;
