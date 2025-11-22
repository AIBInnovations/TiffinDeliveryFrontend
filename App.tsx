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

const App = () => {
  return (
    <AddressProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </AddressProvider>
  );
};

export default App;
