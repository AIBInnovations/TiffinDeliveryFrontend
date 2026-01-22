/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

// Register background handler for FCM
// This MUST be done at the top level, outside of any React components
// This allows notifications to be received when the app is in background or quit state
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[Background] Message received:', remoteMessage);

  // Background messages are handled by the OS and displayed automatically
  // You can add custom logic here if needed (e.g., save to local storage)

  // The notification will be displayed by the system automatically
  // When user taps it, onNotificationOpenedApp will be triggered
});

AppRegistry.registerComponent(appName, () => App);

