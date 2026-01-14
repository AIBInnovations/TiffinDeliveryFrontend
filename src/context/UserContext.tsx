import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuth } from '../config/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import apiService from '../services/api.service';
import notificationService from '../services/notification.service';

// ============================================
// OFFLINE MODE FLAG - Set to false to enable backend
// ============================================
const OFFLINE_MODE = false;

export interface DietaryPreferences {
  foodType?: 'VEG' | 'NON-VEG' | 'VEGAN';
  eggiterian?: boolean;
  jainFriendly?: boolean;
  dabbaType?: 'DISPOSABLE' | 'STEEL DABBA';
  spiceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  dietaryPreferences?: DietaryPreferences | string[];
  isOnboarded: boolean;
  isProfileComplete?: boolean;
  isNewUser?: boolean;
  hasAddress?: boolean;
  createdAt?: Date;
}

interface UserContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isGuest: boolean;
  needsAddressSetup: boolean;
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  loginWithPhone: (phoneNumber: string) => Promise<FirebaseAuthTypes.ConfirmationResult>;
  verifyOTP: (confirmation: FirebaseAuthTypes.ConfirmationResult, code: string) => Promise<{ isOnboarded: boolean; isNewUser: boolean; isProfileComplete: boolean }>;
  completeOnboarding: (data: {
    name: string;
    email?: string;
    dietaryPreferences?: DietaryPreferences;
  }) => Promise<void>;
  registerFcmToken: () => Promise<boolean>;
  logout: () => Promise<void>;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  isAuthenticated: boolean;
  checkProfileStatus: () => Promise<void>;
  setNeedsAddressSetup: (value: boolean) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [needsAddressSetup, setNeedsAddressSetup] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if user was in guest mode
      const guestFlag = await AsyncStorage.getItem('is_guest');
      if (guestFlag === 'true') {
        setIsGuest(true);
      }

      // ALWAYS set up Firebase auth listener (even for guests who may login later)
      // Using the imported onAuthStateChanged function from the modular API
      const { onAuthStateChanged } = require('@react-native-firebase/auth').default;
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseAuthTypes.User | null) => {
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
            await syncUserInternal();
          } catch (error) {
            console.error('Error checking profile status:', error);
            // Fallback to cached data if backend fails
            const storedUser = await AsyncStorage.getItem('user_profile');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
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

  const syncUserInternal = async (): Promise<{ userProfile: UserProfile | null; isNewUser: boolean; isProfileComplete: boolean }> => {
    // OFFLINE MODE: Skip backend call, use cached data or return new user as not onboarded
    if (OFFLINE_MODE) {
      console.log('[OFFLINE MODE] Skipping backend sync');
      const storedUser = await AsyncStorage.getItem('user_profile');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        return { userProfile: parsedUser, isNewUser: false, isProfileComplete: parsedUser.isProfileComplete ?? false };
      }
      // New user - not onboarded yet
      const newUserProfile: UserProfile = {
        id: firebaseUser?.uid,
        phone: firebaseUser?.phoneNumber || undefined,
        isOnboarded: false,
        isProfileComplete: false,
        isNewUser: true,
      };
      setUser(newUserProfile);
      return { userProfile: newUserProfile, isNewUser: true, isProfileComplete: false };
    }

    // BACKEND MODE: Call /api/auth/sync
    try {
      const response = await apiService.syncUser();
      if (response.data) {
        const { user: userData, isNewUser, isProfileComplete } = response.data;

        // If user is null (new user not registered yet), create a temporary profile
        if (userData === null) {
          const newUserProfile: UserProfile = {
            id: undefined,
            phone: firebaseUser?.phoneNumber || undefined,
            isOnboarded: false,
            isProfileComplete: false,
            isNewUser: true,
          };
          setUser(newUserProfile);
          return { userProfile: newUserProfile, isNewUser: true, isProfileComplete: false };
        }

        // Existing user (either complete or incomplete profile)
        const profileData: UserProfile = {
          id: userData._id,
          name: userData.name || undefined,
          email: userData.email || undefined,
          phone: userData.phone || firebaseUser?.phoneNumber || undefined,
          profileImage: userData.profileImage || undefined,
          dietaryPreferences: userData.dietaryPreferences || undefined,
          isOnboarded: isProfileComplete,
          isProfileComplete: isProfileComplete,
          isNewUser: isNewUser,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
        };
        setUser(profileData);
        await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
        return { userProfile: profileData, isNewUser, isProfileComplete };
      }
    } catch (error: any) {
      console.error('Error syncing user:', error);
      // Fallback to cached data if backend fails
      const storedUser = await AsyncStorage.getItem('user_profile');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        return { userProfile: parsedUser, isNewUser: false, isProfileComplete: parsedUser.isProfileComplete ?? false };
      }
    }
    return { userProfile: null, isNewUser: true, isProfileComplete: false };
  };

  const checkProfileStatus = async () => {
    await syncUserInternal();
  };

  // Refresh user profile from API (used after profile updates)
  const refreshUser = async () => {
    console.log('[UserContext] Refreshing user profile');
    try {
      const response = await apiService.getProfile();
      console.log('[UserContext] Profile refresh response:', JSON.stringify(response, null, 2));

      // Handle response format (data.user or error.user)
      const userData = response.data?.user || (response as any).error?.user;
      if (userData) {
        const profileData: UserProfile = {
          id: userData._id,
          name: userData.name || undefined,
          email: userData.email || undefined,
          phone: userData.phone || firebaseUser?.phoneNumber || undefined,
          profileImage: userData.profileImage || undefined,
          dietaryPreferences: userData.dietaryPreferences || undefined,
          isOnboarded: true,
          isProfileComplete: true,
          isNewUser: false,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
        };
        setUser(profileData);
        await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
        console.log('[UserContext] Profile refreshed successfully');
      }
    } catch (error: any) {
      console.error('[UserContext] Error refreshing profile:', error.message || error);
      // Fallback to sync if getProfile fails
      await syncUserInternal();
    }
  };

  const loginWithPhone = async (phoneNumber: string): Promise<FirebaseAuthTypes.ConfirmationResult> => {
    const confirmation = await firebaseAuth.signInWithPhoneNumber(phoneNumber);
    return confirmation;
  };

  const verifyOTP = async (
    confirmation: FirebaseAuthTypes.ConfirmationResult,
    code: string
  ): Promise<{ isOnboarded: boolean; isNewUser: boolean; isProfileComplete: boolean }> => {
    await confirmation.confirm(code);
    // After successful verification, sync with backend
    const { userProfile, isNewUser, isProfileComplete } = await syncUserInternal();
    // Return the onboarding status from the fresh data
    return {
      isOnboarded: userProfile?.isOnboarded ?? false,
      isNewUser,
      isProfileComplete,
    };
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
    // OFFLINE MODE: Skip backend call, save locally
    if (OFFLINE_MODE) {
      console.log('[OFFLINE MODE] Completing onboarding locally');
      const updatedUser: UserProfile = {
        ...user,
        id: firebaseUser?.uid || 'offline_user_' + Date.now(),
        name: data.name,
        email: data.email,
        phone: firebaseUser?.phoneNumber || undefined,
        dietaryPreferences: data.dietaryPreferences,
        isOnboarded: true,
        isProfileComplete: true,
        isNewUser: false,
        createdAt: new Date(),
      };

      setUser(updatedUser);
      await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
      // Trigger address setup after profile completion
      setNeedsAddressSetup(true);
      return;
    }

    // BACKEND MODE: Call register for new users, updateProfile for existing users
    try {
      // Convert dietaryPreferences to array format expected by backend
      const dietaryPrefsArray: string[] = [];
      if (data.dietaryPreferences) {
        if (data.dietaryPreferences.foodType) {
          dietaryPrefsArray.push(data.dietaryPreferences.foodType);
        }
        if (data.dietaryPreferences.jainFriendly) {
          dietaryPrefsArray.push('JAIN');
        }
        if (data.dietaryPreferences.eggiterian) {
          dietaryPrefsArray.push('EGG');
        }
      }

      // Determine if we need to register (new user) or update profile (existing user)
      const isNewUser = user?.isNewUser === true;

      let responseData;
      if (isNewUser) {
        // New user - call register endpoint
        console.log('Registering new user...');
        const response = await apiService.registerUser({
          name: data.name,
          email: data.email,
          dietaryPreferences: dietaryPrefsArray,
        });
        responseData = response.data;
      } else {
        // Existing user with incomplete profile - call update endpoint
        console.log('Updating existing user profile...');
        const response = await apiService.updateProfile({
          name: data.name,
          email: data.email,
          dietaryPreferences: dietaryPrefsArray,
        });
        responseData = response.data;
      }

      if (responseData) {
        const { user: userData, isProfileComplete } = responseData;
        const updatedUser: UserProfile = {
          ...user,
          id: userData._id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || firebaseUser?.phoneNumber || undefined,
          dietaryPreferences: data.dietaryPreferences,
          isOnboarded: isProfileComplete,
          isProfileComplete: isProfileComplete,
          isNewUser: false,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        };

        setUser(updatedUser);
        await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
        // Trigger address setup after profile completion
        setNeedsAddressSetup(true);
      }
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const registerFcmToken = async (): Promise<boolean> => {
    // Skip in offline mode
    if (OFFLINE_MODE) {
      console.log('[OFFLINE MODE] Skipping FCM token registration');
      return true;
    }

    try {
      // Get FCM token
      const fcmToken = await notificationService.getToken();
      if (!fcmToken) {
        console.log('No FCM token available (permission denied or error)');
        return false;
      }

      // Get device ID
      const deviceId = await notificationService.getDeviceId();

      // Register with backend
      await apiService.registerFcmToken({
        fcmToken,
        deviceId,
      });

      console.log('FCM token registered successfully');
      return true;
    } catch (error: any) {
      console.error('Error registering FCM token:', error);
      // Don't throw - FCM registration failure shouldn't block the flow
      return false;
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
        needsAddressSetup,
        setUser,
        updateUser,
        loginWithPhone,
        verifyOTP,
        completeOnboarding,
        registerFcmToken,
        logout,
        enterGuestMode,
        exitGuestMode,
        isAuthenticated,
        checkProfileStatus,
        setNeedsAddressSetup,
        refreshUser,
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
