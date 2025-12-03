import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuth } from '../config/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import apiService from '../services/api.service';

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
  dietaryPreferences?: DietaryPreferences;
  isOnboarded: boolean;
  isProfileComplete?: boolean;
  createdAt?: Date;
}

interface UserContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isGuest: boolean;
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  loginWithPhone: (phoneNumber: string) => Promise<FirebaseAuthTypes.ConfirmationResult>;
  verifyOTP: (confirmation: FirebaseAuthTypes.ConfirmationResult, code: string) => Promise<{ isOnboarded: boolean }>;
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

  const checkProfileStatusInternal = async (): Promise<UserProfile | null> => {
    try {
      const response: any = await apiService.getCustomerProfile();
      if (response.success && response.data.profile) {
        const profileData: UserProfile = {
          id: response.data.profile.customerId,
          name: response.data.profile.name || undefined,
          email: response.data.profile.email || undefined,
          phone: response.data.profile.phone || undefined,
          dietaryPreferences: response.data.dietaryPreferences || undefined,
          isOnboarded: response.data.profile.isProfileComplete || false,
          isProfileComplete: response.data.profile.isProfileComplete,
          createdAt: response.data.profile.createdAt ? new Date(response.data.profile.createdAt) : undefined,
        };
        setUser(profileData);
        await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
        return profileData;
      }
    } catch (error: any) {
      console.error('Error checking profile status:', error);
    }
    return null;
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
  ): Promise<{ isOnboarded: boolean }> => {
    await confirmation.confirm(code);
    // After successful verification, check backend profile status
    const profileData = await checkProfileStatusInternal();
    // Return the onboarding status from the fresh data (not stale closure)
    return { isOnboarded: profileData?.isOnboarded ?? false };
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
      // Call backend API to complete onboarding
      const response: any = await apiService.completeOnboarding(data);

      if (response.success) {
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
      console.error('Error completing onboarding:', error);
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
