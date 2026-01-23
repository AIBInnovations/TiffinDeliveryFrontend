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
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { StackScreenProps } from '@react-navigation/stack';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  formatShortDate,
  isMealSkipped,
  getMonthlySkippedCount,
  isPastDate,
} from '../../utils/autoOrderUtils';

type Props = StackScreenProps<any, 'SkipMealCalendar'>;

const SkipMealCalendarScreen: React.FC<Props> = ({ route, navigation }) => {
  const { subscriptionId } = route.params || {};
  const { subscriptions, skipMeal, unskipMeal } = useSubscription();

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
      <View style={styles.container} className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#F56B4C" />
        <Text className="mt-4 text-gray-600">Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-xl text-gray-700">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">Skip Meals</Text>
              <Text className="text-xs text-gray-500 mt-1">Tap a date to manage meals</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Banner */}
      <View className="bg-blue-50 px-5 py-3 border-b border-blue-100">
        <Text className="text-sm text-blue-700">
          💡 Tap any future date to skip lunch or dinner. You can unskip anytime.
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Calendar */}
        <View className="bg-white m-4 rounded-2xl overflow-hidden shadow-sm">
          <Calendar
            current={new Date().toISOString().split('T')[0]}
            minDate={new Date().toISOString().split('T')[0]}
            markedDates={markedDates}
            onDayPress={handleDatePress}
            markingType={'multi-dot'}
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
            <Text className="text-xs font-semibold text-gray-600 mb-2">Legend:</Text>
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center mr-4">
                <View className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
                <Text className="text-xs text-gray-600">Lunch Skipped</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <Text className="text-xs text-gray-600">Dinner Skipped</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Summary Card */}
        <View className="bg-white mx-4 mb-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-2">Summary</Text>
          <Text className="text-sm text-gray-600">
            You have skipped <Text className="font-bold text-orange-600">{monthlySkippedCount}</Text> meals this month
          </Text>
        </View>

        {/* Bottom Panel Spacer */}
        {selectedDate && <View style={{ height: 350 }} />}
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
          <View className="bg-white rounded-t-3xl shadow-lg">
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Content */}
            <View className="px-5 pb-8">
              {/* Date Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-bold text-gray-900">
                    {formatShortDate(selectedDate)}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Select meal window to skip/unskip
                  </Text>
                </View>
                <TouchableOpacity onPress={closePanel} className="p-2">
                  <Text className="text-xl text-gray-400">✕</Text>
                </TouchableOpacity>
              </View>

              {/* Meal Window Selector */}
              <View className="flex-row space-x-3 mb-4">
                <TouchableOpacity
                  onPress={() => setSelectedMealWindow('LUNCH')}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    selectedMealWindow === 'LUNCH'
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className="text-2xl text-center mb-1">🌞</Text>
                  <Text className={`text-sm font-semibold text-center ${
                    selectedMealWindow === 'LUNCH' ? 'text-orange-700' : 'text-gray-700'
                  }`}>
                    Lunch
                  </Text>
                  {isMealSkipped(subscription, selectedDate, 'LUNCH') && (
                    <Text className="text-xs text-center text-orange-600 mt-1">Skipped</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedMealWindow('DINNER')}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    selectedMealWindow === 'DINNER'
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className="text-2xl text-center mb-1">🌙</Text>
                  <Text className={`text-sm font-semibold text-center ${
                    selectedMealWindow === 'DINNER' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    Dinner
                  </Text>
                  {isMealSkipped(subscription, selectedDate, 'DINNER') && (
                    <Text className="text-xs text-center text-blue-600 mt-1">Skipped</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Reason Input (only if not skipped) */}
              {selectedMealWindow && !isCurrentlySkipped && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Reason (Optional)
                  </Text>
                  <TextInput
                    value={skipReason}
                    onChangeText={setSkipReason}
                    placeholder="e.g., Out of town, Office lunch"
                    maxLength={200}
                    className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 border border-gray-200"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              )}

              {/* Action Button */}
              {selectedMealWindow && (
                <TouchableOpacity
                  onPress={isCurrentlySkipped ? handleUnskipMeal : handleSkipMeal}
                  disabled={isLoading}
                  className={`p-4 rounded-full items-center justify-center ${
                    isCurrentlySkipped ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      {isCurrentlySkipped
                        ? `✓ Unskip ${selectedMealWindow}`
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
