// src/screens/onboarding/OnboardingScreen1.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Animated, Easing, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingScreenProps } from '../../types/navigation';

type Props = OnboardingScreenProps<'OnboardingScreen1'>;

const OnboardingScreen1: React.FC<Props> = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Automatic clockwise rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000, // 8 seconds for a full rotation
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    navigation.navigate('OnboardingScreen2');
  };

  const handleSkip = () => {
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaView className="flex-1 bg-orange-400">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <View className="flex-1 px-10">
        <View className="flex-1 justify-center" style={{ width: '100%' }}>
          {/* Background Image */}
          <ImageBackground
            source={require('../../assets/images/onboarding/fastfood.png')}
            style={{ width: 220, height: 230, paddingLeft: 0, marginLeft:-45, paddingRight: 8, marginTop: -21, justifyContent: 'center', position: 'absolute', top: 0, left: 0 }}
            resizeMode="cover"
            imageStyle={{ opacity: 0.8, }}
          />

          {/* Text */}
          <Text
            style={{
              color: 'white',
              fontSize: 38,
              fontWeight: 'bold',
              lineHeight: 44,
              marginTop: 0,
            }}
          >
            Taste{'\n'}Tasty Meals{'\n'}Every Days
          </Text>

          {/* Image */}
          <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 0 }}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 10,
              }}
            >
              <Animated.Image
                source={require('../../assets/images/onboarding/onboarding1.png')}
                style={{ width: 250, height: 250, borderRadius: 140 }}
                resizeMode="cover"
              />
            </Animated.View>
          </View>

          {/* Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40 }}>
            <View
              style={{
                width: 18,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'white',
                marginHorizontal: 4,
              }}
            />
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.5)',
                marginHorizontal: 4,
              }}
            />
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.5)',
                marginHorizontal: 4,
              }}
            />
          </View>

          {/* Next button */}
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleNext}
            activeOpacity={1}
            style={{ marginTop: 20 }}
          >
            <Animated.View
              style={{
                backgroundColor: 'white',
                borderRadius: 50,
                paddingLeft: 30,
                paddingRight: 8,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: 320,
                marginBottom: 0,
                alignSelf: 'center',
                transform: [{ scale: scaleAnim }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
                elevation: 8,
              }}
            >
              <Text
                style={{
                  color: '#F56B4C',
                  fontSize: 18,
                  fontWeight: '600',
                  flex: 1,
                  textAlign: 'center',
                  marginRight: 10,
                }}
              >
                Next
              </Text>
              <View
                style={{
                  backgroundColor: '#F56B4C',
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={require('../../assets/icons/right.png')}
                  style={{
                    width: 28,
                    height: 28,
                  }}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Bottom nav & bar (same as before) */}
        <View
          style={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 30,
          }}
        >
          <TouchableOpacity style={{ padding: 10 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10 }} onPress={handleSkip}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>Skip</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen1;
