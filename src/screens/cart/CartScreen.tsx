// src/screens/cart/CartScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { MainTabParamList } from '../../types/navigation';
import { useCart } from '../../context/CartContext';
import { useAddress } from '../../context/AddressContext';
import { useSubscription } from '../../context/SubscriptionContext';
import OrderSuccessModal from '../../components/OrderSuccessModal';
import CheckoutModal, { PaymentOption } from '../../components/CheckoutModal';
import apiService, {
  PricingBreakdown,
  VoucherEligibility,
  Order,
} from '../../services/api.service';

type Props = StackScreenProps<MainTabParamList, 'Cart'>;

interface OrderResult {
  orderId: string;
  orderNumber: string;
  amountToPay: number;
}

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const {
    cartItems,
    updateQuantity: updateCartQuantity,
    updateAddonQuantity,
    removeAddon,
    removeItem,
    kitchenId,
    menuType,
    mealWindow,
    deliveryAddressId,
    voucherCount,
    setVoucherCount,
    setDeliveryAddressId,
    getOrderItems,
    resetOrderContext,
  } = useCart();

  const { addresses, getMainAddress } = useAddress();
  const { voucherSummary, usableVouchers } = useSubscription();

  // Local state for selected address (display purposes)
  const [localSelectedAddressId, setLocalSelectedAddressId] = useState<string>(
    deliveryAddressId || getMainAddress()?.id || (addresses.length > 0 ? addresses[0].id : '')
  );

  // Pricing state
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [voucherInfo, setVoucherInfo] = useState<VoucherEligibility | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Order state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // Sync local address selection with cart context
  useEffect(() => {
    if (localSelectedAddressId && localSelectedAddressId !== deliveryAddressId) {
      setDeliveryAddressId(localSelectedAddressId);
    }
  }, [localSelectedAddressId]);

  // Calculate pricing when cart changes
  const calculatePricing = useCallback(async () => {
    console.log('[CartScreen] calculatePricing called');
    console.log('  - cartItems.length:', cartItems.length);
    console.log('  - kitchenId:', kitchenId);
    console.log('  - menuType:', menuType);
    console.log('  - mealWindow:', mealWindow);
    console.log('  - localSelectedAddressId:', localSelectedAddressId);
    console.log('  - voucherCount:', voucherCount);

    // Don't calculate if missing required data
    if (cartItems.length === 0 || !kitchenId || !menuType || !localSelectedAddressId) {
      console.log('[CartScreen] calculatePricing - Missing required data, returning early');
      console.log('  - cartItems empty:', cartItems.length === 0);
      console.log('  - kitchenId missing:', !kitchenId);
      console.log('  - menuType missing:', !menuType);
      console.log('  - localSelectedAddressId missing:', !localSelectedAddressId);
      setPricing(null);
      setVoucherInfo(null);
      return;
    }

    // For MEAL_MENU, mealWindow is required
    if (menuType === 'MEAL_MENU' && !mealWindow) {
      console.log('[CartScreen] calculatePricing - MEAL_MENU but mealWindow missing');
      setPricing(null);
      return;
    }

    setIsCalculating(true);
    setPricingError(null);

    try {
      const response = await apiService.calculatePricing({
        kitchenId,
        menuType,
        mealWindow: menuType === 'MEAL_MENU' ? mealWindow! : undefined,
        deliveryAddressId: localSelectedAddressId,
        items: getOrderItems(),
        voucherCount,
        couponCode: null,
      });

      if (response.success && response.data) {
        console.log('[CartScreen] calculatePricing API response:');
        console.log('  - voucherCount sent:', voucherCount);
        console.log('  - breakdown:', JSON.stringify(response.data.breakdown));
        console.log('  - voucherCoverage:', JSON.stringify(response.data.breakdown?.voucherCoverage));
        console.log('  - amountToPay:', response.data.breakdown?.amountToPay);

        let finalPricing = response.data.breakdown;

        // If voucherCount > 0 but API didn't apply voucher discount, apply it locally
        if (voucherCount > 0 && !response.data.breakdown?.voucherCoverage) {
          console.log('[CartScreen] API did not apply voucher, applying locally');
          // Find the main item (thali) price to cover with voucher
          const mainItem = cartItems.find(item => item.hasVoucher !== false);
          if (mainItem) {
            const voucherDiscountAmount = mainItem.price * Math.min(voucherCount, mainItem.quantity);
            const newAmountToPay = Math.max(0, (finalPricing?.amountToPay || finalPricing?.grandTotal || 0) - voucherDiscountAmount);

            console.log('[CartScreen] Local voucher calculation:');
            console.log('  - thali price:', mainItem.price);
            console.log('  - voucherDiscountAmount:', voucherDiscountAmount);
            console.log('  - newAmountToPay:', newAmountToPay);

            finalPricing = {
              ...finalPricing,
              voucherCoverage: { type: 'VOUCHER', value: voucherDiscountAmount, description: `${voucherCount} voucher applied` },
              amountToPay: newAmountToPay,
            };
          }
        }

        setPricing(finalPricing);
        setVoucherInfo(response.data.voucherEligibility);
      }
    } catch (error: any) {
      console.error('Error calculating pricing:', error);
      setPricingError(error.message || 'Failed to calculate pricing');
      // Fallback to local calculation
      const subtotal = cartItems.reduce((sum, item) => {
        let itemTotal = item.price * item.quantity;
        if (item.addons) {
          item.addons.forEach(addon => {
            itemTotal += addon.unitPrice * addon.quantity * item.quantity;
          });
        }
        return sum + itemTotal;
      }, 0);

      // Calculate voucher discount - thali price is covered by voucher
      let voucherDiscountAmount = 0;
      if (voucherCount > 0) {
        // Find the main item (thali) price to cover with voucher
        const mainItem = cartItems.find(item => item.hasVoucher !== false);
        if (mainItem) {
          // Voucher covers the thali price (not addons)
          voucherDiscountAmount = mainItem.price * Math.min(voucherCount, mainItem.quantity);
        }
      }

      const charges = { deliveryFee: 30, serviceFee: 5, packagingFee: 10, handlingFee: 0, taxAmount: subtotal * 0.05 };
      const totalCharges = charges.deliveryFee + charges.serviceFee + charges.packagingFee + charges.taxAmount;
      const grandTotal = subtotal + totalCharges;
      const amountToPay = Math.max(0, grandTotal - voucherDiscountAmount);

      console.log('[CartScreen] Fallback pricing calculation:');
      console.log('  - voucherCount:', voucherCount);
      console.log('  - subtotal:', subtotal);
      console.log('  - voucherDiscountAmount:', voucherDiscountAmount);
      console.log('  - grandTotal:', grandTotal);
      console.log('  - amountToPay:', amountToPay);

      setPricing({
        items: [],
        subtotal,
        charges,
        discount: null,
        voucherCoverage: voucherDiscountAmount > 0 ? { type: 'VOUCHER', value: voucherDiscountAmount, description: `${voucherCount} voucher applied` } : null,
        grandTotal,
        amountToPay,
      });
    } finally {
      setIsCalculating(false);
    }
  }, [cartItems, kitchenId, menuType, mealWindow, localSelectedAddressId, voucherCount, getOrderItems]);

  // Recalculate pricing on changes
  useEffect(() => {
    calculatePricing();
  }, [calculatePricing]);

  // Handle opening checkout modal
  const handlePlaceOrder = () => {
    console.log('[CartScreen] handlePlaceOrder called');
    console.log('  - kitchenId:', kitchenId);
    console.log('  - menuType:', menuType);
    console.log('  - localSelectedAddressId:', localSelectedAddressId);
    console.log('  - cartItems.length:', cartItems.length);
    console.log('  - mealWindow:', mealWindow);

    if (!kitchenId || !menuType || !localSelectedAddressId || cartItems.length === 0) {
      Alert.alert('Error', 'Please ensure you have items in cart and a delivery address selected');
      return;
    }

    if (menuType === 'MEAL_MENU' && !mealWindow) {
      Alert.alert('Error', 'Please select a meal type');
      return;
    }

    // Show checkout modal instead of directly placing order
    console.log('[CartScreen] Opening checkout modal');
    setShowCheckoutModal(true);
  };

  // Handle checkout confirmation from modal
  const handleCheckoutConfirm = async (
    option: PaymentOption,
    selectedVoucherCount: number,
    paymentMethod: string
  ) => {
    console.log('[CartScreen] handleCheckoutConfirm called');
    console.log('  - option:', option);
    console.log('  - selectedVoucherCount:', selectedVoucherCount);
    console.log('  - paymentMethod:', paymentMethod);

    setShowCheckoutModal(false);
    setIsPlacingOrder(true);

    // Update voucher count based on selection
    if (selectedVoucherCount !== voucherCount) {
      setVoucherCount(selectedVoucherCount);
    }

    try {
      const response = await apiService.createOrder({
        kitchenId: kitchenId!,
        menuType: menuType!,
        mealWindow: menuType === 'MEAL_MENU' ? mealWindow! : undefined,
        deliveryAddressId: localSelectedAddressId,
        items: getOrderItems(),
        voucherCount: selectedVoucherCount,
        couponCode: null,
        paymentMethod,
      });

      console.log('[CartScreen] createOrder response:', JSON.stringify(response));

      // Handle different API response formats
      // Format 1: { success: true, data: { order: {...}, amountToPay: ... } }
      // Format 2: { message: true, data: "Order placed successfully", error: { order: {...}, amountToPay: ... } }
      const isSuccess = response.success || response.message === true;
      const orderData = response.data?.order ? response.data : response.error;

      if (isSuccess && orderData?.order) {
        console.log('[CartScreen] Order created successfully!');
        console.log('  - orderId:', orderData.order._id);
        console.log('  - orderNumber:', orderData.order.orderNumber);
        setOrderResult({
          orderId: orderData.order._id,
          orderNumber: orderData.order.orderNumber,
          amountToPay: orderData.amountToPay,
        });
        setShowSuccessModal(true);
      } else {
        console.log('[CartScreen] Order response not successful or no data');
        Alert.alert('Order Failed', 'Unexpected response from server');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      // Handle different error response formats
      const errorMessage = error.data || error.message || 'Failed to place order. Please try again.';
      Alert.alert('Order Failed', errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const updateQuantity = (id: string, increment: boolean) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      const newQuantity = increment ? item.quantity + 1 : Math.max(1, item.quantity - 1);
      updateCartQuantity(id, newQuantity);
    }
  };

  const handleSelectAddress = (addressId: string) => {
    setLocalSelectedAddressId(addressId);
  };

  const handleGoHome = () => {
    setShowSuccessModal(false);
    resetOrderContext();
    navigation.navigate('Home');
  };

  const handleTrackOrder = () => {
    setShowSuccessModal(false);
    if (orderResult) {
      resetOrderContext();
      navigation.navigate('OrderTracking', { orderId: orderResult.orderId });
    }
  };

  // Get display values
  const subtotal = pricing?.subtotal ?? cartItems.reduce((sum, item) => {
    let itemTotal = item.price * item.quantity;
    // Include addons in subtotal calculation
    if (item.addons) {
      item.addons.forEach(addon => {
        itemTotal += addon.unitPrice * addon.quantity * item.quantity;
      });
    }
    return sum + itemTotal;
  }, 0);
  const charges = pricing?.charges;
  const totalCharges = charges
    ? charges.deliveryFee + charges.serviceFee + charges.packagingFee + charges.taxAmount
    : 45;

  // Calculate voucher discount - use pricing if available, otherwise calculate locally
  let voucherDiscount = pricing?.voucherCoverage?.value ?? 0;
  if (voucherDiscount === 0 && voucherCount > 0) {
    // Calculate voucher discount locally: 1 voucher = 1 meal (thali price)
    const mainItem = cartItems.find(item => item.hasVoucher !== false);
    if (mainItem) {
      voucherDiscount = mainItem.price * Math.min(voucherCount, mainItem.quantity);
    }
  }

  const couponDiscount = pricing?.discount?.value ?? 0;
  const totalDiscount = voucherDiscount + couponDiscount;

  // Calculate amountToPay - use pricing if available, otherwise calculate locally with voucher
  const amountToPay = pricing?.amountToPay ?? Math.max(0, subtotal + totalCharges - totalDiscount);

  // Debug: Log pricing changes
  useEffect(() => {
    console.log('[CartScreen] Pricing state changed:');
    console.log('  - pricing:', pricing ? 'exists' : 'null');
    console.log('  - pricing.amountToPay:', pricing?.amountToPay);
    console.log('  - pricing.voucherCoverage:', JSON.stringify(pricing?.voucherCoverage));
    console.log('  - calculated voucherDiscount:', voucherDiscount);
    console.log('  - calculated amountToPay:', amountToPay);
    console.log('  - current voucherCount:', voucherCount);
  }, [pricing, voucherDiscount, amountToPay, voucherCount]);

  // Voucher UI state - include both AVAILABLE and RESTORED vouchers
  const hasVouchers = usableVouchers > 0;
  // Show "Click to Redeem" button when:
  // 1. User has vouchers in their account (hasVouchers)
  // 2. No voucher is currently applied to this order (voucherCount === 0)
  // 3. Either voucherInfo is not loaded yet OR canUse > 0 (voucher can be used for this order)
  // If voucherInfo is null, still show the button - we'll validate on click
  const canUseVoucher = voucherInfo ? voucherInfo.canUse > 0 && !voucherInfo.cutoffPassed : true;
  const showRedeemButton = hasVouchers && voucherCount === 0 && canUseVoucher;

  // Debug logging for cart items
  useEffect(() => {
    console.log('[CartScreen] Cart items debug:');
    console.log('  - cartItems count:', cartItems.length);
    cartItems.forEach((item, idx) => {
      console.log(`  - Item ${idx}: ${item.name}, addons:`, JSON.stringify(item.addons));
    });
  }, [cartItems]);

  // Debug logging for voucher UI state
  useEffect(() => {
    console.log('[CartScreen] Voucher UI Debug:');
    console.log('  - voucherSummary:', JSON.stringify(voucherSummary));
    console.log('  - voucherSummary.available:', voucherSummary?.available);
    console.log('  - hasVouchers:', hasVouchers);
    console.log('  - voucherCount:', voucherCount);
    console.log('  - voucherInfo:', JSON.stringify(voucherInfo));
    console.log('  - voucherInfo?.canUse:', voucherInfo?.canUse);
    console.log('  - voucherInfo?.cutoffPassed:', voucherInfo?.cutoffPassed);
    console.log('  - canUseVoucher:', canUseVoucher);
    console.log('  - showRedeemButton:', showRedeemButton);
  }, [voucherSummary, hasVouchers, voucherCount, voucherInfo, canUseVoucher, showRedeemButton]);

  // Handler to apply voucher (click to redeem)
  const handleApplyVoucher = () => {
    console.log('[CartScreen] handleApplyVoucher called');
    console.log('  - current voucherCount:', voucherCount);
    console.log('  - voucherInfo:', JSON.stringify(voucherInfo));
    console.log('  - hasVouchers:', hasVouchers);

    // If voucherInfo is available and canUse > 0, use that value
    if (voucherInfo && voucherInfo.canUse > 0) {
      console.log('  - Setting voucherCount to:', Math.min(1, voucherInfo.canUse));
      setVoucherCount(Math.min(1, voucherInfo.canUse));
    } else if (hasVouchers) {
      // Fallback: try to apply 1 voucher, the API will validate during price calculation
      console.log('  - Fallback: Setting voucherCount to 1');
      setVoucherCount(1);
    }
    // Price will recalculate automatically due to existing useEffect dependency on voucherCount
  };

  // Check if cart is empty
  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="white" />
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
            </View>
            <View className="w-10" />
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">🛒</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
          <Text className="text-gray-500 text-center mb-6">Add some delicious meals to get started!</Text>
          <TouchableOpacity
            className="bg-orange-400 px-8 py-3 rounded-full"
            onPress={() => navigation.navigate('Home')}
          >
            <Text className="text-white font-semibold text-base">Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <React.Fragment key={item.id}>
              {/* Main Item */}
              <View className="flex-row items-center mb-4 pb-4 border-b border-gray-100">
                {/* Item Image */}
                <Image
                  source={item.image}
                  className="w-16 h-16 rounded-full"
                  resizeMode="cover"
                />

                {/* Item Details */}
                <View className="flex-1 ml-4">
                  <Text className="text-base font-bold text-gray-900">{item.name}</Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {item.subtitle}{' '}
                    <Text className="text-gray-900 font-semibold">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </Text>
                  {item.hasVoucher && voucherCount > 0 && (
                    <View className="flex-row items-center mt-2">
                      <Image
                        source={require('../../assets/icons/voucher.png')}
                        style={{ width: 14, height: 14, tintColor: '#16A34A', marginRight: 4 }}
                        resizeMode="contain"
                      />
                      <Text className="text-xs text-green-600 font-semibold">
                        {voucherCount} Voucher Applied
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
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Add-ons displayed as separate items */}
              {item.addons && item.addons.length > 0 && item.addons.map((addon, addonIndex) => (
                <View
                  key={`${item.id}-addon-${addonIndex}`}
                  className="flex-row items-center mb-4 pb-4 border-b border-gray-100 ml-4"
                >
                  {/* Addon Image */}
                  <Image
                    source={require('../../assets/images/homepage/roti.png')}
                    className="w-14 h-14 rounded-full"
                    resizeMode="cover"
                  />

                  {/* Addon Details */}
                  <View className="flex-1 ml-4">
                    <Text className="text-base font-bold text-gray-900">{addon.name}</Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {addon.quantity} {addon.quantity > 1 ? 'pieces' : 'piece'}{' '}
                      <Text className="text-gray-900 font-semibold">
                        ₹{(addon.unitPrice * addon.quantity).toFixed(2)}
                      </Text>
                    </Text>
                  </View>

                  {/* Addon Quantity Controls & Delete */}
                  <View className="items-end">
                    <View
                      className="flex-row items-center mb-2"
                      style={{ borderWidth: 1, borderColor: 'rgba(232, 235, 234, 1)', borderRadius: 60, paddingHorizontal: 8, paddingVertical: 4 }}
                    >
                      <TouchableOpacity
                        onPress={() => updateAddonQuantity(item.id, addonIndex, addon.quantity - 1)}
                        className="w-6 h-6 rounded-full items-center justify-center"
                      >
                        <Text className="text-gray-600 font-bold text-sm">−</Text>
                      </TouchableOpacity>
                      <Text className="mx-3 text-sm font-semibold">{addon.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateAddonQuantity(item.id, addonIndex, addon.quantity + 1)}
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
                    <TouchableOpacity onPress={() => removeAddon(item.id, addonIndex)}>
                      <Image
                        source={require('../../assets/icons/delete2.png')}
                        style={{ width: 20, height: 20 }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </React.Fragment>
          ))}
        </View>

        {/* Vouchers Banner */}
        {voucherInfo && (
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
                <Text className="text-white font-semibold" style={{ fontSize: 14 }}>
                  {voucherInfo.available} vouchers available
                </Text>
              </View>
              {voucherInfo.cutoffPassed ? (
                <View className="bg-white rounded-full px-4 items-center justify-center" style={{ height: 46 }}>
                  <Text className="text-red-500 font-semibold text-xs">Cutoff Passed</Text>
                </View>
              ) : voucherCount > 0 ? (
                <TouchableOpacity
                  className="bg-white rounded-full px-5 items-center justify-center flex-row"
                  style={{ height: 46 }}
                  onPress={() => setVoucherCount(0)}
                >
                  <Text className="text-orange-400 font-semibold text-sm">
                    {voucherCount} Applied
                  </Text>
                  <Image
                    source={require('../../assets/icons/tick3.png')}
                    style={{ width: 14, height: 14, marginLeft: 6 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ) : voucherInfo.canUse > 0 ? (
                <TouchableOpacity
                  className="bg-white rounded-full px-5 items-center justify-center"
                  style={{ height: 46 }}
                  onPress={() => setVoucherCount(Math.min(1, voucherInfo.canUse))}
                >
                  <Text className="text-orange-400 font-semibold text-sm">Use Voucher</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-white rounded-full px-5 items-center justify-center"
                  style={{ height: 46 }}
                  onPress={() => navigation.navigate('MealPlans')}
                >
                  <Text className="text-orange-400 font-semibold text-sm">Buy Vouchers</Text>
                </TouchableOpacity>
              )}
            </View>
            {voucherInfo.cutoffPassed && (
              <Text className="text-red-500 text-xs mt-2 text-center">
                {voucherInfo.cutoffInfo.message}
              </Text>
            )}
            {!voucherInfo.cutoffPassed && usableVouchers === 0 && (
              <Text className="text-gray-500 text-xs mt-2 text-center">
                Purchase a meal plan to get vouchers and save on orders!
              </Text>
            )}
          </View>
        )}

        {/* Delivery Address */}
        <View className="bg-white px-5 py-5 mb-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">Delivery Address</Text>

          {addresses.length === 0 ? (
            <TouchableOpacity
              className="flex-row items-center justify-center py-4"
              onPress={() => navigation.navigate('Address')}
            >
              <Text className="text-orange-400 font-semibold">+ Add Delivery Address</Text>
            </TouchableOpacity>
          ) : (
            <>
              {addresses.map((address, index) => (
                <TouchableOpacity
                  key={address.id}
                  className={`flex-row items-center mb-3 ${index < addresses.length - 1 ? 'pb-3 border-b border-gray-100' : ''}`}
                  onPress={() => handleSelectAddress(address.id)}
                >
                  {/* Icon */}
                  <View className="w-12 h-12 items-center justify-center mr-3">
                    <Image
                      source={
                        address.label.toLowerCase() === 'home'
                          ? require('../../assets/icons/house2.png')
                          : require('../../assets/icons/office.png')
                      }
                      style={{ width: 38, height: 38 }}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Address Details */}
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">{address.label}</Text>
                    <Text className="text-sm text-gray-500" numberOfLines={2}>
                      {address.addressLine1}, {address.locality}, {address.city}
                    </Text>
                  </View>

                  {/* Radio Button */}
                  <View className={`w-5 h-5 rounded-full border-2 ${localSelectedAddressId === address.id ? 'border-orange-400' : 'border-gray-300'} items-center justify-center`}>
                    {localSelectedAddressId === address.id && (
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
            </>
          )}
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
        {/* Voucher Promotion Card - Show only when user has no vouchers */}
        {!hasVouchers && (
          <View
            className="rounded-2xl p-4 mb-4 flex-row items-center"
            style={{
              backgroundColor: '#FFF5F2',
              borderWidth: 1,
              borderColor: '#FFDED6',
            }}
          >
            <Image
              source={require('../../assets/icons/voucher4.png')}
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900">Save more with Vouchers!</Text>
              <Text className="text-sm text-gray-600">Get meal plans starting Rs149</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('MealPlans')}
              className="bg-orange-400 rounded-full px-4 py-2"
            >
              <Text className="text-white font-semibold text-sm">View Plans</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text className="text-xl font-bold text-gray-900 mb-4">Order Summary</Text>

        {isCalculating ? (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#F56B4C" />
            <Text className="text-gray-500 text-sm mt-2">Calculating...</Text>
          </View>
        ) : (
          <>
            {/* Subtotal */}
            <View className="flex-row justify-between mb-3">
              <Text className="text-base text-gray-600">Subtotal:</Text>
              <Text className="text-base text-gray-900">₹{subtotal.toFixed(2)}</Text>
            </View>

            {/* Delivery & Charges */}
            <View className="flex-row justify-between mb-3">
              <Text className="text-base text-gray-600">Delivery & Charges:</Text>
              <Text className="text-base text-gray-900">₹{totalCharges.toFixed(2)}</Text>
            </View>

            {/* Voucher Discount */}
            {voucherDiscount > 0 && (
              <View className="flex-row justify-between mb-3">
                <Text className="text-base text-green-600">Voucher Discount:</Text>
                <Text className="text-base text-green-600 font-semibold">- ₹{voucherDiscount.toFixed(2)}</Text>
              </View>
            )}

            {/* Coupon Discount */}
            {couponDiscount > 0 && (
              <View className="flex-row justify-between mb-3">
                <Text className="text-base text-green-600">Coupon Discount:</Text>
                <Text className="text-base text-green-600 font-semibold">- ₹{couponDiscount.toFixed(2)}</Text>
              </View>
            )}

            <View className="border-b border-gray-200 mb-4" />

            {/* Total Amount */}
            <View className="flex-row justify-between mb-5">
              <Text className="text-lg font-bold text-gray-900">To Pay:</Text>
              <Text className="text-lg font-bold text-orange-500">₹{amountToPay.toFixed(2)}</Text>
            </View>
          </>
        )}

        {/* Bottom Button - Click to Redeem OR Place Order */}
        {showRedeemButton ? (
          // Show "Click to Redeem" button when user has vouchers and hasn't applied them yet
          <View
            className="bg-orange-400 rounded-full pl-6 pr-2 flex-row items-center justify-between"
            style={{
              height: 60,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 8,
              opacity: isCalculating ? 0.7 : 1,
            }}
          >
            <View>
              <Text className="text-white text-lg font-bold">
                You have {usableVouchers} vouchers
              </Text>
              <Text className="text-white text-xs" style={{ opacity: 0.8 }}>left</Text>
            </View>
            <TouchableOpacity
              className="bg-white rounded-full px-6 flex-row items-center justify-center"
              style={{ height: 48, minWidth: 130 }}
              onPress={handleApplyVoucher}
              disabled={isCalculating}
            >
              <Text className="text-orange-400 font-bold text-base">Click to Redeem</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Show normal "Place Order" button
          <View
            className="bg-orange-400 rounded-full pl-6 pr-2 flex-row items-center justify-between"
            style={{
              height: 60,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 8,
              opacity: (isPlacingOrder || isCalculating || addresses.length === 0) ? 0.7 : 1,
            }}
          >
            <View className="flex-row items-center">
              <Text className="text-white text-xl font-bold mr-2">₹{amountToPay.toFixed(2)}</Text>
              <Text className="text-white text-sm">Total</Text>
            </View>
            <TouchableOpacity
              className="bg-white rounded-full px-6 flex-row items-center"
              style={{ height: 48, minWidth: 117 }}
              onPress={handlePlaceOrder}
              disabled={isPlacingOrder || isCalculating || addresses.length === 0}
            >
              {isPlacingOrder ? (
                <ActivityIndicator size="small" color="#F56B4C" />
              ) : (
                <>
                  <Text className="text-orange-400 font-semibold text-base mr-2">
                    {addresses.length === 0 ? 'Add Address' : 'Place Order'}
                  </Text>
                  <Image
                    source={require('../../assets/icons/uparrow.png')}
                    style={{ width: 13, height: 13 }}
                    resizeMode="contain"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Order Success Modal */}
      <OrderSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onGoHome={handleGoHome}
        onTrackOrder={handleTrackOrder}
        orderNumber={orderResult?.orderNumber}
        amountToPay={orderResult?.amountToPay}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onConfirm={handleCheckoutConfirm}
        isLoading={isPlacingOrder}
        subtotal={subtotal}
        totalCharges={totalCharges}
        grandTotal={subtotal + totalCharges}
        availableVouchers={usableVouchers}
        maxVouchersForOrder={voucherInfo?.canUse ?? cartItems.reduce((sum, item) => item.hasVoucher !== false ? sum + item.quantity : sum, 0)}
        voucherValue={cartItems.find(item => item.hasVoucher !== false)?.price ?? 0}
        cutoffPassed={voucherInfo?.cutoffPassed ?? false}
        cutoffMessage={voucherInfo?.cutoffInfo?.message}
      />
    </SafeAreaView>
  );
};

export default CartScreen;
