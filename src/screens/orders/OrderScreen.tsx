// src/screens/orders/OrderScreen.tsx
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

type Props = StackScreenProps<MainTabParamList, 'Orders'>;

interface Order {
  id: string;
  orderNumber: string;
  name: string;
  price: number;
  quantity: string;
  image: any;
  estimatedTime: string;
  status: string;
  date?: string;
  rating?: number;
}

const OrderScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Current' | 'History'>('Current');
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'orders' | 'meals' | 'vouchers'>('orders');

  // Sample orders data
  const currentOrders: Order[] = [
    {
      id: '1',
      orderNumber: '#837',
      name: 'Lunch Thali',
      price: 70.00,
      quantity: '1 Thali',
      image: require('../../assets/images/homepage/lunchThali.png'),
      estimatedTime: '15 Mins',
      status: 'Meal is being prepared',
    },
    {
      id: '2',
      orderNumber: '#837',
      name: 'Lunch Thali',
      price: 70.00,
      quantity: '1 Thali',
      image: require('../../assets/images/homepage/lunchThali.png'),
      estimatedTime: '15 Mins',
      status: 'Meal is being prepared',
    },
  ];

  const historyOrders: Order[] = [
    {
      id: '1',
      orderNumber: '#837',
      name: 'Lunch Thali',
      price: 70.00,
      quantity: '1 Thali',
      image: require('../../assets/images/homepage/lunchThali.png'),
      estimatedTime: '',
      status: '',
      date: '13 Nov, 2025',
      rating: 4,
    },
    {
      id: '2',
      orderNumber: '#837',
      name: 'Dinner Thali',
      price: 90.00,
      quantity: '1 Thali',
      image: require('../../assets/images/homepage/dinnerThali.png'),
      estimatedTime: '',
      status: '',
      date: '09 Nov, 2025',
      rating: 4,
    },
    {
      id: '3',
      orderNumber: '#837',
      name: 'Lunch Thali',
      price: 70.00,
      quantity: '1 Thali',
      image: require('../../assets/images/homepage/lunchThali.png'),
      estimatedTime: '',
      status: '',
      date: '10 Nov, 2025',
      rating: 4,
    },
    {
      id: '4',
      orderNumber: '#837',
      name: 'Dinner Thali',
      price: 90.00,
      quantity: '1 Thali',
      image: require('../../assets/images/homepage/dinnerThali.png'),
      estimatedTime: '',
      status: '',
      date: '09 Nov, 2025',
      rating: 4,
    },
  ];

  const handleCancel = (orderId: string) => {
    console.log('Cancel order:', orderId);
  };

  const handleTrackOrder = (orderId: string) => {
    console.log('Track order:', orderId);
    navigation.navigate('OrderTracking');
  };

  const handleReorder = (orderId: string) => {
    console.log('Re-order:', orderId);
    // Navigate to cart or add to cart
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="rgba(245, 107, 76, 1)t" />

      {/* Header and Tabs Container */}
      <View style={{ backgroundColor: 'rgba(245, 107, 76, 1)', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, position: 'relative', overflow: 'hidden' }}>
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

        {/* Header */}
        <View className="px-5 py-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full  items-center justify-center"
            style={{ marginLeft: 8 }}
          >
            <Image
              source={require('../../assets/icons/Tiffsy.png')}
              style={{ width: 58, height: 58 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text className="flex-1 text-center text-xl font-bold text-white">
            Your Orders
          </Text>

          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Image
              source={require('../../assets/images/myaccount/user.png')}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row bg-gray-100 rounded-full p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('Current')}
            className={`py-3 rounded-full ${
              activeTab === 'Current' ? 'bg-white' : 'bg-transparent'
            }`}
            style={{
              width: 150,
              shadowColor: activeTab === 'Current' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === 'Current' ? 0.1 : 0,
              shadowRadius: 2,
              elevation: activeTab === 'Current' ? 2 : 0,
            }}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'Current' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Current
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('History')}
            className={`flex-1 py-3 rounded-full ${
              activeTab === 'History' ? 'bg-white' : 'bg-transparent'
            }`}
            style={{
              shadowColor: activeTab === 'History' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === 'History' ? 0.1 : 0,
              shadowRadius: 2,
              elevation: activeTab === 'History' ? 2 : 0,
            }}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'History' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>

      {/* Orders List */}
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {activeTab === 'Current' ? (
          // Current Orders Layout
          <>
            {currentOrders.map((order) => (
              <View
                key={order.id}
                className="bg-white rounded-3xl p-4 mb-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {/* Order Header */}
                <View className="flex-row items-center mb-3">
                  <Image
                    source={order.image}
                    style={{ width: 64, height: 64, borderRadius: 12 }}
                    resizeMode="cover"
                  />

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-lg font-bold text-gray-900">{order.name}</Text>
                      <Text className="text-base font-bold text-gray-900">{order.orderNumber}</Text>
                    </View>
                    <Text className="text-sm">
                      <Text style={{ color: 'rgba(0, 0, 0, 1)' }}>₹{order.price.toFixed(2)} </Text>
                      <Text style={{ color: 'rgba(145, 145, 145, 1)' }}>| {order.quantity}</Text>
                    </Text>
                  </View>
                </View>

                {/* Status Section */}
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">Estimated Time</Text>
                    <Text className="text-sm font-semibold text-gray-900">{order.estimatedTime}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-500 mb-1">Now</Text>
                    <Text className="text-sm font-semibold text-gray-900">{order.status}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row justify-center">
                  <TouchableOpacity
                    onPress={() => handleCancel(order.id)}
                    className="py-3 rounded-full border-2 border-orange-400 items-center"
                    style={{ width: 135, marginRight: 12 }}
                  >
                    <Text className="text-base font-semibold text-orange-400">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleTrackOrder(order.id)}
                    className="py-3 rounded-full bg-orange-400 items-center"
                    style={{ width: 135 }}
                  >
                    <Text className="text-base font-semibold text-white">Track Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {currentOrders.length === 0 && (
              <View className="items-center justify-center py-20">
                <Text className="text-base text-gray-500">No current orders</Text>
              </View>
            )}
          </>
        ) : (
          // History Orders Layout
          <>
            {historyOrders.map((order) => (
              <View
                key={order.id}
                className="bg-white rounded-2xl p-4 mb-3"
                style={{
                  height: 160,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                  justifyContent: 'space-between',
                }}
              >
                {/* Order Info */}
                <View className="flex-row">
                  <Image
                    source={order.image}
                    style={{ width: 56, height: 56, borderRadius: 12 }}
                    resizeMode="cover"
                  />

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-base font-bold text-gray-900">{order.name}</Text>
                      <Text className="text-base font-bold text-gray-900">₹{order.price.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm" style={{ color: 'rgba(145, 145, 145, 1)' }}>Order ID - {order.orderNumber}</Text>
                      <Text className="text-sm" style={{ color: 'rgba(145, 145, 145, 1)' }}>{order.date}</Text>
                    </View>
                  </View>
                </View>

                {/* Divider Line */}
                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginTop: 16, marginBottom: 6, marginHorizontal: -16 }} />

                {/* Re-order and Rating */}
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => handleReorder(order.id)}
                    className="bg-orange-400 rounded-full px-6 py-2 flex-row items-center"
                  >
                    <Image
                      source={require('../../assets/icons/reorder.png')}
                      style={{ width: 16, height: 16, tintColor: 'white', marginRight: 6 }}
                      resizeMode="contain"
                    />
                    <Text className="text-white font-semibold text-sm">Re-order</Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    <Text className="text-sm font-medium text-gray-900 mr-2">Rate:</Text>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text
                        key={star}
                        style={{
                          fontSize: 20,
                          color: star <= (order.rating || 0) ? '#FB923C' : '#D1D5DB',
                          marginHorizontal: 2,
                        }}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ))}

            {historyOrders.length === 0 && (
              <View className="items-center justify-center py-20">
                <Text className="text-base text-gray-500">No order history</Text>
              </View>
            )}

            {/* View All Orders Button */}
            {historyOrders.length > 0 && (
              <TouchableOpacity className="items-center py-4 mb-6 flex-row justify-center">
                <Image
                  source={require('../../assets/icons/down.png')}
                  style={{ width: 16, height: 16, tintColor: '#FB923C', marginRight: 6 }}
                  resizeMode="contain"
                />
                <Text className="text-orange-400 font-semibold text-base">View All Orders</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 20,
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
            setActiveNavTab('home');
            navigation.navigate('Home');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeNavTab === 'home' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeNavTab === 'home' ? 16 : 8,
            marginLeft: -8,
            marginRight: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/house.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeNavTab === 'home' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeNavTab === 'home' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeNavTab === 'home' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Home
            </Text>
          )}
        </TouchableOpacity>

        {/* Orders Section */}
        <TouchableOpacity
          onPress={() => {
            setActiveNavTab('orders');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeNavTab === 'orders' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeNavTab === 'orders' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/proicons_cart.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeNavTab === 'orders' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeNavTab === 'orders' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeNavTab === 'orders' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Orders
            </Text>
          )}
        </TouchableOpacity>

        {/* Meals Icon */}
        <TouchableOpacity
          onPress={() => setActiveNavTab('meals')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeNavTab === 'meals' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeNavTab === 'meals' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/spoons.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeNavTab === 'meals' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeNavTab === 'meals' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeNavTab === 'meals' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Meals
            </Text>
          )}
        </TouchableOpacity>

        {/* Voucher Button */}
        <TouchableOpacity
          onPress={() => setActiveNavTab('vouchers')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: '#F56B4C',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginLeft: 12,
            marginRight: activeNavTab !== 'vouchers' ? 12 : 0,
          }}
        >
          <Image
            source={require('../../assets/icons/voucher2.png')}
            style={{ width: 20, height: 20, tintColor: 'white', marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
            12
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OrderScreen;
