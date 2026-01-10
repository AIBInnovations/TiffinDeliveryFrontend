# Tiffsy Authentication & Onboarding Flow

Complete documentation for the authentication, registration, and onboarding flow in the Tiffsy mobile application.

**Base URL:** `https://tiffsy-backend.onrender.com`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow Diagram](#authentication-flow-diagram)
3. [API Endpoints](#api-endpoints)
4. [Client Implementation](#client-implementation)
5. [Permission Handling](#permission-handling)
6. [Address & Serviceability](#address--serviceability)
7. [Error Handling](#error-handling)

---

## Overview

The Tiffsy app uses a Firebase-first authentication approach:

1. **Phone Verification**: User verifies phone number via Firebase OTP
2. **Token Generation**: Firebase SDK generates and sends token to client
3. **Backend Sync**: Client syncs with backend to check user status
4. **Conditional Flow**:
   - **New User**: Register with profile details
   - **Incomplete Profile**: Complete profile details
   - **Complete Profile**: Direct access to app
5. **Permissions**: Request notification and location permissions
6. **Serviceability Check**: Verify delivery availability for user's location
7. **Home Screen**: Navigate to menu with personalized content

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ENTERS PHONE NUMBER                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              FIREBASE SENDS OTP & USER VERIFIES                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│           FIREBASE RETURNS ID TOKEN TO CLIENT                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│     CLIENT CALLS: POST /api/auth/sync (with Firebase token)    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┬─────────────────────┐
         │                                 │                     │
         ▼                                 ▼                     ▼
┌─────────────────┐              ┌─────────────────┐   ┌─────────────────┐
│  isNewUser:     │              │  isNewUser:     │   │  isNewUser:     │
│  true           │              │  false          │   │  false          │
│                 │              │  isProfileCom-  │   │  isProfileCom-  │
│                 │              │  plete: false   │   │  plete: true    │
└────────┬────────┘              └────────┬────────┘   └────────┬────────┘
         │                                │                     │
         ▼                                ▼                     ▼
┌─────────────────┐              ┌─────────────────┐   ┌─────────────────┐
│ Show            │              │ Show            │   │ Store user in   │
│ Registration    │              │ Complete        │   │ context         │
│ Screen          │              │ Profile Screen  │   │                 │
└────────┬────────┘              └────────┬────────┘   └────────┬────────┘
         │                                │                     │
         │                                │                     │
         ▼                                ▼                     │
┌─────────────────┐              ┌─────────────────┐           │
│ User fills form │              │ User fills form │           │
└────────┬────────┘              └────────┬────────┘           │
         │                                │                     │
         ▼                                ▼                     │
┌─────────────────┐              ┌─────────────────┐           │
│ POST /api/auth/ │              │ PUT /api/auth/  │           │
│ register        │              │ profile         │           │
└────────┬────────┘              └────────┬────────┘           │
         │                                │                     │
         └────────────────┬───────────────┘                     │
                          │                                     │
                          └─────────────────┬───────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────────┐
                          │   REQUEST NOTIFICATION PERMISSION   │
                          └─────────────────┬───────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────────┐
                          │   POST /api/auth/fcm-token          │
                          │   (Register FCM token for push)     │
                          └─────────────────┬───────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────────┐
                          │   REQUEST LOCATION PERMISSION       │
                          └─────────────────┬───────────────────┘
                                            │
                          ┌─────────────────┴─────────────────┐
                          │                                   │
                          ▼                                   ▼
            ┌──────────────────────┐          ┌──────────────────────┐
            │ Permission Granted   │          │ Permission Denied    │
            │ Get current location │          │ Ask for manual input │
            └──────────┬───────────┘          └──────────┬───────────┘
                       │                                  │
                       └────────────┬─────────────────────┘
                                    │
                                    ▼
                  ┌───────────────────────────────────────────┐
                  │  POST /api/customer/check-serviceability  │
                  │  (Check if pincode is serviceable)        │
                  └─────────────────┬─────────────────────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
                   ▼                                 ▼
      ┌─────────────────────┐          ┌─────────────────────┐
      │ isServiceable:      │          │ isServiceable:      │
      │ false               │          │ true                │
      └──────────┬──────────┘          └──────────┬──────────┘
                 │                                 │
                 ▼                                 ▼
      ┌─────────────────────┐          ┌─────────────────────┐
      │ Show "Not           │          │ Navigate to         │
      │ Serviceable"        │          │ Home/Menu Screen    │
      │ Message             │          │                     │
      └─────────────────────┘          └──────────┬──────────┘
                                                   │
                                                   ▼
                                       ┌─────────────────────┐
                                       │ GET /api/customer/  │
                                       │ home                │
                                       │ (Get personalized   │
                                       │ menu from kitchen)  │
                                       └─────────────────────┘
```

---

## API Endpoints

### 1. User Sync (Check Status)

**Purpose:** Check if user exists in the system after Firebase authentication.

**Endpoint:** `POST /api/auth/sync`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response - New User:**
```json
{
  "status": 200,
  "message": "User not found",
  "data": {
    "user": null,
    "isNewUser": true,
    "isProfileComplete": false
  }
}
```

**Response - Existing User (Profile Complete):**
```json
{
  "status": 200,
  "message": "User authenticated",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "dietaryPreferences": ["VEG"],
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "isNewUser": false,
    "isProfileComplete": true
  }
}
```

**Response - Existing User (Profile Incomplete):**
```json
{
  "status": 200,
  "message": "User authenticated",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "name": null,
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "isNewUser": false,
    "isProfileComplete": false
  }
}
```

---

### 2. Register New User

**Purpose:** Register a new user in the system.

**Endpoint:** `POST /api/auth/register`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "dietaryPreferences": ["VEG"]
}
```

**Field Details:**
- `name` (required): User's full name
- `email` (optional): User's email address
- `dietaryPreferences` (optional): Array of dietary preference strings
  - Possible values: `"VEG"`, `"NON-VEG"`, `"VEGAN"`, `"EGGETARIAN"`, `"JAIN"`

**Response - Success:**
```json
{
  "status": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "dietaryPreferences": ["VEG"],
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "isProfileComplete": true
  }
}
```

**Response - User Already Exists:**
```json
{
  "status": 409,
  "message": "User already exists",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "name": "Rahul Sharma"
    },
    "isProfileComplete": true
  }
}
```

---

### 3. Update User Profile

**Purpose:** Update profile for existing users with incomplete profiles.

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "dietaryPreferences": ["VEG", "JAIN"],
  "profileImage": "https://res.cloudinary.com/example/image/upload/profile123.jpg"
}
```

**Field Details:**
- `name` (optional): User's full name
- `email` (optional): User's email address
- `dietaryPreferences` (optional): Array of dietary preference strings
- `profileImage` (optional): URL to user's profile image

**Response - Success:**
```json
{
  "status": 200,
  "message": "Profile updated",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9876543210",
      "role": "CUSTOMER",
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "dietaryPreferences": ["VEG", "JAIN"],
      "profileImage": "https://res.cloudinary.com/example/image/upload/profile123.jpg",
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    },
    "isProfileComplete": true
  }
}
```

---

### 4. Register FCM Token

**Purpose:** Register Firebase Cloud Messaging token for push notifications.

**Endpoint:** `POST /api/auth/fcm-token`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fcmToken": "cMctpybZRQ2wL9v8Z7Xk3a:APA91bHJzV...",
  "deviceId": "device-uuid-12345"
}
```

**Response - Success:**
```json
{
  "status": 200,
  "message": "FCM token registered",
  "data": null
}
```

---

### 5. Check Serviceability

**Purpose:** Validate if delivery is available for a given pincode.

**Endpoint:** `POST /api/customer/check-serviceability`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "pincode": "560001"
}
```

**Response - Serviceable:**
```json
{
  "success": true,
  "message": "Location check",
  "data": {
    "isServiceable": true,
    "message": "We deliver to this location!"
  }
}
```

**Response - Not Serviceable:**
```json
{
  "success": true,
  "message": "Location check",
  "data": {
    "isServiceable": false,
    "message": "We don't deliver to this location yet"
  }
}
```

---

### 6. Get Home Feed

**Purpose:** Get personalized menu from the kitchen serving user's location.

**Endpoint:** `GET /api/customer/home`

**Query Parameters:**
- `addressId` (optional): Specific address ID, defaults to user's default address
- `kitchenId` (optional): Switch to specific kitchen instead of auto-selected primary

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response - Success:**
```json
{
  "success": true,
  "message": "Home feed",
  "data": {
    "address": {
      "id": "6789abc123def456",
      "label": "Home",
      "addressLine1": "42, MG Road",
      "locality": "Indiranagar",
      "city": "Bangalore"
    },
    "kitchen": {
      "id": "kitchen123abc",
      "displayName": "Tiffsy Kitchen",
      "type": "TIFFSY",
      "rating": 4.5
    },
    "menu": {
      "mealMenu": {
        "lunch": {
          "id": "item123",
          "name": "South Indian Thali",
          "price": 149,
          "discountedPrice": 129
        },
        "dinner": {
          "id": "item456",
          "name": "North Indian Thali",
          "price": 159,
          "discountedPrice": 139
        }
      }
    }
  }
}
```

**Response - No Address Setup:**
```json
{
  "success": true,
  "message": "Add address to see available menu",
  "data": {
    "requiresAddressSetup": true,
    "addresses": [],
    "menu": null
  }
}
```

---

## Client Implementation

### 1. API Service (`src/services/api.service.ts`)

The API service provides methods for all backend endpoints:

```typescript
// Sync user after Firebase authentication
async syncUser() {
  return this.api.post('/api/auth/sync', {});
}

