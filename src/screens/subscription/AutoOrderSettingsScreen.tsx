import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAddress } from '../../context/AddressContext';
import {
  formatNextAutoOrderTime,
  getAutoOrderStatusText,
  formatShortDate,
  validateAutoOrderEnable,
} from '../../utils/autoOrderUtils';
import apiService from '../../services/api.service';

type Props = StackScreenProps<any, 'AutoOrderSettings'>;

const AutoOrderSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { subscriptionId } = route.params || {};
  const { subscriptions, updateAutoOrderSettings, pauseAutoOrdering, resumeAutoOrdering } = useSubscription();
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
      <View style={styles.container} className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#F56B4C" />
        <Text className="mt-4 text-gray-600">Loading subscription...</Text>
      </View>
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
        Alert.alert('Cannot Enable Auto-Ordering', validation.error);
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
      Alert.alert(
        'Success',
        value
          ? 'Auto-ordering has been enabled'
          : 'Auto-ordering has been disabled'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update auto-ordering');
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
        Alert.alert('Error', error.message || 'Failed to update meal preference');
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
      Alert.alert('Success', 'Auto-ordering has been paused');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pause auto-ordering');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resume
  const handleResume = async () => {
    setIsLoading(true);
    try {
      await resumeAutoOrdering(subscription._id);
      Alert.alert('Success', 'Auto-ordering has been resumed');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resume auto-ordering');
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
    <View style={styles.container} className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-orange-400 px-5 py-4" style={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <Image
              source={require('../../assets/icons/backarrow3.png')}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Auto-Order Settings</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}
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
            style={{
              backgroundColor: isEnabled ? '#F56B4C' : '#9CA3AF',
              padding: 20,
            }}
          >
            {/* Toggle Row */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-xl font-bold text-white mb-2">Auto-Ordering</Text>
                <Text className="text-sm text-white/90">
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
                <View className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-xs text-white/80 mb-1">Current Plan</Text>
                      <Text className="text-base font-bold text-white">
                        {getAutoOrderStatusText(subscription)}
                      </Text>
                    </View>
                    {!subscription.isPaused && (
                      <View className="bg-white/30 rounded-full px-3 py-1">
                        <Text className="text-xs font-semibold text-white">Active</Text>
                      </View>
                    )}
                  </View>

                  {/* Next Order Countdown */}
                  {!subscription.isPaused && (
                    <View className="pt-3 border-t border-white/20">
                      <Text className="text-xs text-white/80 mb-1">Next Auto-Order</Text>
                      <Text className="text-sm font-bold text-white">
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
            <Text className="text-xl font-bold text-gray-900">Choose Your Meals</Text>
          </View>
          <Text className="text-sm text-gray-600 mb-5 pl-1">
            Select which meals to auto-order daily
          </Text>

          {/* Lunch Card */}
          <TouchableOpacity
            onPress={() => handleMealTypeSelect('LUNCH')}
            disabled={isLoading}
            activeOpacity={0.7}
            className="mb-3"
          >
            <View
              className={`rounded-2xl p-5 ${
                selectedMealType === 'LUNCH' ? 'bg-white' : 'bg-white'
              }`}
              style={{
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
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: selectedMealType === 'LUNCH' ? '#FFF7ED' : '#F9FAFB' }}
                >
                  <Text className="text-2xl font-bold" style={{ color: selectedMealType === 'LUNCH' ? '#F97316' : '#9CA3AF' }}>
                    L
                  </Text>
                </View>

                {/* Content */}
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">Lunch Only</Text>
                  <Text className="text-xs text-gray-600">{getAutoOrderTimeDisplay('LUNCH')}</Text>
                </View>

                {/* Radio Button */}
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center ${
                    selectedMealType === 'LUNCH' ? 'bg-orange-400' : 'bg-gray-200'
                  }`}
                >
                  {selectedMealType === 'LUNCH' && (
                    <View className="w-3 h-3 rounded-full bg-white" />
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
            className="mb-3"
          >
            <View
              className={`rounded-2xl p-5 ${
                selectedMealType === 'DINNER' ? 'bg-white' : 'bg-white'
              }`}
              style={{
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
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: selectedMealType === 'DINNER' ? '#EDE9FE' : '#F9FAFB' }}
                >
                  <Text className="text-2xl font-bold" style={{ color: selectedMealType === 'DINNER' ? '#8B5CF6' : '#9CA3AF' }}>
                    D
                  </Text>
                </View>

                {/* Content */}
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">Dinner Only</Text>
                  <Text className="text-xs text-gray-600">{getAutoOrderTimeDisplay('DINNER')}</Text>
                </View>

                {/* Radio Button */}
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center ${
                    selectedMealType === 'DINNER' ? 'bg-orange-400' : 'bg-gray-200'
                  }`}
                >
                  {selectedMealType === 'DINNER' && (
                    <View className="w-3 h-3 rounded-full bg-white" />
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
              className={`rounded-2xl p-5 ${
                selectedMealType === 'BOTH' ? 'bg-white' : 'bg-white'
              }`}
              style={{
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
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: selectedMealType === 'BOTH' ? '#FEF3C7' : '#F9FAFB' }}
                >
                  <View className="flex-row items-center">
                    <Text className="text-lg font-bold" style={{ color: selectedMealType === 'BOTH' ? '#F97316' : '#9CA3AF' }}>
                      L
                    </Text>
                    <Text className="text-xs font-bold mx-0.5" style={{ color: selectedMealType === 'BOTH' ? '#D97706' : '#9CA3AF' }}>
                      +
                    </Text>
                    <Text className="text-lg font-bold" style={{ color: selectedMealType === 'BOTH' ? '#8B5CF6' : '#9CA3AF' }}>
                      D
                    </Text>
                  </View>
                </View>

                {/* Content */}
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">Both Meals</Text>
                  <Text className="text-xs text-gray-600">Lunch & Dinner daily</Text>
                </View>

                {/* Radio Button */}
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center ${
                    selectedMealType === 'BOTH' ? 'bg-orange-400' : 'bg-gray-200'
                  }`}
                >
                  {selectedMealType === 'BOTH' && (
                    <View className="w-3 h-3 rounded-full bg-white" />
                  )}
                </View>
              </View>

              {/* Popular Badge */}
              {selectedMealType === 'BOTH' && (
                <View className="mt-3 pt-3 border-t border-orange-100">
                  <View className="flex-row items-center">
                    <View className="bg-orange-100 rounded-full px-3 py-1">
                      <Text className="text-xs font-semibold text-orange-600">Most Popular</Text>
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
            <Text className="text-xl font-bold text-gray-900">Delivery Address</Text>
          </View>

          {defaultAddress ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Address')}
              activeOpacity={0.7}
              className="bg-white rounded-2xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-start">
                {/* Location Icon */}
                <View className="w-12 h-12 rounded-xl bg-orange-50 items-center justify-center mr-4">
                  <Image
                    source={require('../../assets/icons/address3.png')}
                    style={{ width: 24, height: 24, tintColor: '#F56B4C' }}
                    resizeMode="contain"
                  />
                </View>

                {/* Address Details */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-bold text-gray-900">
                      {defaultAddress.label || 'Home'}
                    </Text>
                    <Text className="text-gray-400 text-xl ml-2">›</Text>
                  </View>
                  <Text className="text-sm text-gray-600 leading-5" numberOfLines={2}>
                    {defaultAddress.flatNumber ? `${defaultAddress.flatNumber}, ` : ''}
                    {defaultAddress.street}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {defaultAddress.city}, {defaultAddress.pincode}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('Address')}
              activeOpacity={0.7}
              className="bg-orange-50 rounded-2xl p-6 border-2 border-dashed border-orange-200"
              style={{
                shadowColor: '#F56B4C',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="items-center">
                <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center mb-3">
                  <Image
                    source={require('../../assets/icons/address3.png')}
                    style={{ width: 28, height: 28, tintColor: '#F56B4C' }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-base font-bold text-gray-900 mb-1">Add Delivery Address</Text>
                <Text className="text-sm text-gray-600 text-center">
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
            <Text className="text-xl font-bold text-gray-900">Quick Actions</Text>
          </View>

          {/* Pause/Resume Button */}
          {!subscription.isPaused ? (
            <TouchableOpacity
              onPress={() => setShowPauseModal(true)}
              disabled={isLoading || !isEnabled}
              activeOpacity={0.7}
              className="mb-3"
            >
              <View
                className={`rounded-2xl p-5 ${
                  isEnabled ? 'bg-white' : 'bg-gray-50'
                }`}
                style={{
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
                    className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                      isEnabled ? 'bg-amber-50' : 'bg-gray-100'
                    }`}
                  >
                    <View className="flex-row">
                      <View className="w-1.5 h-4 rounded-full mr-1" style={{ backgroundColor: isEnabled ? '#F59E0B' : '#9CA3AF' }} />
                      <View className="w-1.5 h-4 rounded-full" style={{ backgroundColor: isEnabled ? '#F59E0B' : '#9CA3AF' }} />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-bold ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                      Pause Auto-Ordering
                    </Text>
                    <Text className={`text-xs mt-1 ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                      {isEnabled ? 'Temporarily stop automatic orders' : 'Enable auto-ordering first'}
                    </Text>
                  </View>
                  <Text className={`text-xl ${isEnabled ? 'text-amber-500' : 'text-gray-300'}`}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleResume}
              disabled={isLoading}
              activeOpacity={0.7}
              className="mb-3"
            >
              <View
                className="bg-white rounded-2xl p-5"
                style={{
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
                  <View className="w-12 h-12 rounded-xl bg-green-50 items-center justify-center mr-4">
                    <View style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 12,
                      borderRightWidth: 0,
                      borderTopWidth: 8,
                      borderBottomWidth: 8,
                      borderLeftColor: '#10B981',
                      borderRightColor: 'transparent',
                      borderTopColor: 'transparent',
                      borderBottomColor: 'transparent',
                      marginLeft: 2
                    }} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900">
                      Resume Auto-Ordering
                    </Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      Restart your automatic orders
                    </Text>
                  </View>
                  <Text className="text-xl text-green-500">›</Text>
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
              className={`rounded-2xl p-5 ${
                isEnabled ? 'bg-white' : 'bg-gray-50'
              }`}
              style={{
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
                  className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                    isEnabled ? 'bg-blue-50' : 'bg-gray-100'
                  }`}
                >
                  <View>
                    <View className="flex-row mb-0.5">
                      <View className="w-1 h-1 rounded-full mr-0.5" style={{ backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                      <View className="w-1 h-1 rounded-full mr-0.5" style={{ backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                      <View className="w-1 h-1 rounded-full mr-0.5" style={{ backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                      <View className="w-1 h-1 rounded-full mr-0.5" style={{ backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                      <View className="w-1 h-1 rounded-full" style={{ backgroundColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                    </View>
                    <View className="w-6 h-5 rounded border-2" style={{ borderColor: isEnabled ? '#3B82F6' : '#9CA3AF' }} />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-bold ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    Manage Skipped Meals
                  </Text>
                  <Text className={`text-xs mt-1 ${isEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                    {isEnabled ? 'Skip specific days when needed' : 'Enable auto-ordering first'}
                  </Text>
                </View>
                <Text className={`text-xl ${isEnabled ? 'text-blue-500' : 'text-gray-300'}`}>›</Text>
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
                <Text className="text-xl font-bold text-gray-900">Upcoming Skips</Text>
              </View>
              <View className="bg-orange-100 rounded-full px-3 py-1">
                <Text className="text-xs font-bold text-orange-600">
                  {subscription.skippedSlots.length}
                </Text>
              </View>
            </View>

            <View
              className="bg-white rounded-2xl p-4"
              style={{
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
                  className={`flex-row items-center py-3 ${
                    index < Math.min(2, subscription.skippedSlots.length - 1)
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <View
                    className="w-12 h-12 rounded-xl mr-3 items-center justify-center"
                    style={{ backgroundColor: slot.mealWindow === 'LUNCH' ? '#FFF7ED' : '#EDE9FE' }}
                  >
                    <Text className="text-2xl font-bold" style={{ color: slot.mealWindow === 'LUNCH' ? '#F97316' : '#8B5CF6' }}>
                      {slot.mealWindow === 'LUNCH' ? 'L' : 'D'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900">
                      {slot.mealWindow === 'LUNCH' ? 'Lunch' : 'Dinner'}
                    </Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      {formatShortDate(slot.date)}
                    </Text>
                    {slot.reason && (
                      <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
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
                  className="mt-3 pt-3 border-t border-gray-100"
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-sm font-semibold text-orange-400 mr-2">
                      View All {subscription.skippedSlots.length} Skips
                    </Text>
                    <Text className="text-orange-400">›</Text>
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
                Auto-ordering will be paused. You can resume anytime.
              </Text>

              {/* Pause indefinitely option */}
              <TouchableOpacity
                onPress={handlePause}
                disabled={isLoading}
                style={styles.modalButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#F56B4C" />
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
    </View>
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
