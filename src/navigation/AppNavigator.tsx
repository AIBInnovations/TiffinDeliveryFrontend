import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingNavigator from './OnboardingNavigator';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen, { SplashView } from '../screens/SplashScreen';
import UserOnboardingScreen from '../screens/auth/UserOnboardingScreen';
import AddressSetupScreen from '../screens/auth/AddressSetupScreen';
import { RootStackParamList } from '../types/navigation';
import { useUser } from '../context/UserContext';
import { navigationRef } from './navigationRef';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { firebaseUser, user, isLoading, isGuest, needsAddressSetup } = useUser();

  // Show splash screen while checking auth state
  if (isLoading || (firebaseUser && !user && !isGuest)) {
    return <SplashView />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: false,
        colors: {
          primary: '#ff8800',
          background: '#FFFFFF',
          card: '#FFFFFF',
          text: '#000000',
          border: '#FFFFFF',
          notification: '#ff8800',
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
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
