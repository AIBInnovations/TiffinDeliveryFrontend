// src/screens/orders/YourOrdersScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAlert } from '../../context/AlertContext';
import apiService, { Order, OrderStatus } from '../../services/api.service';
import dataPreloader from '../../services/dataPreloader.service';
import CancelOrderModal from '../../components/CancelOrderModal';
import { getMealCutoffTime } from '../../utils/timeUtils';

type Props = StackScreenProps<MainTabParamList, 'YourOrders'>;

// Current order statuses (orders still in progress)
const CURRENT_STATUSES: OrderStatus[] = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
];

// History order statuses (completed or cancelled)
const HISTORY_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'REJECTED'];

// Map order status to user-friendly message
const getStatusMessage = (status: OrderStatus): string => {
  switch (status) {
    case 'PLACED':
      return 'Order placed';
    case 'ACCEPTED':
      return 'Order accepted';
    case 'PREPARING':
      return 'Meal is being prepared';
    case 'READY':
      return 'Ready for pickup';
    case 'PICKED_UP':
      return 'Picked up by driver';
    case 'OUT_FOR_DELIVERY':
      return 'Out for delivery';
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

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Get item image based on menu type and meal window
const getOrderImage = (order: Order) => {
  if (order.menuType === 'MEAL_MENU') {
    if (order.mealWindow === 'DINNER') {
      return require('../../assets/images/homepage/dinnerThali.png');
    }
    return require('../../assets/images/homepage/lunchThali.png');
  }
  return require('../../assets/images/homepage/lunchThali.png');
};

// Get order title
const getOrderTitle = (order: Order): string => {
  if (order.items.length === 1) {
    return order.items[0].name;
  }
  if (order.menuType === 'MEAL_MENU' && order.items.length > 0) {
    // Use the actual meal name from the order instead of fallback
    return order.items[0].name;
  }
  return `${order.items.length} items`;
};

// Get quantity string
const getQuantityString = (order: Order): string => {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  if (order.menuType === 'MEAL_MENU') {
    return `${totalItems} Thali`;
  }
  return `${totalItems} item${totalItems > 1 ? 's' : ''}`;
};

const YourOrdersScreen: React.FC<Props> = ({ navigation }) => {
  const { usableVouchers } = useSubscription();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<'Current' | 'History' | 'Auto'>('Current');
  const [navActiveTab, setNavActiveTab] = useState<'home' | 'orders' | 'meals' | 'profile'>('orders');

  // Current orders state
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [currentLoading, setCurrentLoading] = useState(false); // Start with false - will be set to true only if cache miss
  const [currentError, setCurrentError] = useState<string | null>(null);

  // History orders state
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false); // Start with false - will be set to true only if cache miss
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // Track if data has been loaded to prevent unnecessary fetches
  const hasLoadedDataRef = useRef(false);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [kitchenOperatingHours, setKitchenOperatingHours] = useState<any>(null);

  // Fetch current orders
  const fetchCurrentOrders = async () => {
    try {
      setCurrentError(null);

      // 🚀 Try cache first for instant display (non-blocking check)
      const cachedOrders = dataPreloader.getCachedOrders();
      if (cachedOrders && !dataPreloader.isCacheExpired('orders')) {
        console.log('[YourOrdersScreen] ✓ Using cached orders from preload:', cachedOrders.length);
        const current = cachedOrders.filter((order: Order) =>
          CURRENT_STATUSES.includes(order.status)
        );
        setCurrentOrders(current);
        setCurrentLoading(false);
        return;
      }

      // Cache miss or expired - show loading and fetch from API
      console.log('[YourOrdersScreen] ⚠️ Cache miss, fetching orders from API');
      setCurrentLoading(true);
      // Note: Backend doesn't support comma-separated status values
      // Fetch all orders and filter client-side
      const response = await apiService.getMyOrders({ limit: 50 });
      console.log('[YourOrdersScreen] API Response:', JSON.stringify(response, null, 2));

      // Handle different response formats from backend
      // Backend may return {success: true, data: {...}} or {message: true, data: '...', error: {...}}
      const isSuccess = response.success === true || (response as any).message === true;
      const responseData = response.data && typeof response.data === 'object' && 'orders' in response.data
        ? response.data
        : (response as any).error || response.data;

      console.log('[YourOrdersScreen] isSuccess:', isSuccess, 'responseData:', responseData);

      if (isSuccess && responseData && responseData.orders) {
        // Use activeOrders from API if available, otherwise filter by status
        let current: Order[];
        if (responseData.activeOrders && responseData.activeOrders.length > 0) {
          current = responseData.orders.filter((order: Order) =>
            responseData.activeOrders!.includes(order._id)
          );
        } else {
          current = responseData.orders.filter((order: Order) =>
            CURRENT_STATUSES.includes(order.status)
          );
        }
        console.log('[YourOrdersScreen] Current orders count:', current.length);
        setCurrentOrders(current);
      } else if (isSuccess && responseData && Array.isArray(responseData)) {
        // Handle case where data is directly an array of orders
        const current = responseData.filter((order: Order) =>
          CURRENT_STATUSES.includes(order.status)
        );
        console.log('[YourOrdersScreen] Current orders count (array):', current.length);
        setCurrentOrders(current);
      } else {
        console.log('[YourOrdersScreen] Failed to load current orders - Response:', response);
        const errorMessage = typeof response.data === 'string' ? response.data :
          (response.message && typeof response.message === 'string' ? response.message : 'Failed to load orders');
        setCurrentError(errorMessage);
      }
    } catch (error: any) {
      console.error('[YourOrdersScreen] Error fetching current orders:', error.message || error);
      console.error('[YourOrdersScreen] Full error:', JSON.stringify(error, null, 2));
      setCurrentError(error.message || 'Failed to load orders');
    } finally {
      setCurrentLoading(false);
    }
  };

  // Fetch history orders with pagination
  const fetchHistoryOrders = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setHistoryError(null);
        setHistoryLoading(true);
      }
      console.log('[YourOrdersScreen] Fetching history orders - Page:', page);
      // Note: Backend doesn't support comma-separated status values
      // Fetch all orders and filter client-side
      const response = await apiService.getMyOrders({ page, limit: 20 });
      console.log('[YourOrdersScreen] History API Response:', JSON.stringify(response, null, 2));

      // Handle different response formats from backend
      const isSuccess = response.success === true || (response as any).message === true;
      const responseData = response.data && typeof response.data === 'object' && 'orders' in response.data
        ? response.data
        : (response as any).error || response.data;

      if (isSuccess && responseData && responseData.orders) {
        const history = responseData.orders.filter((order: Order) =>
          HISTORY_STATUSES.includes(order.status)
        );
        console.log('[YourOrdersScreen] History orders count:', history.length);

        if (append) {
          setHistoryOrders(prev => [...prev, ...history]);
        } else {
          setHistoryOrders(history);
        }

        // Check if there are more pages
        const pagination = responseData.pagination;
        if (pagination) {
          setHistoryHasMore(pagination.page < pagination.totalPages);
        } else {
          setHistoryHasMore(false);
        }
        setHistoryPage(page);
      } else if (isSuccess && responseData && Array.isArray(responseData)) {
        // Handle case where data is directly an array of orders
        const history = responseData.filter((order: Order) =>
          HISTORY_STATUSES.includes(order.status)
        );
        console.log('[YourOrdersScreen] History orders count (array):', history.length);

        if (append) {
          setHistoryOrders(prev => [...prev, ...history]);
        } else {
          setHistoryOrders(history);
        }
        setHistoryHasMore(false);
        setHistoryPage(page);
      } else {
        console.log('[YourOrdersScreen] Failed to load history orders - Response:', response);
        if (!append) {
          setHistoryError('Failed to load order history');
        }
      }
    } catch (error: any) {
      console.error('[YourOrdersScreen] Error fetching history orders:', error.message || error);
      if (!append) {
        setHistoryError(error.message || 'Failed to load order history');
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch all orders
  const fetchAllOrders = async () => {
    // Don't set loading states here - let individual fetch functions handle them
    // This allows cache to display instantly without showing loading state
    await Promise.all([fetchCurrentOrders(), fetchHistoryOrders(1, false)]);
  };

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllOrders();
    setRefreshing(false);
  }, []);

  // Load more history orders
  const loadMoreHistory = () => {
    if (historyHasMore && !historyLoading) {
      fetchHistoryOrders(historyPage + 1, true);
    }
  };

  // Fetch orders on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('[YourOrdersScreen] useFocusEffect triggered');

      // If data already loaded, skip fetch (only load once)
      if (hasLoadedDataRef.current) {
        console.log('[YourOrdersScreen] ✓ Data already loaded, skipping fetch');
        return;
      }

      // First check cache for instant display
      const cachedOrders = dataPreloader.getCachedOrders();
      if (cachedOrders && !dataPreloader.isCacheExpired('orders')) {
        console.log('[YourOrdersScreen] 🚀 Cache hit - displaying instantly, skipping API fetch');
        const current = cachedOrders.filter((order: Order) =>
          CURRENT_STATUSES.includes(order.status)
        );
        const history = cachedOrders.filter((order: Order) =>
          HISTORY_STATUSES.includes(order.status)
        );
        setCurrentOrders(current);
        setHistoryOrders(history);
        setCurrentLoading(false);
        setHistoryLoading(false);
        hasLoadedDataRef.current = true; // Mark as loaded
        return; // Don't fetch from API
      }

      // Cache miss - fetch from API
      console.log('[YourOrdersScreen] Cache miss - fetching from API');
      fetchAllOrders().then(() => {
        hasLoadedDataRef.current = true; // Mark as loaded after fetch
      });
    }, [])
  );

  // Open cancel modal
  const handleOpenCancelModal = async (order: Order) => {
    console.log('[YourOrdersScreen] Opening cancel modal for order:', order.orderNumber);
    setSelectedOrderForCancel(order);
    setShowCancelModal(true);

    // Fetch kitchen operating hours
    const kitchenId = typeof order.kitchenId === 'string' ? order.kitchenId : order.kitchenId?._id;
    if (kitchenId) {
      try {
        const kitchenResponse = await apiService.getKitchenMenu(kitchenId, order.menuType);
        const kitchenData = (kitchenResponse as any)?.data?.kitchen || (kitchenResponse as any)?.kitchen;
        if (kitchenData?.operatingHours) {
          setKitchenOperatingHours(kitchenData.operatingHours);
        }
      } catch (err) {
        console.log('[YourOrdersScreen] Failed to fetch kitchen operating hours:', err);
      }
    }
  };

  // Cancel order handler
  const handleCancelOrder = async (reason: string) => {
    if (!selectedOrderForCancel) return;

    try {
      setIsCancelling(true);
      console.log('[YourOrdersScreen] Cancelling order:', selectedOrderForCancel._id);
      const response = await apiService.cancelOrder(selectedOrderForCancel._id, reason);
      console.log('[YourOrdersScreen] Cancel response:', JSON.stringify(response, null, 2));

      // Handle API response format: {message: true/false, data: string, error?: object}
      // or standard format: {success: boolean, message: string, data?: object}
      const isSuccess = response.success === true || (response as any).message === true;
      const responseData = (response as any).error || response.data;

      if (isSuccess) {
        console.log('[YourOrdersScreen] Order cancelled successfully');
        setShowCancelModal(false);
        setSelectedOrderForCancel(null);

        const message = responseData?.message ||
          (typeof response.data === 'string' ? response.data : null) ||
          `Order cancelled.${responseData?.vouchersRestored ? ` ${responseData.vouchersRestored} voucher(s) restored.` : ''}`;

        showAlert('Order Cancelled', message, [
          { text: 'OK', onPress: () => fetchAllOrders() },
        ], 'success');
      } else {
        // Error message is in response.data when message is false
        const errorMessage = typeof response.data === 'string'
          ? response.data
          : (response.message && typeof response.message === 'string' ? response.message : 'Failed to cancel order');
        console.log('[YourOrdersScreen] Cancel failed:', errorMessage);
        showAlert('Cannot Cancel Order', errorMessage, undefined, 'error');
      }
    } catch (error: any) {
      console.error('[YourOrdersScreen] Cancel error:', error.message || error);
      showAlert('Error', error.message || 'Failed to cancel order', undefined, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Navigate to order detail
  const handleViewOrderDetail = (orderId: string) => {
    console.log('[YourOrdersScreen] Navigating to order detail:', orderId);
    navigation.navigate('OrderDetail', { orderId });
  };

  const handleTrackOrder = (orderId: string) => {
    console.log('[YourOrdersScreen] Navigating to order tracking:', orderId);
    navigation.navigate('OrderTracking', { orderId });
  };

  const handleReorder = (orderId: string) => {
    console.log('[YourOrdersScreen] Reorder:', orderId);
    showAlert('Coming Soon', 'Reorder functionality will be available soon!', undefined, 'default');
  };

  // Render current order card
  const renderCurrentOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order._id}
      onPress={() => handleViewOrderDetail(order._id)}
      activeOpacity={0.7}
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
          source={getOrderImage(order)}
          style={{ width: 64, height: 64, borderRadius: 12 }}
          resizeMode="cover"
        />

        <View className="flex-1 ml-3">
          {/* Row 1: Title | Price */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1} style={{ marginRight: 8 }}>
              {getOrderTitle(order)}
            </Text>
            <Text className="text-base font-bold text-gray-900">₹{order.amountPaid.toFixed(2)}</Text>
          </View>

          {/* Row 2: Order ID */}
          <View className="mb-1">
            <Text className="text-sm" style={{ color: 'rgba(145, 145, 145, 1)' }} numberOfLines={1}>
              Order ID - #{order.orderNumber}
            </Text>
          </View>

          {/* Row 3: Time | Auto Badge */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm" style={{ color: 'rgba(145, 145, 145, 1)' }}>
                {new Date(order.placedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {order.voucherUsage && order.voucherUsage.voucherCount > 0 && (
                <Text className="text-xs" style={{ color: '#16A34A', marginTop: 2, fontWeight: '600' }}>
                  {order.voucherUsage.voucherCount} voucher{order.voucherUsage.voucherCount > 1 ? 's' : ''} used
                </Text>
              )}
            </View>
            {order.isAutoOrder && (
              <View
                className="px-2.5 py-1 rounded-full flex-row items-center"
                style={{
                  backgroundColor: '#8B5CF6',
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text className="text-white text-xs mr-1">⚡</Text>
                <Text className="text-xs font-bold text-white">Auto</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Row 4: Status */}
      <View className="mb-4">
        <Text className="text-sm font-semibold" style={{ color: '#6B7280' }}>
          {getStatusMessage(order.status)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-center">
        {order.canCancel !== false && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleOpenCancelModal(order);
            }}
            className="py-2 rounded-full items-center"
            style={{ width: 135, marginRight: 12, borderWidth: 2, borderColor: 'rgba(245, 107, 76, 1)' }}
          >
            <Text className="text-base font-semibold" style={{ color: 'rgba(245, 107, 76, 1)' }}>Cancel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleTrackOrder(order._id);
          }}
          className="py-2 rounded-full items-center"
          style={{ width: order.canCancel !== false ? 135 : 280, backgroundColor: 'rgba(245, 107, 76, 1)' }}
        >
          <Text className="text-base font-semibold text-white">Track Order</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render history order card
  const renderHistoryOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order._id}
      onPress={() => handleViewOrderDetail(order._id)}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 mb-3"
      style={{
        minHeight: 160,
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
          source={getOrderImage(order)}
          style={{ width: 56, height: 56, borderRadius: 12 }}
          resizeMode="cover"
        />

        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1} style={{ marginRight: 8 }}>
              {getOrderTitle(order)}
            </Text>
            <Text className="text-base font-bold text-gray-900">₹{order.amountPaid.toFixed(2)}</Text>
          </View>
          <Text className="text-sm" style={{ color: 'rgba(145, 145, 145, 1)' }} numberOfLines={1}>
            Order ID - #{order.orderNumber}
          </Text>
          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-1">
              <Text className="text-sm" style={{ color: 'rgba(145, 145, 145, 1)' }}>
                {formatDate(order.placedAt)}
              </Text>
              {order.voucherUsage && order.voucherUsage.voucherCount > 0 && (
                <Text className="text-xs" style={{ color: '#16A34A', marginTop: 2, fontWeight: '600' }}>
                  {order.voucherUsage.voucherCount} voucher{order.voucherUsage.voucherCount > 1 ? 's' : ''} used
                </Text>
              )}
            </View>
            {order.isAutoOrder && (
              <View
                className="px-2.5 py-1.5 rounded-full flex-row items-center"
                style={{
                  backgroundColor: '#8B5CF6',
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text className="text-white text-xs mr-1">⚡</Text>
                <Text className="text-xs font-bold text-white">Auto</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Status and Re-order */}
      <View className="mt-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{
                backgroundColor: order.status === 'DELIVERED' ? '#16A34A' : '#EF4444',
              }}
            />
            <Text
              className="text-sm font-semibold"
              style={{
                color: order.status === 'DELIVERED' ? '#16A34A' : '#EF4444',
              }}
            >
              {getStatusMessage(order.status)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleReorder(order._id);
          }}
          className="rounded-full py-2.5 flex-row items-center justify-center"
          style={{
            backgroundColor: '#F56B4C',
            shadowColor: '#F56B4C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Image
            source={require('../../assets/icons/reorder2.png')}
            style={{ width: 16, height: 16, tintColor: 'white', marginRight: 6 }}
            resizeMode="contain"
          />
          <Text className="font-bold text-sm text-white">Re-order</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render loading state
  const renderLoading = () => (
    <View className="items-center justify-center py-20">
      <ActivityIndicator size="large" color="#F56B4C" />
      <Text className="text-base text-gray-500 mt-4">Loading orders...</Text>
    </View>
  );

  // Render error state
  const renderError = (message: string, onRetry: () => void) => (
    <View className="items-center justify-center py-20">
      <Text className="text-base text-gray-500 mb-4">{message}</Text>
      <TouchableOpacity
        onPress={onRetry}
        className="rounded-full px-6 py-2"
        style={{ backgroundColor: 'rgba(245, 107, 76, 1)' }}
      >
        <Text className="text-white font-semibold">Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmpty = (message: string) => (
    <View className="items-center justify-center py-20">
      <Image
        source={require('../../assets/icons/cart3.png')}
        style={{ width: 60, height: 60, tintColor: '#D1D5DB', marginBottom: 16 }}
        resizeMode="contain"
      />
      <Text className="text-base text-gray-500">{message}</Text>
    </View>
  );

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
          <View
            className="w-10 h-10 rounded-full  items-center justify-center"
            style={{ marginLeft: 8, marginRight: 20 }}
          >
            <Image
              source={require('../../assets/icons/Tiffsy.png')}
              style={{ width: 58, height: 58 }}
              resizeMode="contain"
            />
          </View>

          {/* My Orders Title */}
          <View className="flex-1 items-center">
            <Text className="text-white text-xl font-bold">My Orders</Text>
          </View>

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
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#F56B4C' }}>
              {usableVouchers}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row bg-gray-100 rounded-full p-1">
            <TouchableOpacity
              onPress={() => setActiveTab('Current')}
              className={`flex-1 py-3 rounded-full ${
                activeTab === 'Current' ? 'bg-white' : 'bg-transparent'
              }`}
              style={{
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
                style={{ fontSize: 13 }}
              >
                Current {currentOrders.length > 0 && `(${currentOrders.length})`}
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
                style={{ fontSize: 13 }}
              >
                History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('Auto')}
              className={`flex-1 py-3 rounded-full ${
                activeTab === 'Auto' ? 'bg-white' : 'bg-transparent'
              }`}
              style={{
                shadowColor: activeTab === 'Auto' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === 'Auto' ? 0.1 : 0,
                shadowRadius: 2,
                elevation: activeTab === 'Auto' ? 2 : 0,
              }}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === 'Auto' ? 'text-gray-900' : 'text-gray-500'
                }`}
                style={{ fontSize: 13 }}
              >
                Auto Order
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        className="flex-1 bg-white px-5 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F56B4C']}
            tintColor="#F56B4C"
          />
        }
      >
        {activeTab === 'Current' ? (
          // Current Orders Layout (all current orders including auto)
          <>
            {currentLoading ? (
              renderLoading()
            ) : currentError ? (
              renderError(currentError, fetchCurrentOrders)
            ) : currentOrders.length === 0 ? (
              renderEmpty('No current orders')
            ) : (
              currentOrders.map(renderCurrentOrderCard)
            )}
          </>
        ) : activeTab === 'History' ? (
          // History Orders Layout (non-auto orders)
          <>
            {historyLoading && historyOrders.length === 0 ? (
              renderLoading()
            ) : historyError ? (
              renderError(historyError, () => fetchHistoryOrders(1, false))
            ) : historyOrders.filter(o => !o.isAutoOrder).length === 0 ? (
              renderEmpty('No order history')
            ) : (
              <>
                {historyOrders.filter(o => !o.isAutoOrder).map(renderHistoryOrderCard)}

                {/* Load More Button */}
                {historyHasMore && (
                  <TouchableOpacity
                    onPress={loadMoreHistory}
                    className="items-center py-4 mb-6 flex-row justify-center"
                    disabled={historyLoading}
                  >
                    {historyLoading ? (
                      <ActivityIndicator size="small" color="#F56B4C" />
                    ) : (
                      <>
                        <Image
                          source={require('../../assets/icons/down2.png')}
                          style={{ width: 16, height: 16, tintColor: 'rgba(245, 107, 76, 1)', marginRight: 6 }}
                          resizeMode="contain"
                        />
                        <Text className="font-semibold text-base" style={{ color: 'rgba(245, 107, 76, 1)' }}>
                          Load More Orders
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        ) : (
          // Auto Orders Layout (both current and history auto orders)
          <>
            {currentLoading || historyLoading ? (
              renderLoading()
            ) : [...currentOrders, ...historyOrders].filter(o => o.isAutoOrder).length === 0 ? (
              renderEmpty('No auto-orders found')
            ) : (
              <>
                {currentOrders.filter(o => o.isAutoOrder).map(renderCurrentOrderCard)}
                {historyOrders.filter(o => o.isAutoOrder).map(renderHistoryOrderCard)}
              </>
            )}
          </>
        )}

        {/* Bottom Spacing for Navigation Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* White background for bottom safe area */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: 'white' }} />

      {/* Bottom Navigation Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 10,
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

        {/* On-Demand Icon */}
        <TouchableOpacity
          onPress={() => {
            setNavActiveTab('meals');
            navigation.navigate('OnDemand');
          }}
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
              On-Demand
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

      {/* Cancel Order Modal */}
      <CancelOrderModal
        visible={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedOrderForCancel(null);
          setKitchenOperatingHours(null);
        }}
        onConfirm={handleCancelOrder}
        orderNumber={selectedOrderForCancel?.orderNumber}
        isLoading={isCancelling}
        voucherCount={selectedOrderForCancel?.voucherUsage?.voucherCount ?? 0}
        amountPaid={selectedOrderForCancel?.amountPaid ?? 0}
        mealWindow={selectedOrderForCancel?.mealWindow}
        cutoffTime={selectedOrderForCancel?.mealWindow ? getMealCutoffTime(kitchenOperatingHours, selectedOrderForCancel.mealWindow.toLowerCase() as 'lunch' | 'dinner') || undefined : undefined}
      />
    </SafeAreaView>
  );
};

export default YourOrdersScreen;
