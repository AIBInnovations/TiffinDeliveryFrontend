/**
 * Auto-Order Utilities
 *
 * Helper functions for auto-ordering features including time calculations,
 * meal skip checks, and display formatting.
 */

// Import Subscription type from api.service
// Note: Using a partial type to avoid circular dependencies
interface AutoOrderSubscription {
  autoOrderingEnabled?: boolean;
  defaultMealType?: 'LUNCH' | 'DINNER' | 'BOTH';
  isPaused?: boolean;
  pausedUntil?: string;
  skippedSlots?: Array<{
    date: string;
    mealWindow: 'LUNCH' | 'DINNER';
    reason?: string;
    skippedAt?: string;
  }>;
}

interface TimeWindow {
  startTime: string; // Format: "HH:mm"
  endTime: string;
}

interface OperatingHours {
  lunch?: TimeWindow;
  dinner?: TimeWindow;
  onDemand?: TimeWindow & { isAlwaysOpen: boolean };
}

/**
 * Calculate the next auto-order time based on subscription settings and operating hours
 *
 * @param subscription The subscription with auto-order settings
 * @param operatingHours Kitchen operating hours
 * @returns Date object for next auto-order, or null if not scheduled
 *
 * Note: Auto-orders are placed approximately 1 hour before the meal window starts.
 * Actual auto-order placement times are determined by kitchen-specific operating hours.
 * If operating hours are not provided, falls back to default times:
 * - LUNCH: 10:00 AM (1 hour before default 11:00 AM window)
 * - DINNER: 6:00 PM (1 hour before default 19:00 PM window)
 */
export const getNextAutoOrderTime = (
  subscription: AutoOrderSubscription,
  operatingHours?: OperatingHours
): Date | null => {
  // Return null if auto-ordering is disabled or paused
  if (!subscription.autoOrderingEnabled || subscription.isPaused) {
    return null;
  }

  // Return null if no meal type is set
  if (!subscription.defaultMealType) {
    return null;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Helper to calculate auto-order time (1 hour before window start)
  const calculateAutoOrderTime = (startTime: string): { hour: number; minute: number } => {
    const [hoursStr, minutesStr] = startTime.split(':');
    let hours = parseInt(hoursStr, 10);
    let minutes = parseInt(minutesStr, 10);

    // Subtract 1 hour
    hours -= 1;
    if (hours < 0) {
      hours = 23; // Wrap to previous day
    }

    return { hour: hours, minute: minutes };
  };

  // Get lunch auto-order time
  let lunchAutoOrderHour = 10;
  let lunchAutoOrderMinute = 0;
  if (operatingHours?.lunch?.startTime) {
    const autoOrder = calculateAutoOrderTime(operatingHours.lunch.startTime);
    lunchAutoOrderHour = autoOrder.hour;
    lunchAutoOrderMinute = autoOrder.minute;
  }

  // Get dinner auto-order time
  let dinnerAutoOrderHour = 18;
  let dinnerAutoOrderMinute = 0;
  if (operatingHours?.dinner?.startTime) {
    const autoOrder = calculateAutoOrderTime(operatingHours.dinner.startTime);
    dinnerAutoOrderHour = autoOrder.hour;
    dinnerAutoOrderMinute = autoOrder.minute;
  }

  let nextOrderTime: Date | null = null;

  // Determine next auto-order based on meal type and current time
  if (subscription.defaultMealType === 'LUNCH' || subscription.defaultMealType === 'BOTH') {
    // If before lunch auto-order time today, next order is lunch today
    if (currentHour < lunchAutoOrderHour || (currentHour === lunchAutoOrderHour && currentMinute < lunchAutoOrderMinute)) {
      nextOrderTime = new Date(now);
      nextOrderTime.setHours(lunchAutoOrderHour, lunchAutoOrderMinute, 0, 0);
      return nextOrderTime;
    }
  }

  if (subscription.defaultMealType === 'DINNER' || subscription.defaultMealType === 'BOTH') {
    // If before dinner auto-order time today, next order is dinner today
    if (currentHour < dinnerAutoOrderHour || (currentHour === dinnerAutoOrderHour && currentMinute < dinnerAutoOrderMinute)) {
      nextOrderTime = new Date(now);
      nextOrderTime.setHours(dinnerAutoOrderHour, dinnerAutoOrderMinute, 0, 0);
      return nextOrderTime;
    }
  }

  // If past all today's auto-order times, next order is tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (subscription.defaultMealType === 'LUNCH' || subscription.defaultMealType === 'BOTH') {
    // Next order is lunch tomorrow
    tomorrow.setHours(lunchAutoOrderHour, lunchAutoOrderMinute, 0, 0);
    return tomorrow;
  } else if (subscription.defaultMealType === 'DINNER') {
    // Next order is dinner tomorrow
    tomorrow.setHours(dinnerAutoOrderHour, dinnerAutoOrderMinute, 0, 0);
    return tomorrow;
  }

  return null;
};

