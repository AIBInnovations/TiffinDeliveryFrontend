// src/screens/onboarding/OnboardingScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  ImageBackground,
  useWindowDimensions,
  Platform,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingScreenProps } from '../../types/navigation';

type Props = OnboardingScreenProps<'OnboardingScreen1'>;

interface PageContent {
  id: number;
  title: string;
  subtitle?: string;
  image: any;
  backgroundImage: any;
  imageAnimation: 'rotate' | 'float';
}

const pages: PageContent[] = [
  {
    id: 0,
    title: "Taste\nTasty Meals\nEvery Days",
    image: require('../../assets/images/onboarding/onboarding1.png'),
    backgroundImage: require('../../assets/images/onboarding/fastfood.png'),
    imageAnimation: 'rotate',
  },
  {
    id: 1,
    title: "Get Coupons\nFor Auto\nDelivery",
    subtitle: "Lorem ipsum dolor amet consectetur.\nAdipiscing ultricies dui morbi varius ac id.",
    image: require('../../assets/images/onboarding/onboarding2.png'),
    backgroundImage: require('../../assets/images/onboarding/couponbackground.png'),
    imageAnimation: 'float',
  },
  {
    id: 2,
    title: "Meals\nThat Feel\nLike Home",
    subtitle: "Lorem ipsum dolor amet consectetur.\nAdipiscing ultricies dui morbi varius acid.",
    image: require('../../assets/images/onboarding/onboarding3.png'),
    backgroundImage: require('../../assets/images/onboarding/home.png'),
    imageAnimation: 'float',
  },
];

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive scaling factors
  const isSmallDevice = SCREEN_HEIGHT < 700;
  const scale = Math.min(SCREEN_WIDTH / 375, 1.2);

  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
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

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH
    );
    setCurrentPage(slideIndex);
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
      flatListRef.current?.scrollToIndex({
        index: currentPage + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Auth');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Auth');
  };

  // Responsive styles
  const imageSize = isSmallDevice ? SCREEN_WIDTH * 0.55 : SCREEN_WIDTH * 0.65;
  const buttonWidth = Math.min(SCREEN_WIDTH * 0.85, 320);
  const contentPadding = Math.round(24 * scale);

  const renderPageItem = ({ item, index }: { item: PageContent; index: number }) => {
    const getImageTransform = () => {
      if (item.imageAnimation === 'rotate') {
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
      <View style={{ width: SCREEN_WIDTH, paddingHorizontal: contentPadding }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {/* Background Image */}
          <ImageBackground
            source={item.backgroundImage}
            style={{
              width: SCREEN_WIDTH * 0.55,
              height: SCREEN_WIDTH * (index === 1 ? 0.75 : 0.6),
              position: 'absolute',
              top: index === 1 ? -SCREEN_HEIGHT * 0.02 : 0,
              left: -SCREEN_WIDTH * 0.1,
            }}
            resizeMode="cover"
            imageStyle={{
              opacity: 0.8,
              borderRadius: index === 1 ? 100 : 0
            }}
          />

          {/* Title */}
          <Text
            style={{
              color: 'white',
              fontSize: Math.round(35 * scale),
              fontWeight: 'bold',
              lineHeight: Math.round(42 * scale),
            }}
          >
            {item.title}
          </Text>

          {/* Subtitle */}
          {item.subtitle && (
            <Text
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: Math.round(14 * scale),
                marginTop: 10,
                lineHeight: Math.round(20 * scale),
              }}
            >
              {item.subtitle}
            </Text>
          )}

          {/* Main Image - Fixed height container */}
          <View style={{
            alignItems: 'center',
            marginTop: isSmallDevice ? 15 : 25,
            height: imageSize + 20, // Fixed height container
            justifyContent: 'center',
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
                source={item.image}
                style={{
                  width: imageSize,
                  height: imageSize * (index === 0 ? 1 : (index === 2 ? 0.7 : 0.85)),
                  borderRadius: index === 0 ? imageSize / 2 : 0,
                }}
                resizeMode={index === 0 ? 'cover' : 'contain'}
              />
            </Animated.View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-orange-400" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />

      {/* Skip Button - Top Right */}
      <View style={{
        position: 'absolute',
        top: insets.top + 16,
        right: contentPadding,
        zIndex: 10,
      }}>
        <TouchableOpacity
          style={{ padding: 10 }}
          onPress={handleSkip}
        >
          <Text style={{
            color: 'white',
            fontSize: Math.round(15 * scale),
            fontWeight: '600'
          }}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {/* FlatList for swipeable pages */}
        <FlatList
          ref={flatListRef}
          data={pages}
          renderItem={renderPageItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          bounces={false}
        />

        {/* Pagination Dots - Fixed Position */}
        <View style={{
          paddingVertical: isSmallDevice ? 10 : 15,
          alignItems: 'center',
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {pages.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={{
                  width: currentPage === dotIndex ? 18 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentPage === dotIndex
                    ? 'white'
                    : 'rgba(255,255,255,0.5)',
                  marginHorizontal: 4,
                }}
              />
            ))}
          </View>
        </View>

        {/* Fixed Bottom Section - Button + Navigation */}
        <View
          style={{
            paddingHorizontal: contentPadding,
            paddingBottom: Platform.OS === 'android' ? insets.bottom + 12 : 12,
          }}
        >
          {/* Next/Get Started Button - Always in same position */}
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleNext}
            activeOpacity={1}
          >
            <Animated.View
              style={{
                backgroundColor: 'white',
                borderRadius: 50,
                paddingHorizontal: 24,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: buttonWidth,
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
                  fontSize: Math.round(16 * scale),
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </Animated.View>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
