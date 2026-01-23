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

  // Initialize state from subscription
  useEffect(() => {
    if (subscription) {
      setIsEnabled(subscription.autoOrderingEnabled || false);
      setSelectedMealType(subscription.defaultMealType || 'BOTH');
    }
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

  return (
    <View style={styles.container} className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-xl text-gray-700">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Auto-Order Settings</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Status Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          {/* Enable/Disable Toggle */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">Enable Auto-Ordering</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Automatically place orders using your vouchers
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={isEnabled ? '#F56B4C' : '#f4f3f4'}
              disabled={isLoading}
            />
          </View>

          {/* Status Display */}
          <View className="bg-gray-50 rounded-xl p-3 mb-3">
            <Text className="text-xs text-gray-500 mb-1">Current Status</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {getAutoOrderStatusText(subscription)}
            </Text>
          </View>

          {/* Next Auto-Order (if active) */}
          {isEnabled && !subscription.isPaused && (
            <View className="bg-orange-50 rounded-xl p-3">
              <Text className="text-xs text-orange-600 mb-1">⏰ Next Auto-Order</Text>
              <Text className="text-base font-bold text-orange-700">
                {formatNextAutoOrderTime(subscription)}
              </Text>
            </View>
          )}
        </View>

        {/* Meal Preferences */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">Meal Preferences</Text>
          <Text className="text-sm text-gray-600 mb-4">
            Select which meals to auto-order
          </Text>

          <View className="space-y-3">
            {/* Lunch Option */}
            <TouchableOpacity
              onPress={() => handleMealTypeSelect('LUNCH')}
              disabled={isLoading}
              className={`flex-row items-center p-4 rounded-xl border-2 ${
                selectedMealType === 'LUNCH'
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                  selectedMealType === 'LUNCH'
                    ? 'border-orange-400 bg-orange-400'
                    : 'border-gray-300'
                }`}
              >
                {selectedMealType === 'LUNCH' && (
                  <View className="w-3 h-3 rounded-full bg-white" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">🌞 Lunch Only</Text>
                <Text className="text-xs text-gray-600 mt-1">Orders placed at 10:00 AM</Text>
              </View>
            </TouchableOpacity>

            {/* Dinner Option */}
            <TouchableOpacity
              onPress={() => handleMealTypeSelect('DINNER')}
              disabled={isLoading}
              className={`flex-row items-center p-4 rounded-xl border-2 ${
                selectedMealType === 'DINNER'
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                  selectedMealType === 'DINNER'
                    ? 'border-orange-400 bg-orange-400'
                    : 'border-gray-300'
                }`}
              >
                {selectedMealType === 'DINNER' && (
                  <View className="w-3 h-3 rounded-full bg-white" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">🌙 Dinner Only</Text>
                <Text className="text-xs text-gray-600 mt-1">Orders placed at 7:00 PM</Text>
              </View>
            </TouchableOpacity>

            {/* Both Option */}
            <TouchableOpacity
              onPress={() => handleMealTypeSelect('BOTH')}
              disabled={isLoading}
              className={`flex-row items-center p-4 rounded-xl border-2 ${
                selectedMealType === 'BOTH'
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                  selectedMealType === 'BOTH'
                    ? 'border-orange-400 bg-orange-400'
                    : 'border-gray-300'
                }`}
              >
                {selectedMealType === 'BOTH' && (
                  <View className="w-3 h-3 rounded-full bg-white" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">☀️ Both Meals</Text>
                <Text className="text-xs text-gray-600 mt-1">Lunch and Dinner</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Default Address */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-3">Default Address</Text>

          {defaultAddress ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Address')}
              className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Text className="text-base font-semibold text-gray-900">
                    🏠 {defaultAddress.label || 'Home'}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600" numberOfLines={2}>
                  {defaultAddress.flatNumber ? `${defaultAddress.flatNumber}, ` : ''}
                  {defaultAddress.street}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {defaultAddress.city}, {defaultAddress.pincode}
                </Text>
              </View>
              <Text className="text-gray-400 ml-2">›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('Address')}
              className="p-4 bg-orange-50 rounded-xl border-2 border-dashed border-orange-300"
            >
              <Text className="text-center text-orange-600 font-semibold">
                + Add Delivery Address
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>

          {/* Pause/Resume Button */}
          {!subscription.isPaused ? (
            <TouchableOpacity
              onPress={() => setShowPauseModal(true)}
              disabled={isLoading || !isEnabled}
              className={`flex-row items-center justify-center p-4 rounded-xl mb-3 ${
                isEnabled ? 'bg-amber-50 border-2 border-amber-200' : 'bg-gray-100'
              }`}
            >
              <Text className={`text-base font-semibold ${isEnabled ? 'text-amber-700' : 'text-gray-400'}`}>
                ⏸️ Pause Auto-Ordering
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleResume}
              disabled={isLoading}
              className="flex-row items-center justify-center p-4 rounded-xl bg-green-50 border-2 border-green-200 mb-3"
            >
              <Text className="text-base font-semibold text-green-700">
                ▶️ Resume Auto-Ordering
              </Text>
            </TouchableOpacity>
          )}

          {/* Skip Meals Button */}
          <TouchableOpacity
            onPress={navigateToSkipCalendar}
            disabled={isLoading || !isEnabled}
            className={`flex-row items-center justify-center p-4 rounded-xl ${
              isEnabled ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-100'
            }`}
          >
            <Text className={`text-base font-semibold ${isEnabled ? 'text-blue-700' : 'text-gray-400'}`}>
              📅 Manage Skipped Meals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skipped Meals List (if any) */}
        {subscription.skippedSlots && subscription.skippedSlots.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Skipped Meals ({subscription.skippedSlots.length})
            </Text>

            {subscription.skippedSlots.slice(0, 3).map((slot, index) => (
              <View
                key={index}
                className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
              >
                <Text className="text-xl mr-3">{slot.mealWindow === 'LUNCH' ? '🌞' : '🌙'}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {formatShortDate(slot.date)} - {slot.mealWindow}
                  </Text>
                  {slot.reason && (
                    <Text className="text-xs text-gray-500 mt-1">{slot.reason}</Text>
                  )}
                </View>
              </View>
            ))}

            {subscription.skippedSlots.length > 3 && (
              <TouchableOpacity
                onPress={navigateToSkipCalendar}
                className="mt-3"
              >
                <Text className="text-center text-orange-500 font-semibold">
                  View all ({subscription.skippedSlots.length})
                </Text>
              </TouchableOpacity>
            )}
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
