import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAddress } from '../../context/AddressContext';
import {
  formatNextAutoOrderTime,
  getAutoOrderStatusText,
  formatShortDate,
  validateAutoOrderEnable,
} from '../../utils/autoOrderUtils';
import apiService from '../../services/api.service';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive sizing helpers
const isSmallScreen = SCREEN_WIDTH < 375;
const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const scale = SCREEN_WIDTH / 375; // Base scale on iPhone SE size

const responsiveSize = (size: number) => Math.round(size * scale);
const responsiveFontSize = (size: number) => {
  if (isSmallScreen) return Math.round(size * 0.9);
  if (isMediumScreen) return size;
  return Math.round(size * 1.05);
};

type Props = StackScreenProps<any, 'AutoOrderSettings'>;

const AutoOrderSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { subscriptionId } = route.params || {};
  const { subscriptions, updateAutoOrderSettings, pauseAutoOrdering, resumeAutoOrdering, usableVouchers } = useSubscription();
  const { addresses, getMainAddress } = useAddress();

  // Find the subscription
  const subscription = subscriptions.find(s => s._id === subscriptionId);
  const defaultAddress = getMainAddress();

  // Local state
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'LUNCH' | 'DINNER' | 'BOTH'>('BOTH');
  const [isLoading, setIsLoading] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseDate, setPauseDate] = useState<Date | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [kitchenOperatingHours, setKitchenOperatingHours] = useState<any>(null);

  // Modal states for success and error messages
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Initialize state from subscription
  useEffect(() => {
    if (subscription) {
      setIsEnabled(subscription.autoOrderingEnabled || false);
      setSelectedMealType(subscription.defaultMealType || 'BOTH');
    }
  }, [subscription]);

  // Fetch kitchen operating hours
  useEffect(() => {
    const fetchKitchenOperatingHours = async () => {
      // Get kitchen ID from subscription (try different possible field names)
      const defaultKitchenId = (subscription as any)?.defaultKitchenId || (subscription as any)?.kitchenId;

      if (defaultKitchenId) {
        try {
          console.log('[AutoOrderSettingsScreen] Fetching operating hours for kitchen:', defaultKitchenId);
          const kitchenResponse = await apiService.getKitchenMenu(defaultKitchenId, 'MEAL_MENU');
          const kitchenData = (kitchenResponse as any)?.data?.kitchen || (kitchenResponse as any)?.kitchen;

          if (kitchenData?.operatingHours) {
            console.log('[AutoOrderSettingsScreen] Operating hours fetched:', kitchenData.operatingHours);
            setKitchenOperatingHours(kitchenData.operatingHours);
          }
        } catch (err) {
          console.log('[AutoOrderSettingsScreen] Failed to fetch kitchen operating hours:', err);
        }
      }
    };

    fetchKitchenOperatingHours();
  }, [subscription]);

  // Loading state
  if (!subscription) {
    return (
      <SafeAreaView style={styles.container} className="flex-1 justify-center items-center bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
        <ActivityIndicator size="large" color="#F56B4C" />
        <Text className="mt-4 text-gray-600">Loading subscription...</Text>
      </SafeAreaView>
    );
  }

  // Handle enable/disable toggle
  const handleToggleEnabled = async (value: boolean) => {
    // Validate before enabling
    if (value) {
      const validation = validateAutoOrderEnable(
        !!defaultAddress,
        !!selectedMealType
      );

      if (!validation.isValid) {
        setModalTitle('Cannot Enable Auto-Ordering');
        setModalMessage(validation.error);
        setShowErrorModal(true);
        return;
      }
    }

    setIsLoading(true);
    try {
      await updateAutoOrderSettings(subscription._id, {
        autoOrderingEnabled: value,
        defaultMealType: selectedMealType,
        defaultAddressId: defaultAddress?._id,
      });
      setIsEnabled(value);
      setModalTitle('Success');
      setModalMessage(
        value
          ? 'Auto-ordering has been enabled'
          : 'Auto-ordering has been disabled'
      );
      setShowSuccessModal(true);
    } catch (error: any) {
      setModalTitle('Error');
      setModalMessage(error.message || 'Failed to update auto-ordering');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle meal type selection
  const handleMealTypeSelect = async (mealType: 'LUNCH' | 'DINNER' | 'BOTH') => {
    setSelectedMealType(mealType);

    // Auto-save if already enabled
    if (isEnabled) {
      setIsLoading(true);
      try {
        await updateAutoOrderSettings(subscription._id, {
          autoOrderingEnabled: true,
          defaultMealType: mealType,
          defaultAddressId: defaultAddress?._id,
        });
      } catch (error: any) {
        setModalTitle('Error');
        setModalMessage(error.message || 'Failed to update meal preference');
        setShowErrorModal(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle pause
  const handlePause = async () => {
    setIsLoading(true);
    try {
      await pauseAutoOrdering(subscription._id, {
        pauseReason: pauseReason || undefined,
        pauseUntil: pauseDate?.toISOString(),
      });
      setShowPauseModal(false);
      setPauseReason('');
      setPauseDate(null);
      setModalTitle('Success');
      setModalMessage('Auto-ordering has been paused');
      setShowSuccessModal(true);
    } catch (error: any) {
      setModalTitle('Error');
      setModalMessage(error.message || 'Failed to pause auto-ordering');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resume
  const handleResume = async () => {
    setIsLoading(true);
    try {
      await resumeAutoOrdering(subscription._id);
      setModalTitle('Success');
      setModalMessage('Auto-ordering has been resumed');
      setShowSuccessModal(true);
    } catch (error: any) {
      setModalTitle('Error');
      setModalMessage(error.message || 'Failed to resume auto-ordering');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to skip meals calendar
  const navigateToSkipCalendar = () => {
    navigation.navigate('SkipMealCalendar', { subscriptionId: subscription._id });
  };

  // Helper to get auto-order time display for meal cards
  const getAutoOrderTimeDisplay = (mealType: 'LUNCH' | 'DINNER'): string => {
    if (!kitchenOperatingHours) {
      // Default times if operating hours not loaded yet
      return mealType === 'LUNCH' ? 'Daily at 10:00 AM' : 'Daily at 6:00 PM';
    }

    // Calculate auto-order time (1 hour before meal window start)
    const calculateAutoOrderTime = (startTime: string): string => {
      const [hoursStr, minutesStr] = startTime.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      // Subtract 1 hour
      hours -= 1;
      if (hours < 0) {
        hours = 23; // Wrap to previous day
      }

      // Format in 12-hour format
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');

      return `Daily at ${displayHours}:${displayMinutes} ${ampm}`;
    };

    if (mealType === 'LUNCH' && kitchenOperatingHours?.lunch?.startTime) {
      return calculateAutoOrderTime(kitchenOperatingHours.lunch.startTime);
    } else if (mealType === 'DINNER' && kitchenOperatingHours?.dinner?.startTime) {
      return calculateAutoOrderTime(kitchenOperatingHours.dinner.startTime);
    }

    // Fallback to defaults
    return mealType === 'LUNCH' ? 'Daily at 10:00 AM' : 'Daily at 6:00 PM';
  };

  return (
    <SafeAreaView style={styles.container} className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      {/* Header */}
      <View
        className="bg-orange-400 px-5 py-4"
        style={{
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30
        }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center"
          >
            <Image
              source={require('../../assets/icons/backarrow3.png')}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold text-white flex-1 text-center"
            numberOfLines={1}
          >
            Auto-Order Settings
          </Text>
          <View style={{ width: 34 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: 20
        }}
      >
        {/* Hero Status Card with Toggle */}
        <View
          className="mx-4 mb-5 rounded-3xl overflow-hidden"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* Gradient Background Effect */}
          <View
            className="p-5"
            style={{
              backgroundColor: isEnabled ? '#F56B4C' : '#9CA3AF',
            }}
          >
            {/* Toggle Row */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 mr-4">
                <Text
                  className="text-xl font-bold text-white mb-2"
                  numberOfLines={1}
                >
                  Auto-Ordering
                </Text>
                <Text
                  className="text-sm text-white opacity-90"
                  numberOfLines={2}
                >
                  {isEnabled ? 'Your meals are on autopilot' : 'Enable to automate your orders'}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: '#E5E7EB', true: '#ffffff40' }}
                thumbColor={'#ffffff'}
                disabled={isLoading}
                style={{ transform: [{ scale: 1.1 }] }}
              />
            </View>

            {/* Status Info */}
            {isEnabled && (
              <View className="mt-2">
                <View
                  className="bg-white/20 rounded-2xl p-4"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text
                        className="text-xs text-white/80 mb-1"
                      >
                        Current Plan
                      </Text>
                      <Text
                        className="text-base font-bold text-white"
                        numberOfLines={1}
                      >
                        {getAutoOrderStatusText(subscription)}
                      </Text>
                    </View>
                    {!subscription.isPaused && (
                      <View
                        className="rounded-full px-3 py-1"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        <Text
                          className="text-xs font-semibold text-white"
                        >
                          Active
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Next Order Countdown */}
                  {!subscription.isPaused && (
                    <View
                      className="pt-3 border-t border-white/20"
                    >
                      <Text
                        className="text-xs text-white/80 mb-1"
                      >
                        Next Auto-Order
                      </Text>
                      <Text
                        className="text-sm font-bold text-white"
                        numberOfLines={1}
                      >
                        {formatNextAutoOrderTime(subscription, kitchenOperatingHours)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Meal Preferences */}
        <View className="mx-4 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-2 h-6 bg-orange-400 rounded-full mr-3" />
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              Choose Your Meals
            </Text>
          </View>
          <Text className="text-sm text-gray-600 mb-5 pl-1" numberOfLines={2}>
            Select which meals to auto-order daily
          </Text>

          {/* Lunch Card */}
          <TouchableOpacity
            onPress={() => handleMealTypeSelect('LUNCH')}
            disabled={isLoading}
            activeOpacity={0.7}
            style={{ marginBottom: responsiveSize(12) }}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: responsiveSize(16),
                padding: responsiveSize(20),
                borderWidth: 2,
                borderColor: selectedMealType === 'LUNCH' ? '#F56B4C' : '#E5E7EB',
                shadowColor: selectedMealType === 'LUNCH' ? '#F56B4C' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: selectedMealType === 'LUNCH' ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: selectedMealType === 'LUNCH' ? 4 : 2,
              }}
            >
              <View className="flex-row items-center">
                {/* Icon */}
                <View
                  style={{
                    width: responsiveSize(56),
                    height: responsiveSize(56),
                    borderRadius: responsiveSize(16),
                    backgroundColor: selectedMealType === 'LUNCH' ? '#FFF7ED' : '#F9FAFB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: responsiveSize(16)
                  }}
                >
                  <MaterialCommunityIcons
                    name="white-balance-sunny"
                    size={responsiveFontSize(28)}
                    color={selectedMealType === 'LUNCH' ? '#F97316' : '#9CA3AF'}
                  />
                </View>

                {/* Content */}
                <View className="flex-1" style={{ marginRight: responsiveSize(8) }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(18),
                      fontWeight: 'bold',
                      color: '#111827',
                      marginBottom: responsiveSize(4)
                    }}
                    numberOfLines={1}
                  >
                    Lunch Only
                  </Text>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(12),
                      color: '#4B5563'
                    }}
                    numberOfLines={1}
                  >
                    {getAutoOrderTimeDisplay('LUNCH')}
                  </Text>
                </View>

                {/* Radio Button */}
                <View
                  style={{
                    width: responsiveSize(28),
                    height: responsiveSize(28),
                    borderRadius: 999,
                    backgroundColor: selectedMealType === 'LUNCH' ? '#F56B4C' : '#E5E7EB',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {selectedMealType === 'LUNCH' && (
                    <View
                      style={{
                        width: responsiveSize(12),
                        height: responsiveSize(12),
                        borderRadius: 999,
                        backgroundColor: 'white'
                      }}
                    />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Dinner Card */}
          <TouchableOpacity
            onPress={() => handleMealTypeSelect('DINNER')}
            disabled={isLoading}
            activeOpacity={0.7}
            style={{ marginBottom: responsiveSize(12) }}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: responsiveSize(16),
                padding: responsiveSize(20),
                borderWidth: 2,
                borderColor: selectedMealType === 'DINNER' ? '#F56B4C' : '#E5E7EB',
                shadowColor: selectedMealType === 'DINNER' ? '#F56B4C' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: selectedMealType === 'DINNER' ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: selectedMealType === 'DINNER' ? 4 : 2,
              }}
            >
              <View className="flex-row items-center">
                {/* Icon */}
                <View
                  style={{
                    width: responsiveSize(56),
                    height: responsiveSize(56),
                    borderRadius: responsiveSize(16),
                    backgroundColor: selectedMealType === 'DINNER' ? '#EDE9FE' : '#F9FAFB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: responsiveSize(16)
                  }}
                >
                  <MaterialCommunityIcons
                    name="moon-waning-crescent"
                    size={responsiveFontSize(28)}
                    color={selectedMealType === 'DINNER' ? '#8B5CF6' : '#9CA3AF'}
                  />
                </View>

                {/* Content */}
                <View className="flex-1" style={{ marginRight: responsiveSize(8) }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(18),
                      fontWeight: 'bold',
                      color: '#111827',
                      marginBottom: responsiveSize(4)
                    }}
                    numberOfLines={1}
                  >
                    Dinner Only
                  </Text>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(12),
                      color: '#4B5563'
                    }}
                    numberOfLines={1}
                  >
                    {getAutoOrderTimeDisplay('DINNER')}
                  </Text>
                </View>

                {/* Radio Button */}
                <View
                  style={{
                    width: responsiveSize(28),
                    height: responsiveSize(28),
                    borderRadius: 999,
                    backgroundColor: selectedMealType === 'DINNER' ? '#F56B4C' : '#E5E7EB',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {selectedMealType === 'DINNER' && (
                    <View
                      style={{
                        width: responsiveSize(12),
                        height: responsiveSize(12),
                        borderRadius: 999,
                        backgroundColor: 'white'
                      }}
                    />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Both Meals Card */}
          <TouchableOpacity
            onPress={() => handleMealTypeSelect('BOTH')}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: responsiveSize(16),
                padding: responsiveSize(20),
                borderWidth: 2,
                borderColor: selectedMealType === 'BOTH' ? '#F56B4C' : '#E5E7EB',
                shadowColor: selectedMealType === 'BOTH' ? '#F56B4C' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: selectedMealType === 'BOTH' ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: selectedMealType === 'BOTH' ? 4 : 2,
              }}
            >
              <View className="flex-row items-center">
                {/* Icon */}
                <View
                  style={{
                    width: responsiveSize(56),
                    height: responsiveSize(56),
                    borderRadius: responsiveSize(16),
                    backgroundColor: selectedMealType === 'BOTH' ? '#FEF3C7' : '#F9FAFB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: responsiveSize(16)
                  }}
                >
                  <MaterialCommunityIcons
                    name="food"
                    size={responsiveFontSize(28)}
                    color={selectedMealType === 'BOTH' ? '#D97706' : '#9CA3AF'}
                  />
                </View>

                {/* Content */}
                <View className="flex-1" style={{ marginRight: responsiveSize(8) }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(18),
                      fontWeight: 'bold',
                      color: '#111827',
                      marginBottom: responsiveSize(4)
                    }}
                    numberOfLines={1}
                  >
                    Both Meals
                  </Text>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(12),
                      color: '#4B5563'
                    }}
                    numberOfLines={1}
                  >
                    Lunch & Dinner daily
                  </Text>
                </View>

                {/* Radio Button */}
                <View
                  style={{
                    width: responsiveSize(28),
                    height: responsiveSize(28),
                    borderRadius: 999,
                    backgroundColor: selectedMealType === 'BOTH' ? '#F56B4C' : '#E5E7EB',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {selectedMealType === 'BOTH' && (
                    <View
                      style={{
                        width: responsiveSize(12),
                        height: responsiveSize(12),
                        borderRadius: 999,
                        backgroundColor: 'white'
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Popular Badge */}
              {selectedMealType === 'BOTH' && (
                <View
                  style={{
                    marginTop: responsiveSize(12),
                    paddingTop: responsiveSize(12),
                    borderTopWidth: 1,
                    borderTopColor: '#FED7AA'
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      style={{
                        backgroundColor: '#FFEDD5',
                        borderRadius: 999,
                        paddingHorizontal: responsiveSize(12),
                        paddingVertical: responsiveSize(4)
                      }}
                    >
                      <Text
                        style={{
                          fontSize: responsiveFontSize(12),
                          fontWeight: '600',
                          color: '#EA580C'
                        }}
                      >
                        Most Popular
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Default Address */}
        <View className="mx-4 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-2 h-6 bg-orange-400 rounded-full mr-3" />
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              Delivery Address
            </Text>
          </View>

          {defaultAddress ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Address')}
              activeOpacity={0.7}
              style={{
                backgroundColor: 'white',
                borderRadius: responsiveSize(16),
                padding: responsiveSize(20),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-start">
                {/* Location Icon */}
                <View
                  style={{
                    width: responsiveSize(48),
                    height: responsiveSize(48),
                    borderRadius: responsiveSize(12),
                    backgroundColor: '#FFF7ED',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: responsiveSize(16)
                  }}
                >
                  <Image
                    source={require('../../assets/icons/address3.png')}
                    style={{
                      width: responsiveSize(24),
                      height: responsiveSize(24),
                      tintColor: '#F56B4C'
                    }}
                    resizeMode="contain"
                  />
                </View>

                {/* Address Details */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between" style={{ marginBottom: responsiveSize(8) }}>
                    <Text
                      style={{
                        fontSize: responsiveFontSize(16),
                        fontWeight: 'bold',
                        color: '#111827',
                        flex: 1
                      }}
                    >
                      {defaultAddress.label || 'Home'}
                    </Text>
                    <Text
                      style={{
                        fontSize: responsiveFontSize(20),
                        color: '#9CA3AF',
                        marginLeft: responsiveSize(8)
                      }}
                    >
                      ›
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(14),
                      color: '#4B5563',
                      lineHeight: responsiveFontSize(20)
                    }}
                    numberOfLines={1}
                  >
                    {[defaultAddress.addressLine1, defaultAddress.addressLine2].filter(Boolean).join(', ')}
                  </Text>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(13),
                      color: '#6B7280',
                      marginTop: responsiveSize(4)
                    }}
                    numberOfLines={1}
                  >
                    {[defaultAddress.locality, defaultAddress.city, defaultAddress.state, defaultAddress.pincode].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('Address')}
              activeOpacity={0.7}
              style={{
                backgroundColor: '#FFF7ED',
                borderRadius: responsiveSize(16),
                padding: responsiveSize(24),
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#FED7AA',
                shadowColor: '#F56B4C',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="items-center">
                <View
                  style={{
                    width: responsiveSize(56),
                    height: responsiveSize(56),
                    borderRadius: 999,
                    backgroundColor: '#FFEDD5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: responsiveSize(12)
                  }}
                >
                  <Image
                    source={require('../../assets/icons/address3.png')}
                    style={{
                      width: responsiveSize(28),
                      height: responsiveSize(28),
                      tintColor: '#F56B4C'
                    }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={{
                    fontSize: responsiveFontSize(16),
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: responsiveSize(4)
                  }}
                  numberOfLines={1}
                >
                  Add Delivery Address
                </Text>
                <Text
                  style={{
                    fontSize: responsiveFontSize(14),
                    color: '#4B5563',
                    textAlign: 'center'
                  }}
                  numberOfLines={2}
                >
                  Set your default address for auto-orders
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-4 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-2 h-6 bg-orange-400 rounded-full mr-3" />
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              Quick Actions
            </Text>
          </View>

          {/* Pause/Resume Button */}
          {!subscription.isPaused ? (
            <TouchableOpacity
              onPress={() => setShowPauseModal(true)}
              disabled={isLoading || !isEnabled}
              activeOpacity={0.7}
              style={{ marginBottom: responsiveSize(12) }}
            >
              <View
                style={{
                  backgroundColor: isEnabled ? 'white' : '#F9FAFB',
                  borderRadius: responsiveSize(16),
                  padding: responsiveSize(20),
                  borderWidth: 2,
                  borderColor: isEnabled ? '#FBBF24' : '#E5E7EB',
                  shadowColor: isEnabled ? '#FBBF24' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isEnabled ? 0.15 : 0.05,
                  shadowRadius: 8,
                  elevation: isEnabled ? 3 : 1,
                }}
              >
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: responsiveSize(48),
                      height: responsiveSize(48),
                      borderRadius: responsiveSize(12),
                      backgroundColor: isEnabled ? '#FFFBEB' : '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: responsiveSize(16)
                    }}
                  >
                    <View className="flex-row">
                      <View
                        style={{
                          width: responsiveSize(6),
                          height: responsiveSize(16),
                          borderRadius: 999,
                          marginRight: responsiveSize(4),
                          backgroundColor: isEnabled ? '#F59E0B' : '#9CA3AF'
                        }}
                      />
                      <View
                        style={{
                          width: responsiveSize(6),
                          height: responsiveSize(16),
                          borderRadius: 999,
                          backgroundColor: isEnabled ? '#F59E0B' : '#9CA3AF'
                        }}
                      />
                    </View>
                  </View>
                  <View className="flex-1" style={{ marginRight: responsiveSize(8) }}>
                    <Text
                      style={{
                        fontSize: responsiveFontSize(16),
                        fontWeight: 'bold',
                        color: isEnabled ? '#111827' : '#9CA3AF'
                      }}
                      numberOfLines={1}
                    >
                      Pause Auto-Ordering
                    </Text>
                    <Text
                      style={{
                        fontSize: responsiveFontSize(12),
                        marginTop: responsiveSize(4),
                        color: isEnabled ? '#4B5563' : '#9CA3AF'
                      }}
                      numberOfLines={2}
                    >
                      {isEnabled ? 'Temporarily stop automatic orders' : 'Enable auto-ordering first'}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(20),
                      color: isEnabled ? '#F59E0B' : '#D1D5DB'
                    }}
                  >
                    ›
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleResume}
              disabled={isLoading}
              activeOpacity={0.7}
              style={{ marginBottom: responsiveSize(12) }}
            >
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: responsiveSize(16),
                  padding: responsiveSize(20),
                  borderWidth: 2,
                  borderColor: '#10B981',
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: responsiveSize(48),
                      height: responsiveSize(48),
                      borderRadius: responsiveSize(12),
                      backgroundColor: '#ECFDF5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: responsiveSize(16)
                    }}
                  >
                    <View style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: responsiveSize(12),
                      borderRightWidth: 0,
                      borderTopWidth: responsiveSize(8),
                      borderBottomWidth: responsiveSize(8),
                      borderLeftColor: '#10B981',
                      borderRightColor: 'transparent',
                      borderTopColor: 'transparent',
                      borderBottomColor: 'transparent',
                      marginLeft: responsiveSize(2)
                    }} />
                  </View>
                  <View className="flex-1" style={{ marginRight: responsiveSize(8) }}>
                    <Text
                      style={{
                        fontSize: responsiveFontSize(16),
                        fontWeight: 'bold',
                        color: '#111827'
                      }}
                      numberOfLines={1}
                    >
                      Resume Auto-Ordering
                    </Text>
                    <Text
                      style={{
                        fontSize: responsiveFontSize(12),
                        color: '#4B5563',
                        marginTop: responsiveSize(4)
                      }}
                      numberOfLines={1}
                    >
                      Restart your automatic orders
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(20),
                      color: '#10B981'
                    }}
                  >
                    ›
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Skip Meals Button */}
          <TouchableOpacity
            onPress={navigateToSkipCalendar}
            disabled={isLoading || !isEnabled}
            activeOpacity={0.7}
          >
            <View
              style={{
                backgroundColor: isEnabled ? 'white' : '#F9FAFB',
                borderRadius: responsiveSize(16),
                padding: responsiveSize(20),
                borderWidth: 2,
                borderColor: isEnabled ? '#3B82F6' : '#E5E7EB',
                shadowColor: isEnabled ? '#3B82F6' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isEnabled ? 0.15 : 0.05,
                shadowRadius: 8,
                elevation: isEnabled ? 3 : 1,
              }}
            >
              <View className="flex-row items-center">
                <View
                  style={{
                    width: responsiveSize(48),
                    height: responsiveSize(48),
                    borderRadius: responsiveSize(12),
                    backgroundColor: isEnabled ? '#EFF6FF' : '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: responsiveSize(16)
                  }}
                >
                  <View>
                    <View className="flex-row" style={{ marginBottom: responsiveSize(2) }}>
                      <View style={{ width: responsiveSize(4), height: responsiveSize(4), borderRadius: 999, marginRight: responsiveSize(2), backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                      <View style={{ width: responsiveSize(4), height: responsiveSize(4), borderRadius: 999, marginRight: responsiveSize(2), backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                      <View style={{ width: responsiveSize(4), height: responsiveSize(4), borderRadius: 999, marginRight: responsiveSize(2), backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                      <View style={{ width: responsiveSize(4), height: responsiveSize(4), borderRadius: 999, marginRight: responsiveSize(2), backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                      <View style={{ width: responsiveSize(4), height: responsiveSize(4), borderRadius: 999, backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                    </View>
                    <View
                      style={{
                        width: responsiveSize(24),
                        height: responsiveSize(20),
                        borderRadius: responsiveSize(4),
                        borderWidth: 2,
                        borderColor: isEnabled ? '#3B82F6' : '#9CA3AF'
                      }}
                    />
                  </View>
                </View>
                <View className="flex-1" style={{ marginRight: responsiveSize(8) }}>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(16),
                      fontWeight: 'bold',
                      color: isEnabled ? '#111827' : '#9CA3AF'
                    }}
                    numberOfLines={1}
                  >
                    Manage Skipped Meals
                  </Text>
                  <Text
                    style={{
                      fontSize: responsiveFontSize(12),
                      marginTop: responsiveSize(4),
                      color: isEnabled ? '#4B5563' : '#9CA3AF'
                    }}
                    numberOfLines={2}
                  >
                    {isEnabled ? 'Skip specific days when needed' : 'Enable auto-ordering first'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: responsiveFontSize(20),
                    color: isEnabled ? '#3B82F6' : '#D1D5DB'
                  }}
                >
                  ›
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Skipped Meals List (if any) */}
        {subscription.skippedSlots && subscription.skippedSlots.length > 0 && (
          <View className="mx-4 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-2 h-6 bg-orange-400 rounded-full mr-3" />
                <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                  Upcoming Skips
                </Text>
              </View>
              <View className="bg-orange-100 rounded-full px-3 py-1">
                <Text className="text-xs font-bold text-orange-600">
                  {subscription.skippedSlots.length}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: 'white',
                borderRadius: responsiveSize(16),
                padding: responsiveSize(16),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {subscription.skippedSlots.slice(0, 3).map((slot, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: responsiveSize(12),
                    borderBottomWidth: index < Math.min(2, subscription.skippedSlots.length - 1) ? 1 : 0,
                    borderBottomColor: '#F3F4F6'
                  }}
                >
                  <View
                    style={{
                      width: responsiveSize(48),
                      height: responsiveSize(48),
                      borderRadius: responsiveSize(12),
                      backgroundColor: slot.mealWindow === 'LUNCH' ? '#FFF7ED' : '#EDE9FE',
                      marginRight: responsiveSize(12),
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Text
                      style={{
                        fontSize: responsiveFontSize(24),
                        fontWeight: 'bold',
                        color: slot.mealWindow === 'LUNCH' ? '#F97316' : '#8B5CF6'
                      }}
                    >
                      {slot.mealWindow === 'LUNCH' ? 'L' : 'D'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{
                        fontSize: responsiveFontSize(14),
                        fontWeight: 'bold',
                        color: '#111827'
                      }}
                      numberOfLines={1}
                    >
                      {slot.mealWindow === 'LUNCH' ? 'Lunch' : 'Dinner'}
                    </Text>
                    <Text
                      style={{
                        fontSize: responsiveFontSize(12),
                        color: '#4B5563',
                        marginTop: responsiveSize(4)
                      }}
                      numberOfLines={1}
                    >
                      {formatShortDate(slot.date)}
                    </Text>
                    {slot.reason && (
                      <Text
                        style={{
                          fontSize: responsiveFontSize(12),
                          color: '#6B7280',
                          marginTop: responsiveSize(4)
                        }}
                        numberOfLines={1}
                      >
                        {slot.reason}
                      </Text>
                    )}
                  </View>
                </View>
              ))}

              {subscription.skippedSlots.length > 3 && (
                <TouchableOpacity
                  onPress={navigateToSkipCalendar}
                  activeOpacity={0.7}
                  style={{
                    marginTop: responsiveSize(12),
                    paddingTop: responsiveSize(12),
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6'
                  }}
                >
                  <View className="flex-row items-center justify-center">
                    <Text
                      style={{
                        fontSize: responsiveFontSize(14),
                        fontWeight: '600',
                        color: '#F56B4C',
                        marginRight: responsiveSize(8)
                      }}
                    >
                      View All {subscription.skippedSlots.length} Skips
                    </Text>
                    <Text style={{ color: '#F56B4C', fontSize: responsiveFontSize(16) }}>›</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pause Modal */}
      <Modal
        visible={showPauseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPauseModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowPauseModal(false)}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Pause Auto-Ordering</Text>
              <Text style={styles.modalMessage}>
                This will pause all auto-orders (both lunch and dinner). You can resume anytime.
              </Text>
              <Text className="text-xs text-gray-400 text-center mb-4">
                Tip: To skip specific meals, use "Manage Skipped Meals" instead.
              </Text>

              {/* Pause indefinitely option */}
              <TouchableOpacity
                onPress={handlePause}
                disabled={isLoading}
                style={styles.modalButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Pause Indefinitely</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowPauseModal(false)}
                style={[styles.modalButton, styles.modalButtonSecondary]}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F56B4C" />
            <Text style={styles.loadingText}>Updating...</Text>
          </View>
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSuccessModal(false)}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
              <TouchableOpacity
                onPress={() => setShowSuccessModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowErrorModal(false)}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
              <TouchableOpacity
                onPress={() => setShowErrorModal(false)}
                style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#F56B4C',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  modalButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AutoOrderSettingsScreen;
