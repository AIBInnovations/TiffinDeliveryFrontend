import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuth } from '../config/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import apiService from '../services/api.service';
import type { SyncUserResponse, RegisterUserResponse, UpdateProfileResponse } from '../types/auth';

export interface DietaryPreferences {
  foodType?: 'VEG' | 'NON-VEG' | 'VEGAN';
  eggiterian?: boolean;
  jainFriendly?: boolean;
  dabbaType?: 'DISPOSABLE' | 'STEEL DABBA';
  spiceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface UserProfile {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  dietaryPreferences?: DietaryPreferences | string[];
  isOnboarded: boolean;
  isProfileComplete?: boolean;
  isNewUser?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isGuest: boolean;
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  loginWithPhone: (phoneNumber: string) => Promise<FirebaseAuthTypes.ConfirmationResult>;
  verifyOTP: (confirmation: FirebaseAuthTypes.ConfirmationResult, code: string) => Promise<{
    isNewUser: boolean;
    isProfileComplete: boolean;
    user?: UserProfile;
  }>;
  registerUser: (data: {
    name: string;
    email?: string;
    dietaryPreferences?: string[];
  }) => Promise<void>;
  updateUserProfile: (data: {
    name?: string;
    email?: string;
    dietaryPreferences?: string[];
    profileImage?: string;
  }) => Promise<void>;
  registerFCMToken: (fcmToken: string, deviceId: string) => Promise<void>;
  completeOnboarding: (data: {
    name: string;
    email?: string;
    dietaryPreferences?: DietaryPreferences;
  }) => Promise<void>;
  logout: () => Promise<void>;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  isAuthenticated: boolean;
  checkProfileStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if user was in guest mode
      const guestFlag = await AsyncStorage.getItem('is_guest');
      if (guestFlag === 'true') {
        setIsGuest(true);
      }

      // ALWAYS set up Firebase auth listener (even for guests who may login later)
      const unsubscribe = firebaseAuth.onAuthStateChanged(async (fbUser) => {
        console.log('Auth state changed:', fbUser?.uid);
        setFirebaseUser(fbUser);

        if (fbUser) {
          // User authenticated - exit guest mode if active
          if (guestFlag === 'true') {
            setIsGuest(false);
            await AsyncStorage.removeItem('is_guest');
          }

          // Always verify with backend (use cached data as fallback)
          try {
            await checkProfileStatusInternal();
          } catch (error: any) {
            console.error('⚠️ Sync failed - using fallback strategy:', {
              message: error?.message || 'Unknown error',
              errorType: error?.data?.error || 'Unknown'
            });

            // Fallback to cached data if backend fails
            const storedUser = await AsyncStorage.getItem('user_profile');
            if (storedUser) {
              console.log('✅ Using cached user profile');
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } else {
              // No cached data - assume new user who needs onboarding
              console.log('ℹ️ No cached profile - assuming new user');
              const newUserProfile: UserProfile = {
                phone: fbUser?.phoneNumber || undefined,
                isOnboarded: false,
                isProfileComplete: false,
                isNewUser: true,
              };
              setUser(newUserProfile);
            }
          }
        } else {
          // User logged out
          setUser(null);
          await AsyncStorage.removeItem('user_profile');
        }

        setIsLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribePromise = initializeAuth();

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, []);

  const checkProfileStatusInternal = async (): Promise<{
    isNewUser: boolean;
    isProfileComplete: boolean;
    user?: UserProfile;
  }> => {
    try {
      // Use the new sync endpoint
      const response: SyncUserResponse = await apiService.syncUser();
      console.log('Sync user response:', JSON.stringify(response, null, 2));

      // Backend returns { status, message, data, error } structure (NOT { success })
      // Check that response is valid and has no error
      if (!response.error && response.data) {
        const { isNewUser, isProfileComplete, user: userData } = response.data;

        if (userData) {
          // User exists (either complete or incomplete profile)
          const profileData: UserProfile = {
            id: userData._id,
            _id: userData._id,
            name: userData.name || undefined,
            email: userData.email || undefined,
            phone: userData.phone || firebaseUser?.phoneNumber || undefined,
            role: userData.role,
            status: userData.status,
            dietaryPreferences: userData.dietaryPreferences || undefined,
            isOnboarded: isProfileComplete,
            isProfileComplete: isProfileComplete,
            isNewUser: false,
            createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
            updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : undefined,
          };

          setUser(profileData);
          await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));

          return { isNewUser, isProfileComplete, user: profileData };
        } else {
          // New user
          const newUserProfile: UserProfile = {
            phone: firebaseUser?.phoneNumber || undefined,
            isOnboarded: false,
            isProfileComplete: false,
            isNewUser: true,
          };

          setUser(newUserProfile);
          await AsyncStorage.setItem('user_profile', JSON.stringify(newUserProfile));

          return { isNewUser: true, isProfileComplete: false, user: newUserProfile };
        }
      } else {
        // Handle error case - response has error or no data
        const errorMessage = response.error || response.message || 'Failed to sync user';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error checking profile status:', {
        message: error?.message || 'Unknown error',
        errorData: error,
        errorString: JSON.stringify(error, null, 2)
      });
      throw error;
    }

