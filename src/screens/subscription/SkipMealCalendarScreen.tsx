import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,

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
import type { AutoOrderScheduleDay } from '../../services/api.service';
import {
  formatShortDate,
  isPastDate,
} from '../../utils/autoOrderUtils';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

import { MainTabParamList } from '../../types/navigation';

type Props = StackScreenProps<MainTabParamList, 'SkipMealCalendar'>;

const SkipMealCalendarScreen: React.FC<Props> = ({ route, navigation }) => {
  const addressId = route.params.addressId;
  const { subscriptions, skipMeal, unskipMeal, getScheduleForAddress } = useSubscription();
  const { isSmallDevice } = useResponsive();

  // Find the active subscription
  const subscription = subscriptions.find(s => s.status === 'ACTIVE');

  // State
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMealWindow, setSelectedMealWindow] = useState<'LUNCH' | 'DINNER' | null>(null);
  const [schedule, setSchedule] = useState<AutoOrderScheduleDay[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [panelHeight] = useState(new Animated.Value(0));

  // Fetch 14-day schedule from API
  const fetchSchedule = useCallback(async () => {
    try {
      setScheduleLoading(true);
      const response = await getScheduleForAddress(addressId);
      // Only populate schedule if auto-ordering is actually enabled
      if (response.success && response.data?.schedule && response.data?.autoOrderingEnabled) {
        setSchedule(response.data.schedule);
      } else {
        setSchedule([]);
      }
    } catch (err) {
      console.log('[SkipMealCalendar] Failed to fetch schedule:', err);
    } finally {
      setScheduleLoading(false);
    }
  }, [getScheduleForAddress, addressId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Helper to get schedule day data for a date
  const getScheduleDay = useCallback((dateStr: string): AutoOrderScheduleDay | undefined => {
    return schedule.find(d => d.date === dateStr);
  }, [schedule]);

  // Check if selected meal is already skipped (using schedule API data)
  const isCurrentlySkipped = useMemo(() => {
    if (!selectedDate || !selectedMealWindow) return false;
    const day = getScheduleDay(selectedDate);
    if (!day) return false;
    const slot = selectedMealWindow === 'LUNCH' ? day.lunch : day.dinner;
    return slot?.skipped === true;
  }, [selectedDate, selectedMealWindow, getScheduleDay]);

  // Check if meal is scheduled (active for auto-order)
  const isSlotScheduled = useCallback((dateStr: string, mealWindow: 'LUNCH' | 'DINNER'): boolean => {
    const day = getScheduleDay(dateStr);
    if (!day) return false;
    const slot = mealWindow === 'LUNCH' ? day.lunch : day.dinner;
    return slot?.scheduled === true;
  }, [getScheduleDay]);

  // Check if meal is skipped
  const isSlotSkipped = useCallback((dateStr: string, mealWindow: 'LUNCH' | 'DINNER'): boolean => {
    const day = getScheduleDay(dateStr);
    if (!day) return false;
    const slot = mealWindow === 'LUNCH' ? day.lunch : day.dinner;
    return slot?.skipped === true;
  }, [getScheduleDay]);

  // Get skipped count from schedule data
  const monthlySkippedCount = useMemo(() => {
    let count = 0;
    schedule.forEach(day => {
      if (day.lunch?.skipped) count++;
      if (day.dinner?.skipped) count++;
    });
    return count;
  }, [schedule]);

  // Generate marked dates for calendar from schedule data
  const markedDates = useMemo(() => {
    const marked: any = {};

    schedule.forEach(day => {
      const dateKey = day.date;

      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [], marked: true };
      }

      // Active scheduled slots get green dots
      if (day.lunch?.scheduled && !day.lunch?.skipped) {
        marked[dateKey].dots.push({ key: 'lunch-active', color: '#10B981' });
      }
      if (day.dinner?.scheduled && !day.dinner?.skipped) {
        marked[dateKey].dots.push({ key: 'dinner-active', color: '#10B981' });
      }

      // Skipped slots get orange/blue dots
      if (day.lunch?.skipped) {
        marked[dateKey].dots.push({ key: 'lunch-skipped', color: '#ff8800' });
      }
      if (day.dinner?.skipped) {
        marked[dateKey].dots.push({ key: 'dinner-skipped', color: '#3B82F6' });
      }
    });

    // Highlight selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#ff8800',
      };
    }

    return marked;
  }, [schedule, selectedDate]);

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
      await skipMeal({
        addressId,
        date: selectedDate,
        mealWindow: selectedMealWindow,
      });

      Alert.alert('Success', `${selectedMealWindow} on ${formatShortDate(selectedDate)} has been skipped`);
      // Refresh schedule to reflect changes
      fetchSchedule();
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
      await unskipMeal({
        addressId,
        date: selectedDate,
        mealWindow: selectedMealWindow,
      });

      Alert.alert('Success', `${selectedMealWindow} on ${formatShortDate(selectedDate)} has been restored`);
      setSelectedMealWindow(null);
      // Refresh schedule to reflect changes
      fetchSchedule();
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
  };

  if (!subscription || scheduleLoading) {
    return (
      <View style={styles.container} className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#ff8800" />
        <SafeAreaView style={{ backgroundColor: '#ff8800' }} edges={['top']} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ff8800" />
          <Text className="mt-4 text-gray-600">Loading calendar...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#ff8800" />
      <SafeAreaView style={{ backgroundColor: '#ff8800' }} edges={['top']} />
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
            <Text className="font-bold text-white" style={{ fontSize: FONT_SIZES.h4 }}>Skip Meals</Text>
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
            renderArrow={(direction) => direction === 'left' ? null : <Text style={{ color: '#ff8800', fontSize: 18 }}>›</Text>}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#ff8800',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ff8800',
              dayTextColor: '#1F2937',
              textDisabledColor: '#D1D5DB',
              dotColor: '#ff8800',
              selectedDotColor: '#ffffff',
              arrowColor: '#ff8800',
              monthTextColor: '#1F2937',
              textMonthFontWeight: 'bold' as any,
              textDayFontSize: 16,
              textMonthFontSize: 18,
            }}
          />

          {/* Legend */}
          <View className="px-5 py-4 border-t border-gray-100">
            <Text className="font-semibold text-gray-600 mb-2" style={{ fontSize: FONT_SIZES.xs }}>Legend:</Text>
            <View className="flex-row items-center flex-wrap" style={{ gap: SPACING.md }}>
              <View className="flex-row items-center">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginRight: 6 }} />
                <Text className="text-gray-600" style={{ fontSize: FONT_SIZES.xs }}>Active</Text>
              </View>
              <View className="flex-row items-center">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff8800', marginRight: 6 }} />
                <Text className="text-gray-600" style={{ fontSize: FONT_SIZES.xs }}>Lunch Skipped</Text>
              </View>
              <View className="flex-row items-center">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', marginRight: 6 }} />
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
                  backgroundColor: monthlySkippedCount > 0 ? '#ff8800' : '#10B981',
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
                {(() => {
                  const lunchScheduled = selectedDate ? isSlotScheduled(selectedDate, 'LUNCH') : false;
                  const lunchSkipped = selectedDate ? isSlotSkipped(selectedDate, 'LUNCH') : false;
                  return (
                    <TouchableOpacity
                      onPress={() => lunchScheduled ? setSelectedMealWindow('LUNCH') : null}
                      disabled={!lunchScheduled}
                      className="flex-1 rounded-2xl"
                      style={{
                        padding: SPACING.lg,
                        minHeight: TOUCH_TARGETS.large,
                        borderWidth: 2,
                        borderColor: !lunchScheduled ? '#E5E7EB' : selectedMealWindow === 'LUNCH' ? '#ff8800' : '#E5E7EB',
                        backgroundColor: !lunchScheduled ? '#F9FAFB' : selectedMealWindow === 'LUNCH' ? '#ff8800' : '#FFFFFF',
                        opacity: lunchScheduled ? 1 : 0.5,
                        shadowColor: selectedMealWindow === 'LUNCH' ? '#ff8800' : '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: selectedMealWindow === 'LUNCH' ? 0.25 : 0.05,
                        shadowRadius: 8,
                        elevation: selectedMealWindow === 'LUNCH' ? 4 : 2,
                      }}
                    >
                      <Text className="text-center mb-2" style={{ fontSize: FONT_SIZES['3xl'] }}>🌞</Text>
                      <Text
                        className="font-bold text-center"
                        style={{ fontSize: FONT_SIZES.base, color: !lunchScheduled ? '#9CA3AF' : selectedMealWindow === 'LUNCH' ? '#FFFFFF' : '#374151' }}
                      >
                        Lunch
                      </Text>
                      {!lunchScheduled && (
                        <View className="mt-2 px-2 py-1 rounded-full self-center" style={{ backgroundColor: '#F3F4F6' }}>
                          <Text className="font-semibold" style={{ fontSize: FONT_SIZES.xs, color: '#9CA3AF' }}>Not scheduled</Text>
                        </View>
                      )}
                      {lunchSkipped && (
                        <View
                          className="mt-2 px-2 py-1 rounded-full self-center"
                          style={{ backgroundColor: selectedMealWindow === 'LUNCH' ? 'rgba(255, 255, 255, 0.3)' : '#FED7AA' }}
                        >
                          <Text className="font-semibold" style={{ fontSize: FONT_SIZES.xs, color: selectedMealWindow === 'LUNCH' ? '#FFFFFF' : '#C2410C' }}>
                            Skipped
                          </Text>
                        </View>
                      )}
                      {lunchScheduled && !lunchSkipped && (
                        <View
                          className="mt-2 px-2 py-1 rounded-full self-center"
                          style={{ backgroundColor: selectedMealWindow === 'LUNCH' ? 'rgba(255, 255, 255, 0.3)' : '#D1FAE5' }}
                        >
                          <Text className="font-semibold" style={{ fontSize: FONT_SIZES.xs, color: selectedMealWindow === 'LUNCH' ? '#FFFFFF' : '#047857' }}>
                            Active
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })()}

                {(() => {
                  const dinnerScheduled = selectedDate ? isSlotScheduled(selectedDate, 'DINNER') : false;
                  const dinnerSkipped = selectedDate ? isSlotSkipped(selectedDate, 'DINNER') : false;
                  return (
                    <TouchableOpacity
                      onPress={() => dinnerScheduled ? setSelectedMealWindow('DINNER') : null}
                      disabled={!dinnerScheduled}
                      className="flex-1 rounded-2xl"
                      style={{
                        padding: SPACING.lg,
                        minHeight: TOUCH_TARGETS.large,
                        borderWidth: 2,
                        borderColor: !dinnerScheduled ? '#E5E7EB' : selectedMealWindow === 'DINNER' ? '#ff8800' : '#E5E7EB',
                        backgroundColor: !dinnerScheduled ? '#F9FAFB' : selectedMealWindow === 'DINNER' ? '#ff8800' : '#FFFFFF',
                        opacity: dinnerScheduled ? 1 : 0.5,
                        shadowColor: selectedMealWindow === 'DINNER' ? '#ff8800' : '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: selectedMealWindow === 'DINNER' ? 0.25 : 0.05,
                        shadowRadius: 8,
                        elevation: selectedMealWindow === 'DINNER' ? 4 : 2,
                      }}
                    >
                      <Text className="text-center mb-2" style={{ fontSize: FONT_SIZES['3xl'] }}>🌙</Text>
                      <Text
                        className="font-bold text-center"
                        style={{ fontSize: FONT_SIZES.base, color: !dinnerScheduled ? '#9CA3AF' : selectedMealWindow === 'DINNER' ? '#FFFFFF' : '#374151' }}
                      >
                        Dinner
                      </Text>
                      {!dinnerScheduled && (
                        <View className="mt-2 px-2 py-1 rounded-full self-center" style={{ backgroundColor: '#F3F4F6' }}>
                          <Text className="font-semibold" style={{ fontSize: FONT_SIZES.xs, color: '#9CA3AF' }}>Not scheduled</Text>
                        </View>
                      )}
                      {dinnerSkipped && (
                        <View
                          className="mt-2 px-2 py-1 rounded-full self-center"
                          style={{ backgroundColor: selectedMealWindow === 'DINNER' ? 'rgba(255, 255, 255, 0.3)' : '#BFDBFE' }}
                        >
                          <Text className="font-semibold" style={{ fontSize: FONT_SIZES.xs, color: selectedMealWindow === 'DINNER' ? '#FFFFFF' : '#1E40AF' }}>
                            Skipped
                          </Text>
                        </View>
                      )}
                      {dinnerScheduled && !dinnerSkipped && (
                        <View
                          className="mt-2 px-2 py-1 rounded-full self-center"
                          style={{ backgroundColor: selectedMealWindow === 'DINNER' ? 'rgba(255, 255, 255, 0.3)' : '#D1FAE5' }}
                        >
                          <Text className="font-semibold" style={{ fontSize: FONT_SIZES.xs, color: selectedMealWindow === 'DINNER' ? '#FFFFFF' : '#047857' }}>
                            Active
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })()}
              </View>

              {/* Action Button */}
              {selectedMealWindow && (
                <TouchableOpacity
                  onPress={isCurrentlySkipped ? handleUnskipMeal : handleSkipMeal}
                  disabled={isLoading}
                  className="rounded-2xl items-center justify-center"
                  style={{
                    paddingVertical: SPACING.md,
                    minHeight: TOUCH_TARGETS.large,
                    backgroundColor: isCurrentlySkipped ? '#10B981' : '#ff8800',
                    shadowColor: isCurrentlySkipped ? '#10B981' : '#ff8800',
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
                        ? `Restore ${selectedMealWindow}`
                        : `Skip ${selectedMealWindow}`}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
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
