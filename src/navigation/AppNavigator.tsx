import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import OnboardingNavigator from './OnboardingNavigator';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/SplashScreen';
import UserOnboardingScreen from '../screens/auth/UserOnboardingScreen';
import AddressSetupScreen from '../screens/auth/AddressSetupScreen';
import { RootStackParamList } from '../types/navigation';
import { useUser } from '../context/UserContext';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { firebaseUser, user, isLoading, isGuest, needsAddressSetup } = useUser();

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#F56B4C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isGuest ? (
          // Guest mode - show main app with limited access
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : !firebaseUser ? (
          // User is not authenticated - show onboarding and auth screens
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : !user?.isOnboarded ? (
          // User is authenticated but hasn't completed profile onboarding
          <Stack.Screen name="UserOnboarding" component={UserOnboardingScreen} />
        ) : needsAddressSetup ? (
          // User is onboarded but needs to set up delivery address
          <Stack.Screen name="AddressSetup" component={AddressSetupScreen} />
        ) : (
          // User is fully authenticated, onboarded, and has address - show main app
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;