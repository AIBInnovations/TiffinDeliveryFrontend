// src/screens/account/MealPlansScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';
import { useSubscription } from '../../context/SubscriptionContext';
import { useUser } from '../../context/UserContext';
import { usePayment } from '../../context/PaymentContext';
import { SubscriptionPlan, PurchaseSubscriptionResponse, CancelSubscriptionResponse } from '../../services/api.service';

type Props = StackScreenProps<MainTabParamList, 'MealPlans'>;

const MealPlansScreen: React.FC<Props> = ({ navigation }) => {
  const { user, isGuest } = useUser();
  const {
    plans,
    plansLoading,
    subscriptions,
    activeSubscription,
    voucherSummary,
    usableVouchers,
    loading,
    error,
    fetchPlans,
    fetchSubscriptions,
    fetchVouchers,
    cancelSubscription,
    clearError,
  } = useSubscription();
  const { processSubscriptionPayment, isProcessing: isPaymentProcessing } = usePayment();

  // Modal states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseSubscriptionResponse | null>(null);
  const [cancelResult, setCancelResult] = useState<CancelSubscriptionResponse | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);

  // Fetch plans on mount
  useEffect(() => {
    console.log('[MealPlansScreen] useEffect - Fetching plans');
    fetchPlans();
  }, [fetchPlans]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    console.log('[MealPlansScreen] onRefresh - Starting refresh');
    setRefreshing(true);
    await Promise.all([fetchPlans(), fetchSubscriptions()]);
    setRefreshing(false);
    console.log('[MealPlansScreen] onRefresh - Refresh complete');
  }, [fetchPlans, fetchSubscriptions]);

  // Handle subscribe button press
  const handleSubscribe = (plan: SubscriptionPlan) => {
    console.log('[MealPlansScreen] handleSubscribe - Plan selected:', plan.name);
    setSelectedPlan(plan);
    setShowPurchaseModal(true);
  };

  // Confirm purchase with Razorpay payment
  const confirmPurchase = async () => {
    if (!selectedPlan) return;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('[MealPlansScreen] BEFORE PURCHASE:');
    console.log('  - usableVouchers:', usableVouchers);
    console.log('  - voucherSummary:', JSON.stringify(voucherSummary));
    console.log('  - active subscriptions:', subscriptions.filter(sub => sub.status === 'ACTIVE').length);
    console.log('  - purchasing plan:', selectedPlan.name);
    console.log('  - plan vouchers:', selectedPlan.totalVouchers);
    console.log('═══════════════════════════════════════════════════════════');

    setIsProcessing(true);
    setShowPurchaseModal(false); // Close modal before opening Razorpay

    try {
      // Process payment via Razorpay
      const paymentResult = await processSubscriptionPayment(selectedPlan._id);

      if (!paymentResult.success) {
        // Payment failed or cancelled
        if (paymentResult.error === 'Payment cancelled') {
          console.log('[MealPlansScreen] Payment cancelled by user');
          // Just close, user can try again
          return;
        }

        // Payment failed
        console.log('[MealPlansScreen] Payment failed:', paymentResult.error);
        Alert.alert(
          'Payment Failed',
          paymentResult.error || 'Payment could not be processed. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Payment successful - refresh data
      console.log('[MealPlansScreen] Payment successful, refreshing data...');
      await Promise.all([fetchSubscriptions(), fetchVouchers()]);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[MealPlansScreen] AFTER PURCHASE:');
      console.log('  - Payment ID:', paymentResult.paymentId);
      console.log('  - Subscription ID:', paymentResult.subscriptionId);
      console.log('  - NEW usableVouchers:', usableVouchers);
      console.log('  - NEW voucherSummary:', JSON.stringify(voucherSummary));
      console.log('  - EXPECTED total:', usableVouchers, '+', selectedPlan.totalVouchers, '=', usableVouchers + selectedPlan.totalVouchers);
      console.log('═══════════════════════════════════════════════════════════');

      // Calculate estimated expiry date (plan duration from purchase date)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + selectedPlan.durationDays);

      // Set purchase result for success modal
      setPurchaseResult({
        success: true,
        message: 'Subscription purchased successfully',
        data: {
          subscription: {
            _id: paymentResult.subscriptionId || '',
            planId: selectedPlan._id,
            status: 'ACTIVE',
            startDate: new Date().toISOString(),
            endDate: expiryDate.toISOString(),
          },
          vouchersIssued: selectedPlan.totalVouchers,
          voucherExpiryDate: expiryDate.toISOString(),
        },
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.log('[MealPlansScreen] confirmPurchase - Purchase failed:', err.message || err);
      Alert.alert('Error', err.message || 'Failed to complete purchase');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = () => {
    console.log('[MealPlansScreen] handleCancelSubscription - Opening cancel modal');
    setShowCancelModal(true);
  };

  // Confirm cancellation
  const confirmCancellation = async () => {
    if (!activeSubscription) return;

    console.log('[MealPlansScreen] confirmCancellation - Starting cancellation');
    setIsProcessing(true);
    try {
      const result = await cancelSubscription(activeSubscription._id, cancelReason || undefined);
      console.log('[MealPlansScreen] confirmCancellation - Cancellation successful');
      setCancelResult(result);
      setShowCancelModal(false);
      setShowCancelSuccessModal(true);
      setCancelReason('');
      setShowSubscriptionDetails(false);
    } catch (err: any) {
      console.log('[MealPlansScreen] confirmCancellation - Cancellation failed:', err.message || err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: '2-digit' };
    return date.toLocaleDateString('en-IN', options);
  };

  // Calculate savings
  const calculateSavings = (plan: SubscriptionPlan) => {
    return plan.originalPrice - plan.price;
  };

  // Calculate price per voucher
  const calculatePricePerVoucher = (plan: SubscriptionPlan) => {
    return Math.round(plan.price / plan.totalVouchers);
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <View className="px-5 mb-6">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="mb-4 bg-gray-200 rounded-3xl"
          style={{ height: 160, opacity: 0.5 }}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#0A1F2E" />

      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F56B4C']} />
        }
      >
        {/* Top Header - Profile, Location, Notification */}
        <View style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Background Image */}
          <Image
            source={require('../../assets/images/myaccount/mealplansbackground.png')}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          <View className="px-5 pt-3 pb-16">
            <View className="flex-row items-center justify-between mb-4">
              {/* Back Button */}
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

              <View className="flex-1" />

              {/* Voucher Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Vouchers')}
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
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#F56B4C' }}>{usableVouchers}</Text>
              </TouchableOpacity>
            </View>

            {/* Greeting Text */}
            <View>
              <Text className="font-bold text-white" style={{ fontSize: 36 }}>
                Hello {user?.name?.split(' ')[0] || 'there'}
              </Text>
              <Text className="font-semibold text-white mt-1" style={{ fontSize: 36 }}>
                Enjoy Experience
              </Text>
            </View>
          </View>
        </View>

        {/* Purchase Vouchers Section */}
        <View className="bg-white px-5 pt-6 pb-10 flex-1" style={{ borderRadius: 33, marginTop: -20 }}>
          {/* Purchase Vouchers Heading */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Purchase Vouchers</Text>
          </View>

          {/* Current Voucher Balance / Active Subscription */}
          <View style={{ borderRadius: 33, overflow: 'hidden' }}>
            <Image
              source={require('../../assets/images/myaccount/voucherbackgound.png')}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View style={{ padding: 20 }}>
              {/* Icon */}
              <View className="mb-4">
                <Image
                  source={require('../../assets/icons/newvoucher2.png')}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              </View>

              {/* Vouchers Count */}
              <View className="mb-3">
                <Text className="text-4xl font-bold text-gray-900">
                  {usableVouchers}{' '}
                  <Text className="text-base font-normal text-gray-700">vouchers</Text>
                </Text>
              </View>

              {/* Description */}
              <Text className="text-sm mb-4" style={{ lineHeight: 20, color: 'rgba(71, 71, 71, 1)' }}>
                {subscriptions.filter(sub => sub.status === 'ACTIVE').length > 0
                  ? subscriptions.filter(sub => sub.status === 'ACTIVE').length === 1
                    ? `Active plan: ${activeSubscription?.planName || 'Subscription'}`
                    : `${subscriptions.filter(sub => sub.status === 'ACTIVE').length} active subscriptions`
                  : 'Purchase a plan to get vouchers for your meals'}
              </Text>

              {/* Validity Section - Only if active subscription with expiry date */}
              {activeSubscription && activeSubscription.expiryDate && (
                <>
                  <View className="flex-row items-center mb-2">
                    <View className="flex-1 h-px" style={{ backgroundColor: 'white' }} />
                    <Text className="text-xs mx-3" style={{ color: 'rgba(59, 59, 59, 1)', fontSize: 13 }}>
                      Validity
                    </Text>
                    <View className="flex-1 h-px" style={{ backgroundColor: 'white' }} />
                  </View>

                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm" style={{ color: 'rgba(71, 71, 71, 1)' }}>
                        Valid Until
                      </Text>
                      <Text className="text-sm font-15px-400" style={{ color: 'rgba(71, 71, 71, 1)' }}>
                        Days Remaining
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-sm"
                        style={{ color: 'rgba(71, 71, 71, 1)', fontSize: 15, fontWeight: '600' }}
                      >
                        {formatDate(activeSubscription.expiryDate)}
                      </Text>
                      <Text
                        className="text-sm"
                        style={{ color: 'rgba(71, 71, 71, 1)', fontSize: 15, fontWeight: '600' }}
                      >
                        {activeSubscription.daysRemaining ?? 0} Days
                      </Text>
                    </View>
                  </View>

                  {/* View Details / Cancel Button */}
                  <TouchableOpacity
                    onPress={() => setShowSubscriptionDetails(!showSubscriptionDetails)}
                    className="mt-2"
                  >
                    <Text className="text-sm font-semibold" style={{ color: '#F56B4C' }}>
                      {showSubscriptionDetails ? 'Hide Details' : 'View Details'}
                    </Text>
                  </TouchableOpacity>

                  {/* Expanded Details */}
                  {showSubscriptionDetails && (
                    <View className="mt-4 pt-4 border-t border-gray-200">
                      {/* Overall Voucher Stats */}
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-gray-600">Vouchers Used</Text>
                        <Text className="text-sm font-semibold text-gray-900">
                          {voucherSummary?.redeemed ?? 0} / {voucherSummary?.total ?? 0}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-4">
                        <Text className="text-sm text-gray-600">Vouchers Remaining</Text>
                        <Text className="text-sm font-semibold text-gray-900">
                          {usableVouchers}
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View className="bg-gray-200 h-2 rounded-full mb-4">
                        <View
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: '#F56B4C',
                            width: `${voucherSummary?.total ? ((voucherSummary.redeemed / voucherSummary.total) * 100).toFixed(0) : 0}%`,
                          }}
                        />
                      </View>

                      {/* List All Active Subscriptions */}
                      {subscriptions.filter(sub => sub.status === 'ACTIVE').length > 0 && (
                        <View className="mb-4">
                          <Text className="text-sm font-semibold text-gray-900 mb-2">
                            Active Subscriptions ({subscriptions.filter(sub => sub.status === 'ACTIVE').length})
                          </Text>
                          {subscriptions
                            .filter(sub => sub.status === 'ACTIVE')
                            .map((sub, index) => (
                              <View key={sub._id} className="bg-gray-50 rounded-lg p-3 mb-2">
                                <View className="flex-row justify-between items-center mb-1">
                                  <Text className="text-sm font-medium text-gray-900">
                                    {sub.planSnapshot?.name || 'Subscription'} #{index + 1}
                                  </Text>
                                  <Text className="text-xs text-gray-500">
                                    {sub.vouchersRemaining ?? 0} vouchers
                                  </Text>
                                </View>
                                <Text className="text-xs text-gray-500">
                                  Expires: {formatDate(sub.voucherExpiryDate || sub.endDate)}
                                </Text>
                              </View>
                            ))}
                        </View>
                      )}

                      {/* Cancel Button - Only show if there's an active subscription */}
                      {activeSubscription && (
                        <TouchableOpacity
                          onPress={handleCancelSubscription}
                          className="py-2 rounded-full border border-red-500"
                        >
                          <Text className="text-center text-red-500 font-semibold">Cancel Subscription</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}

              {/* View All Vouchers Link */}
              {!isGuest && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Vouchers')}
                  className="mt-3"
                >
                  <Text className="text-sm font-semibold" style={{ color: '#F56B4C' }}>
                    View All Vouchers →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* How Vouchers Work */}
        <View className="bg-white mx-5 mb-4 rounded-3xl pl-4 pr-6 py-5">
          <Text className="text-xl font-bold text-gray-900 mb-4">How voucher's work?</Text>

          <View className="space-y-3">
            <View className="flex-row items-start mb-5">
              <Image
                source={require('../../assets/icons/order2.png')}
                style={{ width: 32, height: 32, marginRight: 12, marginTop: 2 }}
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>
                  1 Voucher = 1 Meal
                </Text>
                <Text className="text-sm text-gray-700" style={{ lineHeight: 20 }}>
                  Purchase vouchers in advance to enjoy convenient and hassle-free meal deliveries
                </Text>
              </View>
            </View>

            <View className="flex-row items-start mb-5">
              <Image
                source={require('../../assets/icons/address2.png')}
                style={{ width: 32, height: 32, marginRight: 12, marginTop: 2 }}
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>
                  Valid for Plan Duration
                </Text>
                <Text className="text-sm text-gray-700" style={{ lineHeight: 20 }}>
                  Each voucher can be redeemed for one meal of your choice
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Image
                source={require('../../assets/icons/mealplan.png')}
                style={{ width: 32, height: 32, marginRight: 12, marginTop: 2 }}
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>
                  Add-ons available
                </Text>
                <Text className="text-sm text-gray-700" style={{ lineHeight: 20 }}>
                  Vouchers are valid for the duration specified in your plan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Choose Your Plan */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Choose Your Plan</Text>

          {/* Loading State */}
          {plansLoading && renderLoadingSkeleton()}

          {/* Error State */}
          {error && !plansLoading && (
            <View className="bg-red-50 rounded-xl p-4 mb-4">
              <Text className="text-red-600 text-center">{error}</Text>
              <TouchableOpacity onPress={() => { clearError(); fetchPlans(); }} className="mt-2">
                <Text className="text-center text-red-600 font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Plans List */}
          {!plansLoading &&
            plans.map((plan) => {
              const savings = calculateSavings(plan);
              const pricePerVoucher = calculatePricePerVoucher(plan);
              // Check if user has any active subscription with this plan name
              const activeSubscriptionsForPlan = subscriptions.filter(
                sub => sub.status === 'ACTIVE' && sub.planSnapshot?.name === plan.name
              );
              const hasActivePlan = activeSubscriptionsForPlan.length > 0;

              return (
                <View
                  key={plan._id}
                  className="mb-4"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 33,
                    borderWidth: hasActivePlan ? 2 : 1,
                    borderColor: hasActivePlan ? '#22C55E' : 'rgba(245, 107, 76, 1)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <Image
                    source={require('../../assets/images/myaccount/voucherbackgound.png')}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <View className="p-6">
                    {/* Badge - Savings or Active */}
                    <View className="absolute top-4 right-4 flex-row">
                      {hasActivePlan && (
                        <View
                          className="rounded-full px-3 py-1 mr-2"
                          style={{ backgroundColor: 'rgba(220, 252, 231, 1)' }}
                        >
                          <Text className="text-xs font-bold" style={{ color: '#22C55E' }}>
                            Active{activeSubscriptionsForPlan.length > 1 ? ` (${activeSubscriptionsForPlan.length}x)` : ''}
                          </Text>
                        </View>
                      )}
                      {savings > 0 && (
                        <View
                          className="rounded-full px-3 py-1"
                          style={{
                            backgroundColor: 'rgba(233, 255, 238, 1)',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2,
                          }}
                        >
                          <Text className="text-xs font-bold" style={{ color: 'rgba(0, 139, 30, 1)' }}>
                            Save Rs.{savings}
                          </Text>
                        </View>
                      )}
                      {plan.badge && !hasActivePlan && (
                        <View
                          className="rounded-full px-3 py-1"
                          style={{
                            backgroundColor:
                              plan.badge === 'POPULAR' ? '#FEF3C7' :
                              plan.badge === 'BEST_VALUE' ? '#DBEAFE' : '#FCE7F3',
                          }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{
                              color:
                                plan.badge === 'POPULAR' ? '#D97706' :
                                plan.badge === 'BEST_VALUE' ? '#2563EB' : '#DB2777',
                            }}
                          >
                            {plan.badge.replace('_', ' ')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Voucher Icon */}
                    <View className="mb-3">
                      <Image
                        source={require('../../assets/icons/newvoucher2.png')}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Price and Days */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-baseline">
                        <Text
                          className="text-4xl"
                          style={{ color: 'rgba(0, 0, 0, 1)', fontWeight: '400' }}
                        >
                          Rs.{plan.price}
                        </Text>
                        {savings > 0 && (
                          <Text
                            className="text-lg ml-2 line-through"
                            style={{ color: 'rgba(150, 150, 150, 1)' }}
                          >
                            Rs.{plan.originalPrice}
                          </Text>
                        )}
                      </View>
                      <Text className="text-2xl font-semibold" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                        {plan.durationDays} Days
                      </Text>
                    </View>

                    {/* Plan Details */}
                    <View className="mb-4">
                      <View className="flex-row items-center">
                        <Text className="text-sm mr-2.5" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                          {plan.totalVouchers} Vouchers
                        </Text>
                        <View
                          className="w-1 h-1 rounded-full mr-2"
                          style={{ backgroundColor: 'rgba(0, 0, 0, 1)' }}
                        />
                        <Text className="text-sm flex-1" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                          {plan.vouchersPerDay} Meals/Day
                        </Text>
                        <Text className="text-sm" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                          Rs.{pricePerVoucher}/Voucher
                        </Text>
                      </View>
                    </View>

                    {/* Subscribe Button */}
                    {!isGuest ? (
                      <TouchableOpacity
                        onPress={() => handleSubscribe(plan)}
                        className="bg-orange-400 rounded-full py-3"
                        style={{
                          shadowColor: '#F56B4C',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 6,
                        }}
                      >
                        <Text className="text-center text-white font-bold text-base">
                          {hasActivePlan ? 'Purchase Again' : 'Subscribe'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Account')}
                        className="bg-gray-300 rounded-full py-3"
                      >
                        <Text className="text-center text-gray-600 font-bold text-base">
                          Login to Subscribe
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Helper text for active plans */}
                    {hasActivePlan && !isGuest && (
                      <Text className="text-xs text-gray-600 text-center mt-2">
                        Purchase again to add {plan.totalVouchers} more vouchers!
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}

          {/* Empty State */}
          {!plansLoading && plans.length === 0 && !error && (
            <View className="bg-gray-100 rounded-xl p-6">
              <Text className="text-center text-gray-600">No plans available at the moment</Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Purchase Confirmation Modal */}
      <Modal visible={showPurchaseModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-3xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Confirm Purchase
            </Text>

            {selectedPlan && (
              <>
                {/* Show helpful message if user already has this plan active */}
                {subscriptions.filter(sub => sub.status === 'ACTIVE' && sub.planSnapshot?.name === selectedPlan.name).length > 0 && (
                  <View className="bg-blue-50 rounded-xl p-3 mb-4">
                    <Text className="text-sm text-blue-800 text-center">
                      You already have this plan active. Purchasing again will add {selectedPlan.totalVouchers} more vouchers to your account!
                    </Text>
                  </View>
                )}

                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedPlan.name}
                  </Text>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600">Duration</Text>
                    <Text className="font-semibold">{selectedPlan.durationDays} days</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600">Vouchers</Text>
                    <Text className="font-semibold">{selectedPlan.totalVouchers}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600">Price</Text>
                    <Text className="font-semibold text-lg">Rs.{selectedPlan.price}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600">After Purchase</Text>
                    <Text className="font-semibold text-green-600">{usableVouchers + selectedPlan.totalVouchers} total vouchers</Text>
                  </View>
                </View>

                <Text className="text-sm text-gray-500 text-center mb-4">
                  By subscribing, you agree to our terms and conditions. Payment will be processed immediately.
                </Text>
              </>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowPurchaseModal(false)}
                className="flex-1 py-3 rounded-full border border-gray-300"
                disabled={isProcessing}
              >
                <Text className="text-center text-gray-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmPurchase}
                className="flex-1 py-3 rounded-full bg-orange-400"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-white font-semibold">Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Purchase Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-3xl w-full max-w-md p-6 items-center">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">✓</Text>
            </View>

            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              {subscriptions.filter(sub => sub.status === 'ACTIVE').length > 1
                ? 'Subscription Added!'
                : 'Purchase Successful!'}
            </Text>

            {purchaseResult && (
              <>
                <Text className="text-gray-600 text-center mb-4">
                  {purchaseResult.data.vouchersIssued} vouchers have been added to your account
                </Text>
                <View className="bg-gray-50 rounded-xl p-4 w-full mb-4">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600">Vouchers Issued</Text>
                    <Text className="font-semibold">{purchaseResult.data.vouchersIssued}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600">Total Vouchers Available</Text>
                    <Text className="font-semibold text-green-600">{usableVouchers}</Text>
                  </View>
                  {subscriptions.filter(sub => sub.status === 'ACTIVE').length > 1 && (
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-600">Active Subscriptions</Text>
                      <Text className="font-semibold">{subscriptions.filter(sub => sub.status === 'ACTIVE').length}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Valid Until</Text>
                    <Text className="font-semibold">
                      {formatDate(purchaseResult.data.voucherExpiryDate)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                setPurchaseResult(null);
                setSelectedPlan(null);
              }}
              className="w-full py-3 rounded-full bg-orange-400"
            >
              <Text className="text-center text-white font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-3xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Cancel Subscription
            </Text>

            <Text className="text-gray-600 text-center mb-4">
              Are you sure you want to cancel your subscription? This action cannot be undone.
            </Text>

            <TextInput
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChangeText={setCancelReason}
              className="bg-gray-50 rounded-xl px-4 py-3 mb-4"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 py-3 rounded-full border border-gray-300"
                disabled={isProcessing}
              >
                <Text className="text-center text-gray-600 font-semibold">Keep Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCancellation}
                className="flex-1 py-3 rounded-full bg-red-500"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-white font-semibold">Cancel Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancellation Success Modal */}
      <Modal visible={showCancelSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-3xl w-full max-w-md p-6 items-center">
            <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">!</Text>
            </View>

            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Subscription Cancelled
            </Text>

            {cancelResult && (
              <>
                <Text className="text-gray-600 text-center mb-4">
                  {cancelResult.data.vouchersCancelled} unused vouchers have been cancelled
                </Text>
                <View className="bg-gray-50 rounded-xl p-4 w-full mb-4">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600">Refund Eligible</Text>
                    <Text className="font-semibold">
                      {cancelResult.data.refundEligible ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  {cancelResult.data.refundEligible && cancelResult.data.refundAmount && (
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-600">Refund Amount</Text>
                      <Text className="font-semibold text-green-600">
                        Rs.{cancelResult.data.refundAmount}
                      </Text>
                    </View>
                  )}
                  <Text className="text-sm text-gray-500 mt-2">
                    {cancelResult.data.refundReason}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={() => {
                setShowCancelSuccessModal(false);
                setCancelResult(null);
              }}
              className="w-full py-3 rounded-full bg-orange-400"
            >
              <Text className="text-center text-white font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Global Loading Overlay */}
      {loading && !plansLoading && (
        <View className="absolute inset-0 bg-black/30 justify-center items-center">
          <View className="bg-white rounded-xl p-6">
            <ActivityIndicator size="large" color="#F56B4C" />
            <Text className="mt-2 text-gray-600">Processing...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default MealPlansScreen;
