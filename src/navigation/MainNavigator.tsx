import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigationState } from '@react-navigation/native';
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
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import AutoOrderSettingsScreen from '../screens/subscription/AutoOrderSettingsScreen';
import SkipMealCalendarScreen from '../screens/subscription/SkipMealCalendarScreen';
import AutoOrderFailureScreen from '../screens/notifications/AutoOrderFailureScreen';
import BottomNavBar from '../components/BottomNavBar';
import { MainTabParamList } from '../types/navigation';

const Stack = createStackNavigator<MainTabParamList>();

// Main screens that should show the nav bar
const MAIN_SCREENS = ['Home', 'YourOrders', 'OnDemand', 'Account'];

// Wrapper component to render nav bar with navigation context
const NavBarWrapper = () => {
  const currentRoute = useNavigationState(state => {
    if (!state) return 'Home';
    const route = state.routes[state.index];
    return route.name;
  });

  // Determine which tab should be active based on current route
  const getActiveTab = (): 'home' | 'orders' | 'meals' | 'profile' | null => {
    if (currentRoute === 'Home') return 'home';
    if (currentRoute === 'YourOrders') return 'orders';
    if (currentRoute === 'OnDemand') return 'meals';
    if (currentRoute === 'Account') return 'profile';
    return null;
  };

  const activeTab = getActiveTab();
  const showNavBar = currentRoute ? MAIN_SCREENS.includes(currentRoute) : true;

  // Only show nav bar on main screens
  if (!showNavBar) return null;

  return <BottomNavBar activeTab={activeTab || 'home'} />;
};

const MainNavigatorContent = () => {
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
          animationEnabled: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="YourOrders" component={YourOrdersScreen} />
        <Stack.Screen name="OnDemand" component={OnDemandScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="Address" component={AddressScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="OurJourney" component={OurJourneyScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="MealPlans" component={MealPlansScreen} />
        <Stack.Screen name="BulkOrders" component={BulkOrdersScreen} />
        <Stack.Screen name="Vouchers" component={VouchersScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="AutoOrderSettings" component={AutoOrderSettingsScreen} />
        <Stack.Screen name="SkipMealCalendar" component={SkipMealCalendarScreen} />
        <Stack.Screen name="AutoOrderFailure" component={AutoOrderFailureScreen} />
      </Stack.Navigator>

      {/* Render NavBarWrapper inside the navigator context */}
      <NavBarWrapper />
    </View>
  );
};

const MainNavigator = () => {
  return <MainNavigatorContent />;
};

export default MainNavigator;
