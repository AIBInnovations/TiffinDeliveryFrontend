// src/screens/ondemand/OnDemandScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';
import { useSubscription } from '../../context/SubscriptionContext';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

type Props = StackScreenProps<MainTabParamList, 'OnDemand'>;

const OnDemandScreen: React.FC<Props> = ({ navigation }) => {
  const { usableVouchers } = useSubscription();
  const { isSmallDevice } = useResponsive();
  const insets = useSafeAreaInsets();

  console.log('[OnDemandScreen] Screen rendered');

  return (
    <SafeAreaView className="flex-1 bg-orange-400">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />

      {/* Header */}
      <View
        className="bg-orange-400 pb-16"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        {/* Decorative Background Elements */}
        <Image
          source={require('../../assets/images/homepage/halfcircle.png')}
          style={{ position: 'absolute', top: -90, right: -125, width: 300, height: 380 }}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/images/homepage/halfline.png')}
          style={{ position: 'absolute', top: 30, right: -150, width: 380, height: 150 }}
          resizeMode="contain"
        />

        <View className="flex-row items-center justify-between px-5 pt-4">
          {/* Logo */}
          <View
            className="w-12 h-12 items-center justify-center"
            style={{ marginLeft: 10 }}
          >
            <Image
              source={require('../../assets/icons/Tiffsy.png')}
              style={{
                width: isSmallDevice ? SPACING.iconXl * 1.2 : SPACING.iconXl * 1.45,
                height: isSmallDevice ? SPACING.iconXl * 0.7 : SPACING.iconXl * 0.875,
              }}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text className="text-white text-xl font-bold">
            On-Demand
          </Text>

          {/* Voucher Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('MealPlans')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 10,
              gap: 6,
              minHeight: TOUCH_TARGETS.minimum,
            }}
          >
            <Image
              source={require('../../assets/icons/voucher5.png')}
              style={{ width: SPACING.iconSize, height: SPACING.iconSize }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: 'bold', color: '#F56B4C' }}>{usableVouchers}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <View
        className="flex-1 bg-gray-50 items-center justify-center"
        style={{ marginTop: -20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
      >
        {/* Coming Soon Content */}
        <View className="items-center px-8">
          <Image
            source={require('../../assets/icons/kitchen.png')}
            style={{
              width: isSmallDevice ? SPACING['4xl'] * 1.5 : SPACING['4xl'] * 2,
              height: isSmallDevice ? SPACING['4xl'] * 1.5 : SPACING['4xl'] * 2,
              tintColor: '#F56B4C',
              marginBottom: SPACING['2xl'],
            }}
            resizeMode="contain"
          />
          <Text
            className="font-bold text-gray-900 mb-4"
            style={{ fontSize: isSmallDevice ? FONT_SIZES.h2 : FONT_SIZES.h1 }}
          >
            Coming Soon
          </Text>
          <Text
            className="text-gray-500 text-center"
            style={{ fontSize: FONT_SIZES.base, lineHeight: FONT_SIZES.base * 1.5 }}
          >
            We're working hard to bring you on-demand meal ordering. Stay tuned for updates!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnDemandScreen;
