// src/screens/orders/YourOrdersScreen.tsx
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

type Props = StackScreenProps<MainTabParamList, 'YourOrders'>;

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

const YourOrdersScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Current' | 'History'>('Current');

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
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center">
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

        <Text className="flex-1 text-center text-xl font-bold text-gray-900 mr-10">
          Your Orders
        </Text>
      </View>

      {/* Tabs */}
      <View className="px-5 pt-4 pb-2 bg-white">
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
                    className="py-2 rounded-full items-center"
                    style={{ width: 135, marginRight: 12, borderWidth: 2, borderColor: 'rgba(245, 107, 76, 1)' }}
                  >
                    <Text className="text-base font-semibold" style={{ color: 'rgba(245, 107, 76, 1)' }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleTrackOrder(order.id)}
                    className="py-2 rounded-full items-center"
                    style={{ width: 135, backgroundColor: 'rgba(245, 107, 76, 1)' }}
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
                    className="rounded-full px-6 py-2 flex-row items-center"
                    style={{ backgroundColor: 'rgba(245, 107, 76, 1)' }}
                  >
                    <Image
                      source={require('../../assets/icons/reorder2.png')}
                      style={{ width: 16, height: 16, tintColor: 'white', marginRight: 6 }}
                      resizeMode="contain"
                    />
                    <Text className="text-white font-semibold text-sm">Re-order</Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    <Text className="text-sm font-medium text-gray-900 mr-2">Rate:</Text>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Image
                        key={star}
                        source={require('../../assets/icons/star.png')}
                        style={{
                          width: 16,
                          height: 16,
                          tintColor: star <= (order.rating || 0) ? 'rgba(245, 107, 76, 1)' : '#D1D5DB',
                          marginHorizontal: 4,
                        }}
                        resizeMode="contain"
                      />
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
                  source={require('../../assets/icons/down2.png')}
                  style={{ width: 16, height: 16, tintColor: 'rgba(245, 107, 76, 1)', marginRight: 6 }}
                  resizeMode="contain"
                />
                <Text className="font-semibold text-base" style={{ color: 'rgba(245, 107, 76, 1)' }}>View All Orders</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default YourOrdersScreen;
