// src/screens/account/AboutScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

type Props = StackScreenProps<MainTabParamList, 'About'>;

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  const { isSmallDevice } = useResponsive();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="items-center justify-center"
          style={{
            minWidth: TOUCH_TARGETS.minimum,
            minHeight: TOUCH_TARGETS.minimum,
          }}
        >
          <Image
            source={require('../../assets/icons/arrowup.png')}
            style={{ width: SPACING.iconLg, height: SPACING.iconLg }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text className="font-bold text-gray-900" style={{ fontSize: isSmallDevice ? FONT_SIZES.h4 : FONT_SIZES.h3 }}>About</Text>

        <View style={{ minWidth: TOUCH_TARGETS.minimum, minHeight: TOUCH_TARGETS.minimum }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* About Us Section */}
        <View className="px-5 mt-6">
          <Text className="font-bold text-gray-900 mb-4" style={{ fontSize: isSmallDevice ? FONT_SIZES.h4 : FONT_SIZES.h3 }}>About Us</Text>

          <TouchableOpacity
            className="flex-row items-center bg-white rounded-2xl mb-3"
            style={{
              padding: SPACING.lg,
              minHeight: TOUCH_TARGETS.large,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
            onPress={() => navigation.navigate('OurJourney')}
          >
            <View
              className="rounded-full bg-orange-400 items-center justify-center"
              style={{
                width: SPACING.iconXl + 4,
                height: SPACING.iconXl + 4,
              }}
            >
              <Image
                source={require('../../assets/icons/journey3.png')}
                style={{ width: SPACING.iconLg, height: SPACING.iconLg }}
                resizeMode="contain"
              />
            </View>
            <Text className="flex-1 font-medium text-gray-900" style={{ fontSize: FONT_SIZES.base, marginLeft: SPACING.lg }}>
              Our Journey
            </Text>
            <Image
              source={require('../../assets/icons/rightarrow.png')}
              style={{ width: SPACING.iconSize, height: SPACING.iconSize }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View className="px-5 mt-6">
          <Text className="font-bold text-gray-900 mb-4" style={{ fontSize: isSmallDevice ? FONT_SIZES.h4 : FONT_SIZES.h3 }}>Legal</Text>

          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            {/* Privacy Policy */}
            <TouchableOpacity
              className="flex-row items-center border-b border-gray-100"
              style={{
                padding: SPACING.lg,
                minHeight: TOUCH_TARGETS.large,
              }}
              onPress={() => {}}
            >
              <View
                className="rounded-full bg-orange-400 items-center justify-center"
                style={{
                  width: SPACING.iconXl + 4,
                  height: SPACING.iconXl + 4,
                }}
              >
                <Image
                  source={require('../../assets/icons/privacy2.png')}
                  style={{ width: SPACING.iconXl, height: SPACING.iconXl }}
                  resizeMode="contain"
                />
              </View>
              <Text className="flex-1 font-medium text-gray-900" style={{ fontSize: FONT_SIZES.base, marginLeft: SPACING.lg }}>
                Privacy Policy
              </Text>
              <Image
                source={require('../../assets/icons/rightarrow.png')}
                style={{ width: SPACING.iconSize, height: SPACING.iconSize }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* License & Agreement */}
            <TouchableOpacity
              className="flex-row items-center border-b border-gray-100"
              style={{
                padding: SPACING.lg,
                minHeight: TOUCH_TARGETS.large,
              }}
              onPress={() => {}}
            >
              <View
                className="rounded-full bg-orange-400 items-center justify-center"
                style={{
                  width: SPACING.iconXl + 4,
                  height: SPACING.iconXl + 4,
                }}
              >
                <Image
                  source={require('../../assets/icons/license2.png')}
                  style={{ width: SPACING.iconLg, height: SPACING.iconLg }}
                  resizeMode="contain"
                />
              </View>
              <Text className="flex-1 font-medium text-gray-900" style={{ fontSize: FONT_SIZES.base, marginLeft: SPACING.lg }}>
                License & Agreement
              </Text>
              <Image
                source={require('../../assets/icons/rightarrow.png')}
                style={{ width: SPACING.iconSize, height: SPACING.iconSize }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Refund Policy */}
            <TouchableOpacity
              className="flex-row items-center"
              style={{
                padding: SPACING.lg,
                minHeight: TOUCH_TARGETS.large,
              }}
              onPress={() => {}}
            >
              <View
                className="rounded-full bg-orange-400 items-center justify-center"
                style={{
                  width: SPACING.iconXl + 4,
                  height: SPACING.iconXl + 4,
                }}
              >
                <Image
                  source={require('../../assets/icons/refund2.png')}
                  style={{ width: SPACING.iconXl, height: SPACING.iconXl }}
                  resizeMode="contain"
                />
              </View>
              <Text className="flex-1 font-medium text-gray-900" style={{ fontSize: FONT_SIZES.base, marginLeft: SPACING.lg }}>
                Refund Policy
              </Text>
              <Image
                source={require('../../assets/icons/rightarrow.png')}
                style={{ width: SPACING.iconSize, height: SPACING.iconSize }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View className="px-5 mt-6 mb-8">
          <Text className="text-gray-500" style={{ fontSize: FONT_SIZES.sm }}>App version</Text>
          <Text className="text-gray-500 mt-1" style={{ fontSize: FONT_SIZES.sm }}>0.2.344</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;
