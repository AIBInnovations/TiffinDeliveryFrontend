import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../types/navigation';
import { SPACING } from '../constants/spacing';
import { FONT_SIZES } from '../constants/typography';

type NavigationProp = StackNavigationProp<MainTabParamList>;

interface BottomNavBarProps {
  activeTab: 'home' | 'orders' | 'meals' | 'profile';
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const handleNavigation = (tab: 'home' | 'orders' | 'meals' | 'profile') => {
    switch (tab) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'orders':
        navigation.navigate('YourOrders');
        break;
      case 'meals':
        navigation.navigate('OnDemand');
        break;
      case 'profile':
        navigation.navigate('Account');
        break;
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(10, insets.bottom) + 8,
          left: SPACING.lg + 4,
          right: SPACING.lg + 4,
          backgroundColor: 'white',
          borderRadius: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: SPACING.xs + 2,
          paddingLeft: SPACING.lg + 4,
          paddingRight: SPACING['3xl'] - 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Home Icon */}
        <TouchableOpacity
          onPress={() => handleNavigation('home')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'home' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: SPACING.xl + 5,
            paddingVertical: SPACING.sm,
            paddingHorizontal: activeTab === 'home' ? SPACING.lg : SPACING.sm,
            marginLeft: -SPACING.sm,
            marginRight: 4,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Image
            source={require('../assets/icons/house.png')}
            style={{
              width: SPACING.iconSize,
              height: SPACING.iconSize,
              tintColor: activeTab === 'home' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'home' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'home' && (
            <Text style={{ color: '#F56B4C', fontSize: FONT_SIZES.base - 1, fontWeight: '600' }}>
              Home
            </Text>
          )}
        </TouchableOpacity>

        {/* Orders Section */}
        <TouchableOpacity
          onPress={() => handleNavigation('orders')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'orders' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: SPACING.xl + 5,
            paddingVertical: SPACING.sm,
            paddingHorizontal: activeTab === 'orders' ? SPACING.lg : SPACING.sm,
            marginHorizontal: 4,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Image
            source={require('../assets/icons/cart3.png')}
            style={{
              width: SPACING.iconSize,
              height: SPACING.iconSize,
              tintColor: activeTab === 'orders' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'orders' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'orders' && (
            <Text style={{ color: '#F56B4C', fontSize: FONT_SIZES.base - 1, fontWeight: '600' }}>
              Orders
            </Text>
          )}
        </TouchableOpacity>

        {/* On-Demand Icon */}
        <TouchableOpacity
          onPress={() => handleNavigation('meals')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'meals' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: SPACING.xl + 5,
            paddingVertical: SPACING.sm,
            paddingHorizontal: activeTab === 'meals' ? SPACING.lg : SPACING.sm,
            marginHorizontal: 4,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Image
            source={require('../assets/icons/kitchen.png')}
            style={{
              width: SPACING.iconSize,
              height: SPACING.iconSize,
              tintColor: activeTab === 'meals' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'meals' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'meals' && (
            <Text style={{ color: '#F56B4C', fontSize: FONT_SIZES.base - 1, fontWeight: '600' }}>
              On-Demand
            </Text>
          )}
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => handleNavigation('profile')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'profile' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: SPACING.xl + 5,
            paddingVertical: SPACING.sm,
            paddingHorizontal: activeTab === 'profile' ? SPACING.lg : SPACING.sm,
            marginHorizontal: 4,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Image
            source={require('../assets/icons/profile2.png')}
            style={{
              width: SPACING.iconSize,
              height: SPACING.iconSize,
              tintColor: activeTab === 'profile' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'profile' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'profile' && (
            <Text style={{ color: '#F56B4C', fontSize: FONT_SIZES.base - 1, fontWeight: '600' }}>
              Profile
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

export default BottomNavBar;
