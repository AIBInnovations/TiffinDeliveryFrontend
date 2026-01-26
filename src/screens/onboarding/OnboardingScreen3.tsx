// src/screens/onboarding/OnboardingScreen3.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Animated, Easing, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingScreenProps } from '../../types/navigation';

type Props = OnboardingScreenProps<'OnboardingScreen3'>;

const OnboardingScreen3: React.FC<Props> = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

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

  // Go from Onboarding stack to Root stack's "Auth" route (Login)
  const handleNext = () => {
    navigation.navigate('Auth');
  };

  const handleSkip = () => {
    navigation.navigate('Auth');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-orange-400">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <View className="flex-1 px-10">
        <View className="flex-1 justify-center" style={{ width: '100%' }}>
          {/* Background Image */}
          <ImageBackground
            source={require('../../assets/images/onboarding/home.png')}
            style={{ width: 220, height: 290, paddingLeft: 2, paddingRight: 8, marginTop: -62, marginLeft: -35, marginBottom: 20, position: 'absolute', top: 0, left: 0 }}
            resizeMode="cover"
            imageStyle={{ opacity: 0.8,}}
          />

          {/* Text */}
          <Text
            style={{
              color: 'white',
              fontSize: 37,
              fontWeight: 'bold',
              marginTop: 0,
            }}
          >
            Meals{'\n'}That Feel{'\n'}Like Home
          </Text>

          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              marginTop: 10,
              paddingHorizontal: 0,
            }}
          >
            Lorem ipsum dolor amet consectetur.{'\n'}
            Adipiscing ultricies dui morbi varius acid.
          </Text>

          {/* Coupon image – separate asset for screen 3 */}
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 0 }}>
            <Animated.Image
              source={require('../../assets/images/onboarding/onboarding3.png')}
              style={{
                width: 280,
                height: 200,
                transform: [{ translateY: floatAnim }, { rotate: '-8deg' }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
              }}
              resizeMode="contain"
            />
          </View>

          {/* Dots – third one active now */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 25 }}>
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
            <View
              style={{
                width: 18,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'white',
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
            style={{ marginTop: 30 }}
          >
            <Animated.View
              style={{
                backgroundColor: 'white',
                borderRadius: 50,
                paddingLeft: 30,
                paddingRight: 8,
                height: 57,
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

        {/* Bottom nav & bar */}
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
          <TouchableOpacity style={{ padding: 10 }} onPress={handleBack}>
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

export default OnboardingScreen3;
