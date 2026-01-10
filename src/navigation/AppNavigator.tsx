import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingNavigator from './OnboardingNavigator';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LocationNavigator from './LocationNavigator';
import SplashScreen from '../screens/SplashScreen';
import UserOnboardingScreen from '../screens/auth/UserOnboardingScreen';
import { RootStackParamList } from '../types/navigation';
import { useUser } from '../context/UserContext';

const Stack = createStackNavigator<RootStackParamList>();
const LOCATION_SETUP_KEY = '@location_setup_complete';

const AppNavigator = () => {
  const { firebaseUser, user, isLoading, isGuest } = useUser();
  const [isLocationSetupComplete, setIsLocationSetupComplete] = useState<boolean | null>(null);

  // Debug: Log navigation state
  console.log('🚦 AppNavigator - Navigation State:', {
    isGuest,
    hasFirebaseUser: !!firebaseUser,
    isOnboarded: user?.isOnboarded,
    isLocationSetupComplete,
    isLoading,
  });

  // Extract location check into a reusable function
  const checkLocationSetup = useCallback(async () => {
    try {
      const setupComplete = await AsyncStorage.getItem(LOCATION_SETUP_KEY);
      console.log('📍 Location setup complete status:', setupComplete);
      setIsLocationSetupComplete(setupComplete === 'true');
    } catch (error) {
      console.error('Error checking location setup:', error);
      setIsLocationSetupComplete(false);
    }
  }, []);

  // Check if location setup is complete on mount and when user.isOnboarded changes
  useEffect(() => {
    if (user?.isOnboarded) {
      console.log('✅ User is onboarded, checking location setup...');
      checkLocationSetup();
    } else {
      // Reset location setup state when user is not onboarded
      setIsLocationSetupComplete(null);
    }
  }, [user?.isOnboarded, checkLocationSetup]);

  // Add listener for app state changes to re-check location setup
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user?.isOnboarded) {
        console.log('📱 App became active, re-checking location setup...');
        checkLocationSetup();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.isOnboarded, checkLocationSetup]);

  // Add periodic check for location setup (every 2 seconds) when on LocationFlow
  useEffect(() => {
    if (user?.isOnboarded && isLocationSetupComplete === false) {
      console.log('⏱️ Starting periodic location setup check...');
      const interval = setInterval(() => {
        checkLocationSetup();
      }, 2000);

      return () => {
        console.log('⏱️ Stopping periodic location setup check');
        clearInterval(interval);
      };
    }
  }, [user?.isOnboarded, isLocationSetupComplete, checkLocationSetup]);

  // Show loading screen while checking auth state or location setup
  if (isLoading || (user?.isOnboarded && isLocationSetupComplete === null)) {
    console.log('⏳ Showing loading screen...');
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#F56B4C" />
      </View>
    );
  }

  // Determine which screen to show
  let screenToShow = 'Unknown';
  if (isGuest) {
    screenToShow = 'Main (Guest)';
  } else if (!firebaseUser) {
    screenToShow = 'Auth Flow';
  } else if (!user?.isOnboarded) {
    screenToShow = 'UserOnboarding';
  } else if (!isLocationSetupComplete) {
    screenToShow = 'LocationFlow (Zone Check)';
  } else {
    screenToShow = 'Main (Authenticated)';
  }
  console.log('🎯 Rendering screen:', screenToShow);

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
        ) : !isLocationSetupComplete ? (
          // User is onboarded but hasn't set up location
          <Stack.Screen name="LocationFlow" component={LocationNavigator} />
        ) : (
          // User is authenticated, onboarded, and has location - show main app
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Export function to mark location setup as complete
export const markLocationSetupComplete = async () => {
  try {
    await AsyncStorage.setItem(LOCATION_SETUP_KEY, 'true');
    console.log('✅ Location setup marked as complete');
  } catch (error) {
    console.error('❌ Error marking location setup complete:', error);
  }
};

export default AppNavigator;