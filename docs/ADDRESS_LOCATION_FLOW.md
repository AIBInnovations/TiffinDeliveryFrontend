# Address & Location Flow - Implementation Guide

## 📍 Overview

Complete implementation of location-based serviceability check after user profile completion. This flow ensures users can only access the app if we deliver to their area.

## 🎯 Flow Diagram

```
Profile Completion
        ↓
📍 Location Setup Screen
        ↓
   ┌────┴────┐
   ↓         ↓
Use GPS   Enter Manually
   ↓         ↓
   └────┬────┘
        ↓
  Get Pincode
        ↓
Check Serviceability API
        ↓
   ┌────┴────┐
   ↓         ↓
Serviceable  Not Serviceable
   ↓         ↓
Home Screen  Not Serviceable Screen
             ├─ Try Different Pincode
             ├─ Notify Me
             └─ Browse as Guest
```

## 📁 Files Created/Modified

### New Files Created:

1. **Location Service** - [src/services/location.service.ts](../src/services/location.service.ts)
   - GPS permission handling
   - Current location detection
   - Reverse geocoding to get pincode
   - Pincode validation

2. **Location Screens**:
   - [src/screens/location/LocationSetupScreen.tsx](../src/screens/location/LocationSetupScreen.tsx)
   - [src/screens/location/PincodeInputScreen.tsx](../src/screens/location/PincodeInputScreen.tsx)
   - [src/screens/location/NotServiceableScreen.tsx](../src/screens/location/NotServiceableScreen.tsx)

3. **Location Navigator** - [src/navigation/LocationNavigator.tsx](../src/navigation/LocationNavigator.tsx)

### Modified Files:

1. **App Navigator** - [src/navigation/AppNavigator.tsx](../src/navigation/AppNavigator.tsx)
   - Added location setup check after profile completion
   - Flow now: Auth → Profile → Location → Home

2. **Main Navigator** - [src/navigation/MainNavigator.tsx](../src/navigation/MainNavigator.tsx)
   - Added location screens to stack

3. **Android Manifest** - [android/app/src/main/AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml)
   - Added location permissions

4. **API Service** - [src/services/api.service.ts](../src/services/api.service.ts)
   - Already had serviceability and menu APIs

## 📦 Dependencies Installed

```bash
npm install @react-native-community/geolocation react-native-geocoding
```

## 🔧 Configuration Required

### Google Maps API Key (Required for Geocoding)

Update in [src/services/location.service.ts](../src/services/location.service.ts):

```typescript
// Line 9
Geocoding.init('YOUR_GOOGLE_MAPS_API_KEY');
```

**To get API key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Geocoding API"
3. Create credentials → API Key
4. Copy key and paste in location.service.ts

## 📱 Android Permissions

Added to AndroidManifest.xml:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## 🎨 User Flow

### 1. Location Setup Screen

**Features:**
- Beautiful onboarding-style UI
- Two options:
  1. Use Current Location (GPS)
  2. Enter Pincode Manually
- Benefits display
- Privacy note

**User Actions:**
- Tap "Use Current Location" → Requests GPS permission → Auto-detects pincode
- Tap "Enter Pincode Manually" → Navigate to Pincode Input Screen

**Implementation:**
- Uses `getCurrentLocationWithPincode()` from location service
- Calls `checkServiceability()` API
- On success: Marks setup complete, navigates to Home
- On failure: Shows Not Serviceable Screen

### 2. Pincode Input Screen

**Features:**
- Clean, focused input interface
- 6-digit pincode validation
- Popular pincode examples
- Real-time validation

**User Actions:**
- Enter 6-digit pincode
- Tap "Check Serviceability"

**Implementation:**
- Validates pincode format (6 digits)
- Calls `checkServiceability()` API
- Same success/failure flow as Location Setup

### 3. Not Serviceable Screen

**Features:**
- Friendly "not available yet" message
- Statistics (cities, pincodes, kitchens)
- Multiple action options

**User Actions:**
- Notify Me → Opens WhatsApp/Email to register interest
- Try Different Pincode → Back to Pincode Input
- Browse Without Location → Browse as guest (limited access)

## 🌐 API Integration

### Check Serviceability API

**Endpoint:** `POST /api/customer/check-serviceability`

**Request:**
```json
{
  "pincode": "560001"
}
```

**Response (Serviceable):**
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

**Response (Not Serviceable):**
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

### Get Home Feed API

**Endpoint:** `GET /api/customer/home?addressId=xxx&kitchenId=xxx`

This API is already integrated and will be called from Home Screen once location is set up.

## 💾 State Management

### Location Setup Completion

Stored in AsyncStorage:
```typescript
const LOCATION_SETUP_KEY = '@location_setup_complete';
```

**Set on:**
- Serviceable area confirmed
- User chooses "Browse as Guest"

**Checked by:**
- AppNavigator on every app launch
- Determines whether to show Location flow or Home

**Clear on:**
- User logout
- App reset

## 🔄 Navigation Flow

### Initial Flow (New User)

```
Splash
  ↓
Onboarding (3 screens)
  ↓
Auth (Phone + OTP)
  ↓
Profile Setup
  ↓
📍 Location Setup (NEW!)
  ↓
Home Screen
```

### Returning User Flow

```
App Launch
  ↓
Check Auth Status
  ↓
Check Profile Complete
  ↓
Check Location Setup (NEW!)
  ↓
Home Screen (if all complete)
```