/**
 * Format next auto-order time for user-friendly display
 *
 * @param subscription The subscription with auto-order settings
 * @param operatingHours Kitchen operating hours
 * @returns Formatted string like "Today at 10:00 AM" or "Tomorrow at 7:00 PM"
 */
export const formatNextAutoOrderTime = (
  subscription: AutoOrderSubscription,
  operatingHours?: OperatingHours
): string => {
  const nextTime = getNextAutoOrderTime(subscription, operatingHours);

  if (!nextTime) {
    return 'Not scheduled';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextDate = new Date(nextTime.getFullYear(), nextTime.getMonth(), nextTime.getDate());

  // Format time in 12-hour format
  const hours = nextTime.getHours();
  const minutes = nextTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  const timeStr = `${displayHours}:${displayMinutes} ${ampm}`;

  // Determine day label
  if (nextDate.getTime() === today.getTime()) {
    return `Today at ${timeStr}`;
  } else if (nextDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow at ${timeStr}`;
  } else {
    // For dates beyond tomorrow, show date
    const dateStr = nextTime.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr} at ${timeStr}`;
  }
};

/**
 * Check if a specific meal slot is skipped
 *
 * @param subscription The subscription with skipped slots
 * @param date ISO date string (YYYY-MM-DD)
 * @param mealWindow LUNCH or DINNER
 * @returns true if the meal is skipped, false otherwise
 */
export const isMealSkipped = (
  subscription: AutoOrderSubscription,
  date: string,
  mealWindow: 'LUNCH' | 'DINNER'
): boolean => {
  if (!subscription.skippedSlots || subscription.skippedSlots.length === 0) {
    return false;
  }

  // Normalize date to YYYY-MM-DD format for comparison
  const normalizedDate = date.split('T')[0];

  return subscription.skippedSlots.some(
    slot => {
      const slotDate = slot.date.split('T')[0];
      return slotDate === normalizedDate && slot.mealWindow === mealWindow;
    }
  );
};

/**
 * Get count of skipped meals for the current month
 *
 * @param subscription The subscription with skipped slots
 * @returns Number of meals skipped this month
 */
export const getMonthlySkippedCount = (subscription: AutoOrderSubscription): number => {
  if (!subscription.skippedSlots || subscription.skippedSlots.length === 0) {
    return 0;
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return subscription.skippedSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate.getMonth() === currentMonth && slotDate.getFullYear() === currentYear;
  }).length;
};

/**
 * Get a human-readable description of auto-order status
 *
 * @param subscription The subscription with auto-order settings
 * @returns Status string like "Active - Both meals" or "Paused until Jan 25"
 */
export const getAutoOrderStatusText = (subscription: AutoOrderSubscription): string => {
  if (!subscription.autoOrderingEnabled) {
    return 'Disabled';
  }

  if (subscription.isPaused) {
    if (subscription.pausedUntil) {
      const pauseDate = new Date(subscription.pausedUntil);
      const dateStr = pauseDate.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      return `Paused until ${dateStr}`;
    }
    return 'Paused';
  }

  // Active status with meal type
  const mealTypeText = subscription.defaultMealType === 'BOTH'
    ? 'Both meals'
    : subscription.defaultMealType === 'LUNCH'
    ? 'Lunch only'
    : 'Dinner only';

  return `Active - ${mealTypeText}`;
};

/**
 * Format a date string to user-friendly format
 *
 * @param dateString ISO date string
 * @returns Formatted date like "Jan 25, 2025"
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a date string to short format
 *
 * @param dateString ISO date string
 * @returns Formatted date like "Jan 25"
 */
export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get the meal type emoji
 *
 * @param mealWindow LUNCH or DINNER
 * @returns Emoji representing the meal
 */
export const getMealEmoji = (mealWindow: 'LUNCH' | 'DINNER'): string => {
  return mealWindow === 'LUNCH' ? '🌞' : '🌙';
};

/**
 * Check if a date is in the past
 *
 * @param dateString ISO date string
 * @returns true if date is before today, false otherwise
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Validate if auto-ordering can be enabled
 *
 * @param hasAddress Whether user has a default address
 * @param hasMealType Whether a meal type is selected
 * @returns Object with isValid and error message
 */
export const validateAutoOrderEnable = (
  hasAddress: boolean,
  hasMealType: boolean
): { isValid: boolean; error?: string } => {
  if (!hasAddress) {
    return {
      isValid: false,
      error: 'Please add a delivery address before enabling auto-ordering.',
    };
  }

  if (!hasMealType) {
    return {
      isValid: false,
      error: 'Please select at least one meal type (Lunch or Dinner).',
    };
  }

  return { isValid: true };
};