    return { isNewUser: true, isProfileComplete: false };
  };

  const checkProfileStatus = async () => {
    await checkProfileStatusInternal();
  };

  const loginWithPhone = async (phoneNumber: string): Promise<FirebaseAuthTypes.ConfirmationResult> => {
    const confirmation = await firebaseAuth.signInWithPhoneNumber(phoneNumber);
    return confirmation;
  };

  const verifyOTP = async (
    confirmation: FirebaseAuthTypes.ConfirmationResult,
    code: string
  ): Promise<{
    isNewUser: boolean;
    isProfileComplete: boolean;
    user?: UserProfile;
  }> => {
    // Verify OTP with Firebase
    await confirmation.confirm(code);

    // After successful verification, sync with backend
    const syncResult = await checkProfileStatusInternal();

    // Register FCM token after successful login (for existing users)
    if (!syncResult.isNewUser && syncResult.isProfileComplete) {
      console.log('📱 User logged in successfully - registering FCM token...');
      const fcmService = await import('../services/fcm.service');
      const fcmToken = await fcmService.getFCMToken();
      if (fcmToken) {
        await fcmService.registerFCMToken(fcmToken);
      }
    }

    return syncResult;
  };

  const registerUser = async (data: {
    name: string;
    email?: string;
    dietaryPreferences?: string[];
  }) => {
    try {
      const response: RegisterUserResponse = await apiService.registerUser(data);
      console.log('Register user response:', JSON.stringify(response, null, 2));

      // Backend returns { status, message, data, error } structure (NOT { success })
      if (!response.error && response.data?.user) {
        const userData = response.data.user;
        const profileData: UserProfile = {
          id: userData._id,
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          dietaryPreferences: userData.dietaryPreferences,
          isOnboarded: response.data.isProfileComplete !== false,
          isProfileComplete: response.data.isProfileComplete !== false,
          isNewUser: false,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
          updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : undefined,
        };

        setUser(profileData);
        await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
        console.log('✅ User state updated after registration:', JSON.stringify(profileData, null, 2));

        // Register FCM token after successful registration
        console.log('📱 User registered successfully - registering FCM token...');
        const fcmService = await import('../services/fcm.service');
        const fcmToken = await fcmService.getFCMToken();
        if (fcmToken) {
          await fcmService.registerFCMToken(fcmToken);
        }
      } else {
        // Handle error in response
        const errorMessage = response.error || response.message || 'Invalid response from server';
        console.error('❌ API error:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error registering user:', {
        message: error?.message || 'Unknown error',
        errorData: error,
        errorString: JSON.stringify(error, null, 2)
      });

      // Handle "User already exists" scenario gracefully
      const errorMessage = error?.message || '';
      if ((errorMessage.includes('already exists') || errorMessage.includes('User already exists')) && error.data?.user) {
        console.log('✅ User already exists - using existing user data');
        const userData = error.data.user;
        const profileData: UserProfile = {
          id: userData._id,
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          dietaryPreferences: userData.dietaryPreferences,
          isOnboarded: error.data.isProfileComplete !== false,
          isProfileComplete: error.data.isProfileComplete !== false,
          isNewUser: false,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
          updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : undefined,
        };

        setUser(profileData);
        await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));

        // Register FCM token for existing user too
        console.log('📱 Existing user logged in - registering FCM token...');
        const fcmService = await import('../services/fcm.service');
        const fcmToken = await fcmService.getFCMToken();
        if (fcmToken) {
          await fcmService.registerFCMToken(fcmToken);
        }

        // Don't throw - user exists is actually success!
        return;
      }

      throw error;
    }
  };

  const updateUserProfile = async (data: {
    name?: string;
    email?: string;
    dietaryPreferences?: string[];
    profileImage?: string;
  }) => {
    try {
      const response: UpdateProfileResponse = await apiService.updateProfile(data);
      console.log('Update profile response:', JSON.stringify(response, null, 2));

      // Backend returns { status, message, data, error } structure (NOT { success })
      if (!response.error && response.data?.user) {
        const userData = response.data.user;
        const profileData: UserProfile = {
          id: userData._id,
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          dietaryPreferences: userData.dietaryPreferences,
          isOnboarded: response.data.isProfileComplete !== false,
          isProfileComplete: response.data.isProfileComplete !== false,
          isNewUser: false,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
          updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : undefined,
        };

        setUser(profileData);
        await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
        console.log('✅ User state updated after profile update:', JSON.stringify(profileData, null, 2));

        // Register FCM token after successful profile update
        console.log('📱 Profile updated successfully - registering FCM token...');
        const fcmService = await import('../services/fcm.service');
        const fcmToken = await fcmService.getFCMToken();
        if (fcmToken) {
          await fcmService.registerFCMToken(fcmToken);
        }
      } else {
        // Handle error in response
        const errorMessage = response.error || response.message || 'Invalid response from server';
        console.error('❌ API error:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating profile:', {
        message: error?.message || 'Unknown error',
        errorData: error,
        errorString: JSON.stringify(error, null, 2)
      });
      throw error;
    }
  };

  const registerFCMToken = async (fcmToken: string, deviceId: string) => {
    try {
      await apiService.registerFCMToken({ fcmToken, deviceId });
    } catch (error: any) {
      console.error('Error registering FCM token:', error);
      // Don't throw - FCM registration failure shouldn't block user flow
    }
  };

  const enterGuestMode = async () => {
    setIsGuest(true);
    await AsyncStorage.setItem('is_guest', 'true');
  };

  const exitGuestMode = async () => {
    setIsGuest(false);
    await AsyncStorage.removeItem('is_guest');
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
      AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const completeOnboarding = async (data: {
    name: string;
    email?: string;
    dietaryPreferences?: DietaryPreferences;
  }) => {
    try {
      // Call backend API to complete onboarding (DEPRECATED - use registerUser or updateUserProfile instead)
      const response: any = await apiService.completeOnboarding(data);

      // Backend returns { status, message, data, error } structure (NOT { success })
      if (!response.error && response.data) {
        const updatedUser: UserProfile = {
          ...user,
          id: response.data.customerId || firebaseUser?.uid,
          name: response.data.name,
          email: response.data.email,
          phone: firebaseUser?.phoneNumber || undefined,
          dietaryPreferences: response.data.dietaryPreferences,
          isOnboarded: true,
          isProfileComplete: response.data.isProfileComplete,
          createdAt: new Date(),
        };

        setUser(updatedUser);
        await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error('Error completing onboarding:', {
        message: error?.message || 'Unknown error',
        errorData: error,
        errorString: JSON.stringify(error, null, 2)
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseAuth.signOut();
      setUser(null);
      setFirebaseUser(null);
      setIsGuest(false);
      await AsyncStorage.removeItem('user_profile');
      await AsyncStorage.removeItem('is_guest');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const isAuthenticated = !!firebaseUser && !!user?.isOnboarded;

  return (
    <UserContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        isGuest,
        setUser,
        updateUser,
        loginWithPhone,
        verifyOTP,
        registerUser,
        updateUserProfile,
        registerFCMToken,
        completeOnboarding,
        logout,
        enterGuestMode,
        exitGuestMode,
        isAuthenticated,
        checkProfileStatus,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
