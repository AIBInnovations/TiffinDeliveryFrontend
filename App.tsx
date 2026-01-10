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
import { FCMProvider } from './src/context/FCMContext';

const App = () => {
  return (
    <UserProvider>
      <FCMProvider>
        <AddressProvider>
          <CartProvider>
            <AppNavigator />
          </CartProvider>
        </AddressProvider>
      </FCMProvider>
    </UserProvider>
  );
};

export default App;
