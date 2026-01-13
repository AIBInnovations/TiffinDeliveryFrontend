import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/home/HomeScreen';
import AddressScreen from '../screens/address/AddressScreen';
import CartScreen from '../screens/cart/CartScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import AccountScreen from '../screens/account/AccountScreen';
import EditProfileScreen from '../screens/account/EditProfileScreen';
import HelpSupportScreen from '../screens/account/HelpSupportScreen';
import AboutScreen from '../screens/account/AboutScreen';
import OurJourneyScreen from '../screens/account/OurJourneyScreen';
import YourOrdersScreen from '../screens/orders/YourOrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';
import MealPlansScreen from '../screens/account/MealPlansScreen';
import BulkOrdersScreen from '../screens/account/BulkOrdersScreen';
import VouchersScreen from '../screens/account/VouchersScreen';
import OnDemandScreen from '../screens/ondemand/OnDemandScreen';
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
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="OurJourney" component={OurJourneyScreen} />
      <Stack.Screen name="YourOrders" component={YourOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="MealPlans" component={MealPlansScreen} />
      <Stack.Screen name="BulkOrders" component={BulkOrdersScreen} />
      <Stack.Screen name="Vouchers" component={VouchersScreen} />
      <Stack.Screen name="OnDemand" component={OnDemandScreen} />
      {/* Other screens like Menu, Profile can be added here */}
    </Stack.Navigator>
  );
};

export default MainNavigator;
