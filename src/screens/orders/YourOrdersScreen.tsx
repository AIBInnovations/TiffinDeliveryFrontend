// src/screens/orders/YourOrdersScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import orderApi, { Order as ApiOrder, OrderStatus } from '../../services/orderApi';
import voucherApi from '../../services/voucherApi';

type Props = StackScreenProps<MainTabParamList, 'YourOrders'>;

interface DisplayOrder {
  id: string;
  orderNumber: string;
  name: string;
  price: number;
  quantity: string;
  image: any;
  estimatedTime: string;
  status: string;
  currentStatus: OrderStatus;
  date?: string;
  rating?: number;
  mealType: 'LUNCH' | 'DINNER';
}

// Helper to get status display text
const getStatusText = (status: OrderStatus): string => {
  switch (status) {
    case 'placed':
      return 'Order placed';
    case 'accepted':
      return 'Order accepted';
    case 'preparing':
      return 'Meal is being prepared';
    case 'out_for_delivery':
      return 'Out for delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Processing';
  }
};

// Helper to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

// Current order statuses (not completed)
const CURRENT_STATUSES: OrderStatus[] = ['placed', 'accepted', 'preparing', 'out_for_delivery'];
// History order statuses (completed)
const HISTORY_STATUSES: OrderStatus[] = ['delivered', 'cancelled'];

const YourOrdersScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Current' | 'History'>('Current');
  const [navActiveTab, setNavActiveTab] = useState<'home' | 'orders' | 'meals' | 'profile'>('orders');

  // Orders state
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Voucher state
  const [voucherCount, setVoucherCount] = useState<number>(0);
  const [voucherLoading, setVoucherLoading] = useState<boolean>(true);

  // Transform API order to display order
  const transformOrder = (apiOrder: ApiOrder): DisplayOrder => {
    const isLunch = apiOrder.mealType === 'LUNCH';
    return {
      id: apiOrder._id,
      orderNumber: `#${apiOrder._id.slice(-3).toUpperCase()}`,
      name: apiOrder.menuItem?.menuItemId?.name || (isLunch ? 'Lunch Thali' : 'Dinner Thali'),
      price: apiOrder.menuItem?.orderPlacedPrice || apiOrder.totalAmount || 0,
      quantity: '1 Thali',
      image: isLunch
        ? require('../../assets/images/homepage/lunchThali.png')
        : require('../../assets/images/homepage/dinnerThali.png'),
      estimatedTime: '15 Mins',
      status: getStatusText(apiOrder.currentStatus),
      currentStatus: apiOrder.currentStatus,
      date: formatDate(apiOrder.orderStatus?.placedAt || apiOrder.scheduledForDate),
      rating: 4,
      mealType: apiOrder.mealType,
    };
  };

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await orderApi.getMyOrders({ sortBy: 'createdAt', sortOrder: 'desc' });
      if (response.success && response.data?.orders) {
        const transformedOrders = response.data.orders.map(transformOrder);
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
    } catch (error: any) {
      console.log('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch voucher summary from API
  const fetchVoucherSummary = useCallback(async () => {
    try {
      setVoucherLoading(true);
      const response = await voucherApi.getVoucherSummary();
      if (response.success && response.data) {
        setVoucherCount(response.data.availableVouchers);
      }
    } catch (error: any) {
      console.log('Error fetching voucher summary:', error);
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  // Fetch orders and vouchers when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      fetchVoucherSummary();
    }, [fetchOrders, fetchVoucherSummary])
  );

  // Filter orders based on active tab
  const currentOrders = orders.filter(order => CURRENT_STATUSES.includes(order.currentStatus));
  const historyOrders = orders.filter(order => HISTORY_STATUSES.includes(order.currentStatus));

  const handleCancel = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await orderApi.cancelOrder(orderId);
              if (response.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                fetchOrders(); // Refresh orders
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel order');
              }
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to cancel order. Orders can only be cancelled before acceptance.');
            }
          },
        },
      ]
    );
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
    <SafeAreaView className="flex-1 bg-orange-400">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />

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
            style={{ marginLeft: 8, marginRight: 20 }}
          >
            <Image
              source={require('../../assets/icons/Tiffsy.png')}
              style={{ width: 58, height: 58 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Location */}
          <TouchableOpacity
            className="flex-1 items-center"
            onPress={() => navigation.navigate('Address')}
          >
            <Text className="text-white text-xs opacity-90">Location</Text>
            <View className="flex-row items-center">
              <Image
                source={require('../../assets/icons/address3.png')}
                style={{ width: 14, height: 14, tintColor: 'white' }}
                resizeMode="contain"
              />
              <Text className="text-white text-sm font-semibold ml-1">
                Vijay Nagar, Indore
              </Text>
              <Image
                source={require('../../assets/icons/down2.png')}
                style={{ width: 12, height: 12, marginLeft: 4, tintColor: 'white' }}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          {/* Voucher Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('MealPlans')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 10,
              gap: 6,
            }}
          >
            <Image
              source={require('../../assets/icons/voucher5.png')}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
            {voucherLoading ? (
              <ActivityIndicator size="small" color="#F56B4C" />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#F56B4C' }}>{voucherCount}</Text>
            )}
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
      <ScrollView className="flex-1 bg-white px-5 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#F56B4C" />
            <Text className="text-gray-500 mt-4">Loading orders...</Text>
          </View>
        ) : activeTab === 'Current' ? (
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

        {/* Bottom Spacing for Navigation Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* White background for bottom safe area */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'white' }} />

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
            setNavActiveTab('home');
            navigation.navigate('Home');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: navActiveTab === 'home' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: navActiveTab === 'home' ? 16 : 8,
            marginLeft: -8,
            marginRight: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/house.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: navActiveTab === 'home' ? '#F56B4C' : '#9CA3AF',
              marginRight: navActiveTab === 'home' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {navActiveTab === 'home' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Home
            </Text>
          )}
        </TouchableOpacity>

        {/* Orders Section */}
        <TouchableOpacity
          onPress={() => setNavActiveTab('orders')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: navActiveTab === 'orders' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: navActiveTab === 'orders' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/cart3.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: navActiveTab === 'orders' ? '#F56B4C' : '#9CA3AF',
              marginRight: navActiveTab === 'orders' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {navActiveTab === 'orders' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Orders
            </Text>
          )}
        </TouchableOpacity>

        {/* Meals Icon */}
        <TouchableOpacity
          onPress={() => setNavActiveTab('meals')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: navActiveTab === 'meals' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: navActiveTab === 'meals' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/kitchen.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: navActiveTab === 'meals' ? '#F56B4C' : '#9CA3AF',
              marginRight: navActiveTab === 'meals' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {navActiveTab === 'meals' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Meals
            </Text>
          )}
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => {
            setNavActiveTab('profile');
            navigation.navigate('Account');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: navActiveTab === 'profile' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: navActiveTab === 'profile' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/profile2.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: navActiveTab === 'profile' ? '#F56B4C' : '#9CA3AF',
              marginRight: navActiveTab === 'profile' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {navActiveTab === 'profile' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Profile
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default YourOrdersScreen;
