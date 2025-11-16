import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/home/HomeScreen';
import AddressScreen from '../screens/address/AddressScreen';
import CartScreen from '../screens/cart/CartScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import { MainTabParamList } from '../types/navigation';

const Stack = createStackNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      {/* Other screens like Menu, Orders, Profile can be added here */}
    </Stack.Navigator>
  );
};

export default MainNavigator;
