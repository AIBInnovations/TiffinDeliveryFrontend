# Firebase Cloud Messaging (FCM) Setup Guide

## Overview
This project has been configured with Firebase Cloud Messaging (FCM) for push notifications. The setup includes:

- FCM token management
- Notification permissions handling
- Background and foreground notification handlers
- Integration with backend API
- React Context for state management

## Project Structure

```
src/
├── services/
│   ├── fcm.service.ts          # Core FCM functionality
│   └── api.service.ts           # API integration
├── context/
│   └── FCMContext.tsx           # FCM React Context
├── hooks/
│   └── useFCM.ts                # Custom FCM hook
└── config/
    └── firebase.ts              # Firebase configuration
```

## How It Works

### 1. Automatic Initialization
FCM is automatically initialized when the app starts through the `FCMProvider` in `App.tsx`.

### 2. Token Management
- Tokens are generated and stored locally
- Automatically registered with backend API at `/api/auth/fcm-token`
- Refreshed when expired and re-registered with backend

### 3. Notification Handling
- **Foreground**: Notifications shown to user while app is active
- **Background**: Notifications handled by Firebase
- **Quit State**: Notifications open app when tapped

## Usage

### Using FCM Context

```tsx
import { useFCMContext } from './src/context/FCMContext';

function MyComponent() {
  const { fcmToken, hasPermission, requestPermission, isLoading } = useFCMContext();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      console.log('Permission granted!');
    }
  };

  return (
    <View>
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Text>Permission: {hasPermission ? 'Granted' : 'Denied'}</Text>
          {fcmToken && <Text>Token: {fcmToken.substring(0, 20)}...</Text>}
          {!hasPermission && (
            <Button title="Request Permission" onPress={handleRequestPermission} />
          )}
        </>
      )}
    </View>
  );
}
```

### Using Custom Hook

```tsx
import { useFCM } from './src/hooks/useFCM';

function MyComponent() {
  const { fcmToken, hasPermission, requestPermission } = useFCM();

  // Use FCM data...
}
```

### Direct Service Usage

```tsx
import {
  getFCMToken,
  requestNotificationPermission,
  registerFCMToken
} from './src/services/fcm.service';

// Request permission
const hasPermission = await requestNotificationPermission();

// Get FCM token
const token = await getFCMToken();

// Register token with backend
await registerFCMToken(token);
```

## Android Configuration ✅

Android has been fully configured with:

### Permissions (AndroidManifest.xml)
- `POST_NOTIFICATIONS` - For Android 13+ notification permission
- `VIBRATE` - For notification vibration
- `RECEIVE_BOOT_COMPLETED` - For notification on device restart

### Services
- Firebase Messaging Service configured
- Default notification channel: `tiffsy_notifications`
- Notification icon and color configured

### Build Configuration
Ensure `google-services.json` is present in:
```
android/app/google-services.json
```

## iOS Configuration ⚠️ (Manual Setup Required)

### 1. Add Capabilities in Xcode
1. Open `ios/TiffinDelivery.xcworkspace` in Xcode
2. Select your project target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Push Notifications"
6. Add "Background Modes" and enable:
   - Remote notifications
   - Background fetch

### 2. Update AppDelegate.mm

Add at the top of the file:
```objc
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>
```

Add in `didFinishLaunchingWithOptions`:
```objc
// Define UNUserNotificationCenter
UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
center.delegate = self;
```

Add these methods:
```objc
// Required for remote notifications
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  // Handle token
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  NSLog(@"%@", error);
}

// Foreground notification
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
}

// Notification tapped
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)(void))completionHandler {
  completionHandler();
}
```

### 3. Update Info.plist
Add these keys to `ios/TiffinDelivery/Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

### 4. Add GoogleService-Info.plist
1. Download from Firebase Console
2. Place in `ios/TiffinDelivery/GoogleService-Info.plist`
3. Add to Xcode project

### 5. Install Pods
```bash
cd ios
pod install
cd ..
```

## API Integration

The FCM token is automatically sent to your backend:

### Endpoint
```
POST /api/auth/fcm-token
```

### Headers
```
Authorization: Bearer <firebase-id-token>
```

### Request Body
```json
{
  "fcmToken": "cMctpybZRQ2wL9v8Z7Xk3a:APA91bHJzV...",
  "deviceId": "device-uuid-12345"
}
```

### Response
```json
{
  "status": 200,
  "message": "FCM token registered",
  "data": null
}
```

## Testing Notifications

### Send Test Notification from Firebase Console
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token
6. Click "Test"

### Send from Backend
Your backend should use the Firebase Admin SDK to send notifications:

```javascript
// Example (Node.js)
const admin = require('firebase-admin');

await admin.messaging().send({
  token: fcmToken,
  notification: {
    title: 'Order Update',
    body: 'Your order has been dispatched!'
  },
  data: {
    orderId: '12345',
    type: 'order_update'
  }
});
```

## Notification Types

You can handle different notification types in the app:

```tsx
// In fcm.service.ts - modify onMessage handler
messaging().onMessage(async (remoteMessage) => {
  const notificationType = remoteMessage.data?.type;

  switch (notificationType) {
    case 'order_update':
      // Handle order update
      break;
    case 'promotion':
      // Handle promotion
      break;
    default:
      // Handle generic notification
  }
});
```

## Troubleshooting

### Android Issues

**Notifications not received**
- Check if google-services.json is present
- Verify app is registered in Firebase Console
- Check Android logs: `npx react-native log-android`

**Permission denied**
- Ensure POST_NOTIFICATIONS permission is in AndroidManifest.xml
- For Android 13+, permission must be requested at runtime

### iOS Issues

**Build fails**
- Run `pod install` in ios folder
- Clean build folder in Xcode
- Check if GoogleService-Info.plist is added to project

**Notifications not received**
- Verify APNs certificates in Firebase Console
- Check if Push Notifications capability is added
- Ensure device is registered for remote notifications

## Best Practices

1. **Request permission at the right time**: Don't request immediately on app launch. Wait for a logical moment (e.g., after onboarding).

2. **Handle token refresh**: Tokens can change, so listen for `onTokenRefresh` events.

3. **Clean up on logout**: Call `clearToken()` from FCMContext when user logs out.

4. **Test thoroughly**: Test notifications in all app states (foreground, background, quit).

5. **Handle deep linking**: Use notification data to navigate to specific screens.

## Example: Integrating with Onboarding Flow

```tsx
// In OTPVerificationScreen.tsx or UserOnboardingScreen.tsx
import { useFCMContext } from '../context/FCMContext';

function OnboardingScreen() {
  const { requestPermission } = useFCMContext();

  const handleCompleteOnboarding = async () => {
    // Complete user registration first
    await registerUser();

    // Then request notification permission
    await requestPermission();

    // Navigate to home
    navigation.navigate('Home');
  };

  // Rest of component...
}
```

## Security Notes

- Never expose FCM Server Key in client code
- Always validate notifications on backend before sending
- Store FCM tokens securely on backend
- Implement rate limiting for notification sending
- Use FCM token expiration and refresh mechanisms

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)
- [Android Notification Guidelines](https://developer.android.com/develop/ui/views/notifications)
- [iOS Push Notification Guidelines](https://developer.apple.com/documentation/usernotifications)
