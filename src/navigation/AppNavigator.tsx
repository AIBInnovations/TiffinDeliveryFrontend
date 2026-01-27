import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, Image, Text } from 'react-native';
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

  // Firebase authenticated but user profile not yet synced from backend
  // Show branded loading screen (matching SplashScreen style) to prevent flash
  if (firebaseUser && !user && !isGuest) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F56B4C', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
          <Text style={{ color: 'white', fontSize: 32, marginLeft: 8, fontWeight: '600' }}>LOGO</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, marginBottom: 32 }}>
          <Text style={{ color: 'white', fontSize: 20 }}>Order</Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />
          <Text style={{ color: 'white', fontSize: 20 }}>Eat</Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />
          <Text style={{ color: 'white', fontSize: 20 }}>Enjoy</Text>
        </View>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: '#F56B4C',
          background: '#FFFFFF',
          card: '#FFFFFF',
          text: '#000000',
          border: '#FFFFFF',
          notification: '#F56B4C',
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