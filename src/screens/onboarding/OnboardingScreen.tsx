// src/screens/onboarding/OnboardingScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Animated, Easing, ImageBackground, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingScreenProps } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = OnboardingScreenProps<'OnboardingScreen1'>;

interface PageContent {
  id: number;
  title: string;
  subtitle?: string;
  image: any;
  backgroundImage: any;
  backgroundStyle: any;
  imageStyle: any;
  imageAnimation: 'rotate' | 'float';
}

const pages: PageContent[] = [
  {
    id: 0,
    title: "Taste\nTasty Meals\nEvery Days",
    image: require('../../assets/images/onboarding/onboarding1.png'),
    backgroundImage: require('../../assets/images/onboarding/fastfood.png'),
    backgroundStyle: {
      width: 220,
      height: 230,
      paddingLeft: 0,
      marginLeft: -45,
      paddingRight: 8,
      marginTop: -21,
      position: 'absolute' as const,
      top: 0,
      left: 0
    },
    imageStyle: { width: 250, height: 250, borderRadius: 140 },
    imageAnimation: 'rotate',
  },
  {
    id: 1,
    title: "Get Coupons\nFor Auto\nDelivery",
    subtitle: "Lorem ipsum dolor amet consectetur.\nAdipiscing ultricies dui morbi varius ac id.",
    image: require('../../assets/images/onboarding/onboarding2.png'),
    backgroundImage: require('../../assets/images/onboarding/couponbackground.png'),
    backgroundStyle: {
      width: 250,
      height: 320,
      paddingLeft: 2,
      paddingRight: 8,
      marginTop: -100,
      marginLeft: -50,
      position: 'absolute' as const,
      top: 0,
      left: 0
    },
    imageStyle: { width: 280, height: 260, marginBottom: -10 },
    imageAnimation: 'float',
  },
  {
    id: 2,
    title: "Meals\nThat Feel\nLike Home",
    subtitle: "Lorem ipsum dolor amet consectetur.\nAdipiscing ultricies dui morbi varius acid.",
    image: require('../../assets/images/onboarding/onboarding3.png'),
    backgroundImage: require('../../assets/images/onboarding/home.png'),
    backgroundStyle: {
      width: 220,
      height: 290,
      paddingLeft: 2,
      paddingRight: 8,
      marginTop: -62,
      marginLeft: -35,
      marginBottom: 20,
      position: 'absolute' as const,
      top: 0,
      left: 0
    },
    imageStyle: { width: 280, height: 200 },
    imageAnimation: 'float',
  },
];

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Rotation animation for first page
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  // Float animation for second and third pages
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

  const animateToPage = (newPage: number) => {
    const direction = newPage > currentPage ? -1 : 1;

    Animated.parallel([
      // Slide out current content
      Animated.timing(slideAnim, {
        toValue: direction * SCREEN_WIDTH,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // Fade out current content
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentPage(newPage);
      slideAnim.setValue(-direction * SCREEN_WIDTH);
      fadeAnim.setValue(0);

      // Slide in new content
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

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
    if (currentPage < pages.length - 1) {
      animateToPage(currentPage + 1);
    } else {
      navigation.navigate('Auth');
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      animateToPage(currentPage - 1);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Auth');
  };

  const currentContent = pages[currentPage];

  // Get the appropriate image transform based on animation type
  const getImageTransform = () => {
    if (currentContent.imageAnimation === 'rotate') {
      return [
        {
          rotate: rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
      ];
    } else {
      return [
        { translateY: floatAnim },
        { rotate: '-8deg' },
      ];
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-orange-500">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <View className="flex-1 px-10">
        <View className="flex-1 justify-center" style={{ width: '100%' }}>
          <Animated.View
            style={{
              transform: [{ translateX: slideAnim }],
              opacity: fadeAnim,
            }}
          >
            {/* Background Image */}
            <ImageBackground
              source={currentContent.backgroundImage}
              style={currentContent.backgroundStyle}
              resizeMode="cover"
              imageStyle={{ opacity: 0.8, borderRadius: currentPage === 1 ? 100 : 0 }}
            />

            {/* Text */}
            <Text
              style={{
                color: 'white',
                fontSize: currentPage === 2 ? 37 : 38,
                fontWeight: 'bold',
                lineHeight: currentPage === 0 ? 44 : 40,
                marginTop: currentPage === 1 ? 48 : 0,
              }}
            >
              {currentContent.title}
            </Text>

            {/* Subtitle (only for pages 2 and 3) */}
            {currentContent.subtitle && (
              <Text
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 13,
                  marginTop: 10,
                  lineHeight: 18,
                  paddingHorizontal: 0,
                }}
              >
                {currentContent.subtitle}
              </Text>
            )}

            {/* Image */}
            <View style={{
              alignItems: 'center',
              marginTop: currentPage === 0 ? 40 : (currentPage === 1 ? 10 : 20),
              marginBottom: 0
            }}>
              <Animated.View
                style={{
                  transform: getImageTransform(),
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 10,
                }}
              >
                <Animated.Image
                  source={currentContent.image}
                  style={currentContent.imageStyle}
                  resizeMode={currentPage === 0 ? 'cover' : 'contain'}
                />
              </Animated.View>
            </View>

            {/* Dots */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: currentPage === 0 ? 40 : (currentPage === 1 ? 10 : 25)
            }}>
              {pages.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: currentPage === index ? 18 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: currentPage === index
                      ? 'white'
                      : currentPage === 0 && index > 0
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(255,255,255,0.7)',
                    marginHorizontal: 4,
                  }}
                />
              ))}
            </View>
          </Animated.View>

          {/* Next button - outside animated content so it stays in place */}
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleNext}
            activeOpacity={1}
            style={{ marginTop: currentPage === 0 ? 20 : 30 }}
          >
            <Animated.View
              style={{
                backgroundColor: 'white',
                borderRadius: 50,
                paddingLeft: 30,
                paddingRight: 8,
                paddingVertical: 8,
                height: currentPage === 2 ? 57 : undefined,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: 320,
                marginBottom: currentPage === 1 ? 45 : 0,
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
          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={handleBack}
            disabled={currentPage === 0}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '500',
              opacity: currentPage === 0 ? 0.5 : 1,
            }}>
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10 }} onPress={handleSkip}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>Skip</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
