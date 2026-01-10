// src/screens/account/MealPlansScreen.tsx
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
import { useUser } from '../../context/UserContext';
import subscriptionApi, { SubscriptionPlan } from '../../services/subscriptionApi';
import voucherApi, { Voucher, VoucherSummary } from '../../services/voucherApi';

type Props = StackScreenProps<MainTabParamList, 'MealPlans'>;

// Helper to parse days from API format (e.g., "7D" -> 7)
const parseDays = (days: string): number => {
  const match = days.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

// Helper to calculate savings
const calculateSavings = (compareAt: number, price: number): number => {
  return compareAt - price;
};

// Helper to get meals per day based on plan type
const getMealsPerDay = (planType: string): number => {
  switch (planType) {
    case 'BOTH':
      return 2;
    case 'LUNCH_ONLY':
    case 'DINNER_ONLY':
      return 1;
    default:
      return 2;
  }
};

// Format date for display
const formatExpiryDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const suffix = (day === 1 || day === 21 || day === 31) ? 'st'
    : (day === 2 || day === 22) ? 'nd'
    : (day === 3 || day === 23) ? 'rd' : 'th';
  return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
};

// Calculate days remaining
const getDaysRemaining = (expiryDate: string): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const MealPlansScreen: React.FC<Props> = ({ navigation }) => {
  const { user, isGuest } = useUser();

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState<boolean>(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  // Voucher state
  const [voucherCount, setVoucherCount] = useState<number>(0);
  const [voucherSummary, setVoucherSummary] = useState<VoucherSummary | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState<boolean>(true);

  // Fetch subscription plans
  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const response = await subscriptionApi.getSubscriptionPlans();
      if (response.success && response.data) {
        setPlans(response.data);
      }
    } catch (error: any) {
      console.log('Error fetching plans:', error);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Fetch voucher data
  const fetchVoucherData = useCallback(async () => {
    if (isGuest) {
      setVoucherLoading(false);
      return;
    }
    try {
      setVoucherLoading(true);
      const [summaryResponse, vouchersResponse] = await Promise.all([
        voucherApi.getVoucherSummary(),
        voucherApi.getMyVouchers({ hasRemaining: true, isExpired: false, sortBy: 'expiryDate', sortOrder: 'asc' }),
      ]);

      if (summaryResponse.success && summaryResponse.data) {
        setVoucherCount(summaryResponse.data.availableVouchers);
        setVoucherSummary(summaryResponse.data);
      }

      if (vouchersResponse.success && vouchersResponse.data) {
        setVouchers(vouchersResponse.data);
      }
    } catch (error: any) {
      console.log('Error fetching voucher data:', error);
    } finally {
      setVoucherLoading(false);
    }
  }, [isGuest]);

  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      fetchPlans();
      fetchVoucherData();
    }, [fetchPlans, fetchVoucherData])
  );

  // Handle purchase
  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login to purchase a subscription plan.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Account') },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to purchase the ${plan.planName} plan for ₹${plan.planPrice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              setPurchasingPlanId(plan._id);
              const response = await subscriptionApi.purchaseSubscription(plan._id);

              if (response.success) {
                Alert.alert(
                  'Purchase Successful!',
                  `You have received ${response.data.voucher.totalVouchers} vouchers. Valid until ${formatExpiryDate(response.data.voucher.expiryDate)}.`,
                  [{ text: 'OK', onPress: () => fetchVoucherData() }]
                );
              } else {
                Alert.alert('Purchase Failed', response.message || 'Failed to purchase subscription.');
              }
            } catch (error: any) {
              console.log('Purchase error:', error);
              Alert.alert('Purchase Failed', error?.message || 'Something went wrong. Please try again.');
            } finally {
              setPurchasingPlanId(null);
            }
          },
        },
      ]
    );
  };

  // Get nearest expiry voucher for display
  const nearestVoucher = vouchers.length > 0 ? vouchers[0] : null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#0A1F2E" />

      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
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
            {/* Profile Image */}
            <TouchableOpacity onPress={() => navigation.navigate('Account')}>
              <Image
                source={require('../../assets/images/myaccount/userpic.png')}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* Location */}
            <TouchableOpacity className="flex-1 mx-4" onPress={() => navigation.navigate('Address')}>
              <Text className="text-xs text-white text-center opacity-80">Location</Text>
              <View className="flex-row items-center justify-center">
                <Text className="text-sm text-white font-semibold">Vijay Nagar, Indore</Text>
                <Text className="text-white ml-1">▼</Text>
              </View>
            </TouchableOpacity>

            {/* Notification */}
            <TouchableOpacity className="w-12 h-12 rounded-full bg-white items-center justify-center">
              <Image
                source={require('../../assets/icons/notification2.png')}
                style={{ width: 42, height: 42}}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Greeting Text */}
          <View>
            <Text className="font-bold text-white" style={{ fontSize: 36 }}>
              Hello {user?.name?.split(' ')[0] || 'there'}
            </Text>
            <Text className="font-semibold text-white mt-1" style={{ fontSize: 36 }}>Enjoy Experience</Text>
          </View>
          </View>
        </View>

        {/* Purchase Vouchers Section */}
        <View className="bg-white px-5 pt-6 pb-10 flex-1" style={{ borderRadius: 33, marginTop: -20 }}>
          {/* Purchase Vouchers Heading */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Purchase Vouchers</Text>
          </View>

          {/* Current Voucher Balance */}
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
              {voucherLoading ? (
                <ActivityIndicator size="small" color="#F56B4C" />
              ) : (
                <Text className="text-4xl font-bold text-gray-900">
                  {voucherCount} <Text className="text-base font-normal text-gray-700">vouchers</Text>
                </Text>
              )}
            </View>

            {/* Description - Show meal type breakdown */}
            {voucherSummary && (
              <Text className="text-sm mb-4" style={{ lineHeight: 20, color: 'rgba(71, 71, 71, 1)' }}>
                {voucherSummary.availableByMealType.LUNCH > 0 && `Lunch: ${voucherSummary.availableByMealType.LUNCH}`}
                {voucherSummary.availableByMealType.LUNCH > 0 && voucherSummary.availableByMealType.DINNER > 0 && ' • '}
                {voucherSummary.availableByMealType.DINNER > 0 && `Dinner: ${voucherSummary.availableByMealType.DINNER}`}
                {(voucherSummary.availableByMealType.LUNCH > 0 || voucherSummary.availableByMealType.DINNER > 0) && voucherSummary.availableByMealType.BOTH > 0 && ' • '}
                {voucherSummary.availableByMealType.BOTH > 0 && `Both: ${voucherSummary.availableByMealType.BOTH}`}
                {!voucherSummary.availableByMealType.LUNCH && !voucherSummary.availableByMealType.DINNER && !voucherSummary.availableByMealType.BOTH && 'No vouchers available. Purchase a plan below!'}
              </Text>
            )}

            {/* Validity Section */}
            <View className="flex-row items-center mb-2">
              <View className="flex-1 h-px" style={{ backgroundColor: 'white' }} />
              <Text className="text-xs  mx-3" style={{ color: 'rgba(59, 59, 59, 1)', fontSize: 13 }}>Validity</Text>
              <View className="flex-1 h-px" style={{ backgroundColor: 'white' }} />
            </View>

            {voucherLoading ? (
              <View className="items-center py-2">
                <ActivityIndicator size="small" color="#F56B4C" />
              </View>
            ) : nearestVoucher ? (
              <View className="mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm" style={{ color: 'rgba(71, 71, 71, 1)' }}>Valid Until</Text>
                  <Text className="text-sm" style={{ color: 'rgba(71, 71, 71, 1)' }}>Days Remaining</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm" style={{ color: 'rgba(71, 71, 71, 1)', fontSize: 15, fontWeight: '600' }}>
                    {formatExpiryDate(nearestVoucher.expiryDate)}
                  </Text>
                  <Text className="text-sm" style={{ color: 'rgba(71, 71, 71, 1)', fontSize: 15, fontWeight: '600' }}>
                    {getDaysRemaining(nearestVoucher.expiryDate)} Days
                  </Text>
                </View>
              </View>
            ) : (
              <View className="mb-2">
                <Text className="text-sm text-center" style={{ color: 'rgba(71, 71, 71, 1)' }}>
                  No active vouchers
                </Text>
              </View>
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
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>1 Voucher = 1 Meal</Text>
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
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>Valid for Plan Duration</Text>
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
                <Text className="text-gray-900 mb-1" style={{ fontSize: 16, fontWeight: '500' }}>Add-ons available</Text>
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

          {plansLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#F56B4C" />
              <Text className="text-gray-500 mt-4">Loading plans...</Text>
            </View>
          ) : plans.length > 0 ? (
            plans.map((plan) => {
              const days = parseDays(plan.days);
              const savings = calculateSavings(plan.compareAtPlanPrice, plan.planPrice);
              const mealsPerDay = getMealsPerDay(plan.planType);
              const pricePerVoucher = Math.round(plan.planPrice / plan.totalVouchers);
              const isPurchasing = purchasingPlanId === plan._id;

              return (
                <View
                  key={plan._id}
                  className="mb-4"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 33,
                    borderWidth: 1,
                    borderColor: 'rgba(245, 107, 76, 1)',
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
                    {/* Savings Badge */}
                    {savings > 0 && (
                      <View
                        className="absolute top-4 right-4 rounded-full px-3 py-1"
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
                          Save ₹{savings}
                        </Text>
                      </View>
                    )}

                    {/* Voucher Icon */}
                    <View className="mb-3">
                      <Image
                        source={require('../../assets/icons/newvoucher2.png')}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Plan Name */}
                    <Text className="text-base font-semibold text-gray-800 mb-2">{plan.planName}</Text>

                    {/* Price and Days */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-baseline">
                        <Text className="text-4xl" style={{ color: 'rgba(0, 0, 0, 1)', fontWeight: '400' }}>
                          ₹{plan.planPrice.toFixed(2)}
                        </Text>
                        {savings > 0 && (
                          <Text className="text-base text-gray-400 ml-2 line-through">
                            ₹{plan.compareAtPlanPrice}
                          </Text>
                        )}
                      </View>
                      <Text className="text-2xl font-semibold" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                        {days} Days
                      </Text>
                    </View>

                    {/* Plan Details */}
                    <View className="mb-4">
                      <View className="flex-row items-center">
                        <Text className="text-sm mr-2.5" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                          {plan.totalVouchers} Vouchers
                        </Text>
                        <View className="w-1 h-1 rounded-full mr-2" style={{ backgroundColor: 'rgba(0, 0, 0, 1)' }} />
                        <Text className="text-sm flex-1" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                          {mealsPerDay} Meals/Day
                        </Text>
                        <Text className="text-sm" style={{ color: 'rgba(0, 0, 0, 1)' }}>
                          ₹{pricePerVoucher}/Voucher
                        </Text>
                      </View>
                    </View>

                    {/* Buy Button */}
                    <TouchableOpacity
                      onPress={() => handlePurchase(plan)}
                      disabled={isPurchasing}
                      className="rounded-full py-3 items-center"
                      style={{
                        backgroundColor: 'rgba(245, 107, 76, 1)',
                        opacity: isPurchasing ? 0.7 : 1,
                      }}
                    >
                      {isPurchasing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-bold text-base">Buy Now</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="items-center py-10">
              <Text className="text-gray-500">No plans available</Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MealPlansScreen;