// Register new user
async registerUser(data: {
  name: string;
  email?: string;
  dietaryPreferences?: string[];
}) {
  return this.api.post('/api/auth/register', data);
}

// Update profile for existing users
async updateProfile(data: {
  name?: string;
  email?: string;
  dietaryPreferences?: string[];
  profileImage?: string;
}) {
  return this.api.put('/api/auth/profile', data);
}

// Register FCM token
async registerFCMToken(data: {
  fcmToken: string;
  deviceId: string;
}) {
  return this.api.post('/api/auth/fcm-token', data);
}

// Check serviceability
async checkServiceability(pincode: string) {
  return this.api.post('/api/customer/check-serviceability', { pincode });
}

// Get home feed
async getHomeFeed(addressId?: string, kitchenId?: string) {
  const params = new URLSearchParams();
  if (addressId) params.append('addressId', addressId);
  if (kitchenId) params.append('kitchenId', kitchenId);

  const queryString = params.toString();
  return this.api.get(`/api/customer/home${queryString ? `?${queryString}` : ''}`);
}
```

---

### 2. User Context (`src/context/UserContext.tsx`)

The User Context manages authentication state and provides methods for the auth flow:

```typescript
// Verify OTP and sync with backend
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

  // Sync with backend
  const response = await apiService.syncUser();
  const { isNewUser, isProfileComplete, user } = response.data;

  // Update local state
  if (user) {
    setUser(transformUserData(user));
    await AsyncStorage.setItem('user_profile', JSON.stringify(user));
  }

  return { isNewUser, isProfileComplete, user };
};

