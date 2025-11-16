// src/screens/cart/CartScreen.tsx
import React, { useState } from 'react';
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
import { useCart } from '../../context/CartContext';

type Props = StackScreenProps<MainTabParamList, 'Cart'>;

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const { cartItems, updateQuantity: updateCartQuantity, removeItem } = useCart();

  const updateQuantity = (id: string, increment: boolean) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      const newQuantity = increment ? item.quantity + 1 : Math.max(1, item.quantity - 1);
      updateCartQuantity(id, newQuantity);
    }
  };

  // Calculate totals based on cart items
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxesAndCharges = 10;
  const discount = Math.min(100, subtotal * 0.1); // 10% discount, max 100
  const totalAmount = subtotal + taxesAndCharges - discount;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-4">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center mr-4"
          >
            <Text className="text-white text-xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 text-center">My Cart</Text>
            <Text className="text-sm text-gray-500 text-center mt-1">
              Delivery Time: 25-30mins
            </Text>
          </View>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Your Order Section */}
        <View className="bg-white px-5 py-5 mb-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">Your Order</Text>

          {cartItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center mb-4 pb-4 border-b border-gray-100"
            >
              {/* Item Image */}
              <Image
                source={item.image}
                className="w-16 h-16 rounded-full"
                resizeMode="cover"
              />

              {/* Item Details */}
              <View className="flex-1 ml-4">
                <Text className="text-base font-bold text-gray-900">{item.name}</Text>
                <Text className="text-sm text-gray-500 mt-1">{item.subtitle}</Text>
                {item.price && (
                  <Text className="text-sm text-gray-900 font-semibold mt-1">
                    ₹{item.price}.00
                  </Text>
                )}
                {item.hasVoucher && (
                  <View className="flex-row items-center mt-2">
                    <Text className="text-xs text-green-600 mr-1">🎟️</Text>
                    <Text className="text-xs text-green-600 font-semibold">
                      1 Voucher Applied ✓
                    </Text>
                  </View>
                )}
              </View>

              {/* Quantity Controls & Delete */}
              <View className="items-end">
                <View className="flex-row items-center mb-2">
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, false)}
                    className="w-6 h-6 rounded-full border border-gray-300 items-center justify-center"
                  >
                    <Text className="text-gray-600 font-bold text-sm">−</Text>
                  </TouchableOpacity>
                  <Text className="mx-3 text-sm font-semibold">{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, true)}
                    className="w-6 h-6 rounded-full bg-orange-400 items-center justify-center"
                  >
                    <Text className="text-white font-bold text-sm">+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text className="text-orange-400 text-lg">🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Vouchers Banner */}
        <View className="mx-5 mb-4">
          <View className="bg-orange-400 rounded-2xl px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Text className="text-white text-base mr-2">🎟️</Text>
              <Text className="text-white font-semibold">You have 6 vouchers Left</Text>
            </View>
            <TouchableOpacity className="bg-white rounded-full px-5 py-2">
              <Text className="text-orange-400 font-semibold text-sm">Applied ✓</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white px-5 py-5 mb-4">
          <Text className="text-xl font-bold text-gray-900 mb-3">Delivery Address</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between"
            onPress={() => navigation.navigate('Address')}
          >
            <Text className="text-base font-semibold text-gray-900">Home</Text>
            <Text className="text-gray-400">▼</Text>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View className="mx-5 mb-6 bg-white rounded-3xl px-6 py-5" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Text className="text-xl font-bold text-gray-900 mb-4">Order Summary</Text>

          {/* Subtotal */}
          <View className="flex-row justify-between mb-3">
            <Text className="text-base text-gray-600">Subtotal:</Text>
            <Text className="text-base text-gray-900">₹{subtotal}.00</Text>
          </View>

          {/* Taxes & Charges */}
          <View className="flex-row justify-between mb-3">
            <Text className="text-base text-gray-600">Taxes & Charges:</Text>
            <Text className="text-base text-gray-900">₹{taxesAndCharges}.00</Text>
          </View>

          {/* Discount */}
          <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-200">
            <Text className="text-base text-gray-600">Discount:</Text>
            <Text className="text-base text-red-500 font-semibold">- ₹{discount}.00</Text>
          </View>

          {/* Total Amount */}
          <View className="flex-row justify-between">
            <Text className="text-lg font-bold text-gray-900">Total Amount:</Text>
            <Text className="text-lg font-bold text-orange-500">₹{totalAmount}.00</Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-32" />
      </ScrollView>

      {/* Bottom Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-orange-400 rounded-t-3xl px-6 py-4 flex-row items-center justify-between"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <View>
          <Text className="text-white text-2xl font-bold">₹{totalAmount}.00</Text>
          <Text className="text-white text-sm opacity-90">Total</Text>
        </View>
        <TouchableOpacity
          className="bg-white rounded-full px-8 py-3 flex-row items-center"
          onPress={() => navigation.navigate('Payment')}
        >
          <Text className="text-orange-400 font-bold text-base mr-2">Pay Now</Text>
          <Text className="text-orange-400 font-bold">→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;
