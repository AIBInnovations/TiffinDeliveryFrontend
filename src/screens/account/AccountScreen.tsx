// src/screens/account/AccountScreen.tsx
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

type Props = StackScreenProps<MainTabParamList, 'Account'>;

const AccountScreen: React.FC<Props> = ({ navigation }) => {
  const [lunchAutoOrder, setLunchAutoOrder] = React.useState(false);
  const [dinnerAutoOrder, setDinnerAutoOrder] = React.useState(true);

  const handleLogout = () => {
    // Handle logout logic here
    console.log('Logout pressed');
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

        <Text className="text-2xl font-bold text-gray-900">My Account</Text>

        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Image
            source={require('../../assets/icons/edit3.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View className="bg-white px-5 py-6 items-center">
          <Image
            source={require('../../assets/images/myaccount/user.png')}
            style={{ width: 80, height: 80, borderRadius: 40 }}
            resizeMode="cover"
          />
          <Text className="text-xl font-bold text-gray-900 mt-4">Lorem Ipsum</Text>
          <Text className="text-sm text-gray-500 mt-1">+91 92723-92737</Text>
        </View>

        {/* Voucher Card */}
        <View className="mx-5 my-4" style={{ borderRadius: 25, overflow: 'hidden' }}>
          <Image
            source={require('../../assets/images/myaccount/voucherbackgound.png')}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={{ padding: 20 }}>
            {/* Top Row - Icon and Buy More Button */}
            <View className="flex-row items-center justify-between mb-4">
              <Image
                source={require('../../assets/icons/newvoucher2.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
              <TouchableOpacity
                className="bg-white rounded-full px-4 py-2"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                onPress={() => navigation.navigate('MealPlans')}
              >
                <Text className="text-orange-400 font-semibold text-sm">Buy More</Text>
              </TouchableOpacity>
            </View>

            {/* Vouchers Count */}
            <View className="mb-3">
              <Text className="text-4xl font-bold text-gray-900">
                12 <Text className="text-base font-normal text-gray-700">vouchers</Text>
              </Text>
            </View>

            {/* Description Text */}
            <Text className="text-sm text-gray-600 mb-4" style={{ lineHeight: 20 }}>
              Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.
            </Text>

            {/* Validity Section */}
            <Text className="text-xs font-semibold text-gray-700 mb-2">Validity</Text>

            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-orange-400 mr-2" />
                  <Text className="text-sm text-gray-700">6 vouchers expires</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">31st Nov 25</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-gray-900 mr-2" />
                  <Text className="text-sm text-gray-700">4 vouchers expires</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">31st Dec 25</Text>
              </View>
            </View>

            {/* Auto Order Toggles */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">Auto Order:</Text>

              <View className="flex-row items-center">
                {/* Lunch Toggle */}
                <TouchableOpacity
                  onPress={() => setLunchAutoOrder(!lunchAutoOrder)}
                  className="flex-row items-center mr-4"
                >
                  <Text
                    className="text-sm font-medium mr-2"
                    style={{ color: lunchAutoOrder ? '#F56B4C' : '#6B7280' }}
                  >
                    Lunch
                  </Text>
                  <View
                    style={{
                      width: 34,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: lunchAutoOrder ? '#F56B4C' : '#D1D5DB',
                      padding: 2,
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: 'white',
                        alignSelf: lunchAutoOrder ? 'flex-end' : 'flex-start',
                      }}
                    />
                  </View>
                </TouchableOpacity>

                {/* Dinner Toggle */}
                <TouchableOpacity
                  onPress={() => setDinnerAutoOrder(!dinnerAutoOrder)}
                  className="flex-row items-center"
                >
                  <Text
                    className="text-sm font-medium mr-2"
                    style={{ color: dinnerAutoOrder ? '#F56B4C' : '#6B7280' }}
                  >
                    Dinner
                  </Text>
                  <View
                    style={{
                      width: 34,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: dinnerAutoOrder ? '#F56B4C' : '#D1D5DB',
                      padding: 2,
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: 'white',
                        alignSelf: dinnerAutoOrder ? 'flex-end' : 'flex-start',
                      }}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View className="px-5 mb-4">
          <Text className="text-xl font-bold text-gray-900 mb-3">Account</Text>

          <View className="bg-white rounded-2xl overflow-hidden">
            {/* My Orders */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
              onPress={() => navigation.navigate('YourOrders')}
            >
              <View className="flex-row items-center">
                <Image
                  source={require('../../assets/icons/order2.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
                <Text className="text-base font-medium text-gray-900 ml-3">My Orders</Text>
              </View>
              <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            {/* Saved Addresses */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
              onPress={() => navigation.navigate('Address')}
            >
              <View className="flex-row items-center">
                <Image
                  source={require('../../assets/icons/address2.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
                <Text className="text-base font-medium text-gray-900 ml-3">Saved Addresses</Text>
              </View>
              <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            {/* Meal Plans */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4"
              onPress={() => navigation.navigate('MealPlans')}
            >
              <View className="flex-row items-center">
                <Image
                  source={require('../../assets/icons/mealplan.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
                <Text className="text-base font-medium text-gray-900 ml-3">Meal Plans</Text>
              </View>
              <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">Support</Text>

          <View className="bg-white rounded-2xl overflow-hidden">
            {/* Help & Support */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <View className="flex-row items-center">
                <Image
                  source={require('../../assets/icons/help2.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
                <Text className="text-base font-medium text-gray-900 ml-3">Help & Support</Text>
              </View>
              <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            {/* About */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4"
              onPress={() => navigation.navigate('About')}
            >
              <View className="flex-row items-center">
                <Image
                  source={require('../../assets/icons/info.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
                <Text className="text-base font-medium text-gray-900 ml-3">About</Text>
              </View>
              <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-5 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-orange-400 rounded-full py-4 items-center shadow-lg"
          >
            <Text className="text-white font-bold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountScreen;
