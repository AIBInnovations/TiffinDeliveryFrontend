// src/screens/onboarding/OnboardingSwiper.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  ImageBackground,
  Image,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingScreenProps } from '../../types/navigation';

type Props = OnboardingScreenProps<'OnboardingScreen1'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description?: string;
  backgroundImage: any;
  mainImage: any;
  backgroundStyle: object;
  backgroundImageStyle?: object;
  animationType: 'rotate' | 'float';
  imageStyle?: object;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Taste\nTasky Meals\nEvery Days',
    backgroundImage: require('../../assets/images/onboarding/fastfood.png'),
    mainImage: require('../../assets/images/onboarding/onboarding1.png'),
    backgroundStyle: {
      width: 220,
      height: 230,
      paddingLeft: 0,
      marginLeft: -45,
      paddingRight: 8,
      marginTop: -21,
      justifyContent: 'center',
      position: 'absolute',
      top: 0,
      left: 0,
    },
    backgroundImageStyle: { opacity: 0.8 },
    animationType: 'rotate',
    imageStyle: { width: 250, height: 250, borderRadius: 140 },
  },
  {
    id: '2',
    title: 'Get Coupons\nFor Auto\nDelivery',
    description: 'Lorem ipsum dolor amet consectetur.\nAdipiscing ultricies dui morbi varius ac id.',
    backgroundImage: require('../../assets/images/onboarding/couponbackground.png'),
    mainImage: require('../../assets/images/onboarding/onboarding2.png'),
    backgroundStyle: {
      width: 250,
      height: 320,
      paddingLeft: 2,
      paddingRight: 8,
      marginTop: -100,
      marginLeft: -50,
      position: 'absolute',
      top: 0,
      left: 0,
    },
    backgroundImageStyle: { opacity: 0.8, borderRadius: 100 },
    animationType: 'float',
    imageStyle: { width: 280, height: 260, marginBottom: -10 },
  },
  {
    id: '3',
    title: 'Meals\nThat Feel\nLike Home',
    description: 'Lorem ipsum dolor amet consectetur.\nAdipiscing ultricies dui morbi varius acid.',
    backgroundImage: require('../../assets/images/onboarding/home.png'),
    mainImage: require('../../assets/images/onboarding/onboarding3.png'),
    backgroundStyle: {
      width: 220,
      height: 290,
      paddingLeft: 2,
      paddingRight: 8,
      marginTop: -62,
      marginLeft: -35,
      marginBottom: 20,
      position: 'absolute',
      top: 0,
      left: 0,
    },
    backgroundImageStyle: { opacity: 0.8 },
    animationType: 'float',
    imageStyle: { width: 280, height: 200 },
  },
];

const OnboardingSwiper: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Auth');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    navigation.navigate('Auth');
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH
    );
    setCurrentIndex(slideIndex);
  };

  const renderDots = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: currentIndex === 0 ? 40 : currentIndex === 1 ? 10 : 25 }}>
      {SLIDES.map((_, index) => (
        <View
          key={index}
          style={{
            width: index === currentIndex ? 18 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor:
              index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
            marginHorizontal: 4,
          }}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-orange-400">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <OnboardingSlideItem
              item={item}
              index={index}
              renderDots={renderDots}
            />
          )}
        />

        {/* Next button */}
        <View className="px-10" style={{ position: 'absolute', bottom: 140, left: 0, right: 0 }}>
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
                paddingLeft: 30,
                paddingRight: 8,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: 320,
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
            disabled={currentIndex === 0}
          >
            <Text
              style={{
                color: currentIndex === 0 ? 'rgba(255,255,255,0.5)' : 'white',
                fontSize: 16,
                fontWeight: '500',
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10 }} onPress={handleSkip}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

interface SlideItemProps {
  item: OnboardingSlide;
  index: number;
  renderDots: () => React.ReactNode;
}

const OnboardingSlideItem: React.FC<SlideItemProps> = ({ item, index, renderDots }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item.animationType === 'rotate') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else if (item.animationType === 'float') {
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
        ])
      ).start();
    }
  }, [rotateAnim, floatAnim, item.animationType]);

  const getImageTransform = () => {
    if (item.animationType === 'rotate') {
      return [
        {
          rotate: rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
      ];
    } else {
      return [{ translateY: floatAnim }, { rotate: '-8deg' }];
    }
  };

  return (
    <View
      style={{ width: SCREEN_WIDTH, paddingHorizontal: 40 }}
    >
      <View className="flex-1 justify-center" style={{ width: '100%' }}>
        {/* Background Image */}
        <ImageBackground
          source={item.backgroundImage}
          style={item.backgroundStyle as any}
          resizeMode="cover"
          imageStyle={item.backgroundImageStyle}
        />

        {/* Text */}
        <Text
          style={{
            color: 'white',
            fontSize: index === 2 ? 37 : 38,
            fontWeight: 'bold',
            lineHeight: index === 0 ? 44 : 40,
            marginTop: index === 1 ? 48 : 0,
          }}
        >
          {item.title}
        </Text>

        {/* Description (only for slides 2 and 3) */}
        {item.description && (
          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              marginTop: 10,
              lineHeight: 18,
              paddingHorizontal: 0,
            }}
          >
            {item.description}
          </Text>
        )}

        {/* Main Image */}
        <View
          style={{
            alignItems: 'center',
            marginTop: index === 0 ? 40 : index === 1 ? 10 : 20,
            marginBottom: 0,
          }}
        >
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
              source={item.mainImage}
              style={item.imageStyle}
              resizeMode={index === 0 ? 'cover' : 'contain'}
            />
          </Animated.View>
        </View>

        {/* Dots */}
        {renderDots()}
      </View>
    </View>
  );
};

export default OnboardingSwiper;