## 🧪 Testing Scenarios

### Test 1: Fresh User - GPS Success
1. Complete profile
2. Should show Location Setup Screen
3. Tap "Use Current Location"
4. Grant location permission
5. Should detect pincode
6. **If serviceable:** Navigate to Home
7. **If not serviceable:** Show Not Serviceable Screen

### Test 2: Fresh User - Manual Entry
1. Complete profile
2. Should show Location Setup Screen
3. Tap "Enter Pincode Manually"
4. Enter valid 6-digit pincode
5. Tap "Check Serviceability"
6. Same success/failure flow

### Test 3: GPS Denied
1. Tap "Use Current Location"
2. Deny location permission
3. Should show error alert
4. Navigate to Pincode Input Screen

### Test 4: Not Serviceable Area
1. Enter non-serviceable pincode
2. Should show Not Serviceable Screen
3. Options available:
   - Notify Me (opens WhatsApp/Email)
   - Try Different Pincode
   - Browse as Guest

### Test 5: Returning User
1. Close app
2. Reopen app
3. Should NOT show Location Setup again
4. Go directly to Home Screen

## 🔍 Location Service Features

### Functions Available:

1. **requestLocationPermission()** - Request GPS permission
2. **getCurrentLocation()** - Get lat/long coordinates
3. **getAddressFromCoordinates()** - Reverse geocode to address
4. **getPincodeFromCoordinates()** - Extract pincode from coordinates
5. **validatePincode()** - Validate 6-digit format
6. **getCurrentLocationWithPincode()** - Complete flow: GPS → Pincode

### Example Usage:

```typescript
import {
  getCurrentLocationWithPincode,
  validatePincode,
  requestLocationPermission
} from '../services/location.service';

// Get location with pincode
const result = await getCurrentLocationWithPincode();
if (result && result.address.pincode) {
  console.log('Pincode:', result.address.pincode);
}

// Validate pincode
const isValid = validatePincode('560001'); // true
const isInvalid = validatePincode('12345'); // false
```

## 🎨 UI/UX Features

### Location Setup Screen
- Large emoji illustration (📍)
- Clear value propositions
- Primary CTA: "Use Current Location"
- Secondary CTA: "Enter Pincode Manually"
- Privacy assurance message

### Pincode Input Screen
- Large, centered input field
- Letter-spaced display for better readability
- Real-time validation
- Quick-access example pincodes
- Error messaging

### Not Serviceable Screen
- Empathetic messaging
- Growth statistics
- Multiple recovery options
- Support contact info

## 🚀 Future Enhancements

1. **Address Management**
   - Save multiple addresses
   - Set default address
   - Full address entry (not just pincode)

2. **Location Caching**
   - Cache last known location
   - Auto-refresh on app foreground

3. **Area Expansion Notifications**
   - Backend integration for "Notify Me"
   - Email/SMS when area becomes serviceable

4. **Alternative Locations**
   - Suggest nearby serviceable areas
   - Distance calculator

5. **Map Integration**
   - Visual map view
   - Draw service area boundaries
   - Pin locations

## 📊 Console Logs

All location operations have detailed logging:

```
📍 Requesting Location Permission...
✅ Location permission granted
📍 Getting Current Location...
✅ Location obtained: { latitude: 12.9716, longitude: 77.5946 }
🗺️ Reverse Geocoding...
✅ Address extracted: { pincode: '560001', city: 'Bangalore', ... }
🔍 Checking serviceability for pincode: 560001
✅ Area is serviceable!
✅ Location setup marked as complete
```

## ⚠️ Important Notes

1. **Google Maps API Key Required**
   - Geocoding won't work without it
   - Get it from Google Cloud Console
   - Enable "Geocoding API"

2. **Location Permissions**
   - Android: Automatically requested
   - iOS: Add usage description in Info.plist (future)

3. **AsyncStorage**
   - Location setup state persists across app restarts
   - Clear on logout for proper flow

4. **API Error Handling**
   - Network errors handled gracefully
   - User-friendly error messages
   - Retry options available

## 🐛 Troubleshooting

### Location not detecting
- Check GPS is enabled on device
- Check location permissions granted
- Verify Google Maps API key is valid
- Check internet connection for geocoding

### Serviceability API failing
- Verify backend URL in api.service.ts
- Check Firebase auth token is valid
- Verify API endpoint exists

### Navigation not working
- Check location setup key in AsyncStorage
- Verify all screens imported correctly
- Check navigation types match

## 📚 Related Documentation

- [FCM Setup Guide](FCM_SETUP.md)
- [API Documentation](../address_api%20(1).md)
- [Auth Flow](../auth_api%20(2).md)

## ✅ Completion Checklist

- [x] Install location libraries
- [x] Add Android permissions
- [x] Create location service
- [x] Create Location Setup Screen
- [x] Create Pincode Input Screen
- [x] Create Not Serviceable Screen
- [x] Update navigation flow
- [x] Integrate with AppNavigator
- [x] Add AsyncStorage state management
- [x] API integration
- [ ] Add Google Maps API key (user action required)
- [ ] iOS configuration (future)
- [ ] Test on physical device

## 🎉 Implementation Complete!

The location and address flow is now fully implemented. Users will be prompted for location after profile completion, ensuring only serviceable areas can access the full app experience.

**Next Steps:**
1. Add Google Maps API key in location.service.ts
2. Test on Android device
3. Implement iOS support when needed
4. Add address management screens for full address entry
