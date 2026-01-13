// src/screens/orders/OrderDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import apiService, { Order, OrderStatus, KitchenSummary } from '../../services/api.service';
import CancelOrderModal from '../../components/CancelOrderModal';
import RateOrderModal from '../../components/RateOrderModal';

type Props = StackScreenProps<MainTabParamList, 'OrderDetail'>;

// Status color mapping
const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'PLACED':
      return '#3B82F6'; // Blue
    case 'ACCEPTED':
      return '#06B6D4'; // Cyan
    case 'PREPARING':
      return '#EAB308'; // Yellow
    case 'READY':
      return '#F97316'; // Orange
    case 'PICKED_UP':
      return '#8B5CF6'; // Purple
    case 'OUT_FOR_DELIVERY':
      return '#6366F1'; // Indigo
    case 'DELIVERED':
      return '#22C55E'; // Green
    case 'CANCELLED':
    case 'REJECTED':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

// Status text mapping
const getStatusText = (status: OrderStatus): string => {
  switch (status) {
    case 'PLACED':
      return 'Order Placed';
    case 'ACCEPTED':
      return 'Preparing';
    case 'PREPARING':
      return 'Preparing';
    case 'READY':
      return 'Ready for Pickup';
    case 'PICKED_UP':
      return 'Out for Delivery';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
};

// Active statuses
const ACTIVE_STATUSES: OrderStatus[] = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
];

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format time
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Format full datetime
const formatDateTime = (dateString: string): string => {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
};

const OrderDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRating, setIsRating] = useState(false);

  // Fetch order details
  const fetchOrder = async () => {
    try {
      setError(null);
      console.log('[OrderDetailScreen] Fetching order:', orderId);
      const response = await apiService.getOrder(orderId);
      console.log('[OrderDetailScreen] Response:', JSON.stringify(response, null, 2));

      // API response format (unusual):
      // { message: true, data: "Order retrieved", error: { order: {...}, kitchen: {...} } }
      // The actual order is in error.order when message=true
      const resp = response as any;
      let orderData: any = null;

      // Check if order is in error.order (weird API format where error contains success data)
      if (resp?.error?.order?._id) {
        orderData = resp.error.order;
      }
      // Check if response.data is the order (has _id)
      else if (resp?.data?._id) {
        orderData = resp.data;
      }
      // Check if response itself is the order
      else if (resp?._id) {
        orderData = resp;
      }

      if (orderData && orderData._id) {
        console.log('[OrderDetailScreen] Order fetched successfully:', orderData.orderNumber);
        setOrder(orderData);
      } else {
        const errorMsg = typeof resp?.data === 'string' && resp.message !== true
          ? resp.data
          : 'Failed to load order details';
        console.log('[OrderDetailScreen] Failed to fetch order:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('[OrderDetailScreen] Error fetching order:', err.message || err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and focus
  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [orderId])
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  }, [orderId]);

  // Handle cancel order
  const handleCancelOrder = async (reason: string) => {
    try {
      setIsCancelling(true);
      console.log('[OrderDetailScreen] Cancelling order:', orderId);
      const response = await apiService.cancelOrder(orderId, reason);
      console.log('[OrderDetailScreen] Cancel response:', JSON.stringify(response, null, 2));

      // Handle API response format: {message: true/false, data: string, error?: object}
      // or standard format: {success: boolean, message: string, data?: object}
      const isSuccess = response.success === true || (response as any).message === true;
      const responseData = (response as any).error || response.data;

      if (isSuccess) {
        console.log('[OrderDetailScreen] Order cancelled successfully');
        setShowCancelModal(false);

        const successMessage = responseData?.message ||
          (typeof response.data === 'string' ? response.data : null) ||
          `Order cancelled.${responseData?.vouchersRestored ? ` ${responseData.vouchersRestored} voucher(s) restored.` : ''}`;

        Alert.alert('Order Cancelled', successMessage, [
          { text: 'OK', onPress: () => fetchOrder() },
        ]);
      } else {
        // Error message is in response.data when message is false
        const errorMessage = typeof response.data === 'string'
          ? response.data
          : (response.message && typeof response.message === 'string' ? response.message : 'Failed to cancel order');
        console.log('[OrderDetailScreen] Cancel failed:', errorMessage);
        Alert.alert('Cannot Cancel Order', errorMessage);
      }
    } catch (err: any) {
      console.error('[OrderDetailScreen] Cancel error:', err.message || err);
      Alert.alert('Error', err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle rate order
  const handleRateOrder = async (stars: number, comment?: string) => {
    try {
      setIsRating(true);
      console.log('[OrderDetailScreen] Rating order:', orderId, 'Stars:', stars);
      const response = await apiService.rateOrder(orderId, stars, comment);
      console.log('[OrderDetailScreen] Rating response:', JSON.stringify(response, null, 2));

      // Handle API response format: {message: true/false, data: string, error?: object}
      const isSuccess = response.success === true || (response as any).message === true;

      if (isSuccess) {
        console.log('[OrderDetailScreen] Order rated successfully');
        setShowRateModal(false);
        Alert.alert('Thank You!', 'Your feedback helps us improve.', [
          { text: 'OK', onPress: () => fetchOrder() },
        ]);
      } else {
        const errorMessage = typeof response.data === 'string'
          ? response.data
          : (response.message && typeof response.message === 'string' ? response.message : 'Failed to submit rating');
        console.log('[OrderDetailScreen] Rating failed:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (err: any) {
      console.error('[OrderDetailScreen] Rating error:', err.message || err);
      Alert.alert('Error', err.message || 'Failed to submit rating');
    } finally {
      setIsRating(false);
    }
  };

  // Handle track order
  const handleTrackOrder = () => {
    navigation.navigate('OrderTracking', { orderId });
  };

  // Handle call kitchen
  const handleCallKitchen = () => {
    const kitchen = order?.kitchenId as KitchenSummary;
    if (kitchen?.phone) {
      Linking.openURL(`tel:${kitchen.phone}`);
    } else {
      Alert.alert('Not Available', 'Kitchen contact is not available');
    }
  };

  // Get kitchen info
  const getKitchenInfo = (): KitchenSummary | null => {
    if (!order) return null;
    if (typeof order.kitchenId === 'object') {
      return order.kitchenId;
    }
    return null;
  };

  // Check if order is active
  const isActiveOrder = order && ACTIVE_STATUSES.includes(order.status);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#F56B4C" />
        <Text className="text-base text-gray-500 mt-4">Loading order details...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-5">
        <Text className="text-base text-gray-500 mb-4 text-center">
          {error || 'Order not found'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            fetchOrder();
          }}
          className="rounded-full px-6 py-3 mb-4"
          style={{ backgroundColor: '#F56B4C' }}
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-gray-500">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const kitchen = getKitchenInfo();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center border-b border-gray-100">
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
          Order Details
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F56B4C']}
          />
        }
      >
        {/* Order Header */}
        <View className="bg-white px-5 py-4 mb-2">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold text-gray-900">
              #{order.orderNumber}
            </Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${getStatusColor(order.status)}20` }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: getStatusColor(order.status) }}
              >
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-gray-500">
            Placed on {formatDateTime(order.placedAt)}
          </Text>

          {/* Rating Display */}
          {order.rating && (
            <View className="flex-row items-center mt-3">
              <Text className="text-sm text-gray-600 mr-2">Your Rating:</Text>
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Image
                    key={star}
                    source={require('../../assets/icons/star.png')}
                    style={{
                      width: 16,
                      height: 16,
                      tintColor: star <= order.rating!.stars ? '#F59E0B' : '#D1D5DB',
                      marginRight: 2,
                    }}
                    resizeMode="contain"
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Kitchen Info */}
        {kitchen && (
          <View className="bg-white px-5 py-4 mb-2">
            <Text className="text-lg font-bold text-gray-900 mb-3">Kitchen</Text>
            <View className="flex-row items-center">
              <Image
                source={
                  kitchen.logo
                    ? { uri: kitchen.logo }
                    : require('../../assets/images/homepage/lunchThali.png')
                }
                style={{ width: 50, height: 50, borderRadius: 25 }}
                resizeMode="cover"
              />
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-gray-900">
                  {kitchen.name}
                </Text>
                {kitchen.phone && (
                  <TouchableOpacity onPress={handleCallKitchen}>
                    <Text className="text-sm" style={{ color: '#F56B4C' }}>
                      Tap to call
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Items Section */}
        <View className="bg-white px-5 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-900 mb-3">Items</Text>

          {order.items.map((item, index) => (
            <View key={index} className="mb-3">
              <View className="flex-row justify-between">
                <View className="flex-row items-center flex-1">
                  <Text className="text-sm text-gray-900">{item.name}</Text>
                  <Text className="text-sm text-gray-500 ml-2">x{item.quantity}</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">
                  ₹{item.totalPrice.toFixed(2)}
                </Text>
              </View>

              {/* Addons */}
              {item.addons?.map((addon, addonIndex) => (
                <View key={addonIndex} className="flex-row justify-between ml-4 mt-1">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-sm text-gray-600">+ {addon.name}</Text>
                    <Text className="text-sm text-gray-500 ml-2">x{addon.quantity}</Text>
                  </View>
                  <Text className="text-sm text-gray-600">
                    ₹{addon.totalPrice.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          {/* Special Instructions */}
          {order.specialInstructions && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Special Instructions
              </Text>
              <Text className="text-sm text-gray-600">{order.specialInstructions}</Text>
            </View>
          )}
        </View>

        {/* Pricing Breakdown */}
        <View className="bg-white px-5 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-900 mb-3">Payment Details</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm text-gray-900">₹{order.subtotal.toFixed(2)}</Text>
          </View>

          {order.charges.deliveryFee > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Delivery Fee</Text>
              <Text className="text-sm text-gray-900">₹{order.charges.deliveryFee.toFixed(2)}</Text>
            </View>
          )}

          {order.charges.serviceFee > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Service Fee</Text>
              <Text className="text-sm text-gray-900">₹{order.charges.serviceFee.toFixed(2)}</Text>
            </View>
          )}

          {order.charges.packagingFee > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Packaging Fee</Text>
              <Text className="text-sm text-gray-900">₹{order.charges.packagingFee.toFixed(2)}</Text>
            </View>
          )}

          {order.charges.taxAmount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Tax</Text>
              <Text className="text-sm text-gray-900">₹{order.charges.taxAmount.toFixed(2)}</Text>
            </View>
          )}

          {/* Voucher Coverage */}
          {order.voucherUsage && order.voucherUsage.voucherCount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-green-600">
                Voucher ({order.voucherUsage.voucherCount} used)
              </Text>
              <Text className="text-sm text-green-600">
                - ₹{(order.voucherUsage.mainCoursesCovered * (order.items[0]?.unitPrice || 0)).toFixed(2)}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between pt-3 mt-2 border-t border-gray-200">
            <Text className="text-base font-bold text-gray-900">Grand Total</Text>
            <Text className="text-base font-bold text-gray-900">₹{order.grandTotal.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between mt-2">
            <Text className="text-sm text-gray-600">Amount Paid</Text>
            <Text className="text-sm font-semibold" style={{ color: '#F56B4C' }}>
              ₹{order.amountPaid.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white px-5 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-900 mb-3">Delivery Address</Text>

          <Text className="text-sm font-semibold text-gray-900">
            {order.deliveryAddress.contactName}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {order.deliveryAddress.addressLine1}
            {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
          </Text>
          <Text className="text-sm text-gray-600">
            {order.deliveryAddress.locality}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
          </Text>
          {order.deliveryAddress.landmark && (
            <Text className="text-sm text-gray-500 mt-1">
              Landmark: {order.deliveryAddress.landmark}
            </Text>
          )}
          <Text className="text-sm text-gray-600 mt-2">
            Phone: {order.deliveryAddress.contactPhone}
          </Text>

          {order.deliveryNotes && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <Text className="text-sm font-semibold text-gray-700 mb-1">
                Delivery Notes
              </Text>
              <Text className="text-sm text-gray-600">{order.deliveryNotes}</Text>
            </View>
          )}
        </View>

        {/* Cancellation Info */}
        {order.status === 'CANCELLED' && order.cancellationReason && (
          <View className="bg-red-50 mx-5 rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-red-700 mb-1">
              Cancellation Reason
            </Text>
            <Text className="text-sm text-red-600">{order.cancellationReason}</Text>
            {order.cancelledAt && (
              <Text className="text-xs text-red-500 mt-2">
                Cancelled on {formatDateTime(order.cancelledAt)}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="px-5 py-4 mb-8">
          {/* Track Order - for active orders */}
          {isActiveOrder && (
            <TouchableOpacity
              onPress={handleTrackOrder}
              className="rounded-full py-4 items-center mb-3"
              style={{ backgroundColor: '#F56B4C' }}
            >
              <Text className="text-white font-bold text-base">Track Order</Text>
            </TouchableOpacity>
          )}

          {/* Cancel Order - if canCancel is true */}
          {order.canCancel && (
            <TouchableOpacity
              onPress={() => setShowCancelModal(true)}
              className="rounded-full py-4 items-center mb-3"
              style={{ borderWidth: 2, borderColor: '#EF4444' }}
            >
              <Text className="font-bold text-base" style={{ color: '#EF4444' }}>
                Cancel Order
              </Text>
            </TouchableOpacity>
          )}

          {/* Rate Order - if canRate is true */}
          {order.canRate && !order.rating && (
            <TouchableOpacity
              onPress={() => setShowRateModal(true)}
              className="rounded-full py-4 items-center mb-3"
              style={{ backgroundColor: '#F59E0B' }}
            >
              <Text className="text-white font-bold text-base">Rate Order</Text>
            </TouchableOpacity>
          )}

          {/* Reorder - for delivered orders */}
          {order.status === 'DELIVERED' && (
            <TouchableOpacity
              onPress={() => Alert.alert('Coming Soon', 'Reorder functionality will be available soon!')}
              className="rounded-full py-4 items-center flex-row justify-center"
              style={{ backgroundColor: '#FFF5F2' }}
            >
              <Image
                source={require('../../assets/icons/reorder2.png')}
                style={{ width: 20, height: 20, tintColor: '#F56B4C', marginRight: 8 }}
                resizeMode="contain"
              />
              <Text className="font-bold text-base" style={{ color: '#F56B4C' }}>
                Reorder
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        orderNumber={order.orderNumber}
        isLoading={isCancelling}
        voucherCount={order.voucherUsage?.voucherCount ?? 0}
        amountPaid={order.amountPaid}
        mealWindow={order.mealWindow}
      />

      {/* Rate Order Modal */}
      <RateOrderModal
        visible={showRateModal}
        onClose={() => setShowRateModal(false)}
        onSubmit={handleRateOrder}
        orderNumber={order.orderNumber}
        isLoading={isRating}
      />
    </SafeAreaView>
  );
};

export default OrderDetailScreen;
