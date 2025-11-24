// src/screens/account/OurJourneyScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';

type Props = StackScreenProps<MainTabParamList, 'OurJourney'>;

const OurJourneyScreen: React.FC<Props> = ({ navigation }) => {
  const handleSocialMedia = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center"
        >
          <Image
            source={require('../../assets/icons/backarrow2.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900">Our Journey</Text>

        <View className="w-10 h-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Tiffin Dabba Section */}
        <View className="px-5 mt-6">
          <Text className="text-rgba(0, 0, 0, 1) mb-1" style={{ fontSize: 24, fontWeight: '500',  }}>Tiffin Dabba</Text>
          <Text className="text-sm leading-6 mb-6" style={{ color: 'rgba(145, 145, 145, 1)' }}>
            Bringing the warmth of homecooked meals to your doorstep, one tiffin at a time.
          </Text>
        </View>

        {/* The Beginnings Section */}
        <View className="px-5 mt-30">
          <Text className="text-rgba(0, 0, 0, 1) mb-2" style={{ fontSize: 20, fontWeight: '500' }}>The Beginnings</Text>
          <Text className="text-sm leading-6 mb-4" style={{ color: 'rgba(145, 145, 145, 1)', fontFamily: 'Inter', fontWeight: '400' }}>
            Lorem ipsum dolor sit amet consectetur. Quisque libero eget id consectetur gravida vulputate dignissim rutrum. Nulla mauris tincidunt et sed aliquam nullam quis tristique. Laoreet sit sollicitudin interdum dolor. Et dignissim fermentum eu sem. Enim vitae eu vehicula duis aenean orci ligula diam a. Arcu phasellus nunc ac euismod nunc. Aliquam tellus odio nunc nisl quis aliquam.
          </Text>

          {/* Images */}
          <View className="flex-row justify-between mb-5" style={{ alignItems: 'flex-end' }}>
            <Image
              source={require('../../assets/images/journey/journey4.png')}
              style={{ width: '48%', height: 159 }}
              resizeMode="cover"
            />
            <Image
              source={require('../../assets/images/journey/journey5.png')}
              style={{ width: '48%', height: 223 }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Later Journey Section */}
        <View className="px-5 mt-4">
          <Text className="text-rgba(0, 0, 0, 1) mb-2" style={{ fontSize: 20, fontWeight: '400',  lineHeight: 30 }}>Later Journey</Text>
          <Text className="text-sm leading-6 mb-6" style={{ color: 'rgba(145, 145, 145, 1)', fontFamily: 'Inter', fontWeight: '400' }}>
            Lorem ipsum dolor sit amet consectetur. Quisque libero eget id consectetur gravida vulputate dignissim rutrum. Nulla mauris tincidunt et sed aliquam nullam quis tristique. Laoreet sit sollicitudin interdum dolor. Et dignissim fermentum eu sem. Enim vitae eu vehicula duis aenean orci ligula diam a. Arcu phasellus nunc ac euismod nunc. Aliquam tellus odio nunc nisl quis aliquam.
          </Text>
        </View>

        {/* Statistics Cards */}
        <View className="px-5">
          <View className="flex-row justify-between mb-4">
            {/* Happy Customers */}
            <View
              className="bg-white rounded-2xl p-4 flex-row items-start justify-between"
              style={{
                width: '48%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View>
                <Text className="mb-1" style={{ fontSize: 15, fontWeight: '700', fontFamily: 'DM Sans', lineHeight: 19.5, color: 'rgba(94, 94, 94, 1)' }}>Happy{'\n'}Customers</Text>
                <Text className="text-2xl font-bold text-orange-400">5000+</Text>
              </View>
              <Image
                source={require('../../assets/icons/people2.png')}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </View>

            {/* Daily Deliveries */}
            <View
              className="bg-white rounded-2xl p-4 flex-row items-start justify-between"
              style={{
                width: '48%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View>
                <Text className="text-sm mb-1" style={{ fontSize: 15, fontWeight: '700', fontFamily: 'DM Sans', lineHeight: 19.5, color: 'rgba(94, 94, 94, 1)' }}>Daily{'\n'}Deliveries</Text>
                <Text className="text-2xl font-bold text-orange-400">800+</Text>
              </View>
              <Image
                source={require('../../assets/icons/delieveries.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>
          </View>

          <View className="flex-row justify-between mb-6">
            {/* Average Rating */}
            <View
              className="bg-white rounded-2xl p-4 flex-row items-start justify-between"
              style={{
                width: '48%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View>
                <Text className="mb-2" style={{ fontSize: 15, fontWeight: '700', fontFamily: 'DM Sans', lineHeight: 19.5, color: 'rgba(94, 94, 94, 1)' }}>Average{'\n'}Rating</Text>
                <Text className="text-2xl font-bold text-orange-400">4.7/5</Text>
              </View>
              <Image
                source={require('../../assets/icons/rating2.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>

            {/* Customer Satisfaction */}
            <View
              className="bg-white rounded-2xl p-4 flex-row items-start"
              style={{
                width: '48%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View className="flex-1">
                <Text className="mb-1" style={{ fontSize: 15, fontWeight: '700', fontFamily: 'DM Sans', lineHeight: 19.5, color: 'rgba(94, 94, 94, 1)' }}>Customer Satisfaction</Text>
                <Text className="text-2xl font-bold text-orange-400">100%</Text>
              </View>
              <Image
                source={require('../../assets/icons/happy2.png')}
                style={{ width: 24, height: 24, marginLeft: 8 }}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Follow Us Section */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Follow Us at</Text>

          {/* Facebook */}
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => handleSocialMedia('https://facebook.com')}
          >
            <Image
              source={require('../../assets/icons/facebook2.png')}
              style={{ width: 40, height: 40, marginRight: 12 }}
              resizeMode="contain"
            />
            <Text className="text-base font-medium text-gray-900">Facebook</Text>
          </TouchableOpacity>

          {/* Twitter */}
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => handleSocialMedia('https://twitter.com')}
          >
            <Image
              source={require('../../assets/icons/twitter2.png')}
              style={{ width: 40, height: 40, marginRight: 12 }}
              resizeMode="contain"
            />
            <Text className="text-base font-medium text-gray-900">Twitter</Text>
          </TouchableOpacity>

          {/* Instagram */}
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => handleSocialMedia('https://instagram.com')}
          >
            <Image
              source={require('../../assets/icons/insta2.png')}
              style={{ width: 40, height: 40, marginRight: 12 }}
              resizeMode="contain"
            />
            <Text className="text-base font-medium text-gray-900">Instagram</Text>
          </TouchableOpacity>
        </View>

        {/* Opening Hours */}
        <View className="px-5 mb-8 flex-row items-center" style={{ backgroundColor: 'rgba(255, 245, 242, 1)', width: 320, height: 48, borderRadius: 42, alignSelf: 'center' }}>
          <Image
            source={require('../../assets/icons/time2.png')}
            style={{ width: 20, height: 20, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text className="text-sm text-orange-400 font-medium">
            Mon-Sat: 9 AM - 9 PM | Sun: 10 AM - 6 PM
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OurJourneyScreen;