// Register new user
const registerUser = async (data: {
  name: string;
  email?: string;
  dietaryPreferences?: string[];
}) => {
  const response = await apiService.registerUser(data);

  if (response.status === 201 && response.data.user) {
    setUser(transformUserData(response.data.user));
    await AsyncStorage.setItem('user_profile', JSON.stringify(response.data.user));
  }
};

// Update user profile
const updateUserProfile = async (data: {
  name?: string;
  email?: string;
  dietaryPreferences?: string[];
  profileImage?: string;
}) => {
  const response = await apiService.updateProfile(data);

  if (response.status === 200 && response.data.user) {
    setUser(transformUserData(response.data.user));
    await AsyncStorage.setItem('user_profile', JSON.stringify(response.data.user));
  }
};
```

---

### 3. Login Screen (`src/screens/auth/LoginScreen.tsx`)

Handles phone number input and OTP initiation:

```typescript
const handleGetOtp = async () => {
  if (phone.length !== 10) {
    Alert.alert('Error', 'Please enter a valid 10-digit phone number');
    return;
  }

  setLoading(true);
  try {
    const fullPhone = `+91${phone}`;
    const confirmation = await loginWithPhone(fullPhone);

    navigation.navigate('OTPVerification', {
      phoneNumber: fullPhone,
      confirmation: confirmation,
    });
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

### 4. OTP Verification Screen (`src/screens/auth/OTPVerificationScreen.tsx`)

Handles OTP verification and determines next steps:

```typescript
const handleVerifyOTP = async (otpCode?: string) => {
  const code = otpCode || otp.join('');

  setLoading(true);
  setLoadingMessage('Verifying OTP...');

  try {
    const { isNewUser, isProfileComplete, user } = await verifyOTP(confirmation, code);

    // Show appropriate message
    if (isNewUser) {
      setLoadingMessage('Welcome! Setting up your account...');
    } else if (isProfileComplete) {
      setLoadingMessage('Welcome back!');
    } else {
      setLoadingMessage('Completing your profile...');
    }

    // Navigation handled automatically by AppNavigator based on state
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
    setOtp(['', '', '', '', '', '']);
    setLoading(false);
  }
};
```

---

### 5. User Onboarding Screen (`src/screens/auth/UserOnboardingScreen.tsx`)

Handles profile completion for new and existing users:

```typescript
const handleContinue = async () => {
  // Validate inputs
  if (name.trim().length < 2) {
    setNameError('Please enter a valid name');
    return;
  }

  setIsLoading(true);
  try {
    // Prepare dietary preferences
    const dietaryPreferences: string[] = [foodType];
    if (eggiterian) dietaryPreferences.push('EGGETARIAN');
    if (jainFriendly) dietaryPreferences.push('JAIN');

    // Determine if new user or existing user with incomplete profile
    const isNewUser = user?.isNewUser ?? true;

    if (isNewUser) {
      // New user - call register endpoint
      await registerUser({
        name: name.trim(),
        email: email.trim() || undefined,
        dietaryPreferences,
      });
    } else {
      // Existing user - call update profile endpoint
      await updateUserProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        dietaryPreferences,
      });
    }

    // Navigation handled automatically by AppNavigator
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    setIsLoading(false);
  }
};
```

---

## Permission Handling

### 1. Notification Permission

After successful registration/profile completion, request notification permission:

```typescript
import messaging from '@react-native-firebase/messaging';

const requestNotificationPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      // Get FCM token
      const fcmToken = await messaging().getToken();
      const deviceId = await getDeviceId(); // Use device-info or uuid

      // Register with backend
      await registerFCMToken(fcmToken, deviceId);
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};
```

---

### 2. Location Permission

Request location permission to get user's current location:

```typescript
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Get current location
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            // Use location to get pincode or address
            reverseGeocode(latitude, longitude);
          },
          (error) => {
            // Ask for manual address input
            showManualAddressInput();
          }
        );
      } else {
        // Permission denied - ask for manual address input
        showManualAddressInput();
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
      showManualAddressInput();
    }
  }
};
```

---

## Address & Serviceability

### 1. Check Serviceability

Before allowing user to proceed, check if delivery is available:

```typescript
const checkPincodeServiceability = async (pincode: string) => {
  try {
    const response = await apiService.checkServiceability(pincode);

    if (response.data.isServiceable) {
      // Pincode is serviceable - proceed to home screen
      navigation.navigate('Main');
    } else {
      // Not serviceable - show message
      Alert.alert(
        'Service Not Available',
        response.data.message || 'We don\'t deliver to this location yet. Please try a different address.'
      );
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to check serviceability. Please try again.');
  }
};
```

---

### 2. Get Menu for Serviceable Location

Once serviceability is confirmed, get the menu:

```typescript
const loadHomeFeed = async () => {
  try {
    const response = await apiService.getHomeFeed();

    if (response.data.requiresAddressSetup) {
      // User needs to add an address first
      navigation.navigate('AddAddress');
    } else if (!response.data.isServiceable) {
      // Address not serviceable
      Alert.alert('Service Not Available', response.data.message);
    } else {
      // Load menu and display
      setMenu(response.data.menu);
      setKitchen(response.data.kitchen);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to load menu. Please try again.');
  }
};
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "status": 401,
  "message": "Unauthorized - Invalid or expired token",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "status": 400,
  "message": "Validation error",
  "data": {
    "errors": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

**500 Internal Server Error:**
```json
{
  "status": 500,
  "message": "Internal server error",
  "data": null
}
```

### Client-Side Error Handling

```typescript
try {
  const response = await apiService.syncUser();
  // Handle success
} catch (error: any) {
  if (error.status === 401) {
    // Token expired - re-authenticate
    await logout();
    navigation.navigate('Login');
  } else if (error.status === 400) {
    // Validation error - show specific errors
    const errorMessage = error.data?.errors?.map(e => e.message).join('\n') || error.message;
    Alert.alert('Error', errorMessage);
  } else {
    // Generic error
    Alert.alert('Error', error.message || 'An unexpected error occurred');
  }
}
```

---

## Summary

The Tiffsy authentication flow provides a seamless experience:

1. ✅ Firebase-first authentication with OTP verification
2. ✅ Automatic user sync with backend
3. ✅ Conditional registration/profile completion
4. ✅ Permission handling for notifications and location
5. ✅ Serviceability check before menu access
6. ✅ Personalized home feed with menu from serving kitchen

This approach ensures:
- **Security**: Firebase handles authentication, backend validates tokens
- **User Experience**: Minimal friction, automatic state management
- **Flexibility**: Supports new users, returning users, and incomplete profiles
- **Reliability**: Comprehensive error handling and fallback mechanisms
