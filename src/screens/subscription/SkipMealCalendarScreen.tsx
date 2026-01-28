import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { StackScreenProps } from '@react-navigation/stack';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  formatShortDate,
  isMealSkipped,
  getMonthlySkippedCount,
  isPastDate,
} from '../../utils/autoOrderUtils';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

type Props = StackScreenProps<any, 'SkipMealCalendar'>;

const SkipMealCalendarScreen: React.FC<Props> = ({ route, navigation }) => {
  const { subscriptionId } = route.params || {};
  const { subscriptions, skipMeal, unskipMeal } = useSubscription();
  const { isSmallDevice } = useResponsive();

  // Find the subscription
  const subscription = subscriptions.find(s => s._id === subscriptionId);

  // State
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMealWindow, setSelectedMealWindow] = useState<'LUNCH' | 'DINNER' | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [panelHeight] = useState(new Animated.Value(0));

  // Check if selected meal is already skipped
  const isCurrentlySkipped = useMemo(() => {
    if (!subscription || !selectedDate || !selectedMealWindow) return false;
    return isMealSkipped(subscription, selectedDate, selectedMealWindow);
  }, [subscription, selectedDate, selectedMealWindow]);

  // Get monthly skipped count
  const monthlySkippedCount = subscription ? getMonthlySkippedCount(subscription) : 0;

  // Generate marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: any = {};

    if (subscription?.skippedSlots) {
      subscription.skippedSlots.forEach(slot => {
        const dateKey = slot.date.split('T')[0]; // Extract YYYY-MM-DD

        if (!marked[dateKey]) {
          marked[dateKey] = { dots: [], marked: true };
        }

        // Add dot for meal window
        marked[dateKey].dots.push({
          key: slot.mealWindow,
          color: slot.mealWindow === 'LUNCH' ? '#F56B4C' : '#3B82F6',
        });
      });
    }

    // Highlight selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#F56B4C',
      };
    }

    return marked;
  }, [subscription?.skippedSlots, selectedDate]);

  // Handle date selection
  const handleDatePress = useCallback((day: DateData) => {
    const dateStr = day.dateString;

    // Check if date is in the past
    if (isPastDate(dateStr)) {
      Alert.alert('Cannot Skip Past Date', 'You can only skip future meals.');
      return;
    }

    setSelectedDate(dateStr);
    setSelectedMealWindow(null);
    setSkipReason('');

    // Animate panel up
    Animated.spring(panelHeight, {
      toValue: 1,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [panelHeight]);

  // Handle skip meal
  const handleSkipMeal = async () => {
    if (!subscription || !selectedDate || !selectedMealWindow) {
      Alert.alert('Error', 'Please select a date and meal window');
      return;
    }

    setIsLoading(true);
    try {
      await skipMeal(subscription._id, {
        date: selectedDate,
        mealWindow: selectedMealWindow,
        reason: skipReason || undefined,
      });

      Alert.alert('Success', `${selectedMealWindow} on ${formatShortDate(selectedDate)} has been skipped`);
      setSkipReason('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to skip meal');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unskip meal
  const handleUnskipMeal = async () => {
    if (!subscription || !selectedDate || !selectedMealWindow) {
      Alert.alert('Error', 'Please select a date and meal window');
      return;
    }

    setIsLoading(true);
    try {
      await unskipMeal(subscription._id, {
        date: selectedDate,
        mealWindow: selectedMealWindow,
      });

      Alert.alert('Success', `${selectedMealWindow} on ${formatShortDate(selectedDate)} has been restored`);
      setSelectedMealWindow(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unskip meal');
    } finally {
      setIsLoading(false);
    }
  };

  // Close panel
  const closePanel = () => {
    Animated.spring(panelHeight, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
    setSelectedDate(null);
    setSelectedMealWindow(null);
    setSkipReason('');
  };

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container} className="flex-1 justify-center items-center bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
        <ActivityIndicator size="large" color="#F56B4C" />
        <Text className="mt-4 text-gray-600">Loading calendar...</Text>
      </SafeAreaView>
    );
  }

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
            className="items-center justify-center"
            style={{
              minWidth: TOUCH_TARGETS.minimum,
              minHeight: TOUCH_TARGETS.minimum,
            }}
          >
            <Image
              source={require('../../assets/icons/backarrow3.png')}
              style={{ width: SPACING.iconLg, height: SPACING.iconLg }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="font-bold text-white" style={{ fontSize: isSmallDevice ? FONT_SIZES.h4 : FONT_SIZES.h3 }}>Skip Meals</Text>
            <Text className="text-white/80 mt-1" style={{ fontSize: FONT_SIZES.xs }}>Tap a date to manage meals</Text>
          </View>
          <View style={{ minWidth: TOUCH_TARGETS.minimum }} />
        </View>
      </View>

      {/* Info Banner */}
      <View className="bg-blue-50 px-5 py-3 border-b border-blue-100">
        <Text className="text-blue-700" style={{ fontSize: FONT_SIZES.sm }}>
          💡 Tap any future date to skip lunch or dinner. You can unskip anytime.
        </Text>
      </View>

      <ScrollView className="flex-1 bg-gray-50">
        {/* Calendar */}
        <View className="bg-white m-4 rounded-2xl overflow-hidden shadow-sm">
          <Calendar
            current={new Date().toISOString().split('T')[0]}
            minDate={new Date().toISOString().split('T')[0]}
            markedDates={markedDates}
            onDayPress={handleDatePress}
            markingType={'multi-dot'}
            renderArrow={(direction) => direction === 'left' ? null : <Text style={{ color: '#F56B4C', fontSize: 18 }}>›</Text>}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#F56B4C',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#F56B4C',
              dayTextColor: '#1F2937',
              textDisabledColor: '#D1D5DB',
              dotColor: '#F56B4C',
              selectedDotColor: '#ffffff',
              arrowColor: '#F56B4C',
              monthTextColor: '#1F2937',
              textMonthFontWeight: 'bold' as any,
              textDayFontSize: 16,
              textMonthFontSize: 18,
            }}
          />

          {/* Legend */}
          <View className="px-5 py-4 border-t border-gray-100">
            <Text className="font-semibold text-gray-600 mb-2" style={{ fontSize: FONT_SIZES.xs }}>Legend:</Text>
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center mr-4">
                <View className="w-3 h-3 rounded-full bg-orange-400 mr-2" />
                <Text className="text-gray-600" style={{ fontSize: FONT_SIZES.xs }}>Lunch Skipped</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <Text className="text-gray-600" style={{ fontSize: FONT_SIZES.xs }}>Dinner Skipped</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Summary Card */}
        <View
          className="mx-4 mb-4 rounded-2xl overflow-hidden"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View
            className="p-5"
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Text style={{ fontSize: FONT_SIZES['2xl'], marginRight: SPACING.sm }}>{monthlySkippedCount > 0 ? '📊' : '✨'}</Text>
                  <Text className="font-bold text-gray-900" style={{ fontSize: FONT_SIZES.h4 }}>Monthly Summary</Text>
                </View>
                <Text className="text-gray-600" style={{ fontSize: FONT_SIZES.sm, lineHeight: FONT_SIZES.sm * 1.4 }}>
                  {monthlySkippedCount > 0 ? (
                    <>
                      You have skipped{' '}
                      <Text className="font-bold text-orange-600" style={{ fontSize: FONT_SIZES.base }}>{monthlySkippedCount}</Text>
                      {' '}meal{monthlySkippedCount > 1 ? 's' : ''} this month
                    </>
                  ) : (
                    <Text className="text-green-700">No meals skipped this month! 🎉</Text>
                  )}
                </Text>
              </View>
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: TOUCH_TARGETS.large,
                  height: TOUCH_TARGETS.large,
                  backgroundColor: monthlySkippedCount > 0 ? '#F56B4C' : '#10B981',
                }}
              >
                <Text className="font-bold text-white" style={{ fontSize: FONT_SIZES['2xl'] }}>{monthlySkippedCount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Panel Spacer */}
        {selectedDate && <View style={{ height: 400 }} />}
      </ScrollView>

      {/* Selected Date Panel */}
      {selectedDate && (
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{
                translateY: panelHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                }),
              }],
            },
          ]}
        >
          <View
            className="bg-white rounded-t-3xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {/* Handle */}
            <View className="items-center py-4">
              <View
                className="w-12 h-1.5 rounded-full"
                style={{ backgroundColor: '#D1D5DB' }}
              />
            </View>

            {/* Content */}
            <View className="px-6 pb-8">
              {/* Date Header */}
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-1">
                  <Text
                    className="font-bold"
                    style={{ fontSize: FONT_SIZES['2xl'], color: '#1F2937' }}
                  >
                    {formatShortDate(selectedDate)}
                  </Text>
                  <Text
                    className="mt-1"
                    style={{ fontSize: FONT_SIZES.sm, color: '#6B7280' }}
                  >
                    Select meal window to manage
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closePanel}
                  className="rounded-full items-center justify-center"
                  style={{
                    minWidth: TOUCH_TARGETS.minimum,
                    minHeight: TOUCH_TARGETS.minimum,
                    backgroundColor: '#F3F4F6'
                  }}
                >
                  <Text style={{ fontSize: FONT_SIZES.h4, color: '#6B7280' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Meal Window Selector */}
              <View className="flex-row mb-6" style={{ gap: SPACING.md }}>
                <TouchableOpacity
                  onPress={() => setSelectedMealWindow('LUNCH')}
                  className="flex-1 rounded-2xl"
                  style={{
                    padding: SPACING.lg,
                    minHeight: TOUCH_TARGETS.large,
                    borderWidth: 2,
                    borderColor: selectedMealWindow === 'LUNCH' ? '#F56B4C' : '#E5E7EB',
                    backgroundColor: selectedMealWindow === 'LUNCH' ? '#F56B4C' : '#FFFFFF',
                    shadowColor: selectedMealWindow === 'LUNCH' ? '#F56B4C' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selectedMealWindow === 'LUNCH' ? 0.25 : 0.05,
                    shadowRadius: 8,
                    elevation: selectedMealWindow === 'LUNCH' ? 4 : 2,
                  }}
                >
                  <Text className="text-center mb-2" style={{ fontSize: FONT_SIZES['3xl'] }}>🌞</Text>
                  <Text
                    className="font-bold text-center"
                    style={{ fontSize: FONT_SIZES.base, color: selectedMealWindow === 'LUNCH' ? '#FFFFFF' : '#374151' }}
                  >
                    Lunch
                  </Text>
                  {isMealSkipped(subscription, selectedDate, 'LUNCH') && (
                    <View
                      className="mt-2 px-2 py-1 rounded-full self-center"
                      style={{ backgroundColor: selectedMealWindow === 'LUNCH' ? 'rgba(255, 255, 255, 0.3)' : '#FED7AA' }}
                    >
                      <Text className="font-semibold" style={{ fontSize: FONT_SIZES.xs, color: selectedMealWindow === 'LUNCH' ? '#FFFFFF' : '#C2410C' }}>
                        Skipped
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedMealWindow('DINNER')}
                  className="flex-1 rounded-2xl"
                  style={{
                    padding: SPACING.lg,
                    minHeight: TOUCH_TARGETS.large,
                    borderWidth: 2,
                    borderColor: selectedMealWindow === 'DINNER' ? '#F56B4C' : '#E5E7EB',
                    backgroundColor: selectedMealWindow === 'DINNER' ? '#F56B4C' : '#FFFFFF',
                    shadowColor: selectedMealWindow === 'DINNER' ? '#F56B4C' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: selectedMealWindow === 'DINNER' ? 0.25 : 0.05,
                    shadowRadius: 8,
                    elevation: selectedMealWindow === 'DINNER' ? 4 : 2,
                  }}
                >
                  <Text className="text-center mb-2" style={{ fontSize: FONT_SIZES['3xl'] }}>🌙</Text>
                  <Text
                    className="font-bold text-center"
                    style={{ fontSize: FONT_SIZES.base, color: selectedMealWindow === 'DINNER' ? '#FFFFFF' : '#374151' }}
                  >
                    Dinner
                  </Text>
                  {isMealSkipped(subscription, selectedDate, 'DINNER') && (
                    <View
                      className="mt-2 px-2 py-1 rounded-full self-center"
                      style={{ backgroundColor: selectedMealWindow === 'DINNER' ? 'rgba(255, 255, 255, 0.3)' : '#BFDBFE' }}
                    >
                      <Text className="font-semibold" style={{ fontSize: FONT_SIZES.xs, color: selectedMealWindow === 'DINNER' ? '#FFFFFF' : '#1E40AF' }}>
                        Skipped
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Reason Input (only if not skipped) */}
              {selectedMealWindow && !isCurrentlySkipped && (
                <View className="mb-6">
                  <Text
                    className="font-bold mb-3"
                    style={{ fontSize: FONT_SIZES.sm, color: '#374151' }}
                  >
                    Reason (Optional)
                  </Text>
                  <TextInput
                    value={skipReason}
                    onChangeText={setSkipReason}
                    placeholder="e.g., Out of town, Office lunch"
                    placeholderTextColor="#9CA3AF"
                    maxLength={200}
                    className="rounded-xl"
                    style={{
                      paddingHorizontal: SPACING.lg,
                      paddingVertical: SPACING.md,
                      fontSize: FONT_SIZES.sm,
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1.5,
                      borderColor: '#E5E7EB',
                      color: '#1F2937',
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              {/* Action Button */}
              {selectedMealWindow && (
                <TouchableOpacity
                  onPress={isCurrentlySkipped ? handleUnskipMeal : handleSkipMeal}
                  disabled={isLoading}
                  className="rounded-2xl items-center justify-center"
                  style={{
                    paddingVertical: SPACING.md,
                    minHeight: TOUCH_TARGETS.large,
                    backgroundColor: isCurrentlySkipped ? '#10B981' : '#F56B4C',
                    shadowColor: isCurrentlySkipped ? '#10B981' : '#F56B4C',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-bold" style={{ fontSize: FONT_SIZES.h4 }}>
                      {isCurrentlySkipped
                        ? `✓ Restore ${selectedMealWindow}`
                        : `Skip ${selectedMealWindow}`}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default SkipMealCalendarScreen;
