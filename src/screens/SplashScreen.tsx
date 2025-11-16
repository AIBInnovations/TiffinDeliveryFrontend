import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    // After 3 seconds, navigate to the Onboarding screens
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 bg-orange-500 justify-center items-center">
      <View className="absolute top-5 left-5">
        <Text className="text-white text-sm">9:30</Text>
      </View>
      <View className="absolute top-5 right-5">
        <View className="w-3 h-3 bg-white rounded-full" />
      </View>

      <View className="flex-row items-center mb-8">
        <Image
          source={require('../assets/images/logo.png')}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />
        <Text className="text-white text-4xl ml-2">LOGO</Text>
      </View>

      <View className="flex-row justify-evenly w-full mb-8">
        <Text className="text-white text-xl">Order</Text>
        <Text className="text-white text-xl">Eat</Text>
        <Text className="text-white text-xl">Enjoy</Text>
      </View>

      <View className="w-full h-0.5 bg-white" />
    </View>
  );
};

export default SplashScreen;