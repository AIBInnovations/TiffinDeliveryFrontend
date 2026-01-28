// src/screens/ondemand/OnDemandScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';
import { useSubscription } from '../../context/SubscriptionContext';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

type Props = StackScreenProps<MainTabParamList, 'OnDemand'>;

const OnDemandScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'meals' | 'profile'>('meals');
  const { usableVouchers } = useSubscription();
  const { isSmallDevice } = useResponsive();

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

      {/* Bottom Navigation Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 10,
          left: 20,
          right: 20,
          backgroundColor: 'white',
          borderRadius: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 6,
          paddingLeft: 20,
          paddingRight: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Home Icon */}
        <TouchableOpacity
          onPress={() => {
            setActiveTab('home');
            navigation.navigate('Home');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'home' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'home' ? 16 : 8,
            marginLeft: -8,
            marginRight: 4,
            minHeight: TOUCH_TARGETS.minimum,
            minWidth: TOUCH_TARGETS.minimum,
          }}
        >
          <Image
            source={require('../../assets/icons/house.png')}
            style={{
              width: SPACING.iconSize,
              height: SPACING.iconSize,
              tintColor: activeTab === 'home' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'home' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'home' && (
            <Text style={{ color: '#F56B4C', fontSize: FONT_SIZES.base, fontWeight: '600' }}>
              Home
            </Text>
          )}
        </TouchableOpacity>

        {/* Orders Section */}
        <TouchableOpacity
          onPress={() => {
            setActiveTab('orders');
            navigation.navigate('YourOrders');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'orders' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'orders' ? 16 : 8,
            marginHorizontal: 4,
            minHeight: TOUCH_TARGETS.minimum,
            minWidth: TOUCH_TARGETS.minimum,
          }}
        >
          <Image
            source={require('../../assets/icons/cart3.png')}
            style={{
              width: SPACING.iconSize,
              height: SPACING.iconSize,
              tintColor: activeTab === 'orders' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'orders' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'orders' && (
            <Text style={{ color: '#F56B4C', fontSize: FONT_SIZES.base, fontWeight: '600' }}>
              Orders
            </Text>
          )}
        </TouchableOpacity>

        {/* On-Demand Icon */}
        <TouchableOpacity
          onPress={() => setActiveTab('meals')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'meals' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'meals' ? 16 : 8,
            marginHorizontal: 4,
            minHeight: TOUCH_TARGETS.minimum,
            minWidth: TOUCH_TARGETS.minimum,
          }}
        >
          <Image
            source={require('../../assets/icons/kitchen.png')}
            style={{
              width: SPACING.iconSize,
              height: SPACING.iconSize,
              tintColor: activeTab === 'meals' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'meals' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'meals' && (
            <Text style={{ color: '#F56B4C', fontSize: FONT_SIZES.base, fontWeight: '600' }}>
              On-Demand
            </Text>
          )}
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => {
            setActiveTab('profile');
            navigation.navigate('Account');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'profile' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'profile' ? 16 : 8,
            marginHorizontal: 4,
            minHeight: TOUCH_TARGETS.minimum,
            minWidth: TOUCH_TARGETS.minimum,
          }}
        >
          <Image
            source={require('../../assets/icons/profile2.png')}
            style={{
              width: SPACING.iconSize,
              height: SPACING.iconSize,
              tintColor: activeTab === 'profile' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'profile' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'profile' && (
            <Text style={{ color: '#F56B4C', fontSize: FONT_SIZES.base, fontWeight: '600' }}>
              Profile
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnDemandScreen;
