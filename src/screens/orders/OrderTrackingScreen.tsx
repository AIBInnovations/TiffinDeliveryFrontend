// src/screens/orders/OrderTrackingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';

type Props = StackScreenProps<MainTabParamList, 'OrderTracking'>;

const OrderTrackingScreen: React.FC<Props> = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [pickupNotes, setPickupNotes] = useState('');

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  const handleCallDelivery = () => {
    console.log('Calling delivery guy');
  };

  const handleMessageDelivery = () => {
    console.log('Messaging delivery guy');
  };

  const handleCancelOrder = () => {
    console.log('Cancel order');
  };

  const handleViewReceipt = () => {
    console.log('View receipt');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center" style={{ backgroundColor: 'rgba(237, 239, 241, 1)' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center"
          >
            <Image
              source={require('../../assets/icons/arrow.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text className="flex-1 text-center text-xl font-bold text-gray-900 mr-10">
            Order Tracking
          </Text>
        </View>

        {/* Illustration */}
        <View className="items-center py-2" style={{ backgroundColor: 'rgba(237, 239, 241, 1)' }}>
          <Image
            source={require('../../assets/images/trackorder/tracking2.png')}
            style={{ width: 280, height: 200 }}
            resizeMode="contain"
          />
        </View>

        {/* Order Status - Combined Container */}
        <View className="bg-white px-5 py-6 mb-2">
          {/* Meal is cooking */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-bold text-gray-900">Meal is cooking</Text>
            <Text className="text-sm text-gray-500">Order ID - #837</Text>
          </View>
          <Text className="text-sm text-gray-600 mb-6">
            Arriving at <Text className="font-bold text-gray-900">07:30 PM</Text>
          </Text>

          {/* Progress Tracker */}
          <View className="flex-row items-center justify-between mb-6">
            {/* Prepared */}
            <View className="items-center" style={{ width: 50 }}>
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"

              >
                <Image
                  source={require('../../assets/icons/prepared2.png')}
                  style={{ width: 40, height: 40, }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-xs font-semibold" style={{ color: '#FB923C' }}>
                Prepared
              </Text>
            </View>

            {/* Line */}
            <View style={{ flex: 1, height: 2, marginHorizontal: 4, marginBottom: 24, flexDirection: 'row' }}>
              <View style={{ flex: 2, height: 2, backgroundColor: 'rgba(245, 107, 76, 1)' }} />
              <View style={{ flex: 1, height: 2, backgroundColor: '#D1D5DB' }} />
            </View>

            {/* Delivery */}
            <View className="items-center" style={{ width: 50 }}>
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
              >
                <Image
                  source={require('../../assets/icons/delivery2.png')}
                  style={{ width: 40, height: 40, }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-xs font-semibold text-gray-500">Delivery</Text>
            </View>

            {/* Line */}
            <View style={{ flex: 1, height: 2, backgroundColor: '#D1D5DB', marginHorizontal: 4, marginBottom: 24 }} />

            {/* Delivered */}
            <View className="items-center" style={{ width: 50 }}>
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"

              >
                <Image
                  source={require('../../assets/icons/delievered2.png')}
                  style={{ width: 40, height: 40,}}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-xs font-semibold text-gray-500">Delivered</Text>
            </View>
          </View>

          {/* Call Delivery Guy */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center flex-1">
              <Image
                source={require('../../assets/images/homepage/lunchThali.png')}
                style={{ width: 56, height: 56, borderRadius: 28 }}
                resizeMode="cover"
              />
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-gray-900">Call Delivery Guy</Text>
                <Text className="text-sm text-gray-500">John Doe</Text>
              </View>
            </View>

            <View className="flex-row">
              <TouchableOpacity
                onPress={handleMessageDelivery}
                className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center mr-2"
              >
                <Image
                  source={require('../../assets/icons/mail2.png')}
                  style={{ width: 32, height: 32,  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCallDelivery}
                className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center"
              >
                <Image
                  source={require('../../assets/icons/call3.png')}
                  style={{ width: 32, height: 32, }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pickup Notes */}
          <View className="flex-row items-center rounded-full px-4 mb-6" style={{ height: 48, backgroundColor: 'rgba(241, 241, 241, 1)' }}
                           
>
            <TextInput
              placeholder="Any Pickup Notes?"
              placeholderTextColor="rgba(143, 143, 143, 1)"
              value={pickupNotes}
              onChangeText={setPickupNotes}
              className="flex-1 text-sm text-gray-900"
            />
            <Image
              source={require('../../assets/icons/pen2.png')}
              style={{ width: 20, height: 20, }}
              resizeMode="contain"
            />
          </View>

          {/* OTP Section */}
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-gray-900">
              Give OTP during Delivery
            </Text>
            <View className="flex-row">
              {otp.map((digit, index) => (
                <View
                  key={index}
                  className="bg-gray-100 items-center justify-center"
                  style={{ width: 33, height: 35, borderRadius: 7, marginRight: index < 3 ? 4 : 0 }}
                >
                  <Text className="font-bold" style={{ fontSize: 15, color: 'rgba(81, 81, 81, 1)' }}>{digit || '0'}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View className="bg-white px-5 py-5 mb-2" style={{ borderRadius: 25 }}>
          <Text className="text-xl font-bold text-gray-900 mb-4">Order Summary</Text>

          {/* Lunch Meal */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <Text className="text-sm text-gray-900">Lunch Meal</Text>
              <Text className="text-sm text-gray-500 ml-2">x1</Text>
            </View>
            <Text style={{ textDecorationLine: 'line-through', color: 'rgba(227, 22, 22, 1)', fontWeight: '600', fontSize: 14 }}>₹100.00</Text>
          </View>

          {/* Voucher Applied */}
          <View className="flex-row items-center mb-3">
            <Text className="text-xs font-semibold" style={{ color: '#16A34A' }}>
              1 Voucher Applied
            </Text>
            <View className="ml-2 w-4 h-4 rounded-full items-center justify-center" style={{ backgroundColor: '#16A34A' }}>
              <Text className="text-white text-xs font-bold">✓</Text>
            </View>
          </View>

          {/* Roti */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <Text className="text-sm text-gray-900">Roti</Text>
              <Text className="text-sm text-gray-500 ml-2">x2</Text>
            </View>
            <Text className="text-sm" style={{ color: 'rgba(0, 0, 0, 1)', fontWeight: 600, }}>₹70.00</Text>
          </View>

          {/* Raita */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <Text className="text-sm text-rgba(108, 108, 108, 1)">Raita</Text>
              <Text className="text-sm text-gray-500 ml-2">x1</Text>
            </View>
            <Text className="text-sm" style={{ color: 'rgba(0, 0, 0, 1)', fontWeight: 600, }}>₹70.00</Text>
          </View>

          {/* Other Charges */}
          <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-200">
            <Text className="text-sm text-gray-900">Other Charges</Text>
            <Text className="text-sm" style={{ color: 'rgba(0, 0, 0, 1)', fontWeight: 600, }}>₹70.00</Text>
          </View>

          {/* Total Amount */}
          <View className="flex-row justify-between">
            <Text className="text-lg font-bold text-gray-900">Total Amount:</Text>
            <Text className="text-lg font-bold" style={{ color: '#FB923C' }}>₹70.00</Text>
          </View>
        </View>

        {/* View Receipt Button */}
        <View className="px-5 mb-3">
          <TouchableOpacity
            onPress={handleViewReceipt}
            className=" rounded-full py-4 flex-row items-center justify-center "
            style={{ backgroundColor: 'rgba(255, 245, 242, 1)' }}
          >
            <Image
              source={require('../../assets/icons/reciept.png')}
              style={{ width: 20, height: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <Text className="font-bold text-base" style={{ color: 'rgba(245, 107, 76, 1)' }}>
              View Receipt
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Order Button */}
        <View className="px-5 mb-8">
          <TouchableOpacity
            onPress={handleCancelOrder}
            className="rounded-full py-4 items-center"
            style={{ backgroundColor: 'rgba(245, 107, 76, 1)' }}

          >
            <Text className="text-white font-bold text-base">Cancel Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderTrackingScreen;
