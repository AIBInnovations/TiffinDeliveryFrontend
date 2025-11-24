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
import { useAddress } from '../../context/AddressContext';
import OrderSuccessModal from '../../components/OrderSuccessModal';

type Props = StackScreenProps<MainTabParamList, 'Cart'>;

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const { cartItems, updateQuantity: updateCartQuantity, removeItem } = useCart();
  const { addresses, getMainAddress } = useAddress();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    getMainAddress()?.id || (addresses.length > 0 ? addresses[0].id : '')
  );

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
            <Image
              source={require('../../assets/icons/arrow.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
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
                    <Image
                      source={require('../../assets/icons/voucher.png')}
                      style={{ width: 14, height: 14, tintColor: '#16A34A', marginRight: 4 }}
                      resizeMode="contain"
                    />
                    <Text className="text-xs text-green-600 font-semibold">
                      1 Voucher Applied ✓
                    </Text>
                  </View>
                )}
              </View>

              {/* Quantity Controls & Delete */}
              <View className="items-end">
                <View
                  className="flex-row items-center mb-2"
                  style={{ borderWidth: 1, borderColor: 'rgba(232, 235, 234, 1)', borderRadius: 60, paddingHorizontal: 8, paddingVertical: 4 }}
                >
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, false)}
                    className="w-6 h-6 rounded-full items-center justify-center"
                  >
                    <Text className="text-gray-600 font-bold text-sm">−</Text>
                  </TouchableOpacity>
                  <Text className="mx-3 text-sm font-semibold">{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, true)}
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 217, 197, 1)' }}
                  >
                    <Image
                      source={require('../../assets/icons/plus.png')}
                      style={{ width: 23, height: 23 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Image
                    source={require('../../assets/icons/delete2.png')}
                    style={{ width: 20, height: 20, }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Vouchers Banner */}
        <View className="mx-5 mb-4">
          <View
            className="bg-orange-400 rounded-full pl-6 pr-2 flex-row items-center justify-between"
            style={{
              height: 60,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center flex-1">
              <Image
                source={require('../../assets/icons/whitevoucher.png')}
                style={{ width: 20, height: 20, tintColor: 'white', marginRight: 8 }}
                resizeMode="contain"
              />
              <Text className="text-white font-semibold" style={{ fontSize: 14 }}>You have 6 vouchers Left</Text>
            </View>
            <TouchableOpacity
              className="bg-white rounded-full px-5 items-center justify-center flex-row"
              style={{ height: 46, width: 95 }}
            >
              <Text className="text-orange-400 font-semibold text-sm">Applied</Text>
              <Image
                source={require('../../assets/icons/tick3.png')}
                style={{ width: 14, height: 14, marginLeft: 6 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white px-5 py-5 mb-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">Delivery Address</Text>

          {addresses.map((address, index) => (
            <TouchableOpacity
              key={address.id}
              className={`flex-row items-center mb-3 ${index < addresses.length - 1 ? 'pb-3 border-b border-gray-100' : ''}`}
              onPress={() => setSelectedAddressId(address.id)}
            >
              {/* Icon */}
              <View className="w-12 h-12  items-center justify-center mr-3">
                <Image
                  source={
                    address.label.toLowerCase() === 'home'
                      ? require('../../assets/icons/house2.png')
                      : require('../../assets/icons/office.png')
                  }
                  style={{ width: 38, height: 38, }}
                  resizeMode="contain"
                />
              </View>

              {/* Address Details */}
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">{address.label}</Text>
                <Text className="text-sm text-gray-500">{address.address}</Text>
              </View>

              {/* Radio Button */}
              <View className={`w-5 h-5 rounded-full border-2 ${selectedAddressId === address.id ? 'border-orange-400' : 'border-gray-300'} items-center justify-center`}>
                {selectedAddressId === address.id && (
                  <View className="w-3 h-3 rounded-full bg-orange-400" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Add New Address Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center mt-2"
            onPress={() => navigation.navigate('Address')}
          >
            <Text className="text-orange-400 font-semibold text-sm">+ Add New Address</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View className="h-80" />
      </ScrollView>

      {/* Order Summary - Sticky */}
      <View
        className="absolute left-0 right-0 bg-white px-4 py-5"
        style={{
          bottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
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
        <View className="flex-row justify-between mb-5">
          <Text className="text-lg font-bold text-gray-900">Total Amount:</Text>
          <Text className="text-lg font-bold text-orange-500">₹{totalAmount}.00</Text>
        </View>

        {/* Pay Now Button */}
        <View
          className="bg-orange-400 rounded-full pl-6 pr-2 flex-row items-center justify-between"
          style={{
            height: 60,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center">
            <Text className="text-white text-xl font-bold mr-2">₹{totalAmount}.00</Text>
            <Text className="text-white text-sm">Total</Text>
          </View>
          <TouchableOpacity
            className="bg-white rounded-full px-6 flex-row items-center"
            style={{ height: 48, width: 117 }}
            onPress={() => setShowSuccessModal(true)}
          >
            <Text className="text-orange-400 font-semibold text-base mr-2">Pay Now</Text>
            <Image
              source={require('../../assets/icons/uparrow.png')}
              style={{ width: 13, height: 13, }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Order Success Modal */}
      <OrderSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onGoHome={() => {
          setShowSuccessModal(false);
          navigation.navigate('Home');
        }}
        onTrackOrder={() => {
          setShowSuccessModal(false);
          navigation.navigate('OrderTracking');
        }}
      />
    </SafeAreaView>
  );
};

export default CartScreen;
