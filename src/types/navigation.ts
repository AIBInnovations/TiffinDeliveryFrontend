// src/types/navigation.ts
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

// Onboarding Stack
export type OnboardingStackParamList = {
  OnboardingScreen1: undefined;
  OnboardingScreen2: undefined;
  OnboardingScreen3: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  OTPVerification: { phoneNumber: string };
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Address: undefined;
  Menu: undefined;
  Cart: undefined;
  Profile: undefined;
  Payment: undefined;
  Account: undefined;
  HelpSupport: undefined;
  About: undefined;
  OurJourney: undefined;
  YourOrders: undefined;
  OrderTracking: undefined;
  MealPlans: undefined;
  BulkOrders: undefined;
};

// Root navigation props
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

// ✅ Onboarding navigation props (for each onboarding screen)
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = {
  navigation: CompositeNavigationProp<
    StackNavigationProp<OnboardingStackParamList, T>,
    StackNavigationProp<RootStackParamList>
  >;
  route: RouteProp<OnboardingStackParamList, T>;
};

// ✅ Auth navigation props (for each auth screen)
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;
