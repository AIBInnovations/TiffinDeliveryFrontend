// TypeScript type definitions for Auth API responses
// Backend returns { status, message, data, error } structure (NOT { success, message, data })

// Base auth response structure
export interface AuthApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
  error?: string | null;
}

// Sync user response data structure
export interface SyncUserData {
  user: {
    _id: string;
    phone: string;
    role: string;
    name?: string;
    email?: string;
    dietaryPreferences?: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  isNewUser: boolean;
  isProfileComplete: boolean;
}

export type SyncUserResponse = AuthApiResponse<SyncUserData>;

// Register/Update user response data structure
export interface UserData {
  user: {
    _id: string;
    phone: string;
    role: string;
    name: string;
    email?: string;
    dietaryPreferences?: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  isProfileComplete: boolean;
}

export type RegisterUserResponse = AuthApiResponse<UserData>;
export type UpdateProfileResponse = AuthApiResponse<UserData>;

// FCM token response
export type FCMTokenResponse = AuthApiResponse<null>;
