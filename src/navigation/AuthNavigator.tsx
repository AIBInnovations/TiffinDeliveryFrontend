// src/navigation/AuthNavigator.tsx
import React from 'react';
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import { AuthStackParamList } from '../types/navigation';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Smooth horizontal slide animation
        ...TransitionPresets.SlideFromRightIOS,
        // Optional: You can also use these alternatives:
        // cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        // Or for a fade effect:
        // cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      {/* Register, ForgotPassword go here later */}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
