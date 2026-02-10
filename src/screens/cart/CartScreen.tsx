// src/screens/cart/CartScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import { useCart } from '../../context/CartContext';
import { useAddress } from '../../context/AddressContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { usePayment } from '../../context/PaymentContext';
import { useAlert } from '../../context/AlertContext';
import OrderSuccessModal from '../../components/OrderSuccessModal';
import apiService, {
  PricingBreakdown,
  VoucherEligibility,
  Order,
  AddonItem,
} from '../../services/api.service';
import dataPreloader from '../../services/dataPreloader.service';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';

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
    addAddonToItem,
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
  const { voucherSummary, usableVouchers, fetchVouchers } = useSubscription();
  const { processOrderPayment, retryOrderPayment, isProcessing: isPaymentProcessing } = usePayment();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { isSmallDevice } = useResponsive();

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
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [pendingPaymentOrderId, setPendingPaymentOrderId] = useState<string | null>(null);

  // Voucher auto-apply state
  const [hasAutoApplied, setHasAutoApplied] = useState(false);

  // Order summary expand/collapse state
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);

  // Available addons state
  const [availableAddons, setAvailableAddons] = useState<AddonItem[]>([]);
  const [addonsExpanded, setAddonsExpanded] = useState(false);

  // Address drawer state
  const [showAddressDrawer, setShowAddressDrawer] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const drawerTranslateY = useRef(new Animated.Value(400)).current;

  const openAddressDrawer = useCallback(() => {
    setShowAddressDrawer(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(drawerTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [backdropOpacity, drawerTranslateY]);

  const closeAddressDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(drawerTranslateY, { toValue: 400, duration: 250, useNativeDriver: true }),
    ]).start(() => setShowAddressDrawer(false));
  }, [backdropOpacity, drawerTranslateY]);

  // Quick action states
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [showCookingInput, setShowCookingInput] = useState(false);
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [doNotContact, setDoNotContact] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [showDeliveryInput, setShowDeliveryInput] = useState(false);

  // Refresh voucher data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[CartScreen] Screen focused - Refreshing voucher data');
      fetchVouchers().catch(err => {
        console.error('[CartScreen] Error refreshing vouchers on focus:', err);
      });
    }, [fetchVouchers])
  );

  // Fetch available addons when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchAddons = async () => {
        if (!kitchenId) return;
        try {
          const menuResponse = await apiService.getKitchenMenu(kitchenId, 'MEAL_MENU');
          if (menuResponse.data) {
            const { lunch, dinner } = menuResponse.data.mealMenu;
            const currentMealItem = mealWindow === 'DINNER' ? dinner : lunch;
            if (currentMealItem?.addonIds && currentMealItem.addonIds.length > 0) {
              setAvailableAddons(currentMealItem.addonIds);
            } else {
              setAvailableAddons([]);
            }
          }
        } catch (error) {
          console.error('[CartScreen] Error fetching addons:', error);
        }
      };
      fetchAddons();
    }, [kitchenId, mealWindow])
  );

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
        console.log('  - backend amountToPay:', response.data.breakdown?.amountToPay);
        console.log('  - backend subtotal:', response.data.breakdown?.subtotal);
        console.log('  - backend charges:', JSON.stringify(response.data.breakdown?.charges));

        // CRITICAL: Use backend pricing as-is without modification
        // Backend is the source of truth - it has authoritative prices and calculation logic
        // The order creation and Razorpay payment use backend's calculation
        // Frontend MUST match backend to avoid pricing mismatches
        setPricing(response.data.breakdown);
        setVoucherInfo(response.data.voucherEligibility);

        console.log('[CartScreen] Using backend pricing directly (no frontend override)');
      }
    } catch (error: any) {
      console.error('Error calculating pricing:', error.message || error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setPricingError(error.message || 'Failed to calculate pricing');
      setPricing(null);
    } finally {
      setIsCalculating(false);
    }
  }, [cartItems, kitchenId, menuType, mealWindow, localSelectedAddressId, voucherCount, getOrderItems]);

  // Recalculate pricing on changes
  useEffect(() => {
    calculatePricing();
  }, [calculatePricing]);

  // Handle placing order directly
  const handlePlaceOrder = async () => {
    console.log('[CartScreen] handlePlaceOrder called');
    console.log('  - kitchenId:', kitchenId);
    console.log('  - menuType:', menuType);
    console.log('  - localSelectedAddressId:', localSelectedAddressId);
    console.log('  - cartItems.length:', cartItems.length);
    console.log('  - mealWindow:', mealWindow);
    console.log('  - voucherCount:', voucherCount);

    if (!kitchenId || !menuType || !localSelectedAddressId || cartItems.length === 0) {
      showAlert('Error', 'Please ensure you have items in cart and a delivery address selected', undefined, 'error');
      return;
    }

    if (menuType === 'MEAL_MENU' && !mealWindow) {
      showAlert('Error', 'Please select a meal type', undefined, 'error');
      return;
    }

    // Safety check: Prevent voucher orders after cutoff
    if (voucherCount > 0 && voucherInfo?.cutoffPassed) {
      showAlert(
        'Voucher Unavailable',
        voucherInfo.cutoffInfo?.message || 'Voucher ordering time has passed. Please remove the voucher to continue with a paid order.',
        undefined,
        'error'
      );
      setVoucherCount(0);
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Step 1: Create order
      const response = await apiService.createOrder({
        kitchenId: kitchenId!,
        menuType: menuType!,
        mealWindow: menuType === 'MEAL_MENU' ? mealWindow! : undefined,
        deliveryAddressId: localSelectedAddressId,
        items: getOrderItems(),
        voucherCount,
        couponCode: null,
        paymentMethod: voucherCount > 0 && pricing?.amountToPay === 0 ? 'VOUCHER_ONLY' : 'UPI',
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
        console.log('  - amountToPay:', orderData.amountToPay);

        const orderId = orderData.order._id;
        const orderNumber = orderData.order.orderNumber;
        const orderAmountToPay = orderData.amountToPay || 0;

        // Refresh voucher data immediately if vouchers were used
        if (voucherCount > 0) {
          console.log('[CartScreen] Refreshing voucher data after using', voucherCount, 'voucher(s)');
          fetchVouchers().catch(err => {
            console.error('[CartScreen] Error refreshing vouchers:', err);
          });
        }

        // Step 2: Check if payment is required
        if (orderAmountToPay > 0) {
          console.log('[CartScreen] Payment required, initiating Razorpay checkout...');

          // Process payment via Razorpay
          const paymentResult = await processOrderPayment(orderId);

          if (!paymentResult.success) {
            // Payment failed or cancelled
            if (paymentResult.error === 'Payment cancelled') {
              console.log('[CartScreen] Payment cancelled by user');
              // Store order for retry
              setPendingPaymentOrderId(orderId);
              setOrderResult({ orderId, orderNumber, amountToPay: orderAmountToPay });
              showAlert(
                'Payment Cancelled',
                'Your order has been created but payment is pending. You can retry payment from your orders.',
                [
                  { text: 'Go to Orders', onPress: () => navigation.navigate('YourOrders') },
                  { text: 'OK', style: 'cancel' },
                ],
                'warning'
              );
              return;
            }

            // Payment failed - offer retry
            console.log('[CartScreen] Payment failed:', paymentResult.error);
            setPendingPaymentOrderId(orderId);
            showAlert(
              'Payment Failed',
              paymentResult.error || 'Payment could not be processed. Please try again.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Retry Payment',
                  onPress: () => handleRetryPayment(orderId, orderNumber, orderAmountToPay),
                },
              ],
              'error'
            );
            return;
          }

          console.log('[CartScreen] Payment successful!');
        } else {
          console.log('[CartScreen] No payment required (voucher-only or zero amount)');
        }

        // Invalidate cached data after successful order placement
        console.log('[CartScreen] 🗑️ Invalidating orders & vouchers cache after order placement');
        dataPreloader.invalidateCache('orders');
        if (voucherCount > 0) {
          dataPreloader.invalidateCache('vouchers');
        }

        // Step 3: Show success modal
        setOrderResult({ orderId, orderNumber, amountToPay: orderAmountToPay });
        setShowSuccessModal(true);
        setPendingPaymentOrderId(null);
      } else {
        console.log('[CartScreen] Order response not successful or no data');
        showAlert('Order Failed', 'Unexpected response from server', undefined, 'error');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      // Handle different error response formats
      const errorMessage = error.data || error.message || 'Failed to place order. Please try again.';
      showAlert('Order Failed', errorMessage, undefined, 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle retry payment for failed orders
  const handleRetryPayment = async (orderId: string, orderNumber: string, amountToPay: number) => {
    console.log('[CartScreen] Retrying payment for order:', orderId);
    setIsPlacingOrder(true);

    try {
      const paymentResult = await retryOrderPayment(orderId);

      if (paymentResult.success) {
        console.log('[CartScreen] Retry payment successful!');

        // Invalidate cached data after successful retry payment
        console.log('[CartScreen] 🗑️ Invalidating orders cache after retry payment');
        dataPreloader.invalidateCache('orders');

        setOrderResult({ orderId, orderNumber, amountToPay });
        setShowSuccessModal(true);
        setPendingPaymentOrderId(null);
      } else {
        if (paymentResult.error === 'Payment cancelled') {
          showAlert(
            'Payment Cancelled',
            'You can retry payment from your orders.',
            [{ text: 'OK' }],
            'warning'
          );
        } else {
          showAlert(
            'Payment Failed',
            paymentResult.error || 'Payment could not be processed.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Retry Again',
                onPress: () => handleRetryPayment(orderId, orderNumber, amountToPay),
              },
            ],
            'error'
          );
        }
      }
    } catch (error: any) {
      console.error('[CartScreen] Retry payment error:', error);
      showAlert('Error', error.message || 'Failed to process payment', undefined, 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const updateQuantity = (id: string, increment: boolean) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      if (!increment && item.quantity === 1) {
        // Remove item if trying to decrease from 1
        removeItem(id);
      } else {
        const newQuantity = increment ? item.quantity + 1 : item.quantity - 1;
        updateCartQuantity(id, newQuantity);
      }
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

  // Get display values - use backend's subtotal when available
  // Fallback to local calculation only if backend pricing is not yet loaded
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

  // Use backend's charges directly - backend handles voucher logic
  const charges = pricing?.charges ?? { deliveryFee: 0, serviceFee: 0, packagingFee: 0, handlingFee: 0, taxAmount: 0 };
  const totalCharges = charges.deliveryFee + charges.serviceFee + charges.packagingFee + charges.taxAmount;

  // Use backend's voucher coverage for display
  // Backend calculates this correctly including add-ons
  const voucherDiscount = pricing?.voucherCoverage?.value ?? 0;
  const couponDiscount = pricing?.discount?.value ?? 0;
  const totalDiscount = voucherDiscount + couponDiscount;

  // Check if cart has any add-ons
  const hasAddons = cartItems.some(item => item.addons && item.addons.length > 0);

  // Calculate amountToPay
  // ALWAYS use backend pricing when available to ensure UI matches Razorpay payment
  // Backend is source of truth for pricing - it has authoritative prices from database
  let amountToPay;

  if (pricing?.amountToPay !== undefined && pricing?.amountToPay !== null) {
    // Use backend's calculated amount - this matches what will be sent to Razorpay
    amountToPay = pricing.amountToPay;
    console.log('[CartScreen] Using backend pricing.amountToPay:', amountToPay);
  } else {
    // Fallback to local calculation only if backend pricing unavailable
    amountToPay = Math.max(0, subtotal + totalCharges - totalDiscount);
    console.log('[CartScreen] Using local calculation (no pricing data):', {
      subtotal,
      totalCharges,
      totalDiscount,
      amountToPay,
    });
  }

  // Debug: Log pricing changes
  useEffect(() => {
    console.log('[CartScreen] Pricing state changed:');
    console.log('  - pricing:', pricing ? 'exists' : 'null');
    console.log('  - pricing.amountToPay:', pricing?.amountToPay);
    console.log('  - pricing.voucherCoverage:', JSON.stringify(pricing?.voucherCoverage));
    console.log('  - calculated voucherDiscount:', voucherDiscount);
    console.log('  - calculated amountToPay:', amountToPay);
    console.log('  - current voucherCount:', voucherCount);
    console.log('  - charges (0 if voucher):', JSON.stringify(charges));
    console.log('  - totalCharges:', totalCharges);
  }, [pricing, voucherDiscount, amountToPay, voucherCount, charges, totalCharges]);

  // Voucher UI state - include both AVAILABLE and RESTORED vouchers
  const hasVouchers = usableVouchers > 0;
  // Calculate max vouchers that can be used based on thali count (main courses)
  const thaliCount = cartItems.reduce((sum, item) => item.hasVoucher !== false ? sum + item.quantity : sum, 0);
  const maxVouchersCanUse = Math.min(usableVouchers, thaliCount);
  // Show "Click to Redeem" button when:
  // 1. User has vouchers in their account (hasVouchers)
  // 2. No voucher is currently applied to this order (voucherCount === 0)
  // 3. Either voucherInfo is not loaded yet OR (canUse > 0 AND cutoff not passed)
  // The backend now correctly calculates canUse based on available vouchers, main courses, and cutoff time
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

  // Auto-adjust voucher count when thali count decreases
  // This ensures voucherCount never exceeds the number of thalis in cart
  useEffect(() => {
    if (voucherCount > thaliCount) {
      console.log('[CartScreen] Adjusting voucherCount to match thaliCount');
      console.log('  - voucherCount was:', voucherCount);
      console.log('  - thaliCount is:', thaliCount);
      setVoucherCount(thaliCount);
    }
  }, [thaliCount, voucherCount, setVoucherCount]);

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
    console.log('  - thaliCount:', thaliCount);
    console.log('  - usableVouchers:', usableVouchers);
    console.log('  - maxVouchersCanUse:', maxVouchersCanUse);
  }, [voucherSummary, hasVouchers, voucherCount, voucherInfo, canUseVoucher, showRedeemButton, thaliCount, usableVouchers, maxVouchersCanUse]);

  // Auto-apply voucher when eligible (cutoff not passed and vouchers available)
  useEffect(() => {
    // Only auto-apply once per cart session
    if (hasAutoApplied) return;

    // Check if voucher can be auto-applied
    if (voucherInfo && !voucherInfo.cutoffPassed && voucherInfo.canUse > 0 && voucherCount === 0 && hasVouchers) {
      console.log('[CartScreen] Auto-applying voucher');
      setVoucherCount(1);
      setHasAutoApplied(true);
    }
  }, [voucherInfo, voucherCount, hasVouchers, hasAutoApplied, setVoucherCount]);

  // Reset auto-apply flag when cart is emptied
  useEffect(() => {
    if (cartItems.length === 0) {
      setHasAutoApplied(false);
    }
  }, [cartItems.length]);

  // Auto-remove vouchers when cutoff time is detected
  useEffect(() => {
    if (voucherInfo?.cutoffPassed && voucherCount > 0) {
      console.log('[CartScreen] Cutoff detected, auto-removing vouchers');
      setVoucherCount(0);
      showAlert(
        'Voucher Removed',
        voucherInfo.cutoffInfo?.message || 'Voucher ordering time has passed. Your order will proceed as a paid order.',
        undefined,
        'warning'
      );
    }
  }, [voucherInfo?.cutoffPassed, voucherCount, setVoucherCount, showAlert]);

  // Handler to remove all vouchers
  const handleRemoveVoucher = () => {
    console.log('[CartScreen] Removing voucher');
    setVoucherCount(0);
  };

  // Handler to add one more voucher
  const handleAddMoreVoucher = () => {
    console.log('[CartScreen] Adding one more voucher');
    if (voucherCount < maxVouchersCanUse) {
      setVoucherCount(voucherCount + 1);
    }
  };

  // Handler to apply voucher (click to redeem)
  const handleApplyVoucher = () => {
    console.log('[CartScreen] handleApplyVoucher called');
    console.log('  - current voucherCount:', voucherCount);
    console.log('  - voucherInfo:', JSON.stringify(voucherInfo));
    console.log('  - hasVouchers:', hasVouchers);
    console.log('  - usableVouchers:', usableVouchers);

    // Use the backend's canUse value if available, otherwise default to 1 voucher
    // The backend calculates canUse based on available vouchers, main courses, and cutoff time
    if (voucherInfo && voucherInfo.canUse > 0) {
      console.log('  - Setting voucherCount to:', Math.min(1, voucherInfo.canUse));
      setVoucherCount(Math.min(1, voucherInfo.canUse));
    } else if (hasVouchers) {
      // Fallback: apply 1 voucher if voucherInfo not loaded yet
      console.log('  - Fallback: Setting voucherCount to 1');
      setVoucherCount(1);
    }
    // Price will recalculate automatically due to existing useEffect dependency on voucherCount
  };

  // Handler to increment voucher count
  const handleIncrementVoucher = () => {
    console.log('[CartScreen] handleIncrementVoucher called');
    console.log('  - current voucherCount:', voucherCount);
    console.log('  - maxVouchersCanUse:', maxVouchersCanUse);
    console.log('  - usableVouchers:', usableVouchers);
    console.log('  - thaliCount:', thaliCount);

    if (voucherCount < maxVouchersCanUse) {
      const newCount = voucherCount + 1;
      console.log('  - Setting voucherCount to:', newCount);
      setVoucherCount(newCount);
    } else {
      console.log('  - Cannot increment: reached max vouchers');
    }
  };

  // Handler to decrement voucher count
  const handleDecrementVoucher = () => {
    console.log('[CartScreen] handleDecrementVoucher called');
    console.log('  - current voucherCount:', voucherCount);

    if (voucherCount > 1) {
      const newCount = voucherCount - 1;
      console.log('  - Setting voucherCount to:', newCount);
      setVoucherCount(newCount);
    } else {
      // If decrementing to 0, remove all vouchers
      console.log('  - Removing all vouchers (setting to 0)');
      setVoucherCount(0);
    }
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
          </View>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Your Order Section */}
        <View className="bg-white mb-4" style={{ paddingHorizontal: SPACING.screenHorizontal, paddingVertical: isSmallDevice ? SPACING.lg : SPACING.xl }}>
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
                      className="rounded-full items-center justify-center"
                      style={{ minWidth: TOUCH_TARGETS.minimum, minHeight: TOUCH_TARGETS.minimum }}
                    >
                      <Text className="text-gray-600 font-bold text-sm">−</Text>
                    </TouchableOpacity>
                    <Text className="mx-3 text-sm font-semibold">{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, true)}
                      className="rounded-full items-center justify-center"
                      style={{
                        backgroundColor: 'rgba(255, 217, 197, 1)',
                        minWidth: TOUCH_TARGETS.minimum,
                        minHeight: TOUCH_TARGETS.minimum
                      }}
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
            </React.Fragment>
          ))}

          {/* Add-ons — unified list of all available addons */}
          {availableAddons.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => setAddonsExpanded(!addonsExpanded)}
                className="flex-row items-center justify-between py-2"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-bold text-gray-900">Add-ons</Text>
                <View className="flex-row items-center">
                  {cartItems[0]?.addons && cartItems[0].addons.length > 0 && (
                    <View
                      className="items-center justify-center mr-2"
                      style={{
                        backgroundColor: '#ff8800',
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                        {cartItems[0].addons.length}
                      </Text>
                    </View>
                  )}
                  <Image
                    source={require('../../assets/icons/down2.png')}
                    style={{
                      width: 14,
                      height: 14,
                      tintColor: '#9CA3AF',
                      transform: [{ rotate: addonsExpanded ? '180deg' : '0deg' }],
                    }}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>

              {addonsExpanded && availableAddons.map((addon) => {
                const cartItem = cartItems[0];
                const cartAddonIndex = cartItem?.addons?.findIndex(a => a.addonId === addon._id) ?? -1;
                const cartAddon = cartAddonIndex >= 0 ? cartItem.addons![cartAddonIndex] : null;

                return (
                  <View
                    key={addon._id}
                    className="flex-row items-center py-2.5"
                    style={cartAddon ? { backgroundColor: '#FFFBF5', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10, marginVertical: 2 } : { marginVertical: 2 }}
                  >
                    <Image
                      source={require('../../assets/images/homepage/roti.png')}
                      className="rounded-full"
                      style={{ width: 36, height: 36 }}
                      resizeMode="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-sm font-semibold text-gray-900">{addon.name}</Text>
                      <Text className="text-xs text-gray-500">
                        {addon.description || '1 serving'}
                        {' · '}
                        <Text className="font-semibold text-gray-700">₹{addon.price}</Text>
                        {cartAddon && (
                          <Text className="font-semibold" style={{ color: '#ff8800' }}>
                            {' '}· ₹{(addon.price * cartAddon.quantity).toFixed(0)}
                          </Text>
                        )}
                      </Text>
                    </View>

                    {cartAddon ? (
                      <View
                        className="flex-row items-center"
                        style={{
                          backgroundColor: '#FFF7ED',
                          borderRadius: 16,
                          paddingVertical: 4,
                          paddingHorizontal: 6,
                          borderWidth: 1,
                          borderColor: '#ff8800',
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            if (cartAddon.quantity <= 1) {
                              removeAddon(cartItem.id, cartAddonIndex);
                            } else {
                              updateAddonQuantity(cartItem.id, cartAddonIndex, cartAddon.quantity - 1);
                            }
                          }}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: 'white',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: '#ff8800',
                          }}
                        >
                          <Text style={{ color: '#ff8800', fontSize: 13, fontWeight: '600' }}>−</Text>
                        </TouchableOpacity>
                        <Text
                          style={{
                            marginHorizontal: 8,
                            fontWeight: '600',
                            fontSize: 13,
                            color: '#ff8800',
                            minWidth: 10,
                            textAlign: 'center',
                          }}
                        >
                          {cartAddon.quantity}
                        </Text>
                        <TouchableOpacity
                          onPress={() => updateAddonQuantity(cartItem.id, cartAddonIndex, cartAddon.quantity + 1)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: '#ff8800',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          if (cartItem) {
                            addAddonToItem(cartItem.id, {
                              addonId: addon._id,
                              name: addon.name,
                              quantity: 1,
                              unitPrice: addon.price,
                            });
                          }
                        }}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: '#ff8800',
                        }}
                      >
                        <Text style={{ color: '#ff8800', fontSize: 12, fontWeight: '600' }}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* Vouchers Banner */}
        {voucherInfo && (
          <View className="mx-5 mb-4">
            {/* Applied Voucher Display */}
            {voucherCount > 0 && !voucherInfo.cutoffPassed ? (
              <View>
                {/* Applied Voucher Card */}
                <View
                  className="bg-green-50 rounded-2xl px-4 py-3 flex-row items-center justify-between mb-2"
                  style={{
                    borderWidth: 1,
                    borderColor: '#BBF7D0',
                  }}
                >
                  <View className="flex-row items-center flex-1">
                    <Image
                      source={require('../../assets/icons/voucher.png')}
                      style={{ width: 20, height: 20, tintColor: '#16A34A', marginRight: 10 }}
                      resizeMode="contain"
                    />
                    <View>
                      <Text className="text-green-700 font-semibold" style={{ fontSize: 14 }}>
                        {voucherCount} Voucher{voucherCount > 1 ? 's' : ''} Applied
                      </Text>
                      <Text className="text-green-600 text-xs">
                        Saving ₹{(cartItems.find(item => item.hasVoucher !== false)?.price || 0) * voucherCount}
                      </Text>
                    </View>
                  </View>
                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={handleRemoveVoucher}
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: 'white',
                      borderWidth: 1.5,
                      borderColor: '#ff8800',
                    }}
                  >
                    <Text className="text-red-500 font-bold text-lg">×</Text>
                  </TouchableOpacity>
                </View>

                {/* Add More Voucher Button - Only show if more thalis than vouchers applied */}
                {voucherCount < maxVouchersCanUse && (
                  <TouchableOpacity
                    onPress={handleAddMoreVoucher}
                    className="bg-orange-400 rounded-full px-4 py-3 flex-row items-center justify-center"
                  >
                    <Image
                      source={require('../../assets/icons/whitevoucher.png')}
                      style={{ width: 18, height: 18, tintColor: 'white', marginRight: 8 }}
                      resizeMode="contain"
                    />
                    <Text className="text-white font-semibold text-sm">
                      + Add Another Voucher ({maxVouchersCanUse - voucherCount} more available)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* No Voucher Applied - Show Available Vouchers Banner */
              <View
                className="bg-orange-400 rounded-full pl-6 pr-2 flex-row items-center justify-between"
                style={{
                  height: 60,
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
                ) : voucherInfo.canUse > 0 ? (
                  <TouchableOpacity
                    className="bg-white rounded-full px-5 items-center justify-center"
                    style={{ height: 46 }}
                    onPress={() => setVoucherCount(1)}
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
            )}
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

        {/* Delivery Address & Preferences */}
        <View className="bg-white mb-4" style={{ paddingHorizontal: SPACING.screenHorizontal, paddingVertical: isSmallDevice ? SPACING.lg : SPACING.xl }}>
          <Text className="text-xl font-bold text-gray-900 mb-4">Delivery Details</Text>

          {/* Selected Address */}
          {addresses.length === 0 ? (
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 border-b border-gray-100"
              onPress={() => navigation.navigate('Address')}
            >
              <Text className="text-orange-400 font-semibold">+ Add Delivery Address</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={openAddressDrawer}
              className="flex-row items-center pb-3 mb-1 border-b border-gray-100"
              activeOpacity={0.7}
            >
              {(() => {
                const selectedAddress = addresses.find(a => a.id === localSelectedAddressId) || addresses[0];
                return (
                  <>
                    <View className="w-10 h-10 items-center justify-center mr-3">
                      <Image
                        source={
                          selectedAddress.label.toLowerCase() === 'home'
                            ? require('../../assets/icons/house2.png')
                            : require('../../assets/icons/office.png')
                        }
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">{selectedAddress.label}</Text>
                      <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                        {selectedAddress.addressLine1}, {selectedAddress.locality}, {selectedAddress.city}
                      </Text>
                    </View>
                    <Text className="text-orange-400 font-semibold text-sm">Change</Text>
                  </>
                );
              })()}
            </TouchableOpacity>
          )}

          {/* Cooking Instructions */}
          <TouchableOpacity
            onPress={() => setShowCookingInput(!showCookingInput)}
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: showCookingInput || cookingInstructions ? '#FFF7ED' : '#F3F4F6' }}
            >
              <MaterialCommunityIcons name="note-edit-outline" size={20} color={showCookingInput || cookingInstructions ? '#ff8800' : '#6B7280'} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Cooking Instructions</Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {cookingInstructions || 'Add special requests for your meal'}
              </Text>
            </View>
            <Image
              source={require('../../assets/icons/down2.png')}
              style={{
                width: 14,
                height: 14,
                tintColor: '#9CA3AF',
                transform: [{ rotate: showCookingInput ? '180deg' : '0deg' }],
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {showCookingInput && (
            <TextInput
              className="text-sm text-gray-900 mt-2 mb-2"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
              placeholder="E.g., Less spicy, no onions..."
              placeholderTextColor="#9CA3AF"
              value={cookingInstructions}
              onChangeText={setCookingInstructions}
              multiline
            />
          )}

          {/* Leave at Door */}
          <TouchableOpacity
            onPress={() => setLeaveAtDoor(!leaveAtDoor)}
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: leaveAtDoor ? '#FFF7ED' : '#F3F4F6' }}
            >
              <MaterialCommunityIcons name="door-open" size={20} color={leaveAtDoor ? '#ff8800' : '#6B7280'} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Leave at Door</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Drop off without ringing the bell</Text>
            </View>
            <View
              className="w-5 h-5 rounded items-center justify-center"
              style={{
                borderWidth: 1.5,
                borderColor: leaveAtDoor ? '#ff8800' : '#D1D5DB',
                backgroundColor: leaveAtDoor ? '#ff8800' : 'white',
              }}
            >
              {leaveAtDoor && (
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>✓</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Do Not Contact */}
          <TouchableOpacity
            onPress={() => setDoNotContact(!doNotContact)}
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: doNotContact ? '#FFF7ED' : '#F3F4F6' }}
            >
              <MaterialCommunityIcons name="bell-off-outline" size={20} color={doNotContact ? '#ff8800' : '#6B7280'} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Do Not Contact</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Avoid calls or messages on delivery</Text>
            </View>
            <View
              className="w-5 h-5 rounded items-center justify-center"
              style={{
                borderWidth: 1.5,
                borderColor: doNotContact ? '#ff8800' : '#D1D5DB',
                backgroundColor: doNotContact ? '#ff8800' : 'white',
              }}
            >
              {doNotContact && (
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>✓</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Delivery Instructions */}
          <TouchableOpacity
            onPress={() => setShowDeliveryInput(!showDeliveryInput)}
            className="flex-row items-center py-3"
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: showDeliveryInput || deliveryInstructions ? '#FFF7ED' : '#F3F4F6' }}
            >
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={showDeliveryInput || deliveryInstructions ? '#ff8800' : '#6B7280'} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Delivery Instructions</Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {deliveryInstructions || 'Add directions for the delivery person'}
              </Text>
            </View>
            <Image
              source={require('../../assets/icons/down2.png')}
              style={{
                width: 14,
                height: 14,
                tintColor: '#9CA3AF',
                transform: [{ rotate: showDeliveryInput ? '180deg' : '0deg' }],
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {showDeliveryInput && (
            <TextInput
              className="text-sm text-gray-900 mt-2"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
              placeholder="E.g., Gate code 1234, use side entrance..."
              placeholderTextColor="#9CA3AF"
              value={deliveryInstructions}
              onChangeText={setDeliveryInstructions}
              multiline
            />
          )}
        </View>

        {/* Bottom Spacing - Dynamic based on summary height */}
        <View style={{ height: 300 }} />
      </ScrollView>

      {/* Order Summary - Sticky */}
      <View
        className="absolute left-0 right-0 bg-white"
        style={{
          bottom: 0,
          paddingBottom: Math.max(insets.bottom + 12, 20),
          paddingTop: 16,
          paddingHorizontal: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Voucher Promotion Card - Show only when user has no vouchers */}
        {!hasVouchers && (
          <View
            className="rounded-2xl p-3 mb-3 flex-row items-center"
            style={{
              backgroundColor: '#FFF7ED',
              borderWidth: 1,
              borderColor: '#FFDED6',
            }}
          >
            <Image
              source={require('../../assets/icons/voucher4.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
            <View className="flex-1 ml-2">
              <Text className="font-semibold text-gray-900 text-sm">Save more with Vouchers!</Text>
              <Text className="text-xs text-gray-600">Get meal plans starting Rs149</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('MealPlans')}
              className="bg-orange-400 rounded-full px-3 py-1.5"
            >
              <Text className="text-white font-semibold text-xs">View Plans</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCalculating ? (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#ff8800" />
            <Text className="text-gray-500 text-sm mt-2">Calculating...</Text>
          </View>
        ) : pricingError ? (
          <View className="items-center py-6 px-4">
            <Text className="text-red-500 text-lg font-semibold mb-2">Pricing Error</Text>
            <Text className="text-gray-600 text-center mb-4">{pricingError}</Text>
            <TouchableOpacity
              onPress={calculatePricing}
              className="bg-orange-400 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* To Pay Header - Always Visible */}
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Text className="text-base font-semibold text-gray-900">To Pay</Text>
                <TouchableOpacity
                  onPress={() => setIsOrderSummaryExpanded(!isOrderSummaryExpanded)}
                  activeOpacity={0.7}
                  style={{ marginLeft: 6 }}
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center">
                {totalDiscount > 0 && (
                  <Text className="text-sm text-gray-400 mr-2" style={{ textDecorationLine: 'line-through' }}>
                    ₹{(subtotal + totalCharges).toFixed(2)}
                  </Text>
                )}
                <Text className="text-lg font-bold text-gray-900">₹{amountToPay.toFixed(2)}</Text>
              </View>
            </View>

            {/* Expandable Breakdown Section */}
            {isOrderSummaryExpanded && (
              <View style={{ marginBottom: 12 }}>
                {/* Total Saving */}
                {totalDiscount > 0 && (
                  <View className="items-end mb-3">
                    <Text className="text-sm font-semibold" style={{ color: '#10B981' }}>
                      Total Saving: ₹{totalDiscount.toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Sub Total */}
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-900">Sub Total</Text>
                  <Text className="text-sm text-gray-900">₹ {subtotal.toFixed(0)}</Text>
                </View>

                {/* Discount */}
                {totalDiscount > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm" style={{ color: '#10B981' }}>Discount</Text>
                    <Text className="text-sm" style={{ color: '#10B981' }}>(-)₹ {Math.round(totalDiscount)}</Text>
                  </View>
                )}

                <View className="border-t border-gray-200 my-2" style={{ borderStyle: 'dashed' }} />

                {/* Delivery Charges */}
                {charges.deliveryFee > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-sm text-gray-900">Delivery Charges</Text>
                      <MaterialCommunityIcons name="information-outline" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
                    </View>
                    <Text className="text-sm text-gray-900">₹{charges.deliveryFee.toFixed(2)}</Text>
                  </View>
                )}

                {/* Packaging Charges */}
                {charges.packagingFee > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-sm text-gray-900">Packaging Charges</Text>
                      <MaterialCommunityIcons name="information-outline" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
                    </View>
                    <Text className="text-sm text-gray-900">₹{charges.packagingFee.toFixed(2)}</Text>
                  </View>
                )}

                {/* Platform Charges */}
                {charges.serviceFee > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-sm text-gray-900">Platform Charges</Text>
                      <MaterialCommunityIcons name="information-outline" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
                    </View>
                    <Text className="text-sm text-gray-900">₹{charges.serviceFee.toFixed(2)}</Text>
                  </View>
                )}

                {/* Applicable Taxes */}
                {charges.taxAmount > 0 && (
                  <View className="flex-row justify-between mb-3">
                    <View className="flex-row items-center">
                      <Text className="text-sm text-gray-900">Applicable Taxes</Text>
                      <MaterialCommunityIcons name="information-outline" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
                    </View>
                    <Text className="text-sm text-gray-900">₹ {charges.taxAmount.toFixed(2)}</Text>
                  </View>
                )}

                {/* TO PAY - Bottom */}
                <View className="border-t border-gray-300 pt-2 mt-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-bold text-gray-900">TO PAY</Text>
                    <View className="flex-row items-center">
                      {totalDiscount > 0 && (
                        <Text className="text-sm text-gray-400 mr-2" style={{ textDecorationLine: 'line-through' }}>
                          ₹ {(subtotal + totalCharges).toFixed(2)}
                        </Text>
                      )}
                      <Text className="text-lg font-bold text-gray-900">₹{amountToPay.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Bottom Button - Pay Now */}
        <View
          className="bg-orange-400 rounded-full flex-row items-center justify-between"
          style={{
            height: 56,
            paddingLeft: 20,
            paddingRight: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 10,
            opacity: (isPlacingOrder || isCalculating || addresses.length === 0 || pricingError) ? 0.7 : 1,
          }}
        >
          <View className="flex-row items-center flex-1">
            <Text className="text-white text-xl font-bold mr-2">₹{amountToPay.toFixed(2)}</Text>
            <Text className="text-white text-sm opacity-90">Total</Text>
          </View>
          <TouchableOpacity
            className="bg-white rounded-full flex-row items-center justify-center"
            style={{
              height: 44,
              paddingHorizontal: 20,
              minWidth: 130,
            }}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder || isCalculating || addresses.length === 0 || !!pricingError}
            activeOpacity={0.8}
          >
            {isPlacingOrder ? (
              <ActivityIndicator size="small" color="#ff8800" />
            ) : (
              <>
                <Text className="text-orange-400 font-bold text-base mr-2">
                  {addresses.length === 0 ? 'Add Address' : amountToPay === 0 ? 'Place Order' : 'Pay Now'}
                </Text>
                <Image
                  source={require('../../assets/icons/uparrow.png')}
                  style={{ width: 14, height: 14 }}
                  resizeMode="contain"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Address Selection Bottom Drawer */}
      <Modal
        visible={showAddressDrawer}
        transparent
        animationType="none"
        onRequestClose={closeAddressDrawer}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              opacity: backdropOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={closeAddressDrawer} />
          </Animated.View>

          <Animated.View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: SPACING.screenHorizontal,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom + 12, 24),
              transform: [{ translateY: drawerTranslateY }],
            }}
          >
            {/* Drawer Handle */}
            <View className="items-center mb-4">
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
            </View>

            <Text className="text-lg font-bold text-gray-900 mb-4">Select Delivery Address</Text>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {addresses.map((address, index) => (
                <TouchableOpacity
                  key={address.id}
                  className={`flex-row items-center py-3 ${index < addresses.length - 1 ? 'border-b border-gray-100' : ''}`}
                  onPress={() => {
                    handleSelectAddress(address.id);
                    closeAddressDrawer();
                  }}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 items-center justify-center mr-3">
                    <Image
                      source={
                        address.label.toLowerCase() === 'home'
                          ? require('../../assets/icons/house2.png')
                          : require('../../assets/icons/office.png')
                      }
                      style={{ width: 32, height: 32 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">{address.label}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
                      {address.addressLine1}, {address.locality}, {address.city}
                    </Text>
                  </View>
                  <View className={`w-5 h-5 rounded-full border-2 ${localSelectedAddressId === address.id ? 'border-orange-400' : 'border-gray-300'} items-center justify-center`}>
                    {localSelectedAddressId === address.id && (
                      <View className="w-3 h-3 rounded-full bg-orange-400" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Add New Address */}
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 mt-2"
              style={{
                borderWidth: 1,
                borderColor: '#ff8800',
                borderRadius: 28,
                borderStyle: 'dashed',
              }}
              onPress={() => {
                closeAddressDrawer();
                navigation.navigate('Address');
              }}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#ff8800" />
              <Text className="text-orange-400 font-semibold text-sm ml-1">Add New Address</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Order Success Modal */}
      <OrderSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onGoHome={handleGoHome}
        onTrackOrder={handleTrackOrder}
        orderNumber={orderResult?.orderNumber}
        amountToPay={orderResult?.amountToPay}
      />

    </SafeAreaView>
  );
};

export default CartScreen;
