// src/screens/account/AccountScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';
import { useUser } from '../../context/UserContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAddress } from '../../context/AddressContext';
import { MealWindowType, Subscription } from '../../services/api.service';
import apiService from '../../services/api.service';
import ConfirmationModal from '../../components/ConfirmationModal';
import InfoModal from '../../components/InfoModal';
import NotificationBell from '../../components/NotificationBell';
import { formatNextAutoOrderTime } from '../../utils/autoOrderUtils';

// ============================================
// OFFLINE MODE FLAG - Set to false to enable backend
// ============================================
const OFFLINE_MODE = true;

type Props = StackScreenProps<MainTabParamList, 'Account'>;

// Menu items configuration for search filtering
const ACCOUNT_MENU_ITEMS = [
  { id: 'orders', label: 'My Orders', icon: require('../../assets/icons/order2.png'), route: 'YourOrders' as const, authRequired: true },
  { id: 'addresses', label: 'Saved Addresses', icon: require('../../assets/icons/address2.png'), route: 'Address' as const, authRequired: true },
  { id: 'mealplans', label: 'Meal Plans', icon: require('../../assets/icons/prepared2.png'), route: 'MealPlans' as const, authRequired: false },
  { id: 'vouchers', label: 'My Vouchers', icon: require('../../assets/icons/refund2.png'), route: 'Vouchers' as const, authRequired: true },
  { id: 'autoordersettings', label: 'Auto-Order Settings', icon: require('../../assets/icons/time2.png'), route: 'AutoOrderSettings' as const, authRequired: true },
  { id: 'bulkorders', label: 'Bulk Orders', icon: require('../../assets/icons/bulkorders.png'), route: 'BulkOrders' as const, authRequired: false },
];

const SUPPORT_MENU_ITEMS = [
  { id: 'help', label: 'Help & Support', icon: require('../../assets/icons/help2.png'), route: 'HelpSupport' as const, authRequired: false },
  { id: 'about', label: 'About', icon: require('../../assets/icons/about2.png'), route: 'About' as const, authRequired: false },
];

const AccountScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'meals' | 'profile'>('profile');

  // Modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Auto-ordering modal states
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showSkipMealModal, setShowSkipMealModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseUntilDate, setPauseUntilDate] = useState('');
  const [skipMealDate, setSkipMealDate] = useState('');
  const [skipMealWindow, setSkipMealWindow] = useState<MealWindowType>('LUNCH');
  const [skipMealReason, setSkipMealReason] = useState('');
  const [isAutoOrderLoading, setIsAutoOrderLoading] = useState(false);

  const { isGuest, user, logout, exitGuestMode } = useUser();
  const {
    activeSubscription,
    vouchers,
    usableVouchers,
    subscriptions,
    loading,
    pauseAutoOrdering,
    resumeAutoOrdering,
    skipMeal,
  } = useSubscription();
  const { addresses } = useAddress();

  // State for default kitchen (fetched when needed)
  const [defaultKitchenId, setDefaultKitchenId] = useState<string | null>(null);
  const [kitchenOperatingHours, setKitchenOperatingHours] = useState<any>(null);

  // Get the active subscription object (not just summary)
  const getActiveSubscriptionFull = (): Subscription | null => {
    return subscriptions.find(s => s.status === 'ACTIVE') || null;
  };

  const activeSubFull = getActiveSubscriptionFull();

  // Store existing kitchen ID from subscription
  useEffect(() => {
    if (activeSubFull?.defaultKitchenId) {
      setDefaultKitchenId(activeSubFull.defaultKitchenId);
    }
  }, [activeSubFull]);

  // Fetch kitchen operating hours when kitchen ID is available
  useEffect(() => {
    const fetchKitchenOperatingHours = async () => {
      if (defaultKitchenId) {
        try {
          console.log('[AccountScreen] Fetching operating hours for kitchen:', defaultKitchenId);
          const kitchenResponse = await apiService.getKitchenMenu(defaultKitchenId, 'MEAL_MENU');
          const kitchenData = (kitchenResponse as any)?.data?.kitchen || (kitchenResponse as any)?.kitchen;
          if (kitchenData?.operatingHours) {
            console.log('[AccountScreen] Operating hours fetched:', kitchenData.operatingHours);
            setKitchenOperatingHours(kitchenData.operatingHours);
          }
        } catch (err) {
          console.log('[AccountScreen] Failed to fetch kitchen operating hours:', err);
        }
      }
    };

    fetchKitchenOperatingHours();
  }, [defaultKitchenId]);

  // Get nearest expiry date from usable vouchers (AVAILABLE or RESTORED)
  const getNearestVoucherExpiry = () => {
    const usableVouchersList = vouchers.filter(v => v.status === 'AVAILABLE' || v.status === 'RESTORED');
    if (usableVouchersList.length === 0) return null;

    // Sort by expiry date ascending and get the nearest
    const sorted = [...usableVouchersList].sort(
      (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
    return sorted[0]?.expiryDate || null;
  };

  // Format expiry date
  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}${getDaySuffix(day)} ${month} ${year}`;
  };

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGuestLogin = async () => {
    // Exit guest mode - AppNavigator will automatically show Auth flow
    await exitGuestMode();
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmModal(true);
  };

  const handlePause = () => {
    if (!activeSubFull) {
      Alert.alert('No Active Subscription', 'You need an active subscription to pause auto-ordering.');
      return;
    }

    if (activeSubFull.isPaused) {
      // Resume if already paused
      handleResumeAutoOrdering();
    } else {
      // Show pause modal
      setShowPauseModal(true);
    }
  };

  const handleResumeAutoOrdering = async () => {
    if (!activeSubFull) return;

    setIsAutoOrderLoading(true);
    try {
      const response = await resumeAutoOrdering(activeSubFull._id);
      setModalMessage(response.data.message || 'Auto-ordering has been resumed successfully.');
      setShowSuccessModal(true);
    } catch (error: any) {
      setModalMessage(error.message || 'Failed to resume auto-ordering.');
      setShowErrorModal(true);
    } finally {
      setIsAutoOrderLoading(false);
    }
  };

  const confirmPause = async () => {
    if (!activeSubFull) return;

    setIsAutoOrderLoading(true);
    setShowPauseModal(false);

    try {
      const response = await pauseAutoOrdering(activeSubFull._id, {
        pauseUntil: pauseUntilDate || undefined,
        pauseReason: pauseReason || undefined,
      });
      setModalMessage(response.data.message || 'Auto-ordering has been paused.');
      setShowSuccessModal(true);
      // Reset form
      setPauseReason('');
      setPauseUntilDate('');
    } catch (error: any) {
      setModalMessage(error.message || 'Failed to pause auto-ordering.');
      setShowErrorModal(true);
    } finally {
      setIsAutoOrderLoading(false);
    }
  };

  const handleSkipNextMeal = () => {
    if (!activeSubFull) {
      Alert.alert('No Active Subscription', 'You need an active subscription to skip meals.');
      return;
    }

    // Pre-fill with tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSkipMealDate(tomorrow.toISOString().split('T')[0]);

    // Determine next meal window based on current time
    const currentHour = new Date().getHours();
    setSkipMealWindow(currentHour < 14 ? 'LUNCH' : 'DINNER');

    setShowSkipMealModal(true);
  };

  const confirmSkipMeal = async () => {
    if (!activeSubFull || !skipMealDate) return;

    setIsAutoOrderLoading(true);
    setShowSkipMealModal(false);

    try {
      const response = await skipMeal(activeSubFull._id, {
        date: skipMealDate,
        mealWindow: skipMealWindow,
        reason: skipMealReason || undefined,
      });
      setModalMessage(response.message || 'Meal skipped successfully.');
      setShowSuccessModal(true);
      // Reset form
      setSkipMealDate('');
      setSkipMealReason('');
    } catch (error: any) {
      setModalMessage(error.message || 'Failed to skip meal.');
      setShowErrorModal(true);
    } finally {
      setIsAutoOrderLoading(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteConfirmModal(false);

    // OFFLINE MODE: Simulate successful account deletion
    if (OFFLINE_MODE) {
      console.log('[OFFLINE MODE] Simulating account deletion');
      setModalMessage('Your account will be deleted in 10 days. (OFFLINE MODE)');
      setShowSuccessModal(true);
      return;
    }

    /* BACKEND CODE - Uncomment when backend is ready
    try {
      const response: any = await apiService.deleteAccount();
      if (response.success) {
        setModalMessage(response.message || 'Your account will be deleted in 10 days.');
        setShowSuccessModal(true);
      } else {
        setModalMessage(response.message || 'Failed to delete account');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      setModalMessage(error.message || 'Failed to delete account. Please try again.');
      setShowErrorModal(true);
    }
    */
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    logout();
  };

  return (
    <SafeAreaView className="flex-1 bg-orange-400">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 70 }}>
        {/* Header */}
        <View className="bg-orange-400 pb-4" style={{ position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
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

          <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
            {/* Logo */}
            <View className="w-12 h-12 items-center justify-center" style={{ marginLeft: 10 }}>
              <Image
                source={require('../../assets/icons/Tiffsy.png')}
                style={{ width: 58, height: 35 }}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text className="text-white text-xl font-bold">My Profile</Text>

            {/* Right Section with Bell and Voucher */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Notification Bell */}
              <NotificationBell color="white" size={24} />

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
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#F56B4C' }}>{usableVouchers}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* White Container with Profile and Voucher */}
        <View className="bg-white px-5" style={{ marginTop: 10, paddingTop: 10, paddingBottom: 16 }}>
          {isGuest ? (
            /* Guest User - Login Prompt */
            <View className="mb-6" style={{
              backgroundColor: 'rgba(255, 245, 242, 1)',
              borderRadius: 20,
              padding: 24,
              borderWidth: 2,
              borderColor: '#F56B4C',
            }}>
              <View className="items-center mb-4">
                <Image
                  source={require('../../assets/images/myaccount/user2.png')}
                  style={{ width: 80, height: 80, borderRadius: 40, opacity: 0.7 }}
                  resizeMode="cover"
                />
              </View>
              <Text className="text-xl font-bold text-gray-900 text-center mb-2">
                Welcome, Guest!
              </Text>
              <Text className="text-sm text-gray-600 text-center mb-6" style={{ lineHeight: 20 }}>
                Login or register to unlock personalized meal plans, save addresses, track orders, and much more!
              </Text>
              <TouchableOpacity
                onPress={handleGuestLogin}
                className="bg-orange-400 rounded-full py-3 items-center shadow-lg"
                style={{
                  shadowColor: '#F56B4C',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-bold text-base">Login / Register</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Authenticated User - Profile Section */
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                {user?.profileImage ? (
                  <Image
                    source={{ uri: user.profileImage }}
                    style={{ width: 70, height: 70, borderRadius: 35 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require('../../assets/images/myaccount/user2.png')}
                    style={{ width: 70, height: 70, borderRadius: 35 }}
                    resizeMode="cover"
                  />
                )}
                <View className="ml-8">
                  <Text className="text-lg font-bold text-gray-900">{user?.name || 'User'}</Text>
                  <Text className="text-sm text-gray-500 mt-0.5">{user?.phone || 'No phone'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                <Image
                  source={require('../../assets/icons/edit.png')}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Voucher Card - Only for authenticated users */}
          {!isGuest && (
          <View style={{ borderRadius: 25, overflow: 'hidden' }}>
          <Image
            source={require('../../assets/images/myaccount/voucherbackgound.png')}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={{ padding: 20 }}>
            {/* Top Row - Icon, Vouchers Count and Buy More Button */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Image
                  source={require('../../assets/icons/voucher4.png')}
                  style={{ width: 45, height: 45 }}
                  resizeMode="contain"
                />
                <View className="ml-3">
                  <Text className="text-4xl font-bold text-gray-900">
                    {usableVouchers} <Text className="text-base font-normal text-gray-700">vouchers</Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-white rounded-full px-4 py-2"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                onPress={() => navigation.navigate('MealPlans')}
              >
                <Text className="text-orange-400 font-semibold text-sm">Buy More</Text>
              </TouchableOpacity>
            </View>

            {/* Description Text */}
            <Text className="text-sm text-gray-600 mb-4" style={{ lineHeight: 20 }}>
              {activeSubscription && activeSubscription.planName
                ? `Active plan: ${activeSubscription.planName}`
                : 'Purchase a plan to get vouchers for your meals.'}
            </Text>

            {/* Validity Section - Show if we have activeSubscription with expiry OR available vouchers */}
            {(() => {
              // Always get the nearest expiry date from available vouchers
              const nearestExpiry = getNearestVoucherExpiry();

              if (!nearestExpiry) return null;

              // Count vouchers expiring on this specific date
              const vouchersExpiringOnDate = vouchers.filter(
                v => (v.status === 'AVAILABLE' || v.status === 'RESTORED') &&
                     new Date(v.expiryDate).toDateString() === new Date(nearestExpiry).toDateString()
              ).length;

              if (vouchersExpiringOnDate === 0) return null;

              return (
                <>
                  <View className="flex-row items-center mb-2">
                    <View className="flex-1" style={{ height: 1, backgroundColor: 'rgba(243, 243, 243, 1)' }} />
                    <Text className="text-xs font-semibold px-3" style={{ color: 'rgba(59, 59, 59, 1)' }}>Validity</Text>
                    <View className="flex-1" style={{ height: 1, backgroundColor: 'rgba(243, 243, 243, 1)' }} />
                  </View>

                  <View className="mb-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-orange-400 mr-2" />
                        <Text className="text-sm text-gray-700">{vouchersExpiringOnDate} voucher{vouchersExpiringOnDate > 1 ? 's' : ''} expire{vouchersExpiringOnDate === 1 ? 's' : ''}</Text>
                      </View>
                      <Text className="text-sm font-semibold text-gray-900">{formatExpiryDate(nearestExpiry)}</Text>
                    </View>
                  </View>
                </>
              );
            })()}

            {/* Pause Status Indicator */}
            {activeSubFull?.isPaused && (
              <View className="mt-3 rounded-xl p-3 border" style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }}>
                <View className="flex-row items-center mb-1">
                  <Text className="text-base font-bold mr-2" style={{ color: '#D97706' }}>⏸️</Text>
                  <Text className="text-sm font-bold" style={{ color: '#D97706' }}>
                    Auto-Ordering Paused
                  </Text>
                </View>
                {activeSubFull.pausedUntil && (
                  <Text className="text-xs" style={{ color: '#92400E' }}>
                    Resumes on {new Date(activeSubFull.pausedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
              </View>
            )}

            {/* Next Auto-Order Card */}
            {activeSubFull?.autoOrderingEnabled && !activeSubFull.isPaused && (
              <View className="mt-3 rounded-xl p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="text-base mr-2">⏰</Text>
                    <View>
                      <Text className="text-xs text-gray-600">Next Auto-Order</Text>
                      <Text className="text-sm font-bold" style={{ color: '#8B5CF6' }}>
                        {formatNextAutoOrderTime(activeSubFull, kitchenOperatingHours || undefined)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AutoOrderSettings', { subscriptionId: activeSubFull._id })}
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'white' }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: '#8B5CF6' }}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* View All Vouchers Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Vouchers')}
              className="mt-2"
            >
              <Text className="text-sm font-semibold" style={{ color: '#F56B4C' }}>
                View All Vouchers →
              </Text>
            </TouchableOpacity>

            {/* Pause and Skip Meal Buttons */}
            <View className="flex-row justify-between mt-4 mb-4">
              {/* Pause/Resume Button */}
              <TouchableOpacity
                onPress={handlePause}
                disabled={isAutoOrderLoading || loading}
                className="flex-1 mr-2 bg-white rounded-full py-2.5 items-center"
                style={{
                  borderWidth: 1.5,
                  borderColor: activeSubFull?.isPaused ? '#10B981' : '#F56B4C',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                  opacity: isAutoOrderLoading || loading ? 0.6 : 1,
                }}
              >
                {isAutoOrderLoading ? (
                  <ActivityIndicator size="small" color="#F56B4C" />
                ) : (
                  <Text className="font-semibold text-sm" style={{ color: activeSubFull?.isPaused ? '#10B981' : '#F56B4C' }}>
                    {activeSubFull?.isPaused ? 'Resume' : 'Pause'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Skip Next Meal Button */}
              <TouchableOpacity
                onPress={handleSkipNextMeal}
                className="flex-1 ml-2 bg-orange-400 rounded-full py-2.5 items-center"
                style={{
                  shadowColor: '#F56B4C',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-white font-semibold text-sm">
                  Skip Next Meal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Auto Order Meal Type Display */}
            {activeSubFull && (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">
                Meal Type: {activeSubFull.defaultMealType === 'BOTH' ? 'Lunch & Dinner' :
                            activeSubFull.defaultMealType === 'LUNCH' ? 'Lunch only' :
                            activeSubFull.defaultMealType === 'DINNER' ? 'Dinner only' : 'Not set'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AutoOrderSettings', { subscriptionId: activeSubFull._id })}
              >
                <Text className="text-sm font-semibold" style={{ color: '#F56B4C' }}>
                  Change →
                </Text>
              </TouchableOpacity>
            </View>
            )}
          </View>
          </View>
          )}
        </View>

        {/* Account Section */}
        {(() => {
          const filteredAccountItems = ACCOUNT_MENU_ITEMS.filter(item => {
            // Filter by auth requirement
            if (item.authRequired && isGuest) return false;
            return true;
          });

          return (
            <View className="px-5 mb-3">
              <Text className="text-xl font-bold text-gray-900 mb-3">Account</Text>
              <View className="bg-white rounded-2xl overflow-hidden">
                {filteredAccountItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row items-center justify-between pl-3 pr-5 py-3"
                    onPress={() => {
                      // Special handling for Auto-Order Settings - pass subscription ID
                      if (item.route === 'AutoOrderSettings' && activeSubFull) {
                        navigation.navigate('AutoOrderSettings', { subscriptionId: activeSubFull._id });
                      } else {
                        navigation.navigate(item.route as any);
                      }
                    }}
                  >
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-full bg-orange-400 items-center justify-center">
                        <Image
                          source={item.icon}
                          style={{
                            width: item.id === 'autoordersettings' ? 28 : (item.id === 'vouchers' || item.id === 'mealplans' || item.id === 'bulkorders' ? 40 : 36),
                            height: item.id === 'autoordersettings' ? 28 : (item.id === 'vouchers' || item.id === 'mealplans' || item.id === 'bulkorders' ? 40 : 36),
                            tintColor: item.id === 'autoordersettings' ? '#FFFFFF' : undefined
                          }}
                          resizeMode="contain"
                        />
                      </View>
                      <Text className="text-base font-medium text-gray-900 ml-3">{item.label}</Text>
                    </View>
                    <Text style={{ color: '#9CA3AF', fontSize: 32 }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Support Section */}
        {(() => {
          const filteredSupportItems = SUPPORT_MENU_ITEMS.filter(item => {
            // Filter by auth requirement
            if (item.authRequired && isGuest) return false;
            return true;
          });

          return (
            <View className="px-5 mb-6">
              <Text className="text-xl font-bold text-gray-900 mb-3">Support</Text>
              <View className="bg-white rounded-2xl overflow-hidden">
                {filteredSupportItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row items-center justify-between pl-3 pr-5 py-3"
                    onPress={() => navigation.navigate(item.route)}
                  >
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-full bg-orange-400 items-center justify-center">
                        <Image
                          source={item.icon}
                          style={{ width: 36, height: 36 }}
                          resizeMode="contain"
                        />
                      </View>
                      <Text className="text-base font-medium text-gray-900 ml-3">{item.label}</Text>
                    </View>
                    <Text style={{ color: '#9CA3AF', fontSize: 32 }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Logout Button - Only for authenticated users */}
        {!isGuest && (
        <View className="px-5 mb-2">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-orange-400 rounded-full py-4 items-center shadow-lg"
          >
            <Text className="text-white font-bold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Delete Account Button - Only for authenticated users */}
        {!isGuest && (
        <View className="px-5 mb-2">
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="bg-white rounded-full py-4 items-center"
            style={{
              borderWidth: 2,
              borderColor: '#F56B4C',
            }}
          >
            <Text className="font-bold text-lg" style={{ color: '#F56B4C' }}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        )}
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
            setActiveTab('home');
            navigation.navigate('Home');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'home' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'home' ? 16 : 8,
            marginLeft: -8,
            marginRight: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/house.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeTab === 'home' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'home' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'home' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Home
            </Text>
          )}
        </TouchableOpacity>

        {/* Orders Section */}
        <TouchableOpacity
          onPress={() => {
            if (isGuest) {
              // Prompt guest to login
              handleGuestLogin();
            } else {
              setActiveTab('orders');
              navigation.navigate('YourOrders');
            }
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'orders' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'orders' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/cart3.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeTab === 'orders' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'orders' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'orders' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Orders
            </Text>
          )}
        </TouchableOpacity>

        {/* On-Demand Icon */}
        <TouchableOpacity
          onPress={() => {
            setActiveTab('meals');
            navigation.navigate('OnDemand');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'meals' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'meals' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/kitchen.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeTab === 'meals' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'meals' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'meals' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              On-Demand
            </Text>
          )}
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'profile' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'profile' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/profile2.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeTab === 'profile' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'profile' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'profile' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Profile
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirmModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? Your account will be scheduled for deletion in 10 days."
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />

      {/* Success Modal */}
      <InfoModal
        visible={showSuccessModal}
        title="Account Deletion Scheduled"
        message={modalMessage}
        buttonText="OK"
        type="success"
        onClose={handleSuccessModalClose}
      />

      {/* Error Modal */}
      <InfoModal
        visible={showErrorModal}
        title="Error"
        message={modalMessage}
        buttonText="OK"
        type="error"
        onClose={() => setShowErrorModal(false)}
      />

      {/* Pause Auto-Ordering Modal */}
      <Modal visible={showPauseModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-3xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Pause Auto-Ordering
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-2">
              This will pause <Text className="font-semibold">all auto-orders</Text> (both lunch and dinner).
            </Text>
            <Text className="text-xs text-gray-500 text-center mb-4">
              Tip: To skip specific meals, use "Skip Next Meal" instead.
            </Text>

            {/* Pause Until Date (Optional) */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Resume automatically on (optional):
            </Text>
            <TextInput
              placeholder="YYYY-MM-DD (e.g., 2024-02-15)"
              value={pauseUntilDate}
              onChangeText={setPauseUntilDate}
              className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />

            {/* Pause Reason (Optional) */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Reason (optional):
            </Text>
            <TextInput
              placeholder="Why are you pausing? (optional)"
              value={pauseReason}
              onChangeText={setPauseReason}
              className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-gray-900"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
              maxLength={500}
            />

            {/* Buttons */}
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={() => {
                  setShowPauseModal(false);
                  setPauseReason('');
                  setPauseUntilDate('');
                }}
                className="flex-1 mr-2 bg-gray-100 rounded-full py-3 items-center"
              >
                <Text className="font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmPause}
                className="flex-1 ml-2 bg-orange-400 rounded-full py-3 items-center"
              >
                <Text className="font-semibold text-white">Pause</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Skip Meal Modal */}
      <Modal visible={showSkipMealModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-3xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Skip a Meal
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-4">
              Select the date and meal window you want to skip.
            </Text>

            {/* Skip Date */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Date to skip:
            </Text>
            <TextInput
              placeholder="YYYY-MM-DD (e.g., 2024-02-15)"
              value={skipMealDate}
              onChangeText={setSkipMealDate}
              className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />

            {/* Meal Window Selection */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Meal window:
            </Text>
            <View className="flex-row mb-4">
              <TouchableOpacity
                onPress={() => setSkipMealWindow('LUNCH')}
                className="flex-1 mr-2 rounded-full py-3 items-center"
                style={{
                  backgroundColor: skipMealWindow === 'LUNCH' ? '#F56B4C' : '#F3F4F6',
                }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: skipMealWindow === 'LUNCH' ? 'white' : '#6B7280' }}
                >
                  Lunch
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSkipMealWindow('DINNER')}
                className="flex-1 ml-2 rounded-full py-3 items-center"
                style={{
                  backgroundColor: skipMealWindow === 'DINNER' ? '#F56B4C' : '#F3F4F6',
                }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: skipMealWindow === 'DINNER' ? 'white' : '#6B7280' }}
                >
                  Dinner
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip Reason (Optional) */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Reason (optional):
            </Text>
            <TextInput
              placeholder="Why are you skipping? (optional)"
              value={skipMealReason}
              onChangeText={setSkipMealReason}
              className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-gray-900"
              placeholderTextColor="#9CA3AF"
              maxLength={200}
            />

            {/* Buttons */}
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={() => {
                  setShowSkipMealModal(false);
                  setSkipMealDate('');
                  setSkipMealReason('');
                }}
                className="flex-1 mr-2 bg-gray-100 rounded-full py-3 items-center"
              >
                <Text className="font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSkipMeal}
                disabled={!skipMealDate}
                className="flex-1 ml-2 bg-orange-400 rounded-full py-3 items-center"
                style={{ opacity: skipMealDate ? 1 : 0.5 }}
              >
                <Text className="font-semibold text-white">Skip Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AccountScreen;
