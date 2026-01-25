/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register background handler for FCM
// This MUST be done at the top level, outside of any React components
// This allows notifications to be received when the app is in background or quit state
try {
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[Background] Message received:', remoteMessage);

    // Background messages are handled by the OS and displayed automatically
    // You can add custom logic here if needed (e.g., save to local storage)

    // The notification will be displayed by the system automatically
    // When user taps it, onNotificationOpenedApp will be triggered
  });
} catch (error) {
  console.warn('[FCM] Firebase Messaging not available - push notifications disabled:', error.message);
}

AppRegistry.registerComponent(appName, () => App);

