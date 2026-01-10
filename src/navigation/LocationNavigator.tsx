import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LocationSetupScreen from '../screens/location/LocationSetupScreen';
import PincodeInputScreen from '../screens/location/PincodeInputScreen';
import NotServiceableScreen from '../screens/location/NotServiceableScreen';

const Stack = createStackNavigator();

const LocationNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="LocationSetup"
    >
      <Stack.Screen name="LocationSetup" component={LocationSetupScreen} />
      <Stack.Screen name="PincodeInput" component={PincodeInputScreen} />
      <Stack.Screen name="NotServiceable" component={NotServiceableScreen} />
    </Stack.Navigator>
  );
};

export default LocationNavigator;
