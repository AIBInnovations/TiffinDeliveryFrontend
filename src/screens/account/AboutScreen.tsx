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

type Props = StackScreenProps<MainTabParamList, 'About'>;

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center"
        >
          <Image
            source={require('../../assets/icons/arrowup.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900">About</Text>

        <View className="w-10 h-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* About Us Section */}
        <View className="px-5 mt-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">About Us</Text>

          <TouchableOpacity
            className="flex-row items-center bg-white rounded-2xl p-4 mb-3"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
            onPress={() => navigation.navigate('OurJourney')}
          >
            <View className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center">
              <Image
                source={require('../../assets/icons/journey3.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-900 ml-4">
              Our Journey
            </Text>
            <Image
              source={require('../../assets/icons/rightarrow.png')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View className="px-5 mt-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Legal</Text>

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
              className="flex-row items-center p-4 border-b border-gray-100"
              onPress={() => {}}
            >
              <View className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center">
                <Image
                  source={require('../../assets/icons/privacy2.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="flex-1 text-base font-medium text-gray-900 ml-4">
                Privacy Policy
              </Text>
              <Image
                source={require('../../assets/icons/rightarrow.png')}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* License & Agreement */}
            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-gray-100"
              onPress={() => {}}
            >
              <View className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center">
                <Image
                  source={require('../../assets/icons/license2.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="flex-1 text-base font-medium text-gray-900 ml-4">
                License & Agreement
              </Text>
              <Image
                source={require('../../assets/icons/rightarrow.png')}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Refund Policy */}
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => {}}
            >
              <View className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center">
                <Image
                  source={require('../../assets/icons/refund2.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="flex-1 text-base font-medium text-gray-900 ml-4">
                Refund Policy
              </Text>
              <Image
                source={require('../../assets/icons/rightarrow.png')}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View className="px-5 mt-6 mb-8">
          <Text className="text-sm text-gray-500">App version</Text>
          <Text className="text-sm text-gray-500 mt-1">0.2.344</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;
