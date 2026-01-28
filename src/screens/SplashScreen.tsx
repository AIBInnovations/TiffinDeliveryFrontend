import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { SPACING } from '../constants/spacing';
import { FONT_SIZES } from '../constants/typography';

type SplashScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Splash'
>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    // After 3 seconds, navigate to the Onboarding screens
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 bg-orange-400 justify-center items-center">
      <View className="flex-row items-center mb-8">
        <Image
          // source={require('../assets/images/Tiffsy_Logo.png')}
          source={require('../assets/images/logo.png')}
          style={{ width: SPACING.iconXl, height: SPACING.iconXl }}
          resizeMode="contain"
        />
        <Text className="text-white ml-2" style={{ fontSize: FONT_SIZES.h1 }}>LOGO</Text>
      </View>

      <View
        className="flex-row justify-center items-center mb-8"
        style={{ gap: SPACING.md }}
      >
        <Text className="text-white" style={{ fontSize: FONT_SIZES.h3 }}>Order</Text>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'white',
          }}
        />
        <Text className="text-white" style={{ fontSize: FONT_SIZES.h3 }}>Eat</Text>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'white',
          }}
        />
        <Text className="text-white" style={{ fontSize: FONT_SIZES.h3 }}>Enjoy</Text>
      </View>
    </View>
  );
};

export default SplashScreen;
