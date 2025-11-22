// src/screens/account/MealPlansScreen.tsx
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

type Props = StackScreenProps<MainTabParamList, 'MealPlans'>;

interface MealPlan {
  id: string;
  days: number;
  price: number;
  vouchers: number;
  mealsPerDay: number;
  pricePerVoucher: number;
  savings?: number;
}

const MealPlansScreen: React.FC<Props> = ({ navigation }) => {
  const plans: MealPlan[] = [
    {
      id: '1',
      days: 7,
      price: 1400,
      vouchers: 14,
      mealsPerDay: 2,
      pricePerVoucher: 100,
    },
    {
      id: '2',
      days: 15,
      price: 2850,
      vouchers: 30,
      mealsPerDay: 2,
      pricePerVoucher: 95,
      savings: 150,
    },
    {
      id: '3',
      days: 30,
      price: 5400,
      vouchers: 60,
      mealsPerDay: 2,
      pricePerVoucher: 90,
      savings: 600,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#0A1F2E" />

      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        {/* Top Header - Profile, Location, Notification */}
        <View style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Background Image */}
          <Image
            source={require('../../assets/images/myaccount/mealplansbackground.png')}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          <View className="px-5 pt-3 pb-16">
          <View className="flex-row items-center justify-between mb-4">
            {/* Profile Image */}
            <TouchableOpacity>
              <Image
                source={require('../../assets/images/myaccount/userpic.png')}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* Location */}
            <TouchableOpacity className="flex-1 mx-4">
              <Text className="text-xs text-white text-center opacity-80">Location</Text>
              <View className="flex-row items-center justify-center">
                <Text className="text-sm text-white font-semibold">Vijay Nagar, Indore</Text>
                <Text className="text-white ml-1">▼</Text>
              </View>
            </TouchableOpacity>

            {/* Notification */}
            <TouchableOpacity className="w-12 h-12 rounded-full bg-white items-center justify-center">
              <Image
                source={require('../../assets/icons/notification2.png')}
                style={{ width: 42, height: 42}}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Greeting Text */}
          <View>
            <Text className="font-bold text-white" style={{ fontSize: 36 }}>Hello John</Text>
            <Text className="font-semibold text-white mt-1" style={{ fontSize: 36 }}>Enjoy Experience</Text>
          </View>
          </View>
        </View>

        {/* Purchase Vouchers Section */}
        <View className="bg-white px-5 pt-6 pb-10 flex-1" style={{ borderRadius: 33, marginTop: -20 }}>
          {/* Purchase Vouchers Heading */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Purchase Vouchers</Text>
          </View>

          {/* Current Voucher Balance */}
          <View style={{ borderRadius: 33, overflow: 'hidden' }}>
          <Image
            source={require('../../assets/images/myaccount/voucherbackgound.png')}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={{ padding: 20 }}>
            {/* Icon */}
            <View className="mb-4">
              <Image
                source={require('../../assets/icons/newvoucher2.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>

            {/* Vouchers Count */}
            <View className="mb-3">
              <Text className="text-4xl font-bold text-gray-900">
                12 <Text className="text-base font-normal text-gray-700">vouchers</Text>
              </Text>
            </View>

            {/* Description */}
            <Text className="text-sm mb-4" style={{ lineHeight: 20, color: 'rgba(71, 71, 71, 1)' }}>
              Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.
            </Text>

            {/* Validity Section */}
            <View className="flex-row items-center mb-2">
              <View className="flex-1 h-px" style={{ backgroundColor: 'white' }} />
              <Text className="text-xs  mx-3" style={{ color: 'rgba(59, 59, 59, 1)', fontSize: 13 }}>Validity</Text>
              <View className="flex-1 h-px" style={{ backgroundColor: 'white' }} />
            </View>

            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm" style={{ color: 'rgba(71, 71, 71, 1)' }}>Valid Until</Text>
                <Text className="text-sm font-15px-400" style={{ color: 'rgba(71, 71, 71, 1)' }}>Days Remaining</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm" style={{ color: 'rgba(71, 71, 71, 1)', fontSize: 15, fontWeight: '600', fontFamily: 'Inter' }}>Dec 31st, 2025</Text>
                <Text className="text-sm" style={{ color: 'rgba(71, 71, 71, 1)', fontSize: 15, fontWeight: '600', fontFamily: 'Inter' }}>50 Days</Text>
              </View>
            </View>
          </View>
        </View>
        </View>

        {/* How Vouchers Work */}
        <View className="bg-white mx-5 mb-4 rounded-3xl pl-4 pr-6 py-5">
          <Text className="text-xl font-bold text-gray-900 mb-4">How voucher's work?</Text>

          <View className="space-y-3">
            <View className="flex-row items-start mb-5">
              <Image
                source={require('../../assets/icons/order2.png')}
                style={{ width: 32, height: 32, marginRight: 12, marginTop: 2 }}
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>1 Voucher = 1 Meal</Text>
                <Text className="text-sm text-gray-700" style={{ lineHeight: 20 }}>
                  Purchase vouchers in advance to enjoy convenient and hassle-free meal deliveries
                </Text>
              </View>
            </View>

            <View className="flex-row items-start mb-5">
              <Image
                source={require('../../assets/icons/address2.png')}
                style={{ width: 32, height: 32, marginRight: 12, marginTop: 2 }}
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>Valid for Plan Duration</Text>
                <Text className="text-sm text-gray-700" style={{ lineHeight: 20 }}>
                  Each voucher can be redeemed for one meal of your choice
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Image
                source={require('../../assets/icons/mealplan.png')}
                style={{ width: 32, height: 32, marginRight: 12, marginTop: 2 }}
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>Add-ons available</Text>
                <Text className="text-sm text-gray-700" style={{ lineHeight: 20 }}>
                  Vouchers are valid for the duration specified in your plan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Choose Your Plan */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Choose Your Plan</Text>

          {plans.map((plan) => (
            <View
              key={plan.id}
              className="mb-4"
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 33,
                borderWidth: 1,
                borderColor: 'rgba(245, 107, 76, 1)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Image
                source={require('../../assets/images/myaccount/voucherbackgound.png')}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <View className="p-6">
              {/* Savings Badge */}
              {plan.savings && (
                <View
                  className="absolute top-4 right-4 rounded-full px-3 py-1"
                  style={{
                    backgroundColor: 'rgba(233, 255, 238, 1)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: 'rgba(0, 139, 30, 1)' }}>
                    Save ₹{plan.savings}
                  </Text>
                </View>
              )}

              {/* Voucher Icon */}
              <View className="mb-3">
                <Image
                  source={require('../../assets/icons/newvoucher2.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              </View>

              {/* Price and Days */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-4xl" style={{ color: 'rgba(0, 0, 0, 1)', fontWeight: '400', fontFamily: 'DM Sans' }}>
                  ₹{plan.price.toFixed(2)}
                </Text>
                <Text className="text-2xl font-semibold" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                  {plan.days} Days
                </Text>
              </View>

              {/* Plan Details */}
              <View className="mb-4">
                <View className="flex-row items-center">
                  <Text className="text-sm mr-2.5" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                    {plan.vouchers} Vouchers
                  </Text>
                  <View className="w-1 h-1 rounded-full mr-2" style={{ backgroundColor: 'rgba(0, 0, 0, 1)' }} />
                  <Text className="text-sm flex-1" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                    {plan.mealsPerDay} Meals/Day
                  </Text>
                  <Text className="text-sm" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                    ₹{plan.pricePerVoucher}/Voucher
                  </Text>
                </View>
              </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MealPlansScreen;
